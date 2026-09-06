import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fixes = readFileSync(new URL("./ProfileTemplateRegressionFixes.css", import.meta.url), "utf8");
const main = readFileSync(new URL("./main.jsx", import.meta.url), "utf8");
const structures = readFileSync(new URL("./ProfileStructureThemes.css", import.meta.url), "utf8");

const layouts = [
  "editorial",
  "executive-sidebar",
  "career-timeline",
  "studio-split",
  "minimal-column",
  "portfolio-grid",
  "case-study",
  "modern-resume",
  "command-center",
  "academic",
  "founder",
  "compact",
];

test("all 12 public profile templates remain represented", () => {
  for (const layout of layouts) {
    assert.match(structures, new RegExp(`data-layout=["']${layout}["']`));
  }
});

test("profile regression overrides load after the global UI foundation", () => {
  const foundationIndex = main.indexOf('import "./UiUxFoundation.css";');
  const fixesIndex = main.indexOf('import "./ProfileTemplateRegressionFixes.css";');
  assert.ok(foundationIndex >= 0, "UI foundation import is missing");
  assert.ok(fixesIndex > foundationIndex, "profile template fixes must load after the UI foundation");
});

test("sidebar templates never use the three-column skill cloud while narrow", () => {
  assert.match(fixes, /data-layout="executive-sidebar"[^\n]*\.portfolio-skill-cloud/);
  assert.match(fixes, /data-layout="modern-resume"[^\n]*\.portfolio-skill-cloud/);
  assert.match(fixes, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(fixes, /flex-direction:\s*column/);
  assert.match(fixes, /min-height:\s*0/);
  assert.match(fixes, /height:\s*auto/);
});

test("Lotus sparse cards hug their content instead of forcing blank space", () => {
  assert.match(fixes, /data-layout="portfolio-grid"[^\n]*\.portfolio-impact-card/);
  assert.match(fixes, /data-layout="portfolio-grid"[^\n]*\.portfolio-work-card/);
  assert.match(fixes, /align-self:\s*start/);
  assert.match(fixes, /\.portfolio-impact-card\.featured\s*\{[^}]*min-height:\s*0/s);
});

test("evidence links are bounded and content-sized", () => {
  assert.match(fixes, /\.portfolio-evidence-list\s*\{[^}]*align-items:\s*flex-start/s);
  assert.match(fixes, /\.portfolio-evidence-list\s*>\s*a/);
  assert.match(fixes, /max-width:\s*100%/);
  assert.match(fixes, /overflow-wrap:\s*break-word/);
});
