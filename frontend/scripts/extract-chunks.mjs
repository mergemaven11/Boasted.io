#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const assetPath = path.resolve(__dirname, "../src/assets/aisha-jordan-interviewer.jpg");
  const asset = await fs.readFile(assetPath);
  const base64 = asset.toString("base64");
  const hash = crypto.createHash("sha256").update(asset).digest("hex");
  
  console.log("Asset: ", { bytes: asset.length, hash });
  
  const BASE64_CHUNK_SIZE = 9190;
  const chunks = [];
  for (let i = 0; i < 10; i++) {
    const start = i * BASE64_CHUNK_SIZE;
    const end = (i === 9) ? base64.length : (i + 1) * BASE64_CHUNK_SIZE;
    const chunk = base64.slice(start, end);
    chunks.push({ name: `hq${String(i + 1).padStart(2, "0")}`, chunk });
    console.log(`${chunks[i].name}: chars ${start}-${end} (${chunk.length})`);
  }
  
  console.log("\n=== CHUNK EXPORTS ===\n");
  chunks.forEach(({ name, chunk }) => {
    console.log(`// ${name}`);
    console.log(`export default "${chunk}";\n`);
  });
}

run().catch(console.error);
