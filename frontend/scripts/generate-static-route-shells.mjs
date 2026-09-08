import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  "/support",
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

const NOINDEX_ROUTES = new Set(["/login", "/register", "/upgrade", "/verify-receipt"]);

const ROUTE_META = Object.freeze({
  "/privacy": {
    title: "Privacy Policy | Boasted",
    description: "Read the Boasted Privacy Policy, including information collection, career evidence, sharing, AI-assisted features, retention, security, and privacy choices.",
  },
  "/terms": {
    title: "Terms and Conditions | Boasted",
    description: "Read the terms governing Boasted accounts, user content, acceptable use, subscriptions, AI-assisted career content, confidentiality, and service use.",
  },
  "/nda-safety": {
    title: "NDA & Confidential Work Guidance | Boasted",
    description: "Learn how to document professional accomplishments in Boasted without overriding NDAs, employer policies, client agreements, or confidentiality obligations.",
  },
  "/security": {
    title: "Boasted Security | Private-by-Default Career Evidence",
    description: "Read Boasted's security approach, private-by-default model, confidential-work guidance, payment handling, and instructions for reporting a security concern.",
  },
  "/contact": {
    title: "Contact Boasted | Support, Privacy, Security & Billing",
    description: "Contact Boasted for product support, general questions, privacy requests, security concerns, billing questions, or legal correspondence.",
  },
  "/support": {
    title: "Boasted Support Hub | Product Help, Beta Access & Security",
    description: "Get Boasted product and account help, troubleshoot issues, understand complimentary beta access, review NDA guidance, and reach support, billing, privacy, or security contacts.",
  },
  "/team": {
    title: "Boasted for Teams | Coming Soon",
    description: "Learn about the planned Boasted Team direction for evidence-backed reviews, employee-controlled sharing, bounded analytics, and organization workflows without surveillance.",
  },
  "/enterprise": {
    title: "Boasted Enterprise | Governance Roadmap for Career Evidence",
    description: "Learn about Boasted's early enterprise direction for identity, governance, retention, admin policy controls, integrations, and employee-controlled evidence boundaries.",
  },
  "/use-cases": {
    title: "Boasted Use Cases | Reviews, Promotions, Resumes & Interviews",
    description: "Explore Boasted use cases across professions for reviews, promotions, resumes, interviews, certifications, career changes, freelancers, founders, students, and education-to-career proof.",
  },
  "/how-it-works": {
    title: "How Boasted Works | Capture, Prove & Reuse Career Evidence",
    description: "See how Boasted helps people in any profession capture accomplishments, create Impact Receipts, reuse evidence for career moments, share selectively, and keep private work private.",
  },
  "/login": {
    title: "Sign In to Boasted | Career Proof",
    description: "Sign in to Boasted to access your career proof, Impact Receipts, Resume Builder, and Practice Interviewer.",
  },
  "/register": {
    title: "Sign up for Boasted | Start Free",
    description: "Create a free Boasted account and start turning your accomplishments into career proof for resumes, interviews, reviews, promotions, portfolios, and career transitions.",
  },
  "/upgrade": {
    title: "Boasted Pro | Upgrade",
    description: "Review Boasted Pro upgrade options from inside your account.",
  },
  "/verify-receipt": {
    title: "Verify an Impact Receipt | Boasted",
    description: "Open a Boasted Impact Receipt verification flow using a direct verification link.",
  },
  "/education": {
    title: "Boasted Education | Turn Learning into Career Proof",
    description: "Boasted Education helps college, university, trade, technical, certification, bootcamp, and continuing-education learners turn real coursework, projects, training, research, and achievements into reusable career proof.",
  },
  "/docs": {
    title: "Boasted Docs | How to Use Career Proof",
    description: "Learn how people across professions can use Boasted, Impact Receipts, Resume Builder, Practice Interviewer, privacy controls, and career proof workflows.",
  },
  "/docs/education": {
    title: "Boasted Education Guide | Learning & Career Proof",
    description: "Learn how to use Boasted Education to capture coursework, projects, certifications, achievements, and contributions, then reuse that evidence for applications, resumes, interviews, portfolios, and career planning.",
  },
  "/legal/education-data": {
    title: "Education Data Guidance | Boasted",
    description: "Review how Boasted handles education-related records, user-provided learning evidence, privacy boundaries, and responsible use of education data.",
  },
  "/resume-accomplishments": {
    title: "Resume Accomplishments & Achievement Tracker | Boasted",
    description: "Track work accomplishments, measurable impact, and evidence so you can build stronger resume bullets from real career proof.",
  },
  "/interview-preparation": {
    title: "Interview Preparation From Real Work Accomplishments | Boasted",
    description: "Prepare behavioral and technical interview stories from documented situations, actions, results, metrics, and skills.",
  },
  "/pricing": {
    title: "Boasted Pricing | Free & Pro Career Proof Plans",
    description: "Compare Boasted Free and Pro plans for capturing accomplishments, building Impact Receipts, generating career outputs, and reusing professional proof.",
  },
  "/impact-receipts": {
    title: "Impact Receipts | Evidence-Backed Work Accomplishments | Boasted",
    description: "Create structured proof of your contribution, result, evidence, skills, shared credit, and measurable career impact.",
  },
  "/performance-reviews": {
    title: "Performance Review Accomplishment Tracker | Boasted",
    description: "Capture wins throughout the year and turn documented impact into performance-review material without rebuilding months of work from memory.",
  },
  "/career-portfolio": {
    title: "Career Portfolio & Professional Proof Profile | Boasted",
    description: "Build a professional career portfolio from selected accomplishments, skills, evidence, and measurable impact while keeping your account private by default.",
  },
  "/promotion-packet": {
    title: "Promotion Packet & Career Impact Evidence | Boasted",
    description: "Organize scope, ownership, leadership, growth, and measurable results into evidence-backed promotion material.",
  },
  "/career-analytics": {
    title: "Career Analytics for Skills, Accomplishments & Impact | Boasted",
    description: "See patterns across your skills, work accomplishments, evidence coverage, ownership, and career impact over time.",
  },
  "/public-proof-profiles": {
    title: "Public Career Proof Profiles for Hiring & Portfolios | Boasted",
    description: "Share selected accomplishments and Impact Receipts with recruiters, hiring managers, clients, and your network without exposing private work history.",
  },
  "/guides": {
    title: "Career Accomplishment Guides | Boasted",
    description: "Practical guides for tracking work accomplishments, building a brag document, preparing performance-review evidence, writing resume achievements, creating STAR interview stories, and organizing promotion proof.",
  },
  "/guides/brag-document": {
    title: "What Is a Brag Document? Work Accomplishment Guide | Boasted",
    description: "Learn how to build a brag document that captures wins, results, evidence, skills, and shared credit for reviews, resumes, interviews, and promotions.",
  },
  "/guides/track-work-accomplishments": {
    title: "How to Track Work Accomplishments | Boasted",
    description: "Use a simple system to track work accomplishments, measurable results, evidence, skills, and shared credit throughout the year instead of rebuilding your career story from memory.",
  },
  "/guides/performance-review-accomplishments": {
    title: "Performance Review Accomplishments Guide | Boasted",
    description: "Learn how to prepare specific performance-review accomplishments using scope, action, result, evidence, growth, collaboration, and measurable impact.",
  },
  "/guides/star-interview-stories": {
    title: "STAR Interview Stories: Method & Examples | Boasted",
    description: "Prepare STAR interview stories from real situations, actions, results, decisions, and lessons instead of memorized generic scripts.",
  },
  "/guides/resume-accomplishment-examples": {
    title: "Resume Accomplishment Examples & Writing Guide | Boasted",
    description: "Turn job duties into truthful resume accomplishment bullets using action, scope, results, metrics, and context across technical support, software, operations, service, and leadership work.",
  },
  "/guides/promotion-packet": {
    title: "Promotion Packet Guide: Evidence & Impact | Boasted",
    description: "Build a promotion packet around role criteria, sustained impact, increased scope, leadership, collaboration, growth, and supporting evidence collected over time.",
  },
});

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

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function routeShell(indexHtml, route) {
  const canonicalUrl = `${SITE_ORIGIN}${route}`;
  const meta = ROUTE_META[route];
  if (!meta) throw new Error(`Missing static metadata for public route: ${route}`);

  const title = escapeHtmlAttribute(meta.title);
  const description = escapeHtmlAttribute(meta.description);
  let html = indexHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${canonicalUrl}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${canonicalUrl}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${title}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${description}" />`,
    );

  if (NOINDEX_ROUTES.has(route)) {
    html = html.replace(
      /<meta name="robots" content="[^"]*"\s*\/>/,
      '<meta name="robots" content="noindex,nofollow" />',
    );
  }

  return html;
}

const [sitemapXml, indexHtml] = await Promise.all([
  readFile(SITEMAP_FILE, "utf8"),
  readFile(INDEX_FILE, "utf8"),
]);
const routes = new Set([
  ...sitemapRoutes(sitemapXml),
  ...REQUIRED_CLIENT_ROUTES.map(normalizeRoute).filter(Boolean),
]);

for (const route of [...routes].sort()) {
  const relativeRoute = route.slice(1);
  const routeDir = path.join(DIST_DIR, relativeRoute);
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, "index.html"), routeShell(indexHtml, route), "utf8");
}

// Render serves a static site, so unknown client-side routes need an SPA shell too.
// Keep the generic 404 shell canonicalized to the homepage. Dynamic public profile
// metadata is handled separately through the public share representation.
await writeFile(path.join(DIST_DIR, "404.html"), indexHtml, "utf8");

console.log(`Generated route-specific SPA shells for ${routes.size} public/client routes.`);
