import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const assetsDir = new URL("../dist/assets/", import.meta.url);
const files = readdirSync(assetsDir)
  .filter((name) => name.endsWith(".js"))
  .map((name) => ({ name, bytes: statSync(join(assetsDir.pathname, name)).size }))
  .sort((a, b) => b.bytes - a.bytes);

assert.ok(files.length > 1, "Expected route-level code splitting to produce multiple JavaScript chunks");

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const largest = files[0];
const kib = (bytes) => (bytes / 1024).toFixed(1);

// These are intentionally generous regression ceilings, not performance targets.
// Tighten them as we measure and optimize production bundles.
const MAX_SINGLE_CHUNK_BYTES = 350 * 1024;
const MAX_TOTAL_JS_BYTES = 900 * 1024;

assert.ok(
  largest.bytes <= MAX_SINGLE_CHUNK_BYTES,
  `Largest JS chunk ${largest.name} is ${kib(largest.bytes)} KiB; budget is ${kib(MAX_SINGLE_CHUNK_BYTES)} KiB`,
);
assert.ok(
  totalBytes <= MAX_TOTAL_JS_BYTES,
  `Total production JS is ${kib(totalBytes)} KiB; budget is ${kib(MAX_TOTAL_JS_BYTES)} KiB`,
);

console.log(`Bundle budget passed: ${files.length} chunks, ${kib(totalBytes)} KiB total, largest ${largest.name} at ${kib(largest.bytes)} KiB.`);
console.log("Largest chunks:");
for (const file of files.slice(0, 8)) console.log(`  ${kib(file.bytes).padStart(7)} KiB  ${file.name}`);
