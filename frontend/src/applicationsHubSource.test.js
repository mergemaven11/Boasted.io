import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("Education workspace exposes application goals and a feature launcher", () => {
  const source = read("./ApplicationsHubPage.jsx");
  assert.match(source, /id: "scholarship"/);
  assert.match(source, /id: "special-program"/);
  assert.match(source, /id: "internship"/);
  assert.match(source, /id: "essay-prep"/);
  assert.match(source, /Education Workspace/);
  assert.match(source, /EDUCATION_FEATURES/);
  assert.match(source, /My Education/);
  assert.match(source, /Coursework/);
  assert.match(source, /Academic Projects/);
  assert.match(source, /Certifications & Training/);
  assert.match(source, /Academic Achievements/);
  assert.match(source, /Group Project Contributions/);
  assert.match(source, /Graduation Progress/);
  assert.match(source, /Experience Translator/);
  assert.match(source, /Major Explorer/);
  assert.match(source, /href: "#major-explorer"/);
  assert.match(source, /Education Impact Receipts/);
  assert.match(source, /Skills from Education/);
  assert.match(source, /Career Match & Skill Gaps/);
  assert.match(source, /Résumé Builder/);
  assert.match(source, /Interview Prep/);
  assert.match(source, /Academic Portfolio/);
  assert.match(source, /Career Path Explorer/);
  assert.match(source, /no admissions score/i);
  assert.match(source, /real evidence/i);
});

test("Major Explorer is embedded in Education with visible non-predictive safeguards", () => {
  const hub = read("./ApplicationsHubPage.jsx");
  const explorer = read("./MajorExplorerPanel.jsx");
  const api = read("./majorExplorerApi.js");

  assert.match(hub, /MajorExplorerPanel/);
  assert.match(explorer, /id="major-explorer"/);
  assert.match(explorer, /No “best major” verdict/);
  assert.match(explorer, /No fit percentage/);
  assert.match(explorer, /no admissions odds/i);
  assert.match(explorer, /not academic, career, financial, legal, licensing, or professional advice/i);
  assert.match(explorer, /does not predict or guarantee admission, scholarships, graduation, employment, salary, licensing, or career success/i);
  assert.match(explorer, /Verify program requirements/i);
  assert.match(explorer, /You remain responsible/i);
  assert.match(explorer, /Self-reported interests are not mixed into demonstrated evidence/i);
  assert.match(explorer, /does not determine aptitude/i);
  assert.match(api, /career-intelligence\/major-explorer/);
});

test("Education removes the adult-only and middle-school roadmap framing", () => {
  const source = read("./ApplicationsHubPage.jsx");
  assert.doesNotMatch(source, /18\+/);
  assert.doesNotMatch(source, /Middle school/i);
  assert.doesNotMatch(source, /YOUNGER STUDENT EXPERIENCE/);
  assert.doesNotMatch(source, /UNDER CONSTRUCTION/);
});

test("Education feature buttons route into existing Boasted workflows", () => {
  const source = read("./ApplicationsHubPage.jsx");
  assert.match(source, /education_feature=coursework/);
  assert.match(source, /education_feature=academic-projects/);
  assert.match(source, /education_feature=certifications/);
  assert.match(source, /href: "\/app\/impact-receipts"/);
  assert.match(source, /href: "\/app\/intelligence"/);
  assert.match(source, /href: "\/app\/resume-builder"/);
  assert.match(source, /href: "\/app\/interview-practice"/);
  assert.match(source, /href: "\/app\/profile"/);
});

test("Education keeps the existing authenticated route while using the product label", () => {
  const root = read("./RootContent.jsx");
  const sidebar = read("./AppSidebar.jsx");
  assert.match(root, /ApplicationsHubPage/);
  assert.match(root, /path === "\/app\/applications"/);
  assert.match(sidebar, /href: "\/app\/applications"/);
  assert.match(sidebar, /label: "Education"/);
  assert.doesNotMatch(sidebar, /label: "Applications"/);
});

test("Career analytics and Career packets have distinct navigation destinations", () => {
  const sidebar = read("./AppSidebar.jsx");
  assert.match(sidebar, /href: "\/app\/reports", label: "Career analytics"/);
  assert.match(sidebar, /href: "\/app\/reports\?packets=1", label: "Career packets"/);
  assert.match(sidebar, /search === target\.search/);
  assert.match(sidebar, /hash === target\.hash/);
  assert.doesNotMatch(sidebar, /\/app\/reports#packet-builder/);
});

test("Career tools are collapsed into one expandable navigation group", () => {
  const sidebar = read("./AppSidebar.jsx");
  assert.match(sidebar, /sidebar-collapsible/);
  assert.match(sidebar, /Career tools/);
  assert.match(sidebar, /Career packets/);
  assert.doesNotMatch(sidebar, /label: "Performance review"/);
  assert.doesNotMatch(sidebar, /label: "Promotion packet"/);
});

test("Essay Stories surfaces real moments instead of writing an invented essay", () => {
  const source = read("./ApplicationsHubPage.jsx");
  assert.match(source, /Real moments worth remembering/);
  assert.match(source, /You stay the writer/i);
  assert.match(source, /Copy my story ideas/);
});

test("Education marketing and customer guide are public routes", () => {
  const root = read("./RootContent.jsx");
  assert.match(root, /EducationMarketingPage/);
  assert.match(root, /EducationGuidePage/);
  assert.match(root, /path === "\/education"/);
  assert.match(root, /path === "\/docs\/education"/);
  assert.match(root, /educationLink\.textContent = "Education"/);
});
