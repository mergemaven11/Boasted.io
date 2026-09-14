import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(SCRIPT_DIR, "..", "dist");

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await htmlFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith(".html")) results.push(absolute);
  }
  return results;
}

const failures = [];
for (const file of await htmlFiles(DIST_DIR)) {
  const html = await readFile(file, "utf8");
  const relative = path.relative(DIST_DIR, file);

  if (/<style(?:\s|>)/i.test(html)) {
    failures.push(`${relative}: inline <style> block`);
  }

  const executableInlineScripts = [...html.matchAll(/<script(?![^>]*type=["']application\/ld\+json["'])([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/.test(match[1]) && match[2].trim().length > 0);
  if (executableInlineScripts.length) {
    failures.push(`${relative}: ${executableInlineScripts.length} executable inline script block(s)`);
  }

  if (/\son[a-z]+\s*=/i.test(html)) {
    failures.push(`${relative}: inline event-handler attribute`);
  }
}

if (failures.length) {
  throw new Error(`Production HTML is not CSP-ready:\n${failures.join("\n")}`);
}

console.log("Production HTML is CSP-ready: no executable inline scripts, style blocks, or inline event handlers.");
