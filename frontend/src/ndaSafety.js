export const CONFIDENTIALITY_ATTESTATION_VERSION = "2026-09-05.v2";

const ATTESTATION_TTL_MS = 15_000;
let armedAttestation = null;

const BLOCKING_PATTERNS = [
  {
    id: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
    message: "Potential private key material detected. Remove it before Boasted sends this draft.",
  },
  {
    id: "bearer-token",
    pattern: /\b(?:authorization\s*:\s*bearer|bearer)\s+[A-Za-z0-9._~+/=-]{16,}/i,
    message: "Potential bearer token detected. Remove credentials before continuing.",
  },
  {
    id: "secret-assignment",
    pattern: /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["']?[^\s,"']{6,}/i,
    message: "Potential password, API key, token, or secret assignment detected.",
  },
  {
    id: "provider-token",
    pattern: /\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{20,})\b/i,
    message: "Potential provider credential or access token detected.",
  },
  {
    id: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{10,}\b/,
    message: "Potential signed access token detected.",
  },
];

const WARNING_PATTERNS = [
  {
    id: "code-block",
    pattern: /```[\s\S]*?```/,
    message: "Code-like content is present. Prefer a generalized description instead of nonpublic implementation details.",
  },
  {
    id: "stack-trace",
    pattern: /\bTraceback \(most recent call last\)|\b(?:ERROR|WARN|FATAL)\b[^\n]*|(?:Exception|Error):[^\n]*/im,
    message: "Log or diagnostic output may be present. Avoid copying internal logs or stack traces.",
  },
  {
    id: "internal-url",
    pattern: /https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[^/\s]+\.(?:internal|corp|local))\b/i,
    message: "A likely internal URL or host is present. Replace it with a generic reference unless disclosure is authorized.",
  },
  {
    id: "work-item",
    pattern: /\b[A-Z][A-Z0-9]{1,9}-\d{2,}\b/,
    message: "An internal-style ticket or work-item identifier may be present. Consider using “internal work item” instead.",
  },
  {
    id: "restricted-keyword",
    pattern: /\b(?:private repo(?:sitory)?|internal ticket|production logs?|customer data|client data|internal url|credentials?)\b/i,
    message: "The draft references material that is often restricted. Confirm that no confidential details are included.",
  },
];

const URL_PATTERN = /https?:\/\/[^\s)\]}>,"']+/gi;
const TICKET_PATTERN = /\b[A-Z][A-Z0-9]{1,9}-\d{2,}\b/g;
const PRIVATE_HOST_PATTERN = /\b(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[A-Za-z0-9.-]+\.(?:internal|corp|local))\b/gi;

function cleanWhitespace(value) {
  return String(value ?? "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findingKey(finding) {
  return `${finding.severity}:${finding.id}:${finding.field}`;
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = findingKey(finding);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function armConfidentialityAttestation() {
  armedAttestation = {
    version: CONFIDENTIALITY_ATTESTATION_VERSION,
    expiresAt: Date.now() + ATTESTATION_TTL_MS,
  };
}

export function consumeConfidentialityAttestation() {
  const current = armedAttestation;
  armedAttestation = null;
  if (!current || current.expiresAt < Date.now()) return null;
  return current.version;
}

export function isConfidentialityProtectedRequest(method, url) {
  const normalizedMethod = String(method || "").toLowerCase();
  if (!["post", "put", "patch"].includes(normalizedMethod)) return false;

  const path = String(url || "").split("?")[0].replace(/\/$/, "") || "/";
  if (normalizedMethod === "post" && path === "/entries") return true;
  if (["put", "patch"].includes(normalizedMethod) && /^\/entries\/[^/]+$/.test(path)) return true;
  if (normalizedMethod === "post" && path === "/impact-receipts") return true;
  if (normalizedMethod === "post" && /^\/impact-receipts\/from-entry\/[^/]+$/.test(path)) return true;
  if (normalizedMethod === "patch" && /^\/impact-receipts\/[^/]+$/.test(path)) return true;
  return false;
}

export function scanSensitiveText(value, field = "Draft") {
  const text = String(value ?? "");
  if (!text.trim()) return [];

  const findings = [];
  for (const rule of BLOCKING_PATTERNS) {
    if (rule.pattern.test(text)) {
      findings.push({ id: rule.id, severity: "block", field, message: rule.message });
    }
  }
  for (const rule of WARNING_PATTERNS) {
    if (rule.pattern.test(text)) {
      findings.push({ id: rule.id, severity: "warning", field, message: rule.message });
    }
  }
  return findings;
}

function scanFields(fields) {
  return dedupeFindings(
    fields.flatMap(([label, value]) => scanSensitiveText(value, label)),
  );
}

export function scanAccomplishmentDraft(form = {}) {
  const findings = scanFields([
    ["Title", form.title],
    ["Situation", form.situation],
    ["Action", form.action],
    ["Impact", form.impact],
    ["Lesson", form.lesson],
  ]);

  if (form.is_public) {
    findings.push({
      id: "public-review",
      severity: "warning",
      field: "Sharing",
      message: "Public sharing is enabled. Confirm every detail is authorized for public disclosure.",
    });
  }
  return dedupeFindings(findings);
}

export function scanImpactReceiptDraft(form = {}) {
  const fields = [
    ["Accomplishment", form.accomplishment],
    ["Contribution", form.contribution],
    ["Result", form.result],
    ["Metric", form.metricLabel],
    ["Metric value", form.metricValue],
    ["Metric context", form.metricContext],
  ];

  for (const [index, evidence] of (form.evidence || []).entries()) {
    fields.push([`Evidence ${index + 1} title`, evidence.title]);
    fields.push([`Evidence ${index + 1} reference`, evidence.reference]);
    fields.push([`Evidence ${index + 1} description`, evidence.description]);
  }

  const findings = scanFields(fields);

  if (String(form.metricValue || "").trim()) {
    findings.push({
      id: "metric-review",
      severity: "warning",
      field: "Metric value",
      message: "Exact internal metrics can be confidential. Use the value only if it is approved for disclosure or storage.",
    });
  }

  for (const [index, evidence] of (form.evidence || []).entries()) {
    const reference = String(evidence.reference || "").trim();
    if (!reference) continue;
    if (evidence.source_is_public) {
      findings.push({
        id: `public-source-ceiling-${index}`,
        severity: "info",
        field: `Evidence ${index + 1}`,
        message: "Public-source ceiling: describe only what the public source itself demonstrates, not extra internal context.",
      });
    } else {
      findings.push({
        id: `private-reference-${index}`,
        severity: "warning",
        field: `Evidence ${index + 1}`,
        message: "This reference is not marked as public. Do not copy private ticket URLs, repository URLs, screenshots, or restricted document links.",
      });
    }
  }

  const publicReceipt = form.isPublic === true || form.is_public === true;
  const publicEvidence = (form.evidence || []).some((item) => item.is_public === true);
  if (publicReceipt || publicEvidence) {
    findings.push({
      id: "public-review",
      severity: "warning",
      field: "Sharing",
      message: "Public sharing is enabled somewhere in this receipt. Confirm every shared detail is authorized for public disclosure.",
    });
  }

  return dedupeFindings(findings);
}

export function scanSubmissionContainer(container) {
  if (!container?.querySelectorAll) return [];
  const values = [];
  container.querySelectorAll("input, textarea").forEach((element) => {
    const type = String(element.type || "").toLowerCase();
    if (["checkbox", "radio", "hidden", "submit", "button"].includes(type)) return;
    if (!String(element.value || "").trim()) return;
    values.push(element.value);
  });
  return scanSensitiveText(values.join("\n"), "Draft");
}

function redactSecrets(value) {
  return String(value ?? "")
    .replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi, "[credential removed]")
    .replace(/\b(?:authorization\s*:\s*bearer|bearer)\s+[A-Za-z0-9._~+/=-]{16,}/gi, "[credential removed]")
    .replace(/\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["']?[^\s,"']{6,}/gi, "[credential removed]")
    .replace(/\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{20,})\b/gi, "[credential removed]")
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{10,}\b/g, "[credential removed]");
}

export function sanitizeNdaText(value, { preservePublicUrls = false } = {}) {
  let output = redactSecrets(value);
  output = output.replace(/```[\s\S]*?```/g, "[technical implementation omitted]");
  output = output.replace(URL_PATTERN, (url) => (preservePublicUrls ? url : "[reference omitted]"));
  output = output.replace(TICKET_PATTERN, "internal work item");
  output = output.replace(PRIVATE_HOST_PATTERN, "internal system");

  const lines = output.split("\n");
  let diagnosticRemoved = false;
  const keptLines = lines.filter((line) => {
    const diagnostic = /\bTraceback \(most recent call last\)|\b(?:ERROR|WARN|FATAL)\b|(?:Exception|Error):/i.test(line);
    if (diagnostic) diagnosticRemoved = true;
    return !diagnostic;
  });
  output = keptLines.join("\n");
  if (diagnosticRemoved) output = `${output}\n[internal diagnostic details omitted]`;
  return cleanWhitespace(output);
}

export function makeAccomplishmentNdaSafe(form = {}) {
  return {
    ...form,
    title: sanitizeNdaText(form.title),
    situation: sanitizeNdaText(form.situation),
    action: sanitizeNdaText(form.action),
    impact: sanitizeNdaText(form.impact),
    lesson: sanitizeNdaText(form.lesson),
    is_public: false,
  };
}

export function makeImpactReceiptNdaSafe(form = {}) {
  const next = {
    ...form,
    accomplishment: sanitizeNdaText(form.accomplishment),
    contribution: sanitizeNdaText(form.contribution),
    result: sanitizeNdaText(form.result),
    evidence: (form.evidence || []).map((item) => {
      const reference = String(item.reference || "").trim();
      const preservePublicReference = item.source_is_public === true && /^https?:\/\//i.test(reference) && !WARNING_PATTERNS[2].pattern.test(reference);
      return {
        ...item,
        title: sanitizeNdaText(item.title),
        reference: preservePublicReference ? reference : "",
        description: sanitizeNdaText(item.description),
        is_public: false,
      };
    }),
  };

  if (Object.hasOwn(form, "metricLabel")) next.metricLabel = sanitizeNdaText(form.metricLabel);
  if (Object.hasOwn(form, "metricValue")) next.metricValue = "";
  if (Object.hasOwn(form, "metricContext")) next.metricContext = sanitizeNdaText(form.metricContext);
  if (Object.hasOwn(form, "isPublic")) next.isPublic = false;
  if (Object.hasOwn(form, "is_public")) next.is_public = false;
  return next;
}
