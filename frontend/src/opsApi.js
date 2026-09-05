import axios from "axios";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const opsApi = axios.create({ baseURL: apiBase() });
opsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Request-ID"] = config.headers["X-Request-ID"] || crypto.randomUUID();
  return config;
});

export async function getOpsAccess() { const response = await opsApi.get("/ops/access"); return response.data; }
export async function getOpsOverview() { const response = await opsApi.get("/ops/overview"); return response.data; }
export async function getOpsObservability() { const response = await opsApi.get("/ops/observability"); return response.data; }
export async function getOpsUser(email) { const response = await opsApi.get("/ops/users", { params: { email } }); return response.data; }
export async function getOpsUserDirectory(params = {}) { const response = await opsApi.get("/ops/user-directory", { params }); return response.data; }
export async function getOpsUserAnalytics(userId) { const response = await opsApi.get(`/ops/user-directory/${userId}/analytics`); return response.data; }
export async function resendOpsVerificationEmail(userId) { const response = await opsApi.post(`/ops/user-directory/${userId}/resend-verification`); return response.data; }
export async function sendOpsUserInvite(payload) { const response = await opsApi.post("/ops/user-invites", payload); return response.data; }
export async function getOpsTeam() { const response = await opsApi.get("/ops/team"); return response.data; }
export async function assignOpsRolesByEmail(email, roles) { const response = await opsApi.post("/ops/team/assign", { email, roles }); return response.data; }
export async function updateOpsRoles(userId, roles) { const response = await opsApi.patch(`/ops/team/${userId}/roles`, { roles }); return response.data; }
export async function getOpsAudit() { const response = await opsApi.get("/ops/audit"); return response.data; }
export async function getComplianceCatalog() { const response = await opsApi.get("/ops/compliance/catalog"); return response.data; }
export async function runComplianceAudit() { const response = await opsApi.post("/ops/compliance/audits"); return response.data; }
export async function getLatestComplianceAudit() { const response = await opsApi.get("/ops/compliance/audits/latest"); return response.data; }
export async function getComplianceAuditHistory(limit = 20) { const response = await opsApi.get("/ops/compliance/audits", { params: { limit } }); return response.data; }
export async function getIntelligenceVerificationSummary(days = 30) { const response = await opsApi.get("/ops/ai-verification/summary", { params: { days } }); return response.data; }
