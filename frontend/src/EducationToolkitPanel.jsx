import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import BragStackLoader from "./BragStackLoader.jsx";
import { getEducationToolkit } from "./educationToolkitApi.js";
import "./EducationToolkitPanel.css";

function supportLabel(level) {
  if (level === "well-supported") return "Evidence + confirmation";
  if (level === "supported") return "Supporting proof";
  return "Saved record";
}

export default function EducationToolkitPanel({ toolId, onSelectTool, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!toolId) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    getEducationToolkit(toolId)
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
        window.setTimeout(() => {
          document.getElementById("education-toolkit")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        setData(null);
        setError(requestError.message || "This Education tool could not be loaded.");
        setLoading(false);
      });
    return () => { active = false; };
  }, [toolId, refreshKey]);

  if (!toolId) return null;

  return <section className="education-toolkit-panel" id="education-toolkit" aria-live="polite">
    <div className="education-toolkit-shell">
      <div className="education-toolkit-topline">
        <p className="applications-kicker"><Sparkles size={15} /> Education tool</p>
        <button type="button" className="education-toolkit-close" onClick={onClose} aria-label="Close Education tool"><X size={18} /></button>
      </div>

      {loading && <BragStackLoader compact message="Building this from your education evidence…" detail="Checking your saved records, proof, skills, and missing details without inventing experience." />}

      {!loading && error && <div className="application-error">
        <strong>Could not open this Education tool.</strong>
        <span>{error}</span>
        <button type="button" onClick={() => setRefreshKey((current) => current + 1)}><RefreshCw size={16} /> Try again</button>
      </div>}

      {!loading && data && <>
        <header className="education-toolkit-hero">
          <div>
            <span className="education-toolkit-mode">{data.tool?.mode || "evidence"}</span>
            <h2>{data.tool?.title}</h2>
            <p>This is a working view of your saved education proof—not a shortcut to a generic page.</p>
          </div>
          <div className="education-toolkit-trust"><ShieldCheck size={20}/><span><strong>Evidence first</strong><small>No fit percentage · no admissions odds · no invented claims</small></span></div>
        </header>

        <div className="education-toolkit-stats">
          <div><strong>{data.summary?.education_records ?? 0}</strong><span>education records</span></div>
          <div><strong>{data.summary?.records_with_impact_receipts ?? 0}</strong><span>with Impact Receipts</span></div>
          <div><strong>{data.summary?.demonstrated_skill_signals ?? 0}</strong><span>skill signals</span></div>
          <div><strong>{data.summary?.career_directions_to_explore ?? 0}</strong><span>directions to explore</span></div>
        </div>

        <div className="education-toolkit-main">
          <div className="education-toolkit-column">
            <section className="education-toolkit-card">
              <div className="education-toolkit-heading"><BookOpenCheck size={19}/><div><span>YOUR RECORD</span><h3>Evidence this tool can use now</h3></div></div>
              {(data.recommended_evidence || []).length ? <div className="education-toolkit-evidence-list">
                {data.recommended_evidence.map((item) => <article key={item.entry_id}>
                  <div className="education-toolkit-evidence-title"><div><strong>{item.title}</strong><small>{item.category} · {item.entry_type}</small></div><span>{supportLabel(item.support_level)}</span></div>
                  <div className="education-toolkit-reasons">{(item.reasons || []).map((reason) => <span key={reason}><CheckCircle2 size={13}/>{reason}</span>)}</div>
                  {(item.missing_details || []).length > 0 && <p><Lightbulb size={14}/> Could strengthen: {item.missing_details.join(", ")}</p>}
                </article>)}
              </div> : <div className="education-toolkit-empty">
                <GraduationCap size={28}/><strong>No matching education evidence yet.</strong><p>Start with one real course, project, credential, milestone, research experience, service activity, or contribution.</p>
              </div>}
            </section>

            {(data.skill_signals || []).length > 0 && <section className="education-toolkit-card">
              <div className="education-toolkit-heading"><Sparkles size={19}/><div><span>DEMONSTRATED SKILLS</span><h3>Skills supported by what you saved</h3></div></div>
              <div className="education-skill-grid">{data.skill_signals.map((skill) => <article key={skill.skill}>
                <strong>{skill.skill}</strong><span>{skill.demonstrations} supporting {skill.demonstrations === 1 ? "record" : "records"} · {skill.signal}</span>
                <small>{(skill.evidence_titles || []).join(" · ")}</small>
              </article>)}</div>
              <p className="education-toolkit-footnote">A skill signal means your record contains supporting evidence. It is not a mastery score.</p>
            </section>}

            {(data.career_directions || []).length > 0 && <section className="education-toolkit-card">
              <div className="education-toolkit-heading"><Target size={19}/><div><span>EXPLORE</span><h3>Career directions connected to your evidence</h3></div></div>
              <div className="education-career-grid">{data.career_directions.map((direction) => <article key={direction.id}>
                <strong>{direction.title}</strong>
                <p>Evidence signals: {direction.demonstrated_skills.join(", ")}</p>
                <small>Examples: {direction.example_work_areas.join(" · ")}</small>
              </article>)}</div>
              <p className="education-toolkit-footnote">These are broad directions for exploration, not a “best career” verdict. Use official occupation information and real requirements before making decisions.</p>
            </section>}
          </div>

          <aside className="education-toolkit-side">
            <section className="education-toolkit-card">
              <div className="education-toolkit-heading"><Lightbulb size={19}/><div><span>SMART CHECKLIST</span><h3>What to do next</h3></div></div>
              <div className="education-toolkit-checklist">{(data.tool?.prompts || []).map((prompt) => <div key={prompt}><CheckCircle2 size={16}/><span>{prompt}</span></div>)}</div>
              {data.tool?.primary_action && <a className="education-toolkit-primary" href={data.tool.primary_action.href}>{data.tool.primary_action.label}<ArrowRight size={16}/></a>}
              {(data.tool?.secondary_actions || []).map((action) => <button type="button" className="education-toolkit-secondary" key={action.tool_id} onClick={() => onSelectTool(action.tool_id)}>{action.label}<ArrowRight size={15}/></button>)}
            </section>

            <section className="education-toolkit-card">
              <div className="education-toolkit-heading"><Target size={19}/><div><span>STRENGTHEN</span><h3>Evidence gaps, not personal deficits</h3></div></div>
              {(data.gaps || []).length ? <div className="education-toolkit-gap-list">{data.gaps.map((gap) => <article key={`${gap.label}-${gap.detail}`}><strong>{gap.label}</strong><p>{gap.detail}</p><span>{gap.action}</span></article>)}</div> : <p className="education-toolkit-footnote">The records shown here already contain the core details this tool looks for. Keep them accurate as they change.</p>}
            </section>

            <section className="education-toolkit-card education-toolkit-sources">
              <div className="education-toolkit-heading"><ExternalLink size={19}/><div><span>PUBLIC SOURCES</span><h3>Trusted reference data</h3></div></div>
              <p>Boasted uses official sources for taxonomy and exploration context. Your personal evidence still comes only from what you saved.</p>
              <div>{(data.sources || []).map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer"><span><strong>{source.name}</strong><small>{source.publisher} · {source.version}</small></span><ExternalLink size={14}/></a>)}</div>
            </section>

            <div className="education-toolkit-privacy"><LockKeyhole size={17}/><p><strong>Your records stay under your control.</strong> This analysis never changes visibility, publishes records, or treats missing proof as a negative student score.</p></div>
          </aside>
        </div>
      </>}
    </div>
  </section>;
}
