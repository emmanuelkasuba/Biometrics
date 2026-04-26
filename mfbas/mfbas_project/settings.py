"""
MFBAS – Multi-Factor Biometric Authentication System
SEC2201 Group 10 | Django Settings
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-in-production")
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "biometric",
]

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "mfbas_project.urls"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
}

# Biometric thresholds
FACE_SIMILARITY_THRESHOLD = 0.82   # Cosine similarity gate
MAX_FAIL_ATTEMPTS = 3               # Lockout after N failures
LOCKOUT_DURATIONS = [30, 300, 1800] # Seconds: 30s, 5min, 30min

USE_TZ = True
TIME_ZONE = 'UTC'

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
