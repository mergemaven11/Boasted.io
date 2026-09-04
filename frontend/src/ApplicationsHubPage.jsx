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
    title: "Scholarship",
    icon: Award,
    blurb: "Find service, leadership, academic, initiative, and persistence evidence.",
    accent: "gold",
  },
  {
    id: "special-program",
    title: "Special Program",
    icon: GraduationCap,
    blurb: "Match real experiences to selective summer, honors, research, and enrichment programs.",
    accent: "violet",
  },
  {
    id: "internship",
    title: "Internship",
    icon: BriefcaseBusiness,
    blurb: "Turn school, project, service, and work evidence into stronger internship material.",
    accent: "blue",
  },
  {
    id: "essay-prep",
    title: "Essay Prep",
    icon: FilePenLine,
    blurb: "Surface real stories about growth, curiosity, challenge, values, and contribution.",
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
  if (value === "strong") return "Strong evidence fit";
  if (value === "relevant") return "Relevant evidence";
  return "Worth reviewing";
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
        setError(requestError.message || "Application guidance could not be loaded.");
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
    const heading = `${activeWorkflow.title} evidence shortlist`;
    const lines = selectedEvidence.flatMap((item, index) => [
      `${index + 1}. ${item.title} — ${item.category} · ${item.entry_type}`,
      `   ${item.fit_reasons.join("; ")}`,
    ]);
    const footer = applicationType === "essay-prep"
      ? "\nUse these as story candidates only. Draft the essay in your own voice and keep every claim accurate."
      : "\nReview the actual application requirements before submitting. BragStack does not predict selection outcomes.";
    try {
      await navigator.clipboard.writeText([heading, ...lines, footer].join("\n"));
      setNotice(applicationType === "essay-prep" ? "Story candidates copied" : "Evidence shortlist copied");
    } catch {
      setNotice("Shortlist ready — copy from your browser if clipboard access is blocked");
    }
    window.setTimeout(() => setNotice(""), 2500);
  }

  return <main className="applications-hub">
    <header className="applications-hero">
      <div>
        <p className="applications-kicker"><Sparkles size={15} /> Application Workbench</p>
        <h1>Build applications from accomplishments you already earned.</h1>
        <p>BragStack finds the strongest evidence in your private record for scholarships, selective programs, internships, and essay planning. It never invents achievements or predicts whether you will be selected.</p>
      </div>
      <div className="applications-trust"><ShieldCheck size={20} /><span><strong>Your evidence stays yours.</strong><small>Private by default · deterministic ranking · no admissions score</small></span></div>
    </header>

    <section className="application-workflow-grid" aria-label="Application workflows">
      {WORKFLOWS.map(({ id, title, icon: Icon, blurb, accent }) => <button type="button" key={id} className={`application-workflow-card ${accent} ${applicationType === id ? "active" : ""}`} onClick={() => chooseWorkflow(id)}>
        <span className="application-workflow-icon"><Icon size={22} /></span>
        <span><strong>{title}</strong><small>{blurb}</small></span>
        <ChevronRight size={18} />
      </button>)}
    </section>

    {loading && <BragStackLoader compact message={`Finding your best ${activeWorkflow.title.toLowerCase()} evidence…`} detail="Reviewing your saved accomplishments and proof without inventing new claims." />}

    {!loading && error && <section className="application-error"><strong>Could not load application guidance.</strong><span>{error}</span><button type="button" onClick={retryLoad}><RefreshCw size={16} /> Try again</button></section>}

    {!loading && data && <>
      <section className="application-overview">
        <div><p className="applications-kicker"><Target size={15} /> {data.profile?.title}</p><h2>{data.profile?.description}</h2></div>
        <div className="application-stats">
          <div><strong>{data.summary?.education_accomplishments ?? 0}</strong><span>education accomplishments</span></div>
          <div><strong>{data.summary?.accomplishments_analyzed ?? 0}</strong><span>total accomplishments reviewed</span></div>
          <div><strong>{data.summary?.recommended_evidence_count ?? 0}</strong><span>evidence candidates</span></div>
        </div>
      </section>

      <div className="application-main-grid">
        <section className="application-evidence-panel">
          <div className="application-section-heading"><div><p className="applications-kicker">Evidence shortlist</p><h2>{applicationType === "essay-prep" ? "Real stories worth revisiting" : "Strong material to review first"}</h2></div><span>{selectedIds.length} selected</span></div>
          {(data.recommended_evidence || []).length === 0 ? <div className="application-empty"><BookOpenCheck size={28} /><h3>No accomplishments yet.</h3><p>Capture real school, project, service, work, leadership, or learning experiences first. BragStack cannot build an application from evidence that does not exist.</p><a href="/app/accomplishments?create=1">Add an accomplishment</a></div> : <div className="application-evidence-list">
            {(data.recommended_evidence || []).map((item) => {
              const selected = selectedIds.includes(item.entry_id);
              return <article className={`application-evidence-card ${selected ? "selected" : ""}`} key={item.entry_id}>
                <button type="button" className="application-select" aria-pressed={selected} onClick={() => toggleEntry(item.entry_id)}><span>{selected && <Check size={14} />}</span>{selected ? "Selected" : "Select"}</button>
                <div className="application-evidence-heading"><div><span className={`application-fit ${item.fit_strength}`}>{fitLabel(item.fit_strength)}</span><h3>{item.title}</h3><p>{item.category} · {item.entry_type}</p></div></div>
                <div className="application-dimensions">{(item.matched_dimensions || []).map((dimension) => <span key={dimension}>{LABELS[dimension] || dimension.replaceAll("_", " ")}</span>)}</div>
                <ul>{(item.fit_reasons || []).map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <div className="application-proof-flags">{item.has_measurable_detail && <span>Measurable detail</span>}{item.has_evidence && <span>Evidence attached</span>}{item.has_confirmation && <span>Confirmed</span>}</div>
              </article>;
            })}
          </div>}
        </section>

        <aside className="application-side-panel">
          <section className="application-shortlist-card">
            <p className="applications-kicker">Your shortlist</p>
            <h3>{selectedEvidence.length ? `${selectedEvidence.length} pieces of evidence selected` : "Choose evidence to use"}</h3>
            {selectedEvidence.length > 0 && <ol>{selectedEvidence.map((item) => <li key={item.entry_id}>{item.title}</li>)}</ol>}
            <button type="button" disabled={!selectedEvidence.length} onClick={() => void copyShortlist()}>{applicationType === "essay-prep" ? "Copy story candidates" : "Copy evidence shortlist"}</button>
            {applicationType === "internship" && <a className="application-secondary-action" href="/app/resume-builder">Continue to Resume Builder <ChevronRight size={15} /></a>}
            <small>{notice || (applicationType === "essay-prep" ? "BragStack surfaces stories; you write the essay in your own voice." : "Use this shortlist as prep material, not as a prediction of selection.")}</small>
          </section>

          <section className="application-gaps-card">
            <p className="applications-kicker"><Lightbulb size={14} /> Evidence gaps</p>
            <h3>What your record could show more clearly</h3>
            {(data.gaps || []).length ? <div className="application-gap-list">{data.gaps.map((gap) => <div key={gap.dimension}><strong>{gap.label}</strong><p>{gap.detail}</p><span>{gap.action}</span></div>)}</div> : <p className="application-no-gaps">Your saved evidence touches every core dimension in this workflow. Keep the strongest examples current and accurate.</p>}
          </section>
        </aside>
      </div>

      <section className="application-methodology"><ShieldCheck size={17} /><p><strong>Education Intelligence v1</strong> ranks your own saved accomplishments for relevance. It does not generate admissions odds, scholarship odds, or invented activities. Program requirements vary, so always compare this shortlist against the actual application.</p></section>
    </>}
  </main>;
}

export default ApplicationsHubPage;
