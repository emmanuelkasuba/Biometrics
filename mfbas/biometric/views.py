"""
MFBAS – API Views
POST /api/biometric/enroll/      → Enroll a new user
POST /api/biometric/authenticate/ → Two-factor authentication
GET  /api/biometric/status/<username>/ → Account status
"""
import base64
import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .engine import (
    apply_lockout, cosine_similarity, decrypt_embedding, encrypt_embedding,
    extract_embedding, hash_pin, is_locked_out, mean_embedding,
    reset_lockout, verify_pin,
)
from .models import AuthAuditLog, BiometricEnrollment
from .serializers import AuthSerializer, EnrollSerializer, StatusSerializer
from django.conf import settings

logger = logging.getLogger(__name__)

THRESHOLD = getattr(settings, "FACE_SIMILARITY_THRESHOLD", 0.82)


def _flat_errors(errors: dict) -> str:
    """Flatten DRF nested error dict into a single readable string."""
    parts = []
    for field, messages in errors.items():
        if isinstance(messages, list):
            parts.append(f"{field}: {'; '.join(str(m) for m in messages)}")
        else:
            parts.append(f"{field}: {messages}")
    return " | ".join(parts)


def _decode_b64_image(b64_str: str) -> bytes:
    """Strip optional data URI prefix and decode base64 to bytes."""
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    return base64.b64decode(b64_str)


class EnrollView(APIView):
    """
    POST /api/biometric/enroll/
    Body: { username, pin, images_b64: [...] }
    Extracts embeddings from 1–5 face images, averages them,
    encrypts the template, and stores alongside bcrypt PIN hash.
    """

    def post(self, request):
        ser = EnrollSerializer(data=request.data)
        if not ser.is_valid():
            return Response({"error": _flat_errors(ser.errors)}, status=status.HTTP_400_BAD_REQUEST)

        username   = ser.validated_data["username"]
        pin        = ser.validated_data["pin"]
        images_b64 = ser.validated_data["images_b64"]

        # Reject duplicate usernames
        if BiometricEnrollment.objects.filter(username=username).exists():
            return Response({"error": f"User '{username}' is already enrolled."},
                            status=status.HTTP_409_CONFLICT)

        # Extract embeddings from each submitted image
        embeddings = []
        for i, img_b64 in enumerate(images_b64):
            try:
                img_bytes = _decode_b64_image(img_b64)
                emb = extract_embedding(img_bytes)
                embeddings.append(emb)
            except ValueError as e:
                return Response({"error": f"Image {i+1}: {str(e)}"},
                                status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as e:
                logger.exception("Embedding extraction failed for image %d", i+1)
                return Response({"error": f"Image {i+1}: processing failed — {str(e)}"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Average embeddings → single enrollment template
        template = mean_embedding(embeddings) if len(embeddings) > 1 else embeddings[0]

        # Encrypt template + hash PIN
        enc_template = encrypt_embedding(template)
        pin_hash     = hash_pin(pin)

        enrollment = BiometricEnrollment.objects.create(
            username      = username,
            embedding_enc = enc_template,
            pin_hash      = pin_hash,
        )

        return Response({
            "status":   "enrolled",
            "user_id":  str(enrollment.user_id),
            "username": username,
            "samples":  len(embeddings),
        }, status=status.HTTP_201_CREATED)


class AuthenticateView(APIView):
    """
    POST /api/biometric/authenticate/
    Body: { username, pin, image_b64 }
    Two-gate pipeline: liveness (stub) → face embedding → PIN.
    """

    def post(self, request):
        ser = AuthSerializer(data=request.data)
        if not ser.is_valid():
            return Response({"error": _flat_errors(ser.errors)}, status=status.HTTP_400_BAD_REQUEST)

        username  = ser.validated_data["username"]
        pin       = ser.validated_data["pin"]
        image_b64 = ser.validated_data["image_b64"]

        # Fetch enrollment record
        try:
            enrollment = BiometricEnrollment.objects.get(username=username)
        except BiometricEnrollment.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Lockout check
        if is_locked_out(enrollment):
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_LOCKOUT")
            return Response({
                "authenticated": False,
                "reason":        "Account locked. Try again later.",
                "lockout_until": enrollment.lockout_until.isoformat(),
            }, status=status.HTTP_403_FORBIDDEN)

        # ── GATE 1: Face Recognition ──────────────────────────────────────────
        try:
            img_bytes     = _decode_b64_image(image_b64)
            live_emb      = extract_embedding(img_bytes)
            stored_emb    = decrypt_embedding(enrollment.embedding_enc)
            similarity    = cosine_similarity(live_emb, stored_emb)
        except ValueError as e:
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_FACE", similarity=None)
            apply_lockout(enrollment)
            return Response({"authenticated": False, "reason": f"Face gate: {str(e)}"},
                            status=status.HTTP_401_UNAUTHORIZED)

        if similarity < THRESHOLD:
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_FACE", similarity=round(similarity, 4))
            apply_lockout(enrollment)
            return Response({
                "authenticated": False,
                "reason":        "Face not recognised.",
                "similarity":    round(similarity, 4),
                "threshold":     THRESHOLD,
            }, status=status.HTTP_401_UNAUTHORIZED)

        # ── GATE 2: PIN Verification ──────────────────────────────────────────
        if not verify_pin(pin, enrollment.pin_hash):
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_PIN", similarity=round(similarity, 4))
            apply_lockout(enrollment)
            return Response({"authenticated": False, "reason": "Incorrect PIN."},
                            status=status.HTTP_401_UNAUTHORIZED)

        # ── SUCCESS ───────────────────────────────────────────────────────────
        reset_lockout(enrollment)
        AuthAuditLog.objects.create(enrollment=enrollment, result="SUCCESS", similarity=round(similarity, 4))

        return Response({
            "authenticated": True,
            "user_id":       str(enrollment.user_id),
            "username":      username,
            "similarity":    round(similarity, 4),
            "message":       "Authentication successful. Session granted.",
        }, status=status.HTTP_200_OK)


class StatusView(APIView):
    """
    GET /api/biometric/status/<username>/
    Returns enrollment status and recent audit log.
    """

    def get(self, request, username):
        try:
            enrollment = BiometricEnrollment.objects.get(username=username)
        except BiometricEnrollment.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        logs = AuthAuditLog.objects.filter(enrollment=enrollment)[:10]
        return Response({
            "user_id":      str(enrollment.user_id),
            "username":     enrollment.username,
            "enrolled_at":  enrollment.enrolled_at.isoformat(),
            "last_auth_at": enrollment.last_auth_at.isoformat() if enrollment.last_auth_at else None,
            "fail_count":   enrollment.fail_count,
            "locked":       is_locked_out(enrollment),
            "lockout_until":enrollment.lockout_until.isoformat() if enrollment.lockout_until else None,
            "recent_logs":  [
                {"result": l.result, "similarity": l.similarity, "at": l.attempted_at.isoformat()}
                for l in logs
            ]
        })
