#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Read the canonical approved asset
  const assetPath = path.resolve(__dirname, "../src/assets/aisha-jordan-interviewer.jpg");
  const approvedBuffer = await fs.readFile(assetPath);
  const approvedHash = crypto.createHash("sha256").update(approvedBuffer).digest("hex");
  const approvedBase64 = approvedBuffer.toString("base64");
  
  console.log("=== Canonical Aisha Asset ===");
  console.log(`File: ${assetPath}`);
  console.log(`SHA-256: ${approvedHash}`);
  console.log(`Bytes: ${approvedBuffer.length}`);
  console.log(`Base64 length: ${approvedBase64.length}`);
  console.log();

  // Import current chunks to compare
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

  const hq01 = hq01Module.default;
  const hq02 = hq02Module.default;
  const hq03 = hq03Module.default;
  const hq05 = hq05Module.default;
  const hq06 = hq06Module.default;
  const hq07 = hq07Module.default;
  const hq08 = hq08Module.default;
  const hq09 = hq09Module.default;
  const hq10 = hq10Module.default;
  const legacyHq1 = legacyHq1Module.default;
  const legacyHq2 = legacyHq2Module.default;
  const legacyHq3 = legacyHq3Module.default;
  const legacyHq4 = legacyHq4Module.default;
  const legacyHq5 = legacyHq5Module.default;

  const BASE64_CHUNK_LENGTH = 9190;
  const approvedEarlyMaster = `${legacyHq1}${legacyHq2}${legacyHq3}${legacyHq4}${legacyHq5}`;
  const hq04 = approvedEarlyMaster.slice(BASE64_CHUNK_LENGTH * 3, BASE64_CHUNK_LENGTH * 4);

  // Reconstruct current portrait
  const currentBase64 = `${hq01}${hq02}${hq03}${hq04}${hq05}${hq06}${hq07}${hq08}${hq09}${hq10}`;
  const currentBuffer = Buffer.from(currentBase64, "base64");
  const currentHash = crypto.createHash("sha256").update(currentBuffer).digest("hex");

  console.log("=== Current Reconstructed Portrait ===");
  console.log(`SHA-256: ${currentHash}`);
  console.log(`Bytes: ${currentBuffer.length}`);
  console.log();

  // Find first differing byte
  let firstDiffIndex = -1;
  for (let i = 0; i < Math.min(currentBuffer.length, approvedBuffer.length); i++) {
    if (currentBuffer[i] !== approvedBuffer[i]) {
      firstDiffIndex = i;
      break;
    }
  }

  if (firstDiffIndex >= 0) {
    console.log(`❌ MISMATCH at byte ${firstDiffIndex}`);
    console.log(`Current:  0x${currentBuffer[firstDiffIndex].toString(16).padStart(2, "0")}`);
    console.log(`Approved: 0x${approvedBuffer[firstDiffIndex].toString(16).padStart(2, "0")}`);
    console.log();

    // Determine which chunk
    const chunks = [
      { name: "hq01", base64: hq01, file: "hq01.js" },
      { name: "hq02", base64: hq02, file: "hq02.js" },
      { name: "hq03", base64: hq03, file: "hq03.js" },
      { name: "hq04", base64: hq04, file: "hq04.js" },
      { name: "hq05", base64: hq05, file: "hq05.js" },
      { name: "hq06", base64: hq06, file: "hq06.js" },
      { name: "hq07", base64: hq07, file: "hq07.js" },
      { name: "hq08", base64: hq08, file: "hq08.js" },
      { name: "hq09", base64: hq09, file: "hq09.js" },
      { name: "hq10", base64: hq10, file: "hq10.js" },
    ];

    let byteOffset = 0;
    for (const chunk of chunks) {
      const chunkBytes = Buffer.from(chunk.base64, "base64");
      const chunkEnd = byteOffset + chunkBytes.length;

      if (firstDiffIndex >= byteOffset && firstDiffIndex < chunkEnd) {
        const offsetInChunk = firstDiffIndex - byteOffset;
        console.log(`Culprit: ${chunk.file} (chunk bytes ${byteOffset}-${chunkEnd - 1})`);
        console.log(`Offset within chunk: ${offsetInChunk}`);
        console.log();

        // Generate correct chunk
        const correctChunkBytes = approvedBuffer.slice(byteOffset, chunkEnd);
        const correctBase64 = correctChunkBytes.toString("base64");

        console.log("CORRECTION:");
        console.log(`export default "${correctBase64}";`);
        console.log();

        process.exit(0);
      }
      byteOffset = chunkEnd;
    }
  } else if (currentBuffer.length === approvedBuffer.length) {
    console.log("✓ All bytes match!");
    console.log(`Current hash:  ${currentHash}`);
    console.log(`Approved hash: ${approvedHash}`);
  }
}

main().catch(console.error);
