import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("Applications hub exposes four application workflows", () => {
  const source = read("./ApplicationsHubPage.jsx");
  assert.match(source, /id: "scholarship"/);
  assert.match(source, /id: "special-program"/);
  assert.match(source, /id: "internship"/);
  assert.match(source, /id: "essay-prep"/);
  assert.match(source, /Application Workbench/);
  assert.match(source, /no admissions score/i);
  assert.match(source, /never invents achievements/i);
});

test("Applications route is available from authenticated navigation", () => {
  const root = read("./RootContent.jsx");
  const sidebar = read("./AppSidebar.jsx");
  assert.match(root, /ApplicationsHubPage/);
  assert.match(root, /path === "\/app\/applications"/);
  assert.match(sidebar, /href: "\/app\/applications"/);
  assert.match(sidebar, /label: "Applications"/);
});

test("Career tools are collapsed into one expandable navigation group", () => {
  const sidebar = read("./AppSidebar.jsx");
  assert.match(sidebar, /sidebar-collapsible/);
  assert.match(sidebar, /Career tools/);
  assert.match(sidebar, /Career packets/);
  assert.doesNotMatch(sidebar, /label: "Performance review"/);
  assert.doesNotMatch(sidebar, /label: "Promotion packet"/);
});

test("Essay prep surfaces stories instead of writing an invented essay", () => {
  const source = read("./ApplicationsHubPage.jsx");
  assert.match(source, /Real stories worth revisiting/);
  assert.match(source, /you write the essay in your own voice/i);
  assert.match(source, /Copy story candidates/);
});
