import { useEffect, useState } from "react";

import {
  ANALYTICS_CONSENT_DENIED,
  ANALYTICS_CONSENT_GRANTED,
  getAnalyticsConsent,
  initializeAnalytics,
  setAnalyticsConsent,
} from "./analytics.js";
import "./AnalyticsConsentBanner.css";

export default function AnalyticsConsentBanner() {
  const [choice, setChoice] = useState(() => getAnalyticsConsent());
  const [editing, setEditing] = useState(() => getAnalyticsConsent() === null);

  useEffect(() => {
    if (choice === ANALYTICS_CONSENT_GRANTED) initializeAnalytics();
  }, [choice]);

  function choose(nextChoice) {
    if (!setAnalyticsConsent(nextChoice)) return;
    setChoice(nextChoice);
    setEditing(false);
    if (nextChoice === ANALYTICS_CONSENT_GRANTED) initializeAnalytics();
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="analytics-consent-trigger"
        onClick={() => setEditing(true)}
        aria-label="Open privacy choices"
      >
        Privacy choices
      </button>
    );
  }

  return (
    <aside className="analytics-consent" aria-label="Analytics privacy choices">
      <div>
        <strong>Privacy choices</strong>
        <p>
          Boasted uses essential browser storage for sign-in and core features. With your permission,
          we also use analytics to understand product usage and campaign performance. Analytics stays
          off unless you choose Allow analytics. See the <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" className="analytics-consent-essential" onClick={() => choose(ANALYTICS_CONSENT_DENIED)}>
          Essential only
        </button>
        <button type="button" className="analytics-consent-allow" onClick={() => choose(ANALYTICS_CONSENT_GRANTED)}>
          Allow analytics
        </button>
        {choice !== null && (
          <button type="button" className="analytics-consent-close" onClick={() => setEditing(false)}>
            Close
          </button>
        )}
      </div>
    </aside>
  );
}
