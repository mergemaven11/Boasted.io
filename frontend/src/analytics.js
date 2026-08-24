const GA_MEASUREMENT_ID = "G-MKGEER9N5C";

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
}

export { GA_MEASUREMENT_ID };
