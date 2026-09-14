import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const loader = await readFile(new URL("../public/hubspot-loader.js", import.meta.url), "utf8");
const injector = await readFile(new URL("../scripts/inject-hubspot-loader.mjs", import.meta.url), "utf8");
const publicAnalytics = await readFile(new URL("./publicAnalytics.js", import.meta.url), "utf8");
const consentBanner = await readFile(new URL("./AnalyticsConsentBanner.jsx", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

describe("HubSpot tracking integration", () => {
  it("uses the Boasted HubSpot portal and official tracking script", () => {
    assert.match(loader, /247379152/);
    assert.match(loader, /https:\/\/js-na2\.hs-scripts\.com\/\$\{HUBSPOT_PORTAL_ID\}\.js/);
    assert.match(loader, /hs-script-loader/);
  });

  it("keeps HubSpot off until Boasted analytics consent is granted", () => {
    assert.match(loader, /boasted_analytics_consent_v1/);
    assert.match(loader, /ANALYTICS_CONSENT_GRANTED = "granted"/);
    assert.match(loader, /!analyticsAllowed\(\)/);
  });

  it("never sends auth fragments or arbitrary query strings to HubSpot", () => {
    assert.match(loader, /SENSITIVE_HASH_KEYS/);
    assert.match(loader, /oauth_token/);
    assert.match(loader, /verify_token/);
    assert.match(loader, /reset_token/);
    assert.match(loader, /hasSensitiveAuthFragment\(\)/);
    assert.match(loader, /return window\.location\.pathname \|\| "\/"/);
    assert.doesNotMatch(loader, /window\.location\.hash}`/);
    assert.doesNotMatch(loader, /window\.location\.search}\$\{window\.location\.hash/);
  });

  it("honors analytics revocation after HubSpot has loaded", () => {
    assert.match(loader, /\["doNotTrack"\]/);
    assert.match(loader, /disableHubSpotTracking/);
  });

  it("tracks SPA navigation after HubSpot is available", () => {
    assert.match(loader, /\["setPath", path\]/);
    assert.match(loader, /\["trackPageView"\]/);
    assert.match(loader, /pushState/);
    assert.match(loader, /replaceState/);
    assert.match(loader, /popstate/);
  });

  it("gates first-party public profile analytics on the same consent", () => {
    assert.match(publicAnalytics, /hasAnalyticsConsent/);
    assert.match(publicAnalytics, /!hasAnalyticsConsent\(\)/);
    assert.match(publicAnalytics, /clearPublicAnalyticsIdentity/);
    assert.match(consentBanner, /clearPublicAnalyticsIdentity/);
    assert.match(consentBanner, /ANALYTICS_CONSENT_DENIED/);
  });

  it("injects the loader into every built HTML page", () => {
    assert.match(injector, /entry\.name\.endsWith\("\.html"\)/);
    assert.match(injector, /hubspot-loader\.js/);
    assert.match(packageJson.scripts.build, /inject-hubspot-loader\.mjs/);
  });
});
