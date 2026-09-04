import {
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  FilePenLine,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BragStackLoader from "./BragStackLoader.jsx";
import { getApplicationIntelligence } from "./applicationIntelligenceApi.js";
import "./ApplicationsHubPage.css";

const WORKFLOWS = [
  {
    id: "scholarship",
    title: "Scholarships",
    icon: Award,
    blurb: "Find the wins that show leadership, service, academics, initiative, and follow-through.",
    accent: "gold",
  },
  {
    id: "special-program",
    title: "Programs",
    icon: GraduationCap,
    blurb: "Use real projects, interests, competitions, research, and growth for programs you want to pursue.",
    accent: "violet",
  },
  {
    id: "internship",
    title: "Internships",
    icon: BriefcaseBusiness,
    blurb: "Turn school, projects, service, clubs, and work into examples that show what you can do.",
    accent: "blue",
  },
  {
    id: "essay-prep",
    title: "Essay Stories",
    icon: FilePenLine,
    blurb: "Rediscover real moments about growth, curiosity, challenges, values, and what matters to you.",
    accent: "green",
  },
];

const LABELS = {
  leadership: "Leadership",
  service: "Service",
  academics: "Academics",
  initiative: "Initiative",
  persistence: "Persistence",
  subject_depth: "Subject depth",
  curiosity: "Curiosity",
  collaboration: "Collaboration",
  growth: "Growth",
  skills: "Skills",
  responsibility: "Responsibility",
  results: "Results",
  teamwork: "Teamwork",
  identity_values: "Identity & values",
  challenge: "Challenge",
  initiative_contribution: "Initiative & contribution",
};

function workflowFromUrl() {
  const requested = new URLSearchParams(window.location.search).get("type");
  return WORKFLOWS.some((workflow) => workflow.id === requested) ? requested : "scholarship";
}

function fitLabel(value) {
  if (value === "strong") return "Strong for this goal";
  if (value === "relevant") return "Useful for this goal";
  return "Keep building this story";
}

function ApplicationsHubPage() {
  const [applicationType, setApplicationType] = useState(workflowFromUrl);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const activeWorkflow = WORKFLOWS.find((workflow) => workflow.id === applicationType) || WORKFLOWS[0];

  useEffect(() => {
    let active = true;
    getApplicationIntelligence(applicationType)
      .then((result) => {
        if (!active) return;
        setData(result);
        setSelectedIds((result.recommended_evidence || []).slice(0, 3).map((item) => item.entry_id));
        setError("");
        setNotice("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        setError(requestError.message || "Your Education workspace could not be loaded.");
        setData(null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [applicationType, refreshKey]);

  function chooseWorkflow(type) {
    if (type === applicationType) return;
    setLoading(true);
    setError("");
    setNotice("");
    setApplicationType(type);
    const next = new URL(window.location.href);
    next.searchParams.set("type", type);
    window.history.replaceState({}, "", `${next.pathname}${next.search}`);
  }

  function retryLoad() {
    setLoading(true);
    setError("");
    setNotice("");
    setRefreshKey((current) => current + 1);
  }

  function toggleEntry(entryId) {
    setSelectedIds((current) => current.includes(entryId)
      ? current.filter((id) => id !== entryId)
      : [...current, entryId].slice(-8));
  }

  const selectedEvidence = useMemo(() => {
    const recommendations = data?.recommended_evidence || [];
    return selectedIds.map((id) => recommendations.find((item) => item.entry_id === id)).filter(Boolean);
  }, [data, selectedIds]);

  async function copyShortlist() {
    if (!selectedEvidence.length) return;
    const heading = `${activeWorkflow.title} — my BragStack wins`;
    const lines = selectedEvidence.flatMap((item, index) => [
      `${index + 1}. ${item.title} — ${item.category} · ${item.entry_type}`,
      `   ${item.fit_reasons.join("; ")}`,
    ]);
    const footer = applicationType === "essay-prep"
      ? "\nUse these as story ideas only. Write the essay in your own voice and keep every claim accurate."
      : "\nCheck the real requirements before submitting anything. BragStack helps you organize your story; it does not predict who gets selected.";
    try {
      await navigator.clipboard.writeText([heading, ...lines, footer].join("\n"));
      setNotice(applicationType === "essay-prep" ? "Story ideas copied" : "Your wins were copied");
    } catch {
      setNotice("Your shortlist is ready — copy it from your browser if clipboard access is blocked");
    }
    window.setTimeout(() => setNotice(""), 2500);
  }

  return <main className="applications-hub">
    <header className="applications-hero">
      <div>
        <p className="applications-kicker"><Sparkles size={15} /> Education Workspace</p>
        <h1>Keep track of the wins that are shaping your future.</h1>
        <p>School moves fast. BragStack helps you remember what you did, what you learned, what you improved, and what you are proud of—from middle school through college and beyond. When an opportunity comes up, your story is already here.</p>
      </div>
      <div className="applications-trust"><ShieldCheck size={20} /><span><strong>Your school story stays yours.</strong><small>Private by default · built from your real wins · no admissions score</small></span></div>
    </header>

    <section className="application-overview">
      <div><p className="applications-kicker"><GraduationCap size={15} /> Your journey</p><h2>Middle school → High school → College / University → Career</h2><p>Capture wins as they happen so you do not have to rebuild years of growth from memory later.</p></div>
      <div className="application-stats">
        <div><strong>Learn</strong><span>what you are getting better at</span></div>
        <div><strong>Grow</strong><span>see how your story changes over time</span></div>
        <div><strong>Use it</strong><span>when the right opportunity appears</span></div>
      </div>
    </section>

    <section className="application-workflow-grid" aria-label="Ways to use your education record">
      {WORKFLOWS.map(({ id, title, icon: Icon, blurb, accent }) => <button type="button" key={id} className={`application-workflow-card ${accent} ${applicationType === id ? "active" : ""}`} onClick={() => chooseWorkflow(id)}>
        <span className="application-workflow-icon"><Icon size={22} /></span>
        <span><strong>{title}</strong><small>{blurb}</small></span>
        <ChevronRight size={18} />
      </button>)}
    </section>

    {loading && <BragStackLoader compact message={`Looking through your wins for ${activeWorkflow.title.toLowerCase()}…`} detail="Reviewing what you actually saved without making up achievements or experiences." />}

    {!loading && error && <section className="application-error"><strong>Could not load your Education workspace.</strong><span>{error}</span><button type="button" onClick={retryLoad}><RefreshCw size={16} /> Try again</button></section>}

    {!loading && data && <>
      <section className="application-overview">
        <div><p className="applications-kicker"><Target size={15} /> {activeWorkflow.title}</p><h2>Here&apos;s what your saved wins can already help you talk about.</h2><p>{activeWorkflow.blurb}</p></div>
        <div className="application-stats">
          <div><strong>{data.summary?.education_accomplishments ?? 0}</strong><span>school & learning wins</span></div>
          <div><strong>{data.summary?.accomplishments_analyzed ?? 0}</strong><span>total wins reviewed</span></div>
          <div><strong>{data.summary?.recommended_evidence_count ?? 0}</strong><span>good examples to start with</span></div>
        </div>
      </section>

      <div className="application-main-grid">
        <section className="application-evidence-panel">
          <div className="application-section-heading"><div><p className="applications-kicker">Your wins</p><h2>{applicationType === "essay-prep" ? "Real moments worth remembering" : "Wins worth using for this goal"}</h2></div><span>{selectedIds.length} picked</span></div>
          {(data.recommended_evidence || []).length === 0 ? <div className="application-empty"><BookOpenCheck size={28} /><h3>Your story starts with one win.</h3><p>Add something you are proud of: a project, class achievement, club, competition, volunteer experience, job, leadership moment, performance, award, or skill you worked hard to build.</p><a href="/app/accomplishments?create=1">Add my first win</a></div> : <div className="application-evidence-list">
            {(data.recommended_evidence || []).map((item) => {
              const selected = selectedIds.includes(item.entry_id);
              return <article className={`application-evidence-card ${selected ? "selected" : ""}`} key={item.entry_id}>
                <button type="button" className="application-select" aria-pressed={selected} onClick={() => toggleEntry(item.entry_id)}><span>{selected && <Check size={14} />}</span>{selected ? "Picked" : "Pick this win"}</button>
                <div className="application-evidence-heading"><div><span className={`application-fit ${item.fit_strength}`}>{fitLabel(item.fit_strength)}</span><h3>{item.title}</h3><p>{item.category} · {item.entry_type}</p></div></div>
                <div className="application-dimensions">{(item.matched_dimensions || []).map((dimension) => <span key={dimension}>{LABELS[dimension] || dimension.replaceAll("_", " ")}</span>)}</div>
                <ul>{(item.fit_reasons || []).map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <div className="application-proof-flags">{item.has_measurable_detail && <span>Has details</span>}{item.has_evidence && <span>Proof attached</span>}{item.has_confirmation && <span>Confirmed</span>}</div>
              </article>;
            })}
          </div>}
        </section>

        <aside className="application-side-panel">
          <section className="application-shortlist-card">
            <p className="applications-kicker">Use these for this goal</p>
            <h3>{selectedEvidence.length ? `${selectedEvidence.length} win${selectedEvidence.length === 1 ? "" : "s"} picked` : "Pick the wins you want to use"}</h3>
            {selectedEvidence.length > 0 && <ol>{selectedEvidence.map((item) => <li key={item.entry_id}>{item.title}</li>)}</ol>}
            <button type="button" disabled={!selectedEvidence.length} onClick={() => void copyShortlist()}>{applicationType === "essay-prep" ? "Copy my story ideas" : "Copy my wins"}</button>
            {applicationType === "internship" && <a className="application-secondary-action" href="/app/resume-builder">Turn these into a resume <ChevronRight size={15} /></a>}
            <small>{notice || (applicationType === "essay-prep" ? "BragStack helps you remember the story. You stay the writer." : "These are starting points from your own record—not a prediction of who will choose you.")}</small>
          </section>

          <section className="application-gaps-card">
            <p className="applications-kicker"><Lightbulb size={14} /> Next steps</p>
            <h3>What could make your story stronger</h3>
            {(data.gaps || []).length ? <div className="application-gap-list">{data.gaps.map((gap) => <div key={gap.dimension}><strong>{gap.label}</strong><p>{gap.detail}</p><span>{gap.action}</span></div>)}</div> : <p className="application-no-gaps">You already have wins touching every major area for this goal. Keep adding the moments you are proud of as they happen.</p>}
            <a className="application-secondary-action" href="/app/accomplishments?create=1">Capture another win <ChevronRight size={15} /></a>
          </section>
        </aside>
      </div>

      <section className="application-methodology"><ShieldCheck size={17} /><p><strong>Education Intelligence v1</strong> organizes the accomplishments you really saved. It does not make up activities, give you an admissions score, or promise scholarships, internships, or acceptance. You stay in control of your story.</p></section>
    </>}
  </main>;
}

export default ApplicationsHubPage;
