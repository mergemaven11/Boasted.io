import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  ANALYTICS_EVENTS,
  GA_MEASUREMENT_ID,
  captureCampaignAttribution,
  getCampaignEventParameters,
  initializeAnalytics,
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
}

function setUrl(path) {
  globalThis.window.location = new URL(path, "https://usebragstack.com");
}

function installBrowserFakes() {
  const scripts = [];
  globalThis.window = {
    location: new URL("https://usebragstack.com/"),
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

describe("BragStack analytics", () => {
  beforeEach(() => {
    installBrowserFakes();
  });

  it("loads the BragStack GA4 tag and configures the measurement ID once", () => {
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
    const event = window.dataLayer.find(
      (entry) => entry[0] === "event" && entry[1] === ANALYTICS_EVENTS.SIGN_UP,
    );
    assert.ok(event);
    assert.equal(event[2].method, "email_password");
    assert.equal(event[2].utm_source, "linkedin");
    assert.equal(event[2].utm_medium, "social");
    assert.equal(event[2].utm_campaign, "beta");
    assert.equal(event[2].first_utm_source, "linkedin");
  });
});
