from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="BiometricEnrollment",
            fields=[
                ("user_id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("username", models.CharField(max_length=64, unique=True)),
                ("embedding_enc", models.TextField(help_text="Base64(nonce || ciphertext) of 128-dim embedding")),
                ("pin_hash", models.CharField(max_length=64)),
                ("enrolled_at", models.DateTimeField(auto_now_add=True)),
                ("last_auth_at", models.DateTimeField(blank=True, null=True)),
                ("fail_count", models.SmallIntegerField(default=0)),
                ("lockout_until", models.DateTimeField(blank=True, null=True)),
            ],
            options={"db_table": "biometric_enrollment"},
        ),
        migrations.CreateModel(
            name="AuthAuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enrollment", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="audit_logs",
                    to="biometric.biometricenrollment",
                )),
                ("result", models.CharField(
                    choices=[
                        ("SUCCESS", "Success"),
                        ("FAIL_FACE", "Face Gate Failed"),
                        ("FAIL_PIN", "PIN Gate Failed"),
                        ("FAIL_LIVENESS", "Liveness Failed"),
                        ("FAIL_LOCKOUT", "Account Locked"),
                    ],
                    max_length=20,
                )),
                ("similarity", models.FloatField(blank=True, null=True, help_text="Cosine similarity score")),
                ("attempted_at", models.DateTimeField(auto_now_add=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
            ],
            options={"db_table": "auth_audit_log", "ordering": ["-attempted_at"]},
        ),
    ]
