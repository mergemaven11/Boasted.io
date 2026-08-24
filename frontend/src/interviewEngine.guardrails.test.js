import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAnswer, summarizeInterview } from "./interviewEngine.js";

test("critical interview language triggers an immediate failed answer", () => {
  const analysis = analyzeAnswer("I got frustrated and said fuck it, then we moved on.", {
    question: "Tell me about a difficult workplace situation.",
    competency: "communication",
  });
  assert.equal(analysis.instantFail, true);
  assert.equal(analysis.overallScore, 0);
  assert.equal(analysis.overallLabel, "Interview failed");
  assert.ok(analysis.warning?.terms.includes("fuck"));
  assert.equal(analysis.followUp, null);
});

test("drug language is treated as a critical practice-interview warning", () => {
  const analysis = analyzeAnswer("We were talking about drugs at work.", {
    question: "Tell me about a workplace challenge.",
    competency: "judgment",
  });
  assert.equal(analysis.instantFail, true);
  assert.ok(analysis.warning?.terms.includes("drugs"));
});

test("weak answers receive concrete improvements rather than only a needs-detail label", () => {
  const analysis = analyzeAnswer("We handled it and it was fine.", {
    question: "Tell me about a difficult customer problem you solved.",
    competency: "problem_solving",
  });
  assert.ok(analysis.improvements.length >= 2);
  assert.ok(analysis.dimensions.ownership.improve);
  assert.ok(analysis.dimensions.impact.improve);
});

test("follow-up targets one missing dimension instead of repeating the original question", () => {
  const question = "Tell me about a time you solved a complex problem with incomplete information.";
  const analysis = analyzeAnswer("During a project I worked with the team and we eventually finished it.", {
    question,
    competency: "problem_solving",
  });
  assert.ok(analysis.followUp);
  assert.notEqual(analysis.followUp, question);
  assert.ok(/specific|action|personally|changed|result|skill/i.test(analysis.followUp));
});

test("final summary includes stars, score, verdict, and recommendations", () => {
  const analysis = analyzeAnswer("During a production incident, I diagnosed a container memory issue, changed the deployment configuration, tested the fix, and reduced repeat failures by 30 percent over the next month.", {
    question: "Tell me about a difficult technical problem you solved.",
    competency: "problem_solving",
  });
  const summary = summarizeInterview([{ answer: "example", analysis }]);
  assert.ok(summary.stars >= 1 && summary.stars <= 5);
  assert.ok(Number.isFinite(summary.overallScore));
  assert.ok(summary.verdict);
  assert.ok(summary.recommendations.length > 0);
});

test("one critical warning fails the overall practice interview", () => {
  const analysis = analyzeAnswer("I said shit during the meeting.", {
    question: "Tell me about a conflict.",
    competency: "communication",
  });
  const summary = summarizeInterview([{ answer: "bad", analysis }]);
  assert.equal(summary.failed, true);
  assert.equal(summary.overallScore, 0);
  assert.equal(summary.stars, 1);
});
