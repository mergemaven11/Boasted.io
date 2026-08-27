import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "vite";

const HOST = "127.0.0.1";
const APP_PORT = 41740;
const DEBUG_PORT = 9223;
const BASE_URL = `http://${HOST}:${APP_PORT}`;

const PUBLIC_ROUTES = ["/", "/login", "/register", "/upgrade", "/docs", "/nda-safety", "/security", "/verify-receipt", "/privacy", "/terms", "/brag/bragstack-qa"];
const AUTH_ROUTES = ["/app", "/app/intelligence", "/app/accomplishments", "/app/impact-receipts", "/app/resume-builder", "/app/reports", "/app/interview-practice", "/app/profile", "/app/settings", "/app/settings/appearance", "/app/settings/billing"];
const CLICKABLE_SELECTOR = ["a[href]", "button", "summary", '[role="button"]', '[role="tab"]', 'input[type="button"]', 'input[type="submit"]', 'input[type="checkbox"]', 'input[type="radio"]', "select", "label[for]"].join(",");

const proUser = {
  id: "e2e-user", email: "qa@usebragstack.test", name: "BragStack QA", headline: "Career evidence tester",
  bio: "Automated browser test account", location: "Atlanta, GA", slug: "bragstack-qa", public_slug: "bragstack-qa", plan: "pro",
  entitlements: { resume_builder: true, advanced_reports: true, interview_practice: true, impact_receipts: true },
};
const sampleEntry = {
  id: "entry-1", title: "Reduced incident response time", category: "Reliability", entry_date: "2026-08-20",
  entry_type: "Current Job", situation: "Incident response was slow.", action: "Built an automated triage workflow.",
  impact: "Reduced response time by 42%.", lesson: "Automate the repetitive parts first.", tags: ["automation", "reliability"], is_public: true,
};
const sampleReceipt = {
  id: "receipt-1", entry_id: sampleEntry.id, accomplishment: sampleEntry.title, contribution: sampleEntry.action,
  result: sampleEntry.impact, evidence: [{ title: "Incident dashboard", is_public: true }], skills: ["Automation"], credit: [],
  trust_signals: ["self-documented", "evidence-linked"], confirmations: [], is_public: true,
};
const careerIntelligence = {
  summary: { accomplishments: 1, impact_receipts: 1, unique_skills: 1, quantified_results: 1, evidence_items: 1, confirmed_receipts: 0 },
  top_skills: [{ skill: "Automation", signal: "established", evidence_points: 64, demonstrations: 2, quantified_examples: 1, evidence_items: 1, confirmations: 0 }],
  skills: [{ skill: "Automation", signal: "established", evidence_points: 64, demonstrations: 2, quantified_examples: 1, evidence_items: 1, confirmations: 0 }],
  top_categories: [{ category: "Reliability", count: 1 }],
  gaps: [{ type: "recognition", title: "Capture independent recognition", detail: "No confirmed receipt yet.", action: "Request confirmation where appropriate." }],
  recommended_actions: ["Use Automation as a lead career signal.", "Request confirmation where appropriate."],
  methodology: { version: "career-intelligence-v1", employment_decision: false },
};

function json(res, body, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function mockApiResponse(method, rawUrl) {
  const url = new URL(rawUrl, "http://mock.local");
  const p = url.pathname.replace(/^\/__e2e_api/, "");
  if (p === "/auth/me") return proUser;
  if (p === "/auth/login") return { access_token: "e2e-token", token_type: "bearer" };
  if (p === "/auth/register") return { ...proUser, access_token: "e2e-token" };
  if (p === "/career-intelligence") return careerIntelligence;
  if (p === "/billing/status") return { plan: "pro", status: "active", cancel_at_period_end: false, current_period_end: "2026-09-25T00:00:00Z" };
  if (p === "/billing/cancel") return { ok: true, cancel_at_period_end: true };
  if (p === "/billing/resume") return { ok: true, cancel_at_period_end: false };
  if (p === "/entries") return method === "GET" ? { entries: [sampleEntry], total_entries: 1 } : sampleEntry;
  if (/^\/entries\/[^/]+$/.test(p)) return sampleEntry;
  if (p === "/entries/reports/weekly") return { total_entries: 1, entries: [sampleEntry], highlights: [sampleEntry.title] };
  if (p === "/entries/tags/summary") return { tags: [{ tag: "automation", count: 1 }] };
  if (p === "/entries/categories/summary") return { categories: [{ category: "Reliability", count: 1 }] };
  if (p.startsWith("/impact-receipts")) return method === "GET" ? { receipts: [sampleReceipt], total: 1 } : sampleReceipt;
  if (p.startsWith("/receipt-verification") || p.startsWith("/verification")) return { receipt: sampleReceipt, status: "verified", valid: true };
  if (p.startsWith("/reports/")) return { total_entries: 1, total_receipts: 1, categories: [{ category: "Reliability", count: 1 }], tags: [{ tag: "automation", count: 1 }], entries: [sampleEntry], highlights: [sampleEntry.title], trends: [] };
  if (p.startsWith("/packets/")) return { packet_type: "performance-review", title: "QA Career Packet", period: { start_date: "2026-08-01", end_date: "2026-08-25" }, subject: { name: proUser.name, role: "Support Engineer" }, context: { career_area: "Engineering", organization: "BragStack" }, target: { role: "Senior Support Engineer", level: "Senior", organization: "BragStack" }, entries: [sampleEntry], receipts: [sampleReceipt], sections: [], render_config: { sections: [], signature_entry_ids: [] }, annotations: { include_in_export: true, item_notes: {} }, branding: {} };
  if (p.startsWith("/resume")) return { id: "resume-1", resume: { contact: { name: proUser.name, email: proUser.email, location: proUser.location }, summary: "Career evidence tester", experience: [], education: [], skills: ["Automation"] }, structured_resume: { contact: { name: proUser.name, email: proUser.email }, experience: [], education: [], skills: [] }, ats_score: 92, warnings: [], suggestions: [] };
  if (p.startsWith("/interview")) return { questions: [{ id: "q1", question: "Tell me about a measurable impact you made.", category: "behavioral" }], remaining: 0, score: 80, feedback: "Clear impact and ownership." };
  if (p.startsWith("/public/brag")) {
    if (p.endsWith("/profile")) return { profile: proUser };
    if (p.endsWith("/impact-receipts")) return { receipts: [sampleReceipt], total_receipts: 1 };
    if (p.endsWith("/reports/weekly")) return { total_entries: 1, entries: [sampleEntry] };
    if (p.endsWith("/tags/summary")) return { total_unique_tags: 2, tags: { automation: 1, reliability: 1 } };
    if (p.endsWith("/categories/summary")) return { categories: { Reliability: 1 } };
    return { entries: [sampleEntry], total_entries: 1, activity_last_6_months: [{ key: "2026-08", label: "Aug", count: 1 }] };
  }
  if (method === "DELETE") return { ok: true };
  return {};
}

function mockApiPlugin() {
  return {
    name: "bragstack-click-audit-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/__e2e_api")) return next();
        req.on("data", () => {});
        req.on("end", () => json(res, mockApiResponse(req.method || "GET", req.url || "/")));
      });
    },
  };
}

function findChrome() {
  return ["google-chrome", "chromium", "chromium-browser"].find((name) => spawnSync("which", [name], { encoding: "utf8" }).status === 0);
}
async function waitFor(fn, timeoutMs = 10000) {
  const started = Date.now(); let lastError;
  while (Date.now() - started < timeoutMs) {
    try { const value = await fn(); if (value) return value; } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error(`Timed out after ${timeoutMs}ms`);
}
async function waitForProcessExit(child, timeoutMs = 3000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await Promise.race([new Promise((resolve) => child.once("exit", resolve)), new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}

class CDP {
  constructor(wsUrl) { this.ws = new WebSocket(wsUrl); this.nextId = 1; this.pending = new Map(); this.listeners = new Map(); }
  async open() {
    await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve, { once: true }); this.ws.addEventListener("error", reject, { once: true }); });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id); this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message)); else resolve(message.result); return;
      }
      for (const handler of this.listeners.get(message.method) || []) handler(message.params || {});
    });
  }
  on(method, handler) { this.listeners.set(method, [...(this.listeners.get(method) || []), handler]); }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  close() { this.ws.close(); }
}

function isTransientNavigationError(error) {
  const message = String(error?.message || error || "");
  return [
    "Not attached to an active page",
    "Execution context was destroyed",
    "Cannot find context with specified id",
    "Inspected target navigated or closed",
  ].some((fragment) => message.includes(fragment));
}

async function evaluate(cdp, expression, timeoutMs = 5000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
      return result.result?.value;
    } catch (error) {
      if (!isTransientNavigationError(error)) throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw lastError || new Error(`Timed out waiting for an active page after ${timeoutMs}ms`);
}

async function waitForPageReady(cdp, timeoutMs = 5000) {
  await waitFor(async () => evaluate(cdp, 'document.readyState !== "loading"', 750), timeoutMs);
}

async function navigate(cdp, route, authenticated) {
  await cdp.send("Page.navigate", { url: `${BASE_URL}${route}` });
  await new Promise((resolve) => setTimeout(resolve, 400));
  await evaluate(cdp, "localStorage.clear(); sessionStorage.clear();");
  if (authenticated) await evaluate(cdp, 'localStorage.setItem("bragstack_token", "e2e-token")');
  await cdp.send("Page.reload", { ignoreCache: true });
  await new Promise((resolve) => setTimeout(resolve, authenticated ? 700 : 500));
}

const browserHelpers = `
  const selector = ${JSON.stringify(CLICKABLE_SELECTOR)};
  const visible = (el) => {
    const style = getComputedStyle(el); const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0 && rect.width > 1 && rect.height > 1 && !el.disabled;
  };
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    text: (el.innerText || el.value || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 100),
    href: el.getAttribute("href") || "",
    role: el.getAttribute("role") || "",
    type: el.getAttribute("type") || "",
  });
  const keyOf = (item) => JSON.stringify([item.tag, item.text, item.href, item.role, item.type]);
  const elements = [...document.querySelectorAll(selector)].filter(visible);
`;

function semanticKey(control) {
  return JSON.stringify([control.tag, control.text, control.href, control.role, control.type]);
}

async function getClickables(cdp) {
  return evaluate(cdp, `(() => { ${browserHelpers}
    const seen = new Map();
    return elements.map((el) => {
      const item = describe(el); const key = keyOf(item); const ordinal = seen.get(key) || 0; seen.set(key, ordinal + 1);
      return { ...item, ordinal, semanticIdentity: key, identity: key + "#" + ordinal };
    });
  })()`);
}

async function findEquivalentControl(cdp, control, timeoutMs = 2500) {
  const key = semanticKey(control);
  try {
    return await waitFor(async () => {
      const current = await getClickables(cdp);
      const matches = current.filter((item) => item.semanticIdentity === key);
      return matches[control.ordinal] || matches[0] || null;
    }, timeoutMs);
  } catch {
    return null;
  }
}

async function clickControl(cdp, control) {
  const key = semanticKey(control);
  const point = await evaluate(cdp, `(() => { ${browserHelpers}
    const target = ${JSON.stringify(control)};
    const matches = elements.filter((el) => keyOf(describe(el)) === ${JSON.stringify(key)});
    const el = matches[target.ordinal] || matches[0];
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  assert.ok(point, `No visible semantic equivalent before activation: ${control.identity}`);
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await new Promise((resolve) => setTimeout(resolve, 100));
  await waitForPageReady(cdp);
}

async function exerciseControl(cdp, route, authenticated, control, initialSemanticIdentities) {
  await navigate(cdp, route, authenticated);
  const equivalent = await findEquivalentControl(cdp, control);
  assert.ok(equivalent, `${route}: no equivalent visible control on clean render`);
  const beforeUrl = await evaluate(cdp, "location.href");
  const beforeErrorCount = await evaluate(cdp, "window.__clickAuditErrors.length");
  await clickControl(cdp, equivalent);
  const afterUrl = await evaluate(cdp, "location.href");
  const errors = (await evaluate(cdp, "window.__clickAuditErrors.slice()")) || [];
  assert.equal(errors.length, beforeErrorCount, `${route}: caused browser errors: ${errors.slice(beforeErrorCount).join(" | ")}`);
  if (control.href?.startsWith("/")) assert.equal(new URL(afterUrl).origin, BASE_URL, `${route}: navigated away from app origin`);

  if (beforeUrl !== afterUrl) return;
  const expanded = await getClickables(cdp);
  const nestedBySemanticKey = new Map();
  for (const item of expanded) {
    if (!initialSemanticIdentities.has(item.semanticIdentity) && !nestedBySemanticKey.has(item.semanticIdentity)) nestedBySemanticKey.set(item.semanticIdentity, item);
  }
  const nested = [...nestedBySemanticKey.values()].slice(0, 8);
  for (const nestedControl of nested) {
    await navigate(cdp, route, authenticated);
    const parent = await findEquivalentControl(cdp, control);
    if (!parent) continue;
    await clickControl(cdp, parent);
    const nestedBeforeErrors = await evaluate(cdp, "window.__clickAuditErrors.length");
    const nestedEquivalent = await findEquivalentControl(cdp, nestedControl, 1500);
    if (!nestedEquivalent) continue;
    await clickControl(cdp, nestedEquivalent);
    const nestedErrors = (await evaluate(cdp, "window.__clickAuditErrors.slice()")) || [];
    assert.equal(nestedErrors.length, nestedBeforeErrors, `${route}: nested control caused browser errors: ${nestedErrors.slice(nestedBeforeErrors).join(" | ")}`);
  }
}

async function auditRoute(cdp, route, authenticated, failures) {
  await navigate(cdp, route, authenticated);
  const initial = await getClickables(cdp);
  const initialSemanticIdentities = new Set(initial.map((item) => item.semanticIdentity));
  console.log(`CLICK AUDIT ${route}: ${initial.length} visible controls`);
  for (const control of initial) {
    const label = `${control.tag}${control.text ? ` “${control.text}”` : ""}${control.href ? ` -> ${control.href}` : ""}`;
    try { await exerciseControl(cdp, route, authenticated, control, initialSemanticIdentities); }
    catch (error) { failures.push(`${route}: ${label}: ${error.message}`); }
  }
  return initial.length;
}

const chrome = findChrome();
assert.ok(chrome, "Chrome/Chromium is required for the full click audit");
process.env.VITE_API_BASE_URL = "/__e2e_api";
const server = await createServer({ root: process.cwd(), logLevel: "error", plugins: [mockApiPlugin()], server: { host: HOST, port: APP_PORT, strictPort: true } });
const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "bragstack-click-audit-"));
let browser; let cdp; const failures = []; let totalClicks = 0;

try {
  await server.listen();
  browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${userDataDir}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const target = await waitFor(async () => {
    const response = await fetch(`http://${HOST}:${DEBUG_PORT}/json/list`); const targets = await response.json();
    return targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  });
  cdp = new CDP(target.webSocketDebuggerUrl); await cdp.open();
  await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable")]);
  cdp.on("Page.javascriptDialogOpening", () => { void cdp.send("Page.handleJavaScriptDialog", { accept: true }); });
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__clickAuditErrors = [];
    window.addEventListener("error", (event) => window.__clickAuditErrors.push(String(event.error?.message || event.message)));
    window.addEventListener("unhandledrejection", (event) => window.__clickAuditErrors.push(String(event.reason?.message || event.reason)));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => undefined, readText: async () => "" } });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
    class MockSpeechRecognition { constructor(){ this.continuous=false; this.interimResults=false; this.lang="en-US"; } start(){ setTimeout(() => this.onstart?.(), 0); } stop(){ this.onend?.(); } abort(){ this.onend?.(); } }
    window.SpeechRecognition = MockSpeechRecognition; window.webkitSpeechRecognition = MockSpeechRecognition;
  ` });
  for (const route of PUBLIC_ROUTES) totalClicks += await auditRoute(cdp, route, false, failures);
  for (const route of AUTH_ROUTES) totalClicks += await auditRoute(cdp, route, true, failures);
  if (failures.length) {
    console.error("\nFULL CLICK AUDIT FAILURES"); failures.forEach((failure) => console.error(`- ${failure}`)); process.exitCode = 1;
  } else console.log(`\nFull click audit passed: ${totalClicks} visible controls exercised across ${PUBLIC_ROUTES.length + AUTH_ROUTES.length} routes.`);
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null && browser.signalCode === null) browser.kill("SIGKILL");
  await waitForProcessExit(browser);
  await server.close();
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}