#!/usr/bin/env node
/**
 * CRITICAL FIX: Reconstruct the real approved Aisha master from chunk1a-chunk6,
 * then re-split it into hq01-hq10 format for the fix/aisha-sharp-production branch.
 * 
 * The real approved master is:
 * - 14,219 bytes
 * - 816×550 dimensions  
 * - SHA-256: a4f88a5fc2bcd437256ca848f1529b120b6dc0af6df2937a552915fa877181a0
 * 
 * Currently on main branch as: chunk1a + chunk1b + chunk2 + chunk3 + chunk4 + chunk5 + chunk6
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_APPROVED_SHA256 = "a4f88a5fc2bcd437256ca848f1529b120b6dc0af6df2937a552915fa877181a0";
const REAL_APPROVED_BYTES = 14219;
const HQ_CHUNK_SIZE = 9190; // Base64 chars per chunk in hq format

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║        RECONSTRUCTING REAL APPROVED AISHA FROM chunk1a-chunk6                  ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════════╝\n");

  try {
    // Import the 6 approved chunks from main
    const chunk1aModule = await import("../src/aishaPortraitChunks/chunk1a.js");
    const chunk1bModule = await import("../src/aishaPortraitChunks/chunk1b.js");
    const chunk2Module = await import("../src/aishaPortraitChunks/chunk2.js");
    const chunk3Module = await import("../src/aishaPortraitChunks/chunk3.js");
    const chunk4Module = await import("../src/aishaPortraitChunks/chunk4.js");
    const chunk5Module = await import("../src/aishaPortraitChunks/chunk5.js");
    const chunk6Module = await import("../src/aishaPortraitChunks/chunk6.js");

    const chunk1a = chunk1aModule.default;
    const chunk1b = chunk1bModule.default;
    const chunk2 = chunk2Module.default;
    const chunk3 = chunk3Module.default;
    const chunk4 = chunk4Module.default;
    const chunk5 = chunk5Module.default;
    const chunk6 = chunk6Module.default;

    // Reconstruct the approved master
    const approvedBase64 = `${chunk1a}${chunk1b}${chunk2}${chunk3}${chunk4}${chunk5}${chunk6}`;
    const approvedBinary = Buffer.from(approvedBase64, "base64");
    const approvedHash = crypto.createHash("sha256").update(approvedBinary).digest("hex");

    console.log("STEP 1: Reconstruct approved master from chunk1a-chunk6");
    console.log(`  Concatenated base64 length: ${approvedBase64.length} chars`);
    console.log(`  Decoded binary size: ${approvedBinary.length} bytes`);
    console.log(`  SHA-256: ${approvedHash}`);
    console.log(`  Expected: ${REAL_APPROVED_SHA256}`);
    console.log(`  Match: ${approvedHash === REAL_APPROVED_SHA256 ? "✓ YES" : "✗ NO"}`);
    console.log(`  Expected bytes: ${REAL_APPROVED_BYTES}`);
    console.log(`  Match: ${approvedBinary.length === REAL_APPROVED_BYTES ? "✓ YES" : "✗ NO"}`);
    console.log();

    if (approvedHash !== REAL_APPROVED_SHA256 || approvedBinary.length !== REAL_APPROVED_BYTES) {
      throw new Error(`FATAL: Approved master reconstruction failed!`);
    }

    // Verify JPEG markers
    console.log("STEP 2: Verify JPEG structure");
    const soi = `${approvedBinary[0].toString(16).padStart(2, "0")}${approvedBinary[1].toString(16).padStart(2, "0")}`;
    const eoi = `${approvedBinary[approvedBinary.length - 2].toString(16).padStart(2, "0")}${approvedBinary[approvedBinary.length - 1].toString(16).padStart(2, "0")}`;
    console.log(`  SOI marker: ${soi} (expected: ffd8) ${soi === "ffd8" ? "✓" : "✗"}`);
    console.log(`  EOI marker: ${eoi} (expected: ffd9) ${eoi === "ffd9" ? "✓" : "✗"}`);
    console.log();

    // Now re-split into hq01-hq10 format
    console.log("STEP 3: Re-split approved master into hq01-hq10 format");
    const hqChunks = [];
    for (let i = 0; i < 10; i++) {
      const startChar = i * HQ_CHUNK_SIZE;
      const endChar = (i === 9) ? approvedBase64.length : (i + 1) * HQ_CHUNK_SIZE;
      const chunkBase64 = approvedBase64.slice(startChar, endChar);
      const chunkBytes = Buffer.from(chunkBase64, "base64");

      hqChunks.push({
        index: i,
        name: `hq${String(i + 1).padStart(2, "0")}`,
        base64: chunkBase64,
        startChar,
        endChar,
        charCount: chunkBase64.length,
        byteCount: chunkBytes.length,
      });

      console.log(`  ${hqChunks[i].name}: chars [${startChar}-${endChar}) = ${chunkBase64.length} chars → ${chunkBytes.length} bytes`);
    }
    console.log();

    // Verify concatenation of hq chunks
    console.log("STEP 4: Verify hq01-hq10 concatenation reproduces original");
    const hqConcatenated = hqChunks.map(c => c.base64).join("");
    const hqBinary = Buffer.from(hqConcatenated, "base64");
    const hqHash = crypto.createHash("sha256").update(hqBinary).digest("hex");

    console.log(`  Concatenated base64 length: ${hqConcatenated.length} chars`);
    console.log(`  Decoded binary size: ${hqBinary.length} bytes`);
    console.log(`  SHA-256: ${hqHash}`);
    console.log(`  Match: ${hqHash === REAL_APPROVED_SHA256 ? "✓ YES" : "✗ NO"}`);

    const binaryMatch = Buffer.compare(approvedBinary, hqBinary) === 0;
    console.log(`  Binary byte-for-byte match: ${binaryMatch ? "✓ YES" : "✗ NO"}`);
    console.log();

    if (!binaryMatch || hqHash !== REAL_APPROVED_SHA256) {
      throw new Error(`FATAL: hq chunk verification failed!`);
    }

    // Output corrected chunk files
    console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
    console.log("║                 CORRECTED CHUNKS READY FOR COMMIT                              ║");
    console.log("╚════════════════════════════════════════════════════════════════════════════════╝\n");

    const corrections = hqChunks.map(chunk => ({
      path: `frontend/src/aishaPortraitChunks/${chunk.name}.js`,
      content: `export default "${chunk.base64}";`,
      name: chunk.name,
    }));

    console.log("JSON format for push_files:\n");
    console.log(JSON.stringify(corrections, null, 2));

    console.log("\n✓ All verifications passed!");
    console.log(`✓ Ready to commit ${corrections.length} corrected hq chunks`);
    console.log(`✓ Concatenation will reproduce: ${REAL_APPROVED_SHA256}`);

  } catch (error) {
    console.error(`\n❌ FATAL ERROR: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
