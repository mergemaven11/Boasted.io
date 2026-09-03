const GA_MEASUREMENT_ID = "G-MKGEER9N5C";

const GA_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_id",
  "utm_term",
  "utm_content",
];
const FIRST_TOUCH_UTM_KEY = "bragstack_first_touch_utm";
const SESSION_UTM_KEY = "bragstack_session_utm";
const MAX_ATTRIBUTION_VALUE_LENGTH = 120;

export const ANALYTICS_EVENTS = Object.freeze({
  SIGN_UP: "sign_up",
  ACCOMPLISHMENT_CREATED: "accomplishment_created",
  IMPACT_RECEIPT_CREATED: "impact_receipt_created",
});

function safeStorageRead(storage, key) {
  try {
    const rawValue = storage?.getItem(key);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch {
    return {};
  }
}

function safeStorageWrite(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Analytics must never break a product flow when browser storage is blocked.
  }
}

function readUtmParametersFromUrl() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    UTM_FIELDS.flatMap((field) => {
      const value = params.get(field)?.trim().slice(0, MAX_ATTRIBUTION_VALUE_LENGTH);
      return value ? [[field, value]] : [];
    }),
  );
}

export function captureCampaignAttribution() {
  if (typeof window === "undefined") return {};

  const incomingUtm = readUtmParametersFromUrl();
  if (!Object.keys(incomingUtm).length) {
    return safeStorageRead(window.sessionStorage, SESSION_UTM_KEY);
  }

  safeStorageWrite(window.sessionStorage, SESSION_UTM_KEY, incomingUtm);

  const existingFirstTouch = safeStorageRead(window.localStorage, FIRST_TOUCH_UTM_KEY);
  if (!Object.keys(existingFirstTouch).length) {
    safeStorageWrite(window.localStorage, FIRST_TOUCH_UTM_KEY, incomingUtm);
  }

  return incomingUtm;
}

export function getCampaignEventParameters() {
  if (typeof window === "undefined") return {};

  const sessionUtm = captureCampaignAttribution();
  const firstTouchUtm = safeStorageRead(window.localStorage, FIRST_TOUCH_UTM_KEY);

  return {
    ...sessionUtm,
    ...Object.fromEntries(
      Object.entries(firstTouchUtm).map(([key, value]) => [
        `first_${key}`,
        value,
      ]),
    ),
  };
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  captureCampaignAttribution();
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
}

function sanitizeEventParameters(parameters = {}) {
  return Object.fromEntries(
    Object.entries(parameters).filter(([key, value]) => {
      if (!GA_NAME_PATTERN.test(key)) return false;
      if (value === null || value === undefined || value === "") return false;
      return ["string", "number", "boolean"].includes(typeof value);
    }),
  );
}

export function trackAnalyticsEvent(eventName, parameters = {}) {
  if (typeof window === "undefined" || !GA_NAME_PATTERN.test(eventName)) return false;

  initializeAnalytics();
  if (typeof window.gtag !== "function") return false;

  window.gtag(
    "event",
    eventName,
    sanitizeEventParameters({
      ...getCampaignEventParameters(),
      ...parameters,
    }),
  );
  return true;
}

export { GA_MEASUREMENT_ID };
