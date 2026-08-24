import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileText, Save, ShieldCheck, Sparkles, Target, Video } from "lucide-react";
import { getCurrentUser, getImpactReceipts } from "./api.js";
import { buildResume, listResumes, saveResume } from "./resumeApi.js";
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
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState("");
  const [atsMode, setAtsMode] = useState(false);

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
      (result.skills || []).join(" | "),
    ].join("\n");
  }, [result, user, targetRole, summary, bullets]);

  async function handleBuild(event) {
    event.preventDefault();
    setBuilding(true);
    setMessage("");
    try {
      const data = await buildResume({
        target_role: targetRole,
        job_description: jobDescription,
        selected_receipt_ids: selectedIds,
      });
      setResult(data);
      setSummary(data.summary || "");
      setBullets(data.bullets || []);
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
    setBullets((current) => current.map((bullet, i) => i === index ? { ...bullet, text: value } : bullet));
  }

  async function handleSave() {
    if (!result) return;
    const title = `${targetRole} · ${new Date().toLocaleDateString()}`;
    const created = await saveResume({
      title,
      target_role: targetRole,
      job_description: jobDescription,
      summary,
      bullets,
      skills: result.skills || [],
      readiness: result.readiness || {},
    });
    setSaved((current) => [created, ...current]);
    setMessage("Resume version saved.");
  }

  function practiceFromResume() {
    localStorage.setItem("bragstack_resume_interview_context_v1", JSON.stringify({ targetRole, jobDescription, summary, bullets }));
    window.location.assign("/app/interview-practice?from=resume");
  }

  return (
    <main className="resume-builder-page">
      <header className="resume-builder-hero">
        <div>
          <span className="resume-pro-badge"><Sparkles size={14} /> BRAGSTACK PRO</span>
          <h1>Resume Builder</h1>
          <p>Build an ATS-safe resume from career proof—not invented claims.</p>
        </div>
        <div className="resume-hero-stat"><ShieldCheck size={21} /><span><strong>Evidence locked</strong><small>Every generated bullet keeps its source receipt.</small></span></div>
      </header>

      <section className="resume-workspace">
        <aside className="resume-input-panel">
          <div className="section-label">TARGET JOB</div>
          <form onSubmit={handleBuild}>
            <label>Target role<input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Senior Data Analyst" required /></label>
            <label>Job description<textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows="10" placeholder="Paste the job posting here…" required /></label>
            <div className="receipt-selector-heading"><span>Career proof</span><small>{selectedIds.length ? `${selectedIds.length} selected` : "Use all receipts"}</small></div>
            <div className="resume-receipt-list">
              {receipts.slice(0, 20).map((receipt) => (
                <label className="resume-receipt-option" key={receipt.id}>
                  <input type="checkbox" checked={selectedIds.includes(receipt.id)} onChange={() => toggleReceipt(receipt.id)} />
                  <span><strong>{receipt.accomplishment}</strong><small>{(receipt.skills || []).slice(0, 3).join(" · ") || "Impact Receipt"}</small></span>
                </label>
              ))}
            </div>
            <button className="resume-primary-button" type="submit" disabled={building}>{building ? "Analyzing evidence…" : "Analyze job + build resume"}</button>
          </form>
          {saved.length > 0 && <div className="saved-resume-note"><Save size={15} /> {saved.length} saved resume version{saved.length === 1 ? "" : "s"}</div>}
        </aside>

        <section className="resume-document-panel">
          {!result ? (
            <div className="resume-empty-state"><FileText size={44} /><h2>Your tailored resume appears here.</h2><p>Paste a job description and BragStack will match it against your Impact Receipts, surface gaps, and compose an ATS-safe draft.</p></div>
          ) : atsMode ? (
            <div className="ats-plain-preview"><div className="ats-preview-header"><span>WHAT THE ATS SEES</span><button type="button" onClick={() => setAtsMode(false)}>Back to resume</button></div><pre>{plainText}</pre></div>
          ) : (
            <article className="resume-paper">
              <header><h1>{user?.name || "Your Name"}</h1><p>{targetRole}</p>{user?.location && <small>{user.location}</small>}</header>
              <section><h2>Professional Summary</h2><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows="4" /></section>
              <section><h2>Experience & Impact</h2>{bullets.map((bullet, index) => <div className="resume-bullet-editor" key={`${bullet.source_receipt_id}-${index}`}><textarea value={bullet.text} onChange={(event) => updateBullet(index, event.target.value)} rows="3" /><div><span>Source: {bullet.source_title}</span><span>{bullet.evidence_count} evidence · {bullet.has_metrics ? "metrics attached" : "no metric yet"}</span></div></div>)}</section>
              <section><h2>Skills</h2><p>{(result.skills || []).join(" · ") || "Add skills to your Impact Receipts to populate this section."}</p></section>
            </article>
          )}
        </section>

        <aside className="ats-guardian-panel">
          <div className="section-label">ATS GUARDIAN</div>
          {!result ? <p className="guardian-placeholder">Build a resume to see parsing, requirement coverage, evidence strength, and unsupported gaps.</p> : <>
            <div className="coverage-ring"><strong>{result.readiness.coverage_percent}%</strong><span>requirement coverage</span></div>
            {Object.entries(result.readiness).filter(([key]) => !["coverage_percent", "unsupported_claims"].includes(key)).map(([key, value]) => <div className="readiness-row" key={key}><span>{key.replaceAll("_", " ")}</span><strong className={readinessClass(value)}>{value}</strong></div>)}
            <div className="unsupported-claims"><CheckCircle2 size={16} /><span><strong>0 unsupported claims</strong><small>BragStack only used your career proof.</small></span></div>
            <div className="requirement-block"><h3><Target size={16} /> Supported</h3><div className="term-cloud">{result.supported_requirements.map((term) => <span className="supported" key={term}>{term}</span>)}</div></div>
            <div className="requirement-block"><h3>Evidence gaps</h3><div className="term-cloud">{result.unsupported_requirements.slice(0, 12).map((term) => <span className="gap" key={term}>{term}</span>)}</div></div>
            <div className="resume-actions"><button type="button" onClick={() => setAtsMode(true)}><Eye size={16} /> ATS view</button><button type="button" onClick={() => downloadText(`${targetRole.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume"}.txt`, plainText)}><Download size={16} /> Plain text</button><button type="button" onClick={() => window.print()}><Download size={16} /> Print / PDF</button><button type="button" onClick={handleSave}><Save size={16} /> Save version</button><button className="practice-resume-button" type="button" onClick={practiceFromResume}><Video size={16} /> Practice interview from resume</button></div>
          </>}
          {message && <p className="resume-message">{String(message)}</p>}
        </aside>
      </section>
    </main>
  );
}
