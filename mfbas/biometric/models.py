"""
MFBAS – Biometric Enrollment Model
Stores AES-256-GCM encrypted face embedding + bcrypt PIN hash per user.
"""
import uuid
from django.db import models


class BiometricEnrollment(models.Model):
    """One record per enrolled user."""
    user_id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username       = models.CharField(max_length=64, unique=True)
    # AES-256-GCM encrypted 128-dim FaceNet embedding (base64 stored)
    embedding_enc  = models.TextField(help_text="Base64(nonce || ciphertext) of 128-dim embedding")
    # bcrypt hash of 6-digit PIN
    pin_hash       = models.CharField(max_length=64)
    enrolled_at    = models.DateTimeField(auto_now_add=True)
    last_auth_at   = models.DateTimeField(null=True, blank=True)
    fail_count     = models.SmallIntegerField(default=0)
    lockout_until  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "biometric_enrollment"

    def __str__(self):
        return f"<Enrollment: {self.username}>"


class AuthAuditLog(models.Model):
    """Immutable audit trail of every authentication attempt."""
    RESULT_CHOICES = [("SUCCESS", "Success"), ("FAIL_FACE", "Face Gate Failed"),
                      ("FAIL_PIN", "PIN Gate Failed"), ("FAIL_LIVENESS", "Liveness Failed"),
                      ("FAIL_LOCKOUT", "Account Locked")]

    enrollment    = models.ForeignKey(BiometricEnrollment, on_delete=models.CASCADE, related_name="audit_logs")
    result        = models.CharField(max_length=20, choices=RESULT_CHOICES)
    similarity    = models.FloatField(null=True, blank=True, help_text="Cosine similarity score")
    attempted_at  = models.DateTimeField(auto_now_add=True)
    ip_address    = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = "auth_audit_log"
        ordering = ["-attempted_at"]
