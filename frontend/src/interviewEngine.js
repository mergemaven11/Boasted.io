import { CAREER_FAMILIES, CORE_QUESTIONS } from "./interviewKnowledgeBase.js";
import { rankImpactReceipts, scoreMeaningAlignment } from "./careerIntelligence.js";

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "for", "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or", "that", "the", "this", "to", "was", "we", "were", "what", "when", "with", "you", "your"]);
const JOB_DESCRIPTION_NOISE = new Set(["ability", "about", "across", "also", "applicant", "candidate", "company", "demonstrated", "environment", "excellent", "experience", "experienced", "including", "knowledge", "looking", "preferred", "qualified", "requirements", "required", "responsibilities", "responsibility", "role", "skills", "strong", "team", "teams", "using", "work", "working", "years"]);
const ACTION_WORDS = ["analyzed", "automated", "built", "changed", "checked", "chose", "coached", "coded", "collaborated", "communicated", "configured", "coordinated", "created", "decided", "deployed", "designed", "diagnosed", "documented", "escalated", "facilitated", "fixed", "found", "implemented", "improved", "inspected", "introduced", "investigated", "isolated", "led", "looked", "mentored", "migrated", "monitored", "negotiated", "optimized", "organized", "owned", "patched", "partnered", "presented", "prioritized", "proposed", "ran", "recommended", "refactored", "repaired", "reproduced", "resolved", "reviewed", "selected", "tested", "traced", "trained", "taught", "updated", "validated", "verified", "wrote"];
const RESULT_WORDS = ["achieved", "afterward", "allowed", "approved", "avoided", "completed", "delivered", "eliminated", "enabled", "faster", "grew", "helped", "higher", "improved", "increased", "launched", "lower", "met", "outcome", "prevented", "recovered", "reduced", "resolved", "restored", "result", "resulted", "saved", "shortened", "stabilized", "successful", "ultimately"];
const CONTEXT_WORDS = ["bug", "campaign", "case", "challenge", "client", "customer", "deadline", "during", "error", "failure", "incident", "issue", "outage", "patient", "problem", "project", "quarter", "request", "role", "shift", "student", "team", "when", "while"];
const FILLERS = ["um", "uh", "erm", "you know", "kind of", "sort of", "basically", "literally", "i mean"];
const RECEIPT_ROTATION_KEY = "bragstack_interview_receipt_rotation_v1";

const INTERVIEW_LANGUAGE_TERMS = [
  { term: "fuck", pattern: /\bfuck(?:ing|ed|er|ers)?\b/i, reason: "Profanity can distract from an otherwise strong interview answer." },
  { term: "shit", pattern: /\bshit(?:ty)?\b/i, reason: "Profanity can distract from an otherwise strong interview answer." },
  { term: "bitch", pattern: /\bbitch(?:es|ing)?\b/i, reason: "Insulting or profane wording can undermine a professional answer." },
  { term: "asshole", pattern: /\bassholes?\b/i, reason: "Insulting wording can undermine a professional answer." },
  { term: "damn", pattern: /\bdamn(?:ed)?\b/i, reason: "Strong casual wording may be worth replacing in a formal interview." },
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

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
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
  const matches = INTERVIEW_LANGUAGE_TERMS.filter(({ pattern }) => pattern.test(text));
  if (!matches.length) return null;
  return {
    triggered: true,
    instantFail: false,
    severity: "coaching",
    terms: matches.map(({ term }) => term),
    title: "Professional-language coaching note",
    message: matches[0].reason,
    coaching: "Keep going. In a real interview, replace profanity or insulting wording with neutral professional language and keep the focus on your judgment, actions, and results.",
  };
}

function canonicalRolePhrase(value = "") {
  return normalize(value).replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function careerKeywordScore(haystack, keyword) {
  const phrase = canonicalRolePhrase(keyword);
  if (!phrase || !` ${haystack} `.includes(` ${phrase} `)) return 0;
  const wordCount = phrase.split(" ").filter(Boolean).length;
  // Exact multi-word occupation phrases should outrank generic single-word
  // overlaps, while short aliases such as RN/CTO only match as whole tokens.
  return wordCount * 100 + phrase.length;
}

export function inferCareerFamily(roleTitle = "", careerArea = "") {
  const haystack = canonicalRolePhrase(`${roleTitle} ${careerArea}`);
  let bestFamily = "general";
  let bestScore = 0;
  for (const [family, config] of Object.entries(CAREER_FAMILIES)) {
    const score = config.keywords.reduce((total, keyword) => total + careerKeywordScore(haystack, keyword), 0);
    if (score > bestScore) { bestFamily = family; bestScore = score; }
  }
  return bestFamily;
}

function safeReceiptRotationState() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(RECEIPT_ROTATION_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function rememberReceiptQuestion(roleTitle, questionId) {
  try {
    if (!globalThis.localStorage || !questionId) return;
    const state = safeReceiptRotationState();
    const roleKey = normalize(roleTitle) || "general";
    const recent = Array.isArray(state[roleKey]) ? state[roleKey] : [];
    state[roleKey] = [questionId, ...recent.filter((id) => id !== questionId)].slice(0, 4);
    globalThis.localStorage.setItem(RECEIPT_ROTATION_KEY, JSON.stringify(state));
  } catch {
    // Receipt rotation should never block interview planning.
  }
}

function receiptQuestion(receipts = [], roleTitle = "", jobDescription = "") {
  const ranked = rankImpactReceipts(receipts, {
    roleTitle,
    jobDescription,
    competency: "career_evidence",
    question: `What career evidence best supports a ${roleTitle || "target"} role?`,
  });
  if (!ranked.length) return null;

  const roleKey = normalize(roleTitle) || "general";
  const recent = Array.isArray(safeReceiptRotationState()[roleKey]) ? safeReceiptRotationState()[roleKey] : [];
  const candidates = ranked.map((item) => ({ ...item, questionId: `receipt-${item.receipt?.id || normalize(item.receipt?.accomplishment || item.receipt?.result || "personalized")}` }));
  const best = candidates.find((item) => !recent.includes(item.questionId)) || candidates[0];
  if (!best) return null;

  const receipt = best.receipt;
  const accomplishment = String(receipt.accomplishment || receipt.result || receipt.contribution || "").trim();
  if (!accomplishment) return null;
  rememberReceiptQuestion(roleTitle, best.questionId);
  return {
    id: best.questionId,
    competency: "career_evidence",
    source: "impact-receipt",
    evidenceScore: best.score,
    text: `Your BragStack includes this accomplishment: “${accomplishment}” Walk me through the part of that example that is most relevant to this ${roleTitle || "role"}: what you personally owned, the hardest decision or technical challenge, and the result that mattered.`,
  };
}

function jobDescriptionKeywords(value = "") {
  const counts = new Map();
  for (const token of tokenize(value)) {
    if (JOB_DESCRIPTION_NOISE.has(token) || /^\d+$/.test(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]))
    .map(([word]) => word);
}

function jobDescriptionPriorityGroups(jobDescription = "", maxGroups = 4) {
  const raw = String(jobDescription || "").trim();
  if (!raw) return [];
  const segments = raw
    .split(/\n+|(?<=[.!?])\s+/)
    .map((segment) => segment.replace(/^[\s•*\-–—]+/, "").replace(/\s+/g, " ").trim())
    .filter((segment) => segment.length >= 18);

  const signal = /\b(build|design|develop|implement|maintain|operate|deploy|debug|troubleshoot|support|architect|lead|manage|own|deliver|secure|scale|optimize|automate|test|review|integrate|monitor|cloud|api|database|container|customer|linux|python|java|javascript|typescript|react|node|docker|kubernetes|aws|azure|gcp|sql)\w*\b/gi;
  const groups = segments
    .map((segment, index) => {
      const keywords = jobDescriptionKeywords(segment).slice(0, 4);
      const signalCount = (segment.match(signal) || []).length;
      return { index, keywords, score: keywords.length + signalCount * 2 };
    })
    .filter((item) => item.keywords.length >= 2)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const uniqueGroups = [];
  const used = new Set();
  for (const group of groups) {
    const key = group.keywords.slice(0, 3).join("|");
    if (!key || used.has(key)) continue;
    used.add(key);
    uniqueGroups.push(group.keywords.slice(0, 3));
    if (uniqueGroups.length >= maxGroups) break;
  }

  if (uniqueGroups.length < maxGroups) {
    const globalKeywords = jobDescriptionKeywords(raw).slice(0, maxGroups * 3);
    for (let index = 0; index < globalKeywords.length && uniqueGroups.length < maxGroups; index += 3) {
      const group = globalKeywords.slice(index, index + 3);
      const key = group.join("|");
      if (group.length >= 2 && !used.has(key)) {
        used.add(key);
        uniqueGroups.push(group);
      }
    }
  }
  return uniqueGroups;
}

function jobDescriptionQuestions(jobDescription = "", roleTitle = "", count = 3) {
  const groups = jobDescriptionPriorityGroups(jobDescription, count);
  const variants = [
    (role, priorities) => `The ${role} job description emphasizes ${priorities}. Tell me about a specific project where you used those skills together. What did you personally build, change, diagnose, or deliver, and what was the result?`,
    (role, priorities) => `For this ${role} role, the posting calls out ${priorities}. Walk me through the hardest real example from your background that proves you can handle that part of the job.`,
    (role, priorities) => `Imagine I am evaluating you specifically against ${priorities} for this ${role} position. Which accomplishment best proves your depth there, and what tradeoff or decision did you personally own?`,
    (role, priorities) => `This ${role} posting repeatedly points to ${priorities}. Give me an example that shows how you applied those priorities in practice and how you knew your approach worked.`,
  ];
  return groups.map((keywords, index) => ({
    id: `job-description-${index + 1}`,
    competency: "role_alignment",
    source: "job-description",
    jobKeywords: keywords,
    text: variants[index % variants.length](roleTitle || "role", keywords.join(", ")),
  }));
}

export function buildInterviewPlan({ roleTitle = "", careerArea = "", experienceLevel = "experienced", interviewType = "mixed", questionCount = 8, jobDescription = "", receipts = [] } = {}) {
  const role = roleTitle.trim() || "this role";
  const family = inferCareerFamily(role, careerArea);
  const familyConfig = CAREER_FAMILIES[family];
  const desiredCount = Math.max(3, Math.min(15, Number(questionCount) || 8));
  const pool = [];
  const intro = CORE_QUESTIONS.find((question) => question.id === "intro-role");
  if (intro) pool.push({ ...intro, source: "core", text: formatRole(intro.text, role) });

  const jdQuestionCount = jobDescription.trim() ? Math.min(4, Math.max(2, Math.ceil(desiredCount / 2))) : 0;
  pool.push(...jobDescriptionQuestions(jobDescription, role, jdQuestionCount));

  const personalized = receiptQuestion(receipts, role, jobDescription);
  if (personalized) pool.push(personalized);

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
  const normalizedScore = clampScore(score);
  return { score: normalizedScore, label: labelFor(normalizedScore), note, improve };
}

function countFillers(answer) {
  const normalized = ` ${normalize(answer)} `;
  return FILLERS.reduce((total, filler) => {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return total + (normalized.match(new RegExp(`\\b${escaped}\\b`, "g")) || []).length;
  }, 0);
}

function contextSignal(text) {
  return includesAny(text, CONTEXT_WORDS)
    || /\b(?:at|for)\s+(?:work|my|the|a|an)\b/i.test(text)
    || /\b(?:last|previous|recent)\s+(?:year|month|quarter|week|role|job|project)\b/i.test(text);
}

function personalActionSignal(text, firstPerson) {
  if (!firstPerson) return false;
  if (includesAny(text, ACTION_WORDS)) return true;
  return /\b(?:i|i'm|i’ve|i'd)\s+(?:looked|checked|reviewed|inspected|found|identified|traced|reproduced|ran|patched|coded|debugged|tested|fixed|changed|implemented|built|created)\b/i.test(text);
}

function resultSignal(text) {
  if (includesAny(text, RESULT_WORDS)) return true;
  return /\bpass(?:ed)?\s+(?:all\s+)?(?:the\s+)?(?:tests?|checks?|builds?|validation)\b/i.test(text)
    || /\b(?:tests?|checks?|builds?|validation)\s+(?:all\s+)?pass(?:ed)?\b/i.test(text)
    || /\b(?:worked out|worked as expected|came back up|stayed stable|no longer (?:failed|failing|errored|broke|broken))\b/i.test(text);
}

function scoreRelevance(meaning, wordCount) {
  let score = clampScore(meaning?.score || 0);
  if (wordCount < 8) score = Math.min(score, 12);
  else if (wordCount < 20) score = Math.min(score, 35);
  if (meaning?.genericOnly) score = Math.min(score, 25);
  if (!meaning?.concreteExample && wordCount < 35) score = Math.min(score, 54);
  return clampScore(score);
}

function scoreStructure({ contextFound, actionFound, resultFound, causalEvidence, wordCount }) {
  const starCount = [contextFound, actionFound, resultFound].filter(Boolean).length;
  let score = [0, 25, 50, 80][starCount] || 0;
  if (starCount === 3 && causalEvidence) score += 10;
  if (starCount === 3 && wordCount >= 45) score += 10;
  return clampScore(score);
}

function scoreOwnership({ actionFound, firstPerson, specific, concreteExample, resultFound, relevanceScore, quantified }) {
  if (!actionFound) return firstPerson ? 15 : 5;
  let score = 55;
  if (specific) score += 10;
  if (concreteExample) score += 10;
  if (resultFound) score += 10;
  if (relevanceScore >= 55) score += 10;
  if (quantified) score += 5;
  return clampScore(score);
}

function scoreSpecificity({ wordCount, actionFound, concreteExample, causalEvidence, quantified }) {
  let score = 5;
  if (wordCount >= 20) score += 15;
  if (wordCount >= 35) score += 10;
  if (wordCount >= 50) score += 10;
  if (actionFound) score += 15;
  if (concreteExample) score += 15;
  if (causalEvidence) score += 15;
  if (quantified) score += 15;
  return clampScore(score);
}

function scoreImpact({ resultFound, causalEvidence, quantified, specific, relevanceScore }) {
  if (!resultFound) return 5;
  let score = 55;
  if (causalEvidence) score += 15;
  if (quantified) score += 10;
  if (specific) score += 10;
  if (relevanceScore >= 55) score += 10;
  return clampScore(score);
}

function scoreCommunication({ wordCount, fillerCount, relevanceScore, structureScore, specificityScore, ownershipScore, impactScore, actionFound, resultFound }) {
  let score = Math.round(
    relevanceScore * 0.25
    + structureScore * 0.25
    + specificityScore * 0.20
    + ownershipScore * 0.15
    + impactScore * 0.15,
  );
  if (wordCount >= 20 && wordCount <= 220) score += 5;
  if (fillerCount > 5) score -= 18;
  else if (fillerCount > 2) score -= 8;
  if (wordCount < 8) score = Math.min(score, 20);
  else if (wordCount < 20) score = Math.min(score, 40);
  if (relevanceScore < 55) score = Math.min(score, 54);
  if (structureScore < 55) score = Math.min(score, 54);
  if (!actionFound || !resultFound) score = Math.min(score, 54);
  return clampScore(score);
}

function applyAnswerEvidenceGate(score, { wordCount, relevanceScore, actionFound, resultFound }) {
  let gated = clampScore(score);
  const criticalGaps = [relevanceScore < 55, !actionFound, !resultFound].filter(Boolean).length;
  if (wordCount < 8) gated = Math.min(gated, 20);
  else if (wordCount < 12) gated = Math.min(gated, 25);
  if (criticalGaps >= 3) gated = Math.min(gated, 30);
  else if (criticalGaps === 2) gated = Math.min(gated, 45);
  else if (criticalGaps === 1) gated = Math.min(gated, 60);
  return clampScore(gated);
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
  if (!strengths.length) strengths.push("You attempted the question; now make the evidence concrete enough to evaluate.");
  return { strengths: strengths.slice(0, 3), improvements: improvements.slice(0, 5) };
}

export function analyzeAnswer(answer = "", { question = "", competency = "", roleTitle = "", jobDescription = "", durationSeconds = 0 } = {}) {
  const text = String(answer).trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const warning = professionalLanguageWarning(text);
  const firstPerson = /\b(i|i'm|i’ve|i'd|my)\b/i.test(text);
  const contextFound = contextSignal(text);
  const actionFound = personalActionSignal(text, firstPerson);
  const resultFound = resultSignal(text);
  const quantified = /(?:\$\s?\d|\b\d+(?:\.\d+)?\s?(?:%|percent|hours?|days?|weeks?|months?|years?|people|customers?|patients?|students?|tickets?|cases?|minutes?|seconds?|x\b))/i.test(text);
  const meaning = scoreMeaningAlignment(text, { question, competency, roleTitle, jobDescription });
  const causalEvidence = Boolean(meaning?.causalEvidence) || /\b(?:because|so that|which meant|therefore|as a result|resulted in|led to|enabled|allowed)\b/i.test(text);
  const specific = wordCount >= 35 && (actionFound || quantified || causalEvidence || Boolean(meaning?.concreteExample));
  const fillerCount = countFillers(text);

  const relevanceScore = scoreRelevance(meaning, wordCount);
  const structureScore = scoreStructure({ contextFound, actionFound, resultFound, causalEvidence, wordCount });
  const ownershipScore = scoreOwnership({ actionFound, firstPerson, specific, concreteExample: Boolean(meaning?.concreteExample), resultFound, relevanceScore, quantified });
  const specificityScore = scoreSpecificity({ wordCount, actionFound, concreteExample: Boolean(meaning?.concreteExample), causalEvidence, quantified });
  const impactScore = scoreImpact({ resultFound, causalEvidence, quantified, specific, relevanceScore });
  const communicationScore = scoreCommunication({ wordCount, fillerCount, relevanceScore, structureScore, specificityScore, ownershipScore, impactScore, actionFound, resultFound });
  const wordsPerMinute = durationSeconds > 5 ? Math.round(wordCount / (durationSeconds / 60)) : null;

  const dimensions = {
    relevance: dimension(relevanceScore, relevanceScore >= 80 ? `Your evidence directly supports ${meaning.competency.replaceAll("_", " ")}.` : relevanceScore >= 55 ? `Your example provides relevant evidence for ${meaning.competency.replaceAll("_", " ")}; make the connection to the exact requirement more explicit.` : `This answer does not yet prove ${meaning.competency.replaceAll("_", " ")}.`, `State the exact behavior or decision that demonstrates ${meaning.competency.replaceAll("_", " ")}.`),
    structure: dimension(structureScore, structureScore >= 80 ? "The answer has a clear situation → action → result arc." : "One or more STAR pieces are missing or too vague to score strongly.", "Use one sentence for the situation, most of the answer on your action, and finish with the result."),
    ownership: dimension(ownershipScore, actionFound ? (ownershipScore >= 70 ? "Your personal contribution is clear and supported by evidence." : "A personal action is present, but it needs clearer ownership and evidence.") : firstPerson ? "You speak in first person, but the actual action is vague." : "It is unclear what you personally owned.", "Name the exact thing you decided, built, changed, diagnosed, communicated, or led."),
    specificity: dimension(specificityScore, specificityScore >= 70 ? "Concrete details make the story credible." : "The answer relies on broad statements instead of enough evidence.", "Add one or two real details: what system/process, what constraint, what decision, or who was affected."),
    impact: dimension(impactScore, resultFound ? (impactScore >= 70 ? "The answer shows what changed because of your work." : "You mention an outcome, but the causal impact is still weak or broad.") : "The answer stops before showing what changed.", resultFound ? "Make the result explicitly follow from your action and add truthful scale when known." : "Finish with the business, customer, team, quality, time, risk, or cost outcome."),
    communication: dimension(warning ? Math.min(communicationScore, 70) : communicationScore, warning ? warning.message : communicationScore >= 70 ? "The answer is direct, organized, and supported by enough evidence." : wordCount < 20 ? "The answer is too short to communicate enough interview-grade evidence." : "The answer may be readable, but it is not yet organized around enough relevant evidence.", warning ? warning.coaching : fillerCount > 5 ? "Pause instead of filling silence, then deliver the next evidence point." : "Keep the answer focused on the exact competency, your action, and the result."),
  };

  let missingDimension = null;
  if (wordCount < 12 || relevanceScore < 55) missingDimension = "relevance";
  else if (!actionFound) missingDimension = "action";
  else if (!resultFound) missingDimension = "result";
  else if (!specific) missingDimension = "specificity";
  else if (!quantified) missingDimension = "quantification";
  const followUp = buildFollowUp({ missingDimension, competency: meaning.competency, question });

  const scores = Object.values(dimensions).map((item) => item.score);
  let overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  overallScore = applyAnswerEvidenceGate(overallScore, { wordCount, relevanceScore, actionFound, resultFound });

  const detailed = actionableFeedback({ meaning, wordCount, contextFound, actionFound, resultFound, quantified, specific, fillerCount });
  if (warning && !detailed.improvements.includes(warning.coaching)) detailed.improvements.unshift(warning.coaching);
  return {
    overallScore,
    overallLabel: labelFor(overallScore),
    dimensions,
    meaning,
    warning,
    instantFail: false,
    signals: { wordCount, fillerCount, wordsPerMinute, contextFound, actionFound, resultFound, quantified, competency: meaning.competency, conceptCoverage: meaning.conceptCoverage, behavioralEvidenceCoverage: meaning.behavioralEvidenceCoverage, causalEvidence, concreteExample: meaning.concreteExample },
    missingDimension,
    followUp,
    strengths: detailed.strengths,
    improvements: detailed.improvements.slice(0, 5),
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

function sessionVerdict(overallScore, failed) {
  if (failed) return "Interview stopped because of a critical safety issue.";
  if (overallScore >= 80) return "Interview-ready with a few refinements.";
  if (overallScore >= 65) return "Promising, but several answers still need sharper evidence.";
  if (overallScore >= 50) return "Not interview-ready yet; too many answers need stronger evidence, ownership, or results.";
  return "Below BragStack’s interview-ready bar: the answers did not consistently provide enough relevant, structured evidence.";
}

export function summarizeInterview(responses = []) {
  const scored = responses.filter((response) => response?.analysis);
  if (!scored.length) return { overallScore: 0, overallLabel: "Not enough data", stars: 0, strongestAreas: [], improvementAreas: [], patterns: [], recommendations: ["Complete at least one answer to receive interview feedback."], bestAnswerIndex: null, averageWords: 0, totalFillers: 0, failed: false, warnings: [], hasStrongAreas: false };
  const warnings = scored.filter((response) => response.analysis.warning).map((response) => response.analysis.warning);
  const failed = warnings.some((warning) => warning.instantFail);
  const dimensionNames = ["relevance", "structure", "ownership", "specificity", "impact", "communication"];
  const averages = Object.fromEntries(dimensionNames.map((name) => [name, Math.round(scored.reduce((sum, response) => sum + response.analysis.dimensions[name].score, 0) / scored.length)]));
  const ranked = Object.entries(averages).sort((a, b) => b[1] - a[1]);

  let overallScore = Math.round(scored.reduce((sum, response) => sum + response.analysis.overallScore, 0) / scored.length);
  const weakAnswerCount = scored.filter((response) => response.analysis.overallScore < 55).length;
  const weakAnswerRatio = weakAnswerCount / scored.length;
  const redDimensionCount = Object.values(averages).filter((score) => score < 55).length;
  if (failed) overallScore = 0;
  else if (weakAnswerRatio >= 0.75 || redDimensionCount >= 5) overallScore = Math.min(overallScore, 49);
  else if (weakAnswerRatio > 0.5 || redDimensionCount >= 4) overallScore = Math.min(overallScore, 54);
  overallScore = clampScore(overallScore);

  const resultMissing = scored.filter((response) => !response.analysis.signals.resultFound).length;
  const actionMissing = scored.filter((response) => !response.analysis.signals.actionFound).length;
  const quantMissing = scored.filter((response) => response.analysis.signals.resultFound && !response.analysis.signals.quantified).length;
  const weakMeaning = scored.filter((response) => (response.analysis.meaning?.score || 0) < 55).length;
  const patterns = [];
  if (failed) patterns.push("A critical safety issue stopped the practice interview.");
  if (warnings.length) patterns.push(`${warnings.length} answer${warnings.length === 1 ? "" : "s"} included wording Aisha Jordan would coach you to make more professional; the interview continued.`);
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
    return `${label} (${score}/100): keep the answer direct, organized, and centered on evidence that proves the competency.`;
  });

  const strongRanked = ranked.filter(([, score]) => score >= 70);
  const hasStrongAreas = strongRanked.length > 0;
  const strongestAreas = strongRanked.slice(0, 2).map(([name, score]) => ({ name, score, label: labelFor(score) }));
  const improvementSource = hasStrongAreas ? ranked.slice(-2).reverse() : [...ranked].sort((a, b) => a[1] - b[1]);
  const improvementAreas = improvementSource.map(([name, score]) => ({ name, score, label: labelFor(score) }));

  return {
    overallScore,
    overallLabel: failed ? "Interview stopped" : labelFor(overallScore),
    stars: failed ? 1 : starRating(overallScore),
    failed,
    warnings,
    verdict: sessionVerdict(overallScore, failed),
    dimensionAverages: averages,
    strongestAreas,
    improvementAreas,
    hasStrongAreas,
    patterns,
    recommendations,
    bestAnswerIndex,
    averageWords: Math.round(totalWords / scored.length),
    totalFillers,
    weakAnswerCount,
  };
}

export function getBrowserInterviewCapabilities(scope = globalThis) {
  const speechRecognition = Boolean(scope.SpeechRecognition || scope.webkitSpeechRecognition);
  const speechSynthesis = Boolean(scope.speechSynthesis);
  const camera = Boolean(scope.navigator?.mediaDevices?.getUserMedia);
  const webGpu = Boolean(scope.navigator?.gpu);
  return { speechRecognition, speechSynthesis, camera, webGpu, localModelEligible: webGpu };
}