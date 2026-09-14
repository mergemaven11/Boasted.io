import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, "..");
const DIST_DIR = path.join(FRONTEND_DIR, "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");

const replacements = [
  {
    name: "static search shell styles",
    pattern: /\s*<style id="boasted-static-search-shell-style">[\s\S]*?<\/style>/,
    replacement: '\n    <link rel="stylesheet" href="/boasted-static-shell.css" />',
  },
  {
    name: "route shell bootstrap",
    pattern: /\s*<script>\s*if \(window\.location\.pathname !== "\/"\) \{[\s\S]*?<\/script>/,
    replacement: '\n    <script src="/boasted-route-shell.js"></script>',
  },
  {
    name: "mobile education navigation patch",
    pattern: /\s*<script>\s*\(\(\) => \{[\s\S]*?patchEducationNav[\s\S]*?<\/script>/,
    replacement: '\n    <script src="/boasted-nav-patch.js"></script>',
  },
];

let html = await readFile(INDEX_FILE, "utf8");

for (const item of replacements) {
  if (!item.pattern.test(html)) {
    throw new Error(`Could not find expected inline block: ${item.name}`);
  }
  html = html.replace(item.pattern, item.replacement);
}

const executableInlineScripts = [...html.matchAll(/<script(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)]
  .filter((match) => match[1].trim().length > 0);

if (executableInlineScripts.length > 0) {
  throw new Error(`Production index still contains ${executableInlineScripts.length} executable inline script block(s).`);
}

if (/<style(?:\s|>)/i.test(html)) {
  throw new Error("Production index still contains inline style blocks.");
}

await writeFile(INDEX_FILE, html, "utf8");

async function externalizeSingleStyle(relativeHtmlPath, publicCssPath) {
  const htmlPath = path.join(DIST_DIR, relativeHtmlPath);
  const cssPath = path.join(DIST_DIR, publicCssPath.replace(/^\//, ""));
  let page = await readFile(htmlPath, "utf8");
  const matches = [...page.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)];
  if (matches.length !== 1) {
    throw new Error(`${relativeHtmlPath} expected exactly one inline style block, found ${matches.length}.`);
  }
  const css = matches[0][1].trim();
  page = page.replace(matches[0][0], `<link rel="stylesheet" href="${publicCssPath}" />`);
  await writeFile(cssPath, `${css}\n`, "utf8");
  await writeFile(htmlPath, page, "utf8");
}

async function externalizeSingleScript(relativeHtmlPath, publicScriptPath) {
  const htmlPath = path.join(DIST_DIR, relativeHtmlPath);
  const scriptPath = path.join(DIST_DIR, publicScriptPath.replace(/^\//, ""));
  let page = await readFile(htmlPath, "utf8");
  const matches = [...page.matchAll(/<script(?![^>]*type=["']application\/ld\+json["'])([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/.test(match[1]) && match[2].trim().length > 0);
  if (matches.length !== 1) {
    throw new Error(`${relativeHtmlPath} expected exactly one executable inline script block, found ${matches.length}.`);
  }
  const script = matches[0][2].trim();
  page = page.replace(matches[0][0], `<script src="${publicScriptPath}"></script>`);
  await writeFile(scriptPath, `${script}\n`, "utf8");
  await writeFile(htmlPath, page, "utf8");
}

await externalizeSingleScript("auth/callback/index.html", "/auth/callback/callback.js");
await externalizeSingleStyle("docs/troubleshooting.html", "/docs/troubleshooting.css");
await externalizeSingleStyle("help/troubleshooting.html", "/help/troubleshooting.css");
await externalizeSingleStyle("legal/georgia-consumer-notice.html", "/legal/georgia-consumer-notice.css");

console.log("Externalized production inline CSP blockers, including static support/auth pages.");
