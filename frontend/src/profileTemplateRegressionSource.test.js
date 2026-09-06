import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appearance = readFileSync(new URL("./AppearanceSettingsPage.jsx", import.meta.url), "utf8");
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

test("Magnolia and Poppy avoid page-level grid row coupling", () => {
  assert.match(fixes, /data-layout="executive-sidebar"[^\n]*\.proof-profile-inner/);
  assert.match(fixes, /data-layout="modern-resume"[^\n]*\.proof-profile-inner/);
  assert.match(fixes, /display:\s*block/);
  assert.match(fixes, /align-self:\s*start/);
  assert.match(fixes, /height:\s*auto/);
});

test("skill cards remain content-sized and readable", () => {
  assert.match(fixes, /\.portfolio-skill-cloud\s*>\s*span\s*\{[^}]*min-height:\s*0/s);
  assert.match(fixes, /\.portfolio-skill-cloud\s*>\s*span\s*\{[^}]*height:\s*auto/s);
  assert.match(fixes, /overflow-wrap:\s*break-word/);
  assert.match(fixes, /data-layout="executive-sidebar"[^\n]*\.portfolio-skill-cloud/);
  assert.match(fixes, /data-layout="modern-resume"[^\n]*\.portfolio-skill-cloud/);
});

test("large hero templates no longer force empty vertical space", () => {
  assert.match(fixes, /data-layout="studio-split"[^\n]*\.portfolio-hero\s*\{[^}]*min-height:\s*0/s);
  assert.match(fixes, /data-layout="founder"[^\n]*\.portfolio-hero\s*\{[^}]*min-height:\s*0/s);
  assert.match(fixes, /data-layout="case-study"[^\n]*\.portfolio-impact-card\.featured\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(fixes, /max-width:\s*100%/);
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

test("selected work reads as a manifesto across every flower identity", () => {
  assert.match(fixes, /\.portfolio-work-section\s*>\s*\.portfolio-section-heading/);
  assert.match(fixes, /font-size:\s*clamp\(2\.4rem,\s*5\.8vw,\s*5\.4rem\)/);
  for (const layout of layouts) {
    assert.match(fixes, new RegExp(`data-layout="${layout}"[^\\n]*\\.portfolio-work-section`));
  }
  assert.match(fixes, /data-layout="command-center"[^\n]*\.portfolio-work-section[^\n]*h2::before/);
  assert.match(fixes, /font-family:\s*"SFMono-Regular",\s*Consolas,\s*"Liberation Mono",\s*monospace/);
});

test("appearance saving has a bounded wait and always recovers on failure", () => {
  assert.match(appearance, /SAVE_TIMEOUT_MS\s*=\s*12000/);
  assert.match(appearance, /Promise\.race\(\[promise,\s*timeout\]\)/);
  assert.match(appearance, /Saving took too long\. Please try again\./);
  assert.match(appearance, /finally\s*\{/);
  assert.match(appearance, /if\s*\(!navigating\)\s*setSaving\(false\)/);
});
