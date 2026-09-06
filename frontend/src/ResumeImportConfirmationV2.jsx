import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { SUPPORTING_SECTION_LABELS, SUPPORTING_SECTION_ORDER } from "./resumeStructured.js";
import "./ResumeImportConfirmation.css";
import "./ResumeImportConfirmationV2.css";

function updateRole(roles, index, field, value) {
  return roles.map((role, roleIndex) => roleIndex === index ? { ...role, [field]: value } : role);
}

function updateRoleBullet(roles, roleIndex, bulletIndex, value) {
  return roles.map((role, index) => {
    if (index !== roleIndex) return role;
    return {
      ...role,
      bullets: (role.bullets || []).map((bullet, index2) => index2 === bulletIndex ? { ...bullet, text: value, edited: true } : bullet),
    };
  });
}

function linesToText(lines = []) {
  return (lines || []).join("\n");
}

function textToLines(value) {
  return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function textToSkills(value) {
  return String(value || "").split(/[\n,]/).map((skill) => skill.trim()).filter(Boolean);
}

function confidenceLabel(value) {
  if (value === "high") return "High";
  if (value === "medium" || value === "manual") return "Review";
  if (value === "missing") return "Missing";
  return "Low";
}

function ConfidenceBadge({ value }) {
  const level = value === "high" ? "high" : value === "medium" || value === "manual" ? "medium" : "low";
  return <span className={`resume-confidence-badge ${level}`}>{confidenceLabel(value)}</span>;
}

export default function ResumeImportConfirmationV2({
  draft,
  warnings = [],
  summary = "",
  skills = [],
  sections = {},
  onChange,
  onSummaryChange,
  onSkillsChange,
  onSectionsChange,
  onConfirm,
  parseQuality = null,
}) {
  const contact = draft?.contact || {};
  const contactConfidence = draft?.contact_confidence || {};
  const roles = draft?.experience || [];

  function setContact(field, value) {
    onChange({ ...draft, contact: { ...contact, [field]: value } });
  }

  function setRole(index, field, value) {
    onChange({ ...draft, experience: updateRole(roles, index, field, value) });
  }

  function addRole() {
    onChange({
      ...draft,
      experience: [
        ...roles,
        {
          id: `manual-role-${Date.now()}`,
          company: "",
          title: "",
          location: "",
          start_date: "",
          end_date: "",
          current: false,
          dates_raw: "",
          confidence: "manual",
          field_confidence: {},
          bullets: [],
        },
      ],
    });
  }

  function removeRole(index) {
    onChange({ ...draft, experience: roles.filter((_, roleIndex) => roleIndex !== index) });
  }

  function addRoleBullet(index) {
    onChange({
      ...draft,
      experience: roles.map((role, roleIndex) => roleIndex === index ? {
        ...role,
        bullets: [...(role.bullets || []), { text: "", source_kind: "manual", source_title: "Manual edit", edited: true }],
      } : role),
    });
  }

  function removeRoleBullet(roleIndex, bulletIndex) {
    onChange({
      ...draft,
      experience: roles.map((role, index) => index === roleIndex ? {
        ...role,
        bullets: (role.bullets || []).filter((_, index2) => index2 !== bulletIndex),
      } : role),
    });
  }

  function updateSection(key, value) {
    onSectionsChange({ ...sections, [key]: textToLines(value) });
  }

  const incomplete = roles.some((role) => !role.company.trim() || !role.title.trim());
  const hasResumeContent = Boolean(
    roles.length
    || summary.trim()
    || skills.length
    || SUPPORTING_SECTION_ORDER.some((key) => (sections?.[key] || []).length)
  );

  return (
    <section className="resume-confirm-shell" aria-labelledby="resume-confirm-title">
      <header className="resume-confirm-header">
        <div>
          <span className="resume-confirm-kicker"><CheckCircle2 size={15} /> Resume reconstruction</span>
          <h2 id="resume-confirm-title">Check the fields, then make them yours.</h2>
          <p>Correct anything the parser missed, insert missing details, or build manually. Boasted does not invent uncertain facts.</p>
        </div>
        <div className="resume-confirm-count"><strong>{parseQuality?.score ?? roles.length}</strong><span>{parseQuality ? "parse quality" : `work role${roles.length === 1 ? "" : "s"}`}</span></div>
      </header>

      {warnings.length > 0 && (
        <div className="resume-confirm-warning" role="status">
          <AlertTriangle size={18} />
          <div><strong>Review these parser uncertainties</strong><span>{warnings.join(" · ")}</span></div>
        </div>
      )}

      {parseQuality && (
        <div className="resume-parse-quality" aria-label="Parser reconstruction summary">
          <span><strong>{parseQuality.role_count || 0}</strong> roles</span>
          <span><strong>{parseQuality.complete_role_count || 0}</strong> complete roles</span>
          <span><strong>{parseQuality.contact_field_count || 0}</strong> contact fields</span>
          <span><strong>{parseQuality.recognized_section_count || 0}</strong> sections</span>
        </div>
      )}

      <div className="resume-confirm-section">
        <div className="resume-confirm-section-title"><span>Contact</span><small>Editable ATS-safe header fields</small></div>
        <div className="resume-contact-grid">
          <label>Name <ConfidenceBadge value={contactConfidence.name} /><input value={contact.name || ""} onChange={(event) => setContact("name", event.target.value)} placeholder="Full name" /></label>
          <label>Email <ConfidenceBadge value={contactConfidence.email} /><input value={contact.email || ""} onChange={(event) => setContact("email", event.target.value)} placeholder="name@example.com" /></label>
          <label>Phone <ConfidenceBadge value={contactConfidence.phone} /><input value={contact.phone || ""} onChange={(event) => setContact("phone", event.target.value)} placeholder="555-555-5555" /></label>
          <label>Location <ConfidenceBadge value={contactConfidence.location} /><input value={contact.location || ""} onChange={(event) => setContact("location", event.target.value)} placeholder="Atlanta, GA" /></label>
          <label>LinkedIn <ConfidenceBadge value={contactConfidence.linkedin} /><input value={contact.linkedin || ""} onChange={(event) => setContact("linkedin", event.target.value)} placeholder="linkedin.com/in/..." /></label>
          <label>GitHub / Portfolio <ConfidenceBadge value={contactConfidence.github} /><input value={contact.github || ""} onChange={(event) => setContact("github", event.target.value)} placeholder="github.com/..." /></label>
        </div>
      </div>

      <div className="resume-confirm-section">
        <div className="resume-confirm-section-title"><span>Core and supporting content</span><small>Use the sections that fit your career</small></div>
        <div className="resume-content-grid">
          <label>Professional summary<textarea value={summary} onChange={(event) => onSummaryChange(event.target.value)} rows="4" placeholder="A short truthful summary of the kind of work you do or want to do…" /></label>
          <label>Skills<textarea value={skills.join(", ")} onChange={(event) => onSkillsChange(textToSkills(event.target.value))} rows="4" placeholder="Python, Linux, customer support, Kubernetes…" /></label>
          {SUPPORTING_SECTION_ORDER.map((key) => (
            <label key={key}>{SUPPORTING_SECTION_LABELS[key] || key}<textarea value={linesToText(sections?.[key] || [])} onChange={(event) => updateSection(key, event.target.value)} rows="4" placeholder={`Add ${String(SUPPORTING_SECTION_LABELS[key] || key).toLowerCase()} — one item per line.`} /></label>
          ))}
        </div>
      </div>

      <div className="resume-confirm-section">
        <div className="resume-confirm-section-title"><span>Work history</span><button type="button" onClick={addRole}><Plus size={15} /> Add role</button></div>
        <div className="resume-role-stack">
          {roles.map((role, roleIndex) => {
            const roleConfidence = role.field_confidence || {};
            return (
              <article className={`resume-role-card ${!role.company.trim() || !role.title.trim() ? "needs-review" : ""}`} key={role.id || roleIndex}>
                <div className="resume-role-card-head">
                  <div><BriefcaseBusiness size={18} /><span><strong>{role.company || "Employer needed"}</strong><small>{role.title || "Job title needed"}</small></span></div>
                  <div className="resume-role-card-actions"><ConfidenceBadge value={role.confidence} /><button className="resume-role-remove" type="button" onClick={() => removeRole(roleIndex)} aria-label={`Remove role ${role.company || roleIndex + 1}`}><Trash2 size={15} /></button></div>
                </div>
                <div className="resume-role-fields">
                  <label>Company <ConfidenceBadge value={roleConfidence.company || role.confidence} /><input value={role.company || ""} onChange={(event) => setRole(roleIndex, "company", event.target.value)} placeholder="Company name" /></label>
                  <label>Job title <ConfidenceBadge value={roleConfidence.title || role.confidence} /><input value={role.title || ""} onChange={(event) => setRole(roleIndex, "title", event.target.value)} placeholder="Job title" /></label>
                  <label>Location <ConfidenceBadge value={roleConfidence.location} /><input value={role.location || ""} onChange={(event) => setRole(roleIndex, "location", event.target.value)} placeholder="City, State or Remote" /></label>
                  <label>Dates <ConfidenceBadge value={roleConfidence.dates} /><input value={role.dates_raw || ""} onChange={(event) => setRole(roleIndex, "dates_raw", event.target.value)} placeholder="Jan 2024 – Present" /></label>
                </div>
                <div className="resume-role-bullets">
                  <div className="resume-role-bullets-head"><strong>Accomplishments</strong><button type="button" onClick={() => addRoleBullet(roleIndex)}><Plus size={14} /> Add bullet</button></div>
                  {(role.bullets || []).length ? role.bullets.map((bullet, bulletIndex) => (
                    <div className="resume-role-bullet-edit" key={`${roleIndex}-${bulletIndex}`}>
                      <textarea value={bullet.text || ""} onChange={(event) => onChange({ ...draft, experience: updateRoleBullet(roles, roleIndex, bulletIndex, event.target.value) })} rows="2" placeholder="Describe a real accomplishment…" />
                      <button type="button" onClick={() => removeRoleBullet(roleIndex, bulletIndex)} aria-label="Remove bullet"><Trash2 size={14} /></button>
                    </div>
                  )) : <p>No bullets yet. Add accomplishments only when this role applies to you.</p>}
                </div>
              </article>
            );
          })}
          {!roles.length && <div className="resume-no-roles"><BriefcaseBusiness size={24} /><strong>No work history added</strong><span>That is okay. Students and career starters can continue with education, projects, skills, leadership, certifications, and a summary instead.</span><button type="button" onClick={addRole}><Plus size={15} /> Add a work role</button></div>}
        </div>
      </div>

      <footer className="resume-confirm-footer">
        <span>{incomplete ? "Complete company and job title for every work role you add." : hasResumeContent ? "Everything can still be edited later." : "Add a role, skill, project, education item, or summary to continue."}</span>
        <button type="button" className="resume-confirm-primary" onClick={onConfirm} disabled={incomplete || !hasResumeContent}><CheckCircle2 size={17} /> Confirm resume content</button>
      </footer>
    </section>
  );
}
