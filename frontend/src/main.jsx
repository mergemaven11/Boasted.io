import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./ReferencePolish.css";
import "./MarketingFooterOrder.css";
import "./ResponsiveLayoutGuard.css";
import "./ImpactReceiptsResponsive.css";
import "./VerifiedImpact.css";
import "./ProfileUploadPolish.css";
import PublicAuthHeader from "./PublicAuthHeader.jsx";
import RootContent from "./RootContent.jsx";
import { installInterviewBrowserPreflight } from "./interviewBrowserPreflight.js";
import { installPublicPortfolioAvatar } from "./publicPortfolioAvatar.js";

installInterviewBrowserPreflight();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PublicAuthHeader />
    <RootContent />
  </StrictMode>,
);

void installPublicPortfolioAvatar();

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
