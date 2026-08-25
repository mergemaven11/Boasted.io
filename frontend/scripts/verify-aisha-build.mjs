import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const EXPECTED_SHA256 = "a4f88a5fc2bcd437256ca848f1529b120b6dc0af6df2937a552915fa877181a0";
const EXPECTED_BYTES = 14219;
const PREFIX = "data:image/jpeg;base64,";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const dist = path.resolve("dist");
const files = await walk(dist);
const jsFiles = files.filter((file) => /\.m?js$/i.test(file));
assert.ok(jsFiles.length, "No production JavaScript bundles found in dist");

let found = null;
for (const file of jsFiles) {
  const text = await fs.readFile(file, "utf8");
  const regex = /data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/g;
  for (const match of text.matchAll(regex)) {
    const bytes = Buffer.from(match[1], "base64");
    const sha = crypto.createHash("sha256").update(bytes).digest("hex");
    if (sha === EXPECTED_SHA256) {
      found = { file, bytes: bytes.length, uriLength: PREFIX.length + match[1].length };
      break;
    }
  }
  if (found) break;
}

assert.ok(found, "Production Vite bundle does not contain the complete verified Aisha portrait data URI");
assert.equal(found.bytes, EXPECTED_BYTES, "Production bundle contains a truncated or transformed Aisha portrait");
console.log(`Aisha production bundle verified in ${path.relative(process.cwd(), found.file)}: ${found.bytes} decoded bytes, SHA-256 ${EXPECTED_SHA256}.`);
