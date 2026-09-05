import { analyzeAnswer, summarizeInterview } from "./interviewEngine.js";

export const AISHA_RELEASE_SUITE_VERSION = "aisha-calibration-v1";

const DIMENSIONS = ["relevance", "structure", "ownership", "specificity", "impact", "communication"];

function dimensionScores(analysis) {
  return Object.fromEntries(DIMENSIONS.map((name) => [name, Number(analysis?.dimensions?.[name]?.score ?? -1)]));
}

function analysisMetrics(analysis) {
  return {
    overall_score: Number(analysis?.overallScore ?? -1),
    dimensions: dimensionScores(analysis),
    action_found: Boolean(analysis?.signals?.actionFound),
    result_found: Boolean(analysis?.signals?.resultFound),
    quantified: Boolean(analysis?.signals?.quantified),
  };
}

export function runAishaReleaseEvaluation() {
  const vague = analyzeAnswer("I was involved with the team and things were fine.", {
    question: "Tell me about a complex problem you solved with incomplete information.",
    competency: "problem_solving",
  });

  const ownership = analyzeAnswer("I was on the project and I was part of the team.", {
    question: "Tell me what you personally owned during a difficult project.",
    competency: "ownership",
  });

  const shortAnswer = analyzeAnswer("I fixed it.", {
    question: "Tell me about a production incident and how you resolved it.",
    competency: "problem_solving",
  });

  const strong = analyzeAnswer(
    "During a production incident, our customer portal repeatedly failed during deployments. I diagnosed the container logs, isolated a memory configuration issue, tested two safer limits, and implemented the stable setting. As a result, repeat deployment failures dropped by 30 percent over the next month, which reduced support escalations and gave the team a reliable deployment path.",
    {
      question: "Tell me about a difficult technical problem you solved.",
      competency: "problem_solving",
      roleTitle: "Platform Support Engineer",
    },
  );

  const truthfulImpact = analyzeAnswer(
    "During a customer escalation, I reviewed the handoff history, identified where ownership kept becoming unclear, and rewrote the escalation checklist with the support lead. As a result, the next handoffs were completed without the repeated confusion, and the customer received a clear owner at every step.",
    {
      question: "Tell me about a customer problem you improved.",
      competency: "customer_focus",
    },
  );

  const weakResponses = [
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
  const weakSummary = summarizeInterview(weakResponses);

  return [
    { case_id: "vague-all-red", metrics: analysisMetrics(vague) },
    { case_id: "ownership-no-credit", metrics: analysisMetrics(ownership) },
    { case_id: "short-answer-low-score", metrics: analysisMetrics(shortAnswer) },
    { case_id: "strong-star", metrics: analysisMetrics(strong) },
    { case_id: "truthful-impact-no-metric", metrics: analysisMetrics(truthfulImpact) },
    {
      case_id: "weak-session-summary",
      metrics: {
        overall_score: Number(weakSummary?.overallScore ?? -1),
        has_strong_areas: Boolean(weakSummary?.hasStrongAreas),
        strongest_area_count: Array.isArray(weakSummary?.strongestAreas) ? weakSummary.strongestAreas.length : -1,
        improvement_area_count: Array.isArray(weakSummary?.improvementAreas) ? weakSummary.improvementAreas.length : -1,
      },
    },
  ];
}
