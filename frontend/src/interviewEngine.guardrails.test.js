import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAnswer, buildInterviewPlan, summarizeInterview } from "./interviewEngine.js";

test("profanity creates coaching but does not fail the interview", () => {
  const analysis = analyzeAnswer("I got frustrated and said shit, then I reset and resolved the issue.", {
    question: "Tell me about a difficult workplace situation.",
    competency: "communication",
  });
  assert.equal(analysis.instantFail, false);
  assert.notEqual(analysis.overallLabel, "Interview failed");
  assert.ok(analysis.warning?.terms.includes("shit"));
  assert.match(analysis.warning?.coaching || "", /keep going/i);
});

test("ordinary drug terminology is not treated as an automatic professional-language failure", () => {
  const analysis = analyzeAnswer("I reviewed the medication and drug interaction documentation with the clinical team and updated the process.", {
    question: "Tell me about a workplace challenge.",
    competency: "judgment",
    roleTitle: "Clinical Software Engineer",
  });
  assert.equal(analysis.instantFail, false);
  assert.equal(analysis.warning, null);
});

test("job descriptions drive multiple interview questions", () => {
  const plan = buildInterviewPlan({
    roleTitle: "Software Engineer",
    questionCount: 8,
    jobDescription: `
      Build and maintain Python APIs and distributed backend services.
      Deploy containerized workloads with Docker and Kubernetes on AWS.
      Design reliable PostgreSQL data models and troubleshoot production incidents.
      Collaborate with product teams to deliver customer-facing software.
    `,
  });
  const targeted = plan.questions.filter((question) => question.source === "job-description");
  assert.ok(targeted.length >= 3);
  assert.ok(targeted.some((question) => /python|api|backend|distributed/i.test(question.text)));
  assert.ok(targeted.some((question) => /docker|kubernetes|aws/i.test(question.text)));
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

test("a language coaching note does not zero the overall interview", () => {
  const analysis = analyzeAnswer("During a conflict I said shit, caught myself, communicated the issue clearly, and resolved it with the team.", {
    question: "Tell me about a conflict.",
    competency: "communication",
  });
  const summary = summarizeInterview([{ answer: "example", analysis }]);
  assert.equal(summary.failed, false);
  assert.ok(summary.overallScore > 0);
  assert.ok(summary.warnings.length === 1);
});
