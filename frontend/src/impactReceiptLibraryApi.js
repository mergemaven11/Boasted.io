import axios from "axios";

const API_PAGE_LIMIT = 100;

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const impactReceiptApi = axios.create({ baseURL: apiBase() });
impactReceiptApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getAllImpactReceipts() {
  const receipts = [];
  let skip = 0;

  while (true) {
    const response = await impactReceiptApi.get("/impact-receipts", {
      params: { limit: API_PAGE_LIMIT, skip },
    });
    const data = response.data || {};
    const batch = Array.isArray(data.receipts) ? data.receipts : [];

    receipts.push(...batch);
    if (!data.has_more || batch.length === 0) break;
    skip += batch.length;
  }

  return {
    receipts,
    total_receipts: receipts.length,
  };
}
