import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "vite";

const HOST = "127.0.0.1";
const APP_PORT = 41742;
const DEBUG_PORT = 9225;
const BASE_URL = `http://${HOST}:${APP_PORT}`;
const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "public-profile-layout");

const VIEWPORTS = [
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-narrow-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-wide-1920", width: 1920, height: 1080 },
];

const LAYOUTS = [
  "editorial",
  "executive-sidebar",
  "career-timeline",
  "studio-split",
  "minimal-column",
  "portfolio-grid",
  "case-study",
  "modern-resume",
  "command-center",
  "academic",
  "founder",
  "compact",
];

const longSkills = {
  "Software Engineering": 5,
  FastAPI: 5,
  "UX Design": 5,
  "Platform Engineering": 4,
  React: 4,
  "Product Development": 4,
  "Career Technology": 4,
  "CI/CD": 4,
  SaaS: 3,
  Docker: 3,
  DNS: 3,
  DevOps: 3,
  "Software Architecture": 3,
  "Data Modeling": 3,
  Python: 3,
  Networking: 3,
  Git: 2,
  "API Integration": 2,
};

const sampleEntry = {
  id: "public-entry-1",
  title: "Reduced incident response time across a high-volume production support workflow",
  category: "Reliability Engineering",
  entry_date: "2026-08-20",
  entry_type: "Current Job",
  action: "Built an automated triage workflow that connected support context to engineering escalation paths.",
  impact: "Reduced response time by 42% while preserving escalation quality and customer context.",
  resume_bullet: "Reduced incident response time by 42% by automating production support triage and escalation routing.",
  tags: ["Software Engineering", "Platform Engineering", "API Integration", "CI/CD"],
  is_public: true,
};

const sampleReceipt = {
  id: "public-receipt-1",
  accomplishment: sampleEntry.title,
  contribution: sampleEntry.action,
  result: sampleEntry.impact,
  evidence: [{ title: "Incident response dashboard with a deliberately long evidence title", url: "https://example.com/evidence" }],
  skills: ["Software Engineering", "Platform Engineering", "API Integration"],
  metrics: [{ label: "Response time", value: "42%", context: "faster" }],
  confirmed_count: 1,
  is_public: true,
};

function layoutFromSlug(slug = "") {
  const prefix = "responsive-";
  const candidate = slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
  return LAYOUTS.includes(candidate) ? candidate : "editorial";
}

function json(res, body, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function mockApiResponse(method, rawUrl) {
  const url = new URL(rawUrl, "http://mock.local");
  const pathname = url.pathname.replace(/^\/__profile_api/, "");
  const match = pathname.match(/^\/public\/brag\/([^/]+)(\/.*)?$/);

  if (!match) return {};
  const slug = decodeURIComponent(match[1]);
  const suffix = match[2] || "";
  const layout = layoutFromSlug(slug);

  if (suffix === "/profile") {
    return {
      profile: {
        name: "Responsive Profile QA",
        headline: "Software engineer building reliable systems and evidence-backed career products",
        bio: "A deliberately long biography used to verify that every public profile template remains readable across phones, tablets, split panes, laptops, and wide desktop displays without horizontal clipping.",
        location: "Atlanta, Georgia",
        profile_layout: layout,
        profile_theme: "engineer",
        github_url: "https://github.com/example",
        portfolio_url: "https://example.com/portfolio",
        resume_url: "https://example.com/resume.pdf",
        work_history: [
          {
            role: "Senior Platform Support Engineer",
            company: "Example Company With A Longer Name",
            start_date: "2024",
            end_date: "Present",
            location: "Remote",
            summary: "Owned production support, incident response, automation, and cross-functional reliability improvements.",
          },
        ],
        projects: [
          {
            name: "Evidence-backed career proof platform",
            role: "Builder",
            summary: "Designed and shipped a product that turns real accomplishments into reusable proof.",
            skills: ["Product Development", "Software Architecture", "UX Design"],
            url: "https://example.com/project",
          },
        ],
      },
    };
  }
  if (suffix === "/impact-receipts") return { receipts: [sampleReceipt] };
  if (suffix === "/tags/summary") return { total_unique_tags: Object.keys(longSkills).length, tags: longSkills };
  if (suffix === "/connection") return { calendly_enabled: false, open_to_talk: false };
  if (suffix === "") {
    return {
      entries: [sampleEntry],
      total_entries: 1,
      activity_last_6_months: [],
    };
  }
  if (method === "POST") return { ok: true };
  return {};
}

function mockApiPlugin() {
  return {
    name: "boasted-public-profile-responsive-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/__profile_api")) return next();
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

async function waitFor(fn, timeoutMs = 12000) {
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

async function openProfile(cdp, layout) {
  await cdp.send("Page.navigate", { url: `${BASE_URL}/brag/responsive-${layout}` });
  await waitFor(async () => evaluate(cdp, `(() => {
    const root = document.querySelector('.proof-portfolio[data-layout="${layout}"]');
    return Boolean(root && document.querySelectorAll('.portfolio-skill-cloud > span').length >= 18);
  })()`));
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function measureProfile(cdp) {
  return evaluate(cdp, `(() => {
    const viewportWidth = window.innerWidth;
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
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
        return rect.left < -1 || rect.right > viewportWidth + 1;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        };
      });
    const skillCards = [...document.querySelectorAll('.portfolio-skill-cloud > span')].map((element) => {
      const rect = element.getBoundingClientRect();
      const label = element.querySelector('strong');
      const labelRect = label?.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        labelWidth: labelRect?.width || 0,
        labelScrollWidth: label?.scrollWidth || 0,
      };
    });
    const touchTargets = [...document.querySelectorAll('.portfolio-share, .proof-action')]
      .filter(visible)
      .map((element) => element.getBoundingClientRect().height);
    return {
      viewportWidth,
      documentWidth,
      root: rectFor('.proof-portfolio'),
      inner: rectFor('.proof-profile-inner'),
      hero: rectFor('.portfolio-hero'),
      skills: rectFor('.portfolio-skills-section'),
      offenders,
      skillCards,
      touchTargets,
    };
  })()`);
}

function assertWithinViewport(rect, viewportWidth, label) {
  assert.ok(rect, `${label} is not visible`);
  assert.ok(rect.left >= -1, `${label} starts outside viewport: left=${rect.left}`);
  assert.ok(rect.right <= viewportWidth + 1, `${label} is cut off: right=${rect.right}, viewport=${viewportWidth}`);
  assert.ok(rect.width <= viewportWidth + 1, `${label} is wider than viewport: width=${rect.width}`);
}

async function captureFailure(cdp, layout, viewport) {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const filename = `${layout}-${viewport.name}.png`;
  await fs.writeFile(path.join(SCREENSHOT_DIR, filename), Buffer.from(result.data, "base64"));
  return filename;
}

const chrome = findChrome();
assert.ok(chrome, "Chrome/Chromium is required for public profile layout CI");
process.env.VITE_API_BASE_URL = "/__profile_api";

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
    for (const layout of LAYOUTS) {
      const label = `${layout} @ ${viewport.width}x${viewport.height}`;
      try {
        await openProfile(cdp, layout);
        const measurement = await measureProfile(cdp);
        assert.ok(
          measurement.documentWidth <= measurement.viewportWidth + 1,
          `${label} has horizontal overflow: document=${measurement.documentWidth}, viewport=${measurement.viewportWidth}`,
        );
        assertWithinViewport(measurement.root, measurement.viewportWidth, `${label} profile`);
        assertWithinViewport(measurement.inner, measurement.viewportWidth, `${label} profile inner`);
        assertWithinViewport(measurement.hero, measurement.viewportWidth, `${label} hero`);
        assertWithinViewport(measurement.skills, measurement.viewportWidth, `${label} skills section`);
        assert.equal(measurement.offenders.length, 0, `${label} has clipped elements: ${JSON.stringify(measurement.offenders)}`);
        assert.equal(measurement.skillCards.length, 18, `${label} should render all 18 skill cards`);
        measurement.skillCards.forEach((card, index) => {
          assert.ok(card.width >= 180, `${label} skill card ${index + 1} is too narrow: ${card.width}px`);
          assert.ok(card.labelScrollWidth <= card.labelWidth + 1, `${label} skill label ${index + 1} overflows its card`);
        });
        measurement.touchTargets.forEach((height, index) => {
          assert.ok(height >= 44, `${label} touch target ${index + 1} is only ${height}px high`);
        });
        console.log(`PUBLIC PROFILE UI PASS ${label}`);
      } catch (error) {
        let screenshot = "";
        try { screenshot = await captureFailure(cdp, layout, viewport); } catch { /* best effort */ }
        failures.push(`${label}: ${error.message}${screenshot ? ` [screenshot: ${screenshot}]` : ""}`);
      }
    }
  }

  if (failures.length) {
    console.error("\nPUBLIC PROFILE UI FAILURES");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`\nPublic profile guard passed ${LAYOUTS.length} templates across ${VIEWPORTS.length} viewport sizes (${LAYOUTS.length * VIEWPORTS.length} checks).`);
  }
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null && browser.signalCode === null) browser.kill("SIGKILL");
  await server.close();
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}
