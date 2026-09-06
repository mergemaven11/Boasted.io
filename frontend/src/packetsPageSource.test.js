import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const catalog = read("./packetCatalog.js");
const page = read("./PacketsPage.jsx");
const pageCss = read("./PacketsPage.css");
const builder = read("./PacketBuilderPanel.jsx");
const api = read("./api.js");
const preview = read("./PerformancePacketPreview.jsx");
const sidebar = read("./AppSidebar.jsx");
const careerPage = read("./ProCareerPage.jsx");

test("packet catalog exposes the full set of career and education packet choices", () => {
  for (const packetType of [
    "performance-review",
    "promotion",
    "interview",
    "certification",
    "program-application",
    "scholarship",
    "portfolio",
    "career-transition",
  ]) {
    assert.match(catalog, new RegExp(`value: \\"${packetType}\\"`));
  }
  assert.match(page, /The more data you submit, the more useful these packets become/);
  assert.match(page, /Example:/);
  assert.match(pageCss, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(pageCss, /@media\(max-width:720px\)/);
});

test("packet forms expose type-specific fields and PDF DOCX choices", () => {
  assert.match(builder, /Program name/);
  assert.match(builder, /Scholarship \/ award name/);
  assert.match(builder, /Portfolio title/);
  assert.match(builder, /Target industry \/ field/);
  assert.match(builder, /Credential \/ license name/);
  assert.match(builder, /Target level \/ progression/);
  assert.match(builder, />PDF</);
  assert.match(builder, />DOCX</);
  assert.match(builder, /More proof makes a stronger packet/);
});

test("packet generation and download use the catalog API and nonblank client guard", () => {
  assert.match(api, /\/packets\/catalog\/\$\{encodeURIComponent\(packetType\)\}/);
  assert.match(api, /safeFormat === "docx"/);
  assert.match(preview, /Download PDF/);
  assert.match(preview, /Download DOCX/);
  assert.match(preview, /The generated file was empty/);
});

test("Career packets opens the dedicated catalog experience from career tools", () => {
  assert.match(sidebar, /href: "\/app\/reports\?packets=1", label: "Career packets"/);
  assert.match(careerPage, /params\.get\("packets"\) === "1"/);
  assert.match(careerPage, /<PacketsPage/);
});
