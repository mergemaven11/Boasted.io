import { analyzeAnswer, summarizeInterview } from "./interviewEngine.js";

export const AISHA_RELEASE_SUITE_VERSION = "aisha-calibration-v2-32";

const DIMENSIONS = ["relevance", "structure", "ownership", "specificity", "impact", "communication"];
const STRONG_OPTIONS = {
  question: "Tell me about a difficult technical problem you personally solved and what changed afterward.",
  competency: "problem_solving",
  roleTitle: "Platform Support Engineer",
};
const STRONG_STAR = "During a production incident, our customer portal repeatedly failed during deployments. I diagnosed the container logs, isolated a memory configuration issue, tested two safer limits, and implemented the stable setting. As a result, repeat deployment failures dropped by 30 percent over the next month, which reduced support escalations and gave the team a reliable deployment path.";
const TRUTHFUL_IMPACT = "During a customer escalation, I reviewed the handoff history, identified where ownership kept becoming unclear, and rewrote the escalation checklist with the support lead. As a result, the next handoffs were completed without the repeated confusion, and the customer received a clear owner at every step.";

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
    warning_triggered: Boolean(analysis?.warning?.triggered),
    word_count: Number(analysis?.signals?.wordCount ?? -1),
    filler_count: Number(analysis?.signals?.fillerCount ?? -1),
    missing_dimension: analysis?.missingDimension || null,
  };
}

function answerCase(caseId, answer, options) {
  return { case_id: caseId, metrics: analysisMetrics(analyzeAnswer(answer, options)) };
}

function response(answer, options) {
  return { answer, analysis: analyzeAnswer(answer, options) };
}

function sessionMetrics(responses) {
  const summary = summarizeInterview(responses);
  return {
    overall_score: Number(summary?.overallScore ?? -1),
    dimensions: Object.fromEntries(DIMENSIONS.map((name) => [name, Number(summary?.dimensionAverages?.[name] ?? -1)])),
    has_strong_areas: Boolean(summary?.hasStrongAreas),
    strongest_area_count: Array.isArray(summary?.strongestAreas) ? summary.strongestAreas.length : -1,
    improvement_area_count: Array.isArray(summary?.improvementAreas) ? summary.improvementAreas.length : -1,
    weak_answer_count: Number(summary?.weakAnswerCount ?? -1),
    quantified_answer_count: responses.filter((item) => item?.analysis?.signals?.quantified).length,
    result_answer_count: responses.filter((item) => item?.analysis?.signals?.resultFound).length,
  };
}

const ANSWER_CASES = [
  ["vague-all-red", "I was involved with the team and things were fine.", { question: "Tell me about a complex problem you solved with incomplete information.", competency: "problem_solving" }],
  ["ownership-no-credit", "I was on the project and I was part of the team.", { question: "Tell me what you personally owned during a difficult project.", competency: "ownership" }],
  ["short-answer-low-score", "I fixed it.", { question: "Tell me about a production incident and how you resolved it.", competency: "problem_solving" }],
  ["team-credit-only", "The team analyzed the incident, changed the configuration, and restored the service. Everyone worked together and the customer was satisfied afterward.", { question: "What did you personally do during the incident?", competency: "ownership" }],
  ["context-no-action", "During a production outage, the customer portal was unavailable and the team was under pressure because several customers were waiting for access.", { question: "Tell me about a production problem you personally solved.", competency: "problem_solving" }],
  ["action-no-result", "During a customer issue, I diagnosed the API logs, reproduced the timeout, tested the connection settings, and updated the configuration after verifying the failing path with the support team.", { question: "Tell me about a customer issue you solved and the result.", competency: "problem_solving" }],
  ["result-no-action", "The incident was resolved, customer wait time decreased by 20 percent, and service was restored for the affected accounts after the team completed the work.", { question: "What did you personally do to resolve the outage?", competency: "ownership" }],
  ["off-topic", "Last weekend I cooked dinner for friends, tried a new pasta recipe, watched a movie, and organized my game collection before going to sleep.", { question: "Tell me about a production incident you diagnosed.", competency: "problem_solving" }],
  ["filler-heavy", "Um, uh, basically, you know, kind of, sort of, I diagnosed the outage, fixed the setting, and the service recovered.", { question: "Tell me about a technical incident you solved.", competency: "problem_solving" }],
  ["profanity-coaching", "During the outage I diagnosed the damn container issue, isolated the broken memory setting, tested a safer limit, and implemented the fix. As a result, the service stabilized and the customer portal recovered without another failure that shift.", { question: "Tell me about a difficult technical problem you solved.", competency: "problem_solving" }],
  ["truthful-impact-no-metric", TRUTHFUL_IMPACT, { question: "Tell me about a customer problem you improved.", competency: "customer_focus" }],
  ["quantified-but-thin", "I fixed the outage and reduced downtime by 20 percent.", { question: "Tell me about a production incident you resolved.", competency: "problem_solving" }],
  ["concise-complete", "During a release failure, I diagnosed the deployment logs, isolated a bad environment setting, tested the corrected value, and updated the service configuration. As a result, the next deployment completed successfully and the team restored the release pipeline.", STRONG_OPTIONS],
  ["customer-handoff-no-number", TRUTHFUL_IMPACT, { question: "Describe a time you improved a customer handoff.", competency: "customer_focus" }],
  ["learning-example", "When I had to support an unfamiliar monitoring tool during an incident, I reviewed the runbook, reproduced the alert in a test environment, compared the healthy and failing signals, and documented what I learned. As a result, I resolved the alert and the next engineer had a clear troubleshooting path.", { question: "Tell me about a time you had to learn something quickly to solve a problem.", competency: "learning" }],
  ["entry-project", "During a class software project, I owned the API integration. I reviewed the documentation, built the request flow, tested failure cases, and fixed the validation errors with my teammate. As a result, our final demo completed the full workflow reliably and we submitted the project on time.", { question: "Tell me about a project that shows how you learn and contribute.", competency: "learning", roleTitle: "Junior Software Engineer" }],
  ["strong-star", STRONG_STAR, STRONG_OPTIONS],
  ["strong-platform", "During a Kubernetes deployment incident, several pods restarted whenever traffic increased. I inspected the pod events and container metrics, traced the restarts to an incorrect memory limit, tested a safer resource range in staging, and deployed the corrected configuration. As a result, the service stayed stable through the next traffic spike and deployment-related support tickets fell by 35 percent that month.", { question: "Tell me about a platform reliability problem you solved.", competency: "problem_solving", roleTitle: "Platform Engineer" }],
  ["strong-support", "During a repeated customer escalation, I reviewed the ticket history, reproduced the Docker networking failure, compared the customer's compose configuration with a working baseline, and documented the exact correction. As a result, the customer restored service that day and repeat escalations for the same setup dropped by 25 percent over the next month.", { question: "Tell me about a difficult customer support problem you solved.", competency: "customer_focus", roleTitle: "Technical Support Engineer" }],
  ["strong-data", "During weekly reporting, analysts were spending hours reconciling duplicate rows before publishing the dashboard. I analyzed the SQL joins, identified the many-to-many source causing duplication, rewrote the query, and validated totals against the source system. As a result, reporting preparation dropped by 40 percent and the team stopped correcting duplicate metrics after publication.", { question: "Tell me about a data quality problem you solved.", competency: "problem_solving", roleTitle: "Data Analyst" }],
  ["strong-project", "During a cross-team launch, two critical handoffs repeatedly slipped because ownership changed between meetings. I mapped the dependencies, assigned one accountable owner to each handoff, introduced a risk review, and tracked decisions in the launch plan. As a result, the final three milestones were delivered on schedule and missed handoffs fell by 30 percent.", { question: "Tell me about a project delivery risk you personally improved.", competency: "ownership", roleTitle: "Project Manager" }],
  ["strong-security", "During an alert investigation, I correlated authentication logs with endpoint telemetry, isolated a compromised token pattern, disabled the affected credential, and added a detection rule for the same behavior. As a result, the suspicious access stopped, the investigation closed without additional affected accounts, and similar alerts were triaged 30 percent faster afterward.", { question: "Tell me about a security incident you investigated and resolved.", competency: "problem_solving", roleTitle: "Security Analyst" }],
  ["strong-ux", "During usability testing, several keyboard-only users could not complete the account setup flow. I reviewed the focus order, reproduced the trap, redesigned the interaction states, and validated the update with accessibility checks. As a result, every participant in the next test completed the flow and accessibility rework dropped by 20 percent in the following release.", { question: "Tell me about a user experience problem you found and fixed.", competency: "problem_solving", roleTitle: "UX Designer" }],
  ["strong-teacher", "During a unit on fractions, several students were completing practice work but still missing the same concept on assessments. I reviewed the error patterns, changed the lesson sequence, added small-group practice, and checked understanding before moving on. As a result, assignment completion increased by 18 percent and more students demonstrated the target skill on the next assessment.", { question: "Tell me about a teaching problem you identified and improved.", competency: "problem_solving", roleTitle: "Teacher" }],
  ["strong-nurse", "During discharge teaching, several patients called back because the medication instructions were hard to follow. I reviewed the common questions, reorganized the teaching checklist, used teach-back before discharge, and documented the clarified steps. As a result, follow-up questions decreased by 15 percent and patients left with a clearer medication plan.", { question: "Tell me about a patient education process you improved.", competency: "customer_focus", roleTitle: "Registered Nurse" }],
  ["strong-sales", "During quarterly pipeline review, duplicate opportunities were inflating the forecast and confusing account ownership. I analyzed the CRM records, defined a duplicate rule with sales leadership, merged the affected records, and documented the cleanup workflow. As a result, duplicate opportunities dropped by 28 percent and the next forecast review used a cleaner pipeline.", { question: "Tell me about an operations problem you solved with CRM data.", competency: "problem_solving", roleTitle: "Sales Operations Analyst" }],
  ["strong-accounting", "During month-end close, reconciliation exceptions were repeatedly caused by inconsistent transaction coding. I reviewed the exception history, isolated the common coding pattern, updated the reconciliation checklist, and validated the change against the next close. As a result, reconciliation exceptions decreased by 22 percent and the team completed review with fewer manual corrections.", { question: "Tell me about an accounting process problem you improved.", competency: "problem_solving", roleTitle: "Accountant" }],
  ["strong-leadership", "During a high-risk migration, the team disagreed about whether to cut over on the original date. I reviewed the remaining defects, prioritized the customer-impacting risks, proposed a staged migration, and coordinated owners for each checkpoint. As a result, we completed the migration without a customer outage and reduced the unresolved launch risks from 12 to 3 before final cutover.", { question: "Tell me about a difficult leadership decision you owned.", competency: "leadership", roleTitle: "Engineering Lead" }],
];

export function runAishaReleaseEvaluation() {
  const cases = ANSWER_CASES.map(([caseId, answer, options]) => answerCase(caseId, answer, options));

  const weakResponses = [
    response("We handled it and everything was fine.", STRONG_OPTIONS),
    response("I was involved with the project but I do not remember the details.", STRONG_OPTIONS),
    response("The team got it done.", STRONG_OPTIONS),
  ];
  const strongResponses = [
    response(STRONG_STAR, STRONG_OPTIONS),
    response("During a customer outage, I reviewed the request traces, isolated a failing dependency, tested the recovery path, and implemented the corrected configuration. As a result, the service recovered, repeat errors stopped, and customer escalations dropped by 25 percent during the next month.", STRONG_OPTIONS),
    response("During a deployment regression, I compared the healthy and failing builds, traced the difference to an environment variable, corrected the release configuration, and verified the change in staging. As a result, the production deployment completed successfully and the team avoided another rollback that week.", STRONG_OPTIONS),
  ];
  const mixedResponses = [strongResponses[0], strongResponses[1], weakResponses[0], weakResponses[1]];
  const noMetricResponses = [
    response(TRUTHFUL_IMPACT, { question: "Tell me about a customer problem you improved.", competency: "customer_focus" }),
    response("During a deployment issue, I reviewed the logs, isolated the configuration mismatch, tested the corrected value, and updated the service. As a result, the deployment completed successfully and the team had a documented recovery path for the next release.", STRONG_OPTIONS),
    response("During a support handoff, I reviewed the case history, clarified the owner, updated the checklist, and communicated the next steps. As a result, the customer received one clear point of contact and the case moved forward without another ownership gap.", { question: "Tell me about a customer handoff you improved.", competency: "customer_focus" }),
  ];

  cases.push(
    { case_id: "weak-session-summary", metrics: sessionMetrics(weakResponses) },
    { case_id: "strong-session-summary", metrics: sessionMetrics(strongResponses) },
    { case_id: "mixed-session-summary", metrics: sessionMetrics(mixedResponses) },
    { case_id: "no-metric-session-summary", metrics: sessionMetrics(noMetricResponses) },
  );
  return cases;
}
