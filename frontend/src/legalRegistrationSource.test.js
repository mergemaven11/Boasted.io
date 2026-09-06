import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("registration visibly requires legal acceptance without an age gate", () => {
  const source = read("./AuthPage.jsx");
  assert.doesNotMatch(source, /age_18_or_older/);
  assert.doesNotMatch(source, /BragStack is 18\+/);
  assert.doesNotMatch(source, /auth-age-gate/);
  assert.match(source, /accepted_terms/);
  assert.match(source, /accepted_privacy/);
  assert.match(source, /Terms and Conditions/);
  assert.match(source, /Privacy Policy/);
  assert.match(source, /records the current policy versions/i);
});

test("new OAuth sign-up is available only after legal acceptance", () => {
  const source = read("./AuthPage.jsx");
  assert.doesNotMatch(source, /Temporarily paused for new accounts/);
  assert.match(source, /accepted_terms=true/);
  assert.match(source, /accepted_privacy=true/);
  assert.match(source, /Please accept the Terms and Privacy Policy before continuing with Google or GitHub/);
  assert.match(source, /or sign up with/);
  assert.match(source, /Continue with Google/);
  assert.match(source, /Continue with GitHub/);
});

test("education capture removes middle-school logic and exposes older-student presets", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.doesNotMatch(source, /Middle School/);
  assert.doesNotMatch(source, /18\+/);
  assert.match(source, /education_feature/);
  assert.match(source, /coursework/);
  assert.match(source, /academic-projects/);
  assert.match(source, /certifications/);
  assert.match(source, /group-projects/);
  assert.match(source, /graduation-progress/);
  assert.match(source, /experience-translator/);
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
