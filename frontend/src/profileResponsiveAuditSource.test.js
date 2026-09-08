import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("./ProfileResponsiveAudit.css", import.meta.url), "utf8");
const main = readFileSync(new URL("./main.jsx", import.meta.url), "utf8");
const themes = readFileSync(new URL("./profileThemes.js", import.meta.url), "utf8");

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

test("responsive audit layer loads after existing profile overrides", () => {
  const desktopIndex = main.indexOf('import "./ProfileDesktopBalance.css";');
  const responsiveIndex = main.indexOf('import "./ProfileResponsiveAudit.css";');
  assert.ok(desktopIndex >= 0, "desktop profile balance import is missing");
  assert.ok(responsiveIndex > desktopIndex, "responsive audit must load last among profile override layers");
});

test("all twelve profile layouts remain part of the responsive contract", () => {
  for (const layout of layouts) {
    assert.match(themes, new RegExp(`id:\\s*["']${layout}["']`));
  }
  assert.match(css, /\.proof-portfolio\[data-layout\]/);
});

test("profile and skills respond to their actual container width", () => {
  assert.match(css, /container:\s*profile\s*\/\s*inline-size/);
  assert.match(css, /container:\s*skills\s*\/\s*inline-size/);
  assert.match(css, /@container\s+profile\s*\(max-width:\s*820px\)/);
  assert.match(css, /@container\s+profile\s*\(max-width:\s*640px\)/);
  assert.match(css, /@container\s+skills\s*\(max-width:\s*560px\)/);
});

test("skill cards cannot regress into skinny vertical pills", () => {
  assert.match(css, /repeat\(auto-fit,\s*minmax\(min\(100%,\s*220px\),\s*1fr\)\)/);
  assert.match(css, /portfolio-skill-cloud\s*>\s*span[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/s);
  assert.match(css, /portfolio-skill-cloud\s+strong[^}]*overflow-wrap:\s*break-word/s);
  assert.match(css, /@container\s+skills[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test("phone profile mode collapses dense content without losing touch ergonomics", () => {
  assert.match(css, /@container\s+profile\s*\(max-width:\s*640px\)[\s\S]*portfolio-impact-grid[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /portfolio-actions[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*auto/);
});

test("responsive layer respects reduced-motion preferences", () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
