const GA_MEASUREMENT_ID = "G-MKGEER9N5C";
const POSTHOG_PROJECT_KEY = import.meta.env.VITE_POSTHOG_KEY || "";
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const POSTHOG_ANON_ID_KEY = "bragstack_analytics_id";

function getAnonymousId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(POSTHOG_ANON_ID_KEY);
    if (existing) return existing;
    const next = window.crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(POSTHOG_ANON_ID_KEY, next);
    return next;
  } catch {
    return `ephemeral-${Date.now()}`;
  }
}

function capturePostHogPageview() {
  if (!POSTHOG_PROJECT_KEY || typeof window === "undefined") return;

  const pathname = window.location.pathname || "/";
  const payload = JSON.stringify({
    api_key: POSTHOG_PROJECT_KEY,
    event: "$pageview",
    properties: {
      distinct_id: getAnonymousId(),
      $current_url: `${window.location.origin}${pathname}`,
      pathname,
    },
  });

  const endpoint = `${POSTHOG_HOST}/capture/`;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const sent = navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      if (sent) return;
    }
    window.fetch?.(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never interfere with product behavior.
  }
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__bragstackGaInitialized) return;

  window.__bragstackGaInitialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.dataset.bragstackAnalytics = "true";
  document.head.appendChild(script);

  capturePostHogPageview();
}

export { GA_MEASUREMENT_ID };
