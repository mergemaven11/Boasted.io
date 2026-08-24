import { useEffect, useMemo, useState } from "react";
import { Check, Copy, FileDown, FileText, Sparkles, Target } from "lucide-react";
import { getCurrentUser, getEntries } from "./api";
import "./ResumeBuilderPage.css";

function cleanBullet(entry) {
  const explicit = String(entry?.resume_bullet || "").trim();
  if (explicit) return explicit;
  const action = String(entry?.action || entry?.description || "").trim();
  const impact = String(entry?.impact || "").trim();
  if (action && impact) return `${action.replace(/[.]+$/, "")}; ${impact.charAt(0).toLowerCase()}${impact.slice(1)}`;
  return action || impact || String(entry?.title || "Recorded accomplishment").trim();
}

function uniqueSkills(entries) {
  const seen = new Set();
  entries.forEach((entry) => {
    (entry.tags || []).forEach((tag) => {
      const value = String(tag || "").trim();
      if (value) seen.add(value);
    });
  });
  return Array.from(seen).slice(0, 12);
}

function ResumeBuilderPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulletEdits, setBulletEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    targetRole: "",
    summary: "",
    roleTitle: "",
    organization: "",
    location: "",
    dates: "",
    education: "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [currentUser, entryResponse] = await Promise.all([getCurrentUser(), getEntries(50, 0)]);
        if (!active) return;
        const loadedEntries = entryResponse.entries || entryResponse.items || [];
        setUser(currentUser);
        setEntries(loadedEntries);
        const preferred = loadedEntries.filter((entry) => entry.resume_bullet).slice(0, 5);
        const defaults = (preferred.length ? preferred : loadedEntries.slice(0, 5)).map((entry) => entry.id);
        setSelectedIds(defaults);
        setForm((current) => ({
          ...current,
          targetRole: currentUser.headline || "",
          roleTitle: currentUser.headline || "",
          location: currentUser.location || "",
        }));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedIds.includes(entry.id)),
    [entries, selectedIds],
  );
  const skills = useMemo(() => uniqueSkills(selectedEntries), [selectedEntries]);

  function toggleEntry(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id].slice(-8));
  }

  function bulletFor(entry) {
    return bulletEdits[entry.id] ?? cleanBullet(entry);
  }

  function resumeText() {
    const lines = [user?.name || "BragStack Member"];
    const contact = [user?.location, user?.email, user?.github_url, user?.portfolio_url].filter(Boolean).join(" · ");
    if (contact) lines.push(contact);
    if (form.targetRole) lines.push(`TARGET: ${form.targetRole}`);
    if (form.summary) lines.push("", "SUMMARY", form.summary);
    lines.push("", "EXPERIENCE", [form.roleTitle, form.organization].filter(Boolean).join(" — "));
    const meta = [form.location, form.dates].filter(Boolean).join(" · ");
    if (meta) lines.push(meta);
    selectedEntries.forEach((entry) => lines.push(`• ${bulletFor(entry)}`));
    if (skills.length) lines.push("", "SKILLS", skills.join(" · "));
    if (form.education) lines.push("", "EDUCATION", form.education);
    return lines.filter((line, index) => !(line === "" && lines[index - 1] === "")).join("\n");
  }

  async function copyResume() {
    await navigator.clipboard.writeText(resumeText());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <main className="resume-builder-page"><div className="resume-builder-loading">Building your proof inventory…</div></main>;

  return (
    <main className="resume-builder-page">
      <header className="resume-builder-hero">
        <div>
          <span className="resume-builder-kicker"><Sparkles size={15} /> BRAGSTACK PRO · NEW</span>
          <h1>Proof-Powered Resume Builder</h1>
          <p>Build a resume from accomplishments you already proved. No invented employers, metrics, tools, or outcomes.</p>
        </div>
        <div className="resume-builder-actions">
          <button type="button" className="resume-secondary" onClick={copyResume}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Copied" : "Copy resume"}</button>
          <button type="button" className="resume-primary" onClick={() => window.print()}><FileDown size={17} />Print / Save PDF</button>
        </div>
      </header>

      <section className="resume-builder-grid">
        <div className="resume-builder-controls">
          <section className="resume-control-card">
            <div className="resume-control-heading"><Target size={18} /><div><strong>1. Target the resume</strong><span>Give the document a job direction.</span></div></div>
            <label>Target role<input value={form.targetRole} onChange={(event) => setForm({ ...form, targetRole: event.target.value })} placeholder="Platform Support Engineer" /></label>
            <label>Professional summary<textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={4} placeholder="Support-focused engineer who turns production incidents into durable reliability improvements…" /></label>
          </section>

          <section className="resume-control-card">
            <div className="resume-control-heading"><FileText size={18} /><div><strong>2. Add experience context</strong><span>Your proof becomes resume-ready experience.</span></div></div>
            <div className="resume-two-col"><label>Role title<input value={form.roleTitle} onChange={(event) => setForm({ ...form, roleTitle: event.target.value })} /></label><label>Organization<input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} placeholder="Company" /></label></div>
            <div className="resume-two-col"><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Dates<input value={form.dates} onChange={(event) => setForm({ ...form, dates: event.target.value })} placeholder="2024 — Present" /></label></div>
            <label>Education / credentials<input value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} placeholder="Degree, certification, school, or training" /></label>
          </section>

          <section className="resume-control-card">
            <div className="resume-control-heading"><Sparkles size={18} /><div><strong>3. Choose proof</strong><span>Select up to 8 accomplishments. Resume-ready bullets are used first.</span></div></div>
            <div className="resume-proof-list">
              {entries.length === 0 && <p className="resume-empty">Add accomplishments first, then come back here to build from real work.</p>}
              {entries.map((entry) => {
                const selected = selectedIds.includes(entry.id);
                return <button type="button" className={`resume-proof-option ${selected ? "selected" : ""}`} onClick={() => toggleEntry(entry.id)} key={entry.id}><span className="resume-checkbox">{selected && <Check size={14} />}</span><span><strong>{entry.title || "Accomplishment"}</strong><small>{cleanBullet(entry)}</small></span></button>;
              })}
            </div>
          </section>
        </div>

        <section className="resume-preview-wrap">
          <div className="resume-preview-label"><span>LIVE RESUME PREVIEW</span><small>{selectedEntries.length} proof-backed bullet{selectedEntries.length === 1 ? "" : "s"}</small></div>
          <article className="resume-sheet" id="bragstack-resume-sheet">
            <header className="resume-sheet-header">
              <h2>{user?.name || "Your Name"}</h2>
              <p>{[user?.location, user?.email, user?.github_url, user?.portfolio_url].filter(Boolean).join(" · ")}</p>
              {form.targetRole && <strong>{form.targetRole}</strong>}
            </header>
            {form.summary && <section><h3>Professional Summary</h3><p>{form.summary}</p></section>}
            <section>
              <h3>Experience</h3>
              <div className="resume-role-row"><div><strong>{form.roleTitle || "Role title"}</strong><span>{form.organization || "Organization"}</span></div><small>{[form.location, form.dates].filter(Boolean).join(" · ")}</small></div>
              <ul>{selectedEntries.map((entry) => <li key={entry.id}><textarea aria-label={`Resume bullet for ${entry.title || "accomplishment"}`} value={bulletFor(entry)} onChange={(event) => setBulletEdits({ ...bulletEdits, [entry.id]: event.target.value })} rows={3} /></li>)}</ul>
              {selectedEntries.length === 0 && <p className="resume-preview-placeholder">Choose accomplishments on the left to build your experience bullets.</p>}
            </section>
            {skills.length > 0 && <section><h3>Skills</h3><p>{skills.join(" · ")}</p></section>}
            {form.education && <section><h3>Education & Credentials</h3><p>{form.education}</p></section>}
            <footer>Built from your recorded BragStack career proof · Review every line before submitting.</footer>
          </article>
        </section>
      </section>
    </main>
  );
}

export default ResumeBuilderPage;
