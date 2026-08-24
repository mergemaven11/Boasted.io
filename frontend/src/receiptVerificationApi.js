import axios from "axios";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const verificationApi = axios.create({ baseURL: apiBase() });
verificationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function requestReceiptVerification(receiptId, payload) {
  const response = await verificationApi.post(`/impact-receipts/${receiptId}/verification-requests`, payload);
  return response.data;
}

export async function getReceiptVerification(token) {
  const response = await verificationApi.get(`/receipt-verifications/${encodeURIComponent(token)}`);
  return response.data;
}

export async function decideReceiptVerification(token, decision) {
  const response = await verificationApi.post(`/receipt-verifications/${encodeURIComponent(token)}/decision`, { decision });
  return response.data;
}
