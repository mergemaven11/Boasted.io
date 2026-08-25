import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const EXPECTED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const BASE64_CHUNK_LENGTH = 9190;

// Read the canonical approved asset
const approvedAsset = await fs.readFile(path.resolve("frontend/src/assets/aisha-jordan-interviewer.jpg"));
const approvedHash = crypto.createHash("sha256").update(approvedAsset).digest("hex");
const approvedBase64 = approvedAsset.toString("base64");

console.log(`Canonical Aisha asset (aisha-jordan-interviewer.jpg):`);
console.log(`  SHA-256: ${approvedHash}`);
console.log(`  Byte count: ${approvedAsset.length}`);
console.log(`  Base64 length: ${approvedBase64.length}`);
console.log();

// Import current chunks
import hq01 from "../src/aishaPortraitChunks/hq01.js";
import hq02 from "../src/aishaPortraitChunks/hq02.js";
import hq03 from "../src/aishaPortraitChunks/hq03.js";
import hq05 from "../src/aishaPortraitChunks/hq05.js";
import hq06 from "../src/aishaPortraitChunks/hq06.js";
import hq07 from "../src/aishaPortraitChunks/hq07.js";
import hq08 from "../src/aishaPortraitChunks/hq08.js";
import hq09 from "../src/aishaPortraitChunks/hq09.js";
import hq10 from "../src/aishaPortraitChunks/hq10.js";
import legacyHq1 from "../src/aishaPortraitChunks/hq1.js";
import legacyHq2 from "../src/aishaPortraitChunks/hq2.js";
import legacyHq3 from "../src/aishaPortraitChunks/hq3.js";
import legacyHq4 from "../src/aishaPortraitChunks/hq4.js";
import legacyHq5 from "../src/aishaPortraitChunks/hq5.js";

// Derive hq04 from legacy chunks as per aishaPortraitData.js
const approvedEarlyMaster = `${legacyHq1}${legacyHq2}${legacyHq3}${legacyHq4}${legacyHq5}`;
const hq04 = approvedEarlyMaster.slice(BASE64_CHUNK_LENGTH * 3, BASE64_CHUNK_LENGTH * 4);

// Reconstruct the portrait
const reconstructed = `${hq01}${hq02}${hq03}${hq04}${hq05}${hq06}${hq07}${hq08}${hq09}${hq10}`;
const reconstructedBytes = Buffer.from(reconstructed, "base64");
const reconstructedHash = crypto.createHash("sha256").update(reconstructedBytes).digest("hex");

console.log(`Reconstructed portrait from chunks:`);
console.log(`  SHA-256: ${reconstructedHash}`);
console.log(`  Byte count: ${reconstructedBytes.length}`);
console.log();

// Find the first differing byte
let firstDiffIndex = -1;
let firstDiffReconstructed = null;
let firstDiffApproved = null;

for (let i = 0; i < Math.min(reconstructedBytes.length, approvedAsset.length); i++) {
  if (reconstructedBytes[i] !== approvedAsset[i]) {
    firstDiffIndex = i;
    firstDiffReconstructed = reconstructedBytes[i];
    firstDiffApproved = approvedAsset[i];
    break;
  }
}

if (firstDiffIndex >= 0) {
  console.log(`❌ MISMATCH DETECTED`);
  console.log(`First differing byte at index ${firstDiffIndex}:`);
  console.log(`  Reconstructed: 0x${firstDiffReconstructed.toString(16).padStart(2, "0")}`);
  console.log(`  Approved:      0x${firstDiffApproved.toString(16).padStart(2, "0")}`);
  console.log();
  
  // Determine which chunk contains this byte
  const chunks = [
    { name: "hq01", base64: hq01 },
    { name: "hq02", base64: hq02 },
    { name: "hq03", base64: hq03 },
    { name: "hq04", base64: hq04 },
    { name: "hq05", base64: hq05 },
    { name: "hq06", base64: hq06 },
    { name: "hq07", base64: hq07 },
    { name: "hq08", base64: hq08 },
    { name: "hq09", base64: hq09 },
    { name: "hq10", base64: hq10 },
  ];
  
  let byteOffset = 0;
  let culpritChunk = null;
  
  for (const chunk of chunks) {
    const chunkBytes = Buffer.from(chunk.base64, "base64");
    const chunkEnd = byteOffset + chunkBytes.length;
    
    if (firstDiffIndex >= byteOffset && firstDiffIndex < chunkEnd) {
      culpritChunk = chunk;
      const offsetInChunk = firstDiffIndex - byteOffset;
      console.log(`Culprit chunk: ${chunk.name}`);
      console.log(`  Byte offset within chunk: ${offsetInChunk}`);
      console.log(`  Chunk byte count: ${chunkBytes.length}`);
      console.log();
      
      // Extract the corrupted base64 and the correct base64
      const approvedChunkBytes = approvedAsset.slice(byteOffset, chunkEnd);
      const approvedChunkBase64 = approvedChunkBytes.toString("base64");
      
      console.log(`CORRECTION NEEDED:`);
      console.log(`File: frontend/src/aishaPortraitChunks/${chunk.name}.js`);
      console.log();
      console.log(`OLD base64 (first 50 chars):`);
      console.log(`"${chunk.base64.slice(0, 50)}..."`);
      console.log();
      console.log(`NEW base64 (first 50 chars):`);
      console.log(`"${approvedChunkBase64.slice(0, 50)}..."`);
      console.log();
      console.log(`NEW base64 (full):`);
      console.log(`"${approvedChunkBase64}"`);
      
      break;
    }
    
    byteOffset += Buffer.from(chunk.base64, "base64").length;
  }
} else if (reconstructedBytes.length !== approvedAsset.length) {
  console.log(`❌ LENGTH MISMATCH`);
  console.log(`Reconstructed: ${reconstructedBytes.length} bytes`);
  console.log(`Approved:      ${approvedAsset.length} bytes`);
} else {
  console.log(`✓ All bytes match! SHA-256 should also match.`);
  console.log(`However, SHA-256 still differs:`);
  console.log(`  Reconstructed: ${reconstructedHash}`);
  console.log(`  Approved:      ${approvedHash}`);
}
