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

test("Scholarship search has query guidance, aligned input, filters, pagination, provider submission and visible rights provenance", () => {
  const panel = read("./ScholarshipCatalogPanel.jsx");
  const css = read("./ScholarshipCatalogPanel.css");
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
  assert.match(css, /\.scholarship-search-box \.sr-only/);
  assert.match(css, /text-align:left!important/);
  assert.match(api, /\/scholarships/);
});

test("Program finder uses College Scorecard and keeps official data separate from Boasted suggestions", () => {
  const panel = read("./StudentOpportunitySearchPanel.jsx");
  const api = read("./studentOpportunityApi.js");
  assert.match(panel, /College Scorecard/);
  assert.match(panel, /U\.S\. Department of Education/);
  assert.match(panel, /const source = item\.source \|\| \{\}/);
  assert.match(panel, /const boasted = item\.boasted \|\| \{\}/);
  assert.match(panel, /From your Boasted evidence:/);
  assert.match(panel, /Atlanta, GA or GA/);
  assert.match(panel, /No fake match score/);
  assert.match(panel, /Volunteer\.gov/);
  assert.match(panel, /Education Data & Source Audit/);
  assert.match(api, /student-opportunities\/programs/);
});

test("Internship finder searches currently open USAJOBS listings, expands related titles locally, and has no hidden 30-day client filter", () => {
  const panel = read("./StudentOpportunitySearchPanel.jsx");
  const api = read("./studentOpportunityApi.js");
  assert.match(panel, /Federal internship/);
  assert.match(panel, /USAJOBS/);
  assert.match(panel, /U\.S\. Office of Personnel Management/);
  assert.match(panel, /no hiring prediction/i);
  assert.match(panel, /Open on USAJOBS/);
  assert.match(panel, /all currently open USAJOBS announcements/i);
  assert.match(panel, /Related titles included/);
  assert.match(panel, /caches identical searches briefly/i);
  assert.match(api, /student-opportunities\/internships/);
  assert.doesNotMatch(api, /days:/);
  assert.doesNotMatch(api, /DatePosted/);
});

test("Education public pages expose the source audit and new opportunity sources", () => {
  const marketing = read("./EducationMarketingPage.jsx");
  const guide = read("./EducationGuidePage.jsx");
  assert.match(marketing, /Scholarship Finder/);
  assert.match(marketing, /College Scorecard/);
  assert.match(marketing, /USAJOBS/);
  assert.match(marketing, /\/legal\/education-data/);
  assert.match(guide, /College Scorecard/);
  assert.match(guide, /USAJOBS/);
  assert.match(guide, /Education Data & Source Audit/);
});

test("Education legal audit publishes commercial-use rights and terms links", () => {
  const policy = read("./EducationDataPolicyPage.jsx");
  assert.match(policy, /College Scorecard/);
  assert.match(policy, /CC BY/);
  assert.match(policy, /commercial use permitted with attribution/i);
  assert.match(policy, /creativecommons\.org\/licenses\/by\/4\.0/);
  assert.match(policy, /USAJOBS API Terms of Service/);
  assert.match(policy, /commercial job boards/i);
  assert.match(policy, /developer\.usajobs\.gov\/apirequest\/index/);
  assert.match(policy, /Commercial-use rights re-verified/);
});
