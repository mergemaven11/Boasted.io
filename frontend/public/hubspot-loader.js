(() => {
  const HUBSPOT_PORTAL_ID = "247379152";
  const HUBSPOT_SCRIPT_ID = "hs-script-loader";
  const HUBSPOT_SCRIPT_SRC = `https://js-na2.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;
  const ANALYTICS_CONSENT_KEY = "boasted_analytics_consent_v1";
  const ANALYTICS_CONSENT_GRANTED = "granted";
  const CONSENT_EVENT = "boasted:analytics-consent-changed";

  let lastTrackedPath = null;

  function analyticsAllowed() {
    try {
      return window.localStorage?.getItem(ANALYTICS_CONSENT_KEY) === ANALYTICS_CONSENT_GRANTED;
    } catch {
      return false;
    }
  }

  function currentPath() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  function trackSpaPageView() {
    if (!analyticsAllowed() || !window._hsq) return;
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

  function loadHubSpot() {
    if (!analyticsAllowed()) return false;
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
      // HubSpot records the initial load. Remember it so SPA navigation does not
      // immediately create a duplicate page view for the same URL.
      lastTrackedPath = currentPath();
    }, { once: true });
    document.head.appendChild(script);
    return true;
  }

  function handleConsentChange(event) {
    if (event?.detail?.choice === ANALYTICS_CONSENT_GRANTED || analyticsAllowed()) {
      loadHubSpot();
    }
  }

  window.addEventListener(CONSENT_EVENT, handleConsentChange);
  loadHubSpot();
})();
