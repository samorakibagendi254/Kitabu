import { AuthSession, AuthState, GenderOption, PublicSignupRole } from '../types/app';
import { getKitabuApiBaseUrl } from './runtimeConfig';
import { loadSecureJson, saveSecureJson } from './storage';

const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const DEVICE_ID_STORAGE_KEY = 'kitabu_device_id';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthSession['user'];
  authState: AuthState;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const baseUrl = getKitabuApiBaseUrl();
  if (!baseUrl) {
    throw new Error('KITABU_API_BASE_URL is not configured');
  }

  let deviceId = await loadSecureJson<string | null>(DEVICE_ID_STORAGE_KEY, null);
  if (!deviceId) {
    deviceId = `kitabu-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await saveSecureJson(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-kitabu-device-id': deviceId,
      'x-kitabu-device-label': 'Kitabu Native App',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

export async function loadStoredAuthSession() {
  return loadSecureJson<AuthSession | null>(AUTH_SESSION_STORAGE_KEY, null);
}

export async function persistAuthSession(session: AuthSession | null) {
  await saveSecureJson(AUTH_SESSION_STORAGE_KEY, session);
}

export async function loginWithPassword(email: string, password: string): Promise<AuthSession> {
  const payload = await postJson<LoginResponse>('/auth/login', { email, password });
  const session: AuthSession = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  };
  await persistAuthSession(session);
  return session;
}

export async function signupWithPassword(input: {
  fullName: string;
  email: string;
  password: string;
  role: PublicSignupRole;
  schoolId?: string | null;
  gender?: GenderOption;
  grade?: string | null;
  mpesaPhoneNumber?: string | null;
  onboardingCompleted?: boolean;
}): Promise<AuthSession> {
  const payload = await postJson<LoginResponse>('/auth/signup', input);
  const session: AuthSession = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  };
  await persistAuthSession(session);
  return session;
}

export async function refreshAccessSession(refreshToken: string): Promise<AuthSession> {
  const payload = await postJson<LoginResponse>('/auth/refresh', {
    refreshToken,
  });
  const session: AuthSession = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  };
  await persistAuthSession(session);
  return session;
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return postJson<{ message: string }>('/auth/forgot-password', { email });
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ message: string }> {
  return postJson<{ message: string }>('/auth/password/reset', { token, newPassword });
}

export async function requestEmailVerification(email: string): Promise<{ message: string }> {
  return postJson<{ message: string }>('/auth/email-verification/resend', { email });
}

export async function completeStudentOnboarding(input: {
  schoolId: string;
  gender: GenderOption;
  grade: string;
  mpesaPhoneNumber?: string | null;
}): Promise<AuthSession> {
  const baseUrl = getKitabuApiBaseUrl();
  if (!baseUrl) {
    throw new Error('KITABU_API_BASE_URL is not configured');
  }

  const session = await loadStoredAuthSession();
  if (!session?.accessToken) {
    throw new Error('Authentication required');
  }

  let deviceId = await loadSecureJson<string | null>(DEVICE_ID_STORAGE_KEY, null);
  if (!deviceId) {
    deviceId = `kitabu-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await saveSecureJson(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/me/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      'x-kitabu-device-id': deviceId,
      'x-kitabu-device-label': 'Kitabu Native App',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as {
    accessToken: string;
    user: AuthSession['user'];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  const nextSession: AuthSession = {
    accessToken: payload.accessToken,
    refreshToken: session.refreshToken,
    user: payload.user,
  };
  await persistAuthSession(nextSession);
  return nextSession;
}
