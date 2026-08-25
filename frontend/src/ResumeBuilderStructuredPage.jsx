import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Video,
  X,
} from "lucide-react";
import { getCurrentUser, getImpactReceipts } from "./api.js";
import { buildResume, importResume, listResumes, saveResume } from "./resumeApi.js";
import ResumeImportConfirmation from "./ResumeImportConfirmation.jsx";
import {
  findRequirementEvidenceDetail,
  flattenExperienceBullets,
  formatRoleDates,
  makeResumeDraft,
  makeSavedResumeDraft,
  parseGateStatus,
  qualificationGateStatus,
  recruiterGateStatus,
  serializeResumeDraft,
} from "./resumeStructured.js";
import "./ResumeStructuredFlow.css";

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function GateCard({ title, icon: Icon, status }) {
  return (
    <article className={`resume-v2-gate ${status.level}`}>
      <div className="resume-v2-gate-top">
        <span><Icon size={15} /> {title}</span>
        <strong className="resume-v2-gate-badge">{status.label}</strong>
      </div>
      <p>{status.detail}</p>
    </article>
  );
}

function Step({ number, label, state }) {
  return <div className={`resume-v2-step ${state}`}><strong>{state === "done" ? "✓" : number}</strong><span>{label}</span></div>;
}

function StructuredResumePreview({ draft, summary, skills, sections, onEdit }) {
  const contact = draft?.contact || {};
  const contactItems = [contact.location, contact.email, contact.phone, contact.linkedin, contact.github].filter(Boolean);
  return (
    <article className="resume-v2-paper">
      <div className="resume-v2-paper-banner"><span><ShieldCheck size={14} /> ATS-safe single-column preview</span><button type="button" onClick={onEdit}>Edit career history</button></div>
      <header>
        <h1>{contact.name || "Your Name"}</h1>
        {contactItems.length > 0 && <div className="resume-v2-contact">{contactItems.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>}
      </header>
      {summary && <section><h2>Professional Summary</h2><p className="resume-v2-summary">{summary}</p></section>}
      <section>
        <h2>Professional Experience</h2>
        {(draft?.experience || []).length ? (draft.experience || []).map((role, index) => (
          <div className="resume-v2-job" key={role.id || `${role.company}-${index}`}>
            <div className="resume-v2-job-head"><div><strong>{role.company || "Employer"}</strong><span> · {role.title || "Job title"}</span></div><time>{formatRoleDates(role)}</time></div>
            {role.location && <p className="resume-v2-job-location">{role.location}</p>}
            {(role.bullets || []).length > 0 && <ul>{role.bullets.map((bullet, bulletIndex) => <li className={bullet.source_kind === "impact-receipt" ? "proof-backed" : ""} key={`${index}-${bulletIndex}`}>{bullet.text}</li>)}</ul>}
          </div>
        )) : <p className="resume-v2-summary">Add work history before exporting an ATS-ready resume.</p>}
      </section>
      {skills.length > 0 && <section><h2>Skills</h2><p className="resume-v2-skills">{skills.join(" · ")}</p></section>}
      {["projects", "education"].map((key) => {
        const lines = sections?.[key] || [];
        if (!lines.length) return null;
        return <section key={key}><h2>{key}</h2><div className="resume-v2-support-lines">{lines.map((line, index) => <span key={`${key}-${index}`}>{line}</span>)}</div></section>;
      })}
    </article>
  );
}

function proofKey(bullet) {
  return `${bullet.source_receipt_id || bullet.source_title || "proof"}:${bullet.text}`;
}

function savedVersionDate(value) {
  if (!value) return "Saved version";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Saved version";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ResumeBuilderStructuredPage() {
  const [user, setUser] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loadedSavedId, setLoadedSavedId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [importedResume, setImportedResume] = useState(null);
  const [resumeDraft, setResumeDraft] = useState(null);
  const [supportingSections, setSupportingSections] = useState({});
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState([]);
  const [building, setBuilding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [atsTextMode, setAtsTextMode] = useState(false);
  const [proofRoleIndex, setProofRoleIndex] = useState(0);
  const [addedProofKeys, setAddedProofKeys] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentUser(), getImpactReceipts(), listResumes()])
      .then(([userData, receiptData, resumeData]) => {
        if (!active) return;
        setUser(userData);
        setReceipts(receiptData.receipts || []);
        setSaved(resumeData.resumes || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const parseWarnings = useMemo(() => importedResume?.parse_warnings || [], [importedResume]);
  const parseGate = useMemo(() => parseGateStatus(resumeDraft, parseWarnings), [resumeDraft, parseWarnings]);
  const qualificationGate = useMemo(() => qualificationGateStatus(result), [result]);
  const recruiterGate = useMemo(() => recruiterGateStatus(resumeDraft), [resumeDraft]);
  const plainText = useMemo(() => serializeResumeDraft({ draft: resumeDraft, summary, skills, sections: supportingSections }), [resumeDraft, summary, skills, supportingSections]);
  const proofSuggestions = useMemo(() => (result?.bullets || []).filter((bullet) => bullet.source_kind === "impact-receipt" && !addedProofKeys.includes(proofKey(bullet))), [result, addedProofKeys]);
  const detectedSections = importedResume?.sections_found || [];
  const missingCoreSections = importedResume && !loadedSavedId ? ["experience", "skills"].filter((section) => !detectedSections.includes(section)) : [];

  const stepState = (step) => {
    if (step === 1) return importedResume ? "done" : "active";
    if (step === 2) return importConfirmed ? "done" : importedResume ? "active" : "";
    if (step === 3) return result ? "done" : importedResume ? "active" : "";
    return result ? "active" : "";
  };

  async function handleImport(file) {
    if (!file) return;
    setImporting(true);
    setMessage("");
    try {
      const data = await importResume(file);
      const draft = makeResumeDraft(data, user || {});
      setImportedResume(data);
      setLoadedSavedId("");
      setResumeDraft(draft);
      setSupportingSections(data.sections || {});
      setSummary(data.summary || "");
      setSkills(data.skills || []);
      setImportConfirmed(false);
      setResult(null);
      setAtsTextMode(false);
      setProofRoleIndex(0);
      setAddedProofKeys([]);
      setMessage(draft.experience.length
        ? `We reconstructed ${draft.experience.length} role${draft.experience.length === 1 ? "" : "s"}. Confirm the details before ATS analysis.`
        : "We could not confidently reconstruct a role. You can still enter the target job now, then add your work history in the career-history review before running ATS Gate Check.");
    } catch (error) {
      setMessage(error.response?.data?.detail || "We could not import that resume.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearImport(event) {
    event.stopPropagation();
    setImportedResume(null);
    setLoadedSavedId("");
    setResumeDraft(null);
    setSupportingSections({});
    setImportConfirmed(false);
    setResult(null);
    setSummary("");
    setSkills([]);
    setTargetRole("");
    setJobDescription("");
    setSelectedIds([]);
    setAtsTextMode(false);
    setAddedProofKeys([]);
    setMessage("");
  }

  function openSavedResume(savedResume) {
    const draft = makeSavedResumeDraft(savedResume, user || {});
    if (!draft) {
      setMessage("That older saved version predates structured career history. Upload the source resume to reconstruct employers and job titles before ATS Gate Check.");
      return;
    }
    const sections = savedResume.supporting_sections || {};
    setLoadedSavedId(savedResume.id);
    setImportedResume({
      filename: savedResume.title || "Saved resume",
      sections_found: ["experience", ...(savedResume.skills?.length ? ["skills"] : []), ...Object.keys(sections).filter((key) => sections[key]?.length)],
      sections,
      parse_warnings: [],
    });
    setResumeDraft(draft);
    setSupportingSections(sections);
    setTargetRole(savedResume.target_role || "");
    setJobDescription(savedResume.job_description || "");
    setSummary(savedResume.summary || "");
    setSkills(savedResume.skills || []);
    setImportConfirmed(true);
    setResult(null);
    setAtsTextMode(false);
    setSelectedIds([]);
    setProofRoleIndex(0);
    setAddedProofKeys(flattenExperienceBullets(draft.experience).filter((bullet) => bullet.source_kind === "impact-receipt").map(proofKey));
    setMessage(`Opened ${savedResume.title || "saved resume"}. Your employer, title, dates and role-specific accomplishments were restored. Re-run ATS Gate Check to refresh the comparison.`);
  }

  function confirmImport() {
    setImportConfirmed(true);
    setResult(null);
    setAtsTextMode(false);
    setMessage("Career history confirmed. Add the target job and run ATS Gate Check.");
  }

  async function handleBuild(event) {
    event.preventDefault();
    if (!resumeDraft || !importConfirmed) {
      setMessage("Upload and confirm your career history before running ATS Gate Check.");
      return;
    }
    setBuilding(true);
    setMessage("");
    try {
      const existingResumeText = serializeResumeDraft({ draft: resumeDraft, summary, skills, sections: supportingSections });
      const data = await buildResume({
        target_role: targetRole,
        job_description: jobDescription,
        selected_receipt_ids: selectedIds,
        existing_resume_text: existingResumeText,
      });
      setResult(data);
      setSummary(data.summary || summary);
      setSkills(data.skills || skills);
      setAtsTextMode(false);
      setMessage("ATS Gate Check finished. Review truthful gaps and proof suggestions before exporting.");
    } catch (error) {
      setMessage(error.response?.data?.detail?.message || error.response?.data?.detail || "ATS Gate Check could not run.");
    } finally {
      setBuilding(false);
    }
  }

  function toggleReceipt(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function addProofToRole(bullet) {
    if (!resumeDraft?.experience?.length) return;
    const index = Math.min(proofRoleIndex, resumeDraft.experience.length - 1);
    setResumeDraft((current) => ({
      ...current,
      experience: current.experience.map((role, roleIndex) => roleIndex === index ? {
        ...role,
        bullets: [...(role.bullets || []), { ...bullet, edited: false }],
      } : role),
    }));
    setAddedProofKeys((current) => [...current, proofKey(bullet)]);
    setMessage(`Added evidence-backed proof to ${resumeDraft.experience[index].company || resumeDraft.experience[index].title}. Re-run ATS Gate Check to refresh the job match.`);
  }

  async function handleSave() {
    if (!result || !resumeDraft) return;
    const title = `${targetRole} · ${new Date().toLocaleDateString()}`;
    const flattened = flattenExperienceBullets(resumeDraft.experience);
    const experience = resumeDraft.experience.map((role) => ({
      company: role.company,
      title: role.title,
      location: role.location || "",
      start_date: role.start_date || "",
      end_date: role.end_date || "",
      current: Boolean(role.current),
      dates_raw: role.dates_raw || "",
      confidence: role.confidence || "low",
      bullets: (role.bullets || []).map((bullet) => ({ ...bullet })),
    }));
    try {
      const created = await saveResume({
        title,
        target_role: targetRole,
        job_description: jobDescription,
        summary,
        bullets: flattened.slice(0, 20),
        skills,
        contact: resumeDraft.contact || {},
        experience,
        supporting_sections: {
          projects: supportingSections.projects || [],
          education: supportingSections.education || [],
        },
      });
      setSaved((current) => [created, ...current]);
      setLoadedSavedId(created.id);
      setMessage("Resume version saved with employers, titles, dates and role-specific accomplishments intact.");
    } catch (error) {
      setMessage(error.response?.data?.detail || "We could not save that resume version.");
    }
  }

  function practiceFromResume() {
    localStorage.setItem("bragstack_resume_interview_context_v1", JSON.stringify({ targetRole, jobDescription, summary, skills, experience: resumeDraft?.experience || [] }));
    window.location.assign("/app/interview-practice?from=resume");
  }

  const supportedEvidence = (result?.supported_requirements || []).slice(0, 8).map((term) => {
    const detail = findRequirementEvidenceDetail(term, { draft: resumeDraft, summary, skills });
    return {
      term,
      source: detail?.label || "Career proof available",
      excerpt: detail?.excerpt || "",
      sourceKind: detail?.sourceKind || "unknown",
    };
  });

  return (
    <main className="resume-v2-page">
      <header className="resume-v2-hero">
        <div><span className="resume-v2-badge"><Sparkles size={14} /> BRAGSTACK PRO</span><h1>Resume Builder</h1><p>Reconstruct your real work history, confirm what the ATS will read, target a job, and strengthen only the experience you can truthfully support.</p></div>
        <div className="resume-v2-hero-note"><ShieldCheck size={21} /><span><strong>ATS Gate Check</strong><small>Reduce avoidable parsing and matching problems. No score can guarantee how every employer ATS behaves.</small></span></div>
      </header>

      <div className="resume-v2-steps" aria-label="Resume builder progress">
        <Step number="1" label="Upload resume" state={stepState(1)} />
        <Step number="2" label="Confirm career history" state={stepState(2)} />
        <Step number="3" label="Target the job" state={stepState(3)} />
        <Step number="4" label="Review ATS Gate" state={stepState(4)} />
      </div>

      <section className="resume-v2-grid">
        <aside className="resume-v2-panel resume-v2-left">
          <div className="resume-v2-label">Resume source</div>
          <div className={`resume-v2-upload ${importedResume ? "ready" : ""}`} role="button" tabIndex="0" onClick={() => fileInputRef.current?.click()} onKeyDown={(event) => event.key === "Enter" && fileInputRef.current?.click()}>
            <input ref={fileInputRef} hidden type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => handleImport(event.target.files?.[0])} />
            <Upload size={21} />
            <div>{importedResume ? <><strong>{importedResume.filename}</strong><span>{loadedSavedId ? "Saved structured version" : `${resumeDraft?.experience?.length || 0} role${resumeDraft?.experience?.length === 1 ? "" : "s"} reconstructed`}</span></> : <><strong>{importing ? "Reading resume…" : "Upload existing resume"}</strong><span>PDF, DOCX, or TXT · up to 5 MB</span></>}</div>
            {importedResume && <button type="button" className="resume-v2-icon-button" aria-label="Remove imported resume" onClick={clearImport}><X size={14} /></button>}
          </div>

          {saved.length > 0 && <div className="resume-v2-saved-block">
            <div className="resume-v2-saved-head"><span>Saved versions</span><small>{saved.length}</small></div>
            <div className="resume-v2-saved-list">
              {saved.slice(0, 5).map((item) => {
                const structured = Array.isArray(item.experience) && item.experience.length > 0;
                return <button type="button" className={`resume-v2-saved-item ${loadedSavedId === item.id ? "active" : ""}`} key={item.id} onClick={() => openSavedResume(item)}>
                  <span><strong>{item.title || item.target_role || "Saved resume"}</strong><small>{structured ? `${item.experience.length} role${item.experience.length === 1 ? "" : "s"} · ${savedVersionDate(item.updated_at || item.created_at)}` : `Legacy version · ${savedVersionDate(item.updated_at || item.created_at)}`}</small></span>
                  <em>{structured ? "Open" : "Re-import"}</em>
                </button>;
              })}
            </div>
          </div>}

          <div className="resume-v2-divider" />
          <div className="resume-v2-label">Target job</div>
          <form className="resume-v2-form" onSubmit={handleBuild}>
            {!importConfirmed && <div className="resume-v2-disabled-note">You can enter the target job now. Review and confirm the reconstructed career history before running ATS Gate Check.</div>}
            <label>Target role<input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Platform Support Engineer" required /></label>
            <label>Job description<textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the full job posting here…" required /></label>
            <div className="resume-v2-label">Career proof</div>
            <div className="resume-v2-receipts">
              {receipts.slice(0, 16).map((receipt) => <label className="resume-v2-receipt" key={receipt.id}><input type="checkbox" checked={selectedIds.includes(receipt.id)} onChange={() => toggleReceipt(receipt.id)} /><span><strong>{receipt.accomplishment}</strong><small>{(receipt.skills || []).slice(0, 3).join(" · ") || "Impact Receipt"}</small></span></label>)}
            </div>
            <button className="resume-v2-primary" type="submit" disabled={!importConfirmed || building || importing}>{building ? "Running ATS Gate Check…" : result ? "Re-run ATS Gate Check" : importConfirmed ? "Run ATS Gate Check" : "Confirm career history to run ATS Gate"}</button>
          </form>
        </aside>

        <section className="resume-v2-panel resume-v2-center">
          {importedResume && resumeDraft && !importConfirmed ? (
            <ResumeImportConfirmation draft={resumeDraft} warnings={parseWarnings} onChange={setResumeDraft} onConfirm={confirmImport} />
          ) : atsTextMode && result ? (
            <div className="resume-v2-ats-text"><div className="resume-v2-ats-text-head"><strong>ATS TEXT VIEW</strong><button type="button" onClick={() => setAtsTextMode(false)}>Back to resume</button></div><pre>{plainText}</pre><small>{result.ats_note}</small></div>
          ) : resumeDraft && importConfirmed ? (
            <StructuredResumePreview draft={resumeDraft} summary={summary} skills={skills} sections={supportingSections} onEdit={() => { setImportConfirmed(false); setResult(null); setAtsTextMode(false); }} />
          ) : (
            <div className="resume-v2-empty"><FileText size={44} /><h2>Start with the resume you already use.</h2><p>BragStack will reconstruct company names, job titles, dates and accomplishments so you can verify the data before targeting a job.</p></div>
          )}
        </section>

        <aside className="resume-v2-panel resume-v2-right">
          <div className="resume-v2-label">ATS Gate Check</div>
          <p className="resume-v2-gate-intro">Three checks: can the resume be parsed cleanly, does it visibly support the target role, and is it easy for a recruiter to scan?</p>
          <div className="resume-v2-gates">
            <GateCard title="Parse Gate" icon={FileText} status={parseGate} />
            <GateCard title="Qualification Gate" icon={Target} status={qualificationGate} />
            <GateCard title="Recruiter Gate" icon={BriefcaseBusiness} status={recruiterGate} />
          </div>

          {missingCoreSections.length > 0 && <div className="resume-v2-card"><h3><AlertTriangle size={15} /> Parser review</h3><p>We did not confidently detect {missingCoreSections.join(" and ")}. Confirm the content before applying.</p></div>}

          {result && <>
            <div className="resume-v2-card"><h3><CheckCircle2 size={15} /> Signals already visible</h3><div className="resume-v2-evidence-list">{supportedEvidence.map((item) => <div className="resume-v2-evidence" key={item.term}><div><strong>{item.term}</strong>{item.excerpt && item.excerpt !== item.source && <small>{item.excerpt}</small>}</div><span className={item.sourceKind === "impact-receipt" ? "proof" : ""}>{item.sourceKind === "impact-receipt" ? "Proof · " : ""}{item.source}</span></div>)}</div></div>
            <div className="resume-v2-card"><h3><Target size={15} /> Not visible yet</h3>{result.unsupported_requirements?.length ? <><p className="resume-v2-gap-note">These signals were detected in the job posting but are not clearly visible in this resume. That does not mean you lack them.</p><div className="resume-v2-gaps">{result.unsupported_requirements.slice(0, 12).map((term) => <span className="resume-v2-gap" key={term}>{term}</span>)}</div></> : <p>No major detected gaps in the current comparison.</p>}</div>

            {proofSuggestions.length > 0 && <div className="resume-v2-proof-card"><h3>Evidence-backed proof suggestions</h3><p>These come from your BragStack career proof. Place them under the correct employer only when that role is where the work actually happened.</p>{resumeDraft?.experience?.length > 0 && <select className="resume-v2-proof-select" value={proofRoleIndex} onChange={(event) => setProofRoleIndex(Number(event.target.value))}>{resumeDraft.experience.map((role, index) => <option key={role.id || index} value={index}>{role.company || "Employer"} — {role.title || "Role"}</option>)}</select>}<div className="resume-v2-proof-list">{proofSuggestions.slice(0, 5).map((bullet) => <div className="resume-v2-proof-item" key={proofKey(bullet)}><p>{bullet.text}</p><button type="button" onClick={() => addProofToRole(bullet)} disabled={!resumeDraft?.experience?.length}>Add to selected role</button></div>)}</div></div>}

            <div className="resume-v2-actions">
              <button type="button" onClick={() => setAtsTextMode(true)}><Eye size={15} /> ATS text</button>
              <button type="button" onClick={() => downloadText(`${targetRole.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume"}.txt`, plainText)}><Download size={15} /> Text file</button>
              <button type="button" onClick={() => window.print()}><Download size={15} /> Print / PDF</button>
              <button type="button" onClick={handleSave}><Save size={15} /> Save version</button>
              <button className="primary" type="button" onClick={practiceFromResume}><Video size={15} /> Practice interview from this resume</button>
            </div>
          </>}

          {!result && importedResume && importConfirmed && <div className="resume-v2-card"><h3><ShieldCheck size={15} /> Ready for the job check</h3><p>Paste the target job description. BragStack will compare it with the confirmed resume and your career proof without inventing missing experience.</p></div>}
          {!importedResume && <div className="resume-v2-card"><h3><Upload size={15} /> First: reconstruct the resume</h3><p>Upload the document so employer names, job titles, dates and bullets can be verified before matching starts.</p></div>}
          {message && <p className="resume-v2-message">{String(message)}</p>}
        </aside>
      </section>
    </main>
  );
}