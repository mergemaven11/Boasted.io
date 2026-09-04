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
  assert.match(source, /projects, awards, clubs, research, competitions, leadership, volunteering, and major coursework/i);
  assert.match(source, /Career & Education Evidence Library/);
});

test("education guidance stays evidence-focused", () => {
  const source = read("./AccomplishmentsPage.jsx");
  assert.match(source, /What did you specifically do, build, lead, research, solve, or contribute\?/);
  assert.match(source, /Add numbers, awards, recognition, results, or measurable outcomes/);
  assert.match(source, /Make this accomplishment public/);
});
