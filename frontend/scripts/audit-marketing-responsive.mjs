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

// Exercise every layout mode we intentionally support, including the exact
// breakpoint edges where regressions are most likely to appear.
const VIEWPORTS = [
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "small-tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 1366 },
  { name: "breakpoint-1080", width: 1080, height: 900 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

const REQUIRED_SECTIONS = [
  ".landing-nav",
  ".landing-thirty-hero",
  ".impact-window",
  ".landing-thirty-thesis",
  ".landing-workflow",
  ".landing-impact-section",
  ".landing-use-cases",
  ".landing-memory-problem",
  ".landing-feature-section",
  ".landing-org-section",
  ".landing-pricing",
  ".landing-final-cta",
  ".mega-footer",
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
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
  });
  const filename = `landing-${viewport.name}.png`;
  await fs.writeFile(path.join(SCREENSHOT_DIR, filename), Buffer.from(result.data, "base64"));
  return filename;
}

function assertInside(rect, viewportWidth, label) {
  assert.ok(rect, `${label} is missing`);
  assert.ok(rect.width > 0, `${label} has zero width`);
  assert.ok(rect.left >= -1, `${label} starts outside viewport: ${rect.left}`);
  assert.ok(rect.right <= viewportWidth + 1, `${label} exceeds viewport: ${rect.right} > ${viewportWidth}`);
}

const chrome = findChrome();
assert.ok(chrome, "Chrome/Chromium is required for marketing responsive CI");

const server = await createServer({
  root: process.cwd(),
  logLevel: "error",
  server: { host: HOST, port: APP_PORT, strictPort: true },
});
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
      await waitFor(async () => evaluate(cdp, `Boolean(document.querySelector(".landing-page .impact-window"))`), 12000);
      await new Promise((resolve) => setTimeout(resolve, 180));

      const layout = await evaluate(cdp, `(() => {
        const rect = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const value = element.getBoundingClientRect();
          return {
            left: value.left,
            right: value.right,
            top: value.top,
            bottom: value.bottom,
            width: value.width,
            height: value.height,
          };
        };

        const visible = (element) => {
          const style = getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
        };

        const selectors = ${JSON.stringify(REQUIRED_SECTIONS)};
        const sections = Object.fromEntries(selectors.map((selector) => [selector, rect(selector)]));
        const navLinks = document.querySelector(".landing-nav-links");
        const login = document.querySelector(".landing-login-link");
        const primaryNavCta = document.querySelector(".landing-nav-actions .landing-btn");
        const heroCopy = document.querySelector(".landing-hero-copy");
        const productShot = document.querySelector(".landing-product-shot");
        const pricingCards = [...document.querySelectorAll(".pricing-grid-four .pricing-card")].map((card) => {
          const value = card.getBoundingClientRect();
          return { top: value.top, bottom: value.bottom, left: value.left, right: value.right, width: value.width };
        });

        const contentSelector = [
          ".landing-page a",
          ".landing-page button",
          ".landing-page h1",
          ".landing-page h2",
          ".landing-page h3",
          ".landing-page p",
          ".landing-page article",
          ".landing-page section",
          ".landing-page nav",
          ".landing-page footer",
          ".landing-page .impact-window",
          ".landing-page .landing-org-panel",
          ".landing-page .landing-memory-problem",
          ".landing-page .landing-final-cta"
        ].join(",");

        const offenders = [...document.querySelectorAll(contentSelector)]
          .filter(visible)
          .filter((element) => {
            const value = element.getBoundingClientRect();
            return value.width > 0 && (value.right > window.innerWidth + 1 || value.left < -1);
          })
          .slice(0, 20)
          .map((element) => ({
            tag: element.tagName,
            className: typeof element.className === "string" ? element.className : "",
            text: (element.textContent || "").trim().slice(0, 60),
          }));

        const dangerousWrapping = [...document.querySelectorAll(".landing-page h1, .landing-page h2, .landing-page h3, .landing-page p, .landing-page a, .landing-page button")]
          .filter(visible)
          .filter((element) => {
            const style = getComputedStyle(element);
            return style.wordBreak === "break-all" || style.overflowWrap === "anywhere";
          })
          .slice(0, 20)
          .map((element) => ({
            tag: element.tagName,
            className: typeof element.className === "string" ? element.className : "",
            text: (element.textContent || "").trim().slice(0, 60),
          }));

        const mainButton = document.querySelector(".landing-hero-actions .landing-btn");
        const mainButtonRect = mainButton?.getBoundingClientRect();
        const mainButtonStyle = mainButton ? getComputedStyle(mainButton) : null;

        return {
          viewportWidth: window.innerWidth,
          documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          sections,
          offenders,
          dangerousWrapping,
          navLinksVisible: Boolean(navLinks && visible(navLinks)),
          loginVisible: Boolean(login && visible(login)),
          primaryNavCtaVisible: Boolean(primaryNavCta && visible(primaryNavCta)),
          heroCopy: heroCopy ? rect(".landing-hero-copy") : null,
          productShot: productShot ? rect(".landing-product-shot") : null,
          pricingCards,
          mainButton: mainButtonRect && mainButtonStyle ? {
            width: mainButtonRect.width,
            height: mainButtonRect.height,
            fontSize: Number.parseFloat(mainButtonStyle.fontSize),
          } : null,
        };
      })()`);

      assert.ok(layout.documentWidth <= layout.viewportWidth + 1, `${label} has horizontal document overflow: ${layout.documentWidth}px`);
      for (const [selector, value] of Object.entries(layout.sections)) {
        assertInside(value, layout.viewportWidth, `${label} ${selector}`);
      }

      assert.equal(layout.offenders.length, 0, `${label} contains clipped content: ${JSON.stringify(layout.offenders)}`);
      assert.equal(layout.dangerousWrapping.length, 0, `${label} contains letter-by-letter wrapping styles: ${JSON.stringify(layout.dangerousWrapping)}`);
      assert.ok(layout.primaryNavCtaVisible, `${label} must keep the primary nav CTA visible`);
      assert.ok(layout.mainButton?.height >= 40, `${label} hero primary CTA is too short for a reliable touch target`);
      assert.ok(layout.mainButton?.fontSize >= 13, `${label} hero primary CTA text is too small`);

      if (viewport.width > 1080) {
        assert.ok(layout.navLinksVisible, `${label} desktop navigation links should be visible`);
        assert.ok(layout.loginVisible, `${label} desktop Log in link should be visible`);
        assert.ok(layout.productShot.left > layout.heroCopy.left, `${label} desktop hero should preserve the two-column composition`);
      } else {
        assert.equal(layout.navLinksVisible, false, `${label} compact navigation should hide the link rail`);
        assert.ok(layout.productShot.top >= layout.heroCopy.bottom - 2, `${label} compact hero should stack the product shot below the copy`);
      }

      if (viewport.width <= 780) {
        assert.equal(layout.loginVisible, false, `${label} phone/tablet nav should prioritize the primary CTA over Log in`);
        assert.ok(layout.pricingCards.length >= 2, `${label} pricing cards are missing`);
        assert.ok(layout.pricingCards[1].top >= layout.pricingCards[0].bottom - 2, `${label} pricing cards should stack below 780px`);
      } else if (layout.pricingCards.length >= 2) {
        assert.ok(Math.abs(layout.pricingCards[0].top - layout.pricingCards[1].top) <= 3, `${label} pricing cards should form the desktop two-column grid`);
      }

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
    console.log(`\nMarketing responsive guard passed ${VIEWPORTS.length} phone, tablet, laptop, and desktop widths.`);
  }
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null && browser.signalCode === null) browser.kill("SIGKILL");
  await server.close();
  await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}
