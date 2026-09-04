import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("accomplishments support school and university contexts", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /"Middle School"/);
  assert.match(source, /"High School"/);
  assert.match(source, /"College \/ University"/);
  assert.match(source, /Career & Student Evidence Library/);
});

test("student accomplishment capture is designed for future applications", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /grade\/year, school or program, your role, time commitment, scope, recognition, measurable results, and evidence/i);
  assert.match(source, /college, scholarship, internship, honors, summer-program, and other selective applications/i);
  assert.match(source, /Academic Achievement/);
  assert.match(source, /Award \/ Honor/);
  assert.match(source, /Extracurricular Activity/);
  assert.match(source, /Community Service/);
  assert.match(source, /Special Program/);
});

test("student guidance keeps records private by default and evidence-focused", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /What did you personally do, create, lead, research, organize, solve, perform, or contribute\?/);
  assert.match(source, /placement, award level, people served, money raised, growth, time commitment/i);
  assert.match(source, /Student records stay private unless you explicitly choose to make an accomplishment public/);
  assert.match(source, /Make this accomplishment public/);
});
