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

test("paid upgrade page is paused and cannot initiate Stripe checkout", () => {
  const source = read("./UpgradePage.jsx");
  assert.match(source, /Pro is temporarily unlocked for everyone/);
  assert.match(source, /Paid upgrades are paused right now/);
  assert.match(source, /No new BragStack Pro subscription is required/);
  assert.doesNotMatch(source, /\/billing\/checkout-session/);
  assert.doesNotMatch(source, /Continue to secure Stripe checkout/);
});

test("support center has categorized intake and warns against sensitive data", () => {
  const source = read("./SupportPage.jsx");
  assert.match(source, /Bug \/ something is broken/);
  assert.match(source, /Billing \/ subscription/);
  assert.match(source, /Education \/ applications/);
  assert.match(source, /Privacy \/ security/);
  assert.match(source, /Do not submit passwords, access tokens, API keys/);
  assert.match(source, /\/beta\/support-ticket/);
});

test("public portfolio avatar repair stays active across React rerenders", () => {
  const source = read("./publicPortfolioAvatar.js");
  assert.match(source, /MutationObserver/);
  assert.match(source, /60000/);
  assert.match(source, /data-bragstack-profile-avatar|bragstackProfileAvatar/);
});
