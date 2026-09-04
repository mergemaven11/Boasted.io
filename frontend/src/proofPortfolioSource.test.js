import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  return fs.readFileSync(fileURLToPath(url), "utf8");
}

test("public brag route is the professional Proof Portfolio", () => {
  const source = read("./PublicBragPage.jsx");
  assert.match(source, /className="proof-profile proof-portfolio"/);
  assert.match(source, />Proof Portfolio</);
  assert.match(source, /Professional proof portfolio/);
  assert.match(source, /Portfolio snapshot/);
  assert.match(source, /Featured impact/);
  assert.match(source, /Demonstrated skills/);
  assert.match(source, /Selected work/);
});

test("legacy rich-share links redirect to the themed Proof Portfolio route", () => {
  const source = read("./RootContent.jsx");
  assert.match(source, /path\.startsWith\("\/share\/brag\/"\)/);
  assert.match(source, /window\.location\.replace\(slug \? `\/brag\/\$\{slug\}\$\{window\.location\.search\}` : "\/"\)/);
  assert.match(source, /Opening Proof Portfolio…/);
});

test("Proof Portfolio mounts the inline Calendly scheduler", () => {
  const source = read("./PublicBragPage.jsx");
  const calendly = read("./CalendlyEmbed.jsx");
  assert.match(source, /id="schedule"/);
  assert.match(source, /connection\?\.calendly_enabled && connection\.calendly_url/);
  assert.match(source, /<CalendlyEmbed url=\{connection\.calendly_url\}/);
  assert.match(calendly, /Calendly\.initInlineWidget/);
  assert.match(calendly, /parentElement/);
});

test("uploaded profile photos replace the public portfolio letter avatar", () => {
  const source = read("./publicPortfolioAvatar.js");
  const main = read("./main.jsx");
  assert.match(source, /\/public\/brag\/\$\{encodeURIComponent\(slug\)\}\/avatar/);
  assert.match(source, /\.proof-portfolio \.portfolio-avatar/);
  assert.match(source, /host\.replaceChildren\(image\)/);
  assert.match(source, /objectFit = "cover"/);
  assert.match(main, /installPublicPortfolioAvatar/);
});

test("Appearance settings always provide a route back to Settings", () => {
  const source = read("./AppearanceSettingsPage.jsx");
  assert.match(source, /href="\/app\/settings"/);
  assert.match(source, /Back to settings/);
  assert.match(source, /window\.location\.replace\("\/app\/settings\?saved=appearance"\)/);
  assert.doesNotMatch(source, /name:form\.name,headline:form\.headline/);
});
