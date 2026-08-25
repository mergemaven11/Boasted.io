import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const EXPECTED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const EXPECTED_BYTES = 68923;
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

assert.ok(found, "Production Vite bundle does not contain the complete user-approved Aisha portrait data URI");
assert.equal(found.bytes, EXPECTED_BYTES, "Production bundle contains a truncated or recompressed Aisha portrait");
assert.ok(found.bytes >= 60000, "Production Aisha portrait fell below the quality-size guardrail");
console.log(`Aisha production bundle verified in ${path.relative(process.cwd(), found.file)}: ${found.bytes} decoded bytes, SHA-256 ${EXPECTED_SHA256}.`);
