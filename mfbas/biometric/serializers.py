from rest_framework import serializers


class EnrollSerializer(serializers.Serializer):
    username    = serializers.CharField(max_length=64)
    pin         = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "PIN must be exactly 6 digits."})
    images_b64  = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        max_length=5,
        help_text="List of base64-encoded face images (1–5 samples)",
    )
    # Fingerprint extension — both optional, default to disabled / no data
    fingerprint_enabled = serializers.BooleanField(default=False, required=False)
    fingerprint_b64     = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None,
                                                help_text="Base64-encoded raw fingerprint scan (placeholder for SDK integration)")


class AuthSerializer(serializers.Serializer):
    username  = serializers.CharField(max_length=64)
    pin       = serializers.RegexField(r"^\d{6}$")
    # Face path — optional when fingerprint_confirmed is used
    image_b64 = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None,
                                      help_text="Base64-encoded live face image (required for face auth path)")
    # Fingerprint path — device confirms biometric, backend verifies flag + PIN
    fingerprint_confirmed = serializers.BooleanField(required=False, default=False,
                                                     help_text="True when device-level biometric prompt succeeded")

    def validate(self, data):
        has_face        = bool(data.get("image_b64"))
        has_fingerprint = bool(data.get("fingerprint_confirmed"))
        if not has_face and not has_fingerprint:
            raise serializers.ValidationError(
                "Provide either image_b64 (face auth) or fingerprint_confirmed: true (fingerprint auth)."
            )
        return data


class StatusSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=64)
