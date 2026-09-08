import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const robots = read("public/robots.txt");
const sitemap = read("public/sitemap.xml");
const searchMeta = read("src/useSearchAppearanceMeta.js");
const sitelinksNav = read("src/SearchSitelinksNav.jsx");
const sitelinksConfig = read("src/seoSitelinks.js");
const seoLandingPages = read("src/SeoLandingPages.jsx");
const staticRouteShells = read("scripts/generate-static-route-shells.mjs");

const publicSitelinks = [
  "/resume-accomplishments",
  "/interview-preparation",
  "/impact-receipts",
  "/career-portfolio",
  "/how-it-works",
  "/pricing",
];

const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const sitemapPaths = sitemapUrls
  .map((url) => new URL(url).pathname.replace(/\/$/, "") || "/")
  .filter((path) => path !== "/");
const duplicates = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index);

assert.equal(duplicates.length, 0, `sitemap.xml contains duplicate URLs: ${duplicates.join(", ")}`);
assert.ok(sitemapUrls.every((url) => url.startsWith("https://boasted.io/")), "sitemap URLs must use the canonical HTTPS origin");
assert.ok(sitemapUrls.every((url) => !url.includes("#") && !url.includes("?")), "sitemap URLs must not contain fragments or query strings");
assert.ok(!sitemap.includes("https://boasted.io/login"), "login should not compete with product pages in the public sitemap");
assert.ok(!sitemap.includes("https://boasted.io/register"), "register should not compete with product pages in the public sitemap");

assert.match(robots, /Sitemap:\s+https:\/\/boasted\.io\/sitemap\.xml/);
assert.match(robots, /Disallow:\s+\/app\//);
assert.doesNotMatch(robots, /Disallow:\s+\/login/);
assert.doesNotMatch(robots, /Disallow:\s+\/register/);

for (const path of publicSitelinks) {
  const canonicalUrl = `https://boasted.io${path}`;
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
assert.match(searchMeta, /"\/login"/);
assert.match(searchMeta, /"\/register"/);
assert.match(searchMeta, /"\/upgrade"/);
assert.match(searchMeta, /"\/verify-receipt"/);
assert.match(searchMeta, /SiteNavigationElement/);
assert.match(searchMeta, /max-image-preview:large/);
assert.match(searchMeta, /https:\/\/boasted\.io/);
assert.match(searchMeta, /Boasted\.io/);

// Static HTML must expose route-specific crawl metadata before React executes.
assert.match(staticRouteShells, /function routeShell\(indexHtml, route\)/);
assert.match(staticRouteShells, /ROUTE_META = Object\.freeze/);
assert.match(staticRouteShells, /canonicalUrl = `\$\{SITE_ORIGIN\}\$\{route\}`/);
assert.match(staticRouteShells, /<title>/);
assert.match(staticRouteShells, /<meta name="description"/);
assert.match(staticRouteShells, /<link rel="canonical"/);
assert.match(staticRouteShells, /<meta property="og:title"/);
assert.match(staticRouteShells, /<meta property="og:description"/);
assert.match(staticRouteShells, /<meta property="og:url"/);
assert.match(staticRouteShells, /<meta name="twitter:title"/);
assert.match(staticRouteShells, /<meta name="twitter:description"/);
assert.match(staticRouteShells, /Missing static metadata for public route/);
assert.match(staticRouteShells, /writeFile\(path\.join\(routeDir, "index\.html"\), routeShell\(indexHtml, route\)/);
assert.doesNotMatch(staticRouteShells, /copyFile\(INDEX_FILE, path\.join\(routeDir, "index\.html"\)\)/);
assert.match(staticRouteShells, /NOINDEX_ROUTES = new Set\(\["\/login", "\/register", "\/upgrade", "\/verify-receipt"\]\)/);
assert.match(staticRouteShells, /noindex,nofollow/);
assert.ok(staticRouteShells.includes('"/support"'), "the public Support Hub needs a generated static shell");

for (const path of sitemapPaths) {
  assert.ok(staticRouteShells.includes(`"${path}"`), `${path} must have explicit static title/description metadata`);
}

console.log(`Search quality gates passed for ${publicSitelinks.length} priority routes and ${sitemapUrls.length} sitemap URLs.`);
