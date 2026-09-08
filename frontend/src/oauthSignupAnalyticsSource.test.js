import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const analyticsSource = readFileSync(new URL("./analytics.js", import.meta.url), "utf8");
const authPageSource = readFileSync(new URL("./AuthPage.jsx", import.meta.url), "utf8");
const oauthBackendSource = readFileSync(new URL("../../backend/app/oauth_routes.py", import.meta.url), "utf8");

assert.match(
  oauthBackendSource,
  /oauth_token=\{token\}&oauth_created=\{created\}/,
  "OAuth callbacks must tell the frontend whether a new account was actually created",
);
assert.match(
  oauthBackendSource,
  /_oauth_account_created["']?: created|"_oauth_account_created": created/,
  "OAuth creation status must be ephemeral callback state rather than inferred in the browser",
);
assert.match(
  analyticsSource,
  /OAUTH_SIGNUP_METHODS = new Set\(\["google", "github"\]\)/,
  "known OAuth signup methods must use the stricter completion contract",
);
assert.match(
  analyticsSource,
  /hash\.get\("oauth_created"\) === "1"/,
  "OAuth sign_up must require backend-confirmed account creation",
);
assert.match(
  analyticsSource,
  /if \(!isConfirmedSignupEvent\(eventName, parameters\)\) return false;/,
  "unconfirmed OAuth signups must be rejected before emitting GA or activation milestones",
);
assert.match(
  authPageSource,
  /consumeOAuthSignupAttempt\(\)/,
  "the frontend must still require a short-lived Create Account attempt to identify the OAuth method",
);

console.log("OAuth signup analytics source contract passed.");
