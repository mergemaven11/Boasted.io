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

test("Appearance settings are the only profile theme editor and return to Settings after save", () => {
  const appearance = read("./AppearanceSettingsPage.jsx");
  const profile = read("./ProfilePage.jsx");
  assert.match(appearance, /PROFILE_THEMES/);
  assert.match(appearance, /href="\/app\/settings"/);
  assert.match(appearance, /Back to settings/);
  assert.match(appearance, /window\.location\.assign\("\/app\/settings\?saved=appearance"\)/);
  assert.doesNotMatch(profile, /PROFILE_THEMES/);
  assert.doesNotMatch(profile, /profile_theme:form\.profile_theme/);
  assert.doesNotMatch(profile, /profile_primary_color:form\.profile_primary_color/);
});

test("Appearance settings expose and persist all twelve public portfolio structures", () => {
  const appearance = read("./AppearanceSettingsPage.jsx");
  const themes = read("./profileThemes.js");
  const publicProfile = read("./PublicBragPage.jsx");
  const layoutBlock = themes.split("export const PROFILE_LAYOUTS = [")[1].split("];", 1)[0];
  const ids = [...layoutBlock.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 12);
  assert.match(appearance, /PROFILE_LAYOUTS/);
  assert.match(appearance, /data-profile-layout-gallery/);
  assert.match(appearance, /profile_layout:u\.profile_layout\|\|"editorial"/);
  assert.match(appearance, /profile_layout:id/);
  assert.match(appearance, /saved\.profile_layout/);
  assert.match(publicProfile, /data-layout=\{profile\?\.profile_layout \|\| "editorial"\}/);
});

test("Profile form persists identity fields without resubmitting appearance state", () => {
  const source = read("./ProfilePage.jsx");
  assert.match(source, /name:form\.name,headline:form\.headline,bio:form\.bio,location:form\.location/);
  assert.match(source, /github_url:form\.github_url,portfolio_url:form\.portfolio_url,resume_url:form\.resume_url/);
  assert.match(source, /const savedProfile=await updateCurrentUserProfile\(profileFields\)/);
  assert.match(source, /const savedConnection=await updateProfileConnection/);
  assert.match(source, /const savedAvatar=await updateProfileAvatar/);
});
