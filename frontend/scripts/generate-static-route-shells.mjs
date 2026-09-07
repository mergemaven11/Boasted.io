import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, "..");
const DIST_DIR = path.join(FRONTEND_DIR, "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");
const SITEMAP_FILE = path.join(FRONTEND_DIR, "public", "sitemap.xml");
const SITE_ORIGIN = "https://boasted.io";

const REQUIRED_CLIENT_ROUTES = [
  "/privacy",
  "/terms",
  "/nda-safety",
  "/security",
  "/contact",
  "/team",
  "/enterprise",
  "/use-cases",
  "/how-it-works",
  "/login",
  "/register",
  "/upgrade",
  "/verify-receipt",
  "/education",
  "/docs",
  "/docs/education",
  "/legal/education-data",
];

function normalizeRoute(route) {
  const pathname = route.split(/[?#]/, 1)[0] || "/";
  if (!pathname.startsWith("/")) return null;
  if (pathname === "/") return null;
  if (pathname.includes("..")) throw new Error(`Unsafe route in static shell generator: ${route}`);
  return pathname.replace(/\/+$/, "");
}

function sitemapRoutes(xml) {
  const routes = [];
  const pattern = /<loc>([^<]+)<\/loc>/g;
  for (const match of xml.matchAll(pattern)) {
    const url = new URL(match[1]);
    if (url.origin !== SITE_ORIGIN) continue;
    const normalized = normalizeRoute(url.pathname);
    if (normalized) routes.push(normalized);
  }
  return routes;
}

const sitemapXml = await readFile(SITEMAP_FILE, "utf8");
const routes = new Set([
  ...sitemapRoutes(sitemapXml),
  ...REQUIRED_CLIENT_ROUTES.map(normalizeRoute).filter(Boolean),
]);

for (const route of [...routes].sort()) {
  const relativeRoute = route.slice(1);
  const routeDir = path.join(DIST_DIR, relativeRoute);
  await mkdir(routeDir, { recursive: true });
  await copyFile(INDEX_FILE, path.join(routeDir, "index.html"));
}

// Render serves a static site, so unknown client-side routes need an SPA shell too.
// This keeps dynamic public profile/share links from becoming a dead-end 404 page.
await copyFile(INDEX_FILE, path.join(DIST_DIR, "404.html"));

console.log(`Generated SPA route shells for ${routes.size} public/client routes.`);
