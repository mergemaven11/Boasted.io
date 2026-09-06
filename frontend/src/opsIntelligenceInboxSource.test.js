import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("./OpsConsolePage.jsx", import.meta.url), "utf8");
const apiSource = fs.readFileSync(new URL("./opsApi.js", import.meta.url), "utf8");

test("Ops Inbox receives shared intelligence verification failures", () => {
  assert.match(apiSource, /getIntelligenceVerificationSummary/);
  assert.match(source, /intelligence\?\.recent_failures/);
  assert.match(source, /Boasted Intelligence/);
  assert.match(source, /result was withheld/);
});
