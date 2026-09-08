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
  ["phone-320", 320, 740],
  ["phone-375", 375, 812],
  ["phone-390", 390, 844],
  ["phone-430", 430, 932],
  ["tablet-768", 768, 1024],
  ["desktop-1024", 1024, 768],
  ["desktop-1280", 1280, 800],
  ["desktop-1440", 1440, 900],
  ["desktop-1920", 1920, 1080],
].map(([name, width, height]) => ({ name, width, height }));

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

const LONG_TOKEN = "incident-response-evidence-reference-without-natural-breakpoints-1234567890";
const LONG_ROLE = "Senior Production Support and Cloud Reliability Escalation Engineer for Enterprise Platform Operations";
const LONG_TITLE = "Reduced escalations across a high-volume production support workflow while preserving customer trust and cross-team incident ownership";
const SKILLS = [
  "Incident Response", "Production Support", "Docker", "Kubernetes", "Python",
  "Linux", "Cloud Operations", "Customer Escalations", "Root Cause Analysis",
  "Observability", "Automation", "Reliability Engineering", "Technical Communication",
  "Cross-functional Leadership", "Troubleshooting", "Runbook Design", "Knowledge Management",
  "Change Management", "Post-incident Review", "Service Ownership", "Mentoring",
  "API Debugging", "Distributed Systems", "Performance Analysis", LONG_TOKEN,
];

function profileFor(layout) {
  return {
    name: "Alexandria-Montgomery-Support-Engineer-Long",
    headline: `${LONG_ROLE} · ${LONG_TOKEN}`,
    bio: "Production support engineer documenting customer-impacting incident leadership, automation, reliability improvements, mentoring, and durable operational changes across a complex enterprise environment without losing the context behind the work.",
    location: "Atlanta Metropolitan Area, Georgia, United States",
    github_url: "https://github.com/example-user-with-an-intentionally-long-profile-name",
    portfolio_url: `https://example.com/${LONG_TOKEN}/${LONG_TOKEN}`,
    resume_url: `https://example.com/resume/${LONG_TOKEN}.pdf`,
    profile_layout: layout,
    profile_theme: "default",
    profile_primary_color: "#38bdf8",
    profile_secondary_color: "#a78bfa",
    profile_background_color: "#050816",
    work_history: [
      {
        role: LONG_ROLE,
        company: "Example Enterprise Infrastructure and Customer Reliability Organization With A Long Name",
        location: "Remote · United States",
        start_date: "2023-01",
        end_date: "Present",
        summary: "Owned difficult escalations, improved incident workflows, and translated recurring support pain into maintainable engineering fixes while coordinating with product, platform, and customer-facing teams.",
      },
      {
        role: "Technical Support Engineer",
        company: "Previous Platform Company",
        location: "Atlanta, GA",
        start_date: "2020-04",
        end_date: "2022-12",
        summary: "Resolved complex production issues and created reusable troubleshooting paths for the wider support organization.",
      },
    ],
    profile_projects: [
      {
        name: `Incident Automation Toolkit ${LONG_TOKEN}`,
        role: "Maintainer and workflow designer",
        summary: "Converted repeated triage steps into a safer automation path with explicit escalation boundaries and measurable time savings.",
        skills: ["Python", "Docker", "Incident Response", LONG_TOKEN],
        url: `https://example.com/projects/${LONG_TOKEN}`,
      },
    ],
  };
}

const ENTRIES = Array.from({ length: 6 }, (_, index) => ({
  id: `entry-${index + 1}`,
  title: index === 0 ? LONG_TITLE : `Production support accomplishment ${index + 1}: improved reliability and reduced repeat escalation effort`,
  category: index % 2 === 0 ? "Reliability and Incident Response" : "Customer Outcomes and Automation",
  entry_date: `2026-0${Math.min(index + 2, 8)}-15`,
  entry_type: index % 2 === 0 ? "Current Job" : "Personal Development",
  situation: "A recurring production issue created slow escalations and duplicated investigation effort across several teams.",
  action: `Built a repeatable diagnostic and escalation workflow, documented ownership boundaries, and automated safe checks. Reference: ${LONG_TOKEN}`,
  impact: "Reduced avoidable handoffs and gave responders a faster, clearer path to isolate the issue while preserving escalation quality and customer communication.",
  lesson: "Operational improvements are strongest when troubleshooting, ownership, and evidence stay connected.",
  resume_bullet: "Improved production support response quality by standardizing evidence-backed triage and escalation workflows.",
  tags: SKILLS.slice(index, index + 7),
  is_public: true,
}));

const RECEIPTS = [
  {
    id: "receipt-1",
    accomplishment: LONG_TITLE,
    contribution: `Designed the diagnostic workflow, coordinated responders, documented decision points, and created reusable automation. ${LONG_TOKEN}`,
    result: "Reduced repeated investigation and improved escalation clarity across a customer-impacting workflow without overstating confidential internal metrics.",
    skills: SKILLS.slice(0, 7),
    metrics: [{ value: "42%", label: "faster triage", context: "Measured across an approved comparison window." }],
    evidence: [
      { title: `Public incident workflow evidence ${LONG_TOKEN}`, reference: `https://example.com/evidence/${LONG_TOKEN}` },
      { title: "Public reliability write-up", reference: "https://example.com/reliability/write-up" },
    ],
    confirmed_count: 3,
    is_public: true,
  },
  {
    id: "receipt-2",
    accomplishment: "Converted recurring troubleshooting knowledge into a durable team workflow",
    contribution: "Mapped the repeated investigation path, removed ambiguous handoffs, and turned stable steps into reusable support guidance.",
    result: "Made complex cases easier to hand off and reduced dependence on individual memory during high-pressure escalations.",
    skills: SKILLS.slice(7, 14),
    metrics: [{ value: "18", label: "repeat cases reviewed", context: "Publicly safe aggregate." }],
    evidence: [{ title: "Workflow architecture overview", reference: "https://example.com/workflow-architecture" }],
    confirmed_count: 1,
    is_public: true,
  },
  {
    id: "receipt-3",
    accomplishment: "Mentored teammates through difficult production investigations",
    contribution: "Created structured debugging prompts and paired with responders on evidence-first escalation decisions.",
    result: "Improved confidence and consistency for cases crossing application, container, and infrastructure boundaries.",
    skills: SKILLS.slice(14, 21),
    metrics: [],
    evidence: [],
    confirmed_count: 0,
    is_public: true,
  },
];

const TAGS = Object.fromEntries(SKILLS.map((skill, index) => [skill, (index % 4) + 1]));

function json(res, body, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function mockResponse(method, rawUrl) {
  const url = new URL(rawUrl, "http://mock.local");
  const pathname = url.pathname.replace(/^\/__profile_api/, "");
  const match = pathname.match(/^\/public\/brag\/([^/]+)(.*)$/);
  if (!match) return {};
  const slug = decodeURIComponent(match[1]);
  const suffix = match[2] || "";
  const layout = slug.startsWith("qa-") ? slug.slice(3) : "editorial";

  if (method === "POST" && suffix === "/analytics") return { recorded: true };
  if (suffix === "/profile") return { profile: profileFor(layout) };
  if (suffix === "/impact-receipts") return { receipts: RECEIPTS, total: RECEIPTS.length };
  if (suffix === "/tags/summary") return { total_unique_tags: SKILLS.length, tags: TAGS };
  if (suffix === "/connection") return { open_to_talk: false, calendly_enabled: false, open_to_talk_types: [] };
  if (suffix === "") return { entries: ENTRIES, total_entries: ENTRIES.length, activity_last_6_months: [] };
  return {};
}

function mockApiPlugin() {
  return {
    name: "boasted-public-profile-layout-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/__profile_api")) return next();
        req.on("data", () => {});
        req.on("end", () => json(res, mockResponse(req.method || "GET", req.url || "/")));
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
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw lastError || new Error(`Timed out after ${timeoutMs}ms`);
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
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
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
    try { this.ws.close(); } catch { /* best effort */ }
  }
}

async function findPageTarget() {
  return waitFor(async () => {
    const response = await fetch(`http://${HOST}:${DEBUG_PORT}/json/list`);
    if (!response.ok) return null;
    const targets = await response.json();
    return targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl) || null;
  }, 5000);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
  return result.result?.value;
}

async function setViewport(cdp, viewport) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width <= 430,
  });
}

async function openProfile(cdp, layout) {
  await cdp.send("Page.navigate", { url: `${BASE_URL}/brag/qa-${layout}` });
  await waitFor(async () => {
    const ready = await evaluate(cdp, `(() => ({
      state: document.readyState,
      layout: document.querySelector(".proof-portfolio")?.dataset.layout || "",
      name: document.querySelector(".portfolio-identity h1")?.textContent || "",
      error: Boolean(document.querySelector(".proof-error"))
    }))()`);
    return ready.state !== "loading" && ready.layout === layout && ready.name.length > 0 && !ready.error;
  }, 12000);
  await new Promise((resolve) => setTimeout(resolve, 120));
}

async function measure(cdp) {
  return evaluate(cdp, `(() => {
    const viewportWidth = window.innerWidth;
    const root = document.querySelector(".proof-portfolio");
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
      return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
    };
    const scrollAncestor = (element) => {
      let current = element.parentElement;
      while (current && current !== root) {
        if (["auto", "scroll"].includes(getComputedStyle(current).overflowX)) return true;
        current = current.parentElement;
      }
      return false;
    };
    const offenders = [...document.querySelectorAll(".proof-portfolio *")]
      .filter((element) => {
        if (!visible(element)) return false;
        const style = getComputedStyle(element);
        if (["fixed", "absolute"].includes(style.position) || scrollAncestor(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > viewportWidth + 1 || rect.width > viewportWidth + 1;
      })
      .slice(0, 16)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
          text: (element.textContent || "").trim().slice(0, 90),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        };
      });
    const touchTargets = [...document.querySelectorAll(
      ".portfolio-share, .proof-action, .proof-filter-row button, .proof-pagination-controls button, .portfolio-footer button"
    )].filter(visible).map((element) => {
      const rect = element.getBoundingClientRect();
      return { label: (element.textContent || "control").trim().slice(0, 60), height: rect.height };
    });
    const sections = [
      ".portfolio-hero",
      ".portfolio-proof-passport",
      ".portfolio-featured-impact",
      ".portfolio-career-section",
      ".portfolio-skills-section",
      ".portfolio-work-section",
    ].map((selector) => ({ selector, visible: visible(document.querySelector(selector)), rect: rectFor(selector) }));
    return {
      viewportWidth,
      documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      layout: root?.dataset.layout || "",
      inner: rectFor(".proof-profile-inner"),
      hero: rectFor(".portfolio-hero"),
      controls: rectFor(".portfolio-controls"),
      sections,
      touchTargets,
      offenders,
    };
  })()`);
}

function assertWithinViewport(rect, viewportWidth, label) {
  assert.ok(rect, `${label} is not visible`);
  assert.ok(rect.left >= -1, `${label} starts outside viewport: left=${rect.left}`);
  assert.ok(rect.right <= viewportWidth + 1, `${label} is cut off on right: right=${rect.right}, viewport=${viewportWidth}`);
  assert.ok(rect.width <= viewportWidth + 1, `${label} is wider than viewport: width=${rect.width}, viewport=${viewportWidth}`);
}

async function captureFailure(cdp, layout, viewport) {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  const filename = `${layout}-${viewport.name}.png`;
  await fs.writeFile(path.join(SCREENSHOT_DIR, filename), Buffer.from(shot.data, "base64"));
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
        const result = await measure(cdp);
        assert.equal(result.layout, layout, `${label} rendered the wrong layout`);
        assert.ok(result.documentWidth <= result.viewportWidth + 1, `${label} document overflow: ${result.documentWidth}px > ${result.viewportWidth}px`);
        assertWithinViewport(result.inner, result.viewportWidth, `${label} profile inner`);
        assertWithinViewport(result.hero, result.viewportWidth, `${label} hero`);
        assertWithinViewport(result.controls, result.viewportWidth, `${label} controls`);
        assert.equal(result.offenders.length, 0, `${label} clipped content: ${JSON.stringify(result.offenders)}`);
        assert.ok(result.touchTargets.length >= 10, `${label} did not render expected controls`);
        for (const targetInfo of result.touchTargets) {
          assert.ok(targetInfo.height >= 43, `${label} touch target too short: ${targetInfo.label} (${Math.round(targetInfo.height)}px)`);
        }
        for (const section of result.sections) {
          assert.ok(section.visible, `${label} hides meaningful section ${section.selector}`);
          assertWithinViewport(section.rect, result.viewportWidth, `${label} ${section.selector}`);
        }
        console.log(`PUBLIC PROFILE PASS ${label}`);
      } catch (error) {
        let screenshot = "";
        try { screenshot = await captureFailure(cdp, layout, viewport); } catch { /* best effort */ }
        failures.push(`${label}: ${error.message}${screenshot ? ` [screenshot: ${screenshot}]` : ""}`);
      }
    }
  }

  if (failures.length) {
    console.error("\nPUBLIC PROFILE LAYOUT FAILURES");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`\nPublic Proof Profile guard passed ${LAYOUTS.length} layouts × ${VIEWPORTS.length} viewports = ${LAYOUTS.length * VIEWPORTS.length} rendered cases.`);
  }
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null && browser.signalCode === null) browser.kill("SIGKILL");
  await server.close();
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}
