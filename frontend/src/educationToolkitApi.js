function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export async function getEducationToolkit(toolId) {
  const token = localStorage.getItem("bragstack_token");
  const response = await fetch(
    `${apiBase()}/career-intelligence/education-toolkit/${encodeURIComponent(toolId)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(
      payload?.detail?.message || payload?.detail || "This Education tool could not be loaded.",
    );
    error.status = response.status;
    throw error;
  }
  return response.json();
}
