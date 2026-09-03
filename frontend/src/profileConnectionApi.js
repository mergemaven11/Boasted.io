import axios from "axios";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const connectionApi = axios.create({ baseURL: apiBase() });
connectionApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getProfileConnection() {
  const response = await connectionApi.get("/profile/connection");
  return response.data;
}

export async function updateProfileConnection(payload) {
  const response = await connectionApi.patch("/profile/connection", payload);
  return response.data;
}

export async function getPublicProfileConnection(slug) {
  const response = await connectionApi.get(`/public/brag/${encodeURIComponent(slug)}/connection`);
  return response.data;
}
