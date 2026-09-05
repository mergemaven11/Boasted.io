import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const guidance = read("./NDAGuidancePage.jsx");

const requiredPublicGuidance = [
  ["core NDA boundary", /Your NDA still applies/],
  ["career-signal principle", /Capture the career signal, not the secret/],
  ["generalization examples", /enterprise customer/],
  ["private implementation example", /Private architecture work/],
  ["public evidence ceiling", /Treat the public source as the ceiling/],
  ["restricted evidence warning", /Do not upload screenshots, tickets, logs, source code/],
  ["metric caution", /Be conservative with metrics/],
  ["private-by-default guidance", /Private by default/],
  ["confidentiality gate documentation", /NDA & confidential-work safety controls/],
  ["local scan documentation", /The local safety scan/],
  ["credential blockers", /private-key material, bearer tokens/],
  ["warning pattern examples", /code-like blocks, stack traces, internal URLs or hosts/],
  ["false-positive warning", /false positives and false negatives/],
  ["no-clearance disclaimer", /No obvious pattern detected/],
  ["NDA-safe helper documentation", /Make this NDA-safe/],
  ["sanitization review requirement", /Always review the rewritten result/],
  ["publication re-check", /another check before disclosure/],
  ["safer workflow", /A safer workflow for confidential accomplishments/],
  ["generated-output sensitivity", /Generated outputs inherit source sensitivity/],
  ["scanner limitations", /What the safety helper cannot decide/],
  ["third-party storage prohibition", /may not be stored in third-party systems/],
  ["legal disclaimer", /This is not legal advice/],
  ["no compliance certification", /does not certify that a draft is “NDA compliant.”/],
];

for (const [name, pattern] of requiredPublicGuidance) {
  test(`public NDA docs include ${name}`, () => {
    assert.match(guidance, pattern);
  });
}

test("public NDA docs link back to general product documentation", () => {
  assert.match(guidance, /href="\/docs"/);
});

test("public NDA docs link to privacy and terms", () => {
  assert.match(guidance, /href="\/privacy"/);
  assert.match(guidance, /href="\/terms"/);
});

test("public NDA docs tell users to stop when permission is unclear", () => {
  assert.match(guidance, /If the agreement or policy is unclear, stop before submitting/);
});

test("public NDA docs distinguish a safety control from employer permission", () => {
  assert.match(guidance, /not permission from an employer, client, contract, or lawyer/);
});

test("public NDA docs explicitly say private settings do not authorize prohibited storage", () => {
  assert.match(guidance, /privacy settings do not make unauthorized third-party storage permissible/);
});

test("public NDA docs preserve the public-source ceiling after sanitization", () => {
  assert.match(guidance, /keeping a public link does not authorize adding private context/);
});

test("public NDA docs keep legal permission separate from a successful product safety check", () => {
  assert.match(guidance, /No obvious pattern detected/);
  assert.match(guidance, /This is not legal advice/);
  assert.match(guidance, /does not certify that a draft is “NDA compliant.”/);
});
