import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Plus, Trash2 } from "lucide-react";
import "./ResumeImportConfirmation.css";

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

export default function ResumeImportConfirmation({ draft, warnings = [], onChange, onConfirm }) {
  const contact = draft?.contact || {};
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

  const incomplete = roles.some((role) => !role.company.trim() || !role.title.trim());

  return (
    <section className="resume-confirm-shell" aria-labelledby="resume-confirm-title">
      <header className="resume-confirm-header">
        <div>
          <span className="resume-confirm-kicker"><CheckCircle2 size={15} /> Resume reconstructed</span>
          <h2 id="resume-confirm-title">Check your career history before ATS analysis</h2>
          <p>BragStack grouped employer, title, dates, location and bullets together. Fix anything that looks wrong so the ATS check uses the right career data.</p>
        </div>
        <div className="resume-confirm-count"><strong>{roles.length}</strong><span>role{roles.length === 1 ? "" : "s"} found</span></div>
      </header>

      {warnings.length > 0 && (
        <div className="resume-confirm-warning" role="status">
          <AlertTriangle size={18} />
          <div><strong>We need your eyes on a few details</strong><span>{warnings.join(" · ")}</span></div>
        </div>
      )}

      <div className="resume-confirm-section">
        <div className="resume-confirm-section-title"><span>Contact</span><small>Used in the ATS-safe header</small></div>
        <div className="resume-contact-grid">
          <label>Name<input value={contact.name || ""} onChange={(event) => setContact("name", event.target.value)} placeholder="Full name" /></label>
          <label>Email<input value={contact.email || ""} onChange={(event) => setContact("email", event.target.value)} placeholder="name@example.com" /></label>
          <label>Phone<input value={contact.phone || ""} onChange={(event) => setContact("phone", event.target.value)} placeholder="555-555-5555" /></label>
          <label>Location<input value={contact.location || ""} onChange={(event) => setContact("location", event.target.value)} placeholder="Atlanta, GA" /></label>
          <label>LinkedIn<input value={contact.linkedin || ""} onChange={(event) => setContact("linkedin", event.target.value)} placeholder="linkedin.com/in/..." /></label>
          <label>GitHub / Portfolio<input value={contact.github || ""} onChange={(event) => setContact("github", event.target.value)} placeholder="github.com/..." /></label>
        </div>
      </div>

      <div className="resume-confirm-section">
        <div className="resume-confirm-section-title"><span>Work history</span><button type="button" onClick={addRole}><Plus size={15} /> Add role</button></div>
        <div className="resume-role-stack">
          {roles.map((role, roleIndex) => (
            <article className={`resume-role-card ${!role.company.trim() || !role.title.trim() ? "needs-review" : ""}`} key={role.id || roleIndex}>
              <div className="resume-role-card-head">
                <div><BriefcaseBusiness size={18} /><span><strong>{role.company || "Employer needed"}</strong><small>{role.title || "Job title needed"}</small></span></div>
                <button className="resume-role-remove" type="button" onClick={() => removeRole(roleIndex)} aria-label={`Remove role ${role.company || roleIndex + 1}`}><Trash2 size={15} /></button>
              </div>
              <div className="resume-role-fields">
                <label>Company<input value={role.company || ""} onChange={(event) => setRole(roleIndex, "company", event.target.value)} placeholder="Company name" /></label>
                <label>Job title<input value={role.title || ""} onChange={(event) => setRole(roleIndex, "title", event.target.value)} placeholder="Job title" /></label>
                <label>Location<input value={role.location || ""} onChange={(event) => setRole(roleIndex, "location", event.target.value)} placeholder="City, State or Remote" /></label>
                <label>Dates<input value={role.dates_raw || ""} onChange={(event) => setRole(roleIndex, "dates_raw", event.target.value)} placeholder="Jan 2024 – Present" /></label>
              </div>
              <div className="resume-role-bullets">
                <div className="resume-role-bullets-head"><strong>Accomplishments</strong><button type="button" onClick={() => addRoleBullet(roleIndex)}><Plus size={14} /> Add bullet</button></div>
                {(role.bullets || []).length ? role.bullets.map((bullet, bulletIndex) => (
                  <div className="resume-role-bullet-edit" key={`${roleIndex}-${bulletIndex}`}>
                    <textarea value={bullet.text || ""} onChange={(event) => onChange({ ...draft, experience: updateRoleBullet(roles, roleIndex, bulletIndex, event.target.value) })} rows="2" placeholder="Describe a real accomplishment…" />
                    <button type="button" onClick={() => removeRoleBullet(roleIndex, bulletIndex)} aria-label="Remove bullet"><Trash2 size={14} /></button>
                  </div>
                )) : <p>No bullets were confidently attached to this role yet.</p>}
              </div>
            </article>
          ))}
          {!roles.length && <div className="resume-no-roles"><BriefcaseBusiness size={24} /><strong>No roles reconstructed</strong><span>Add your work history manually before running the ATS check.</span><button type="button" onClick={addRole}><Plus size={15} /> Add first role</button></div>}
        </div>
      </div>

      <footer className="resume-confirm-footer">
        <span>{incomplete ? "Complete employer and title fields before continuing." : "Everything can still be edited later."}</span>
        <button type="button" className="resume-confirm-primary" onClick={onConfirm} disabled={incomplete || !roles.length}><CheckCircle2 size={17} /> Confirm career history</button>
      </footer>
    </section>
  );
}
