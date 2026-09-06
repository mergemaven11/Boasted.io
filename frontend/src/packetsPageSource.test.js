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
const performancePages = read("./PerformancePacketPages.jsx");
const genericPages = read("./GenericPacketPages.jsx");
const reviewerPage = read("./PacketReviewerPage.jsx");
const reviewerCss = read("./PacketReviewerPage.css");
const platformCss = read("./PacketPlatformPreview.css");
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
    assert.ok(catalog.includes(`value: "${packetType}"`), `missing packet type ${packetType}`);
  }
  assert.match(page, /The more data you submit, the more useful these packets become/);
  assert.match(page, /Example:/);
  assert.match(pageCss, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(pageCss, /@media\(max-width:720px\)/);
});

test("packet catalog keeps CTA below variable-length example copy without overlap", () => {
  assert.match(pageCss, /\.packet-catalog-card\{[^}]*display:flex;[^}]*flex-direction:column/);
  assert.match(pageCss, /\.packet-catalog-card>b\{[^}]*position:static;[^}]*margin-top:auto;[^}]*padding-top:16px/);
  assert.doesNotMatch(pageCss, /\.packet-catalog-card>b\{[^}]*position:absolute/);
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
  assert.match(api, /safeFormat = format === "docx"/);
  assert.match(preview, /Download PDF/);
  assert.match(preview, /Download DOCX/);
  assert.match(preview, /The generated file was empty/);
});

test("performance packet paginates contribution records before the fixed footer", () => {
  assert.match(performancePages, /function ContributionPages/);
  assert.match(performancePages, /const pages = chunk\(contributions, 4\)/);
  assert.match(performancePages, /contribution_records\?\.length \?\? 0\) \/ 4/);
  assert.doesNotMatch(performancePages, /contributions\.slice\(0, 8\)/);
});

test("all packet previews include a reviewer worksheet with grading corrections and feedback", () => {
  assert.match(performancePages, /<PacketReviewerPage/);
  assert.match(genericPages, /<PacketReviewerPage/);
  assert.match(reviewerPage, /Overall assessment/);
  assert.match(reviewerPage, /Corrections or factual changes/);
  assert.match(reviewerPage, /Questions \/ clarification needed/);
  assert.match(reviewerPage, /Recommended next steps/);
  assert.match(reviewerPage, /Corrections are suggestions, not automatic edits/);
  assert.match(reviewerCss, /packet-reviewer-rubric-row/);
  assert.match(reviewerCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("light packet themes keep the skills callout readable", () => {
  assert.match(platformCss, /\.packet-theme-modern-minimal \.packet-growth-callout[\s\S]*color: var\(--packet-ink\)/);
  assert.match(platformCss, /\.packet-theme-modern-minimal \.packet-growth-callout p[\s\S]*color: var\(--packet-muted\)/);
  assert.match(platformCss, /\.packet-theme-modern-minimal \.packet-growth-callout svg[\s\S]*color: var\(--packet-highlight\)/);
});

test("Career packets opens the dedicated catalog experience from career tools", () => {
  assert.match(sidebar, /href: "\/app\/reports\?packets=1", label: "Career packets"/);
  assert.match(careerPage, /params\.get\("packets"\) === "1"/);
  assert.match(careerPage, /<PacketsPage/);
});
