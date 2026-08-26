import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const robots = read("public/robots.txt");
const sitemap = read("public/sitemap.xml");
const searchMeta = read("src/useSearchAppearanceMeta.js");
const sitelinksNav = read("src/SearchSitelinksNav.jsx");
const sitelinksConfig = read("src/seoSitelinks.js");

const publicSitelinks = [
  "/resume-accomplishments",
  "/interview-preparation",
  "/impact-receipts",
  "/how-it-works",
  "/pricing",
  "/login",
];

assert.match(robots, /Sitemap:\s+https:\/\/usebragstack\.com\/sitemap\.xml/);
assert.match(robots, /Disallow:\s+\/app\//);
assert.doesNotMatch(robots, /Disallow:\s+\/login/);
assert.doesNotMatch(robots, /Disallow:\s+\/register/);

for (const path of publicSitelinks) {
  assert.ok(sitemap.includes(`<loc>https://usebragstack.com${path}</loc>`), `${path} must be present in sitemap.xml`);
  assert.ok(sitelinksConfig.includes(`"${path}"`), `${path} must be represented in centralized sitelink metadata`);
}

assert.match(searchMeta, /PRIMARY_SITELINKS/);
assert.match(sitelinksNav, /PRIMARY_SITELINKS/);
assert.match(searchMeta, /NOINDEX_PREFIXES\s*=\s*\["\/app"\]/);
assert.match(searchMeta, /"\/upgrade"/);
assert.match(searchMeta, /"\/verify-receipt"/);
assert.match(searchMeta, /SiteNavigationElement/);
assert.match(searchMeta, /max-image-preview:large/);

console.log("Search appearance checks passed.");
