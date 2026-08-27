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
  if (!matchedFile && text.includes("bragstack-static-aj-v1")) matchedFile = file;
}

assert.ok(matchedFile, "Production bundle does not contain the BragStack static AJ interviewer marker");
assert.match(bundle, /bragstack-static-aj-v1/, "AJ static interviewer engine marker missing from production bundle");
assert.match(bundle, /aj-avatar-monogram/, "AJ monogram class missing from production bundle");
assert.match(bundle, /BragStack Interviewer/, "AJ interviewer identity copy missing from production bundle");
assert.doesNotMatch(bundle, /bragstack-photo-v2|aisha-photo-avatar|aisha-jordan-interviewer/i, "Retired photographic interviewer leaked into production bundle");
assert.doesNotMatch(bundle, /bragstack-vector-v1|aisha-mouth-opening|aisha-eyelids/, "Retired vector avatar renderer leaked into production bundle");

console.log(`AJ production avatar verified in ${path.relative(process.cwd(), matchedFile)}: static interviewer present; retired photo/vector renderers absent.`);
