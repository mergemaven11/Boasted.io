import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./ProductPolish.css";
import "./ReferencePolish.css";
import "./MarketingFooterOrder.css";
import "./InterviewScoringCalibration.css";
import RootContent from "./RootContent.jsx";
import { initializeAnalytics } from "./analytics.js";

initializeAnalytics();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootContent />
  </StrictMode>,
);
