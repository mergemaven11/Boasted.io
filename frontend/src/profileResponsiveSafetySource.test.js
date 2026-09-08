import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const safety = readFileSync(new URL("./ProfileResponsiveSafety.css", import.meta.url), "utf8");
const main = readFileSync(new URL("./main.jsx", import.meta.url), "utf8");

test("public profile safety contract loads after theme-specific profile styles", () => {
  const themeFixes = main.indexOf('import "./ProfileTemplateRegressionFixes.css";');
  const desktopBalance = main.indexOf('import "./ProfileDesktopBalance.css";');
  const safetyIndex = main.indexOf('import "./ProfileResponsiveSafety.css";');

  assert.ok(themeFixes >= 0, "profile theme regression fixes must remain loaded");
  assert.ok(desktopBalance > themeFixes, "desktop balance must remain after theme fixes");
  assert.ok(safetyIndex > desktopBalance, "responsive safety contract must load last among profile overrides");
});

test("user-controlled profile text cannot force character or container overflow", () => {
  assert.match(safety, /min-width:\s*0/);
  assert.match(safety, /max-width:\s*100%/);
  assert.match(safety, /overflow-wrap:\s*anywhere/);
  assert.match(safety, /word-break:\s*normal/);
  assert.match(safety, /\.portfolio-identity h1/);
  assert.match(safety, /\.portfolio-impact-card h3/);
  assert.match(safety, /\.portfolio-work-card h3/);
  assert.match(safety, /\.portfolio-skill-cloud strong/);
  assert.match(safety, /\.portfolio-evidence-list a/);
});

test("phone layouts collapse meaningful profile grids instead of hiding content", () => {
  assert.match(safety, /@media \(max-width:\s*640px\)/);
  assert.match(safety, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(safety, /repeat\(auto-fit,\s*minmax\(min\(100%,\s*140px\),\s*1fr\)\)/);
  assert.doesNotMatch(safety, /display:\s*none/);
});

test("narrow mobile layouts preserve touch access and bounded cards", () => {
  assert.match(safety, /@media \(max-width:\s*430px\)/);
  assert.match(safety, /min-height:\s*44px/);
  assert.match(safety, /\.proof-filter-row button/);
  assert.match(safety, /\.proof-pagination-controls button/);
  assert.match(safety, /\.portfolio-footer button/);
});
