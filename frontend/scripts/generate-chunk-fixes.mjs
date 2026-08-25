#!/usr/bin/env node
/**
 * This script extracts and corrects Aisha portrait chunks from the canonical asset.
 * It reads the approved JPEG, splits it into base64 chunks, and identifies corruptions.
 * 
 * Usage: node frontend/scripts/generate-chunk-fixes.mjs > chunk-fixes.txt
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPROVED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const BASE64_CHUNK_LENGTH = 9190;

async function main() {
  try {
    // Read canonical approved asset
    const assetPath = path.resolve(__dirname, "../src/assets/aisha-jordan-interviewer.jpg");
    const approvedBuffer = await fs.readFile(assetPath);
    const approvedBase64 = approvedBuffer.toString("base64");
    const approvedHash = crypto.createHash("sha256").update(approvedBuffer).digest("hex");

    console.error(`📦 Canonical Asset Analysis`);
    console.error(`File: ${assetPath}`);
    console.error(`SHA-256: ${approvedHash}`);
    console.error(`Bytes: ${approvedBuffer.length}`);
    console.error(`Base64 chars: ${approvedBase64.length}`);
    console.error();

    if (approvedHash !== APPROVED_SHA256) {
      console.error(`⚠️  WARNING: Asset SHA-256 does not match expected!`);
      console.error(`Expected: ${APPROVED_SHA256}`);
      console.error(`Got:      ${approvedHash}`);
      console.error();
    }

    // Split into chunks: hq01-hq10 (but hq04 is derived from legacy, so we split as hq01-hq03, then hq05-hq10)
    // Approximate byte ranges (base64 is ~1.33x the byte size)
    // 68923 bytes total / 10 chunks ≈ 6892 bytes per chunk
    // In base64: 9190 chars per chunk (approximately)

    const chunks = [];
    let pos = 0;
    const chunkNames = ["hq01", "hq02", "hq03", "hq04", "hq05", "hq06", "hq07", "hq08", "hq09", "hq10"];

    for (let i = 0; i < 10; i++) {
      const chunkName = chunkNames[i];
      const startBase64 = i * BASE64_CHUNK_LENGTH;
      const endBase64 = (i === 9) ? approvedBase64.length : (i + 1) * BASE64_CHUNK_LENGTH;
      const chunkBase64 = approvedBase64.slice(startBase64, endBase64);
      const chunkBytes = Buffer.from(chunkBase64, "base64");

      chunks.push({
        name: chunkName,
        startByte: pos,
        endByte: pos + chunkBytes.length,
        base64: chunkBase64,
        base64Length: chunkBase64.length,
      });

      console.error(`${chunkName}: bytes ${pos}-${pos + chunkBytes.length - 1} (${chunkBytes.length} bytes, ${chunkBase64.length} base64 chars)`);
      pos += chunkBytes.length;
    }
    console.error();

    // Now import current chunks and compare
    const hq01Module = await import("../src/aishaPortraitChunks/hq01.js");
    const hq02Module = await import("../src/aishaPortraitChunks/hq02.js");
    const hq03Module = await import("../src/aishaPortraitChunks/hq03.js");
    const hq05Module = await import("../src/aishaPortraitChunks/hq05.js");
    const hq06Module = await import("../src/aishaPortraitChunks/hq06.js");
    const hq07Module = await import("../src/aishaPortraitChunks/hq07.js");
    const hq08Module = await import("../src/aishaPortraitChunks/hq08.js");
    const hq09Module = await import("../src/aishaPortraitChunks/hq09.js");
    const hq10Module = await import("../src/aishaPortraitChunks/hq10.js");
    const legacyHq1Module = await import("../src/aishaPortraitChunks/hq1.js");
    const legacyHq2Module = await import("../src/aishaPortraitChunks/hq2.js");
    const legacyHq3Module = await import("../src/aishaPortraitChunks/hq3.js");
    const legacyHq4Module = await import("../src/aishaPortraitChunks/hq4.js");
    const legacyHq5Module = await import("../src/aishaPortraitChunks/hq5.js");

    const currentChunks = {
      hq01: hq01Module.default,
      hq02: hq02Module.default,
      hq03: hq03Module.default,
      hq05: hq05Module.default,
      hq06: hq06Module.default,
      hq07: hq07Module.default,
      hq08: hq08Module.default,
      hq09: hq09Module.default,
      hq10: hq10Module.default,
    };

    // Derive hq04 from legacy as per aishaPortraitData.js
    const legacyBase = `${legacyHq1Module.default}${legacyHq2Module.default}${legacyHq3Module.default}${legacyHq4Module.default}${legacyHq5Module.default}`;
    const hq04Derived = legacyBase.slice(BASE64_CHUNK_LENGTH * 3, BASE64_CHUNK_LENGTH * 4);
    currentChunks.hq04 = hq04Derived;

    // Compare each chunk
    console.error(`🔍 Chunk Comparison`);
    const corrections = [];

    for (const chunk of chunks) {
      const current = currentChunks[chunk.name];
      if (current === chunk.base64) {
        console.error(`✓ ${chunk.name}: matches`);
      } else {
        console.error(`✗ ${chunk.name}: CORRUPTED - needs correction`);
        corrections.push(chunk);
      }
    }

    if (corrections.length === 0) {
      console.error();
      console.error(`✓ All chunks match the approved asset!`);
      console.error(`The issue may be in how they are concatenated.`);
      process.exit(0);
    }

    console.error();
    console.error(`📝 Corrections Needed (${corrections.length} chunks)`);
    console.error();

    // Output the corrected chunk files
    for (const chunk of corrections) {
      const filePath = `frontend/src/aishaPortraitChunks/${chunk.name}.js`;
      console.log(`\n${'='.repeat(80)}`);
      console.log(`FILE: ${filePath}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`export default "${chunk.base64}";`);
    }

    process.exit(corrections.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
