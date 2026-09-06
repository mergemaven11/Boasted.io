import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("every Education card opens a dedicated working tool instead of immediately redirecting", () => {
  const hub = read("./ApplicationsHubPage.jsx");
  assert.match(hub, /EducationToolkitPanel/);
  assert.match(hub, /activeEducationTool/);
  assert.match(hub, /openEducationTool/);
  assert.match(hub, /onClick=\{\(\) => onOpenTool\(id\)\}/);
  assert.match(hub, /data-education-feature=\{id\}/);
  assert.match(hub, /requested !== "major-explorer"/);
  assert.match(hub, /document\.getElementById\("major-explorer"\)/);
});

test("Education toolkit calls the verified backend and shows traceable evidence", () => {
  const panel = read("./EducationToolkitPanel.jsx");
  const api = read("./educationToolkitApi.js");
  assert.match(api, /career-intelligence\/education-toolkit/);
  assert.match(panel, /Evidence this tool can use now/);
  assert.match(panel, /Skills supported by what you saved/);
  assert.match(panel, /Evidence gaps, not personal deficits/);
  assert.match(panel, /Trusted reference data/);
  assert.match(panel, /not a mastery score/i);
  assert.match(panel, /not a “best career” verdict/i);
  assert.match(panel, /never changes visibility/i);
});

test("Education career exploration identifies official source families", () => {
  const panel = read("./EducationToolkitPanel.jsx");
  const hub = read("./ApplicationsHubPage.jsx");
  assert.match(panel, /PUBLIC SOURCES/);
  assert.match(panel, /official occupation information/i);
  assert.match(hub, /Career Match & Skill Gaps/);
  assert.match(hub, /Career Path Explorer/);
  assert.match(hub, /official public references/i);
});
