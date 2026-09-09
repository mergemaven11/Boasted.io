const GA_MEASUREMENT_ID = "G-MKGEER9N5C";
export const ANALYTICS_CONSENT_KEY = "boasted_analytics_consent_v1";
export const ANALYTICS_CONSENT_GRANTED = "granted";
export const ANALYTICS_CONSENT_DENIED = "denied";

const GA_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const UTM_FIELDS = [
  "utm_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_source_platform",
  "utm_term",
  "utm_content",
  "utm_creative_format",
  "utm_marketing_tactic",
];
const FIRST_TOUCH_UTM_KEY = "bragstack_first_touch_utm";
const SESSION_UTM_KEY = "bragstack_session_utm";
const ACTIVATION_COHORT_KEY = "boasted_activation_cohort";
const ACTIVATION_SIGNUP_AT_KEY = "boasted_activation_signup_at";
const ACTIVATION_LAST_SEEN_AT_KEY = "boasted_activation_last_seen_at";
const ACTIVATION_RETURN_TRACKED_KEY = "boasted_activation_d7_return_tracked";
const ACTIVATION_PROOF_COUNT_KEY = "boasted_activation_proof_count";
const ACTIVATION_RECEIPT_COUNT_KEY = "boasted_activation_receipt_count";
const MAX_ATTRIBUTION_VALUE_LENGTH = 100;
const SENSITIVE_PRODUCT_PARAMETER_PATTERN = /(^|_)(accomplishment|employer|evidence|url|company|organization|title|description|body|text|content)($|_)/i;
const RETURN_SESSION_GAP_MS = 30 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ANALYTICS_STORAGE_KEYS = [
  FIRST_TOUCH_UTM_KEY,
  ACTIVATION_COHORT_KEY,
  ACTIVATION_SIGNUP_AT_KEY,
  ACTIVATION_LAST_SEEN_AT_KEY,
  ACTIVATION_RETURN_TRACKED_KEY,
  ACTIVATION_PROOF_COUNT_KEY,
  ACTIVATION_RECEIPT_COUNT_KEY,
];

export const ANALYTICS_EVENTS = Object.freeze({
  SIGN_UP: "sign_up",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ACCOMPLISHMENT_CREATED: "accomplishment_created",
  FIRST_PROOF_CREATED: "first_proof_created",
  SECOND_PROOF_CREATED: "second_proof_created",
  FIFTH_PROOF_CREATED: "fifth_proof_created",
  IMPACT_RECEIPT_CREATED: "impact_receipt_created",
  FIRST_IMPACT_RECEIPT_COMPLETED: "first_impact_receipt_completed",
  FIRST_GENERATED_OUTPUT: "first_generated_output",
  EXISTING_PROOF_REUSED: "existing_proof_reused",
  PUBLIC_PROFILE_VIEWED: "public_profile_viewed",
  PROFILE_SHARED: "profile_shared",
  IMPACT_RECEIPT_SHARED: "impact_receipt_shared",
  CAREER_PACKET_EXPORTED: "career_packet_exported",
  RETURNED_WITHIN_7_DAYS: "returned_within_7_days",
});

function safeStorageRead(storage, key) {
  try {
    const rawValue = storage?.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function safeStorageWrite(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Analytics must never break a product flow when browser storage is blocked.
  }
}

function safeStorageRemove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Privacy changes remain best effort when browser storage is unavailable.
  }
}

function safeConsentRead() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage?.getItem(ANALYTICS_CONSENT_KEY);
    return value === ANALYTICS_CONSENT_GRANTED || value === ANALYTICS_CONSENT_DENIED ? value : null;
  } catch {
    return null;
  }
}

export function getAnalyticsConsent() {
  return safeConsentRead();
}

export function hasAnalyticsConsent() {
  return safeConsentRead() === ANALYTICS_CONSENT_GRANTED;
}

function clearAnalyticsStorage() {
  if (typeof window === "undefined") return;
  ANALYTICS_STORAGE_KEYS.forEach((key) => safeStorageRemove(window.localStorage, key));
  safeStorageRemove(window.sessionStorage, SESSION_UTM_KEY);
}

export function setAnalyticsConsent(choice) {
  if (typeof window === "undefined") return false;
  if (![ANALYTICS_CONSENT_GRANTED, ANALYTICS_CONSENT_DENIED].includes(choice)) return false;

  try {
    window.localStorage?.setItem(ANALYTICS_CONSENT_KEY, choice);
  } catch {
    return false;
  }

  const granted = choice === ANALYTICS_CONSENT_GRANTED;
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = !granted;

  if (!granted) clearAnalyticsStorage();

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
    });
  }

  return true;
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
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return {};

  const incomingUtm = readUtmParametersFromUrl();
  if (!Object.keys(incomingUtm).length) {
    return safeStorageRead(window.sessionStorage, SESSION_UTM_KEY) || {};
  }

  safeStorageWrite(window.sessionStorage, SESSION_UTM_KEY, incomingUtm);

  const existingFirstTouch = safeStorageRead(window.localStorage, FIRST_TOUCH_UTM_KEY) || {};
  if (!Object.keys(existingFirstTouch).length) {
    safeStorageWrite(window.localStorage, FIRST_TOUCH_UTM_KEY, incomingUtm);
  }

  return incomingUtm;
}

export function getCampaignEventParameters() {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return {};

  const sessionUtm = captureCampaignAttribution();
  const firstTouchUtm = safeStorageRead(window.localStorage, FIRST_TOUCH_UTM_KEY) || {};

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

function sanitizeEventParameters(parameters = {}, { productParameters = false } = {}) {
  return Object.fromEntries(
    Object.entries(parameters).filter(([key, value]) => {
      if (!GA_NAME_PATTERN.test(key)) return false;
      if (productParameters && SENSITIVE_PRODUCT_PARAMETER_PATTERN.test(key)) return false;
      if (value === null || value === undefined || value === "") return false;
      return ["string", "number", "boolean"].includes(typeof value);
    }),
  );
}

function emitAnalyticsEvent(eventName, parameters = {}) {
  if (!hasAnalyticsConsent() || typeof window?.gtag !== "function" || !GA_NAME_PATTERN.test(eventName)) return false;
  window.gtag(
    "event",
    eventName,
    {
      ...sanitizeEventParameters(getCampaignEventParameters()),
      ...sanitizeEventParameters(parameters, { productParameters: true }),
    },
  );
  return true;
}

function trackReturnWithinSevenDays() {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  const signupAt = Number(safeStorageRead(window.localStorage, ACTIVATION_SIGNUP_AT_KEY));
  const lastSeenAt = Number(safeStorageRead(window.localStorage, ACTIVATION_LAST_SEEN_AT_KEY));
  const alreadyTracked = safeStorageRead(window.localStorage, ACTIVATION_RETURN_TRACKED_KEY) === true;
  const now = Date.now();

  if (
    !alreadyTracked
    && signupAt > 0
    && lastSeenAt > 0
    && now - lastSeenAt >= RETURN_SESSION_GAP_MS
    && now - signupAt <= SEVEN_DAYS_MS
  ) {
    emitAnalyticsEvent(ANALYTICS_EVENTS.RETURNED_WITHIN_7_DAYS, {
      days_since_signup: Math.max(0, Math.floor((now - signupAt) / (24 * 60 * 60 * 1000))),
    });
    safeStorageWrite(window.localStorage, ACTIVATION_RETURN_TRACKED_KEY, true);
  }

  if (signupAt > 0) safeStorageWrite(window.localStorage, ACTIVATION_LAST_SEEN_AT_KEY, now);
}

function trackActivationMilestones(eventName, parameters = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  if (eventName === ANALYTICS_EVENTS.SIGN_UP) {
    const now = Date.now();
    safeStorageWrite(window.localStorage, ACTIVATION_COHORT_KEY, true);
    safeStorageWrite(window.localStorage, ACTIVATION_SIGNUP_AT_KEY, now);
    safeStorageWrite(window.localStorage, ACTIVATION_LAST_SEEN_AT_KEY, now);
    safeStorageWrite(window.localStorage, ACTIVATION_RETURN_TRACKED_KEY, false);
    safeStorageWrite(window.localStorage, ACTIVATION_PROOF_COUNT_KEY, 0);
    safeStorageWrite(window.localStorage, ACTIVATION_RECEIPT_COUNT_KEY, 0);
    emitAnalyticsEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { method: parameters.method || "unknown" });
    return;
  }

  if (safeStorageRead(window.localStorage, ACTIVATION_COHORT_KEY) !== true) return;

  if (eventName === ANALYTICS_EVENTS.ACCOMPLISHMENT_CREATED) {
    const nextCount = Number(safeStorageRead(window.localStorage, ACTIVATION_PROOF_COUNT_KEY) || 0) + 1;
    safeStorageWrite(window.localStorage, ACTIVATION_PROOF_COUNT_KEY, nextCount);
    if (nextCount === 1) emitAnalyticsEvent(ANALYTICS_EVENTS.FIRST_PROOF_CREATED, { proof_number: 1 });
    if (nextCount === 2) emitAnalyticsEvent(ANALYTICS_EVENTS.SECOND_PROOF_CREATED, { proof_number: 2 });
    if (nextCount === 5) emitAnalyticsEvent(ANALYTICS_EVENTS.FIFTH_PROOF_CREATED, { proof_number: 5 });
  }

  if (eventName === ANALYTICS_EVENTS.IMPACT_RECEIPT_CREATED) {
    const nextCount = Number(safeStorageRead(window.localStorage, ACTIVATION_RECEIPT_COUNT_KEY) || 0) + 1;
    safeStorageWrite(window.localStorage, ACTIVATION_RECEIPT_COUNT_KEY, nextCount);
    if (nextCount === 1) {
      emitAnalyticsEvent(ANALYTICS_EVENTS.FIRST_IMPACT_RECEIPT_COMPLETED, {
        creation_source: parameters.creation_source || "unknown",
      });
    }
  }
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (!hasAnalyticsConsent()) {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    return false;
  }

  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  captureCampaignAttribution();
  if (window.__bragstackGaInitialized) return true;

  window.__bragstackGaInitialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", { analytics_storage: "granted" });
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.dataset.bragstackAnalytics = "true";
  document.head.appendChild(script);

  trackReturnWithinSevenDays();
  return true;
}

export function trackAnalyticsEvent(eventName, parameters = {}) {
  if (typeof window === "undefined" || !GA_NAME_PATTERN.test(eventName) || !hasAnalyticsConsent()) return false;

  initializeAnalytics();
  if (!emitAnalyticsEvent(eventName, parameters)) return false;
  trackActivationMilestones(eventName, parameters);
  return true;
}

export { GA_MEASUREMENT_ID };
