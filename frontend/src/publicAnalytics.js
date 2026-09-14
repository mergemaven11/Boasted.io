import axios from "axios";

import { hasAnalyticsConsent } from "./analytics.js";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export const PUBLIC_VISITOR_STORAGE_KEY = "bragstack_public_visitor_id";

export function clearPublicAnalyticsIdentity() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PUBLIC_VISITOR_STORAGE_KEY);
  } catch {
    // Privacy cleanup remains best effort when storage is unavailable.
  }
}

function getVisitorId() {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return "";
  try {
    let value = window.localStorage.getItem(PUBLIC_VISITOR_STORAGE_KEY);
    if (!value) {
      value = crypto.randomUUID();
      window.localStorage.setItem(PUBLIC_VISITOR_STORAGE_KEY, value);
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
  if (!slug || !eventType || !hasAnalyticsConsent()) {
    clearPublicAnalyticsIdentity();
    return false;
  }
  try {
    await axios.post(`${apiBase()}/public/brag/${encodeURIComponent(slug)}/analytics`, {
      event_type: eventType,
      visitor_id: getVisitorId(),
      referrer_host: getReferrerHost(),
    }, { timeout: 3000 });
    return true;
  } catch {
    // Analytics must never block or break a public Proof Profile.
    return false;
  }
}