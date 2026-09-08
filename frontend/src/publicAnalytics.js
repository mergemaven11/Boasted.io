import axios from "axios";

import { ANALYTICS_EVENTS, trackAnalyticsEvent } from "./analytics.js";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  const viteEnv = import.meta.env || {};
  return viteEnv.VITE_API_BASE_URL || viteEnv.VITE_API_URL || "http://localhost:8000";
}

const VISITOR_STORAGE_KEY = "bragstack_public_visitor_id";
const PRODUCT_EVENT_BY_PUBLIC_EVENT = Object.freeze({
  profile_view: ANALYTICS_EVENTS.PUBLIC_PROFILE_VIEWED,
});

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

    const productEvent = PRODUCT_EVENT_BY_PUBLIC_EVENT[eventType];
    if (productEvent) trackAnalyticsEvent(productEvent);
  } catch {
    // Analytics must never block or break a public Proof Profile. Product-level
    // events are emitted only after the first-party analytics request succeeds,
    // so one profile view cannot be counted under two different success rules.
  }
}