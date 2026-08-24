import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeAnswer,
  buildInterviewPlan,
  getBrowserInterviewCapabilities,
  mapCareerFamily,
  summarizeInterview,
} from "./interviewEngine.js";

const receipts = [
  { id: "weak", title: "Helped with a task", description: "Assisted the team.", outcome: "Completed work", tags: [] },
  { id: "strong", title: "Reduced API latency", description: "Diagnosed a caching bottleneck and coordinated a fix.", outcome: "Cut p95 latency by 42%", tags: ["api", "performance"] },
];

test("maps common careers to a career family while keeping an all-career fallback", () => {
  assert.equal(mapCareerFamily("Senior Software Engineer"), "technology");
  assert.equal(mapCareerFamily("Registered Nurse"), "healthcare");
  assert.equal(mapCareerFamily("Investment Analyst"), "finance");
  assert.equal(mapCareerFamily("Professional Dog Walker"), "general");
});

test("builds an exact-length role-aware interview and can personalize from career proof", () => {
  const plan = buildInterviewPlan({
    roleTitle: "Platform Support Engineer",
    careerArea: "Technology",
    experienceLevel: "experienced",
    interviewType: "mixed",
    questionCount: 8,
    jobDescription: "Own production incidents, Kubernetes reliability, and customer communication.",
    receipts,
  });

  assert.equal(plan.questions.length, 8);
  assert.ok(plan.questions.some((question) => question.source === "impact-receipt"));
  assert.ok(plan.questions.some((question) => question.source === "job-description"));
  assert.equal(plan.family, "technology");
});

test("ranks the strongest relevant Impact Receipt instead of taking the first one", () => {
  const plan = buildInterviewPlan({
    roleTitle: "Platform Support Engineer",
    questionCount: 5,
    receipts,
  });
  const proofQuestion = plan.questions.find((question) => question.source === "impact-receipt");
  assert.equal(proofQuestion.receiptId, "strong");
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
  const answer = "At my last company, we had a challenging situation. I took ownership and communicated clearly with everyone. I worked hard, stayed organized, and the team was happy with the outcome.";
  const analysis = analyzeAnswer(answer, {
    question: "Tell me about a time you used Kubernetes to restore a degraded production service.",
    competency: "technical_depth",
    roleTitle: "Platform Engineer",
  });
  assert.ok(analysis.dimensions.relevance.score < 55);
  assert.ok(analysis.followUp);
});

test("rewards evidence that actually demonstrates the requested competency", () => {
  const answer = "Our Kubernetes service started returning 503s after a deployment. I compared pod restarts and memory limits, found OOMKills in the logs, rolled back the deployment, then raised the limit after load testing. Error rate returned to baseline in 12 minutes and we added an alert for memory saturation.";
  const analysis = analyzeAnswer(answer, {
    question: "Tell me about a time you used Kubernetes to restore a degraded production service.",
    competency: "technical_depth",
    roleTitle: "Platform Engineer",
  });
  assert.ok(analysis.dimensions.relevance.score >= 55);
});

test("coaches vague answers instead of inventing missing impact", () => {
  const analysis = analyzeAnswer("I helped the team fix the issue and it went well.", {
    question: "Tell me about a difficult problem you solved.",
    competency: "problem_solving",
    roleTitle: "Support Engineer",
  });
  assert.ok(analysis.improvements.length > 0);
  assert.ok(analysis.followUp);
  assert.equal(analysis.signals.quantified, false);
});

test("summarizes patterns across an interview without an employability score claim", () => {
  const responses = [
    { analysis: analyzeAnswer("I diagnosed the API issue, changed the cache config, and reduced latency by 20 percent.", { question: "Tell me about a problem you solved.", competency: "problem_solving", roleTitle: "Engineer" }) },
    { analysis: analyzeAnswer("We had a deadline and I helped. It went well.", { question: "Tell me about a deadline.", competency: "execution", roleTitle: "Engineer" }) },
  ];
  const summary = summarizeInterview(responses);
  assert.ok(summary.overallLabel);
  assert.ok(Array.isArray(summary.patterns));
});

test("reports local browser capabilities without requiring them", () => {
  const capabilities = getBrowserInterviewCapabilities({
    speechSynthesis: {},
    SpeechRecognition: function Recognition() {},
    navigator: { mediaDevices: { getUserMedia() {} } },
  });
  assert.equal(capabilities.speechSynthesis, true);
  assert.equal(capabilities.speechRecognition, true);
  assert.equal(capabilities.camera, true);
});
