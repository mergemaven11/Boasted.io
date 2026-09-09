import axios from "axios";

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export async function revokeCurrentSession() {
  const token = localStorage.getItem("bragstack_token");
  if (!token) return;
  await axios.post(
    `${getApiBaseUrl()}/auth/logout`,
    null,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function signOutAndRedirect() {
  try {
    await revokeCurrentSession();
  } catch {
    // The local credential is removed even if the API is temporarily
    // unreachable. A valid server response revokes the session immediately;
    // otherwise the server-side inactivity/absolute timeout still applies.
  } finally {
    localStorage.removeItem("bragstack_token");
    window.location.assign("/login");
  }
}
