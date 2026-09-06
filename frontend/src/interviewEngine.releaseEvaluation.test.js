import test from "node:test";
import assert from "node:assert/strict";

import { AISHA_RELEASE_SUITE_VERSION, runAishaReleaseEvaluation } from "./aiVerificationReleaseEvaluation.js";

const EXPECTED_CASE_IDS = [
  "action-no-result",
  "concise-complete",
  "context-no-action",
  "customer-handoff-no-number",
  "entry-project",
  "filler-heavy",
  "learning-example",
  "mixed-session-summary",
  "no-metric-session-summary",
  "off-topic",
  "ownership-no-credit",
  "profanity-coaching",
  "quantified-but-thin",
  "result-no-action",
  "short-answer-low-score",
  "strong-accounting",
  "strong-data",
  "strong-leadership",
  "strong-nurse",
  "strong-platform",
  "strong-project",
  "strong-sales",
  "strong-security",
  "strong-session-summary",
  "strong-star",
  "strong-support",
  "strong-teacher",
  "strong-ux",
  "team-credit-only",
  "truthful-impact-no-metric",
  "vague-all-red",
  "weak-session-summary",
].sort();

const STRONG_ROLE_CASES = [
  "strong-platform",
  "strong-support",
  "strong-data",
  "strong-project",
  "strong-security",
  "strong-ux",
  "strong-teacher",
  "strong-nurse",
  "strong-sales",
  "strong-accounting",
  "strong-leadership",
];

test("Aisha release calibration emits 32 unique privacy-safe cases", () => {
  const cases = runAishaReleaseEvaluation();
  assert.equal(AISHA_RELEASE_SUITE_VERSION, "aisha-calibration-v2-32");
  assert.equal(cases.length, 32);
  assert.deepEqual(cases.map((item) => item.case_id).sort(), EXPECTED_CASE_IDS);
  assert.equal(new Set(cases.map((item) => item.case_id)).size, 32);

  for (const item of cases) {
    assert.ok(item.metrics && typeof item.metrics === "object");
    assert.equal("answer" in item.metrics, false);
    assert.equal("question" in item.metrics, false);
    assert.equal("job_description" in item.metrics, false);
    assert.equal(JSON.stringify(item.metrics).includes("customer portal repeatedly failed"), false);
  }
});

test("Aisha keeps weak and incomplete answers below strong-answer scoring", () => {
  const cases = Object.fromEntries(runAishaReleaseEvaluation().map((item) => [item.case_id, item.metrics]));

  assert.ok(cases["vague-all-red"].overall_score <= 54);
  assert.equal(Object.values(cases["vague-all-red"].dimensions).every((score) => score <= 54), true);

  assert.ok(cases["ownership-no-credit"].dimensions.ownership <= 20);
  assert.equal(cases["ownership-no-credit"].action_found, false);

  assert.ok(cases["short-answer-low-score"].overall_score <= 25);
  assert.ok(cases["short-answer-low-score"].word_count <= 4);

  assert.ok(cases["team-credit-only"].overall_score <= 45);
  assert.ok(cases["team-credit-only"].dimensions.ownership <= 20);
  assert.equal(cases["team-credit-only"].action_found, false);

  assert.equal(cases["context-no-action"].action_found, false);
  assert.equal(cases["context-no-action"].result_found, false);
  assert.ok(cases["context-no-action"].overall_score <= 45);

  assert.equal(cases["action-no-result"].action_found, true);
  assert.equal(cases["action-no-result"].result_found, false);
  assert.ok(cases["action-no-result"].dimensions.impact <= 5);

  assert.equal(cases["result-no-action"].action_found, false);
  assert.equal(cases["result-no-action"].result_found, true);
  assert.ok(cases["result-no-action"].overall_score <= 60);

  assert.ok(cases["off-topic"].dimensions.relevance <= 54);
  assert.ok(cases["off-topic"].overall_score <= 60);
});

test("Aisha detects filler load and coaches profanity without hard-failing", () => {
  const cases = Object.fromEntries(runAishaReleaseEvaluation().map((item) => [item.case_id, item.metrics]));

  assert.ok(cases["filler-heavy"].filler_count >= 6);
  assert.ok(cases["filler-heavy"].dimensions.communication <= 70);
  assert.equal(cases["filler-heavy"].action_found, true);
  assert.equal(cases["filler-heavy"].result_found, true);

  assert.equal(cases["profanity-coaching"].warning_triggered, true);
  assert.ok(cases["profanity-coaching"].dimensions.communication <= 70);
});

test("Aisha distinguishes truthful non-numeric impact from thin quantified answers", () => {
  const cases = Object.fromEntries(runAishaReleaseEvaluation().map((item) => [item.case_id, item.metrics]));

  const truthful = cases["truthful-impact-no-metric"];
  assert.ok(truthful.dimensions.impact >= 70);
  assert.equal(truthful.quantified, false);
  assert.equal(truthful.result_found, true);

  const thin = cases["quantified-but-thin"];
  assert.equal(thin.quantified, true);
  assert.equal(thin.action_found, true);
  assert.equal(thin.result_found, true);
  assert.ok(thin.overall_score <= 25);

  assert.ok(cases["customer-handoff-no-number"].overall_score >= 55);
  assert.ok(cases["customer-handoff-no-number"].dimensions.impact >= 70);
  assert.equal(cases["customer-handoff-no-number"].quantified, false);
});

test("Aisha rewards complete evidence across multiple career families", () => {
  const cases = Object.fromEntries(runAishaReleaseEvaluation().map((item) => [item.case_id, item.metrics]));

  assert.ok(cases["concise-complete"].overall_score >= 55);
  assert.equal(cases["concise-complete"].action_found, true);
  assert.equal(cases["concise-complete"].result_found, true);

  assert.ok(cases["learning-example"].overall_score >= 55);
  assert.ok(cases["entry-project"].overall_score >= 55);

  const star = cases["strong-star"];
  assert.ok(star.overall_score >= 65);
  assert.ok(Object.values(star.dimensions).filter((score) => score >= 70).length >= 4);
  assert.equal(star.action_found, true);
  assert.equal(star.result_found, true);

  for (const caseId of STRONG_ROLE_CASES) {
    const metrics = cases[caseId];
    assert.ok(metrics.overall_score >= 55, `${caseId} should clear the complete-answer floor`);
    assert.ok(metrics.dimensions.impact >= 70, `${caseId} should receive impact credit`);
    assert.equal(metrics.action_found, true, `${caseId} should detect personal action`);
    assert.equal(metrics.result_found, true, `${caseId} should detect an outcome`);
  }
});

test("Aisha session summaries stay calibrated for weak, strong, mixed, and non-numeric sessions", () => {
  const cases = Object.fromEntries(runAishaReleaseEvaluation().map((item) => [item.case_id, item.metrics]));

  const weak = cases["weak-session-summary"];
  assert.ok(weak.overall_score <= 54);
  assert.equal(weak.has_strong_areas, false);
  assert.equal(weak.strongest_area_count, 0);
  assert.equal(weak.improvement_area_count, 6);
  assert.ok(weak.weak_answer_count >= 3);

  const strong = cases["strong-session-summary"];
  assert.ok(strong.overall_score >= 60);
  assert.equal(strong.has_strong_areas, true);
  assert.ok(strong.strongest_area_count >= 1);
  assert.equal(strong.improvement_area_count, 2);
  assert.equal(strong.weak_answer_count, 0);

  const mixed = cases["mixed-session-summary"];
  assert.ok(mixed.overall_score >= 35 && mixed.overall_score <= 75);
  assert.ok(mixed.weak_answer_count >= 1);

  const noMetric = cases["no-metric-session-summary"];
  assert.ok(noMetric.overall_score >= 55);
  assert.equal(noMetric.quantified_answer_count, 0);
  assert.ok(noMetric.result_answer_count >= 3);
});
