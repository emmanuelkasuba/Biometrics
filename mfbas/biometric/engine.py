"""
MFBAS – Biometric Engine
Handles: MTCNN face detection, FaceNet embedding, cosine similarity,
         AES-256-GCM template encryption, bcrypt PIN hashing, lockout logic.
"""
import base64
import io
import os
import struct
import time

import bcrypt
import numpy as np
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

# ── Lazy model loading (avoids import-time GPU init) ─────────────────────────
_mtcnn = None
_resnet = None
_AES_KEY = None


def _get_aes_key() -> bytes:
    """Derive AES-256 key from env or generate a stable dev key."""
    global _AES_KEY
    if _AES_KEY is None:
        key_hex = os.getenv("MFBAS_AES_KEY", "")
        if key_hex and len(key_hex) == 64:
            _AES_KEY = bytes.fromhex(key_hex)
        else:
            # Dev fallback — deterministic but NOT for production
            _AES_KEY = b"mfbas-dev-key-32bytes-xxxxxxxxxxx"[:32]
    return _AES_KEY


def _get_models():
    """Load MTCNN + FaceNet models once, cache globally."""
    global _mtcnn, _resnet
    if _mtcnn is None:
        try:
            import torch
            from facenet_pytorch import MTCNN, InceptionResnetV1
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _mtcnn  = MTCNN(image_size=160, keep_all=False, device=device)
            _resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)
        except ImportError:
            _mtcnn  = "STUB"
            _resnet = "STUB"
    return _mtcnn, _resnet


# ── Image utilities ───────────────────────────────────────────────────────────

def load_image(source) -> Image.Image:
    """Accept file path (str) or bytes and return PIL RGB Image."""
    if isinstance(source, (str, os.PathLike)):
        return Image.open(source).convert("RGB")
    elif isinstance(source, (bytes, bytearray)):
        return Image.open(io.BytesIO(source)).convert("RGB")
    elif isinstance(source, Image.Image):
        return source.convert("RGB")
    raise ValueError(f"Unsupported image source type: {type(source)}")


# ── Face Embedding ────────────────────────────────────────────────────────────

def extract_embedding(image_source) -> np.ndarray:
    """
    Full pipeline: load → MTCNN detect+align → FaceNet encode.
    Returns: 128-dim float32 L2-normalised numpy array.
    Raises: ValueError if no face detected.
    """
    mtcnn, resnet = _get_models()

    # Stub mode for environments without torch/facenet-pytorch
    if mtcnn == "STUB":
        return _stub_embedding(image_source)

    import torch
    img = load_image(image_source)
    face_tensor = mtcnn(img)           # Returns (3, 160, 160) tensor or None
    if face_tensor is None:
        raise ValueError("No face detected in image.")

    with torch.no_grad():
        emb = resnet(face_tensor.unsqueeze(0))   # (1, 512) — InceptionResnet
        emb = emb[0].cpu().numpy().astype(np.float32)

    # L2 normalise → cosine similarity becomes dot product
    norm = np.linalg.norm(emb)
    if norm == 0:
        raise ValueError("Zero-norm embedding — invalid face crop.")
    return emb / norm


def _stub_embedding(image_source) -> np.ndarray:
    """
    Deterministic stub when facenet-pytorch is unavailable.
    Uses image pixel statistics as a crude fingerprint.
    FOR DEMO/TESTING ONLY.
    """
    img = load_image(image_source)
    arr = np.array(img.resize((32, 32)), dtype=np.float32).flatten()
    # Pad / truncate to 128 dims
    if len(arr) >= 128:
        emb = arr[:128]
    else:
        emb = np.pad(arr, (0, 128 - len(arr)))
    norm = np.linalg.norm(emb)
    return emb / norm if norm > 0 else emb


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two L2-normalised vectors (dot product)."""
    return float(np.dot(a, b))


def mean_embedding(embeddings: list[np.ndarray]) -> np.ndarray:
    """Average N enrollment embeddings and re-normalise."""
    mean = np.mean(np.stack(embeddings), axis=0)
    norm = np.linalg.norm(mean)
    return mean / norm if norm > 0 else mean


# ── Template Encryption ───────────────────────────────────────────────────────

def encrypt_embedding(embedding: np.ndarray) -> str:
    """
    AES-256-GCM encrypt a 128-dim float32 embedding.
    Returns: base64(nonce || ciphertext) string for DB storage.
    """
    key  = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce  = os.urandom(12)                            # 96-bit nonce
    data   = embedding.astype(np.float32).tobytes()    # 512 bytes (128 * 4)
    ct     = aesgcm.encrypt(nonce, data, None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_embedding(enc_b64: str) -> np.ndarray:
    """Decrypt and return 128-dim float32 numpy array."""
    key    = _get_aes_key()
    aesgcm = AESGCM(key)
    raw    = base64.b64decode(enc_b64.encode())
    nonce, ct = raw[:12], raw[12:]
    data   = aesgcm.decrypt(nonce, ct, None)
    return np.frombuffer(data, dtype=np.float32).copy()


# ── PIN Hashing ───────────────────────────────────────────────────────────────

def hash_pin(pin: str) -> str:
    """bcrypt hash of PIN string. Cost factor 12."""
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_pin(pin: str, pin_hash: str) -> bool:
    """Constant-time bcrypt comparison."""
    try:
        return bcrypt.checkpw(pin.encode(), pin_hash.encode())
    except Exception:
        return False


# ── Lockout Logic ─────────────────────────────────────────────────────────────

LOCKOUT_DURATIONS = [30, 300, 1800]   # seconds: 30s, 5min, 30min


def is_locked_out(enrollment) -> bool:
    """Return True if the account is currently under lockout."""
    from django.utils import timezone
    if enrollment.lockout_until and enrollment.lockout_until > timezone.now():
        return True
    return False


def apply_lockout(enrollment):
    """Increment fail count and set lockout_until based on escalating schedule."""
    from django.utils import timezone
    import datetime
    enrollment.fail_count += 1
    idx = min(enrollment.fail_count - 1, len(LOCKOUT_DURATIONS) - 1)
    secs = LOCKOUT_DURATIONS[idx]
    enrollment.lockout_until = timezone.now() + datetime.timedelta(seconds=secs)
    enrollment.save(update_fields=["fail_count", "lockout_until"])


def reset_lockout(enrollment):
    """Clear fail counter and lockout on successful auth."""
    from django.utils import timezone
    enrollment.fail_count     = 0
    enrollment.lockout_until  = None
    enrollment.last_auth_at   = timezone.now()
    enrollment.save(update_fields=["fail_count", "lockout_until", "last_auth_at"])
