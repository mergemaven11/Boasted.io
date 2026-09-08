import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "vite";
import { PROFILE_LAYOUTS } from "../src/profileThemes.js";

const HOST = "127.0.0.1";
const APP_PORT = 41742;
const DEBUG_PORT = 9225;
const BASE_URL = `http://${HOST}:${APP_PORT}`;
const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "public-profile-layout");

const VIEWPORTS = [
  { name: "phone-320", width: 320, height: 800 },
  { name: "phone-375", width: 375, height: 812 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const LONG_TOKEN = "proof-" + "x".repeat(180);
const LONG_URL = `https://example.com/evidence/${"proof".repeat(48)}`;
const SKILLS = Array.from({ length: 25 }, (_, index) => (
  index === 7 ? `Observability-${"S".repeat(88)}` : `Skill ${String(index + 1).padStart(2, "0")} — Production Support Reliability`
));

const ENTRIES = Array.from({ length: 8 }, (_, index) => ({
  id: `entry-${index + 1}`,
  title: index === 0
    ? `Led ${LONG_TOKEN} through a multi-region customer escalation without dropping ownership or evidence`
    : `Resolved complex production support incident ${index + 1} while improving reliability and customer communication`,
  category: index % 2 === 0 ? "Reliability Engineering" : "Customer Impact",
  entry_date: `2026-0${(index % 8) + 1}-15`,
  entry_type: index % 2 === 0 ? "Current Job" : "Side Project",
  situation: "A high-severity issue crossed teams, systems, dashboards, and customer communication channels.",
  action: "Owned triage, narrowed the failure domain, coordinated contributors, documented evidence, and automated the repeatable recovery path.",
  impact: "Cut time-to-mitigation by 42%, preserved customer trust, and created a reusable incident workflow for the next escalation.",
  resume_bullet: "Reduced time-to-mitigation by 42% by coordinating cross-functional incident response and automating evidence capture.",
  tags: SKILLS.slice(index, index + 8),
  is_public: true,
}));

const RECEIPTS = Array.from({ length: 6 }, (_, index) => ({
  id: `receipt-${index + 1}`,
  accomplishment: index === 0
    ? `Recovered a production workflow from ${LONG_TOKEN} while preserving a complete evidence trail`
    : `Improved production support outcome ${index + 1} with measurable operational impact`,
  contribution: "Drove diagnosis, stakeholder coordination, technical remediation, documentation, and post-incident follow-through across engineering and support.",
  result: "Reduced repeated escalation work, shortened recovery time, and improved the quality of evidence available for future reviews and career artifacts.",
  evidence: [
    { title: `Incident dashboard ${LONG_TOKEN}`, reference: LONG_URL },
    { title: "Customer impact timeline", reference: "https://example.com/timeline" },
    { title: "Post-incident runbook", reference: "https://example.com/runbook" },
  ],
  skills: SKILLS.slice(index, index + 10),
  metrics: [{ value: `${42 + index}%`, label: "faster recovery", context: "Across a high-volume support workflow" }],
  confirmed_count: index < 4 ? index + 1 : 0,
  is_public: true,
}));

function profileFor(layoutId) {
  return {
    id: `profile-${layoutId}`,
    name: "Alexandria Morgan-Quinn Support Engineer",
    headline: "Principal Technical Support and Cloud Reliability Engineer for Complex Multi-Region Production Escalations and Customer-Critical Systems",
    bio: "I turn difficult support incidents into measurable operational improvements, reusable systems, and evidence-backed career proof. This intentionally long biography exercises wrapping, spacing, and card sizing across every public profile template.",
    location: "Atlanta Metropolitan Area — Hybrid / Distributed Systems / Customer-Critical Operations",
    public_slug: layoutId,
    profile_theme: "engineer",
    profile_layout: layoutId,
    github_url: LONG_URL,
    portfolio_url: LONG_URL,
    resume_url: LONG_URL,
    work_history: Array.from({ length: 4 }, (_, index) => ({
      role: index === 0
        ? "Principal Technical Support Engineer — Cloud Platforms, Kubernetes, Docker, Observability, Escalations, and Reliability Engineering"
        : `Senior Production Support Engineer ${index + 1}`,
      company: index === 0 ? `Enterprise Platform Company ${LONG_TOKEN}` : `Platform Company ${index + 1}`,
      start_date: "2023",
      end_date: index === 0 ? "Present" : "2025",
      location: "Remote / United States",
      summary: "Owned complex production incidents, customer escalations, reliability improvements, and durable knowledge systems while collaborating across support, engineering, and product.",
    })),
    profile_projects: Array.from({ length: 3 }, (_, index) => ({
      name: index === 0 ? `Operational Evidence Platform ${LONG_TOKEN}` : `Reliability Project ${index + 1}`,
      role: "Builder and operator",
      summary: "Converted fragmented operational work into reusable evidence, structured impact, and safer repeatable workflows.",
      skills: SKILLS.slice(index, index + 8),
      url: LONG_URL,
    })),
  };
}

function tagsSummary() {
  return {
    total_unique_tags: SKILLS.length,
    tags: Object.fromEntries(SKILLS.map((skill, index) => [skill, (index % 4) + 1])),
  };
}

function json(res, body, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function slugFromPath(pathname) {
  const match = pathname.match(/^\/public\/brag\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : "editorial";
}

function mockApiResponse(method, rawUrl) {
  const url = new URL(rawUrl, "http://mock.local");
  const pathname = url.pathname.replace(/^\/__public_profile_api/, "");
  const slug = slugFromPath(pathname);
  const layout = PROFILE_LAYOUTS.find((item) => item.id === slug) || PROFILE_LAYOUTS[0];

  if (method === "POST" && pathname.endsWith("/analytics")) return { ok: true };
  if (pathname.endsWith("/profile")) return { profile: profileFor(layout.id) };
  if (pathname.endsWith("/impact-receipts")) return { receipts: RECEIPTS };
  if (pathname.endsWith("/tags/summary")) return tagsSummary();
  if (pathname.endsWith("/connection")) return { open_to_talk: false, calendly_enabled: false, open_to_talk_types: [] };
  if (/^\/public\/brag\/[^/]+$/.test(pathname)) {
    const limit = Number(url.searchParams.get("limit") || 6);
    const skip = Number(url.searchParams.get("skip") || 0);
    return {
      entries: ENTRIES.slice(skip, skip + limit),
      total_entries: ENTRIES.length,
      activity_last_6_months: [],
    };
  }
  return {};
}

function mockApiPlugin() {
  return {
    name: "boasted-public-profile-layout-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/__public_profile_api")) return next();
        req.on("data", () => {});
        req.on("end", () => json(res, mockApiResponse(req.method || "GET", req.url || "/")));
      });
    },
  };
}

function findChrome() {
  return ["google-chrome", "chromium", "chromium-browser"]
    .find((name) => spawnSync("which", [name], { encoding: "utf8" }).status === 0);
}

async function waitFor(fn, timeoutMs = 10000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await fn();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error(`Timed out after ${timeoutMs}ms`);
}

async function findPageTarget() {
  return waitFor(async () => {
    const response = await fetch(`http://${HOST}:${DEBUG_PORT}/json/list`);
    if (!response.ok) return null;
    const targets = await response.json();
    return targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl) || null;
  }, 5000);
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try { this.ws.close(); } catch { /* ignore */ }
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
  return result.result?.value;
}

async function setViewport(cdp, viewport) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function openProfile(cdp, layoutId) {
  await cdp.send("Page.navigate", { url: `${BASE_URL}/brag/${encodeURIComponent(layoutId)}` });
  await waitFor(async () => {
    const ready = await evaluate(cdp, `(() => ({
      state: document.readyState,
      profile: Boolean(document.querySelector('.proof-portfolio[data-layout="${layoutId}"]')),
      heading: document.querySelector('.portfolio-identity h1')?.textContent || '',
      receipts: document.querySelectorAll('.portfolio-impact-card').length,
      work: document.querySelectorAll('.portfolio-work-card').length
    }))()`);
    return ready.state !== "loading" && ready.profile && ready.heading && ready.receipts >= 1 && ready.work >= 1;
  }, 12000);
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function measureProfile(cdp) {
  return evaluate(cdp, `(() => {
    const viewportWidth = window.innerWidth;
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const root = document.querySelector('.proof-portfolio');
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!visible(element)) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
    };
    const offenders = [...document.querySelectorAll('.proof-portfolio *')]
      .filter((element) => {
        if (!visible(element)) return false;
        const style = getComputedStyle(element);
        if (['fixed', 'absolute'].includes(style.position)) return false;
        if (['auto', 'scroll'].includes(style.overflowX)) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > viewportWidth + 1 || rect.width > viewportWidth + 1;
      })
      .slice(0, 20)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          text: (element.textContent || '').trim().slice(0, 80),
        };
      });
    const touchTargets = [...document.querySelectorAll('.portfolio-share, .proof-action, .proof-filter-row button, .proof-pagination-controls button, .portfolio-footer button')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { label: (element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 80), height: rect.height, width: rect.width };
      });
    const hiddenMeaningful = [...document.querySelectorAll('.portfolio-impact-card, .portfolio-work-card, .portfolio-career-item, .portfolio-skill-cloud > span')]
      .filter((element) => !visible(element))
      .length;
    return {
      viewportWidth,
      documentWidth,
      layout: root?.getAttribute('data-layout') || '',
      inner: rectFor('.proof-profile-inner'),
      hero: rectFor('.portfolio-hero'),
      passport: rectFor('.portfolio-proof-passport'),
      impactGrid: rectFor('.portfolio-impact-grid'),
      workGrid: rectFor('.portfolio-work-grid'),
      headingText: document.querySelector('.portfolio-identity h1')?.textContent || '',
      skillCount: document.querySelectorAll('.portfolio-skill-cloud > span').length,
      receiptCount: document.querySelectorAll('.portfolio-impact-card').length,
      workCount: document.querySelectorAll('.portfolio-work-card').length,
      careerCount: document.querySelectorAll('.portfolio-career-item').length,
      touchTargets,
      hiddenMeaningful,
      offenders,
    };
  })()`);
}

function assertWithinViewport(rect, viewportWidth, label) {
  assert.ok(rect, `${label} is not visible`);
  assert.ok(rect.left >= -1, `${label} starts outside viewport: left=${rect.left}`);
  assert.ok(rect.right <= viewportWidth + 1, `${label} is clipped on the right: right=${rect.right}, viewport=${viewportWidth}`);
  assert.ok(rect.width <= viewportWidth + 1, `${label} is wider than viewport: width=${rect.width}, viewport=${viewportWidth}`);
}

async function captureFailure(cdp, layoutId, viewport) {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const filename = `${layoutId}-${viewport.name}.png`;
  await fs.writeFile(path.join(SCREENSHOT_DIR, filename), Buffer.from(result.data, "base64"));
  return filename;
}

const chrome = findChrome();
assert.ok(chrome, "Chrome/Chromium is required for public profile layout CI");
assert.equal(PROFILE_LAYOUTS.length, 12, "public profile CI expects the 12 supported layouts");
process.env.VITE_API_BASE_URL = "/__public_profile_api";

const server = await createServer({
  root: process.cwd(),
  logLevel: "error",
  plugins: [mockApiPlugin()],
  server: { host: HOST, port: APP_PORT, strictPort: true },
});
const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "boasted-public-profile-layout-"));
let browser;
let cdp;
const failures = [];

try {
  await fs.rm(SCREENSHOT_DIR, { recursive: true, force: true });
  await server.listen();
  browser = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  const target = await findPageTarget();
  cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.open();
  await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable")]);

  for (const viewport of VIEWPORTS) {
    await setViewport(cdp, viewport);
    for (const layout of PROFILE_LAYOUTS) {
      const label = `${layout.id} @ ${viewport.width}x${viewport.height}`;
      try {
        await openProfile(cdp, layout.id);
        const profile = await measureProfile(cdp);

        assert.equal(profile.layout, layout.id, `${label} rendered the wrong layout`);
        assert.ok(profile.headingText.length >= 20, `${label} lost the long profile name`);
        assert.ok(profile.skillCount >= 18, `${label} should render the full visible skill stress set`);
        assert.equal(profile.receiptCount, 6, `${label} should render six Impact Receipts`);
        assert.equal(profile.workCount, 6, `${label} should render the first six public accomplishments`);
        assert.ok(profile.careerCount >= 7, `${label} should render work and project history`);
        assert.equal(profile.hiddenMeaningful, 0, `${label} hides meaningful proof content`);
        assert.ok(
          profile.documentWidth <= profile.viewportWidth + 1,
          `${label} has horizontal document overflow: document=${profile.documentWidth}, viewport=${profile.viewportWidth}`,
        );
        assertWithinViewport(profile.inner, profile.viewportWidth, `${label} profile container`);
        assertWithinViewport(profile.hero, profile.viewportWidth, `${label} hero`);
        assertWithinViewport(profile.passport, profile.viewportWidth, `${label} proof passport`);
        assertWithinViewport(profile.impactGrid, profile.viewportWidth, `${label} impact grid`);
        assertWithinViewport(profile.workGrid, profile.viewportWidth, `${label} work grid`);
        assert.equal(profile.offenders.length, 0, `${label} has clipped/overflowing elements: ${JSON.stringify(profile.offenders)}`);

        profile.touchTargets.forEach((target) => {
          assert.ok(target.height >= 43.5, `${label} touch target is too short (${target.height}px): ${target.label}`);
        });

        console.log(`PUBLIC PROFILE PASS ${label}`);
      } catch (error) {
        let screenshot = "";
        try { screenshot = await captureFailure(cdp, layout.id, viewport); } catch { /* best effort */ }
        failures.push(`${label}: ${error.message}${screenshot ? ` [screenshot: ${screenshot}]` : ""}`);
      }
    }
  }

  if (failures.length) {
    console.error("\nPUBLIC PROFILE LAYOUT FAILURES");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`\nPublic profile guard passed ${PROFILE_LAYOUTS.length * VIEWPORTS.length} layout/viewport combinations.`);
  }
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null && browser.signalCode === null) browser.kill("SIGKILL");
  await server.close();
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}
