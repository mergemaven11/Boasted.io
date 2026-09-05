import assert from "node:assert/strict";
import test from "node:test";

import {
  CONFIDENTIALITY_ATTESTATION_VERSION,
  armConfidentialityAttestation,
  consumeConfidentialityAttestation,
  isConfidentialityProtectedRequest,
  makeAccomplishmentNdaSafe,
  makeImpactReceiptNdaSafe,
  sanitizeNdaText,
  scanAccomplishmentDraft,
  scanImpactReceiptDraft,
  scanSensitiveText,
} from "./ndaSafety.js";

function hasFinding(findings, id, severity = null) {
  return findings.some((item) => item.id === id && (!severity || item.severity === severity));
}

const blockingCases = [
  ["generic private key", "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----", "private-key"],
  ["RSA private key", "-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----", "private-key"],
  ["OpenSSH private key", "-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----", "private-key"],
  ["authorization bearer token", "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456", "bearer-token"],
  ["bare bearer token", "bearer abcdefghijklmnopqrstuvwxyz123456", "bearer-token"],
  ["password assignment", "password=hunter2-secret", "secret-assignment"],
  ["API key assignment", "api_key: abcdefghijklmnop", "secret-assignment"],
  ["access token assignment", "access-token=abcdefghijklmnop", "secret-assignment"],
  ["client secret assignment", "client_secret='abcdefghijklmnop'", "secret-assignment"],
  ["AWS access key", "AKIAABCDEFGHIJKLMNOP", "provider-token"],
  ["GitHub token", "ghp_12345678901234567890", "provider-token"],
  ["Slack token", "xoxb-1234567890-abcdefghij", "provider-token"],
  ["sk provider token", "sk-123456789012345678901234", "provider-token"],
  ["JWT-like token", "eyJabcdefgh.abcdefgh.abcdefghij", "jwt"],
];

for (const [name, value, expectedId] of blockingCases) {
  test(`scanner blocks ${name}`, () => {
    const findings = scanSensitiveText(value, "Action");
    assert.equal(hasFinding(findings, expectedId, "block"), true);
  });
}

test("blocking findings never echo submitted secret values", () => {
  const secret = "api_key=super-secret-value";
  const findings = scanSensitiveText(secret, "Action");
  assert.equal(findings.some((item) => item.severity === "block"), true);
  assert.equal(findings.some((item) => item.message.includes("super-secret-value")), false);
});

const warningCases = [
  ["fenced code block", "Implemented this:\n```python\nprint('internal')\n```", "code-block"],
  ["Python traceback", "Traceback (most recent call last):\n  File x.py", "stack-trace"],
  ["error log", "ERROR database connection refused", "stack-trace"],
  ["exception text", "RuntimeError: private service failed", "stack-trace"],
  ["localhost URL", "http://localhost:8000/admin", "internal-url"],
  ["loopback URL", "http://127.0.0.1:9000/debug", "internal-url"],
  ["10/8 private URL", "https://10.1.2.3/status", "internal-url"],
  ["192.168 private URL", "https://192.168.4.20/status", "internal-url"],
  ["172.16 private URL", "https://172.16.2.8/status", "internal-url"],
  ["internal TLD URL", "https://service.internal/run/12", "internal-url"],
  ["corp TLD URL", "https://jira.corp/ABC-123", "internal-url"],
  ["local TLD URL", "https://dashboard.local/metrics", "internal-url"],
  ["ticket-style work item", "Resolved PLATFORM-482 before release", "work-item"],
  ["private repository wording", "See the private repository for details", "restricted-keyword"],
  ["internal ticket wording", "The internal ticket contains the logs", "restricted-keyword"],
  ["production log wording", "Copied production logs into the draft", "restricted-keyword"],
  ["customer data wording", "Reviewed customer data to debug the issue", "restricted-keyword"],
  ["credential wording", "Attached credentials to the ticket", "restricted-keyword"],
];

for (const [name, value, expectedId] of warningCases) {
  test(`scanner warns on ${name}`, () => {
    const findings = scanSensitiveText(value, "Draft");
    assert.equal(hasFinding(findings, expectedId, "warning"), true);
  });
}

const safeCases = [
  "Improved maintainability of an internal platform while preserving behavior.",
  "Added API key authentication support without including sensitive values.",
  "Improved token refresh handling and automated test coverage.",
  "Public documentation: https://docs.python.org/3/",
  "Resolved issue ABC-1 and documented the customer-facing outcome.",
  "Worked with an enterprise customer on a generalized support workflow.",
  "Reduced manual effort by improving an approved public integration.",
  "Added validation for two supported authentication paths.",
];

for (const value of safeCases) {
  test(`scanner leaves ordinary career statement unflagged: ${value.slice(0, 42)}`, () => {
    assert.deepEqual(scanSensitiveText(value, "Draft"), []);
  });
}

test("scanner does not duplicate the same rule for the same field", () => {
  const findings = scanSensitiveText("production logs and more production logs", "Evidence");
  assert.equal(findings.filter((item) => item.id === "restricted-keyword").length, 1);
});

test("sanitizer removes credentials", () => {
  const output = sanitizeNdaText("Before api_key=abcdefghijklmnop after");
  assert.doesNotMatch(output, /abcdefghijklmnop/);
  assert.match(output, /credential removed/);
});

test("sanitizer removes complete private key material", () => {
  const output = sanitizeNdaText("x\n-----BEGIN PRIVATE KEY-----\nsecretbody\n-----END PRIVATE KEY-----\ny");
  assert.doesNotMatch(output, /secretbody/);
  assert.match(output, /credential removed/);
});

test("sanitizer omits fenced code blocks", () => {
  const output = sanitizeNdaText("Built a tool\n```js\nconst privateValue = 7;\n```\nImproved visibility");
  assert.doesNotMatch(output, /privateValue/);
  assert.match(output, /technical implementation omitted/);
});

test("sanitizer omits URLs by default", () => {
  const output = sanitizeNdaText("Reference https://example.com/private-looking/path for proof");
  assert.doesNotMatch(output, /example\.com/);
  assert.match(output, /reference omitted/);
});

test("sanitizer may preserve an explicitly allowed public URL", () => {
  const output = sanitizeNdaText("Reference https://example.com/public-proof", { preservePublicUrls: true });
  assert.match(output, /https:\/\/example\.com\/public-proof/);
});

test("sanitizer generalizes ticket-style identifiers", () => {
  const output = sanitizeNdaText("Resolved APP-204 and APP-205");
  assert.doesNotMatch(output, /APP-20[45]/);
  assert.equal((output.match(/internal work item/g) || []).length, 2);
});

test("sanitizer generalizes a bare private host", () => {
  const output = sanitizeNdaText("The job ran on ingestion.service.internal overnight");
  assert.doesNotMatch(output, /ingestion\.service\.internal/);
  assert.match(output, /internal system/);
});

test("sanitizer removes diagnostic lines while retaining career context", () => {
  const output = sanitizeNdaText("Improved reliability\nERROR private database failed\nDocumented the outcome");
  assert.match(output, /Improved reliability/);
  assert.match(output, /Documented the outcome/);
  assert.doesNotMatch(output, /private database failed/);
  assert.match(output, /internal diagnostic details omitted/);
});

test("sanitizer normalizes excess whitespace", () => {
  assert.equal(sanitizeNdaText("  Improved   reliability\n\n\nDocumented   outcome  "), "Improved reliability\n\nDocumented outcome");
});

test("accomplishment scanner warns when public sharing is enabled", () => {
  const findings = scanAccomplishmentDraft({ title: "Public-safe title", is_public: true });
  assert.equal(hasFinding(findings, "public-review", "warning"), true);
});

test("accomplishment scanner scans high-risk content across fields", () => {
  const findings = scanAccomplishmentDraft({
    title: "Improved reliability",
    situation: "https://jira.corp/OPS-404",
    action: "password=abcdefghijklmnop",
    impact: "Restored service",
  });
  assert.equal(hasFinding(findings, "internal-url", "warning"), true);
  assert.equal(hasFinding(findings, "secret-assignment", "block"), true);
});

test("accomplishment sanitizer removes URLs, work-item ids, and public sharing", () => {
  const original = {
    title: "Fixed ABC-123",
    situation: "See https://internal.corp/ticket/123",
    action: "Updated the internal workflow",
    impact: "Restored service",
    lesson: "",
    category: "Platform Engineering",
    is_public: true,
  };
  const result = makeAccomplishmentNdaSafe(original);
  assert.match(result.title, /internal work item/);
  assert.doesNotMatch(result.situation, /internal\.corp/);
  assert.equal(result.is_public, false);
  assert.equal(result.category, "Platform Engineering");
  assert.equal(original.is_public, true);
});

test("receipt scanner warns on exact metrics", () => {
  const findings = scanImpactReceiptDraft({ metricValue: "17.4%", evidence: [] });
  assert.equal(hasFinding(findings, "metric-review", "warning"), true);
});

test("receipt scanner warns when an evidence reference is not marked public", () => {
  const findings = scanImpactReceiptDraft({
    evidence: [{ title: "Ticket", reference: "https://example.com/reference", source_is_public: false }],
  });
  assert.equal(findings.some((item) => item.id === "private-reference-0" && item.severity === "warning"), true);
});

test("receipt scanner gives public-source ceiling reminder for public evidence", () => {
  const findings = scanImpactReceiptDraft({
    evidence: [{ title: "Public MR", reference: "https://gitlab.com/example/repo/-/merge_requests/7", source_is_public: true }],
  });
  assert.equal(findings.some((item) => item.id === "public-source-ceiling-0" && item.severity === "info"), true);
});

test("receipt scanner warns when receipt sharing is public", () => {
  const findings = scanImpactReceiptDraft({ isPublic: true, evidence: [] });
  assert.equal(hasFinding(findings, "public-review", "warning"), true);
});

test("receipt scanner warns when any evidence item is public", () => {
  const findings = scanImpactReceiptDraft({ evidence: [{ title: "Proof", is_public: true }] });
  assert.equal(hasFinding(findings, "public-review", "warning"), true);
});

test("receipt scanner scans evidence text for secrets", () => {
  const findings = scanImpactReceiptDraft({
    evidence: [{ title: "Proof", reference: "", description: "client_secret=abcdefghijklmnop" }],
  });
  assert.equal(hasFinding(findings, "secret-assignment", "block"), true);
});

test("receipt sanitizer clears exact metrics and nonpublic references", () => {
  const result = makeImpactReceiptNdaSafe({
    accomplishment: "Improved a workflow",
    contribution: "Implemented the fix",
    result: "Reduced failures",
    metricLabel: "Internal error rate",
    metricValue: "17.4%",
    metricContext: "production",
    evidence: [{ title: "Ticket", reference: "https://jira.internal/ABC-123", description: "Private details", source_is_public: false, is_public: true }],
    isPublic: true,
  });
  assert.equal(result.metricValue, "");
  assert.equal(result.evidence[0].reference, "");
  assert.equal(result.evidence[0].is_public, false);
  assert.equal(result.isPublic, false);
});

test("receipt sanitizer resets both supported public flags", () => {
  const result = makeImpactReceiptNdaSafe({ evidence: [], isPublic: true, is_public: true });
  assert.equal(result.isPublic, false);
  assert.equal(result.is_public, false);
});

test("receipt sanitizer can preserve a user-confirmed external public reference", () => {
  const result = makeImpactReceiptNdaSafe({
    accomplishment: "Added support",
    contribution: "Implemented support",
    result: "Expanded compatibility",
    evidence: [{ title: "Public MR", reference: "https://gitlab.com/example/project/-/merge_requests/7", description: "Public change", source_is_public: true, is_public: false }],
  });
  assert.equal(result.evidence[0].reference, "https://gitlab.com/example/project/-/merge_requests/7");
});

test("receipt sanitizer refuses to preserve an internal URL even if marked public", () => {
  const result = makeImpactReceiptNdaSafe({
    evidence: [{ title: "Reference", reference: "https://dashboard.internal/run/1", source_is_public: true, is_public: true }],
  });
  assert.equal(result.evidence[0].reference, "");
  assert.equal(result.evidence[0].is_public, false);
});

test("receipt sanitizer leaves original evidence object unchanged", () => {
  const original = {
    evidence: [{ title: "Proof", reference: "https://example.com/private", source_is_public: false, is_public: true }],
    isPublic: true,
  };
  const result = makeImpactReceiptNdaSafe(original);
  assert.equal(original.evidence[0].reference, "https://example.com/private");
  assert.equal(original.evidence[0].is_public, true);
  assert.equal(result.evidence[0].reference, "");
});

test("one-time attestation is consumed once", () => {
  armConfidentialityAttestation();
  assert.equal(consumeConfidentialityAttestation(), CONFIDENTIALITY_ATTESTATION_VERSION);
  assert.equal(consumeConfidentialityAttestation(), null);
});

const protectedRequestCases = [
  ["post", "/entries", true],
  ["post", "/entries/", true],
  ["put", "/entries/abc", true],
  ["put", "/entries/abc?source=ui", true],
  ["patch", "/entries/abc", true],
  ["post", "/impact-receipts", true],
  ["post", "/impact-receipts/", true],
  ["post", "/impact-receipts/from-entry/abc", true],
  ["patch", "/impact-receipts/abc", true],
  ["get", "/entries", false],
  ["delete", "/entries/abc", false],
  ["get", "/impact-receipts", false],
  ["delete", "/impact-receipts/abc", false],
  ["post", "/auth/login", false],
  ["post", "/packets/performance-review-v12", false],
  ["patch", "/auth/me/profile", false],
];

for (const [method, url, expected] of protectedRequestCases) {
  test(`protected request matcher: ${method.toUpperCase()} ${url} => ${expected}`, () => {
    assert.equal(isConfidentialityProtectedRequest(method, url), expected);
  });
}
