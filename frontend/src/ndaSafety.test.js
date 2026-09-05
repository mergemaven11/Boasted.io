import assert from "node:assert/strict";
import test from "node:test";

import {
  CONFIDENTIALITY_ATTESTATION_VERSION,
  armConfidentialityAttestation,
  consumeConfidentialityAttestation,
  isConfidentialityProtectedRequest,
  makeAccomplishmentNdaSafe,
  makeImpactReceiptNdaSafe,
  scanSensitiveText,
} from "./ndaSafety.js";

test("scanner blocks obvious credential material without echoing the secret", () => {
  const secret = "api_key=super-secret-value";
  const findings = scanSensitiveText(secret, "Action");
  assert.equal(findings.some((item) => item.severity === "block"), true);
  assert.equal(findings.some((item) => item.message.includes("super-secret-value")), false);
});

test("accomplishment sanitizer removes URLs, work-item ids, and public sharing", () => {
  const result = makeAccomplishmentNdaSafe({
    title: "Fixed ABC-123",
    situation: "See https://internal.corp/ticket/123",
    action: "Updated the internal workflow",
    impact: "Restored service",
    lesson: "",
    is_public: true,
  });
  assert.match(result.title, /internal work item/);
  assert.doesNotMatch(result.situation, /internal\.corp/);
  assert.equal(result.is_public, false);
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

test("receipt sanitizer can preserve a user-confirmed external public reference", () => {
  const result = makeImpactReceiptNdaSafe({
    accomplishment: "Added support",
    contribution: "Implemented support",
    result: "Expanded compatibility",
    evidence: [{ title: "Public MR", reference: "https://gitlab.com/example/project/-/merge_requests/7", description: "Public change", source_is_public: true, is_public: false }],
  });
  assert.equal(result.evidence[0].reference, "https://gitlab.com/example/project/-/merge_requests/7");
});

test("one-time attestation is consumed by the next protected write", () => {
  armConfidentialityAttestation();
  assert.equal(consumeConfidentialityAttestation(), CONFIDENTIALITY_ATTESTATION_VERSION);
  assert.equal(consumeConfidentialityAttestation(), null);
});

test("protected request matcher covers career evidence writes only", () => {
  assert.equal(isConfidentialityProtectedRequest("post", "/entries"), true);
  assert.equal(isConfidentialityProtectedRequest("put", "/entries/abc"), true);
  assert.equal(isConfidentialityProtectedRequest("post", "/impact-receipts"), true);
  assert.equal(isConfidentialityProtectedRequest("patch", "/impact-receipts/abc"), true);
  assert.equal(isConfidentialityProtectedRequest("get", "/entries"), false);
  assert.equal(isConfidentialityProtectedRequest("delete", "/impact-receipts/abc"), false);
});
