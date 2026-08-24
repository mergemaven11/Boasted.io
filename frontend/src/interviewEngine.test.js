import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeAnswer,
  buildInterviewPlan,
  getBrowserInterviewCapabilities,
  inferCareerFamily,
  summarizeInterview,
} from "./interviewEngine.js";
import { rankImpactReceipts, scoreMeaningAlignment } from "./careerIntelligence.js";

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

test("ranks the strongest relevant Impact Receipt instead of taking the first one", () => {
  const ranked = rankImpactReceipts([
    { id: "generic", accomplishment: "Organized a team lunch" },
    {
      id: "relevant",
      accomplishment: "Diagnosed recurring Kubernetes deployment failures",
      contribution: "I isolated a memory limit issue and implemented a safer deployment configuration",
      result: "Reduced repeat production deployment failures by 30 percent",
      evidence: "incident report",
    },
  ], {
    roleTitle: "Platform Engineer",
    jobDescription: "Own Kubernetes reliability, troubleshoot production incidents, and reduce deployment failures.",
    competency: "problem_solving",
    question: "Tell me about a difficult technical problem you diagnosed.",
  });

  assert.equal(ranked[0].receipt.id, "relevant");
  assert.ok(ranked[0].score > ranked[1].score);
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
    competency: "problem_solving",
    roleTitle: "Platform Support Engineer",
    durationSeconds: 75,
  });

  assert.equal(analysis.signals.actionFound, true);
  assert.equal(analysis.signals.resultFound, true);
  assert.equal(analysis.signals.quantified, true);
  assert.equal(analysis.signals.competency, "problem_solving");
  assert.ok(["Strong", "Excellent"].includes(analysis.dimensions.impact.label));
  assert.ok(analysis.dimensions.relevance.score >= 55);
  assert.equal(analysis.followUp, null);
  assert.ok(analysis.signals.wordsPerMinute > 0);
});

test("distinguishes polished answer form from evidence of the requested competency", () => {
  const polishedButWrong = "During a quarterly project I analyzed the schedule, implemented a new checklist, and improved completion time by 25 percent. As a result, the work finished faster and the team met the deadline.";
  const meaning = scoreMeaningAlignment(polishedButWrong, {
    question: "Tell me about a time you influenced people without formal authority.",
    competency: "leadership",
  });
  const analysis = analyzeAnswer(polishedButWrong, {
    question: "Tell me about a time you influenced people without formal authority.",
    competency: "leadership",
  });

  assert.equal(meaning.competency, "leadership");
  assert.ok(meaning.score < 55);
  assert.equal(analysis.missingDimension, "relevance");
  assert.match(analysis.followUp, /leadership/i);
});

test("rewards evidence that actually demonstrates the requested competency", () => {
  const answer = "When two teams disagreed on the rollout, I facilitated a working session, listened to each stakeholder's risk concerns, and proposed a phased plan. I influenced both leads to align on the shared reliability goal even though neither reported to me. As a result, we launched on schedule without the expected support escalation.";
  const analysis = analyzeAnswer(answer, {
    question: "Tell me about a time you influenced people without formal authority.",
    competency: "leadership",
  });

  assert.equal(analysis.signals.competency, "leadership");
  assert.ok(analysis.dimensions.relevance.score >= 55);
  assert.ok(analysis.meaning.matchedConceptGroups >= 2);
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
    { question: "Tell me about a customer problem.", competency: "problem_solving" },
  );
  const weak = analyzeAnswer(
    "I worked with the team on a project and we got it done.",
    { question: "Tell me about a result you delivered.", competency: "results" },
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
