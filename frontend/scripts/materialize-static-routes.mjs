import fs from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

const routes = [
  "/login",
  "/register",
  "/upgrade",
  "/verify-receipt",
  "/privacy",
  "/terms",
  "/nda-safety",
  "/security",
  "/docs",
  "/docs/education",
  "/education",
  "/how-it-works",
  "/use-cases",
  "/contact",
  "/team",
  "/enterprise",
  "/pricing",
  "/resume-accomplishments",
  "/career-portfolio",
  "/performance-reviews",
  "/promotion-packet",
  "/interview-preparation",
  "/impact-receipts",
  "/career-analytics",
  "/public-proof-profiles",
  "/app",
  "/app/intelligence",
  "/app/accomplishments",
  "/app/impact-receipts",
  "/app/resume-builder",
  "/app/reports",
  "/app/interview-practice",
  "/app/profile",
  "/app/settings",
  "/app/settings/appearance",
  "/app/settings/billing",
  "/app/applications",
  "/app/executive-impact",
  "/ops",
  "/ops/users",
  "/ops/ai-verification",
];

const indexHtml = await fs.readFile(indexPath, "utf8");

for (const route of routes) {
  const clean = route.replace(/^\/+|\/+$/g, "");
  if (!clean) continue;

  const routeDir = path.join(distDir, clean);
  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(path.join(routeDir, "index.html"), indexHtml, "utf8");

  // Some static hosts resolve extensionless paths to a sibling .html file
  // instead of a directory index. Writing both forms keeps deep links portable.
  await fs.writeFile(path.join(distDir, `${clean}.html`), indexHtml, "utf8");
}

// Keep the SPA shell available for dynamic client routes (for example
// /brag/<slug>) instead of falling through to a dead static-host 404 page.
await fs.writeFile(path.join(distDir, "404.html"), indexHtml, "utf8");

console.log(`Materialized ${routes.length} client routes plus SPA fallback.`);
