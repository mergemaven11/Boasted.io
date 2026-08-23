import axios from "axios";

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export async function updateProfileAvatar(avatarUrl) {
  const token = localStorage.getItem("bragstack_token");
  const response = await axios.patch(
    `${getApiBaseUrl()}/auth/me/avatar`,
    { avatar_url: avatarUrl },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  return response.data;
}
