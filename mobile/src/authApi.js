import { api } from './api';
import { clearAccessToken, setAccessToken } from './authStorage';

export async function login(email, password) {
  const form = new URLSearchParams();
  form.append('username', email.trim().toLowerCase());
  form.append('password', password);

  const response = await api.post('/auth/login', form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  await setAccessToken(response.data.access_token);
  return response.data.user;
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
  if (!error?.response) return 'Could not reach BragStack. Check your connection and API configuration.';
  return 'Sign in failed. Please try again.';
}
