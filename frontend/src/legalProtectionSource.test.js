import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("registration requires explicit adult Terms and Privacy clickwrap", () => {
  const source = read("./AuthPage.jsx");
  assert.match(source, /legalAccepted/);
  assert.match(source, /at least 18 years old/);
  assert.match(source, /Terms &amp; Conditions/);
  assert.match(source, /Privacy Policy/);
  assert.match(source, /terms_accepted: true/);
  assert.match(source, /privacy_acknowledged: true/);
  assert.match(source, /age_18_or_older: true/);
  assert.match(source, /CURRENT_TERMS_VERSION = "2026-09-04"/);
  assert.match(source, /CURRENT_PRIVACY_VERSION = "2026-09-04"/);
});

test("OAuth registration carries the same affirmative legal acceptance", () => {
  const source = read("./AuthPage.jsx");
  assert.match(source, /if \(isRegister && !legalAccepted\)/);
  assert.match(source, /Object\.entries\(acceptance\)/);
  assert.match(source, /The same age, Terms, and Privacy acceptance applies/);
});

test("public legal pages cover current education and automated-guidance risks", () => {
  const source = read("./LegalPages.jsx");
  assert.match(source, /Adults only during the current self-service phase/);
  assert.match(source, /No automated admissions, scholarship, or employment decisions/);
  assert.match(source, /Education and application tools/);
  assert.match(source, /No affiliation or endorsement/);
  assert.match(source, /Career-development services and third-party marketplace listings/);
  assert.match(source, /HIPAA, FERPA, COPPA, PCI DSS, SOC 2, ISO 27001/);
});

test("customer docs explain application boundaries and official-source verification", () => {
  const source = read("./DocsPage.jsx");
  assert.match(source, /Applications & Education Intelligence/);
  assert.match(source, /does not generate admissions odds, scholarship odds, selection scores/);
  assert.match(source, /Always check official eligibility, deadlines, prompts, word limits/);
  assert.match(source, /Important product boundaries/);
});

test("NDA and security pages warn against restricted and regulated data", () => {
  const nda = read("./NDAGuidancePage.jsx");
  const security = read("./SecurityPage.jsx");
  assert.match(nda, /Highly sensitive data does not belong here/);
  assert.match(nda, /Current adult-use restriction/);
  assert.match(nda, /verification is not a legal certification/i);
  assert.match(security, /Security features are not a compliance certification/);
  assert.match(security, /No online service can promise absolute security/);
});
