function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.detail || "Scholarship request failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function searchScholarships(filters = {}) {
  const params = new URLSearchParams();
  const values = {
    q: filters.query,
    state: filters.state,
    level: filters.level,
    basis: filters.basis,
    availability: filters.availability,
    min_amount: filters.minAmount,
    sort: filters.sort,
    page: filters.page,
    page_size: filters.pageSize,
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return request(`/scholarships?${params.toString()}`);
}

export async function submitScholarship(payload) {
  return request("/scholarships/submissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
