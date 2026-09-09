import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  ANALYTICS_CONSENT_DENIED,
  ANALYTICS_CONSENT_GRANTED,
  ANALYTICS_EVENTS,
  GA_MEASUREMENT_ID,
  captureCampaignAttribution,
  getAnalyticsConsent,
  getCampaignEventParameters,
  initializeAnalytics,
  setAnalyticsConsent,
  trackAnalyticsEvent,
} from "./analytics.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function setUrl(path) {
  globalThis.window.location = new URL(path, "https://boasted.io");
}

function installBrowserFakes() {
  const scripts = [];
  globalThis.window = {
    location: new URL("https://boasted.io/"),
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
  };
  globalThis.document = {
    createElement() {
      return { async: false, src: "", dataset: {} };
    },
    head: {
      appendChild(node) {
        scripts.push(node);
        return node;
      },
      querySelector(selector) {
        if (selector !== "script[data-bragstack-analytics]") return null;
        return scripts.find((node) => node.dataset?.bragstackAnalytics === "true") ?? null;
      },
      querySelectorAll(selector) {
        if (selector !== "script[data-bragstack-analytics]") return [];
        return scripts.filter((node) => node.dataset?.bragstackAnalytics === "true");
      },
    },
  };
}

function productEvents(name) {
  return (window.dataLayer || []).filter((entry) => entry[0] === "event" && entry[1] === name);
}

describe("Boasted analytics", () => {
  beforeEach(() => {
    installBrowserFakes();
    setAnalyticsConsent(ANALYTICS_CONSENT_GRANTED);
  });

  it("keeps analytics off until the user explicitly allows it", () => {
    installBrowserFakes();
    setUrl("/?utm_source=linkedin&utm_campaign=launch");

    assert.equal(getAnalyticsConsent(), null);
    assert.equal(initializeAnalytics(), false);
    assert.deepEqual(captureCampaignAttribution(), {});
    assert.equal(trackAnalyticsEvent(ANALYTICS_EVENTS.SIGN_UP, { method: "email_password" }), false);
    assert.equal(document.head.querySelectorAll("script[data-bragstack-analytics]").length, 0);
    assert.equal(window.sessionStorage.getItem("bragstack_session_utm"), null);
  });

  it("honors Essential only and does not emit product events", () => {
    setAnalyticsConsent(ANALYTICS_CONSENT_DENIED);

    assert.equal(getAnalyticsConsent(), ANALYTICS_CONSENT_DENIED);
    assert.equal(initializeAnalytics(), false);
    assert.equal(trackAnalyticsEvent(ANALYTICS_EVENTS.ACCOMPLISHMENT_CREATED), false);
    assert.equal(window[`ga-disable-${GA_MEASUREMENT_ID}`], true);
    assert.equal(document.head.querySelectorAll("script[data-bragstack-analytics]").length, 0);
  });

  it("loads the Boasted GA4 tag and configures the measurement ID once", () => {
    initializeAnalytics();
    initializeAnalytics();

    const script = document.head.querySelector("script[data-bragstack-analytics]");
    assert.ok(script);
    assert.match(script.src, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${GA_MEASUREMENT_ID}`));
    assert.equal(
      window.dataLayer.filter((entry) => entry[0] === "config" && entry[1] === GA_MEASUREMENT_ID).length,
      1,
    );
    assert.equal(document.head.querySelectorAll("script[data-bragstack-analytics]").length, 1);
  });

  it("captures approved UTM attribution without storing unrelated query parameters", () => {
    setUrl(
      "/?utm_source=linkedin&utm_medium=paid_social&utm_campaign=founder_launch&utm_source_platform=linkedin_ads&utm_content=profile&utm_creative_format=video&utm_marketing_tactic=prospecting&email=private@example.com",
    );

    const captured = captureCampaignAttribution();
    const parameters = getCampaignEventParameters();

    assert.deepEqual(captured, {
      utm_source: "linkedin",
      utm_medium: "paid_social",
      utm_campaign: "founder_launch",
      utm_source_platform: "linkedin_ads",
      utm_content: "profile",
      utm_creative_format: "video",
      utm_marketing_tactic: "prospecting",
    });
    assert.equal(parameters.utm_source, "linkedin");
    assert.equal(parameters.utm_source_platform, "linkedin_ads");
    assert.equal(parameters.first_utm_source, "linkedin");
    assert.equal(parameters.first_utm_source_platform, "linkedin_ads");
    assert.doesNotMatch(JSON.stringify(parameters), /private@example\.com/);
  });

  it("caps UTM values at the GA4 event-parameter value limit", () => {
    const oversizedCampaign = "x".repeat(150);
    setUrl(`/?utm_source=linkedin&utm_campaign=${oversizedCampaign}`);

    const captured = captureCampaignAttribution();

    assert.equal(captured.utm_campaign.length, 100);
  });

  it("keeps first-touch attribution while allowing a later campaign to become the active session campaign", () => {
    setUrl("/?utm_source=linkedin&utm_campaign=launch");
    captureCampaignAttribution();

    window.sessionStorage.clear();
    setUrl("/?utm_source=newsletter&utm_campaign=return_visit");
    captureCampaignAttribution();

    const parameters = getCampaignEventParameters();
    assert.equal(parameters.utm_source, "newsletter");
    assert.equal(parameters.utm_campaign, "return_visit");
    assert.equal(parameters.first_utm_source, "linkedin");
    assert.equal(parameters.first_utm_campaign, "launch");
  });

  it("enriches successful product events with UTM attribution", () => {
    setUrl("/register?utm_source=linkedin&utm_medium=social&utm_campaign=beta");

    const tracked = trackAnalyticsEvent(ANALYTICS_EVENTS.SIGN_UP, {
      method: "email_password",
    });

    assert.equal(tracked, true);
    const event = productEvents(ANALYTICS_EVENTS.SIGN_UP)[0];
    assert.ok(event);
    assert.equal(event[2].method, "email_password");
    assert.equal(event[2].utm_source, "linkedin");
    assert.equal(event[2].utm_medium, "social");
    assert.equal(event[2].utm_campaign, "beta");
    assert.equal(event[2].first_utm_source, "linkedin");
  });

  it("drops sensitive product content while preserving structural metadata", () => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.CAREER_PACKET_EXPORTED, {
      packet_type: "performance-review",
      format: "pdf",
      accomplishment_text: "Saved a customer escalation",
      employer: "Private Employer",
      evidence_url: "https://private.example/evidence",
      organization_name: "Private Org",
    });

    const event = productEvents(ANALYTICS_EVENTS.CAREER_PACKET_EXPORTED)[0];

    assert.ok(event);
    assert.equal(event[2].packet_type, "performance-review");
    assert.equal(event[2].format, "pdf");
    assert.equal(event[2].accomplishment_text, undefined);
    assert.equal(event[2].employer, undefined);
    assert.equal(event[2].evidence_url, undefined);
    assert.equal(event[2].organization_name, undefined);
  });

  it("derives signup and proof milestones only for a newly tracked signup cohort", () => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.SIGN_UP, { method: "email_password" });
    for (let index = 0; index < 5; index += 1) {
      trackAnalyticsEvent(ANALYTICS_EVENTS.ACCOMPLISHMENT_CREATED);
    }

    assert.equal(productEvents(ANALYTICS_EVENTS.SIGNUP_COMPLETED).length, 1);
    assert.equal(productEvents(ANALYTICS_EVENTS.FIRST_PROOF_CREATED).length, 1);
    assert.equal(productEvents(ANALYTICS_EVENTS.SECOND_PROOF_CREATED).length, 1);
    assert.equal(productEvents(ANALYTICS_EVENTS.FIFTH_PROOF_CREATED).length, 1);
    assert.equal(productEvents(ANALYTICS_EVENTS.FIRST_PROOF_CREATED)[0][2].proof_number, 1);
    assert.equal(productEvents(ANALYTICS_EVENTS.FIFTH_PROOF_CREATED)[0][2].proof_number, 5);
  });

  it("derives the first completed Impact Receipt once for the new-user cohort", () => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.SIGN_UP, { method: "email_password" });
    trackAnalyticsEvent(ANALYTICS_EVENTS.IMPACT_RECEIPT_CREATED, { creation_source: "accomplishment" });
    trackAnalyticsEvent(ANALYTICS_EVENTS.IMPACT_RECEIPT_CREATED, { creation_source: "manual" });

    const events = productEvents(ANALYTICS_EVENTS.FIRST_IMPACT_RECEIPT_COMPLETED);
    assert.equal(events.length, 1);
    assert.equal(events[0][2].creation_source, "accomplishment");
  });

  it("does not invent proof milestones for existing users outside the signup cohort", () => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.ACCOMPLISHMENT_CREATED);
    trackAnalyticsEvent(ANALYTICS_EVENTS.IMPACT_RECEIPT_CREATED, { creation_source: "manual" });

    assert.equal(productEvents(ANALYTICS_EVENTS.FIRST_PROOF_CREATED).length, 0);
    assert.equal(productEvents(ANALYTICS_EVENTS.FIRST_IMPACT_RECEIPT_COMPLETED).length, 0);
  });
});
