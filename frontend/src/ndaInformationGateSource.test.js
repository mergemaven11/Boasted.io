import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const gate = read("./NDAInformationGate.jsx");
const main = read("./main.jsx");
const safety = read("./ndaSafety.js");
const panel = read("./NDASafetyPanel.jsx");

test("NDA gate is mounted at the application root", () => {
  assert.match(main, /NDAInformationGate/);
});

test("NDA gate protects accomplishment submissions", () => {
  assert.match(gate, /\/app\/accomplishments/);
  assert.match(gate, /modal-card/);
  assert.match(gate, /document\.addEventListener\("submit"/);
});

test("NDA gate protects Impact Receipt submissions", () => {
  assert.match(gate, /\/app\/impact-receipts/);
  assert.match(gate, /receipt-create-form/);
});

test("NDA gate intercepts protected public-sharing buttons", () => {
  assert.match(gate, /proof-visibility-button/);
  assert.match(gate, /visibility-pill/);
  assert.match(gate, /receipt-card-actions/);
});

test("NDA gate requires an explicit user confirmation", () => {
  assert.match(gate, /I confirm — continue/);
  assert.match(gate, /confidential, proprietary, restricted/);
  assert.match(gate, /disabled=\{!confirmed \|\| blockingFindings\.length > 0\}/);
});

test("NDA gate runs the local scanner before continuing", () => {
  assert.match(gate, /scanSubmissionContainer/);
  assert.match(gate, /setSafetyFindings\(scanSubmissionContainer\(container\)\)/);
});

test("NDA gate distinguishes blockers from review warnings", () => {
  assert.match(gate, /severity === "block"/);
  assert.match(gate, /severity === "warning"/);
  assert.match(gate, /potential credential or secret pattern/);
  assert.match(gate, /should be reviewed/);
});

test("NDA gate blocks the action until credential findings are removed", () => {
  assert.match(gate, /blockingFindings\.length > 0/);
  assert.match(gate, /Remove sensitive material first/);
  assert.match(gate, /submission cannot continue yet/);
});

test("NDA gate arms a one-time confidentiality attestation only after confirmation", () => {
  assert.match(gate, /armConfidentialityAttestation/);
  assert.match(gate, /armConfidentialityAttestation\(\)/);
  assert.match(safety, /ATTESTATION_TTL_MS/);
  assert.match(safety, /consumeConfidentialityAttestation/);
});

test("NDA gate says the local scan does not send the draft anywhere", () => {
  assert.match(gate, /scanner does not send your draft anywhere/);
});

test("NDA gate does not misrepresent a clear scan as legal approval", () => {
  assert.match(gate, /This is not a legal determination/);
});

test("NDA gate warns against nonpublic source code and technical details", () => {
  assert.match(gate, /Nonpublic source code/);
  assert.match(gate, /internal technical details/);
});

test("NDA gate warns against internal records and credentials", () => {
  assert.match(gate, /Internal tickets, logs, screenshots, documents, credentials/);
});

test("NDA gate warns against nonpublic business and people data", () => {
  assert.match(gate, /customer, vendor, personnel, financial/);
});

test("NDA gate gives generalized safer-career-evidence examples", () => {
  assert.match(gate, /internal platform/);
  assert.match(gate, /enterprise customer/);
  assert.match(gate, /Generalized impact and permitted metrics/);
});

test("NDA gate points to public NDA safety guidance", () => {
  assert.match(gate, /\/nda-safety/);
  assert.match(gate, /Read NDA safety guidance/);
});

test("NDA gate explicitly refuses to interpret the user's agreement", () => {
  assert.match(gate, /BragStack does not interpret your agreement/);
});

test("NDA gate tells uncertain users to stop and check an authorized source", () => {
  assert.match(gate, /If you are unsure, stop and check the agreement/);
});

test("NDA helper UI states that its scan runs in the browser", () => {
  assert.match(panel, /This check runs in your browser/);
  assert.match(panel, /Your draft is not sent anywhere just to run this scan/);
});

test("NDA helper UI provides the NDA-safe sanitization action", () => {
  assert.match(panel, /Make this NDA-safe/);
  assert.match(panel, /removes obvious credentials, code blocks, ticket-style identifiers/);
});

test("NDA helper UI warns that a clear scan is not contractual permission", () => {
  assert.match(panel, /This does not mean an NDA permits the content/);
});

test("NDA safety module covers credentials, private hosts, tickets, and logs", () => {
  assert.match(safety, /private-key/);
  assert.match(safety, /provider-token/);
  assert.match(safety, /internal-url/);
  assert.match(safety, /work-item/);
  assert.match(safety, /stack-trace/);
});
