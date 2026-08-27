import axios from 'axios';
import { getAccessToken } from './authStorage';

function resolveApiBaseURL() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.app.github.dev')) {
      const backendHost = host.replace(/-\d+\.app\.github\.dev$/, '-8000.app.github.dev');
      if (backendHost !== host) return `https://${backendHost}`;
    }
  }

  return 'http://localhost:8000';
}

export const apiBaseURL = resolveApiBaseURL();

export const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
