import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./ReferencePolish.css";
import "./MarketingFooterOrder.css";
import "./ResponsiveLayoutGuard.css";
import "./ImpactReceiptsResponsive.css";
import "./VerifiedImpact.css";
import "./ProfileUploadPolish.css";
import "./ProfileAppearancePreview.css";
import "./UiUxFoundation.css";
import "./ProfileTemplateRegressionFixes.css";
import "./ProfileDesktopBalance.css";
import "./ProfileResponsiveSafety.css";
import NDAInformationGate from "./NDAInformationGate.jsx";
import PublicAuthHeader from "./PublicAuthHeader.jsx";
import RootContent from "./RootContent.jsx";
import { installInterviewBrowserPreflight } from "./interviewBrowserPreflight.js";
import { installPublicPortfolioAvatar } from "./publicPortfolioAvatar.js";
import { installProfileAppearancePreview } from "./profileAppearancePreview.js";

installInterviewBrowserPreflight();
installProfileAppearancePreview();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NDAInformationGate />
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
