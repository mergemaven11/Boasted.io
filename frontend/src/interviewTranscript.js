const CORRECTION_RULES = [
  {
    id: "sprint-meeting",
    heard: /\bspirit (meeting|meetings)\b/gi,
    intended: /\bsprint (meeting|meetings)\b/i,
    context: /\b(agile|scrum|sprint|software(?: engineer(?:ing)?)?|developer|devops|platform engineer|front[ -]?end|back[ -]?end)\b/i,
    replace: (_, number) => `sprint ${number}`,
  },
  {
    id: "pull-request",
    heard: /\bpool (request|requests)\b/gi,
    intended: /\bpull (request|requests)\b/i,
    context: /\b(git|github|gitlab|repository|repo|code review|software(?: engineer(?:ing)?)?|developer|devops|platform engineer|front[ -]?end|back[ -]?end)\b/i,
    replace: (_, number) => `pull ${number}`,
  },
];

export function buildTranscriptContext({ roleTitle = "", careerArea = "", jobDescription = "", question = "" } = {}) {
  return [roleTitle, careerArea, jobDescription, question].map(String).join(" ").replace(/\s+/g, " ").trim();
}

function applicableRules(context) {
  return CORRECTION_RULES.filter((rule) => rule.context.test(context));
}

export function correctTranscript(transcript = "", context = "") {
  return applicableRules(String(context)).reduce(
    (display, rule) => display.replace(rule.heard, rule.replace),
    String(transcript),
  );
}

export function resolveTranscriptAlternatives(alternatives = [], context = "") {
  const candidates = alternatives
    .slice(0, 3)
    .map((alternative) => ({
      transcript: String(alternative?.transcript || "").trim(),
      confidence: Number.isFinite(alternative?.confidence) ? alternative.confidence : null,
    }))
    .filter((alternative) => alternative.transcript);
  const raw = candidates[0]?.transcript || "";
  let selected = raw;

  for (const rule of applicableRules(String(context))) {
    if (!rule.heard.test(raw)) continue;
    rule.heard.lastIndex = 0;
    const domainAlternative = candidates.slice(1).find((candidate) => rule.intended.test(candidate.transcript));
    if (domainAlternative) {
      selected = domainAlternative.transcript;
      break;
    }
  }

  return { raw, display: correctTranscript(selected, context), selected };
}
