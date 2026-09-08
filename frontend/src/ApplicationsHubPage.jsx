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
import EducationToolkitPanel from "./EducationToolkitPanel.jsx";
import MajorExplorerPanel from "./MajorExplorerPanel.jsx";
import ScholarshipCatalogPanel from "./ScholarshipCatalogPanel.jsx";
import StudentOpportunitySearchPanel from "./StudentOpportunitySearchPanel.jsx";
import { getApplicationIntelligence } from "./applicationIntelligenceApi.js";
import "./ApplicationsHubPage.css";

const EDUCATION_FEATURES = [
  {
    id: "education-profile",
    group: "record",
    title: "My Education",
    icon: GraduationCap,
    blurb: "Capture meaningful degree, program, school, and learning milestones as reusable career evidence.",
    href: "/app/accomplishments?create=1&education_feature=education",
  },
  {
    id: "coursework",
    group: "record",
    title: "Coursework",
    icon: BookOpenCheck,
    blurb: "Save courses, labs, assignments, and learning that demonstrate real knowledge and skills.",
    href: "/app/accomplishments?create=1&education_feature=coursework",
  },
  {
    id: "academic-projects",
    group: "record",
    title: "Academic Projects",
    icon: BriefcaseBusiness,
    blurb: "Document capstones, research, labs, presentations, builds, and class projects with your contribution clearly identified.",
    href: "/app/accomplishments?create=1&education_feature=academic-projects",
  },
  {
    id: "certifications",
    group: "record",
    title: "Certifications & Training",
    icon: Award,
    blurb: "Track certifications, licenses, bootcamps, professional training, and continuing education.",
    href: "/app/accomplishments?create=1&education_feature=certifications",
  },
  {
    id: "academic-achievements",
    group: "record",
    title: "Academic Achievements",
    icon: Award,
    blurb: "Capture honors, scholarships, awards, competition results, recognition, and meaningful academic wins.",
    href: "/app/accomplishments?create=1&education_feature=achievements",
  },
  {
    id: "group-projects",
    group: "record",
    title: "Group Project Contributions",
    icon: BriefcaseBusiness,
    blurb: "Separate the team result from what you personally designed, built, researched, organized, or delivered.",
    href: "/app/accomplishments?create=1&education_feature=group-projects",
  },
  {
    id: "graduation-progress",
    group: "record",
    title: "Graduation Progress",
    icon: Target,
    blurb: "Record meaningful program milestones, completed requirements, practicums, capstones, and progress points.",
    href: "/app/accomplishments?create=1&education_feature=graduation-progress",
  },
  {
    id: "experience-translator",
    group: "record",
    title: "Experience Translator",
    icon: Sparkles,
    blurb: "Translate what you actually did in class, research, clubs, service, or training into evidence-backed career language.",
    href: "/app/accomplishments?create=1&education_feature=experience-translator",
  },
  {
    id: "major-explorer",
    group: "career",
    title: "Major Explorer",
    icon: Lightbulb,
    blurb: "Explore possible majors from your demonstrated evidence without fit percentages, admissions odds, or a fake 'best major' verdict.",
    href: "#major-explorer",
  },
  {
    id: "impact-receipts",
    group: "career",
    title: "Education Impact Receipts",
    icon: ShieldCheck,
    blurb: "See which education records are ready for stronger proof, contribution detail, results, and supporting evidence.",
    href: "/app/impact-receipts",
  },
  {
    id: "education-skills",
    group: "career",
    title: "Skills from Education",
    icon: Lightbulb,
    blurb: "See professional skill signals demonstrated by your coursework, projects, training, research, and service.",
    href: "/app/intelligence",
  },
  {
    id: "career-match",
    group: "career",
    title: "Career Match & Skill Gaps",
    icon: Target,
    blurb: "Compare demonstrated evidence with broad career directions and identify what your saved record does not show clearly yet.",
    href: "/app/intelligence",
  },
  {
    id: "resume-builder",
    group: "career",
    title: "Résumé Builder",
    icon: FilePenLine,
    blurb: "Find the education evidence best prepared for evidence-grounded résumé material before you open the builder.",
    href: "/app/resume-builder",
  },
  {
    id: "interview-prep",
    group: "career",
    title: "Interview Prep",
    icon: BriefcaseBusiness,
    blurb: "Find interview-ready education stories where you can explain your action, result, skills, and learning accurately.",
    href: "/app/interview-practice",
  },
  {
    id: "academic-portfolio",
    group: "career",
    title: "Academic Portfolio",
    icon: GraduationCap,
    blurb: "Review which education records are strong portfolio candidates while keeping visibility fully under your control.",
    href: "/app/profile",
  },
  {
    id: "career-paths",
    group: "career",
    title: "Career Path Explorer",
    icon: Lightbulb,
    blurb: "Explore broad work directions connected to skills your saved evidence actually demonstrates, backed by official public references.",
    href: "/app/intelligence",
  },
];

const WORKFLOWS = [
  {
    id: "scholarship",
    title: "Scholarships",
    icon: Award,
    blurb: "Search current scholarships, then use your saved wins to prepare a stronger, evidence-backed application.",
    accent: "gold",
  },
  {
    id: "special-program",
    title: "Programs",
    icon: GraduationCap,
    blurb: "Find nearby training and support programs connected to career directions already showing up in your evidence.",
    accent: "violet",
  },
  {
    id: "internship",
    title: "Internships",
    icon: BriefcaseBusiness,
    blurb: "Search current internship listings around you using career and skill directions from your saved evidence.",
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

function educationToolFromUrl() {
  const requested = new URLSearchParams(window.location.search).get("tool");
  return EDUCATION_FEATURES.some((feature) => feature.id === requested && requested !== "major-explorer") ? requested : "";
}

function fitLabel(value) {
  if (value === "strong") return "Strong for this goal";
  if (value === "relevant") return "Useful for this goal";
  return "Keep building this story";
}

function FeatureGrid({ group, title, description, selectedTool, onOpenTool }) {
  const features = EDUCATION_FEATURES.filter((feature) => feature.group === group);
  return <section className="education-feature-section" aria-label={title}>
    <div className="education-feature-heading">
      <div><p className="applications-kicker"><GraduationCap size={15} /> {title}</p><h2>{description}</h2></div>
      <span>{features.length} tools</span>
    </div>
    <div className="education-feature-grid">
      {features.map(({ id, title: featureTitle, icon: Icon, blurb }) => (
        <button
          type="button"
          className={`education-feature-card ${selectedTool === id ? "active" : ""}`}
          onClick={() => onOpenTool(id)}
          key={id}
          data-education-feature={id}
          aria-pressed={selectedTool === id}
        >
          <span className="education-feature-icon"><Icon size={22} /></span>
          <span className="education-feature-copy"><strong>{featureTitle}</strong><small>{blurb}</small></span>
          <ChevronRight size={18} />
        </button>
      ))}
    </div>
  </section>;
}

function ApplicationsHubPage() {
  const [applicationType, setApplicationType] = useState(workflowFromUrl);
  const [activeEducationTool, setActiveEducationTool] = useState(educationToolFromUrl);
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
    if (type !== applicationType) {
      setLoading(true);
      setError("");
      setNotice("");
      setApplicationType(type);
      const next = new URL(window.location.href);
      next.searchParams.set("type", type);
      window.history.replaceState({}, "", `${next.pathname}${next.search}`);
    }
    window.setTimeout(() => document.getElementById("education-opportunity-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function openEducationTool(toolId) {
    if (toolId === "major-explorer") {
      setActiveEducationTool("");
      const next = new URL(window.location.href);
      next.searchParams.delete("tool");
      window.history.replaceState({}, "", `${next.pathname}${next.search}#major-explorer`);
      window.setTimeout(() => document.getElementById("major-explorer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      return;
    }
    setActiveEducationTool(toolId);
    const next = new URL(window.location.href);
    next.searchParams.set("tool", toolId);
    window.history.replaceState({}, "", `${next.pathname}${next.search}`);
  }

  function closeEducationTool() {
    setActiveEducationTool("");
    const next = new URL(window.location.href);
    next.searchParams.delete("tool");
    window.history.replaceState({}, "", `${next.pathname}${next.search}`);
    window.setTimeout(() => document.querySelector('[data-education-feature]')?.focus(), 0);
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
    const heading = `${activeWorkflow.title} — my Boasted wins`;
    const lines = selectedEvidence.flatMap((item, index) => [
      `${index + 1}. ${item.title} — ${item.category} · ${item.entry_type}`,
      `   ${item.fit_reasons.join("; ")}`,
    ]);
    const footer = applicationType === "essay-prep"
      ? "\nUse these as story ideas only. Write the essay in your own voice and keep every claim accurate."
      : "\nCheck the real requirements before submitting anything. Boasted helps you organize your story; it does not predict who gets selected.";
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
        <h1>Turn what you&apos;re learning into proof you can use.</h1>
        <p>Track coursework, projects, certifications, research, awards, milestones, service, and contributions, then reuse that real evidence for applications, résumés, interviews, portfolios, and career planning.</p>
      </div>
      <div className="applications-trust"><ShieldCheck size={20} /><span><strong>Your education story stays yours.</strong><small>Private by default · built from your real wins · no admissions score</small></span></div>
    </header>

    <FeatureGrid group="record" title="Build your education record" description="Start with the kind of learning or achievement you want to capture." selectedTool={activeEducationTool} onOpenTool={openEducationTool} />
    <FeatureGrid group="career" title="Turn education into career proof" description="Reuse what you saved instead of starting from a blank page every time." selectedTool={activeEducationTool} onOpenTool={openEducationTool} />

    <EducationToolkitPanel toolId={activeEducationTool} onSelectTool={openEducationTool} onClose={closeEducationTool} />

    <MajorExplorerPanel />

    <section className="education-application-section" aria-label="Application tools">
      <div className="education-feature-heading"><div><p className="applications-kicker"><Target size={15} /> Application tools</p><h2>Find the real opportunities and the real wins that can help you pursue them.</h2></div><span>Search + evidence intelligence</span></div>
      <div className="application-workflow-grid">
        {WORKFLOWS.map(({ id, title, icon: Icon, blurb, accent }) => <button type="button" key={id} className={`application-workflow-card ${accent} ${applicationType === id ? "active" : ""}`} onClick={() => chooseWorkflow(id)}>
          <span className="application-workflow-icon"><Icon size={22} /></span>
          <span><strong>{title}</strong><small>{blurb}</small></span>
          <ChevronRight size={18} />
        </button>)}
      </div>
    </section>

    <div id="education-opportunity-workspace">
      {applicationType === "scholarship" && <ScholarshipCatalogPanel />}
      {applicationType === "special-program" && <StudentOpportunitySearchPanel mode="programs" />}
      {applicationType === "internship" && <StudentOpportunitySearchPanel mode="internships" />}
    </div>

    {loading && <BragStackLoader compact message={`Looking through your wins for ${activeWorkflow.title.toLowerCase()}…`} detail="Reviewing what you actually saved without making up achievements or experiences." />}

    {!loading && error && <section className="application-error"><strong>Could not load your Education workspace.</strong><span>{error}</span><button type="button" onClick={retryLoad}><RefreshCw size={16} /> Try again</button></section>}

    {!loading && data && <>
      <section className="application-overview">
        <div><p className="applications-kicker"><Target size={15} /> {activeWorkflow.title}</p><h2>Here&apos;s what your saved wins can already help you talk about.</h2><p>{activeWorkflow.blurb}</p></div>
        <div className="application-stats">
          <div><strong>{data.summary?.education_accomplishments ?? 0}</strong><span>education & learning wins</span></div>
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
            <small>{notice || (applicationType === "essay-prep" ? "Boasted helps you remember the story. You stay the writer." : "These are starting points from your own record—not a prediction of who will choose you.")}</small>
          </section>

          <section className="application-gaps-card">
            <p className="applications-kicker"><Lightbulb size={14} /> Next steps</p>
            <h3>What could make your story stronger</h3>
            {(data.gaps || []).length ? <div className="application-gap-list">{data.gaps.map((gap) => <div key={gap.dimension}><strong>{gap.label}</strong><p>{gap.detail}</p><span>{gap.action}</span></div>)}</div> : <p className="application-no-gaps">You already have wins touching every major area for this goal. Keep adding the moments you are proud of as they happen.</p>}
            <a className="application-secondary-action" href="/app/accomplishments?create=1">Capture another win <ChevronRight size={15} /></a>
          </section>
        </aside>
      </div>

      <section className="application-methodology"><ShieldCheck size={17} /><p><strong>Education Intelligence v2</strong> organizes the accomplishments you really saved and powers the dedicated Education toolkit. It does not make up activities, give you an admissions or career score, or promise scholarships, internships, acceptance, graduation, employment, or salary. You stay in control of your story.</p></section>
    </>}
  </main>;
}

export default ApplicationsHubPage;
