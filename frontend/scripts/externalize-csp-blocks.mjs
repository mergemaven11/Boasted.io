import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, "..");
const INDEX_FILE = path.join(FRONTEND_DIR, "dist", "index.html");

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
console.log("Externalized production inline CSP blockers.");
