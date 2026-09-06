import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("landing page explains Boasted immediately in plain language", () => {
  const source = read("./LandingPage.jsx");

  assert.match(source, /Remember what you did/);
  assert.match(source, /Save your wins, results, skills, and proof in one private place/);
  assert.match(source, /Save it → Prove it → Use it/);
  assert.match(source, /ATS-friendly résumés/);
  assert.match(source, /Performance reviews/);
  assert.match(source, /Promotion packets/);
  assert.match(source, /Interview practice/);

  assert.doesNotMatch(source, /Capture → Prove → Package → Share → Connect/);
  assert.doesNotMatch(source, /WHY IT EXISTS/);
  assert.doesNotMatch(source, /BUILT FOR REAL CAREER MOMENTS/);
  assert.doesNotMatch(source, /<p>SOLUTIONS<\/p>/);
});

test("career intelligence uses empty hero space for non-repeating next actions", () => {
  const source = read("./CareerIntelligencePage.jsx");

  assert.match(source, /Use your proof/);
  assert.match(source, /href: "\/app\/resume-builder"/);
  assert.match(source, /href: "\/app\/reports\?packet=performance-review"/);
  assert.match(source, /href: "\/app\/interview-practice"/);
  assert.match(source, /See what your work proves you&apos;re good at/);
  assert.doesNotMatch(source, /Recommended actions/);
  assert.doesNotMatch(source, /saved proof record.*distinct demonstration/);
});
