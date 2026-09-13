import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, "..");
const DIST_DIR = path.join(FRONTEND_DIR, "dist");
const HUBSPOT_TAG = '<script src="/hubspot-loader.js" defer></script>';

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".html") ? [absolute] : [];
  }));
  return nested.flat();
}

function inject(html, filePath) {
  if (html.includes('/hubspot-loader.js')) return html;
  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${HUBSPOT_TAG}\n</head>`);
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `  ${HUBSPOT_TAG}\n</body>`);
  }
  throw new Error(`Cannot inject HubSpot loader: no </head> or </body> in ${filePath}`);
}

const files = await htmlFiles(DIST_DIR);
if (!files.length) throw new Error("No built HTML files found for HubSpot injection.");

for (const filePath of files) {
  const html = await readFile(filePath, "utf8");
  await writeFile(filePath, inject(html, filePath), "utf8");
}

console.log(`Injected HubSpot consent loader into ${files.length} built HTML page(s).`);
