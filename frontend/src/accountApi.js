import axios from "axios";

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const accountApi = axios.create({ baseURL: getApiBaseUrl() });

accountApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function closeCurrentAccount() {
  const response = await accountApi.delete("/auth/me/account", {
    data: { confirmation: "CLOSE" },
  });
  return response.data;
}
