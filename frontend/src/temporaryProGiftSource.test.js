import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("landing page clearly describes temporary complimentary Pro access", () => {
  const source = read("./LandingPage.jsx");
  assert.match(source, /Everyone gets Pro for now/);
  assert.match(source, /Complimentary Pro gift/);
  assert.match(source, /does not create a paid subscription/i);
  assert.match(source, /does not.*authorize future recurring charges/i);
  assert.match(source, /separate checkout and billing consent/i);
});

test("upgrade page does not solicit a new paid checkout during the gift", () => {
  const source = read("./UpgradePage.jsx");
  assert.match(source, /complimentary for now/i);
  assert.match(source, /does not create a paid subscription/i);
  assert.match(source, /does not authorize recurring charges/i);
  assert.match(source, /must separately complete checkout and consent/i);
  assert.doesNotMatch(source, /checkout-session/);
  assert.doesNotMatch(source, /automatically renewing subscription/);
});

test("interim terms distinguish the gift from future paid subscriptions", () => {
  const source = read("./InterimLegalNotice.jsx");
  assert.match(source, /Temporary complimentary Pro access/);
  assert.match(source, /not a paid subscription/i);
  assert.match(source, /does not authorize recurring charges/i);
  assert.match(source, /separate purchase flow and billing consent/i);
  assert.match(source, /Existing paid subscriptions are separate/i);
});
