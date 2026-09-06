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

test("maps common careers to profession specialties while keeping broad and all-career fallbacks", () => {
  assert.equal(inferCareerFamily("Registered Nurse"), "nursing");
  assert.equal(inferCareerFamily("Platform Engineer"), "devops_platform");
  assert.equal(inferCareerFamily("High School Teacher"), "teaching_k12");
  assert.equal(inferCareerFamily("Funeral Director"), "management");
  assert.equal(inferCareerFamily("Professional Dog Walker"), "general");
});

test("recognizes profession-specific titles across major career areas", () => {
  const cases = {
    "Physician": "physician",
    "Pharmacist": "pharmacy",
    "Mental Health Counselor": "mental_health",
    "Physical Therapist": "allied_health",
    "Dentist": "dental",
    "Software Engineer": "software_engineering",
    "Cybersecurity Analyst": "cybersecurity",
    "Data Analyst": "data_analytics",
    "Technical Support Engineer": "it_support_network",
    "Product Manager": "product_management",
    "Project Manager": "project_program_management",
    "Staff Accountant": "accounting",
    "Financial Analyst": "financial_services",
    "Account Executive": "sales",
    "Customer Success Manager": "customer_success",
    "Recruiter": "recruiting_hr",
    "Marketing Manager": "marketing",
    "UX Designer": "ux_design",
    "Professor": "higher_education",
    "Attorney": "legal_practice",
    "Risk Analyst": "compliance_risk",
    "Supply Chain Manager": "supply_chain_logistics",
    "Quality Engineer": "manufacturing_quality",
    "Mechanical Engineer": "engineering_nonsoftware",
    "Electrician": "construction_trades",
    "Auto Mechanic": "automotive",
    "Chef": "hospitality_food",
    "Store Manager": "retail",
    "Police Officer": "public_safety",
    "Social Worker": "social_work_nonprofit",
    "Research Scientist": "science_research_lab",
    "Executive Assistant": "administrative_office",
    "Claims Adjuster": "insurance",
    "Real Estate Agent": "real_estate",
    "Truck Driver": "transportation",
    "Agronomist": "agriculture",
    "Veterinarian": "veterinary",
    "Reporter": "media_journalism",
    "Architect": "architecture",
    "Grid Operator": "energy_utilities",
    "Airline Pilot": "aviation",
    "Chief Executive Officer": "executive_leadership",
  };

  for (const [role, expected] of Object.entries(cases)) {
    assert.equal(inferCareerFamily(role), expected, role);
  }
});

test("builds an exact-length interview with common, profession, job-description, and career-proof questions", () => {
  const plan = buildInterviewPlan({
    roleTitle: "Registered Nurse",
    careerArea: "Healthcare",
    questionCount: 8,
    interviewType: "mixed",
    jobDescription: "Provide safe patient care, communicate with families, and prioritize changing clinical needs.",
    receipts: [{ id: "r1", accomplishment: "Improved shift handoff documentation for the care team" }],
  });

  assert.equal(plan.family, "nursing");
  assert.equal(plan.questions.length, 8);
  assert.ok(plan.questions.some((question) => question.source === "impact-receipt"));
  assert.ok(plan.questions.some((question) => question.source === "job-description"));
  assert.ok(plan.questions.some((question) => /patient's condition changed|patient-care priorities/i.test(question.text)));
  assert.ok(plan.questions.some((question) => /one strength you would bring to a Registered Nurse/i.test(question.text)));
  assert.ok(plan.questions.some((question) => question.text.includes("Registered Nurse")));
});

test("profession questions change materially with the target role", () => {
  const nurse = buildInterviewPlan({ roleTitle: "Registered Nurse", questionCount: 5 });
  const software = buildInterviewPlan({ roleTitle: "Software Engineer", questionCount: 5 });
  const teacher = buildInterviewPlan({ roleTitle: "High School Teacher", questionCount: 5 });

  assert.ok(nurse.questions.some((question) => /patient|shift|care/i.test(question.text)));
  assert.ok(software.questions.some((question) => /software defect|technical tradeoff|code review/i.test(question.text)));
  assert.ok(teacher.questions.some((question) => /lesson|students|classroom/i.test(question.text)));
  assert.notDeepEqual(
    nurse.questions.map((question) => question.text),
    software.questions.map((question) => question.text),
  );
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
  if (analysis.followUp) assert.match(analysis.followUp, /evidence|problem|personally|strongest/i);
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

test("scores strength evidence against role alignment instead of a generic communication rubric", () => {
  const question = "What is one strength you would bring to a Risk Analyst position, and what evidence best demonstrates it?";
  const answer = "One strength I would bring to a Risk Analyst role is proactive risk identification. In a startup role, I developed and documented risk processes, adjusted vendor rules, reviewed controls, and worked cross-functionally to identify gaps before they became larger problems. That allowed me to operate as the primary risk resource, improved the team's risk process, and supported business goals with clearer controls.";
  const analysis = analyzeAnswer(answer, {
    question,
    competency: "communication",
    roleTitle: "Risk Analyst",
  });

  assert.equal(analysis.signals.competency, "role_alignment");
  assert.ok(analysis.dimensions.relevance.score >= 55);
  assert.doesNotMatch(analysis.improvements.join(" "), /tie the story directly to communication/i);
});

test("coaches vague answers instead of inventing missing impact", () => {
  const analysis = analyzeAnswer("We handled it and everything was fine.", {
    question: "Tell me about a difficult customer situation.",
  });

  assert.ok(analysis.followUp);
  assert.equal(analysis.missingDimension, "relevance");
  assert.equal(analysis.signals.quantified, false);
});

test("summarizes patterns across an interview without inventing a green strength", () => {
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

  assert.ok(summary.improvementAreas.length > 0);
  assert.ok(summary.patterns.length > 0);
  assert.equal(summary.bestAnswerIndex, 0);
  assert.ok(summary.averageWords > 0);
  assert.ok(summary.strongestAreas.every((area) => area.score >= 70));
  assert.equal(summary.hasStrongAreas, summary.strongestAreas.length > 0);
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
