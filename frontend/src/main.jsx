import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./ProductPolish.css";
import "./ReferencePolish.css";
import "./MarketingFooterOrder.css";
import RootContent from "./RootContent.jsx";

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
