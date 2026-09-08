const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
const POSTHOG_DEFAULTS = "2026-05-30";
const IDENTIFIED_USER_STORAGE_KEY = "boasted_posthog_identified_user";

function getEnvValue(name) {
  return import.meta.env?.[name]?.trim?.() || "";
}

function isLocalDevelopment() {
  if (typeof window === "undefined") return true;
  const hostname = window.location?.hostname || "";
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function installPostHogStub() {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (window.posthog?.__SV) return window.posthog;

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  return window.posthog;
}

function toPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) =>
      ["string", "number", "boolean"].includes(typeof entryValue),
    ),
  );
}

function forwardGaEventToPostHog(entry) {
  const [command, eventName, parameters] = Array.from(entry || []);
  if (command !== "event" || typeof eventName !== "string") return;
  if (typeof window.posthog?.capture !== "function") return;

  window.posthog.capture(eventName, {
    ...toPlainObject(parameters),
    analytics_source: "boasted_product",
  });
}

function installDataLayerBridge() {
  if (typeof window === "undefined" || window.__boastedPostHogDataLayerBridgeInstalled) return;

  window.dataLayer = window.dataLayer || [];
  const pendingEntries = Array.from(window.dataLayer);
  const originalPush = window.dataLayer.push.bind(window.dataLayer);

  window.dataLayer.push = function pushWithPostHogForwarding(...entries) {
    entries.forEach(forwardGaEventToPostHog);
    return originalPush(...entries);
  };

  window.__boastedPostHogDataLayerBridgeInstalled = true;
  pendingEntries.forEach(forwardGaEventToPostHog);
}

async function syncSignedInIdentity() {
  if (typeof window === "undefined" || typeof window.posthog?.identify !== "function") return;

  const token = window.localStorage?.getItem("bragstack_token");
  const previouslyIdentifiedUser = window.localStorage?.getItem(IDENTIFIED_USER_STORAGE_KEY);

  if (!token) {
    if (previouslyIdentifiedUser && typeof window.posthog?.reset === "function") {
      window.posthog.reset();
      window.localStorage?.removeItem(IDENTIFIED_USER_STORAGE_KEY);
    }
    return;
  }

  try {
    const { getCurrentUser } = await import("./api.js");
    const user = await getCurrentUser();
    const userId = user?.id || user?._id;
    if (!userId) return;

    const normalizedUserId = String(userId);
    window.posthog.identify(normalizedUserId);
    window.localStorage?.setItem(IDENTIFIED_USER_STORAGE_KEY, normalizedUserId);
  } catch {
    // Analytics identity should never block app startup or authentication flows.
  }
}

export function initializePostHog() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (isLocalDevelopment()) return false;

  const apiKey = getEnvValue("VITE_POSTHOG_KEY");
  if (!apiKey) return false;

  const apiHost = getEnvValue("VITE_POSTHOG_HOST") || DEFAULT_POSTHOG_HOST;
  const posthog = installPostHogStub();
  if (!posthog) return false;

  if (!window.__boastedPostHogInitialized) {
    posthog.init(apiKey, {
      api_host: apiHost,
      defaults: POSTHOG_DEFAULTS,
    });
    posthog.register({
      app: "boasted",
      environment: "production",
    });
    window.__boastedPostHogInitialized = true;
  }

  installDataLayerBridge();
  void syncSignedInIdentity();
  return true;
}

export { DEFAULT_POSTHOG_HOST, POSTHOG_DEFAULTS };
