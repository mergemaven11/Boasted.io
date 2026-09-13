import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const loader = await readFile(new URL("../public/hubspot-loader.js", import.meta.url), "utf8");
const injector = await readFile(new URL("../scripts/inject-hubspot-loader.mjs", import.meta.url), "utf8");
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
    assert.match(loader, /if \(!analyticsAllowed\(\)\) return false/);
  });

  it("tracks SPA navigation after HubSpot is available", () => {
    assert.match(loader, /\["setPath", path\]/);
    assert.match(loader, /\["trackPageView"\]/);
    assert.match(loader, /pushState/);
    assert.match(loader, /replaceState/);
    assert.match(loader, /popstate/);
  });

  it("injects the loader into every built HTML page", () => {
    assert.match(injector, /entry\.name\.endsWith\("\.html"\)/);
    assert.match(injector, /hubspot-loader\.js/);
    assert.match(packageJson.scripts.build, /inject-hubspot-loader\.mjs/);
  });
});
