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
    experience: experience.map((entry, index) => ({
      id: entry.id || `imported-role-${index}`,
      company: clean(entry.company),
      title: clean(entry.title),
      location: clean(entry.location),
      start_date: clean(entry.start_date),
      end_date: clean(entry.end_date),
      current: Boolean(entry.current),
      dates_raw: clean(entry.dates_raw),
      confidence: entry.confidence || "low",
      bullets: (entry.bullets || []).map(cloneBullet).filter((bullet) => bullet.text),
    })),
  };
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
  if (clean(summary)) out.push("", "PROFESSIONAL SUMMARY", clean(summary));
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
  if (skills?.length) out.push("", "SKILLS", skills.filter(Boolean).join(" | "));
  for (const key of ["projects", "education"]) {
    const lines = sections?.[key] || [];
    if (lines.length) out.push("", key.toUpperCase(), ...lines);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function containsTerm(value, term) {
  const haystack = clean(value).toLowerCase();
  const needle = clean(term).toLowerCase();
  return Boolean(needle) && haystack.includes(needle);
}

export function findRequirementEvidence(term, { draft, summary = "", skills = [] } = {}) {
  for (const role of draft?.experience || []) {
    const roleLabel = [role.company, role.title].filter(Boolean).join(" · ") || "Work experience";
    if (containsTerm(role.company, term) || containsTerm(role.title, term)) return roleLabel;
    for (const bullet of role.bullets || []) {
      if (containsTerm(bullet?.text || bullet, term)) return roleLabel;
    }
  }
  const skill = (skills || []).find((item) => containsTerm(item, term));
  if (skill) return `Skills · ${skill}`;
  if (containsTerm(summary, term)) return "Professional summary";
  return "Resume text";
}

export function parseGateStatus(draft, parseWarnings = []) {
  const roles = draft?.experience || [];
  if (!roles.length) return { level: "bad", label: "Needs attention", detail: "No work history was confidently reconstructed." };
  const incomplete = roles.filter((role) => !clean(role.company) || !clean(role.title));
  if (incomplete.length || parseWarnings.length) {
    return { level: "warn", label: "Review", detail: `${Math.max(incomplete.length, parseWarnings.length)} item${Math.max(incomplete.length, parseWarnings.length) === 1 ? "" : "s"} should be confirmed before applying.` };
  }
  return { level: "good", label: "Ready", detail: `${roles.length} role${roles.length === 1 ? "" : "s"} reconstructed with employer and title.` };
}

export function qualificationGateStatus(result) {
  if (!result) return { level: "neutral", label: "Waiting", detail: "Add a target job to check requirement coverage." };
  const coverage = Number(result?.readiness?.coverage_percent || 0);
  if (coverage >= 65) return { level: "good", label: "Strong signal", detail: "Most detected job requirements are visible in the resume." };
  if (coverage >= 35) return { level: "warn", label: "Strengthen", detail: "Several relevant requirements are not visible enough yet." };
  return { level: "bad", label: "Needs work", detail: "The current resume is missing many detected job signals." };
}

export function recruiterGateStatus(draft) {
  const bullets = flattenExperienceBullets(draft?.experience || []);
  const quantified = bullets.filter((bullet) => bullet.has_metrics).length;
  if (!bullets.length) return { level: "bad", label: "Needs work", detail: "No experience bullets are available for a recruiter to scan." };
  if (quantified >= 3) return { level: "good", label: "Ready", detail: `${quantified} accomplishment bullets show measurable impact.` };
  return { level: "warn", label: "Polish", detail: `${quantified} bullet${quantified === 1 ? "" : "s"} show measurable impact. Add numbers only where they are true.` };
}
