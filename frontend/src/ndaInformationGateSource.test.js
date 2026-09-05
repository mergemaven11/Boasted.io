import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("NDA gate blocks protected work submissions until the user confirms", () => {
  const gate = read("./NDAInformationGate.jsx");
  const main = read("./main.jsx");

  assert.match(main, /NDAInformationGate/);
  assert.match(gate, /\/app\/accomplishments/);
  assert.match(gate, /\/app\/impact-receipts/);
  assert.match(gate, /document\.addEventListener\("submit"/);
  assert.match(gate, /I confirm — continue/);
  assert.match(gate, /confidential, proprietary, restricted/);
});

test("NDA gate also protects public disclosure and points to safety guidance", () => {
  const gate = read("./NDAInformationGate.jsx");

  assert.match(gate, /proof-visibility-button/);
  assert.match(gate, /visibility-pill/);
  assert.match(gate, /Nonpublic source code/);
  assert.match(gate, /customer, vendor, personnel, financial/);
  assert.match(gate, /\/nda-safety/);
  assert.match(gate, /BragStack does not interpret your agreement/);
});
