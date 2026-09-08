import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authPage = readFileSync(new URL("./AuthPage.jsx", import.meta.url), "utf8");

assert.match(authPage, /ANALYTICS_EVENTS, trackAnalyticsEvent/);
assert.match(
  authPage,
  /trackAnalyticsEvent\(ANALYTICS_EVENTS\.SIGNUP_STARTED, \{ method: "email_password" \}\)/,
  "email/password registration must record a signup attempt",
);
assert.match(
  authPage,
  /if \(!response\.ok\) throw new Error\([\s\S]*?trackAnalyticsEvent\(ANALYTICS_EVENTS\.SIGN_UP, \{ method: "email_password" \}\)/,
  "completed email signup must be counted only after a successful registration response",
);
assert.match(authPage, /OAUTH_SIGNUP_ATTEMPT_KEY/);
assert.match(authPage, /rememberOAuthSignupAttempt\(provider\)/);
assert.match(authPage, /consumeOAuthSignupAttempt\(\)/);
assert.match(
  authPage,
  /if \(signupProvider\) \{\s*trackAnalyticsEvent\(ANALYTICS_EVENTS\.SIGN_UP, \{ method: signupProvider \}\)/,
  "OAuth signup completion must require the short-lived signup-attempt marker",
);
assert.match(
  authPage,
  /trackAnalyticsEvent\(ANALYTICS_EVENTS\.SIGNUP_STARTED, \{ method: provider \}\)/,
  "OAuth registration must record a signup attempt only at the redirect boundary",
);
assert.doesNotMatch(
  authPage,
  /trackAnalyticsEvent\([^\n]*(email|name|formData|password)/,
  "signup analytics calls must never include personal form fields",
);

console.log("Auth analytics source wiring passed.");
