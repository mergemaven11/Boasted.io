#!/usr/bin/env node
/**
 * Complete Aisha portrait chunk regeneration and verification.
 * 
 * This script:
 * 1. Reads the canonical approved asset (aisha-jordan-interviewer.jpg)
 * 2. Converts to base64 and splits into 10 chunks of 9190 chars each
 * 3. Verifies SHA-256 matches expected approved hash
 * 4. Verifies concatenation reproduces exact binary
 * 5. Outputs all corrected chunk files ready to apply
 * 
 * Run with: node frontend/scripts/regenerate-and-verify-chunks.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPROVED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const BASE64_CHUNK_SIZE = 9190;

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║        AISHA PORTRAIT CHUNK REGENERATION AND VERIFICATION                     ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════════╝\n");

  try {
    // STEP 1: Read canonical asset
    console.log("STEP 1: Reading canonical approved asset...");
    const assetPath = path.resolve(__dirname, "../src/assets/aisha-jordan-interviewer.jpg");
    const canonicalBuffer = await fs.readFile(assetPath);
    const canonicalBase64 = canonicalBuffer.toString("base64");
    const canonicalHash = crypto.createHash("sha256").update(canonicalBuffer).digest("hex");
    
    console.log(`  File: ${assetPath}`);
    console.log(`  Size: ${canonicalBuffer.length} bytes`);
    console.log(`  Base64 length: ${canonicalBase64.length} characters`);
    console.log(`  SHA-256: ${canonicalHash}`);
    console.log(`  Expected: ${APPROVED_SHA256}`);
    console.log(`  ✓ Hash match: ${canonicalHash === APPROVED_SHA256 ? "YES" : "NO"}\n`);

    if (canonicalHash !== APPROVED_SHA256) {
      throw new Error(`Asset SHA-256 mismatch! Expected ${APPROVED_SHA256}, got ${canonicalHash}`);
    }

    // STEP 2: Split into chunks
    console.log("STEP 2: Generating chunks from canonical asset...");
    const chunks = [];
    for (let i = 0; i < 10; i++) {
      const startChar = i * BASE64_CHUNK_SIZE;
      const endChar = (i === 9) ? canonicalBase64.length : (i + 1) * BASE64_CHUNK_SIZE;
      const chunkBase64 = canonicalBase64.slice(startChar, endChar);
      const chunkBytes = Buffer.from(chunkBase64, "base64");
      
      chunks.push({
        id: i + 1,
        name: `hq${String(i + 1).padStart(2, "0")}`,
        base64: chunkBase64,
        startChar,
        endChar,
        byteCount: chunkBytes.length,
      });
      
      console.log(`  ${chunks[i].name}: chars [${startChar}-${endChar}] = ${chunkBase64.length} base64 chars → ${chunkBytes.length} bytes`);
    }
    console.log();

    // STEP 3: Verify concatenation
    console.log("STEP 3: Verifying concatenation reproduces exact binary...");
    const concatenatedBase64 = chunks.map(c => c.base64).join("");
    const concatenatedBuffer = Buffer.from(concatenatedBase64, "base64");
    const concatenatedHash = crypto.createHash("sha256").update(concatenatedBuffer).digest("hex");
    
    console.log(`  Concatenated length: ${concatenatedBuffer.length} bytes`);
    console.log(`  Concatenated SHA-256: ${concatenatedHash}`);
    
    const bufferMatch = Buffer.compare(canonicalBuffer, concatenatedBuffer) === 0;
    const hashMatch = concatenatedHash === canonicalHash;
    
    console.log(`  ✓ Binary match: ${bufferMatch ? "YES" : "NO"}`);
    console.log(`  ✓ SHA-256 match: ${hashMatch ? "YES" : "NO"}\n`);

    if (!bufferMatch || !hashMatch) {
      throw new Error("Concatenation verification failed!");
    }

    // STEP 4: Output corrected chunks
    console.log("STEP 4: Generating corrected chunk files...\n");
    
    const corrections = chunks.map((chunk, idx) => ({
      path: `frontend/src/aishaPortraitChunks/${chunk.name}.js`,
      content: `export default "${chunk.base64}";`,
      name: chunk.name,
    }));

    corrections.forEach((correction, idx) => {
      console.log(`  [${idx + 1}/${corrections.length}] ${correction.path}`);
    });

    // STEP 5: Output files in format ready for push_files
    console.log("\n╔════════════════════════════════════════════════════════════════════════════════╗");
    console.log("║                     CORRECTIONS READY TO APPLY                                 ║");
    console.log("╚════════════════════════════════════════════════════════════════════════════════╝\n");

    console.log("JSON format for push_files:\n");
    console.log(JSON.stringify(corrections, null, 2));

    console.log("\n✓ All verifications passed!");
    console.log(`✓ Ready to apply ${corrections.length} chunk corrections`);
    console.log("✓ Concatenation will reproduce: " + canonicalHash);

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
