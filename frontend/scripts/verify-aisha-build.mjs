import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const dist = path.resolve("dist");
const files = await walk(dist);
const textFiles = files.filter((file) => /\.(?:m?js|css)$/i.test(file));
assert.ok(textFiles.length, "No production JavaScript/CSS assets found in dist");

let bundle = "";
let matchedFile = "";
for (const file of textFiles) {
  const text = await fs.readFile(file, "utf8");
  bundle += text;
  if (!matchedFile && text.includes("bragstack-photo-v2")) matchedFile = file;
}

const photoAsset = files.find((file) => /aisha-jordan-interviewer[^/]*\.jpg$/i.test(file));
assert.ok(matchedFile, "Production bundle does not contain the BragStack photographic interviewer marker");
assert.ok(photoAsset, "Production build does not contain the Aisha interviewer photo asset");
assert.match(bundle, /bragstack-photo-v2/, "Aisha photographic engine marker missing from production bundle");
assert.match(bundle, /aisha-photo-avatar/, "Aisha photographic stage class missing from production bundle");
assert.doesNotMatch(bundle, /bragstack-vector-v1|aisha-mouth-opening|aisha-eyelids/, "Retired vector avatar renderer leaked into production bundle");
assert.doesNotMatch(bundle, /c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479/, "Retired unrecoverable Aisha JPEG contract leaked into production bundle");

console.log(`Aisha production avatar verified in ${path.relative(process.cwd(), matchedFile)} with ${path.relative(process.cwd(), photoAsset)}: photographic interviewer present and retired vector renderer absent.`);
