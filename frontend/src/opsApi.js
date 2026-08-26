import axios from "axios";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const opsApi = axios.create({ baseURL: apiBase() });
opsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getOpsAccess() { const response = await opsApi.get("/ops/access"); return response.data; }
export async function getOpsOverview() { const response = await opsApi.get("/ops/overview"); return response.data; }
export async function getOpsUser(email) { const response = await opsApi.get("/ops/users", { params: { email } }); return response.data; }
export async function getOpsTeam() { const response = await opsApi.get("/ops/team"); return response.data; }
export async function updateOpsRoles(userId, roles) { const response = await opsApi.patch(`/ops/team/${userId}/roles`, { roles }); return response.data; }
export async function getOpsAudit() { const response = await opsApi.get("/ops/audit"); return response.data; }
