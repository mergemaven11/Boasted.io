import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "vite";

const HOST = "127.0.0.1";
const APP_PORT = 41741;
const DEBUG_PORT = 9224;
const BASE_URL = `http://${HOST}:${APP_PORT}`;
const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "ui-layout");

const VIEWPORTS = [
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-narrow-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-wide-1920", width: 1920, height: 1080 },
];

const ROUTES = [
  { path: "/app", dashboard: true },
  { path: "/app/accomplishments" },
  { path: "/app/impact-receipts" },
  { path: "/app/profile" },
  { path: "/app/settings" },
  { path: "/app/settings/appearance" },
  { path: "/app/settings/billing" },
  { path: "/app/intelligence" },
];

const proUser = {
  id: "responsive-user",
  email: "qa@usebragstack.test",
  name: "Responsive QA",
  headline: "Layout regression tester",
  bio: "Automated responsive layout account",
  location: "Atlanta, GA",
  public_slug: "responsive-qa",
  plan: "pro",
  entitlements: {
    resume_builder: true,
    advanced_reports: true,
    interview_practice: true,
    impact_receipts: true,
    executive_command_center: true,
  },
};

const sampleEntry = {
  id: "entry-1",
  title: "Reduced incident response time across a high-volume production support workflow",
  category: "Reliability",
  entry_date: "2026-08-20",
  entry_type: "Current Job",
  situation: "Incident response was slow.",
  action: "Built an automated triage workflow.",
  impact: "Reduced response time by 42% while preserving escalation quality.",
  lesson: "Automate the repetitive parts first.",
  resume_bullet: "Reduced incident response time by 42% by automating production support triage and escalation routing.",
  tags: ["automation", "reliability", "incident-response", "production-support"],
  is_public: false,
};

const sampleReceipt = {
  id: "receipt-1",
  source_entry_id: sampleEntry.id,
  entry_id: sampleEntry.id,
  accomplishment: sampleEntry.title,
  contribution: sampleEntry.action,
  result: sampleEntry.impact,
  evidence: [{ title: "Incident dashboard", url: "https://example.com/evidence", is_public: false }],
  skills: ["Automation", "Reliability"],
  credit: [],
  confirmations: [],
  is_public: false,
};

function json(res, body, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function mockApiResponse(method, rawUrl) {
  const url = new URL(rawUrl, "http://mock.local");
  const pathname = url.pathname.replace(/^\/__responsive_api/, "");

  if (pathname === "/health") return { status: "ok" };
  if (pathname === "/auth/me") return proUser;
  if (pathname === "/entries") {
    return method === "GET"
      ? { entries: [sampleEntry], total_entries: 1 }
      : sampleEntry;
  }
  if (/^\/entries\/[^/]+$/.test(pathname)) return sampleEntry;
  if (pathname === "/entries/reports/weekly") return { total_entries: 1, entries: [sampleEntry] };
  if (pathname === "/entries/tags/summary") {
    return {
      total_unique_tags: 4,
      tags: {
        automation: 1,
        reliability: 1,
        "incident-response": 1,
        "production-support": 1,
      },
    };
  }
  if (pathname === "/entries/categories/summary") return { categories: { Reliability: 1 } };
  if (pathname.startsWith("/impact-receipts")) {
    return method === "GET" ? { receipts: [sampleReceipt], total: 1 } : sampleReceipt;
  }
  if (pathname === "/career-intelligence") {
    return {
      summary: { accomplishments: 1, impact_receipts: 1, unique_skills: 2, quantified_results: 1, evidence_items: 1, confirmed_receipts: 0 },
      top_skills: [{ skill: "Automation", signal: "established", evidence_points: 64, demonstrations: 1 }],
      skills: [{ skill: "Automation", signal: "established", evidence_points: 64, demonstrations: 1 }],
      top_categories: [{ category: "Reliability", count: 1 }],
      gaps: [],
      recommended_actions: [],
      methodology: { version: "responsive-layout-ci" },
    };
  }
  if (pathname === "/billing/status") return { plan: "pro", status: "active", cancel_at_period_end: false };
  if (method === "DELETE") return { ok: true };
  return {};
}

function mockApiPlugin() {
  return {
    name: "bragstack-responsive-layout-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/__responsive_api")) return next();
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

async function openAuthenticatedRoute(cdp, route) {
  await cdp.send("Page.navigate", { url: BASE_URL });
  await new Promise((resolve) => setTimeout(resolve, 250));
  await evaluate(cdp, 'localStorage.setItem("bragstack_token", "responsive-e2e-token");');
  await cdp.send("Page.navigate", { url: `${BASE_URL}${route}` });

  await waitFor(async () => {
    const ready = await evaluate(cdp, `(() => ({
      state: document.readyState,
      shell: Boolean(document.querySelector(".authenticated-content")),
      loader: Boolean(document.querySelector(".bragstack-loader"))
    }))()`);
    return ready.state !== "loading" && ready.shell && !ready.loader;
  }, 12000);

  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function measureLayout(cdp, dashboard) {
  return evaluate(cdp, `(() => {
    const viewportWidth = window.innerWidth;
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!visible(element)) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, top: rect.top, bottom: rect.bottom };
    };
    const offenders = [...document.querySelectorAll(".authenticated-content *")]
      .filter((element) => {
        if (!visible(element)) return false;
        const style = getComputedStyle(element);
        if (["fixed", "absolute"].includes(style.position)) return false;
        if (["auto", "scroll"].includes(style.overflowX)) return false;
        const rect = element.getBoundingClientRect();
        return rect.right > viewportWidth + 1;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        };
      });
    const metricCards = ${dashboard ? '[...document.querySelectorAll(".command-metrics article")].map((element) => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width }; })' : '[]'};
    return {
      viewportWidth,
      documentWidth,
      authenticatedContent: rectFor(".authenticated-content"),
      dashboard: rectFor(".command-center"),
      metricGrid: rectFor(".command-metrics"),
      metricCards,
      sidebar: rectFor(".app-sidebar"),
      mobileBar: rectFor(".mobile-app-bar"),
      offenders,
    };
  })()`);
}

function assertWithinViewport(rect, viewportWidth, label) {
  assert.ok(rect, `${label} is not visible`);
  assert.ok(rect.left >= -1, `${label} starts outside the viewport: left=${rect.left}`);
  assert.ok(rect.right <= viewportWidth + 1, `${label} is cut off on the right: right=${rect.right}, viewport=${viewportWidth}`);
  assert.ok(rect.width <= viewportWidth + 1, `${label} is wider than the viewport: width=${rect.width}, viewport=${viewportWidth}`);
}

async function captureFailure(cdp, route, viewport) {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const safeRoute = route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-") || "root";
  const filename = `${safeRoute}-${viewport.name}.png`;
  await fs.writeFile(path.join(SCREENSHOT_DIR, filename), Buffer.from(result.data, "base64"));
  return filename;
}

const chrome = findChrome();
assert.ok(chrome, "Chrome/Chromium is required for responsive layout CI");
process.env.VITE_API_BASE_URL = "/__responsive_api";

const server = await createServer({
  root: process.cwd(),
  logLevel: "error",
  plugins: [mockApiPlugin()],
  server: { host: HOST, port: APP_PORT, strictPort: true },
});
const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "bragstack-responsive-layout-"));
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
    for (const route of ROUTES) {
      const label = `${route.path} @ ${viewport.width}x${viewport.height}`;
      try {
        await openAuthenticatedRoute(cdp, route.path);
        const layout = await measureLayout(cdp, route.dashboard === true);

        assert.ok(
          layout.documentWidth <= layout.viewportWidth + 1,
          `${label} has horizontal document overflow: document=${layout.documentWidth}, viewport=${layout.viewportWidth}`,
        );
        assertWithinViewport(layout.authenticatedContent, layout.viewportWidth, `${label} authenticated content`);
        assert.equal(
          layout.offenders.length,
          0,
          `${label} contains elements clipped on the right: ${JSON.stringify(layout.offenders)}`,
        );

        if (route.dashboard) {
          assertWithinViewport(layout.dashboard, layout.viewportWidth, `${label} dashboard`);
          assertWithinViewport(layout.metricGrid, layout.viewportWidth, `${label} metric grid`);
          assert.equal(layout.metricCards.length, 4, `${label} should render all four dashboard metric cards`);
          layout.metricCards.forEach((card, index) => {
            assert.ok(
              card.right <= layout.viewportWidth + 1,
              `${label} metric card ${index + 1} is cut off: right=${card.right}, viewport=${layout.viewportWidth}`,
            );
          });
        }

        if (viewport.width <= 980) {
          assertWithinViewport(layout.mobileBar, layout.viewportWidth, `${label} mobile app bar`);
        } else {
          assertWithinViewport(layout.sidebar, layout.viewportWidth, `${label} desktop sidebar`);
        }

        console.log(`RESPONSIVE UI PASS ${label}`);
      } catch (error) {
        let screenshot = "";
        try { screenshot = await captureFailure(cdp, route.path, viewport); } catch { /* best effort */ }
        failures.push(`${label}: ${error.message}${screenshot ? ` [screenshot: ${screenshot}]` : ""}`);
      }
    }
  }

  if (failures.length) {
    console.error("\nRESPONSIVE UI FAILURES");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`\nResponsive UI guard passed ${VIEWPORTS.length} viewport sizes across ${ROUTES.length} authenticated routes.`);
  }
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null && browser.signalCode === null) browser.kill("SIGKILL");
  await server.close();
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}
