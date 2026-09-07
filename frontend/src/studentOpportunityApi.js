function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

async function request(path) {
  const token = localStorage.getItem("bragstack_token");
  const response = await fetch(`${apiBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail;
    const error = new Error(detail?.message || detail || "Student opportunity search could not be loaded.");
    error.status = response.status;
    error.code = detail?.code;
    throw error;
  }
  return payload;
}

export function getStudentOpportunityContext() {
  return request("/student-opportunities/context");
}

export function findStudentPrograms({ location, query = "", radius = 25, page = 1, pageSize = 20 }) {
  const params = new URLSearchParams({
    location,
    q: query,
    radius: String(radius),
    page: String(page),
    page_size: String(pageSize),
  });
  return request(`/student-opportunities/programs?${params.toString()}`);
}

export function findStudentInternships({ location, query = "", radius = 25, page = 1, pageSize = 20 }) {
  const params = new URLSearchParams({
    location,
    q: query,
    radius: String(radius),
    page: String(page),
    page_size: String(pageSize),
  });
  return request(`/student-opportunities/internships?${params.toString()}`);
}
