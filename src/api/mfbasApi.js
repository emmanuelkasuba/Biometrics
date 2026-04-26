const BASE_URL = 'http://10.0.2.2:8000'; // Android emulator → localhost; change to your server IP for device

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return { error: `HTTP ${res.status} — server returned a non-JSON response` };
  }
}

export async function enrollUser(username, pin, imagesB64) {
  const res = await fetch(`${BASE_URL}/api/biometric/enroll/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin, images_b64: imagesB64 }),
  });
  const data = await safeJson(res);
  return { status: res.status, data };
}

export async function authenticateUser(username, pin, imageB64) {
  const res = await fetch(`${BASE_URL}/api/biometric/authenticate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin, image_b64: imageB64 }),
  });
  const data = await safeJson(res);
  return { status: res.status, data };
}

export async function getUserStatus(username) {
  const res = await fetch(`${BASE_URL}/api/biometric/status/${encodeURIComponent(username)}/`);
  const data = await safeJson(res);
  return { status: res.status, data };
}
