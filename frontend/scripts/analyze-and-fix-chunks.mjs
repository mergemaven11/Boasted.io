#!/usr/bin/env node
/**
 * Analyzes Aisha portrait chunks and generates corrections.
 * This script compares current chunks against the canonical approved asset.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPROVED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const BASE64_CHUNK_SIZE = 9190; // characters

async function main() {
  try {
    // Read the canonical approved asset
    const assetPath = path.resolve(__dirname, "../src/assets/aisha-jordan-interviewer.jpg");
    const assetBuffer = await fs.readFile(assetPath);
    const assetBase64 = assetBuffer.toString("base64");
    const assetHash = crypto.createHash("sha256").update(assetBuffer).digest("hex");

    console.log("=== CANONICAL AISHA ASSET ===");
    console.log(`File: ${assetPath}`);
    console.log(`Bytes: ${assetBuffer.length}`);
    console.log(`Base64 length: ${assetBase64.length}`);
    console.log(`SHA-256: ${assetHash}`);
    console.log(`Expected SHA-256: ${APPROVED_SHA256}`);
    console.log(`✓ Match: ${assetHash === APPROVED_SHA256}`);
    console.log();

    // Import all current chunks
    console.log("=== IMPORTING CURRENT CHUNKS ===");
    const hq01 = (await import("../src/aishaPortraitChunks/hq01.js")).default;
    const hq02 = (await import("../src/aishaPortraitChunks/hq02.js")).default;
    const hq03 = (await import("../src/aishaPortraitChunks/hq03.js")).default;
    const hq05 = (await import("../src/aishaPortraitChunks/hq05.js")).default;
    const hq06 = (await import("../src/aishaPortraitChunks/hq06.js")).default;
    const hq07 = (await import("../src/aishaPortraitChunks/hq07.js")).default;
    const hq08 = (await import("../src/aishaPortraitChunks/hq08.js")).default;
    const hq09 = (await import("../src/aishaPortraitChunks/hq09.js")).default;
    const hq10 = (await import("../src/aishaPortraitChunks/hq10.js")).default;
    const legacyHq1 = (await import("../src/aishaPortraitChunks/hq1.js")).default;
    const legacyHq2 = (await import("../src/aishaPortraitChunks/hq2.js")).default;
    const legacyHq3 = (await import("../src/aishaPortraitChunks/hq3.js")).default;
    const legacyHq4 = (await import("../src/aishaPortraitChunks/hq4.js")).default;
    const legacyHq5 = (await import("../src/aishaPortraitChunks/hq5.js")).default;

    // Derive hq04 from legacy as per aishaPortraitData.js
    const approvedEarlyMaster = `${legacyHq1}${legacyHq2}${legacyHq3}${legacyHq4}${legacyHq5}`;
    const hq04 = approvedEarlyMaster.slice(BASE64_CHUNK_SIZE * 3, BASE64_CHUNK_SIZE * 4);

    // Reconstruct current portrait
    const currentBase64 = `${hq01}${hq02}${hq03}${hq04}${hq05}${hq06}${hq07}${hq08}${hq09}${hq10}`;
    const currentBuffer = Buffer.from(currentBase64, "base64");
    const currentHash = crypto.createHash("sha256").update(currentBuffer).digest("hex");

    console.log("Current Reconstructed:");
    console.log(`  Bytes: ${currentBuffer.length}`);
    console.log(`  SHA-256: ${currentHash}`);
    console.log();

    // Find first differing byte
    let diffIndex = -1;
    let diffCurrent = null;
    let diffApproved = null;

    for (let i = 0; i < Math.min(assetBuffer.length, currentBuffer.length); i++) {
      if (assetBuffer[i] !== currentBuffer[i]) {
        diffIndex = i;
        diffApproved = assetBuffer[i];
        diffCurrent = currentBuffer[i];
        break;
      }
    }

    if (diffIndex === -1 && assetBuffer.length === currentBuffer.length) {
      console.log("✓ All bytes match!");
      return;
    }

    console.log("=== MISMATCH DETECTED ===");
    if (diffIndex >= 0) {
      console.log(`First difference at byte ${diffIndex}:`);
      console.log(`  Current:  0x${diffCurrent.toString(16).padStart(2, "0")}`);
      console.log(`  Approved: 0x${diffApproved.toString(16).padStart(2, "0")}`);
      console.log();
    }

    // Identify which chunk contains the difference
    const chunks = [
      { name: "hq01", data: hq01 },
      { name: "hq02", data: hq02 },
      { name: "hq03", data: hq03 },
      { name: "hq04", data: hq04 },
      { name: "hq05", data: hq05 },
      { name: "hq06", data: hq06 },
      { name: "hq07", data: hq07 },
      { name: "hq08", data: hq08 },
      { name: "hq09", data: hq09 },
      { name: "hq10", data: hq10 },
    ];

    let byteOffset = 0;
    const corrections = [];

    for (const chunk of chunks) {
      const chunkBytes = Buffer.from(chunk.data, "base64");
      const chunkEnd = byteOffset + chunkBytes.length;

      // Extract what this chunk should be from the approved asset
      const correctBytes = assetBuffer.slice(byteOffset, chunkEnd);
      const correctBase64 = correctBytes.toString("base64");

      const match = chunk.data === correctBase64;
      console.log(`${match ? "✓" : "✗"} ${chunk.name}: bytes ${byteOffset}-${chunkEnd - 1}`);

      if (!match) {
        console.log(`  Current length: ${chunk.data.length}`);
        console.log(`  Correct length: ${correctBase64.length}`);
        if (diffIndex >= byteOffset && diffIndex < chunkEnd) {
          console.log(`  ⚠️  Contains first difference at offset ${diffIndex - byteOffset}`);
        }
        corrections.push({
          name: chunk.name,
          file: `frontend/src/aishaPortraitChunks/${chunk.name}.js`,
          base64: correctBase64,
        });
      }

      byteOffset = chunkEnd;
    }

    if (corrections.length > 0) {
      console.log();
      console.log("=== CORRECTIONS NEEDED ===");
      for (const correction of corrections) {
        console.log();
        console.log(`FILE: ${correction.file}`);
        console.log(`REPLACEMENT:`);
        console.log(`export default "${correction.base64}";`);
      }
    }
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
