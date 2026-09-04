import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./ReferencePolish.css";
import "./MarketingFooterOrder.css";
import "./ResponsiveLayoutGuard.css";
import "./ImpactReceiptsResponsive.css";
import RootContent from "./RootContent.jsx";
import { installInterviewBrowserPreflight } from "./interviewBrowserPreflight.js";

installInterviewBrowserPreflight();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootContent />
  </StrictMode>,
);

function loadAnalyticsWhenIdle() {
  import("./analytics.js")
    .then(({ initializeAnalytics }) => initializeAnalytics())
    .catch(() => {});
}

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(loadAnalyticsWhenIdle, { timeout: 2500 });
} else {
  window.setTimeout(loadAnalyticsWhenIdle, 1500);
}
