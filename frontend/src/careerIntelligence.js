const STOP_WORDS = new Set(["a","an","and","are","as","at","be","for","from","how","i","in","is","it","me","my","of","on","or","that","the","this","to","was","we","were","what","when","with","you","your","they","their","them"]);

const COMPETENCY_CONCEPTS = {
  problem_solving: [["diagnose","diagnosed","debug","debugged","investigate","investigated","root cause","troubleshoot","troubleshot"],["test","tested","compare","compared","isolate","isolated","analyze","analyzed"],["fix","fixed","resolve","resolved","solution","implemented"]],
  ownership: [["owned","responsible","accountable","took ownership","my decision","i decided","i led"],["initiated","proposed","created","built","implemented","coordinated"],["followed through","verified","validated","monitored"]],
  leadership: [["led","coached","mentored","delegated","aligned","influenced","facilitated"],["decision","tradeoff","priority","prioritized","strategy","direction"],["team","stakeholder","cross-functional","people"]],
  communication: [["explained","communicated","presented","translated","clarified","listened"],["customer","client","stakeholder","manager","team","audience"],["feedback","understanding","agreement","expectation","escalation"]],
  teamwork: [["collaborated","partnered","worked with","coordinated","supported","paired"],["team","coworker","stakeholder","partner"],["handoff","shared","aligned","together"]],
  prioritization: [["prioritized","priority","triage","urgent","deadline","competing"],["risk","impact","severity","dependency","tradeoff"],["first","next","defer","sequence","schedule"]],
  decision_making: [["decided","decision","chose","selected","recommended"],["tradeoff","risk","constraint","option","alternative"],["data","evidence","information","criteria","impact"]],
  learning: [["learned","feedback","mistake","failed","failure","retrospective"],["changed","adjusted","improved","adapted","applied"],["next time","afterward","since then","lesson"]],
  results: [["result","outcome","impact","delivered","achieved"],["reduced","increased","improved","saved","grew","prevented"],["percent","%","hours","days","customers","tickets","revenue","cost"]],
  impact: [["result","outcome","impact","changed"],["reduced","increased","improved","saved","grew","prevented","faster"],["percent","%","hours","days","weeks","people","customers","tickets","dollars","$","revenue","cost"]],
  customer_focus: [["customer","client","user","patient","guest","member"],["need","concern","experience","satisfaction","trust"],["resolved","helped","supported","retained","improved"]],
  judgment: [["judgment","risk","safety","policy","procedure","compliance"],["assessed","evaluated","considered","verified"],["decision","escalated","protected","prevented"]],
  reliability: [["reliability","uptime","incident","failure","availability","stability"],["monitor","alert","root cause","prevent","recover"],["reduced","improved","restored","prevented"]],
  quality: [["quality","accuracy","defect","error","standard","review"],["validated","tested","checked","audited"],["reduced","prevented","improved","corrected"]],
  safety: [["safety","risk","hazard","incident","procedure","protocol"],["checked","verified","escalated","prevented"],["protected","reduced","avoided","compliance"]],
  analysis: [["analyzed","analysis","data","trend","pattern","metric"],["compared","modeled","evaluated","investigated"],["conclusion","recommendation","decision","finding"]],
  role_alignment: [["experience","used","built","managed","supported","delivered"],["example","project","customer","team","system"],["result","impact","outcome","improved"]],
  career_evidence: [["i","my","owned","led","built","created","resolved"],["result","impact","outcome","improved","reduced","increased"],["because","which meant","so that","therefore"]],
};

const QUESTION_HINTS = [
  ["problem_solving", ["problem","diagnose","troubleshoot","root cause","difficult technical"]],
  ["leadership", ["lead","influence","authority","coach","manager","responsibility grew"]],
  ["prioritization", ["priorit","competing","what to do first","deadline"]],
  ["communication", ["communicat","explain","disagreement","stakeholder","feedback"]],
  ["teamwork", ["collaborat","teamwork","team contribution"]],
  ["decision_making", ["decision","tradeoff","incomplete information","choose"]],
  ["learning", ["learn","did not go as planned","failure","feedback"]],
  ["ownership", ["ownership","personally do","beyond simply"]],
  ["results", ["accomplishment","result","impact","proud"]],
  ["customer_focus", ["customer","client","guest","patient"]],
];

const QUESTION_INTENT_OVERRIDES = [
  { competency: "role_alignment", fragments: ["what is one strength you would bring", "what evidence best demonstrates it"] },
  { competency: "role_alignment", fragments: ["why are you interested in working as", "strong next step"] },
  { competency: "learning", fragments: ["tell me about a skill you had to develop", "more effective in your work"] },
  { competency: "learning", fragments: ["tell me about a mistake or setback", "what did you learn"] },
];

function normalize(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9%$\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value = "") {
  return normalize(value).split(" ").filter((word) => word && word.length > 2 && !STOP_WORDS.has(word));
}

function textIncludes(text, phrase) {
  const haystack = ` ${normalize(text)} `;
  const needle = normalize(phrase);
  return needle && (haystack.includes(` ${needle} `) || haystack.includes(` ${needle}`));
}

function overlapScore(left = "", right = "") {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (!a.size || !b.size) return 0;
  let matches = 0;
  for (const token of a) if (b.has(token)) matches += 1;
  return Math.min(100, Math.round((matches / Math.min(a.size, 10)) * 100));
}

export function inferQuestionCompetency(question = "", explicitCompetency = "") {
  const normalized = normalize(question);
  const intentOverride = QUESTION_INTENT_OVERRIDES.find(({ fragments }) => fragments.every((fragment) => normalized.includes(normalize(fragment))));
  if (intentOverride) return intentOverride.competency;
  if (explicitCompetency && COMPETENCY_CONCEPTS[explicitCompetency]) return explicitCompetency;
  let best = explicitCompetency || "role_alignment";
  let score = 0;
  for (const [competency, hints] of QUESTION_HINTS) {
    const current = hints.reduce((total, hint) => total + (normalized.includes(normalize(hint)) ? 1 : 0), 0);
    if (current > score) {
      best = competency;
      score = current;
    }
  }
  return best;
}

export function scoreMeaningAlignment(answer = "", { question = "", competency = "", roleTitle = "", jobDescription = "" } = {}) {
  const resolvedCompetency = inferQuestionCompetency(question, competency);
  const groups = COMPETENCY_CONCEPTS[resolvedCompetency] || COMPETENCY_CONCEPTS.role_alignment;
  const groupHits = groups.map((group) => group.some((phrase) => textIncludes(answer, phrase)));
  const matchedConceptGroups = groupHits.filter(Boolean).length;
  const conceptCoverage = Math.round((matchedConceptGroups / groups.length) * 100);
  const questionOverlap = overlapScore(question, answer);
  const roleOverlap = overlapScore(`${roleTitle} ${jobDescription}`, answer);
  const causalEvidence = /\b(because|so that|which meant|therefore|as a result|resulted in|led to)\b/i.test(answer);
  const concreteExample = /\b(for example|for instance|during|when|on one|in one|specifically)\b/i.test(answer) || tokenize(answer).length >= 35;
  const genericOnly = tokenize(answer).length < 18 && conceptCoverage <= 34 && questionOverlap < 25;

  let score = 20 + Math.round(conceptCoverage * 0.5) + Math.round(questionOverlap * 0.15) + Math.round(roleOverlap * 0.1);
  if (causalEvidence) score += 10;
  if (concreteExample) score += 8;
  if (genericOnly) score -= 18;
  if (matchedConceptGroups < 2 && !["role_alignment", "career_evidence"].includes(resolvedCompetency)) score = Math.min(score, 49);
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    competency: resolvedCompetency,
    conceptCoverage,
    matchedConceptGroups,
    totalConceptGroups: groups.length,
    questionOverlap,
    roleOverlap,
    causalEvidence,
    concreteExample,
    genericOnly,
  };
}

function flattenReceipt(receipt = {}) {
  const values = [];
  const visit = (value) => {
    if (value == null) return;
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value === "object") return Object.values(value).forEach(visit);
    if (typeof value === "string" || typeof value === "number") values.push(String(value));
  };
  visit(receipt);
  return values.join(" ");
}

export function rankImpactReceipts(receipts = [], { roleTitle = "", jobDescription = "", competency = "career_evidence", question = "" } = {}) {
  const target = `${roleTitle} ${jobDescription} ${question}`.trim();
  return receipts
    .filter((receipt) => receipt && (receipt.accomplishment || receipt.result || receipt.contribution))
    .map((receipt) => {
      const text = flattenReceipt(receipt);
      const meaning = scoreMeaningAlignment(text, { question, competency, roleTitle, jobDescription });
      const targetOverlap = overlapScore(target, text);
      const quantified = /(?:\$\s?\d|\b\d+(?:\.\d+)?\s?(?:%|percent|hours?|days?|weeks?|months?|years?|people|customers?|tickets?|cases?|minutes?|seconds?|x\b))/i.test(text);
      const evidenceBonus = receipt.evidence ? 8 : 0;
      const confirmedBonus = receipt.confirmed_by || receipt.confirmedBy || receipt.verified ? 8 : 0;
      const resultBonus = receipt.result ? 7 : 0;
      const score = Math.min(100, Math.round(meaning.score * 0.45 + targetOverlap * 0.35 + evidenceBonus + confirmedBonus + resultBonus + (quantified ? 7 : 0)));
      return { receipt, score, meaning, targetOverlap };
    })
    .sort((a, b) => b.score - a.score);
}