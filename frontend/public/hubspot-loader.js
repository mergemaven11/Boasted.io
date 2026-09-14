(() => {
  const HUBSPOT_PORTAL_ID = "247379152";
  const HUBSPOT_SCRIPT_ID = "hs-script-loader";
  const HUBSPOT_SCRIPT_SRC = `https://js-na2.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;
  const ANALYTICS_CONSENT_KEY = "boasted_analytics_consent_v1";
  const ANALYTICS_CONSENT_GRANTED = "granted";
  const CONSENT_EVENT = "boasted:analytics-consent-changed";
  const SENSITIVE_HASH_KEYS = new Set(["oauth_token", "verify_token", "reset_token"]);

  let lastTrackedPath = null;

  function analyticsAllowed() {
    try {
      return window.localStorage?.getItem(ANALYTICS_CONSENT_KEY) === ANALYTICS_CONSENT_GRANTED;
    } catch {
      return false;
    }
  }

  function hasSensitiveAuthFragment() {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    return [...SENSITIVE_HASH_KEYS].some((key) => hash.has(key));
  }

  function currentPath() {
    // Never expose URL fragments or arbitrary query strings to third-party analytics.
    return window.location.pathname || "/";
  }

  function trackSpaPageView() {
    if (!analyticsAllowed() || hasSensitiveAuthFragment() || !window._hsq) return;
    const path = currentPath();
    if (path === lastTrackedPath) return;
    lastTrackedPath = path;
    window._hsq.push(["setPath", path]);
    window._hsq.push(["trackPageView"]);
  }

  function installSpaTracking() {
    if (window.__boastedHubSpotSpaTrackingInstalled) return;
    window.__boastedHubSpotSpaTrackingInstalled = true;

    const wrapHistoryMethod = (methodName) => {
      const original = window.history?.[methodName];
      if (typeof original !== "function") return;
      window.history[methodName] = function boastedHubSpotHistoryWrapper(...args) {
        const result = original.apply(this, args);
        window.setTimeout(trackSpaPageView, 0);
        return result;
      };
    };

    wrapHistoryMethod("pushState");
    wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", () => window.setTimeout(trackSpaPageView, 0));
  }

  function disableHubSpotTracking() {
    if (window._hsq) {
      window._hsq.push(["doNotTrack"]);
    }
    lastTrackedPath = null;
  }

  function loadHubSpot() {
    if (!analyticsAllowed() || hasSensitiveAuthFragment()) return false;
    if (document.getElementById(HUBSPOT_SCRIPT_ID)) return true;

    window._hsq = window._hsq || [];
    installSpaTracking();

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = HUBSPOT_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = HUBSPOT_SCRIPT_SRC;
    script.addEventListener("load", () => {
      lastTrackedPath = currentPath();
    }, { once: true });
    document.head.appendChild(script);
    return true;
  }

  function handleConsentChange(event) {
    const choice = event?.detail?.choice;
    if (choice === ANALYTICS_CONSENT_GRANTED || analyticsAllowed()) {
      loadHubSpot();
      return;
    }
    disableHubSpotTracking();
  }

  window.addEventListener(CONSENT_EVENT, handleConsentChange);
  loadHubSpot();
})();