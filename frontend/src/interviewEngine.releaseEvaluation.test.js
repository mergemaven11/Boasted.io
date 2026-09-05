import test from "node:test";
import assert from "node:assert/strict";

import { AISHA_RELEASE_SUITE_VERSION, runAishaReleaseEvaluation } from "./aiVerificationReleaseEvaluation.js";

test("Aisha release calibration emits the complete privacy-safe suite", () => {
  const cases = runAishaReleaseEvaluation();
  assert.equal(AISHA_RELEASE_SUITE_VERSION, "aisha-calibration-v1");
  assert.deepEqual(
    cases.map((item) => item.case_id).sort(),
    [
      "ownership-no-credit",
      "short-answer-low-score",
      "strong-star",
      "truthful-impact-no-metric",
      "vague-all-red",
      "weak-session-summary",
    ],
  );

  for (const item of cases) {
    assert.ok(item.metrics && typeof item.metrics === "object");
    assert.equal("answer" in item.metrics, false);
    assert.equal("question" in item.metrics, false);
  }
});

test("Aisha release calibration remains inside the expected score envelopes", () => {
  const cases = Object.fromEntries(runAishaReleaseEvaluation().map((item) => [item.case_id, item.metrics]));

  assert.ok(cases["vague-all-red"].overall_score < 55);
  assert.equal(Object.values(cases["vague-all-red"].dimensions).every((score) => score < 55), true);

  assert.ok(cases["ownership-no-credit"].dimensions.ownership <= 20);
  assert.equal(cases["ownership-no-credit"].action_found, false);

  assert.ok(cases["short-answer-low-score"].overall_score <= 25);

  const strong = cases["strong-star"];
  assert.ok(strong.overall_score >= 65);
  assert.ok(Object.values(strong.dimensions).filter((score) => score >= 70).length >= 4);
  assert.equal(strong.action_found, true);
  assert.equal(strong.result_found, true);

  const truthfulImpact = cases["truthful-impact-no-metric"];
  assert.ok(truthfulImpact.dimensions.impact >= 70);
  assert.equal(truthfulImpact.quantified, false);
  assert.equal(truthfulImpact.result_found, true);

  const weakSummary = cases["weak-session-summary"];
  assert.ok(weakSummary.overall_score < 55);
  assert.equal(weakSummary.has_strong_areas, false);
  assert.equal(weakSummary.strongest_area_count, 0);
  assert.equal(weakSummary.improvement_area_count, 6);
});
