import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./ReferencePolish.css";
import "./MarketingFooterOrder.css";
import "./ResponsiveLayoutGuard.css";
import "./ImpactReceiptsResponsive.css";
import "./VerifiedImpact.css";
import "./ProfileUploadPolish.css";
import AnalyticsConsentBanner from "./AnalyticsConsentBanner.jsx";
import PublicAuthHeader from "./PublicAuthHeader.jsx";
import RootContent from "./RootContent.jsx";
import { installInterviewBrowserPreflight } from "./interviewBrowserPreflight.js";
import { installPublicPortfolioAvatar } from "./publicPortfolioAvatar.js";

installInterviewBrowserPreflight();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PublicAuthHeader />
    <RootContent />
    <AnalyticsConsentBanner />
  </StrictMode>,
);

void installPublicPortfolioAvatar();
