import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { normalizeDashboardTags } from "./dashboardTags.js";

const dashboardSource = readFileSync(new URL("./DashboardPage.jsx", import.meta.url), "utf8");

test("normalizes API tag summary objects without rendering objects as React children", () => {
  const apiShape = [
    { tag: "Docker", count: 4 },
    { tag: "FastAPI", count: 2 },
  ];

  assert.deepEqual(normalizeDashboardTags(apiShape), [
    ["Docker", 4],
    ["FastAPI", 2],
  ]);
});

test("preserves legacy tag-count maps for backward compatibility", () => {
  assert.deepEqual(normalizeDashboardTags({ Docker: 4, FastAPI: 2 }), [
    ["Docker", 4],
    ["FastAPI", 2],
  ]);
});

test("rejects malformed tag summary values safely", () => {
  assert.deepEqual(normalizeDashboardTags(null), []);
  assert.deepEqual(normalizeDashboardTags([null, { count: 2 }, "Docker"]), []);
});

test("focuses the dashboard on the proof loop until an Impact Receipt exists", () => {
  assert.match(
    dashboardSource,
    /totalEntries === 0 \? "capture" : receipts\.length === 0 \? "strengthen" : "active"/,
  );
  assert.match(dashboardSource, /activationFocused \? \(/);
  assert.match(dashboardSource, /Capture one real accomplishment\./);
  assert.match(dashboardSource, /Strengthen the proof you already saved\./);
  assert.match(dashboardSource, /Reuse the same proof for a resume, interview, review, or profile\./);
  assert.match(dashboardSource, /The broader command center opens up after you have an Impact Receipt to work with\./);
});

test("keeps first-run dashboard CTAs inside the existing proof surfaces", () => {
  assert.match(dashboardSource, /\/app\/accomplishments\?create=1/);
  assert.match(dashboardSource, /\/app\/impact-receipts/);
  assert.doesNotMatch(dashboardSource, /onboarding_completed/);
  assert.doesNotMatch(dashboardSource, /first_generated_output/);
});
