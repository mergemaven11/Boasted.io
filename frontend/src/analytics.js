const GA_MEASUREMENT_ID = "G-MKGEER9N5C";
const POSTHOG_PROJECT_KEY =
  import.meta.env.VITE_POSTHOG_KEY || "phc_CqWJPcoZhPvjkLis4Acj4JkySYQePmRCVXMCkUm5o4nR";
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const POSTHOG_DISTINCT_ID_KEY = "bragstack_analytics_id";

function getAnonymousDistinctId() {
  if (typeof window === "undefined") return "anonymous";

  try {
    const existing = window.localStorage.getItem(POSTHOG_DISTINCT_ID_KEY);
    if (existing) return existing;

    const created = window.crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(POSTHOG_DISTINCT_ID_KEY, created);
    return created;
  } catch {
    return `session-${Date.now()}`;
  }
}

function safeRoute() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function sanitizeProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) =>
      ["string", "number", "boolean"].includes(typeof value),
    ),
  );
}

function capturePostHog(event, properties = {}) {
  if (typeof window === "undefined" || !POSTHOG_PROJECT_KEY) return;

  const body = JSON.stringify({
    api_key: POSTHOG_PROJECT_KEY,
    event,
    properties: {
      distinct_id: getAnonymousDistinctId(),
      route: safeRoute(),
      ...sanitizeProperties(properties),
    },
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(`${POSTHOG_HOST}/capture/`, blob)) return;
    }

    void fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  } catch {
    // Analytics must never break the product experience.
  }
}

export function trackProductEvent(event, properties = {}) {
  if (!event || typeof event !== "string") return;

  capturePostHog(event, properties);
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, sanitizeProperties(properties));
  }
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__bragstackAnalyticsInitialized) return;

  window.__bragstackAnalyticsInitialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: safeRoute() });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.dataset.bragstackAnalytics = "true";
  document.head.appendChild(script);

  // Deliberately send only the route (no query string/hash) so reset tokens,
  // verification tokens, and user-authored career content never reach analytics.
  capturePostHog("$pageview", {
    $current_url: safeRoute(),
    $pathname: safeRoute(),
  });
}

export { GA_MEASUREMENT_ID, POSTHOG_HOST, POSTHOG_PROJECT_KEY };
