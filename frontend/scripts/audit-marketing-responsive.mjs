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
const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "marketing-layout");
const VIEWPORTS = [
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-430", width: 430, height: 932 },
];

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

async function captureFailure(cdp, viewport) {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true });
  const filename = `landing-${viewport.name}.png`;
  await fs.writeFile(path.join(SCREENSHOT_DIR, filename), Buffer.from(result.data, "base64"));
  return filename;
}

function assertInside(rect, viewportWidth, label) {
  assert.ok(rect, `${label} is missing`);
  assert.ok(rect.left >= -1, `${label} starts outside viewport: ${rect.left}`);
  assert.ok(rect.right <= viewportWidth + 1, `${label} exceeds viewport: ${rect.right} > ${viewportWidth}`);
}

const chrome = findChrome();
assert.ok(chrome, "Chrome/Chromium is required for marketing responsive CI");

const server = await createServer({ root: process.cwd(), logLevel: "error", server: { host: HOST, port: APP_PORT, strictPort: true } });
const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "boasted-marketing-layout-"));
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
    const label = `/ @ ${viewport.width}x${viewport.height}`;
    try {
      await setViewport(cdp, viewport);
      await cdp.send("Page.navigate", { url: BASE_URL });
      await waitFor(async () => evaluate(cdp, `Boolean(document.querySelector(".feature-dashboard-preview"))`), 12000);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const layout = await evaluate(cdp, `(() => {
        const rect = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const value = element.getBoundingClientRect();
          return { left: value.left, right: value.right, width: value.width };
        };
        const header = document.querySelector(".feature-preview-header");
        const cards = [...document.querySelectorAll(".feature-preview-header > div")].map((element) => {
          const value = element.getBoundingClientRect();
          const strong = element.querySelector("strong");
          return {
            left: value.left,
            right: value.right,
            width: value.width,
            fontSize: strong ? Number.parseFloat(getComputedStyle(strong).fontSize) : 0,
          };
        });
        const headerRect = header?.getBoundingClientRect();
        const offenders = [...document.querySelectorAll(".landing-feature-section *")]
          .filter((element) => {
            const style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden") return false;
            const value = element.getBoundingClientRect();
            return value.right > window.innerWidth + 1 || value.left < -1;
          })
          .slice(0, 10)
          .map((element) => element.className || element.tagName);
        return {
          viewportWidth: window.innerWidth,
          documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          section: rect(".landing-feature-section"),
          preview: rect(".feature-dashboard-preview"),
          entry: rect(".feature-preview-entry"),
          headerWidth: headerRect?.width || 0,
          cards,
          offenders,
        };
      })()`);

      assert.ok(layout.documentWidth <= layout.viewportWidth + 1, `${label} has horizontal document overflow`);
      assertInside(layout.section, layout.viewportWidth, `${label} feature section`);
      assertInside(layout.preview, layout.viewportWidth, `${label} dashboard preview`);
      assertInside(layout.entry, layout.viewportWidth, `${label} receipt preview`);
      assert.equal(layout.cards.length, 2, `${label} should render two summary cards`);
      layout.cards.forEach((card, index) => {
        assertInside(card, layout.viewportWidth, `${label} summary card ${index + 1}`);
        assert.ok(card.width >= layout.headerWidth * 0.85, `${label} summary card ${index + 1} is still squeezed into a multi-column phone layout`);
        assert.ok(card.fontSize <= 24.5, `${label} summary card ${index + 1} text is too large for mobile: ${card.fontSize}px`);
      });
      assert.equal(layout.offenders.length, 0, `${label} contains clipped marketing elements: ${JSON.stringify(layout.offenders)}`);
      console.log(`MARKETING RESPONSIVE PASS ${label}`);
    } catch (error) {
      let screenshot = "";
      try { screenshot = await captureFailure(cdp, viewport); } catch { /* best effort */ }
      failures.push(`${label}: ${error.message}${screenshot ? ` [screenshot: ${screenshot}]` : ""}`);
    }
  }

  if (failures.length) {
    console.error("\nMARKETING RESPONSIVE FAILURES");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`\nMarketing responsive guard passed ${VIEWPORTS.length} phone widths.`);
  }
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null && browser.signalCode === null) browser.kill("SIGKILL");
  await server.close();
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}
