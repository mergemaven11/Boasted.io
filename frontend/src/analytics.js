const GA_MEASUREMENT_ID = "G-MKGEER9N5C";
let posthogClientPromise;

async function getPostHogClient() {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  if (!apiKey) return window.posthog || null;
  if (!posthogClientPromise) {
    posthogClientPromise = import("posthog-js").then(({ default: posthog }) => {
      if (!window.__bragstackPostHogInitialized) {
        posthog.init(apiKey, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
          person_profiles: "identified_only",
          capture_pageview: true,
        });
        window.__bragstackPostHogInitialized = true;
      }
      return posthog;
    });
  }
  return posthogClientPromise;
}

export async function identifyAnalyticsUser(user) {
  if (!user?.id) return;
  const posthog = await getPostHogClient();
  posthog?.identify(String(user.id), { current_plan: user.plan || "free" });
}

export async function resetAnalyticsUser() {
  const posthog = await getPostHogClient();
  posthog?.reset();
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
  void getPostHogClient();
}

export { GA_MEASUREMENT_ID };
