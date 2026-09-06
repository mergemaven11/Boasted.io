import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const api = readFileSync(new URL("./api.js", import.meta.url), "utf8");


test("protected API writes consume the one-time browser attestation", () => {
  assert.match(api, /consumeConfidentialityAttestation/);
  assert.match(api, /isConfidentialityProtectedRequest/);
  assert.match(api, /const attestationVersion = consumeConfidentialityAttestation\(\)/);
});


test("client mints a server attestation before a protected write", () => {
  assert.match(api, /\/confidentiality\/attestations/);
  assert.match(api, /confirmed:\s*true/);
  assert.match(api, /method:\s*String\(method/);
  assert.match(api, /path,/);
});


test("attestation mint uses bare axios to avoid recursively invoking the protected interceptor", () => {
  assert.match(api, /const response = await axios\.post\(/);
  assert.doesNotMatch(api, /api\.post\(\s*["']\/confidentiality\/attestations/);
});


test("protected write carries the server one-time attestation header", () => {
  assert.match(api, /X-Boasted-Confidentiality-Attestation/);
  assert.match(api, /config\.headers\[CONFIDENTIALITY_ATTESTATION_HEADER\] = serverToken/);
});


test("attestation mint sends control metadata rather than the career draft", () => {
  const mintBlock = api.slice(
    api.indexOf("async function mintServerConfidentialityAttestation"),
    api.indexOf("api.interceptors.request.use"),
  );
  assert.match(mintBlock, /version,/);
  assert.match(mintBlock, /confirmed:\s*true/);
  assert.doesNotMatch(mintBlock, /accomplishment|contribution|situation|impact|evidence|draft/);
});


test("requests without a local confirmation do not receive a fabricated server token", () => {
  assert.match(api, /if \(!attestationVersion\) return config/);
});
