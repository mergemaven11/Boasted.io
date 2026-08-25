import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Eye, FileText, Pencil, Plus, Save, ShieldCheck, Sparkles, Target, Trash2, Upload, Video, X } from "lucide-react";
import { getCurrentUser, getImpactReceipts } from "./api.js";
import { buildResume, importResume, listResumes, saveResume } from "./resumeApi.js";
import "./ResumeBuilderPage.css";

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function readinessClass(value) {
  if (value === "Excellent" || value === "Strong") return "good";
  if (value === "Moderate") return "warn";
  return "bad";
}

function sourceLabel(bullet) {
  if (bullet.source_kind === "imported") return "Imported resume";
  if (bullet.source_kind === "manual") return "Manual edit";
  return bullet.source_title || "Impact Receipt";
}

function sectionTitle(key) {
  return {
    summary: "Professional Summary",
    experience: "Experience",
    skills: "Skills",
    education: "Education",
    projects: "Projects",
  }[key] || key;
}

function ImportedResumePreview({ importedResume, user }) {
  const sections = importedResume?.sections || {};
  const headerLines = importedResume?.header_lines || [];
  const primaryName = headerLines[0] || user?.name || "Your Resume";
  const contactLines = headerLines.slice(1, 6);
  const sectionOrder = ["summary", "experience", "projects", "skills", "education"];

  return (
    <article className="resume-paper imported-resume-paper">
      <div className="imported-preview-banner"><CheckCircle2 size={16} /> Imported resume preview</div>
      <header>
        <h1>{primaryName}</h1>
        {contactLines.length > 0 && <div className="imported-header-lines">{contactLines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</div>}
      </header>
      {sectionOrder.map((key) => {
        const lines = sections[key] || [];
        if (!lines.length) return null;
        return (
          <section key={key} className={`imported-section imported-${key}`}>
            <div className="resume-section-heading"><h2>{sectionTitle(key)}</h2></div>
            {key === "skills" ? <p className="resume-section-copy">{lines.join(" · ")}</p> : lines.map((line, index) => <p className="imported-resume-line" key={`${key}-${index}`}>{line}</p>)}
          </section>
        );
      })}
      {!Object.values(sections).some((values) => values?.length) && <section><div className="resume-section-heading"><h2>Imported text</h2></div><pre className="imported-raw-text">{importedResume?.text}</pre></section>}
    </article>
  );
}

function ImportedSupportingSections({ importedResume }) {
  const sections = importedResume?.sections || {};
  return ["projects", "education"].map((key) => {
    const lines = sections[key] || [];
    if (!lines.length) return null;
    return (
      <section key={key}>
        <div className="resume-section-heading"><h2>{sectionTitle(key)}</h2></div>
        {lines.map((line, index) => <p className="imported-resume-line" key={`${key}-${index}`}>{line}</p>)}
      </section>
    );
  });
}

export default function ResumeBuilderPage() {
  const [user, setUser] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState("");
  const [bullets, setBullets] = useState([]);
  const [skills, setSkills] = useState([]);
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState("");
  const [atsMode, setAtsMode] = useState(false);
  const [importedResume, setImportedResume] = useState(null);
  const [importing, setImporting] = useState(false);
  const [summaryEditing, setSummaryEditing] = useState(false);
  const [experienceEditing, setExperienceEditing] = useState(false);
  const [skillsEditing, setSkillsEditing] = useState(false);
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

  const editedCount = useMemo(() => bullets.filter((bullet) => bullet.edited).length, [bullets]);
  const importedCount = useMemo(() => bullets.filter((bullet) => bullet.source_kind === "imported").length, [bullets]);
  const quantifiedCount = useMemo(() => bullets.filter((bullet) => bullet.has_metrics).length, [bullets]);

  const plainText = useMemo(() => {
    if (!result) return "";
    return [
      user?.name || "YOUR NAME",
      targetRole.toUpperCase(),
      "",
      "PROFESSIONAL SUMMARY",
      summary,
      "",
      "EXPERIENCE & IMPACT",
      ...bullets.map((bullet) => `- ${bullet.text}`),
      "",
      "SKILLS",
      skills.join(" | "),
    ].join("\n");
  }, [result, user, targetRole, summary, bullets, skills]);

  async function handleImport(file) {
    if (!file) return;
    setImporting(true);
    setMessage("");
    try {
      const data = await importResume(file);
      setImportedResume(data);
      setResult(null);
      setAtsMode(false);
      setSummary(data.summary || "");
      setSkills(data.skills || []);
      setBullets((data.bullets || []).map((text) => ({
        text,
        source_receipt_id: "",
        source_title: "Imported resume",
        source_kind: "imported",
        matched_terms: [],
        evidence_count: 0,
        has_metrics: /\b\d+(?:\.\d+)?%?\b/.test(text),
        edited: false,
      })));
      setMessage(`${data.filename} imported. Your resume is shown in the center. Add the target job to get ATS advice.`);
    } catch (error) {
      setMessage(error.response?.data?.detail || "We could not import that resume.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleBuild(event) {
    event.preventDefault();
    setBuilding(true);
    setMessage("");
    try {
      const data = await buildResume({
        target_role: targetRole,
        job_description: jobDescription,
        selected_receipt_ids: selectedIds,
        existing_resume_text: importedResume?.text || "",
      });
      setResult(data);
      setSummary(data.summary || "");
      setBullets(data.bullets || []);
      setSkills(data.skills || []);
      setSummaryEditing(false);
      setExperienceEditing(false);
      setSkillsEditing(false);
    } catch (error) {
      setMessage(error.response?.data?.detail?.message || error.response?.data?.detail || "Resume could not be built.");
    } finally {
      setBuilding(false);
    }
  }

  function toggleReceipt(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function updateBullet(index, value) {
    setBullets((current) => current.map((bullet, i) => i === index ? { ...bullet, text: value, edited: true } : bullet));
  }

  function addBullet() {
    setExperienceEditing(true);
    setBullets((current) => [...current, {
      text: "Add a measurable accomplishment…",
      source_receipt_id: "",
      source_title: "Manual edit",
      source_kind: "manual",
      matched_terms: [],
      evidence_count: 0,
      has_metrics: false,
      edited: true,
    }]);
  }

  function removeBullet(index) {
    setBullets((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!result) return;
    const title = `${targetRole} · ${new Date().toLocaleDateString()}`;
    const created = await saveResume({ title, target_role: targetRole, job_description: jobDescription, summary, bullets, skills });
    setSaved((current) => [created, ...current]);
    setMessage("Resume saved. BragStack keeps imported, manual, and Impact Receipt sources separate for review.");
  }

  function practiceFromResume() {
    localStorage.setItem("bragstack_resume_interview_context_v1", JSON.stringify({ targetRole, jobDescription, summary, bullets }));
    window.location.assign("/app/interview-practice?from=resume");
  }

  const detectedSections = importedResume?.sections_found || [];
  const missingCoreSections = ["summary", "experience", "skills"].filter((section) => !detectedSections.includes(section));

  return (
    <main className="resume-builder-page">
      <header className="resume-builder-hero">
        <div><span className="resume-pro-badge"><Sparkles size={14} /> BRAGSTACK PRO</span><h1>Resume Builder</h1><p>Import what you already have. BragStack analyzes it against the job, strengthens it with your career proof, and keeps every claim editable.</p></div>
        <div className="resume-hero-stat"><ShieldCheck size={21} /><span><strong>ATS-focused coaching</strong><small>See what an ATS can read, what matches the job, and what needs strengthening.</small></span></div>
      </header>
      <section className="resume-workspace">
        <aside className="resume-input-panel">
          <div className="section-label">START WITH YOUR RESUME</div>
          <div className={`resume-import-card ${importedResume ? "ready" : ""}`} onClick={() => fileInputRef.current?.click()} role="button" tabIndex="0" onKeyDown={(event) => event.key === "Enter" && fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => handleImport(event.target.files?.[0])} hidden />
            <Upload size={22} />
            {importedResume ? <div><strong>{importedResume.filename}</strong><span>{importedResume.sections_found?.length ? `${importedResume.sections_found.join(" · ")} detected` : "Resume text imported"}</span></div> : <div><strong>{importing ? "Reading resume…" : "Upload existing resume"}</strong><span>PDF, DOCX, or TXT · up to 5 MB</span></div>}
            {importedResume && <button type="button" className="resume-import-clear" aria-label="Remove imported resume" onClick={(event) => { event.stopPropagation(); setImportedResume(null); setResult(null); setSummary(""); setBullets([]); setSkills([]); }}><X size={15} /></button>}
          </div>
          <div className="resume-or-divider"><span>then target it</span></div>
          <div className="section-label">TARGET JOB</div>
          <form onSubmit={handleBuild}>
            <label>Target role<input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Solutions Engineer" required /></label>
            <label>Job description<textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows="9" placeholder="Paste the job posting here…" required /></label>
            <div className="receipt-selector-heading"><span>Career proof</span><small>{selectedIds.length ? `${selectedIds.length} selected` : "Use all receipts"}</small></div>
            <div className="resume-receipt-list">{receipts.slice(0, 20).map((receipt) => <label className="resume-receipt-option" key={receipt.id}><input type="checkbox" checked={selectedIds.includes(receipt.id)} onChange={() => toggleReceipt(receipt.id)} /><span><strong>{receipt.accomplishment}</strong><small>{(receipt.skills || []).slice(0, 3).join(" · ") || "Impact Receipt"}</small></span></label>)}</div>
            <button className="resume-primary-button" type="submit" disabled={building || importing}>{building ? "Analyzing resume + job…" : importedResume ? "Analyze + strengthen my resume" : "Analyze job + build resume"}</button>
          </form>
          {saved.length > 0 && <div className="saved-resume-note"><Save size={15} /> {saved.length} saved resume version{saved.length === 1 ? "" : "s"}</div>}
        </aside>

        <section className="resume-document-panel">
          {atsMode && result ? <div className="ats-plain-preview"><div className="ats-preview-header"><span>ATS-FRIENDLY TEXT PREVIEW</span><button type="button" onClick={() => setAtsMode(false)}>Back to resume</button></div><pre>{plainText}</pre><small>{result.ats_note}</small></div> : result ? <article className="resume-paper">
            <header><h1>{user?.name || "Your Name"}</h1><p>{targetRole}</p>{user?.location && <small>{user.location}</small>}</header>
            <section><div className="resume-section-heading"><h2>Professional Summary</h2><button type="button" onClick={() => setSummaryEditing((value) => !value)}><Pencil size={14} /> {summaryEditing ? "Done" : "Edit"}</button></div>{summaryEditing ? <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows="4" autoFocus /> : <p className="resume-section-copy">{summary}</p>}</section>
            <section><div className="resume-section-heading"><h2>Experience & Impact</h2><div><button type="button" onClick={addBullet}><Plus size={14} /> Add</button><button type="button" onClick={() => setExperienceEditing((value) => !value)}><Pencil size={14} /> {experienceEditing ? "Done" : "Edit"}</button></div></div>{bullets.length ? bullets.map((bullet, index) => <div className={`resume-bullet-editor ${experienceEditing ? "editing" : ""}`} key={`${bullet.source_receipt_id || bullet.source_kind}-${index}`}>{experienceEditing ? <><textarea value={bullet.text} onChange={(event) => updateBullet(index, event.target.value)} rows="3" /><button className="resume-delete-bullet" type="button" onClick={() => removeBullet(index)} aria-label="Remove bullet"><Trash2 size={15} /></button></> : <p className="resume-rendered-bullet">• {bullet.text}</p>}<div><span className={`source-chip source-${bullet.source_kind || "impact-receipt"}`}>{sourceLabel(bullet)}</span><span>{bullet.source_kind === "impact-receipt" ? (bullet.edited ? "Edited · verify against source" : `${bullet.evidence_count} evidence · ${bullet.has_metrics ? "metrics attached" : "no metric yet"}`) : bullet.source_kind === "imported" ? "From your uploaded resume" : "Added by you"}</span></div></div>) : <p className="resume-empty-section">No experience bullets yet. Add one manually or connect relevant Impact Receipts.</p>}</section>
            <section><div className="resume-section-heading"><h2>Skills</h2><button type="button" onClick={() => setSkillsEditing((value) => !value)}><Pencil size={14} /> {skillsEditing ? "Done" : "Edit"}</button></div>{skillsEditing ? <textarea value={skills.join(", ")} onChange={(event) => setSkills(event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean))} rows="3" placeholder="SQL, customer discovery, solution design…" /> : <p className="resume-section-copy">{skills.join(" · ") || "Add skills here."}</p>}</section>
            <ImportedSupportingSections importedResume={result.imported_resume} />
          </article> : importedResume ? <ImportedResumePreview importedResume={importedResume} user={user} /> : <div className="resume-empty-state"><FileText size={44} /><h2>Bring your resume—or start from career proof.</h2><p>Upload an existing resume, or paste a job description and build one from your Impact Receipts.</p></div>}
        </section>

        <aside className="ats-guardian-panel">
          <div className="section-label">BRAGSTACK ATS COACH</div>
          {!result && importedResume ? <>
            <div className="ats-coach-status good"><CheckCircle2 size={18} /><span><strong>Your resume is loaded</strong><small>{importedResume.line_count || 0} readable lines detected. BragStack will coach from this document—not replace it with a blank template.</small></span></div>
            <div className="requirement-block"><h3>ATS-readable sections</h3><div className="term-cloud">{detectedSections.map((section) => <span className="supported" key={section}>{sectionTitle(section)}</span>)}</div></div>
            {missingCoreSections.length > 0 && <div className="ats-advice-card warn"><strong>Check these sections</strong><p>BragStack did not confidently detect {missingCoreSections.map(sectionTitle).join(", ")}. They may be missing or formatted in a way some ATS parsers struggle with.</p></div>}
            <div className="ats-advice-card"><strong>Next: measure job match</strong><p>Paste the target job description and click <b>Analyze + strengthen my resume</b>. We’ll compare your actual resume to the role and show what to keep, strengthen, or add.</p></div>
            <div className="ats-check-list"><span>✓ Standard section readability</span><span>✓ Requirement and keyword coverage</span><span>✓ Quantified impact</span><span>✓ Evidence-backed additions</span><span>✓ Missing requirements without inventing claims</span></div>
          </> : !result ? <p className="guardian-placeholder">Upload a resume to preview what the ATS can read, then add a target job to calculate match and get specific coaching.</p> : <>
            <div className="coverage-ring"><strong>{result.readiness.coverage_percent}%</strong><span>job requirement coverage</span></div>
            {Object.entries(result.readiness).filter(([key, value]) => !["coverage_percent", "source_linked_draft"].includes(key) && typeof value === "string").map(([key, value]) => <div className="readiness-row" key={key}><span>{key.replaceAll("_", " ")}</span><strong className={readinessClass(value)}>{value}</strong></div>)}
            <div className="ats-advice-card featured"><strong>BragStack advice</strong><p>{result.readiness.coverage_percent >= 70 ? "Your resume is covering most of the role. Focus on the remaining gaps and make the strongest matching bullets easy to scan." : result.readiness.coverage_percent >= 40 ? "You have a usable match, but several job requirements are not visible enough yet. Strengthen truthful matches before adding anything new." : "The current resume is not signaling enough of this role yet. Prioritize the most important missing requirements that you can honestly support."}</p>{quantifiedCount < 3 && <p><b>Impact:</b> only {quantifiedCount} bullet{quantifiedCount === 1 ? "" : "s"} show a number or metric. Add measurable outcomes where you genuinely have them.</p>}</div>
            <div className="unsupported-claims"><CheckCircle2 size={16} /><span><strong>{importedCount ? `${importedCount} imported bullet${importedCount === 1 ? "" : "s"} preserved` : editedCount ? `${editedCount} edited bullet${editedCount === 1 ? "" : "s"} need source review` : "Generated draft is source-linked"}</strong><small>{importedCount ? "Imported claims came from your resume; Impact Receipt additions remain separately source-linked." : editedCount ? "Manual edits are not automatically certified as evidence-backed." : "Generated bullets came from your Impact Receipts."}</small></span></div>
            <div className="requirement-block"><h3><Target size={16} /> Matching this job</h3><div className="term-cloud">{result.supported_requirements.map((term) => <span className="supported" key={term}>{term}</span>)}</div></div>
            <div className="requirement-block"><h3>Missing or weak signals</h3><div className="term-cloud">{result.unsupported_requirements.slice(0, 12).map((term) => <span className="gap" key={term}>{term}</span>)}</div></div>
            <div className="resume-actions"><button type="button" onClick={() => setAtsMode(true)}><Eye size={16} /> ATS-friendly view</button><button type="button" onClick={() => downloadText(`${targetRole.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume"}.txt`, plainText)}><Download size={16} /> Plain text</button><button type="button" onClick={() => window.print()}><Download size={16} /> Print / PDF</button><button type="button" onClick={handleSave}><Save size={16} /> Save version</button><button className="practice-resume-button" type="button" onClick={practiceFromResume}><Video size={16} /> Practice interview from resume</button></div>
          </>}
          {message && <p className="resume-message">{String(message)}</p>}
        </aside>
      </section>
    </main>
  );
}
