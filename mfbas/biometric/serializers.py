from rest_framework import serializers


class EnrollSerializer(serializers.Serializer):
    username   = serializers.CharField(max_length=64)
    pin        = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "PIN must be exactly 6 digits."})
    # Base64-encoded JPEG/PNG face images (1–5 samples)
    images_b64 = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        max_length=5,
        help_text="List of base64-encoded face images (1–5 samples)"
    )


class AuthSerializer(serializers.Serializer):
    username  = serializers.CharField(max_length=64)
    pin       = serializers.RegexField(r"^\d{6}$")
    image_b64 = serializers.CharField(help_text="Base64-encoded face image for live authentication")


class StatusSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=64)
