#!/usr/bin/env node
/**
 * Final extraction: reads the canonical asset and outputs correct chunks
 * Execute with: node frontend/scripts/extract-chunks.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPROVED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const BASE64_CHUNK_SIZE = 9190;

async function main() {
  try {
    // Read canonical asset
    const assetPath = path.resolve(__dirname, "../src/assets/aisha-jordan-interviewer.jpg");
    const assetBuffer = await fs.readFile(assetPath);
    const assetBase64 = assetBuffer.toString("base64");
    const assetHash = crypto.createHash("sha256").update(assetBuffer).digest("hex");

    console.error(`📦 Canonical Asset`);
    console.error(`Path: ${assetPath}`);
    console.error(`Size: ${assetBuffer.length} bytes`);
    console.error(`Base64: ${assetBase64.length} chars`);
    console.error(`SHA-256: ${assetHash}`);
    console.error(`Expected: ${APPROVED_SHA256}`);
    console.error(`Match: ${assetHash === APPROVED_SHA256 ? "✓" : "✗"}`);
    console.error();

    // Split into 10 chunks
    const chunks = [];
    for (let i = 0; i < 10; i++) {
      const startChar = i * BASE64_CHUNK_SIZE;
      const endChar = (i === 9) ? assetBase64.length : (i + 1) * BASE64_CHUNK_SIZE;
      const chunkB64 = assetBase64.slice(startChar, endChar);
      const chunkBytes = Buffer.from(chunkB64, "base64");
      
      chunks.push({
        id: i + 1,
        name: `hq${String(i + 1).padStart(2, "0")}`,
        base64: chunkB64,
        startChar,
        endChar,
        bytes: chunkBytes.length,
      });
    }

    console.error(`✓ Split into ${chunks.length} chunks:`);
    chunks.forEach(c => {
      console.error(`  ${c.name}: chars ${c.startChar}-${c.endChar - 1} (${c.base64.length} chars, ~${c.bytes} bytes)`);
    });
    console.error();

    // Output corrected chunks for stdout
    chunks.forEach(chunk => {
      process.stdout.write(`\n${'='.repeat(90)}\n`);
      process.stdout.write(`FILE: frontend/src/aishaPortraitChunks/${chunk.name}.js\n`);
      process.stdout.write(`${'='.repeat(90)}\n`);
      process.stdout.write(`export default "${chunk.base64}";\n`);
    });

    console.error();
    console.error(`✓ Output ${chunks.length} corrected chunk exports`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
