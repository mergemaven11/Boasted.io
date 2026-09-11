import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  getImpactReceiptPage,
  isReceiptVerified,
  sortImpactReceiptsVerifiedFirst,
} from "./impactReceiptLibrary.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const mainSource = read("src/main.jsx");
const foundation = read("src/UiUxFoundation.css");
const routeSource = read("src/RootContent.jsx");
const responsiveAudit = read("scripts/audit-responsive-layout.mjs");
const careerAnalyticsSource = read("src/ProCareerPage.jsx");
const careerAnalyticsStyles = read("src/ProCareerPage.css");
const impactReceiptsSource = read("src/ImpactReceiptsPage.jsx");
const impactReceiptsStyles = read("src/ImpactReceiptsPolish.css");
const impactReceiptsApiSource = read("src/impactReceiptLibraryApi.js");

const expectedUserFacingRoutes = [
  "/",
  "/support",
  "/education",
  "/docs",
  "/security",
  "/how-it-works",
  "/use-cases",
  "/contact",
  "/team",
  "/enterprise",
  "/app",
  "/app/settings",
  "/app/profile",
  "/app/settings/appearance",
  "/app/settings/billing",
  "/app/accomplishments",
  "/app/impact-receipts",
  "/app/applications",
  "/app/intelligence",
  "/app/resume-builder",
  "/app/reports",
  "/app/interview-practice",
];

test("app-wide UI foundation is loaded after feature styles", () => {
  const foundationImport = mainSource.lastIndexOf('import "./UiUxFoundation.css";');
  assert.ok(foundationImport >= 0, "main.jsx must load the app-wide UI/UX foundation");
  assert.ok(
    foundationImport > mainSource.lastIndexOf('import "./ProfileAppearancePreview.css";'),
    "the UI/UX foundation must be the final global stylesheet so guardrails apply consistently",
  );
});

test("foundation encodes responsive, accessibility, touch, and motion guardrails", () => {
  for (const token of [
    "--ui-space-1: 8px",
    "--ui-touch-target: 44px",
    ":focus-visible",
    "prefers-reduced-motion: reduce",
    "forced-colors: active",
    "pointer: coarse",
    "font-size: 16px",
    "max-height: calc(100dvh",
    "@media (max-width: 1280px)",
    "@media (max-width: 1024px)",
    "@media (max-width: 768px)",
    "@media (max-width: 600px)",
  ]) {
    assert.ok(foundation.includes(token), `missing whole-app UI guardrail: ${token}`);
  }
});

test("route inventory keeps the UI audit scoped to the whole customer app", () => {
  for (const route of expectedUserFacingRoutes) {
    assert.ok(routeSource.includes(`"${route}"`), `RootContent route inventory no longer contains ${route}`);
  }
});

test("browser responsive regression covers core navigation and settings surfaces", () => {
  for (const route of [
    "/app",
    "/app/accomplishments",
    "/app/impact-receipts",
    "/app/profile",
    "/app/settings",
    "/app/settings/appearance",
    "/app/settings/billing",
    "/app/intelligence",
  ]) {
    assert.ok(responsiveAudit.includes(`path: "${route}"`), `responsive browser audit must cover ${route}`);
  }

  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    assert.ok(responsiveAudit.includes(`width: ${width}`), `responsive audit must retain ${width}px coverage`);
  }
});

test("career analytics uses verified multidimensional intelligence instead of duplicate bar charts", () => {
  for (const token of [
    "/career-intelligence",
    "CareerOrbit",
    "CoverageRing",
    "TrajectoryLanes",
    "SkillPulse",
    "DomainField",
    "career_graph",
    "quantified_coverage_percent",
    "evidence_coverage_percent",
    "confirmation_coverage_percent",
    "receipt_coverage_percent",
    "recommended_actions",
    "recent_demonstrations",
    "historical_demonstrations",
  ]) {
    assert.ok(careerAnalyticsSource.includes(token), `career analytics is missing intelligence primitive: ${token}`);
  }

  assert.ok(
    !careerAnalyticsSource.includes('className="bar-row"'),
    "career analytics should not regress to duplicate generic bar-row visualizations",
  );
});

test("career analytics animation is distinctive, responsive, and reduced-motion safe", () => {
  for (const token of [
    ".pro-orbit",
    ".pro-coverage-ring",
    ".pro-trajectory-lane",
    ".pro-skill-timeline",
    ".pro-domain-card",
    "@keyframes pro-orbit-float",
    "@keyframes pro-ring-draw",
    "@keyframes pro-segment-grow",
    "@media(max-width:720px)",
    "@media(max-width:460px)",
    "@media(prefers-reduced-motion:reduce)",
  ]) {
    assert.ok(careerAnalyticsStyles.includes(token), `career analytics styles are missing: ${token}`);
  }
});

test("Impact Receipts prioritize verified proof, paginate the full library, and mask verifier names", () => {
  const receipts = [
    { id: "unverified-new", created_at: "2026-09-03T00:00:00Z", confirmations: [] },
    { id: "verified-old", created_at: "2026-01-01T00:00:00Z", confirmations: [{ status: "confirmed" }] },
    { id: "verified-new", created_at: "2026-08-20T00:00:00Z", confirmations: [{ status: "confirmed" }] },
  ];

  const sorted = sortImpactReceiptsVerifiedFirst(receipts);
  assert.deepEqual(sorted.map((receipt) => receipt.id), ["verified-new", "verified-old", "unverified-new"]);
  assert.equal(isReceiptVerified(sorted[0]), true);
  assert.deepEqual(getImpactReceiptPage(sorted, 2, 2).map((receipt) => receipt.id), ["unverified-new"]);

  for (const token of [
    "getAllImpactReceipts",
    "pageReceipts.map",
    "Verified receipts appear first",
    "pagination-shell",
    "receipt-verifier-name",
    "RECEIPTS_PER_PAGE",
  ]) {
    assert.ok(impactReceiptsSource.includes(token), `Impact Receipts UI is missing: ${token}`);
  }

  assert.ok(impactReceiptsStyles.includes("filter: blur(5px)"), "verifier names must remain visually obscured");
  assert.ok(impactReceiptsApiSource.includes("limit: API_PAGE_LIMIT, skip"), "receipt loader must request API pages explicitly");
  assert.ok(impactReceiptsApiSource.includes("data.has_more"), "receipt loader must continue until the full library is loaded");
});

test("a newly saved Impact Receipt immediately teaches the next four existing uses", () => {
  assert.match(
    impactReceiptsSource,
    /setSuccess\("Impact Receipt saved with evidence\."\); setShowNextUses\(true\)/,
    "the next-use panel must appear only after a successful receipt save",
  );

  for (const token of [
    "You captured this once",
    "Here are four things it can become.",
    "Resume bullet",
    "STAR answer",
    "Review statement",
    "Shareable proof",
    'href="/app/resume-builder"',
    'href="/app/interview-practice"',
    'href="/app/reports?packets=1"',
    'href="/app/profile"',
  ]) {
    assert.ok(impactReceiptsSource.includes(token), `receipt next-use guidance is missing: ${token}`);
  }

  for (const token of [
    ".receipt-next-use-card",
    ".receipt-next-use-grid",
    "grid-template-columns: repeat(4, minmax(0, 1fr))",
    "min-height: 44px",
    "@media (max-width: 900px)",
    "@media (max-width: 620px)",
  ]) {
    assert.ok(impactReceiptsStyles.includes(token), `receipt next-use responsive contract is missing: ${token}`);
  }
});
