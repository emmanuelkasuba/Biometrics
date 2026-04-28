"""
MFBAS – API Views
POST /api/biometric/enroll/       → Enroll a new user (face required; fingerprint optional)
POST /api/biometric/authenticate/ → Two-factor auth: Face+PIN  or  Fingerprint+PIN
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
    extract_fingerprint_template, encrypt_fingerprint, decrypt_fingerprint, match_fingerprint,
)
from .models import AuthAuditLog, BiometricEnrollment
from .serializers import AuthSerializer, EnrollSerializer, StatusSerializer
from django.conf import settings

logger = logging.getLogger(__name__)

THRESHOLD = getattr(settings, "FACE_SIMILARITY_THRESHOLD", 0.82)


def _flat_errors(errors: dict) -> str:
    parts = []
    for field, messages in errors.items():
        if isinstance(messages, list):
            parts.append(f"{field}: {'; '.join(str(m) for m in messages)}")
        else:
            parts.append(f"{field}: {messages}")
    return " | ".join(parts)


def _decode_b64_image(b64_str: str) -> bytes:
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    return base64.b64decode(b64_str)


class EnrollView(APIView):
    """
    POST /api/biometric/enroll/
    Body: { username, pin, images_b64: [...], fingerprint_enabled?, fingerprint_b64? }

    Face images are always required.  Fingerprint fields are optional:
    - fingerprint_enabled: true  → marks the account as fingerprint-capable
    - fingerprint_b64: "<data>"  → stores an encrypted template (for future SDK matching)
    """

    def post(self, request):
        ser = EnrollSerializer(data=request.data)
        if not ser.is_valid():
            return Response({"error": _flat_errors(ser.errors)}, status=status.HTTP_400_BAD_REQUEST)

        username            = ser.validated_data["username"]
        pin                 = ser.validated_data["pin"]
        images_b64          = ser.validated_data["images_b64"]
        fingerprint_enabled = ser.validated_data.get("fingerprint_enabled", False)
        fingerprint_b64_raw = ser.validated_data.get("fingerprint_b64")

        if BiometricEnrollment.objects.filter(username=username).exists():
            return Response({"error": f"User '{username}' is already enrolled."},
                            status=status.HTTP_409_CONFLICT)

        # ── Face embeddings ───────────────────────────────────────────────────
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

        template     = mean_embedding(embeddings) if len(embeddings) > 1 else embeddings[0]
        enc_template = encrypt_embedding(template)
        pin_hash     = hash_pin(pin)

        # ── Fingerprint template (optional) ───────────────────────────────────
        enc_fingerprint = None
        if fingerprint_enabled and fingerprint_b64_raw:
            try:
                raw_fp_bytes = _decode_b64_image(fingerprint_b64_raw)
                fp_template  = extract_fingerprint_template(raw_fp_bytes)
                enc_fingerprint = encrypt_fingerprint(fp_template)
            except Exception as e:
                logger.exception("Fingerprint template processing failed")
                return Response({"error": f"Fingerprint processing failed — {str(e)}"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        enrollment = BiometricEnrollment.objects.create(
            username            = username,
            embedding_enc       = enc_template,
            pin_hash            = pin_hash,
            fingerprint_enabled = fingerprint_enabled,
            fingerprint_enc     = enc_fingerprint,
        )

        return Response({
            "status":               "enrolled",
            "user_id":              str(enrollment.user_id),
            "username":             username,
            "samples":              len(embeddings),
            "fingerprint_enabled":  fingerprint_enabled,
        }, status=status.HTTP_201_CREATED)


class AuthenticateView(APIView):
    """
    POST /api/biometric/authenticate/
    Supports two paths — chosen automatically from the request payload:

      Face + PIN path (existing):
        Body: { username, pin, image_b64 }

      Fingerprint + PIN path (new):
        Body: { username, pin, fingerprint_confirmed: true }
        Requires fingerprint_enabled on the enrollment record.
        Device-level biometric matching is trusted; backend enforces the flag + PIN gate.
    """

    def post(self, request):
        ser = AuthSerializer(data=request.data)
        if not ser.is_valid():
            return Response({"error": _flat_errors(ser.errors)}, status=status.HTTP_400_BAD_REQUEST)

        username              = ser.validated_data["username"]
        pin                   = ser.validated_data["pin"]
        image_b64             = ser.validated_data.get("image_b64")
        fingerprint_confirmed = ser.validated_data.get("fingerprint_confirmed", False)

        try:
            enrollment = BiometricEnrollment.objects.get(username=username)
        except BiometricEnrollment.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if is_locked_out(enrollment):
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_LOCKOUT")
            return Response({
                "authenticated": False,
                "reason":        "Account locked. Try again later.",
                "lockout_until": enrollment.lockout_until.isoformat(),
            }, status=status.HTTP_403_FORBIDDEN)

        # ── Route to the correct biometric gate ───────────────────────────────
        use_fingerprint = fingerprint_confirmed and enrollment.fingerprint_enabled

        if use_fingerprint:
            return self._fingerprint_auth(request, enrollment, pin)
        else:
            return self._face_auth(request, enrollment, pin, image_b64)

    # ── Gate: Fingerprint + PIN ───────────────────────────────────────────────

    def _fingerprint_auth(self, request, enrollment, pin):
        """
        Device confirmed the fingerprint; we trust that signal and enforce PIN.
        Gate 1 passes by virtue of fingerprint_confirmed=true + fingerprint_enabled flag.
        Gate 2: PIN verification.
        """
        if not verify_pin(pin, enrollment.pin_hash):
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_PIN")
            apply_lockout(enrollment)
            return Response({"authenticated": False, "reason": "Incorrect PIN."},
                            status=status.HTTP_401_UNAUTHORIZED)

        reset_lockout(enrollment)
        AuthAuditLog.objects.create(enrollment=enrollment, result="SUCCESS_FINGERPRINT")

        return Response({
            "authenticated": True,
            "user_id":       str(enrollment.user_id),
            "username":      enrollment.username,
            "biometric":     "fingerprint",
            "message":       "Authentication successful. Session granted.",
        }, status=status.HTTP_200_OK)

    # ── Gate: Face + PIN ──────────────────────────────────────────────────────

    def _face_auth(self, request, enrollment, pin, image_b64):
        if not image_b64:
            return Response(
                {"error": "image_b64 is required for face authentication."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            img_bytes  = _decode_b64_image(image_b64)
            live_emb   = extract_embedding(img_bytes)
            stored_emb = decrypt_embedding(enrollment.embedding_enc)
            similarity = cosine_similarity(live_emb, stored_emb)
        except ValueError as e:
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_FACE", similarity=None)
            apply_lockout(enrollment)
            return Response({"authenticated": False, "reason": f"Face gate: {str(e)}"},
                            status=status.HTTP_401_UNAUTHORIZED)

        if similarity < THRESHOLD:
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_FACE",
                                        similarity=round(similarity, 4))
            apply_lockout(enrollment)
            return Response({
                "authenticated": False,
                "reason":        "Face not recognised.",
                "similarity":    round(similarity, 4),
                "threshold":     THRESHOLD,
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not verify_pin(pin, enrollment.pin_hash):
            AuthAuditLog.objects.create(enrollment=enrollment, result="FAIL_PIN",
                                        similarity=round(similarity, 4))
            apply_lockout(enrollment)
            return Response({"authenticated": False, "reason": "Incorrect PIN."},
                            status=status.HTTP_401_UNAUTHORIZED)

        reset_lockout(enrollment)
        AuthAuditLog.objects.create(enrollment=enrollment, result="SUCCESS",
                                    similarity=round(similarity, 4))

        return Response({
            "authenticated": True,
            "user_id":       str(enrollment.user_id),
            "username":      enrollment.username,
            "biometric":     "face",
            "similarity":    round(similarity, 4),
            "message":       "Authentication successful. Session granted.",
        }, status=status.HTTP_200_OK)


class StatusView(APIView):
    """
    GET /api/biometric/status/<username>/
    Returns enrollment status, fingerprint capability, and recent audit log.
    """

    def get(self, request, username):
        try:
            enrollment = BiometricEnrollment.objects.get(username=username)
        except BiometricEnrollment.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        logs = AuthAuditLog.objects.filter(enrollment=enrollment)[:10]
        return Response({
            "user_id":             str(enrollment.user_id),
            "username":            enrollment.username,
            "enrolled_at":         enrollment.enrolled_at.isoformat(),
            "last_auth_at":        enrollment.last_auth_at.isoformat() if enrollment.last_auth_at else None,
            "fail_count":          enrollment.fail_count,
            "locked":              is_locked_out(enrollment),
            "lockout_until":       enrollment.lockout_until.isoformat() if enrollment.lockout_until else None,
            "fingerprint_enabled": enrollment.fingerprint_enabled,
            "recent_logs": [
                {"result": l.result, "similarity": l.similarity, "at": l.attempted_at.isoformat()}
                for l in logs
            ],
        })
