from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("biometric", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="biometricenrollment",
            name="fingerprint_enc",
            field=models.TextField(
                blank=True,
                null=True,
                help_text="Base64(nonce || ciphertext) of fingerprint template",
            ),
        ),
        migrations.AddField(
            model_name="biometricenrollment",
            name="fingerprint_enabled",
            field=models.BooleanField(default=False),
        ),
    ]
