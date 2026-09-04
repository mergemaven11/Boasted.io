import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("registration visibly requires 18+ and legal acceptance", () => {
  const source = read("./AuthPage.jsx");
  assert.match(source, /BragStack is 18\+ for now/);
  assert.match(source, /age_18_or_older/);
  assert.match(source, /accepted_terms/);
  assert.match(source, /accepted_privacy/);
  assert.match(source, /Terms and Conditions/);
  assert.match(source, /Privacy Policy/);
});

test("new OAuth sign-up is paused while existing OAuth login remains", () => {
  const source = read("./AuthPage.jsx");
  assert.match(source, /Temporarily paused for new accounts/);
  assert.match(source, /Continue with Google/);
  assert.match(source, /Continue with GitHub/);
});

test("middle-school student accounts remain visible as coming soon but disabled", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /Middle School — coming soon for student accounts/);
  assert.match(source, /disabled=\{type === "Middle School"/);
  assert.match(source, /Coming soon/);
  assert.match(source, /18\+/);
});

test("paid checkout requires explicit recurring billing acknowledgement", () => {
  const source = read("./UpgradePage.jsx");
  assert.match(source, /automatically renews every month until you cancel/);
  assert.match(source, /billingAcknowledged/);
  assert.match(source, /Continue to secure Stripe checkout/);
});

test("public portfolio avatar repair stays active across React rerenders", () => {
  const source = read("./publicPortfolioAvatar.js");
  assert.match(source, /MutationObserver/);
  assert.match(source, /60000/);
  assert.match(source, /data-bragstack-profile-avatar|bragstackProfileAvatar/);
});
