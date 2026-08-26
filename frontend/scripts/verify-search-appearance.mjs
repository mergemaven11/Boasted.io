import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const robots = read("public/robots.txt");
const sitemap = read("public/sitemap.xml");
const searchMeta = read("src/useSearchAppearanceMeta.js");
const sitelinksNav = read("src/SearchSitelinksNav.jsx");
const sitelinksConfig = read("src/seoSitelinks.js");
const seoLandingPages = read("src/SeoLandingPages.jsx");

const publicSitelinks = [
  "/resume-accomplishments",
  "/interview-preparation",
  "/impact-receipts",
  "/how-it-works",
  "/pricing",
  "/login",
];

const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const duplicates = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index);

assert.equal(duplicates.length, 0, `sitemap.xml contains duplicate URLs: ${duplicates.join(", ")}`);
assert.ok(sitemapUrls.every((url) => url.startsWith("https://usebragstack.com/")), "sitemap URLs must use the canonical HTTPS origin");
assert.ok(sitemapUrls.every((url) => !url.includes("#") && !url.includes("?")), "sitemap URLs must not contain fragments or query strings");

assert.match(robots, /Sitemap:\s+https:\/\/usebragstack\.com\/sitemap\.xml/);
assert.match(robots, /Disallow:\s+\/app\//);
assert.doesNotMatch(robots, /Disallow:\s+\/login/);
assert.doesNotMatch(robots, /Disallow:\s+\/register/);

for (const path of publicSitelinks) {
  const canonicalUrl = `https://usebragstack.com${path}`;
  assert.ok(sitemap.includes(`<loc>${canonicalUrl}</loc>`), `${path} must be present in sitemap.xml`);
  assert.ok(sitelinksConfig.includes(`"${path}"`), `${path} must be represented in centralized sitelink metadata`);
}

assert.match(searchMeta, /PRIMARY_SITELINKS/);
assert.match(sitelinksNav, /PRIMARY_SITELINKS/);
assert.match(seoLandingPages, /PRIMARY_SITELINKS/);
assert.match(seoLandingPages, /link\[rel="canonical"\]/);
assert.match(seoLandingPages, /meta\[name="description"\]/);
assert.match(seoLandingPages, /meta\[property="og:title"\]/);
assert.match(seoLandingPages, /meta\[property="og:description"\]/);
assert.match(seoLandingPages, /meta\[property="og:url"\]/);
assert.match(seoLandingPages, /meta\[name="twitter:title"\]/);
assert.match(seoLandingPages, /meta\[name="twitter:description"\]/);
assert.match(searchMeta, /NOINDEX_PREFIXES\s*=\s*\["\/app"\]/);
assert.match(searchMeta, /"\/upgrade"/);
assert.match(searchMeta, /"\/verify-receipt"/);
assert.match(searchMeta, /SiteNavigationElement/);
assert.match(searchMeta, /max-image-preview:large/);
assert.match(searchMeta, /https:\/\/usebragstack\.com/);

console.log(`Search quality gates passed for ${publicSitelinks.length} priority routes and ${sitemapUrls.length} sitemap URLs.`);
