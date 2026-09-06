import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("./ProfileDesktopBalance.css", import.meta.url), "utf8");
const main = readFileSync(new URL("./main.jsx", import.meta.url), "utf8");

test("Dahlia desktop balance overrides load after profile regression fixes", () => {
  const regressionIndex = main.indexOf('import "./ProfileTemplateRegressionFixes.css";');
  const balanceIndex = main.indexOf('import "./ProfileDesktopBalance.css";');
  assert.ok(regressionIndex >= 0, "profile regression fixes import is missing");
  assert.ok(balanceIndex > regressionIndex, "desktop balance overrides must load last");
});

test("Dahlia uses wider desktop space without giant gutters", () => {
  assert.match(css, /data-layout="editorial"[^\n]*\.proof-profile-inner\s*\{[^}]*width:\s*min\(1440px,\s*calc\(100%\s*-\s*48px\)\)/s);
  assert.match(css, /max-width:\s*1440px/);
});

test("Dahlia hero and name are bounded on wide screens", () => {
  assert.match(css, /data-layout="editorial"[^\n]*\.portfolio-hero\s*\{[^}]*min-height:\s*0/s);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1\.55fr\)\s*minmax\(300px,\s*0\.55fr\)/);
  assert.match(css, /font-size:\s*clamp\(4rem,\s*6\.3vw,\s*6\.65rem\)/);
  assert.match(css, /text-wrap:\s*balance/);
  assert.match(css, /\.portfolio-proof-passport\s*\{[^}]*align-self:\s*center/s);
});

test("Dahlia keeps usable gutters on laptop and phone widths", () => {
  assert.match(css, /@media\s*\(min-width:\s*761px\)\s*and\s*\(max-width:\s*1279px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /width:\s*calc\(100%\s*-\s*24px\)/);
});
