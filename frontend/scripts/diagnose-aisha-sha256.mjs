import crypto from "node:crypto";
import {
  AISHA_PORTRAIT_DATA_URI,
} from "../src/aishaPortraitData.js";
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

const APPROVED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const CURRENT_SHA256 = "1c4f94e64923fbb29998655dd3f25460f5cd3bd9dd836aea99e778ea9d6140fd";
const PREFIX = "data:image/jpeg;base64,";

// Decode the current portrait
const currentBase64 = AISHA_PORTRAIT_DATA_URI.slice(PREFIX.length);
const currentBytes = Buffer.from(currentBase64, "base64");
const currentHash = crypto.createHash("sha256").update(currentBytes).digest("hex");

console.log(`Current SHA-256: ${currentHash}`);
console.log(`Expected SHA-256: ${APPROVED_SHA256}`);
console.log(`Current byte count: ${currentBytes.length}`);
console.log();

// Also compute legacy master
const BASE64_CHUNK_LENGTH = 9190;
const approvedEarlyMaster = `${legacyHq1}${legacyHq2}${legacyHq3}${legacyHq4}${legacyHq5}`;
const legacyBase64 = approvedEarlyMaster.slice(0, BASE64_CHUNK_LENGTH * 5);
const legacyBytes = Buffer.from(legacyBase64, "base64");
const legacyHash = crypto.createHash("sha256").update(legacyBytes).digest("hex");

console.log(`Legacy/approved early master SHA-256: ${legacyHash}`);
console.log(`Legacy byte count: ${legacyBytes.length}`);
console.log();

// Compare chunks to legacy
const chunks = [
  { name: "hq01", value: hq01 },
  { name: "hq02", value: hq02 },
  { name: "hq03", value: hq03 },
  { name: "hq05 (should match hq4)", value: hq05 },
  { name: "hq06", value: hq06 },
  { name: "hq07", value: hq07 },
  { name: "hq08", value: hq08 },
  { name: "hq09", value: hq09 },
  { name: "hq10", value: hq10 },
];

// Determine what hq04 should be
const hq04Derived = approvedEarlyMaster.slice(BASE64_CHUNK_LENGTH * 3, BASE64_CHUNK_LENGTH * 4);

console.log("Chunk size analysis:");
chunks.forEach((chunk, idx) => {
  console.log(`  ${chunk.name}: ${chunk.value.length} base64 chars`);
});
console.log(`  hq04 (derived): ${hq04Derived.length} base64 chars`);

// Reconstruct the portrait step by step to find the divergence point
let reconstructed = `${hq01}${hq02}${hq03}${hq04Derived}${hq05}${hq06}${hq07}${hq08}${hq09}${hq10}`;
const reconstructedBytes = Buffer.from(reconstructed, "base64");
const reconstructedHash = crypto.createHash("sha256").update(reconstructedBytes).digest("hex");

console.log(`\nReconstructed SHA-256: ${reconstructedHash}`);
console.log(`Reconstructed byte count: ${reconstructedBytes.length}`);

// Find first differing byte
let firstDiffByteIndex = -1;
let firstDiffCurrent = null;
let firstDiffExpected = null;

// We need the canonical approved bytes to compare against
// Since we only have the hash, we can at least identify if reconstruction matches current
if (reconstructedHash === currentHash) {
  console.log("\n✓ Reconstruction matches current portrait");
  console.log("The issue is that the current portrait's SHA-256 does not match the APPROVED_SHA256.");
  console.log("The chunks need to be corrected to match the approved master.");
} else {
  console.log("\n✗ Reconstruction differs from current portrait");
  for (let i = 0; i < Math.min(reconstructedBytes.length, currentBytes.length); i++) {
    if (reconstructedBytes[i] !== currentBytes[i]) {
      firstDiffByteIndex = i;
      firstDiffCurrent = currentBytes[i];
      firstDiffExpected = reconstructedBytes[i];
      break;
    }
  }
  if (firstDiffByteIndex >= 0) {
    console.log(`First differing byte at index ${firstDiffByteIndex}:`);
    console.log(`  Current: 0x${firstDiffCurrent.toString(16).padStart(2, "0")}`);
    console.log(`  Expected: 0x${firstDiffExpected.toString(16).padStart(2, "0")}`);
  }
}

// Try to determine which chunk should be corrected by comparing with legacy
console.log("\nChunk comparison with legacy (approved) master:");
let legacyPos = 0;
let currentPos = 0;
const chunkOrder = [
  { name: "hq01", base64: hq01 },
  { name: "hq02", base64: hq02 },
  { name: "hq03", base64: hq03 },
  { name: "hq04", base64: hq04Derived },
  { name: "hq05", base64: hq05 },
  { name: "hq06", base64: hq06 },
  { name: "hq07", base64: hq07 },
  { name: "hq08", base64: hq08 },
  { name: "hq09", base64: hq09 },
  { name: "hq10", base64: hq10 },
];

chunkOrder.forEach((chunk) => {
  const legacyChunkBytes = Buffer.from(legacyBytes.slice(legacyPos, legacyPos + chunk.base64.length * 0.75).toString("base64"), "base64");
  const currentChunkBytes = Buffer.from(chunk.base64, "base64");
  
  if (legacyChunkBytes.toString("hex") === currentChunkBytes.toString("hex")) {
    console.log(`  ✓ ${chunk.name}: matches legacy`);
  } else {
    console.log(`  ✗ ${chunk.name}: differs from expected`);
  }
  
  legacyPos += currentChunkBytes.length;
  currentPos += currentChunkBytes.length;
});
