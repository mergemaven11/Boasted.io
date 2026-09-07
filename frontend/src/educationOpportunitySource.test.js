import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function read(relativePath) {
  return fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("Education application cards open dedicated opportunity discovery experiences", () => {
  const hub = read("./ApplicationsHubPage.jsx");
  assert.match(hub, /ScholarshipCatalogPanel/);
  assert.match(hub, /StudentOpportunitySearchPanel/);
  assert.match(hub, /applicationType === "scholarship"/);
  assert.match(hub, /mode="programs"/);
  assert.match(hub, /mode="internships"/);
  assert.match(hub, /Search \+ evidence intelligence/);
});

test("Scholarship search has query guidance, filters, pagination, provider submission and visible rights provenance", () => {
  const panel = read("./ScholarshipCatalogPanel.jsx");
  const api = read("./scholarshipApi.js");
  assert.match(panel, /Boasted understood:/);
  assert.match(panel, /Search tip:/);
  assert.match(panel, /Recently added/);
  assert.match(panel, /Deadline soonest/);
  assert.match(panel, /Highest award/);
  assert.match(panel, /<option value=\{20\}>20<\/option>/);
  assert.match(panel, /<option value=\{40\}>40<\/option>/);
  assert.match(panel, /Submit a scholarship/);
  assert.match(panel, /authorized to provide this scholarship information/i);
  assert.match(panel, /CC BY 4\.0/);
  assert.match(panel, /ScholarshipCatalogPanel/);
  assert.match(api, /\/scholarships/);
});

test("Program finder separates CareerOneStop source values from Boasted annotations", () => {
  const panel = read("./StudentOpportunitySearchPanel.jsx");
  const api = read("./studentOpportunityApi.js");
  assert.match(panel, /const source = item\.source \|\| \{\}/);
  assert.match(panel, /const boasted = item\.boasted \|\| \{\}/);
  assert.match(panel, /From your Boasted evidence:/);
  assert.match(panel, /City, state or ZIP/);
  assert.match(panel, /Funding may be available/);
  assert.match(panel, /Cost\/funding status not changed by Boasted/);
  assert.match(panel, /No fake match score/);
  assert.match(panel, /Volunteer\.gov/);
  assert.match(api, /student-opportunities\/programs/);
});

test("CareerOneStop display includes both required government acknowledgements", () => {
  const panel = read("./StudentOpportunitySearchPanel.jsx");
  assert.match(panel, /Department of Labor Employment and Training Administration \(DOLETA\)/);
  assert.match(panel, /Minnesota Department of Employment & Economic Development \(DEED\)/);
  assert.match(panel, /data\.source\?\.required_attribution/);
});

test("Internship finder uses evidence-connected search but leaves listing text as source data", () => {
  const panel = read("./StudentOpportunitySearchPanel.jsx");
  const api = read("./studentOpportunityApi.js");
  assert.match(panel, /Internship signal verified by Boasted/);
  assert.match(panel, /CareerOneStop listing text shown as received/);
  assert.match(panel, /live source data/i);
  assert.match(panel, /no hiring prediction/i);
  assert.match(api, /student-opportunities\/internships/);
});
