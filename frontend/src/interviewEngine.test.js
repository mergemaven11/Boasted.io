import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeAnswer,
  buildInterviewPlan,
  getBrowserInterviewCapabilities,
  inferCareerFamily,
  summarizeInterview,
} from "./interviewEngine.js";

test("maps common careers to a career family while keeping an all-career fallback", () => {
  assert.equal(inferCareerFamily("Registered Nurse"), "healthcare");
  assert.equal(inferCareerFamily("Platform Support Engineer"), "technology");
  assert.equal(inferCareerFamily("High School Teacher"), "education");
  assert.equal(inferCareerFamily("Funeral Director"), "management");
  assert.equal(inferCareerFamily("Professional Dog Walker"), "general");
});

test("builds an exact-length role-aware interview and can personalize from career proof", () => {
  const plan = buildInterviewPlan({
    roleTitle: "Registered Nurse",
    careerArea: "Healthcare",
    questionCount: 8,
    interviewType: "mixed",
    jobDescription: "Provide safe patient care, communicate with families, and prioritize changing clinical needs.",
    receipts: [{ id: "r1", accomplishment: "Improved shift handoff documentation for the care team" }],
  });

  assert.equal(plan.family, "healthcare");
  assert.equal(plan.questions.length, 8);
  assert.ok(plan.questions.some((question) => question.source === "impact-receipt"));
  assert.ok(plan.questions.some((question) => question.source === "job-description"));
  assert.ok(plan.questions.some((question) => question.text.includes("Registered Nurse")));
});

test("uses the role itself for careers outside a known family", () => {
  const plan = buildInterviewPlan({ roleTitle: "Professional Dog Walker", questionCount: 5 });
  assert.equal(plan.family, "general");
  assert.equal(plan.questions.length, 5);
  assert.ok(plan.questions.some((question) => question.text.includes("Professional Dog Walker")));
});

test("recognizes a structured answer with personal action, result, and truthful quantification", () => {
  const answer = "During a production incident, our customer portal was repeatedly failing during deployments. I diagnosed the container logs, identified a memory configuration problem, and changed the deployment settings after testing the fix. As a result, we reduced repeat deployment failures by 30 percent over the next month and the support team had fewer escalations.";
  const analysis = analyzeAnswer(answer, {
    question: "Tell me about a difficult problem you faced at work and what you personally did.",
    durationSeconds: 75,
  });

  assert.equal(analysis.signals.actionFound, true);
  assert.equal(analysis.signals.resultFound, true);
  assert.equal(analysis.signals.quantified, true);
  assert.equal(analysis.dimensions.impact.label, "Strong");
  assert.equal(analysis.followUp, null);
  assert.ok(analysis.signals.wordsPerMinute > 0);
});

test("coaches vague answers instead of inventing missing impact", () => {
  const analysis = analyzeAnswer("We handled it and everything was fine.", {
    question: "Tell me about a difficult customer situation.",
  });

  assert.ok(analysis.followUp);
  assert.equal(analysis.missingDimension, "relevance");
  assert.equal(analysis.signals.quantified, false);
});

test("summarizes patterns across an interview without an employability score claim", () => {
  const strong = analyzeAnswer(
    "During a customer escalation, I reviewed the case history, identified the recurring handoff issue, and created a clearer escalation checklist. As a result, the team reduced repeat handoff errors by 25 percent over six weeks.",
    { question: "Tell me about a customer problem." },
  );
  const weak = analyzeAnswer(
    "I worked with the team on a project and we got it done.",
    { question: "Tell me about a result you delivered." },
  );
  const summary = summarizeInterview([
    { answer: "strong", analysis: strong },
    { answer: "weak", analysis: weak },
  ]);

  assert.ok(summary.strongestAreas.length > 0);
  assert.ok(summary.improvementAreas.length > 0);
  assert.ok(summary.patterns.length > 0);
  assert.equal(summary.bestAnswerIndex, 0);
  assert.ok(summary.averageWords > 0);
});

test("reports local browser capabilities without requiring them", () => {
  const capabilities = getBrowserInterviewCapabilities({
    navigator: { mediaDevices: { getUserMedia() {} }, gpu: {} },
    speechSynthesis: {},
    SpeechRecognition: function SpeechRecognition() {},
  });

  assert.deepEqual(capabilities, {
    speechRecognition: true,
    speechSynthesis: true,
    camera: true,
    webGpu: true,
    localModelEligible: true,
  });
});
