import axios from "axios";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const VISITOR_STORAGE_KEY = "bragstack_public_visitor_id";

function getVisitorId() {
  if (typeof window === "undefined") return "";
  try {
    let value = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!value) {
      value = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_STORAGE_KEY, value);
    }
    return value;
  } catch {
    return "";
  }
}

function getReferrerHost() {
  if (typeof document === "undefined" || !document.referrer) return "";
  try {
    return new URL(document.referrer).hostname.slice(0, 160);
  } catch {
    return "";
  }
}

export async function trackPublicProfileEvent(slug, eventType) {
  if (!slug || !eventType) return;
  try {
    await axios.post(`${apiBase()}/public/brag/${encodeURIComponent(slug)}/analytics`, {
      event_type: eventType,
      visitor_id: getVisitorId(),
      referrer_host: getReferrerHost(),
    }, { timeout: 3000 });
  } catch {
    // Analytics must never block or break a public Proof Profile.
  }
}