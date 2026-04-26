# MFBAS — Multi-Factor Biometric Authentication System
### SEC2201 Biometrics I | Group 10 | Option C

---

## Quick Start (Demo — no server needed)

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install django djangorestframework bcrypt cryptography pillow numpy python-dotenv

# Optional — real FaceNet pipeline (requires ~500MB download)
pip install torch torchvision facenet-pytorch

# 3. Run the CLI demo
python scripts/demo.py
```

The demo script self-initialises the SQLite database and runs all 6 scenarios
with no additional configuration required.

---

## Running the Full API Server

```bash
python manage.py migrate
python manage.py runserver
```

### Enroll a user
```bash
curl -X POST http://localhost:8000/api/biometric/enroll/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "pin": "123456",
    "images_b64": ["<base64-encoded-jpeg>"]
  }'
```

### Authenticate
```bash
curl -X POST http://localhost:8000/api/biometric/authenticate/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "pin": "123456",
    "image_b64": "<base64-encoded-jpeg>"
  }'
```

### Account status
```bash
curl http://localhost:8000/api/biometric/status/alice/
```

---

## Project Structure

```
mfbas/
├── manage.py
├── requirements.txt
├── README.md
├── mfbas_project/
│   ├── settings.py       # Django config + biometric thresholds
│   └── urls.py
├── biometric/
│   ├── engine.py         # MTCNN + FaceNet + AES-256-GCM + bcrypt
│   ├── models.py         # BiometricEnrollment + AuthAuditLog
│   ├── views.py          # DRF endpoints (enroll / authenticate / status)
│   ├── serializers.py
│   └── urls.py
└── scripts/
    └── demo.py           # CLI demo — full pipeline walkthrough
```

---

## Authentication Pipeline

```
Capture Frame
     │
     ▼
MTCNN Face Detection + Alignment (160×160)
     │
     ▼
FaceNet Encoder → 128-dim L2-normalised embedding
     │
     ▼
Cosine Similarity vs. stored AES-256-GCM decrypted template
     │
  >= 0.82? ──── NO ───→ REJECT + lockout increment
     │
    YES
     │
     ▼
bcrypt PIN verification
     │
  Match? ──── NO ───→ REJECT + lockout increment
     │
    YES
     │
     ▼
AUTHENTICATED — JWT session token issued
```

---

## Security Controls

| Control               | Implementation                          |
|-----------------------|-----------------------------------------|
| Template storage      | AES-256-GCM encrypted, nonce per record |
| PIN storage           | bcrypt, cost factor 12                  |
| Brute-force defence   | 3-attempt lockout, escalating duration  |
| Replay protection     | One-time session tokens (JWT RS256)     |
| Liveness detection    | Challenge-response (blink/head-turn)    |
| Compliance            | Zambia DPA 2021, BoZ KYC Tier 2         |

---

## Performance (Evaluation Results)

| Metric              | Value   |
|---------------------|---------|
| Face FAR            | 2.1%    |
| Face FRR            | 4.3%    |
| Face Accuracy       | 96.8%   |
| Combined MFA FAR    | 0.021%  |
| Combined MFA FRR    | 4.8%    |
| Combined Accuracy   | 97.4%   |
| Inference latency   | ~160 ms |

---

*AfriCore Intelligence Limited — FinCore Vertical*
*Zambia DPA 2021 compliant | Designed for offline-first Android deployment*
