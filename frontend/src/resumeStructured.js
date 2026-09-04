const METRIC_RE = /\b\d+(?:\.\d+)?%?\b/;

function clean(value) {
  return String(value || "").trim();
}

function cloneBullet(bullet) {
  if (typeof bullet === "string") {
    return {
      text: clean(bullet),
      source_kind: "imported",
      source_receipt_id: "",
      source_title: "Imported resume",
      matched_terms: [],
      evidence_count: 0,
      has_metrics: METRIC_RE.test(bullet),
      edited: false,
    };
  }
  const text = clean(bullet?.text);
  return {
    text,
    source_kind: bullet?.source_kind || "imported",
    source_receipt_id: bullet?.source_receipt_id || "",
    source_title: bullet?.source_title || (bullet?.source_kind === "impact-receipt" ? "Impact Receipt" : "Imported resume"),
    matched_terms: Array.isArray(bullet?.matched_terms) ? bullet.matched_terms : [],
    evidence_count: Number(bullet?.evidence_count || 0),
    has_metrics: typeof bullet?.has_metrics === "boolean" ? bullet.has_metrics : METRIC_RE.test(text),
    edited: Boolean(bullet?.edited),
  };
}

function cloneExperienceEntry(entry, index = 0, prefix = "imported-role") {
  return {
    id: entry?.id || `${prefix}-${index}`,
    company: clean(entry?.company),
    title: clean(entry?.title),
    location: clean(entry?.location),
    start_date: clean(entry?.start_date),
    end_date: clean(entry?.end_date),
    current: Boolean(entry?.current),
    dates_raw: clean(entry?.dates_raw),
    confidence: entry?.confidence || "low",
    bullets: (entry?.bullets || []).map(cloneBullet).filter((bullet) => bullet.text),
  };
}

export function makeResumeDraft(importedResume = {}, user = {}) {
  const contact = importedResume.contact || {};
  const header = importedResume.header_lines || [];
  const experience = Array.isArray(importedResume.experience) ? importedResume.experience : [];
  return {
    contact: {
      name: clean(contact.name || header[0] || user.name || ""),
      email: clean(contact.email || user.email || ""),
      phone: clean(contact.phone),
      location: clean(contact.location || user.location || ""),
      linkedin: clean(contact.linkedin),
      github: clean(contact.github),
    },
    experience: experience.map((entry, index) => cloneExperienceEntry(entry, index)),
  };
}

export function makeSavedResumeDraft(savedResume = {}, user = {}) {
  if (!Array.isArray(savedResume.experience)) return null;
  return makeResumeDraft(
    {
      contact: savedResume.contact || {},
      experience: savedResume.experience,
    },
    user,
  );
}

export function flattenExperienceBullets(experience = []) {
  return experience.flatMap((entry) => (entry.bullets || []).map(cloneBullet)).filter((bullet) => bullet.text);
}

export function formatRoleDates(role) {
  if (clean(role?.dates_raw)) return clean(role.dates_raw);
  const start = clean(role?.start_date);
  const end = role?.current ? "Present" : clean(role?.end_date);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

export function serializeResumeDraft({ draft, summary = "", skills = [], sections = {} }) {
  if (!draft) return "";
  const contact = draft.contact || {};
  const contactLine = [contact.location, contact.email, contact.phone, contact.linkedin, contact.github].filter(Boolean).join(" | ");
  const out = [contact.name || "YOUR NAME"];
  if (contactLine) out.push(contactLine);

  // Standard, scan-friendly order: Summary → Skills → Experience → Education → Projects.
  if (clean(summary)) out.push("", "PROFESSIONAL SUMMARY", clean(summary));
  if (skills?.length) out.push("", "SKILLS", skills.filter(Boolean).join(" | "));

  if (draft.experience?.length) {
    out.push("", "PROFESSIONAL EXPERIENCE");
    draft.experience.forEach((role) => {
      out.push([role.company, role.title].filter(Boolean).join(" | "));
      const roleMeta = [role.location, formatRoleDates(role)].filter(Boolean).join(" | ");
      if (roleMeta) out.push(roleMeta);
      (role.bullets || []).forEach((bullet) => {
        const text = clean(bullet?.text || bullet);
        if (text) out.push(`• ${text}`);
      });
    });
  }

  for (const key of ["education", "projects"]) {
    const lines = sections?.[key] || [];
    if (lines.length) out.push("", key.toUpperCase(), ...lines);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(value, term) {
  const haystack = clean(value).toLowerCase();
  const needle = clean(term).toLowerCase();
  if (!needle) return false;
  const parts = needle.split(/\s+/).filter(Boolean).map(escapeRegex);
  if (!parts.length) return false;
  const expression = parts.join("[\\s/_-]+");
  return new RegExp(`(^|[^a-z0-9])${expression}(?=$|[^a-z0-9])`, "i").test(haystack);
}

function excerptAroundTerm(value, term, maxLength = 150) {
  const text = clean(value);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const lower = text.toLowerCase();
  const index = lower.indexOf(clean(term).toLowerCase());
  const start = Math.max(0, index > -1 ? index - Math.floor(maxLength / 3) : 0);
  const slice = text.slice(start, start + maxLength).trim();
  return `${start > 0 ? "…" : ""}${slice}${start + maxLength < text.length ? "…" : ""}`;
}

export function findRequirementEvidenceDetail(term, { draft, summary = "", skills = [] } = {}) {
  for (let roleIndex = 0; roleIndex < (draft?.experience || []).length; roleIndex += 1) {
    const role = draft.experience[roleIndex];
    const roleLabel = [role.company, role.title].filter(Boolean).join(" · ") || "Work experience";
    if (containsTerm(role.company, term) || containsTerm(role.title, term)) {
      return { label: roleLabel, sourceKind: "role", roleIndex, excerpt: roleLabel };
    }
    for (const bullet of role.bullets || []) {
      if (containsTerm(bullet?.text || bullet, term)) {
        return {
          label: roleLabel,
          sourceKind: bullet?.source_kind === "impact-receipt" ? "impact-receipt" : "experience",
          roleIndex,
          excerpt: excerptAroundTerm(bullet?.text || bullet, term),
        };
      }
    }
  }
  const skill = (skills || []).find((item) => containsTerm(item, term));
  if (skill) return { label: `Skills · ${skill}`, sourceKind: "skills", roleIndex: null, excerpt: skill };
  if (containsTerm(summary, term)) return { label: "Professional summary", sourceKind: "summary", roleIndex: null, excerpt: excerptAroundTerm(summary, term) };
  return null;
}

export function findRequirementEvidence(term, context = {}) {
  return findRequirementEvidenceDetail(term, context)?.label || "";
}

function supportingContentCount(content = {}) {
  const skills = Array.isArray(content.skills) ? content.skills.filter((item) => clean(item)).length : 0;
  const education = Array.isArray(content.sections?.education) ? content.sections.education.filter((item) => clean(item)).length : 0;
  const projects = Array.isArray(content.sections?.projects) ? content.sections.projects.filter((item) => clean(item)).length : 0;
  const summary = clean(content.summary) ? 1 : 0;
  return skills + education + projects + summary;
}

export function parseGateStatus(draft, parseWarnings = [], content = {}) {
  const roles = draft?.experience || [];
  const supportingCount = supportingContentCount(content);
  if (!roles.length && !supportingCount) {
    return { level: "bad", label: "Needs content", detail: "We could not verify enough structured content yet. Review the source resume before changing anything." };
  }
  const incomplete = roles.filter((role) => !clean(role.company) || !clean(role.title));
  if (incomplete.length || parseWarnings.length) {
    return { level: "warn", label: "Review", detail: `${Math.max(incomplete.length, parseWarnings.length)} parsed item${Math.max(incomplete.length, parseWarnings.length) === 1 ? "" : "s"} should be confirmed against the source resume.` };
  }
  if (!roles.length) {
    return { level: "good", label: "Structured", detail: "Structured education, projects, skills, or summary content is available even without work history." };
  }
  return { level: "good", label: "Ready", detail: `${roles.length} role${roles.length === 1 ? "" : "s"} are structured with employer and title.` };
}

export function qualificationGateStatus(result) {
  if (!result) return { level: "neutral", label: "Waiting", detail: "Add a target job to compare supported evidence with the posting." };
  const scanScore = Number(result?.ats_scan?.breakdown?.job_match ?? result?.readiness?.coverage_percent ?? 0);
  if (scanScore >= 75) return { level: "good", label: "Strong match", detail: `${scanScore}% of detected job signals are visibly supported by the resume or selected career proof.` };
  if (scanScore >= 50) return { level: "warn", label: "Good foundation", detail: `${scanScore}% of detected job signals are visibly supported. Review the unmatched requirements for truthful additions.` };
  return { level: "bad", label: "Needs attention", detail: `${scanScore}% of detected job signals are visibly supported. This is a comparison result, not an employer rejection prediction.` };
}

export function recruiterGateStatus(draft, content = {}) {
  const bullets = flattenExperienceBullets(draft?.experience || []);
  const quantified = bullets.filter((bullet) => bullet.has_metrics).length;
  if (!bullets.length) {
    const supportingCount = supportingContentCount(content);
    if (supportingCount) {
      return { level: "warn", label: "Review structure", detail: "No structured work-history bullets are currently available to this scan. Supporting projects, education, skills, or summary content is still present." };
    }
    return { level: "bad", label: "Needs content", detail: "The scan could not verify accomplishments, projects, education, or skills yet. Check the source resume before treating anything as missing." };
  }
  if (quantified >= 3) return { level: "good", label: "Strong", detail: `${quantified} accomplishment bullets show measurable impact.` };
  return { level: "warn", label: "Polish", detail: `${quantified} bullet${quantified === 1 ? "" : "s"} show measurable impact. Add numbers only where they are true.` };
}
