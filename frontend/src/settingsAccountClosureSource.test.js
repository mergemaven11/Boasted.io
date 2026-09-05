import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const settingsSource = readFileSync(new URL("./SettingsPage.jsx", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("./accountApi.js", import.meta.url), "utf8");

const cases = [
  ["shows a close account action in Settings", /Close account/],
  ["uses explicit Are you sure confirmation copy", /Are you sure\?/],
  ["explains that closure cannot be undone", /cannot be undone/i],
  ["explains that user-owned workspace data is removed", /user-owned workspace data/i],
  ["warns that limited compliance records may be retained", /billing, security, legal, or operational records may be retained/i],
  ["warns active paid subscribers to cancel first", /active paid subscription/i],
  ["provides a cancel action", />\s*Cancel\s*</],
  ["provides a destructive final confirmation action", /Yes, close my account/],
  ["clears the local auth token after success", /localStorage\.removeItem\("bragstack_token"\)/],
  ["redirects away from the authenticated app after closure", /window\.location\.assign\("\/login\?account=closed"\)/],
  ["renders server errors in an alert", /role="alert"/],
  ["supports Escape to dismiss before destructive submission", /event\.key === "Escape"/],
];

for (const [name, pattern] of cases) {
  test(name, () => assert.match(settingsSource, pattern));
}

test("account API uses authenticated destructive endpoint", () => {
  assert.match(apiSource, /delete\("\/auth\/me\/account"/);
  assert.match(apiSource, /confirmation: "CLOSE"/);
  assert.match(apiSource, /Authorization = `Bearer \$\{token\}`/);
});
