import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("accomplishments preserve useful education contexts without middle-school product logic", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.doesNotMatch(source, /"Middle School"/);
  assert.match(source, /"High School"/);
  assert.match(source, /"College \/ University"/);
  assert.match(source, /"Learning \/ Certification"/);
  assert.match(source, /Career & Education Evidence Library/);
  assert.doesNotMatch(source, /18\+/);
});

test("education accomplishment capture remains evidence-focused", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /school or program, your role/i);
  assert.match(source, /time commitment, scope, recognition, measurable results, and safe/i);
  assert.match(source, /Academic Achievement/);
  assert.match(source, /Coursework/);
  assert.match(source, /Academic Project/);
  assert.match(source, /Capstone \/ Thesis/);
  assert.match(source, /Academic Milestone/);
  assert.match(source, /Award \/ Honor/);
  assert.match(source, /Community Service/);
  assert.match(source, /Certification \/ Course/);
});

test("education guidance keeps records private by default and contribution-focused", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /What did you personally do, create, lead, research, organize, solve, present, or contribute\?/);
  assert.match(source, /results, scope, people served, performance, recognition/i);
  assert.match(source, /Education records stay private unless you explicitly choose to make/);
  assert.match(source, /Make this accomplishment public/);
});

test("education feature presets reuse the accomplishment evidence model", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /EDUCATION_FEATURE_PRESETS/);
  assert.match(source, /education_feature/);
  assert.match(source, /group-projects/);
  assert.match(source, /graduation-progress/);
  assert.match(source, /experience-translator/);
});
