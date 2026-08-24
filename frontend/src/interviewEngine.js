import { CAREER_FAMILIES, CORE_QUESTIONS } from "./interviewKnowledgeBase.js";
import { rankImpactReceipts, scoreMeaningAlignment } from "./careerIntelligence.js";

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "for", "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or", "that", "the", "this", "to", "was", "we", "were", "what", "when", "with", "you", "your"]);
const ACTION_WORDS = ["built", "created", "changed", "fixed", "implemented", "led", "owned", "organized", "resolved", "designed", "diagnosed", "improved", "coordinated", "introduced", "negotiated", "trained", "taught", "analyzed", "decided", "prioritized", "communicated", "facilitated", "proposed", "tested", "reviewed"];
const RESULT_WORDS = ["result", "resulted", "reduced", "increased", "improved", "saved", "grew", "prevented", "resolved", "completed", "delivered", "achieved", "recovered", "shortened", "faster", "higher", "lower", "afterward", "ultimately", "outcome", "launched"];
const CONTEXT_WORDS = ["when", "during", "while", "project", "shift", "customer", "client", "patient", "student", "team", "deadline", "incident", "case", "campaign", "quarter", "role"];
const FILLERS = ["um", "uh", "erm", "you know", "kind of", "sort of", "basically", "literally", "i mean"];

// Practice-mode professional-language guard. The user explicitly asked for these to be treated as interview-ending red flags.
const INTERVIEW_FAIL_TERMS = [
  { term: "drugs", pattern: /\bdrugs?\b/i, reason: "Drug-related language is inappropriate in a standard professional interview answer unless the role/question specifically requires clinical, legal, or policy terminology." },
  { term: "fuck", pattern: /\bfuck(?:ing|ed|er|ers)?\b/i, reason: "Profanity can immediately damage professional credibility in an interview." },
  { term: "shit", pattern: /\bshit(?:ty)?\b/i, reason: "Profanity can immediately damage professional credibility in an interview." },
  { term: "bitch", pattern: /\bbitch(?:es|ing)?\b/i, reason: "Insulting or profane language is not appropriate for an interview." },
  { term: "asshole", pattern: /\bassholes?\b/i, reason: "Insulting language is not appropriate for an interview." },
  { term: "damn", pattern: /\bdamn(?:ed)?\b/i, reason: "Strong casual language can read as unprofessional in a formal interview." },
];

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

function professionalLanguageWarning(text) {
  const matches = INTERVIEW_FAIL_TERMS.filter(({ pattern }) => pattern.test(text));
  if (!matches.length) return null;
  return {
    triggered: true,
    instantFail: true,
    terms: matches.map(({ term }) => term),
    title: "‼️ Interview failed: professional-language warning",
    message: matches[0].reason,
    coaching: "In a real interview, replace emotional, profane, illegal-drug, or insulting wording with neutral professional language. Describe the situation factually and keep the focus on your judgment, actions, and results.",
  };
}

export function inferCareerFamily(roleTitle = "", careerArea = "") {
  const haystack = ` ${normalize(`${roleTitle} ${careerArea}`)} `;
  let bestFamily = "general";
  let bestScore = 0;
  for (const [family, config] of Object.entries(CAREER_FAMILIES)) {
    const score = config.keywords.reduce((total, keyword) => total + (haystack.includes(normalize(keyword)) ? 1 : 0), 0);
    if (score > bestScore) { bestFamily = family; bestScore = score; }
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

export function buildInterviewPlan({ roleTitle = "", careerArea = "", experienceLevel = "experienced", interviewType = "mixed", questionCount = 8, jobDescription = "", receipts = [] } = {}) {
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
    familyConfig.roleQuestions.forEach((text, index) => pool.push({ id: `${family}-${index + 1}`, competency: familyConfig.competencies[index % familyConfig.competencies.length], source: "career-family", text: formatRole(text, role) }));
  } else {
    pool.push({ id: "general-role-specific", competency: "role_knowledge", source: "career-fallback", text: `What separates an excellent ${role} from an average one? Give me an example from your own experience that supports your answer.` });
  }
  CORE_QUESTIONS.filter((question) => question.id !== "intro-role" && question.types.includes(interviewType)).forEach((question) => pool.push({ ...question, source: "core", text: formatRole(question.text, role) }));
  if (experienceLevel === "entry") pool.push({ id: "entry-learning", competency: "learning", source: "level", text: `Tell me about a project, class, volunteer experience, internship, or early-career responsibility that best shows how you would approach a ${role} position.` });
  if (experienceLevel === "senior" || experienceLevel === "leadership") pool.push({ id: "senior-scope", competency: "leadership", source: "level", text: "Tell me about a time the scope of your responsibility grew. How did your decisions change as more people, risk, or business impact depended on you?" });
  const questions = unique(pool).slice(0, desiredCount);
  return { roleTitle: role, careerArea, family, experienceLevel, interviewType, questionCount: questions.length, jobDescription, questions };
}

function labelFor(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Developing";
  return "Needs detail";
}

function dimension(score, note, improve) {
  return { score, label: labelFor(score), note, improve };
}

function countFillers(answer) {
  const normalized = ` ${normalize(answer)} `;
  return FILLERS.reduce((total, filler) => {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return total + (normalized.match(new RegExp(`\\b${escaped}\\b`, "g")) || []).length;
  }, 0);
}

function buildFollowUp({ missingDimension, competency, question }) {
  const skill = String(competency || "the skill being tested").replaceAll("_", " ");
  const compactQuestion = String(question || "").replace(/\s+/g, " ").trim();
  if (missingDimension === "relevance") return `Stay on the specific skill: ${skill}. Name one decision or action you personally took that proves it, and explain why that action mattered.`;
  if (missingDimension === "action") return "Zoom in on your contribution only: what was the single most important thing YOU decided, changed, built, diagnosed, or communicated?";
  if (missingDimension === "result") return "Skip the setup this time. What changed after your action—what was better, faster, safer, clearer, cheaper, or less risky?";
  if (missingDimension === "specificity") return "Give me one concrete moment from that story: what exactly did you do, who or what did it affect, and what detail makes the example believable?";
  if (missingDimension === "quantification") return "Without inventing a number, can you add real scale—time saved, volume handled, people affected, frequency, before/after change, or another concrete measure?";
  return compactQuestion ? `One level deeper: what is the strongest piece of evidence in your answer that directly answers “${compactQuestion}”?` : null;
}

function actionableFeedback({ meaning, wordCount, contextFound, actionFound, resultFound, quantified, specific, fillerCount }) {
  const strengths = [];
  const improvements = [];
  if (contextFound) strengths.push("You gave enough context to understand the situation."); else improvements.push("Open with one sentence of context: what was happening and why it mattered.");
  if (actionFound) strengths.push("Your personal ownership is visible."); else improvements.push("Use “I” and name the exact decision/action you personally owned.");
  if (resultFound) strengths.push("You included an outcome."); else improvements.push("End with the outcome: what changed because of your work.");
  if (quantified) strengths.push("You used concrete scale or a metric."); else improvements.push("Add truthful scale if you know it: %, time, volume, frequency, people, tickets, cost, or before/after change.");
  if (specific) strengths.push("The story has credible concrete detail."); else improvements.push("Replace general phrases with one or two concrete details from the real event.");
  if ((meaning?.score || 0) < 55) improvements.unshift(`Tie the story directly to ${String(meaning?.competency || "the competency").replaceAll("_", " ")}; a polished story that proves the wrong skill will still score poorly.`);
  if (wordCount < 20) improvements.push("Your answer is too short to show enough evidence. Aim for a compact STAR answer rather than a one-line response.");
  if (fillerCount > 5) improvements.push("Reduce filler phrases so the strongest evidence is easier to hear.");
  if (!strengths.length) strengths.push("You answered the question instead of leaving it blank—that gives us something specific to improve.");
  return { strengths: strengths.slice(0, 3), improvements: improvements.slice(0, 5) };
}

export function analyzeAnswer(answer = "", { question = "", competency = "", roleTitle = "", jobDescription = "", durationSeconds = 0 } = {}) {
  const text = String(answer).trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const warning = professionalLanguageWarning(text);
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

  let dimensions = {
    relevance: dimension(relevanceScore, relevanceScore >= 80 ? `Your evidence directly supports ${meaning.competency.replaceAll("_", " ")}.` : relevanceScore >= 55 ? `Your example partly supports ${meaning.competency.replaceAll("_", " ")}, but the connection needs to be explicit.` : `This answer does not yet prove ${meaning.competency.replaceAll("_", " ")}.`, `State the exact behavior or decision that demonstrates ${meaning.competency.replaceAll("_", " ")}.`),
    structure: dimension(structureScore, structureScore >= 80 ? "The answer has a clear situation → action → result arc." : "One or more STAR pieces are missing.", "Use one sentence for the situation, most of the answer on your action, and finish with the result."),
    ownership: dimension(ownershipScore, actionFound ? "Your personal contribution is clear." : firstPerson ? "You speak in first person, but the actual action is vague." : "It is unclear what you personally owned.", "Name the exact thing you decided, built, changed, diagnosed, communicated, or led."),
    specificity: dimension(specificityScore, specific ? "Concrete details make the story credible." : "The answer relies on broad statements instead of evidence.", "Add one or two real details: what system/process, what constraint, what decision, or who was affected."),
    impact: dimension(impactScore, resultFound ? (quantified ? "The result includes concrete scale." : "You gave an outcome, but not much scale.") : "The answer stops before showing what changed.", resultFound ? "Add truthful scale if you know it; do not invent a metric." : "Finish with the business, customer, team, quality, time, risk, or cost outcome."),
    communication: dimension(communicationScore, fillerCount > 5 ? `Your answer included ${fillerCount} filler phrases, which weakens delivery.` : wordCount < 20 ? "The answer is too short to demonstrate enough evidence." : "Your delivery is reasonably focused.", fillerCount > 5 ? "Pause instead of filling silence, then deliver the next evidence point." : "Keep the answer focused around the evidence that proves the competency."),
  };

  let missingDimension = null;
  if (wordCount < 12 || relevanceScore < 55) missingDimension = "relevance";
  else if (!actionFound) missingDimension = "action";
  else if (!resultFound) missingDimension = "result";
  else if (!specific) missingDimension = "specificity";
  else if (!quantified) missingDimension = "quantification";
  const followUp = warning ? null : buildFollowUp({ missingDimension, competency: meaning.competency, question });
  const scores = Object.values(dimensions).map((item) => item.score);
  let overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  if (warning?.instantFail) {
    overallScore = 0;
    dimensions = Object.fromEntries(Object.entries(dimensions).map(([name, value]) => [name, { ...value, score: 0, label: "Critical" }]));
  }
  const detailed = actionableFeedback({ meaning, wordCount, contextFound, actionFound, resultFound, quantified, specific, fillerCount });
  return {
    overallScore,
    overallLabel: warning ? "Interview failed" : labelFor(overallScore),
    dimensions,
    meaning,
    warning,
    instantFail: Boolean(warning?.instantFail),
    signals: { wordCount, fillerCount, wordsPerMinute, contextFound, actionFound, resultFound, quantified, competency: meaning.competency, conceptCoverage: meaning.conceptCoverage, causalEvidence: meaning.causalEvidence, concreteExample: meaning.concreteExample },
    missingDimension,
    followUp,
    strengths: detailed.strengths,
    improvements: detailed.improvements,
    coaching: warning?.coaching || detailed.improvements[0] || `Keep the evidence tied to ${meaning.competency.replaceAll("_", " ")}.`,
  };
}

function starRating(score) {
  if (score >= 90) return 5;
  if (score >= 78) return 4;
  if (score >= 65) return 3;
  if (score >= 50) return 2;
  return 1;
}

export function summarizeInterview(responses = []) {
  const scored = responses.filter((response) => response?.analysis);
  if (!scored.length) return { overallScore: 0, overallLabel: "Not enough data", stars: 0, strongestAreas: [], improvementAreas: [], patterns: [], recommendations: ["Complete at least one answer to receive interview feedback."], bestAnswerIndex: null, averageWords: 0, totalFillers: 0, failed: false, warnings: [] };
  const warnings = scored.filter((response) => response.analysis.warning).map((response) => response.analysis.warning);
  const failed = warnings.some((warning) => warning.instantFail);
  const dimensionNames = ["relevance", "structure", "ownership", "specificity", "impact", "communication"];
  const averages = Object.fromEntries(dimensionNames.map((name) => [name, Math.round(scored.reduce((sum, response) => sum + response.analysis.dimensions[name].score, 0) / scored.length)]));
  const ranked = Object.entries(averages).sort((a, b) => b[1] - a[1]);
  let overallScore = Math.round(scored.reduce((sum, response) => sum + response.analysis.overallScore, 0) / scored.length);
  if (failed) overallScore = 0;
  const resultMissing = scored.filter((response) => !response.analysis.signals.resultFound).length;
  const actionMissing = scored.filter((response) => !response.analysis.signals.actionFound).length;
  const quantMissing = scored.filter((response) => response.analysis.signals.resultFound && !response.analysis.signals.quantified).length;
  const weakMeaning = scored.filter((response) => (response.analysis.meaning?.score || 0) < 55).length;
  const patterns = [];
  if (failed) patterns.push("A professional-language red flag caused an instant practice-interview fail. Fix that first before judging the rest of the session.");
  if (weakMeaning) patterns.push(`${weakMeaning} of ${scored.length} answers did not strongly prove the competency being tested.`);
  if (resultMissing) patterns.push(`${resultMissing} of ${scored.length} answers did not clearly state what changed as a result of your work.`);
  if (actionMissing) patterns.push(`${actionMissing} of ${scored.length} answers did not make your personal action specific enough.`);
  if (quantMissing) patterns.push(`${quantMissing} answer${quantMissing === 1 ? "" : "s"} had an outcome but no concrete scale. Add scale only when it is truthful and known.`);
  if (!patterns.length) patterns.push("Your answers consistently showed relevant evidence, personal ownership, and outcomes.");
  let bestAnswerIndex = 0;
  scored.forEach((response, index) => { if (response.analysis.overallScore > scored[bestAnswerIndex].analysis.overallScore) bestAnswerIndex = index; });
  const totalWords = scored.reduce((sum, response) => sum + response.analysis.signals.wordCount, 0);
  const totalFillers = scored.reduce((sum, response) => sum + response.analysis.signals.fillerCount, 0);
  const recommendations = ranked.slice(-3).reverse().map(([name, score]) => {
    const label = name.replaceAll("_", " ");
    if (name === "relevance") return `Relevance (${score}/100): answer the exact competency being tested, not just with a generally good story.`;
    if (name === "structure") return `Structure (${score}/100): make the STAR arc obvious—situation, your action, then result.`;
    if (name === "ownership") return `Ownership (${score}/100): say exactly what you personally decided or did.`;
    if (name === "specificity") return `Specificity (${score}/100): add one or two concrete details that make the example believable.`;
    if (name === "impact") return `Impact (${score}/100): finish with what changed and add truthful scale when available.`;
    return `${label} (${score}/100): tighten wording and reduce filler so your strongest evidence is easier to hear.`;
  });
  return {
    overallScore,
    overallLabel: failed ? "Interview failed" : labelFor(overallScore),
    stars: failed ? 1 : starRating(overallScore),
    failed,
    warnings,
    verdict: failed ? "Interview failed because of a critical professional-language red flag." : overallScore >= 80 ? "Interview-ready with a few refinements." : overallScore >= 65 ? "Promising, but several answers need sharper evidence." : "Not interview-ready yet; focus on the specific coaching below before another attempt.",
    dimensionAverages: averages,
    strongestAreas: ranked.slice(0, 2).map(([name, score]) => ({ name, score, label: labelFor(score) })),
    improvementAreas: ranked.slice(-2).reverse().map(([name, score]) => ({ name, score, label: labelFor(score) })),
    patterns,
    recommendations,
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
