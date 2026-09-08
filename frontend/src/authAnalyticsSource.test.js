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

const analyticsCalls = authPage.match(/trackAnalyticsEvent\([^;\n]+/g) ?? [];
assert.ok(analyticsCalls.length >= 4, "expected signup analytics calls to be present");
for (const call of analyticsCalls) {
  assert.doesNotMatch(
    call,
    /\b(?:email|name|password|formData)\s*:/,
    "analytics payloads must not define personal form-field keys",
  );
  assert.doesNotMatch(
    call,
    /formData\./,
    "analytics payloads must not read personal form-field values",
  );
}

console.log("Auth analytics source wiring passed.");
