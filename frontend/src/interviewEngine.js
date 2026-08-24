import { CAREER_FAMILIES, CORE_QUESTIONS, FOLLOW_UPS } from "./interviewKnowledgeBase.js";
import { rankImpactReceipts, scoreMeaningAlignment } from "./careerIntelligence.js";

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "for", "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or", "that", "the", "this", "to", "was", "we", "were", "what", "when", "with", "you", "your"]);
const ACTION_WORDS = ["built", "created", "changed", "fixed", "implemented", "led", "owned", "organized", "resolved", "designed", "diagnosed", "improved", "coordinated", "introduced", "negotiated", "trained", "taught", "analyzed", "decided", "prioritized", "communicated"];
const RESULT_WORDS = ["result", "resulted", "reduced", "increased", "improved", "saved", "grew", "prevented", "resolved", "completed", "delivered", "achieved", "recovered", "shortened", "faster", "higher", "lower", "afterward", "ultimately", "outcome"];
const CONTEXT_WORDS = ["when", "during", "while", "project", "shift", "customer", "client", "patient", "student", "team", "deadline", "incident", "case", "campaign", "quarter", "role"];
const FILLERS = ["um", "uh", "erm", "you know", "kind of", "sort of", "basically", "literally", "i mean"];

function normalize(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9%$\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value = "") {
  return normalize(value).split(" ").filter((word) => word && !STOP_WORDS.has(word) && word.length > 2);
}

function includesAny(text, words) {
  const normalized = ` ${normalize(text)} `;
  return words.some((word) => normalized.includes(` ${word} `) || normalized.includes(` ${word}`));
}

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.id || item.text;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatRole(template, roleTitle) {
  return template.replaceAll("{role}", roleTitle || "target");
}

export function inferCareerFamily(roleTitle = "", careerArea = "") {
  const haystack = ` ${normalize(`${roleTitle} ${careerArea}`)} `;
  let bestFamily = "general";
  let bestScore = 0;

  for (const [family, config] of Object.entries(CAREER_FAMILIES)) {
    const score = config.keywords.reduce((total, keyword) => total + (haystack.includes(normalize(keyword)) ? 1 : 0), 0);
    if (score > bestScore) {
      bestFamily = family;
      bestScore = score;
    }
  }

  return bestFamily;
}

function receiptQuestion(receipts = [], roleTitle = "", jobDescription = "") {
  const ranked = rankImpactReceipts(receipts, {
    roleTitle,
    jobDescription,
    competency: "career_evidence",
    question: `What career evidence best supports a ${roleTitle || "target"} role?`,
  });
  const best = ranked[0];
  if (!best) return null;
  const receipt = best.receipt;
  const accomplishment = String(receipt.accomplishment || receipt.result || receipt.contribution || "").trim();
  if (!accomplishment) return null;
  return {
    id: `receipt-${receipt.id || "personalized"}`,
    competency: "career_evidence",
    source: "impact-receipt",
    evidenceScore: best.score,
    text: `Your BragStack includes this accomplishment: “${accomplishment}” Walk me through the situation, what you personally owned, and the result that would matter to someone hiring a ${roleTitle || "candidate"}.`,
  };
}

function jobDescriptionQuestion(jobDescription = "", roleTitle = "") {
  const tokens = tokenize(jobDescription);
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  const keywords = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([word]) => word).filter((word) => word.length > 4).slice(0, 3);
  if (!keywords.length) return null;
  return {
    id: "job-description",
    competency: "role_alignment",
    source: "job-description",
    text: `This ${roleTitle || "role"} posting emphasizes ${keywords.join(", ")}. Tell me about a real example that best demonstrates your experience with one or more of those priorities.`,
  };
}

export function buildInterviewPlan({
  roleTitle = "",
  careerArea = "",
  experienceLevel = "experienced",
  interviewType = "mixed",
  questionCount = 8,
  jobDescription = "",
  receipts = [],
} = {}) {
  const role = roleTitle.trim() || "this role";
  const family = inferCareerFamily(role, careerArea);
  const familyConfig = CAREER_FAMILIES[family];
  const desiredCount = Math.max(3, Math.min(15, Number(questionCount) || 8));
  const pool = [];

  const intro = CORE_QUESTIONS.find((question) => question.id === "intro-role");
  if (intro) pool.push({ ...intro, source: "core", text: formatRole(intro.text, role) });

  const personalized = receiptQuestion(receipts, role, jobDescription);
  if (personalized) pool.push(personalized);

  const jdQuestion = jobDescriptionQuestion(jobDescription, role);
  if (jdQuestion) pool.push(jdQuestion);

  if (familyConfig) {
    familyConfig.roleQuestions.forEach((text, index) => pool.push({
      id: `${family}-${index + 1}`,
      competency: familyConfig.competencies[index % familyConfig.competencies.length],
      source: "career-family",
      text: formatRole(text, role),
    }));
  } else {
    pool.push({
      id: "general-role-specific",
      competency: "role_knowledge",
      source: "career-fallback",
      text: `What separates an excellent ${role} from an average one? Give me an example from your own experience that supports your answer.`,
    });
  }

  CORE_QUESTIONS
    .filter((question) => question.id !== "intro-role" && question.types.includes(interviewType))
    .forEach((question) => pool.push({ ...question, source: "core", text: formatRole(question.text, role) }));

  if (experienceLevel === "entry") {
    pool.push({ id: "entry-learning", competency: "learning", source: "level", text: `Tell me about a project, class, volunteer experience, internship, or early-career responsibility that best shows how you would approach a ${role} position.` });
  }
  if (experienceLevel === "senior" || experienceLevel === "leadership") {
    pool.push({ id: "senior-scope", competency: "leadership", source: "level", text: "Tell me about a time the scope of your responsibility grew. How did your decisions change as more people, risk, or business impact depended on you?" });
  }

  const questions = unique(pool).slice(0, desiredCount);
  return {
    roleTitle: role,
    careerArea,
    family,
    experienceLevel,
    interviewType,
    questionCount: questions.length,
    jobDescription,
    questions,
  };
}

function labelFor(score) {
  if (score >= 80) return "Strong";
  if (score >= 55) return "Developing";
  return "Needs detail";
}

function dimension(score, note) {
  return { score, label: labelFor(score), note };
}

function countFillers(answer) {
  const normalized = ` ${normalize(answer)} `;
  return FILLERS.reduce((total, filler) => {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return total + (normalized.match(new RegExp(`\\b${escaped}\\b`, "g")) || []).length;
  }, 0);
}

export function analyzeAnswer(answer = "", {
  question = "",
  competency = "",
  roleTitle = "",
  jobDescription = "",
  durationSeconds = 0,
} = {}) {
  const text = String(answer).trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const firstPerson = /\b(i|i'm|i’ve|i'd|my)\b/i.test(text);
  const contextFound = includesAny(text, CONTEXT_WORDS) || wordCount >= 35;
  const actionFound = firstPerson && includesAny(text, ACTION_WORDS);
  const resultFound = includesAny(text, RESULT_WORDS);
  const quantified = /(?:\$\s?\d|\b\d+(?:\.\d+)?\s?(?:%|percent|hours?|days?|weeks?|months?|years?|people|customers?|patients?|students?|tickets?|cases?|minutes?|seconds?|x\b))/i.test(text);
  const specific = wordCount >= 45 && (actionFound || quantified || /\b(because|so that|which meant|for example)\b/i.test(text));
  const fillerCount = countFillers(text);
  const meaning = scoreMeaningAlignment(text, { question, competency, roleTitle, jobDescription });
  const relevanceScore = wordCount < 10 ? Math.min(meaning.score, 25) : meaning.score;
  const concisionScore = wordCount < 20 ? 35 : wordCount <= 220 ? 90 : wordCount <= 320 ? 70 : 45;
  const structureScore = Math.round(([contextFound, actionFound, resultFound].filter(Boolean).length / 3) * 100);
  const specificityScore = specific ? 90 : wordCount >= 30 ? 60 : 30;
  const impactScore = resultFound ? (quantified ? 100 : 75) : 30;
  const ownershipScore = actionFound ? 95 : firstPerson ? 60 : 30;
  const communicationScore = Math.max(30, Math.min(100, Math.round((concisionScore + specificityScore + (fillerCount <= 2 ? 90 : fillerCount <= 5 ? 70 : 45)) / 3)));
  const wordsPerMinute = durationSeconds > 5 ? Math.round(wordCount / (durationSeconds / 60)) : null;

  const dimensions = {
    relevance: dimension(
      relevanceScore,
      relevanceScore >= 80
        ? `Your evidence strongly supports the ${meaning.competency.replaceAll("_", " ")} competency being tested.`
        : relevanceScore >= 55
          ? `Your example partly supports the ${meaning.competency.replaceAll("_", " ")} competency; make the connection more explicit.`
          : `Show evidence of ${meaning.competency.replaceAll("_", " ")}, not just a generally good story.`,
    ),
    structure: dimension(structureScore, structureScore >= 80 ? "Your answer contains context, action, and result signals." : "Use a clearer situation → action → result arc."),
    ownership: dimension(ownershipScore, actionFound ? "Your personal contribution is clear." : "Clarify what you personally decided or did."),
    specificity: dimension(specificityScore, specific ? "Concrete details make the story believable." : "Add one or two concrete details."),
    impact: dimension(impactScore, resultFound ? (quantified ? "You included a concrete result or scale." : "The result is present; quantify it only if a real number exists.") : "Finish with what changed because of your work."),
    communication: dimension(communicationScore, fillerCount > 5 ? "Your content is useful; reducing filler language can make it sharper." : "Your answer is reasonably focused."),
  };

  let followUp = null;
  let missingDimension = null;
  if (wordCount < 12 || relevanceScore < 55) {
    missingDimension = "relevance";
    followUp = `Give me evidence that specifically demonstrates ${meaning.competency.replaceAll("_", " ")}. What did you do that proves that skill?`;
  } else if (!actionFound) {
    missingDimension = "action";
    followUp = FOLLOW_UPS.action;
  } else if (!resultFound) {
    missingDimension = "result";
    followUp = FOLLOW_UPS.result;
  } else if (!specific) {
    missingDimension = "specificity";
    followUp = FOLLOW_UPS.specificity;
  } else if (!quantified) {
    missingDimension = "quantification";
    followUp = FOLLOW_UPS.quantification;
  }

  const scores = Object.values(dimensions).map((item) => item.score);
  const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  return {
    overallScore,
    overallLabel: labelFor(overallScore),
    dimensions,
    meaning,
    signals: {
      wordCount,
      fillerCount,
      wordsPerMinute,
      contextFound,
      actionFound,
      resultFound,
      quantified,
      competency: meaning.competency,
      conceptCoverage: meaning.conceptCoverage,
      causalEvidence: meaning.causalEvidence,
      concreteExample: meaning.concreteExample,
    },
    missingDimension,
    followUp,
    coaching: followUp || `Strong foundation. Keep the evidence tied to ${meaning.competency.replaceAll("_", " ")} and make the story a little tighter on a second attempt.`,
  };
}

export function summarizeInterview(responses = []) {
  const scored = responses.filter((response) => response?.analysis);
  if (!scored.length) {
    return { overallLabel: "Not enough data", strongestAreas: [], improvementAreas: [], patterns: [], bestAnswerIndex: null, averageWords: 0, totalFillers: 0 };
  }

  const dimensionNames = ["relevance", "structure", "ownership", "specificity", "impact", "communication"];
  const averages = Object.fromEntries(dimensionNames.map((name) => [name, Math.round(scored.reduce((sum, response) => sum + response.analysis.dimensions[name].score, 0) / scored.length)]));
  const ranked = Object.entries(averages).sort((a, b) => b[1] - a[1]);
  const overallScore = Math.round(scored.reduce((sum, response) => sum + response.analysis.overallScore, 0) / scored.length);
  const resultMissing = scored.filter((response) => !response.analysis.signals.resultFound).length;
  const actionMissing = scored.filter((response) => !response.analysis.signals.actionFound).length;
  const quantMissing = scored.filter((response) => response.analysis.signals.resultFound && !response.analysis.signals.quantified).length;
  const weakMeaning = scored.filter((response) => (response.analysis.meaning?.score || 0) < 55).length;
  const patterns = [];
  if (weakMeaning) patterns.push(`${weakMeaning} of ${scored.length} answers were structurally usable but did not strongly prove the competency being tested.`);
  if (resultMissing) patterns.push(`${resultMissing} of ${scored.length} answers would be stronger with a clearer result.`);
  if (actionMissing) patterns.push(`${actionMissing} of ${scored.length} answers did not make your personal action clear enough.`);
  if (quantMissing) patterns.push(`${quantMissing} answers had a result but no concrete scale or metric. Add one only when it is truthful and known.`);
  if (!patterns.length) patterns.push("Your answers consistently showed relevant evidence, personal action, and outcomes.");

  let bestAnswerIndex = 0;
  scored.forEach((response, index) => {
    if (response.analysis.overallScore > scored[bestAnswerIndex].analysis.overallScore) bestAnswerIndex = index;
  });

  const totalWords = scored.reduce((sum, response) => sum + response.analysis.signals.wordCount, 0);
  const totalFillers = scored.reduce((sum, response) => sum + response.analysis.signals.fillerCount, 0);

  return {
    overallScore,
    overallLabel: labelFor(overallScore),
    dimensionAverages: averages,
    strongestAreas: ranked.slice(0, 2).map(([name, score]) => ({ name, score, label: labelFor(score) })),
    improvementAreas: ranked.slice(-2).reverse().map(([name, score]) => ({ name, score, label: labelFor(score) })),
    patterns,
    bestAnswerIndex,
    averageWords: Math.round(totalWords / scored.length),
    totalFillers,
  };
}

export function getBrowserInterviewCapabilities(scope = globalThis) {
  const speechRecognition = Boolean(scope.SpeechRecognition || scope.webkitSpeechRecognition);
  const speechSynthesis = Boolean(scope.speechSynthesis);
  const camera = Boolean(scope.navigator?.mediaDevices?.getUserMedia);
  const webGpu = Boolean(scope.navigator?.gpu);
  return { speechRecognition, speechSynthesis, camera, webGpu, localModelEligible: webGpu };
}
