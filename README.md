# MFBAS — Multi-Factor Biometric Authentication System
**SEC2201 – Biometrics I  |  Group 10  |  AfriCore Intelligence Limited — FinCore Vertical**
Document ref: MFBAS-DG-001  •  Version 1.0  •  April 2025

---

## 1. Project Overview

MFBAS is a two-factor biometric authentication system combining **face recognition** (FaceNet deep embedding) and **PIN verification** (bcrypt). It is built as a client–server application:

- **Backend** — Django REST Framework (Python), runs on port 8000
- **Frontend** — React Native (Expo), targets Android/iOS

The system is compliant with the **Zambia Data Protection Act 2021**: biometric templates are encrypted at rest (AES-256-GCM), PINs are never stored in plaintext (bcrypt cost-12), and every authentication attempt is immutably logged.

---

## 2. Repository Structure

```
Biometrics/
├── App.js                          # React Native root navigation
├── package.json                    # Frontend dependencies
├── src/
│   ├── api/
│   │   └── mfbasApi.js            # Fetch wrapper — all 3 API calls
│   ├── screens/
│   │   ├── HomeScreen.js          # Landing — selects operation
│   │   ├── EnrollScreen.js        # POST /api/biometric/enroll/
│   │   ├── AuthenticateScreen.js  # POST /api/biometric/authenticate/
│   │   ├── StatusScreen.js        # GET  /api/biometric/status/<username>/
│   │   └── ResultScreen.js        # Displays API response
│   ├── components/
│   │   ├── CameraCapture.js       # expo-camera modal with face guide oval
│   │   └── PinInput.js            # 6-digit masked PIN entry
│   └── theme.js                   # Color palette, typography, shadows
└── mfbas/                         # Django backend
    ├── manage.py
    ├── requirements.txt
    ├── mfbas_project/
    │   ├── settings.py            # Django config + biometric thresholds
    │   └── urls.py                # Root URL conf
    └── biometric/
        ├── models.py              # BiometricEnrollment, AuthAuditLog
        ├── views.py               # EnrollView, AuthenticateView, StatusView
        ├── serializers.py         # DRF request validation
        ├── engine.py              # FaceNet, AES-GCM, bcrypt, lockout
        └── urls.py                # /enroll/ /authenticate/ /status/<u>/
```

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile UI | React Native 0.81.5 + Expo SDK 54 |
| Navigation | React Navigation 6 (native-stack) |
| Camera | expo-camera + expo-image-manipulator |
| HTTP client | Native `fetch` API |
| Backend framework | Django 4.2.13 + Django REST Framework 3.15.1 |
| Face detection | MTCNN (facenet-pytorch 2.5.3) |
| Face embedding | InceptionResnetV1 pretrained on VGGFace2 → 512-dim → 128-dim L2-normalised |
| Template encryption | AES-256-GCM (cryptography 42.0.5), random 96-bit nonce per record |
| PIN hashing | bcrypt cost-factor 12 |
| Database | SQLite3 (dev) / PostgreSQL-ready (psycopg2-binary) |

---

## 4. API Reference

**Base URL:** `http://10.0.2.2:8000` (Android emulator) — change to server IP for physical device.

---

### 4.1  POST `/api/biometric/enroll/`

Registers a new user. Accepts 1–5 face images, averages their FaceNet embeddings into a single encrypted template, and stores a bcrypt PIN hash.

**Request body (JSON):**
```json
{
  "username":   "alice",
  "pin":        "123456",
  "images_b64": [
    "<base64-jpeg-1>",
    "<base64-jpeg-2>",
    "<base64-jpeg-3>"
  ]
}
```

**Success — 201 Created:**
```json
{
  "status":   "enrolled",
  "user_id":  "e0a95d28-0e51-45b7-9da4-58ee717d2291",
  "username": "alice",
  "samples":  3
}
```

**Error responses:**

| HTTP | Condition | Response field |
|------|-----------|---------------|
| 400 | Missing / invalid fields | `error: "field: message"` |
| 409 | Username already enrolled | `error: "User 'alice' is already enrolled."` |
| 422 | No face detected in image N | `error: "Image N: No face detected in image."` |
| 500 | Internal processing failure | `error: "Image N: processing failed — …"` |

---

### 4.2  POST `/api/biometric/authenticate/`

Two-gate authentication: **Gate 1 — Face** (cosine similarity ≥ 0.82) then **Gate 2 — PIN** (bcrypt constant-time). Both gates must pass. Failed attempts trigger escalating lockout.

**Request body (JSON):**
```json
{
  "username":  "alice",
  "pin":       "123456",
  "image_b64": "<base64-jpeg>"
}
```

**Success — 200 OK:**
```json
{
  "authenticated": true,
  "user_id":       "e0a95d28-0e51-45b7-9da4-58ee717d2291",
  "username":      "alice",
  "similarity":    0.9341,
  "message":       "Authentication successful. Session granted."
}
```

**Failure responses:**

| HTTP | Condition | Key fields |
|------|-----------|-----------|
| 401 | Face similarity < 0.82 | `authenticated: false, similarity, threshold` |
| 401 | PIN incorrect | `authenticated: false, reason: "Incorrect PIN."` |
| 403 | Account locked out | `authenticated: false, reason, lockout_until` |
| 404 | Username not found | `error: "User not found."` |

**Lockout schedule (escalating):**

| Failure count | Lockout duration |
|---------------|-----------------|
| 1st | 30 seconds |
| 2nd | 5 minutes |
| 3rd+ | 30 minutes |

---

### 4.3  GET `/api/biometric/status/<username>/`

Returns enrollment record, current lockout state, and the 10 most recent authentication attempts.

**Example request:**
```
GET /api/biometric/status/alice/
```

**Success — 200 OK:**
```json
{
  "user_id":       "e0a95d28-0e51-45b7-9da4-58ee717d2291",
  "username":      "alice",
  "enrolled_at":   "2026-04-26T13:36:03.735902+00:00",
  "last_auth_at":  "2026-04-26T13:36:05.078365+00:00",
  "fail_count":    0,
  "locked":        false,
  "lockout_until": null,
  "recent_logs": [
    { "result": "SUCCESS",  "similarity": 0.9341, "at": "2026-04-26T13:36:05+00:00" },
    { "result": "FAIL_PIN", "similarity": 0.9341, "at": "2026-04-26T13:36:06+00:00" }
  ]
}
```

| HTTP | Condition |
|------|-----------|
| 404 | Username not found |

---

## 5. Data Models

### BiometricEnrollment (`biometric_enrollment`)

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | UUID (PK) | Auto-generated |
| `username` | CharField(64) | Unique |
| `embedding_enc` | TextField | Base64(nonce ‖ AES-256-GCM ciphertext) of 128-dim float32 embedding |
| `pin_hash` | CharField(64) | bcrypt cost-12 hash |
| `enrolled_at` | DateTimeField | Auto set on create |
| `last_auth_at` | DateTimeField | Updated on each successful auth |
| `fail_count` | SmallIntegerField | Resets to 0 on success |
| `lockout_until` | DateTimeField | Null when account is active |

### AuthAuditLog (`auth_audit_log`)

| Field | Type | Notes |
|-------|------|-------|
| `enrollment` | FK → BiometricEnrollment | Cascade delete |
| `result` | CharField | `SUCCESS` / `FAIL_FACE` / `FAIL_PIN` / `FAIL_LOCKOUT` |
| `similarity` | FloatField | Cosine similarity score (nullable) |
| `attempted_at` | DateTimeField | Auto set, ordered descending |
| `ip_address` | GenericIPAddressField | Nullable |

---

## 6. Biometric Engine (`engine.py`)

### Face Embedding Pipeline
1. `load_image()` — accepts bytes, file path, or PIL Image → RGB PIL Image
2. `MTCNN` — detects and aligns face to 160×160 tensor
3. `InceptionResnetV1` (VGGFace2 pretrained) — produces 512-dim embedding
4. L2 normalisation → 128-dim float32 vector
5. Stub mode activates automatically when `torch`/`facenet-pytorch` are unavailable (uses pixel statistics — for demo only)

### Template Security
- `encrypt_embedding()` — AES-256-GCM, 96-bit random nonce, stores `base64(nonce ‖ ciphertext)`
- `decrypt_embedding()` — reverses the above; key sourced from `MFBAS_AES_KEY` env var (dev fallback built-in)
- `hash_pin()` / `verify_pin()` — bcrypt cost-12, constant-time comparison

### Thresholds (configurable in `settings.py`)
```python
FACE_SIMILARITY_THRESHOLD = 0.82   # Cosine similarity gate
MAX_FAIL_ATTEMPTS         = 3
LOCKOUT_DURATIONS         = [30, 300, 1800]  # seconds
```

---

## 7. Frontend Screens

| Screen | Route | API call |
|--------|-------|----------|
| HomeScreen | `Home` | — |
| EnrollScreen | `Enroll` | `POST /api/biometric/enroll/` |
| AuthenticateScreen | `Authenticate` | `POST /api/biometric/authenticate/` |
| StatusScreen | `Status` | `GET /api/biometric/status/<username>/` |
| ResultScreen | `Result` | — (displays route params) |

**Image flow:**
1. `CameraCapture.js` opens front-facing camera modal with cyan oval face guide
2. Photo taken at quality 0.7, resized to 640px width, JPEG compressed to 0.8
3. Returns `data:image/jpeg;base64,<b64>` data URI
4. Screen strips the prefix before sending to API
5. Backend's `_decode_b64_image()` handles both stripped and un-stripped formats

---

## 8. Setup & Running

### Backend

```bash
cd mfbas

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Linux/Mac
# .venv\Scripts\activate           # Windows

# Install dependencies (omit torch/facenet for stub mode)
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Start server
python manage.py runserver 0.0.0.0:8000
```

> For stub mode (no GPU / no torch installed), the engine automatically falls back to pixel-statistics embeddings. Enroll and authenticate with the **same device** for similarity = 1.0.

### Frontend

```bash
cd ..    # back to project root
npm install
npx expo start --android    # or --ios
```

> If running on a **physical device**, edit `src/api/mfbasApi.js` line 1:
> ```js
> const BASE_URL = 'http://<your-machine-ip>:8000';
> ```

---

## 9. Integration Test Results (26 April 2026)

All 8 smoke tests passed against a live Django server with stub biometric engine:

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Enroll — missing fields | 400 + flat error string | PASS |
| 2 | Status — unknown user | 404 | PASS |
| 3 | Authenticate — missing image | 400 | PASS |
| 4 | Enroll — valid 3-image submission | 201 `{status, user_id, username, samples}` | PASS |
| 5 | Enroll — duplicate username | 409 | PASS |
| 6 | Authenticate — correct face + PIN | 200 `{authenticated: true, similarity: 1.0}` | PASS |
| 7 | Authenticate — wrong PIN | 401 `{authenticated: false, reason: "Incorrect PIN."}` | PASS |
| 8 | Status — with audit log entries | 200 `{recent_logs: [...], locked, fail_count}` | PASS |

Django system check: **0 issues**.

---

## 10. Integration Fixes Applied

The following bugs were identified and fixed to complete full frontend ↔ backend integration:

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `settings.py` | `USE_TZ` missing — `timezone.now()` and `DateTimeField` were inconsistent, breaking lockout timestamp comparisons | Added `USE_TZ = True` and `TIME_ZONE = 'UTC'` |
| 2 | `views.py` | `ser.errors` is a nested dict — rendered as `[object Object]` in the React Native error card | Added `_flat_errors()` helper; all 400 responses now return a flat string |
| 3 | `src/api/mfbasApi.js` | `res.json()` throws on non-JSON server errors (HTML 500 pages), crashing the fetch silently | Added `safeJson()` wrapper that returns `{error: "HTTP N — …"}` on parse failure |
| 4 | `src/screens/StatusScreen.js` | `route.params.prefill` ignored — "Check status for X" from ResultScreen opened an empty input | Added `route` to props, initialised `username` state from prefill, added `useEffect` auto-fetch |

---

## 11. Security Summary

| Control | Implementation |
|---------|---------------|
| Template encryption | AES-256-GCM, unique nonce per record |
| PIN storage | bcrypt cost-12, never stored in plaintext |
| Brute-force defence | 3-attempt escalating lockout (30s → 5min → 30min) |
| Audit trail | Immutable `AuthAuditLog` table, every attempt recorded |
| Input validation | DRF serializers; PIN enforced as 6-digit regex |
| Zambia DPA 2021 | Biometric data encrypted, audit log retained, no plaintext PII |

---

*MFBAS-DG-001 — Group 10 — SEC2201 Biometrics I — AfriCore Intelligence Limited*
