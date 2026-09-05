import test from "node:test";
import assert from "node:assert/strict";

import { analyzeAnswer, summarizeInterview } from "./interviewEngine.js";

const dimensions = ["relevance", "structure", "ownership", "specificity", "impact", "communication"];

test("vague interview answers stay red across every scoring dimension", () => {
  const analysis = analyzeAnswer("I was involved with the team and things were fine.", {
    question: "Tell me about a complex problem you solved with incomplete information.",
    competency: "problem_solving",
  });

  for (const name of dimensions) {
    assert.ok(analysis.dimensions[name].score < 55, `${name} should stay below the developing threshold`);
  }
  assert.ok(analysis.overallScore < 55);
});

test("spoken debugging evidence can graduate from Needs detail without parroting job-description keywords", () => {
  const answer = "There was an issue with the UI and it wasn't an animation so I looked at the logs to see if the logs was giving back any feedback. The log was in the Chrome dev tools and I found the error, got the code fixed, the pull request passed the test, and it worked out.";
  const analysis = analyzeAnswer(answer, {
    question: "The Software Engineer job description emphasizes infrastructure, JavaScript, software. Tell me about a specific project where you used those skills together. What did you personally build, change, diagnose, or deliver, and what was the result?",
    competency: "role_alignment",
    roleTitle: "Software Engineer",
    jobDescription: "Build and troubleshoot software using JavaScript, browser tooling, production logs, and infrastructure practices.",
  });

  assert.equal(analysis.signals.contextFound, true);
  assert.equal(analysis.signals.actionFound, true);
  assert.equal(analysis.signals.resultFound, true);
  assert.ok(analysis.signals.behavioralEvidenceCoverage >= 67);
  assert.ok(analysis.dimensions.relevance.score >= 55);
  assert.ok(analysis.overallScore >= 55);
  assert.notEqual(analysis.overallLabel, "Needs detail");
});

test("first-person language alone does not manufacture ownership credit", () => {
  const analysis = analyzeAnswer("I was on the project and I was part of the team.", {
    question: "Tell me what you personally owned during a difficult project.",
    competency: "ownership",
  });

  assert.equal(analysis.signals.actionFound, false);
  assert.ok(analysis.dimensions.ownership.score <= 20);
});

test("a short answer cannot look like strong communication just because it has no filler", () => {
  const analysis = analyzeAnswer("I fixed it.", {
    question: "Tell me about a production incident and how you resolved it.",
    competency: "problem_solving",
  });

  assert.ok(analysis.dimensions.communication.score < 55);
  assert.ok(analysis.overallScore <= 25);
});

test("weak sessions do not invent green strongest areas", () => {
  const weakAnswers = [
    "We handled it and everything was fine.",
    "I was involved with the project but I do not remember the details.",
    "The team got it done.",
  ].map((answer) => ({
    answer,
    analysis: analyzeAnswer(answer, {
      question: "Tell me about a difficult technical problem you personally solved.",
      competency: "problem_solving",
    }),
  }));

  const summary = summarizeInterview(weakAnswers);
  assert.equal(summary.hasStrongAreas, false);
  assert.equal(summary.strongestAreas.length, 0);
  assert.equal(summary.improvementAreas.length, 6);
  assert.ok(summary.overallScore < 55);
});

test("specific STAR evidence still earns genuinely strong scores", () => {
  const answer = "During a production incident, our customer portal repeatedly failed during deployments. I diagnosed the container logs, isolated a memory configuration issue, tested two safer limits, and implemented the stable setting. As a result, repeat deployment failures dropped by 30 percent over the next month, which reduced support escalations and gave the team a reliable deployment path.";
  const analysis = analyzeAnswer(answer, {
    question: "Tell me about a difficult technical problem you solved.",
    competency: "problem_solving",
    roleTitle: "Platform Support Engineer",
  });

  const strongDimensions = dimensions.filter((name) => analysis.dimensions[name].score >= 70);
  assert.ok(strongDimensions.length >= 4);
  assert.ok(analysis.overallScore >= 65);
  assert.equal(analysis.signals.actionFound, true);
  assert.equal(analysis.signals.resultFound, true);
});

test("truthful impact can score well without forcing a made-up metric", () => {
  const answer = "During a customer escalation, I reviewed the handoff history, identified where ownership kept becoming unclear, and rewrote the escalation checklist with the support lead. As a result, the next handoffs were completed without the repeated confusion, and the customer received a clear owner at every step.";
  const analysis = analyzeAnswer(answer, {
    question: "Tell me about a customer problem you improved.",
    competency: "customer_focus",
  });

  assert.equal(analysis.signals.quantified, false);
  assert.equal(analysis.signals.resultFound, true);
  assert.ok(analysis.dimensions.impact.score >= 70);
});
