const BASE_URL = 'http://192.168.152.88:8000'; // Physical device — machine LAN IP; use 10.0.2.2 for Android emulator

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return { error: `HTTP ${res.status} — server returned a non-JSON response` };
  }
}

/**
 * Enroll a user.
 * @param {string}   username
 * @param {string}   pin            - 6-digit PIN
 * @param {string[]} imagesB64      - 1–5 base64 face images
 * @param {boolean}  [fingerprintEnabled=false]
 * @param {string|null} [fingerprintB64=null] - raw fingerprint scan (future SDK use)
 */
export async function enrollUser(username, pin, imagesB64, fingerprintEnabled = false, fingerprintB64 = null) {
  const body = { username, pin, images_b64: imagesB64, fingerprint_enabled: fingerprintEnabled };
  if (fingerprintB64) body.fingerprint_b64 = fingerprintB64;

  const res = await fetch(`${BASE_URL}/api/biometric/enroll/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await safeJson(res);
  return { status: res.status, data };
}

/**
 * Authenticate a user.
 * Face path:        provide imageB64, leave fingerprintConfirmed=false
 * Fingerprint path: set fingerprintConfirmed=true, leave imageB64=null
 *
 * @param {string}      username
 * @param {string}      pin
 * @param {string|null} [imageB64=null]
 * @param {boolean}     [fingerprintConfirmed=false]
 */
export async function authenticateUser(username, pin, imageB64 = null, fingerprintConfirmed = false) {
  const body = { username, pin, fingerprint_confirmed: fingerprintConfirmed };
  if (imageB64) body.image_b64 = imageB64;

  const res = await fetch(`${BASE_URL}/api/biometric/authenticate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await safeJson(res);
  return { status: res.status, data };
}

export async function getUserStatus(username) {
  const res = await fetch(`${BASE_URL}/api/biometric/status/${encodeURIComponent(username)}/`);
  const data = await safeJson(res);
  return { status: res.status, data };
}
