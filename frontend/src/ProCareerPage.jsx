import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import PacketBuilderPanel from "./PacketBuilderPanel";
import PacketsPage from "./PacketsPage.jsx";
import PerformancePacketPreview from "./PerformancePacketPreview";
import { getAllTimeCareerReport, getPerformancePacket } from "./api";
import "./ProCareerPage.css";

const PACKET_TYPES = new Set(["performance-review", "promotion", "interview", "certification"]);
const ORBIT = [
  [50, 8], [79, 18], [91, 45], [80, 76], [55, 91],
  [27, 83], [9, 59], [12, 29], [31, 12], [68, 10],
];

const titleCase = (value = "") => String(value).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const percent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

async function getCareerIntelligence() {
  const token = localStorage.getItem("bragstack_token");
  const response = await fetch(`${getApiBaseUrl()}/career-intelligence`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (response.status === 401) {
    localStorage.removeItem("bragstack_token");
    window.location.assign("/login");
    throw new Error("Authentication required");
  }
  if (!response.ok) throw new Error(`Career Intelligence request failed (${response.status})`);
  return response.json();
}

function CoverageRing({ label, value, detail, tone }) {
  const shown = percent(value);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (shown / 100) * circumference;
  return <article className={`pro-coverage-ring pro-coverage-${tone}`}>
    <div className="pro-ring-visual" aria-label={`${label}: ${shown}%`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="pro-ring-track" cx="50" cy="50" r={radius} />
        <circle className="pro-ring-progress" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} style={{ "--coverage-offset": offset }} />
      </svg>
      <strong>{shown}%</strong>
    </div>
    <div><span>{label}</span><p>{detail}</p></div>
  </article>;
}

function CareerOrbit({ graph, profile }) {
  const all = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const nodes = [
    ...all.filter((node) => node.type === "domain").slice(0, 4),
    ...all.filter((node) => node.type === "skill").slice(0, 6),
  ].slice(0, ORBIT.length);
  const positions = new Map(nodes.map((node, index) => [node.id, { x: ORBIT[index][0], y: ORBIT[index][1] }]));
  const realEdges = (graph?.edges || []).filter((edge) => positions.has(edge.source) && positions.has(edge.target));
  const edges = realEdges.length ? realEdges : nodes.map((node) => ({ source: "core", target: node.id, relationship: "signal" }));

  if (!nodes.length) return <div className="pro-orbit-empty"><BrainCircuit size={30} /><strong>Your evidence constellation is waiting for more proof.</strong><p>Add skills to accomplishments and Boasted will map how they combine into career domains.</p></div>;

  return <div className="pro-orbit" role="img" aria-label="Evidence graph connecting demonstrated skills and career domains">
    <svg className="pro-orbit-lines" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="pro-orbit-halo" cx="50" cy="50" r="24" />
      <circle className="pro-orbit-halo pro-orbit-halo-wide" cx="50" cy="50" r="40" />
      {edges.map((edge, index) => {
        const start = edge.source === "core" ? { x: 50, y: 50 } : positions.get(edge.source);
        const end = positions.get(edge.target);
        if (!start || !end) return null;
        return <line key={`${edge.source}-${edge.target}-${index}`} className={`pro-orbit-edge pro-orbit-edge-${edge.relationship}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} style={{ "--edge-delay": `${index * 90}ms` }} />;
      })}
    </svg>
    <div className="pro-orbit-core"><Sparkles size={18} /><span>Combined signal</span><strong>{profile?.headline || "Career evidence"}</strong></div>
    {nodes.map((node, index) => <div className={`pro-orbit-node pro-orbit-node-${node.type}`} key={node.id} style={{ left: `${ORBIT[index][0]}%`, top: `${ORBIT[index][1]}%`, "--orbit-delay": `${index * 80}ms` }} title={`${node.label}: ${node.demonstrations || 0} distinct demonstrations`}>
      <span>{node.type === "domain" ? "Domain" : titleCase(node.trajectory || node.signal || "Skill")}</span><strong>{node.label}</strong><small>{node.demonstrations || 0} demos</small>
    </div>)}
  </div>;
}

function TrajectoryLanes({ profile, skills }) {
  const fallback = (trajectory) => skills.filter((skill) => skill.trajectory === trajectory).map((skill) => skill.skill).slice(0, 6);
  const lanes = [
    ["current-core", "Current core", "Repeated + recent", profile?.current_core_skills],
    ["active", "Active", "Repeated with recent proof", profile?.active_skills],
    ["recent-emerging", "Emerging now", "New signals to watch", profile?.recent_emerging_skills],
    ["historical-core", "Historical core", "Durable, not recent", profile?.historical_core_skills],
  ];
  return <div className="pro-trajectory-lanes">{lanes.map(([key, label, helper, profileSkills], index) => {
    const items = profileSkills?.length ? profileSkills : fallback(key);
    return <div className={`pro-trajectory-lane pro-lane-${key}`} key={key} style={{ "--lane-delay": `${index * 90}ms` }}>
      <div className="pro-lane-label"><span>{label}</span><small>{helper}</small></div>
      <div className="pro-lane-track">{items.length ? items.map((skill) => <span className="pro-lane-chip" key={`${key}-${skill}`}>{skill}</span>) : <span className="pro-lane-empty">No signal yet</span>}</div>
      <strong>{items.length}</strong>
    </div>;
  })}</div>;
}

function SkillPulse({ skills }) {
  if (!skills.length) return <p className="pro-empty">Add skills to accomplishments to reveal your trajectory.</p>;
  return <div className="pro-skill-pulse">{skills.slice(0, 8).map((skill, index) => {
    const recent = Number(skill.recent_demonstrations) || 0;
    const historical = Number(skill.historical_demonstrations) || 0;
    const undated = Number(skill.undated_demonstrations) || 0;
    const total = Math.max(1, recent + historical + undated, Number(skill.demonstrations) || 0);
    return <article className="pro-skill-row" key={skill.skill} style={{ "--row-delay": `${index * 65}ms` }}>
      <div className="pro-skill-row-head"><div><strong>{skill.skill}</strong><span className={`pro-trajectory-badge pro-trajectory-${skill.trajectory || "undated"}`}>{titleCase(skill.trajectory || skill.signal || "emerging")}</span></div><b>{skill.demonstrations || 0} demos</b></div>
      <div className="pro-skill-timeline" aria-label={`${skill.skill}: ${recent} recent, ${historical} historical, ${undated} undated demonstrations`}>
        {recent > 0 && <i className="pro-skill-recent" style={{ width: `${(recent / total) * 100}%` }} />}
        {historical > 0 && <i className="pro-skill-historical" style={{ width: `${(historical / total) * 100}%` }} />}
        {undated > 0 && <i className="pro-skill-undated" style={{ width: `${(undated / total) * 100}%` }} />}
      </div>
      <div className="pro-skill-facts"><span>{recent} recent</span><span>{historical} historical</span><span>{skill.evidence_backed_demonstrations || 0} evidence-backed</span><span>{skill.quantified_examples || 0} quantified</span></div>
    </article>;
  })}</div>;
}

function DomainField({ domains }) {
  if (!domains.length) return <p className="pro-empty">Career domains appear when saved skills map to repeated work patterns.</p>;
  return <div className="pro-domain-field">{domains.slice(0, 6).map((domain, index) => <article className="pro-domain-card" key={domain.domain} style={{ "--domain-delay": `${index * 80}ms` }}>
    <div className="pro-domain-card-head"><span>{titleCase(domain.signal || "emerging")}</span><strong>{domain.demonstrations || 0}</strong></div>
    <h3>{domain.domain}</h3><p>{titleCase(domain.trajectory || "undated")} · {domain.recent_demonstrations || 0} recent demonstrations</p>
    <div className="pro-domain-skills">{(domain.skills || []).slice(0, 4).map((skill) => <span key={`${domain.domain}-${skill}`}>{skill}</span>)}</div>
  </article>)}</div>;
}

function AnalyticsCareerPage() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("packet");
  const packetMode = PACKET_TYPES.has(requested) ? requested : null;
  const [report, setReport] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [packet, setPacket] = useState(null);
  const [building, setBuilding] = useState(false);
  const [options, setOptions] = useState({ packetType: packetMode || "performance-review", careerArea: "", roleTitle: "", organization: "", targetRole: "", targetLevel: "", targetOrganization: "", selectedEntryIds: [], includeEvidenceReferences: false, confidential: true, exportFormat: "pdf", theme: "modern-minimal" });

  async function load({ refresh = false } = {}) {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      if (packetMode) setReport(await getAllTimeCareerReport());
      else {
        const [reportData, intelligenceData] = await Promise.all([getAllTimeCareerReport(), getCareerIntelligence()]);
        setReport(reportData); setIntelligence(intelligenceData);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || "Career analytics could not be loaded.");
    } finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => {
    let active = true;
    const request = packetMode
      ? getAllTimeCareerReport().then((reportData) => ({ reportData, intelligenceData: null }))
      : Promise.all([getAllTimeCareerReport(), getCareerIntelligence()]).then(([reportData, intelligenceData]) => ({ reportData, intelligenceData }));
    request.then(({ reportData, intelligenceData }) => {
      if (!active) return;
      setReport(reportData); if (intelligenceData) setIntelligence(intelligenceData);
    }).catch((requestError) => { if (active) setError(requestError.response?.data?.detail || requestError.message || "Career analytics could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [packetMode]);

  async function build() {
    if (!report) return;
    setBuilding(true); setError("");
    try { const data = await getPerformancePacket(undefined, undefined, options); setPacket(data.packet); }
    catch (requestError) { setError(requestError.response?.data?.detail || "This packet could not be built."); }
    finally { setBuilding(false); }
  }

  const skills = useMemo(() => Array.isArray(intelligence?.skills) ? intelligence.skills : [], [intelligence]);
  const domains = useMemo(() => Array.isArray(intelligence?.career_graph?.domains) ? intelligence.career_graph.domains : [], [intelligence]);

  if (packet) return <PerformancePacketPreview packet={packet} preferredFormat={options.exportFormat} onBack={() => setPacket(null)} />;
  if (loading) return <BragStackLoader compact message="Analyzing your career proof…" detail="Mapping skill durability, evidence quality, career domains, and trajectory." />;

  if (packetMode) return <main className="pro-career-page">
    <header className="pro-page-header"><div><span>BOASTED PRO · CAREER PACKETS</span><h1>{packetMode === "promotion" ? "Build your promotion case." : packetMode === "interview" ? "Build your interview packet." : packetMode === "certification" ? "Build your certification packet." : "Build your performance review."}</h1><p>Turn recorded accomplishments, evidence, results, and skills into a focused professional artifact.</p></div></header>
    {error && <div className="pro-error">{String(error)}</div>}
    <div id="packet-builder"><PacketBuilderPanel options={options} onChange={setOptions} onBuild={() => void build()} isLoading={building} error={error} highlights={report?.highlights || []} /></div>
  </main>;

  const totals = report?.totals || {};
  const summary = intelligence?.summary || {};
  const profile = intelligence?.career_profile || {};
  const graph = intelligence?.career_graph || {};
  const gaps = Array.isArray(intelligence?.gaps) ? intelligence.gaps : [];
  const recommendations = Array.isArray(intelligence?.recommended_actions) ? intelligence.recommended_actions : [];
  const distinct = summary.distinct_demonstrations ?? ((totals.entries || 0) + (totals.impact_receipts || 0));
  const proofRecords = summary.total_proof_records ?? ((totals.entries || 0) + (totals.impact_receipts || 0));
  const currentStrengths = (summary.current_core_skill_count || 0) + (summary.active_skill_count || 0);

  return <main className="pro-career-page pro-analytics-studio">
    <header className="pro-page-header pro-analytics-header"><div><span>BOASTED PRO · CAREER ANALYTICS</span><h1>Watch your career story take shape.</h1><p>Boasted analyzes the proof you saved—not job-title guesses—to show durability, momentum, evidence quality, and the career domains your work actually supports.</p></div><button onClick={() => void load({ refresh: true })} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "pro-spin" : ""} />{refreshing ? "Re-analyzing" : "Refresh intelligence"}</button></header>
    {error && <div className="pro-error">{String(error)}</div>}

    <section className="pro-signal-shell">
      <article className="pro-signal-copy"><span className="pro-section-kicker"><BrainCircuit size={15} /> COMBINED CAREER SIGNAL</span><h2>{profile.headline || "Your evidence-backed career signal is still forming."}</h2><p>{profile.trajectory_summary || profile.summary || "Add more dated accomplishments and skills to reveal repeated strengths, recent growth, and historical depth."}</p><div className="pro-signal-chips">{(profile.evidence_domains || []).slice(0, 4).map((domain) => <span key={domain}>{domain}</span>)}{profile.maturity && <span className="pro-chip-muted">{titleCase(profile.maturity)} proof foundation</span>}</div><div className="pro-signal-stats"><div><strong>{proofRecords}</strong><span>proof records</span></div><div><strong>{distinct}</strong><span>distinct demonstrations</span></div><div><strong>{summary.career_domain_count || domains.length}</strong><span>career domains</span></div></div></article>
      <article className="pro-orbit-panel"><div className="pro-panel-heading"><div><span>EVIDENCE CONSTELLATION</span><h2>How your proof connects</h2></div><Sparkles size={20} /></div><CareerOrbit graph={graph} profile={profile} /></article>
    </section>

    <section className="pro-kpis pro-kpis-intelligence" aria-label="Career intelligence summary"><article><BarChart3 size={18} /><strong>{summary.canonical_skill_count ?? skills.length}</strong><span>Canonical skills</span><small>Exact aliases normalized</small></article><article><TrendingUp size={18} /><strong>{currentStrengths}</strong><span>Current repeated strengths</span><small>Current-core + active</small></article><article><Sparkles size={18} /><strong>{summary.recent_emerging_skill_count || 0}</strong><span>Emerging now</span><small>Recent new signals</small></article><article><ShieldCheck size={18} /><strong>{summary.evidence_items ?? totals.evidence_items ?? 0}</strong><span>Evidence items</span><small>Files and references attached</small></article></section>

    <section className="pro-intelligence-grid">
      <article className="pro-analytics-panel"><div className="pro-panel-heading"><div><span>PROOF QUALITY</span><h2>How complete is your evidence?</h2></div><Gauge size={22} /></div><p className="pro-panel-copy">Each ring answers a different question. Nothing is rolled into a mystery score.</p><div className="pro-coverage-grid"><CoverageRing label="Quantified impact" value={summary.quantified_coverage_percent} detail={`${summary.quantified_results || 0} measurable demonstrations`} tone="violet" /><CoverageRing label="Evidence-backed" value={summary.evidence_coverage_percent} detail={`${summary.evidence_backed_demonstrations || 0} demonstrations with evidence`} tone="cyan" /><CoverageRing label="Confirmed" value={summary.confirmation_coverage_percent} detail={`${summary.confirmed_demonstrations || 0} confirmed demonstrations`} tone="green" /><CoverageRing label="Receipt coverage" value={summary.receipt_coverage_percent} detail={`${totals.impact_receipts || summary.impact_receipts || 0} Impact Receipts`} tone="pink" /></div></article>
      <article className="pro-analytics-panel"><div className="pro-panel-heading"><div><span>TRAJECTORY</span><h2>Current, emerging, and historical</h2></div><TrendingUp size={22} /></div><p className="pro-panel-copy">Recency stays separate from proof strength, so a new one-off cannot outrank durable work just because it happened yesterday.</p><TrajectoryLanes profile={profile} skills={skills} /></article>
    </section>

    <section className="pro-intelligence-grid pro-intelligence-grid-wide">
      <article className="pro-analytics-panel"><div className="pro-panel-heading"><div><span>SKILL PULSE</span><h2>Where demonstrations live in time</h2></div><BarChart3 size={22} /></div><div className="pro-skill-legend"><span><i className="legend-recent" />Recent</span><span><i className="legend-historical" />Historical</span><span><i className="legend-undated" />Undated</span></div><SkillPulse skills={skills} /></article>
      <article className="pro-analytics-panel"><div className="pro-panel-heading"><div><span>CAREER DOMAINS</span><h2>What your skills combine to support</h2></div><Target size={22} /></div><p className="pro-panel-copy">Domains use curated skill relationships plus distinct demonstrations—not résumé-title matching.</p><DomainField domains={domains} /></article>
    </section>

    <section className="pro-insight-deck"><article className="pro-insight-brief"><div className="pro-panel-heading"><div><span>CAREER BRIEF</span><h2>What Boasted sees in your proof</h2></div><BrainCircuit size={22} /></div><p>{profile.graph_summary || profile.summary || "Your combined proof becomes more specific as you capture repeated work, dates, and evidence."}</p><div className="pro-brief-facts"><span><b>{summary.current_core_skill_count || 0}</b> current-core skills</span><span><b>{summary.historical_core_skill_count || 0}</b> historical-core skills</span><span><b>{summary.normalized_alias_group_count || 0}</b> normalized aliases</span></div></article><article className="pro-next-actions"><div className="pro-panel-heading"><div><span>NEXT MOVES</span><h2>Strengthen the record</h2></div><CheckCircle2 size={22} /></div>{recommendations.length ? <ol>{recommendations.slice(0, 4).map((action, index) => <li key={`${index}-${action}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{action}</p></li>)}</ol> : <p className="pro-empty">Keep capturing fresh work. Boasted will surface actions when it detects a gap.</p>}</article></section>

    {gaps.length > 0 && <section className="pro-gap-section"><div className="pro-panel-heading"><div><span>EVIDENCE GAPS</span><h2>What would make your career story stronger?</h2></div><ShieldCheck size={22} /></div><div className="pro-gap-grid">{gaps.slice(0, 4).map((gap, index) => <article key={gap.type || index}><span>{titleCase(gap.type || "Gap")}</span><h3>{gap.title}</h3><p>{gap.detail}</p>{gap.action && <strong>{gap.action}</strong>}</article>)}</div></section>}

    <footer className="pro-methodology-note"><span>Verified deterministic analysis · {intelligence?.methodology?.version || "career-intelligence"}</span><p>Boasted summarizes user-owned career evidence. It does not predict hiring, promotion, salary, or career success.</p></footer>
  </main>;
}

export default function ProCareerPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("packets") === "1") return <PacketsPage />;
  return <AnalyticsCareerPage />;
}
