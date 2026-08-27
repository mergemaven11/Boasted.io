import { api } from './api';
import { clearAccessToken, setAccessToken } from './authStorage';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function login(email, password) {
  const form = new URLSearchParams();
  form.append('username', normalizeEmail(email));
  form.append('password', password);

  const response = await api.post('/auth/login', form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  await setAccessToken(response.data.access_token);
  return response.data.user;
}

export async function register(name, email, password) {
  const response = await api.post('/auth/register', {
    name: String(name || '').trim(),
    email: normalizeEmail(email),
    password,
  });
  return response.data;
}

export async function resendVerification(email) {
  const response = await api.post('/auth/email-verification/resend', {
    email: normalizeEmail(email),
  });
  return response.data;
}

export async function confirmEmailVerification(token) {
  const response = await api.post('/auth/email-verification/confirm', { token });
  await setAccessToken(response.data.access_token);
  return response.data.user;
}

export async function requestPasswordReset(email) {
  const response = await api.post('/auth/password-reset/request', {
    email: normalizeEmail(email),
  });
  return response.data;
}

export async function confirmPasswordReset(token, password) {
  const response = await api.post('/auth/password-reset/confirm', { token, password });
  return response.data;
}

export async function restoreSession() {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    if (error?.response?.status === 401) await clearAccessToken();
    throw error;
  }
}

export async function logout() {
  await clearAccessToken();
}

export function getAuthErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail.message === 'string') return detail.message;
  if (!error?.response) return 'Could not reach BragStack. Check your connection and try again.';
  if (error.response.status >= 500) return 'BragStack is having trouble right now. Please try again in a moment.';
  return 'That request could not be completed. Please check your details and try again.';
}
