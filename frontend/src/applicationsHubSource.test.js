import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("Education workspace exposes four student goals", () => {
  const source = read("./ApplicationsHubPage.jsx");
  assert.match(source, /id: "scholarship"/);
  assert.match(source, /id: "special-program"/);
  assert.match(source, /id: "internship"/);
  assert.match(source, /id: "essay-prep"/);
  assert.match(source, /Education Workspace/);
  assert.match(source, /no admissions score/i);
  assert.match(source, /real wins/i);
  assert.match(source, /Middle school → High school → College \/ University → Career/);
});

test("Education keeps the existing authenticated route while using the new product label", () => {
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
  assert.match(sidebar, /href: "\/app\/reports\?packet=performance-review", label: "Career packets"/);
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
