import { getKitabuApiBaseUrl } from './runtimeConfig';
import { loadSecureJson, saveSecureJson } from './storage';

const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const DEVICE_ID_STORAGE_KEY = 'kitabu_device_id';

interface StoredSession {
  accessToken?: string;
}

function randomDeviceId() {
  return `kitabu-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

async function getDeviceId() {
  let deviceId = await loadSecureJson<string | null>(DEVICE_ID_STORAGE_KEY, null);
  if (!deviceId) {
    deviceId = randomDeviceId();
    await saveSecureJson(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  return deviceId;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getKitabuApiBaseUrl();
  if (!baseUrl) {
    throw new Error('KITABU_API_BASE_URL is not configured');
  }

  const [session, deviceId] = await Promise.all([
    loadSecureJson<StoredSession>(AUTH_SESSION_STORAGE_KEY, {}),
    getDeviceId(),
  ]);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-kitabu-device-id': deviceId,
      'x-kitabu-device-label': 'Kitabu Native App',
      ...(session.accessToken
        ? {
            Authorization: `Bearer ${session.accessToken}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}
