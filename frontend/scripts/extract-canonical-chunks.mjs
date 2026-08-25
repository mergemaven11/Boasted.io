#!/usr/bin/env node
/**
 * CRITICAL: Extract chunks ONLY from canonical asset binary.
 * Verify concatenation matches SHA-256 before any commit.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPROVED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const BASE64_CHUNK_SIZE = 9190;

async function extractChunks() {
  // Read ONLY the canonical approved asset - NOT from current chunks
  const assetPath = path.resolve(__dirname, "../src/assets/aisha-jordan-interviewer.jpg");
  const canonicalBinary = await fs.readFile(assetPath);
  const canonicalHash = crypto.createHash("sha256").update(canonicalBinary).digest("hex");
  
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("CANONICAL ASSET ANALYSIS");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`File: ${assetPath}`);
  console.log(`Binary size: ${canonicalBinary.length} bytes`);
  console.log(`SHA-256: ${canonicalHash}`);
  console.log(`Expected: ${APPROVED_SHA256}`);
  console.log(`Match: ${canonicalHash === APPROVED_SHA256 ? "✓ YES" : "✗ NO"}`);
  
  if (canonicalHash !== APPROVED_SHA256) {
    throw new Error(`FATAL: Asset SHA-256 mismatch!`);
  }
  console.log();

  // Convert canonical binary to base64 (this is our source of truth)
  const canonicalBase64 = canonicalBinary.toString("base64");
  console.log(`Base64 length: ${canonicalBase64.length} characters`);
  console.log();

  // Split into chunks - EXCLUSIVELY from canonical asset
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("GENERATING 10 CHUNKS FROM CANONICAL ASSET ONLY");
  console.log("═══════════════════════════════════════════════════════════════");
  
  const chunks = [];
  for (let i = 0; i < 10; i++) {
    const startIdx = i * BASE64_CHUNK_SIZE;
    const endIdx = (i === 9) ? canonicalBase64.length : (i + 1) * BASE64_CHUNK_SIZE;
    const chunkBase64 = canonicalBase64.slice(startIdx, endIdx);
    
    chunks.push({
      index: i,
      name: `hq${String(i + 1).padStart(2, "0")}`,
      startIdx,
      endIdx,
      base64: chunkBase64,
      charCount: chunkBase64.length,
    });
    
    const chunkBytes = Buffer.from(chunkBase64, "base64");
    console.log(`Chunk ${i + 1} (${chunks[i].name}):`);
    console.log(`  Base64 chars: [${startIdx}, ${endIdx}) = ${chunkBase64.length} chars`);
    console.log(`  Decodes to: ${chunkBytes.length} bytes`);
  }
  console.log();

  // VERIFICATION: Reconstruct binary and verify hash
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("VERIFICATION: RECONSTRUCTING BINARY FROM CHUNKS");
  console.log("═══════════════════════════════════════════════════════════════");
  
  const reconstructedBase64 = chunks.map(c => c.base64).join("");
  const reconstructedBinary = Buffer.from(reconstructedBase64, "base64");
  const reconstructedHash = crypto.createHash("sha256").update(reconstructedBinary).digest("hex");
  
  console.log(`Concatenated base64 length: ${reconstructedBase64.length} chars`);
  console.log(`Reconstructed binary size: ${reconstructedBinary.length} bytes`);
  console.log(`Reconstructed SHA-256: ${reconstructedHash}`);
  console.log(`Expected SHA-256:      ${APPROVED_SHA256}`);
  
  const binaryMatch = Buffer.compare(canonicalBinary, reconstructedBinary) === 0;
  const hashMatch = reconstructedHash === APPROVED_SHA256;
  
  console.log(`Binary byte-for-byte match: ${binaryMatch ? "✓ YES" : "✗ NO"}`);
  console.log(`SHA-256 match: ${hashMatch ? "✓ YES" : "✗ NO"}`);
  console.log();

  if (!binaryMatch || !hashMatch) {
    throw new Error(`FATAL: Reconstruction verification FAILED!`);
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("✓ ALL VERIFICATIONS PASSED - CHUNKS READY FOR COMMIT");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log();

  return chunks;
}

// Execute and output chunk data
extractChunks()
  .then(chunks => {
    // Output as JSON for programmatic processing
    console.log(JSON.stringify({
      verified: true,
      approvedSha256: APPROVED_SHA256,
      chunkCount: chunks.length,
      chunks: chunks.map(c => ({
        name: c.name,
        path: `frontend/src/aishaPortraitChunks/${c.name}.js`,
        base64: c.base64,
      })),
    }, null, 2));
  })
  .catch(error => {
    console.error(`\n❌ FATAL ERROR: ${error.message}`);
    process.exit(1);
  });
