import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Database, FileDown, ShieldCheck } from "lucide-react";
import { getExecutiveImpactDashboard, requestExecutiveExport } from "./api";
import "./ExecutiveImpactPage.css";

const LENSES = ["all", "revenue", "reliability", "customer", "efficiency", "risk", "people-development"];

export default function ExecutiveImpactPage() {
  const [lens, setLens] = useState("all");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { let active = true; getExecutiveImpactDashboard(lens === "all" ? null : lens).then((value) => { if (active) { setData(value); setError(""); } }).catch((requestError) => active && setError(requestError.response?.data?.detail?.message || "The command center could not be loaded.")); return () => { active = false; }; }, [lens]);
  async function exportBoard() { try { const result = await requestExecutiveExport(data.goals.map((goal) => goal.id), "board"); setNotice(`${result.status === "queued" ? "Export queued" : "Export ready"}: ${result.watermark}`); } catch { setNotice("The bounded export could not be queued."); } }
  if (error) return <main className="page executive-impact"><section className="executive-error"><ShieldCheck /><h1>Executive Impact Command Center</h1><p>{error}</p><a href="/docs#executive-impact">Read the Enterprise guide</a></section></main>;
  if (!data) return <main className="page executive-impact"><p>Loading authorized organizational outcomes…</p></main>;
  return <main className="page executive-impact">
    <header className="executive-header"><div><span className="plan-badge">Enterprise</span><p className="eyebrow">Observed outcomes · source-backed</p><h1>Executive Impact Command Center</h1><p>Strategic progress with visible evidence, freshness, coverage, and limitations. Association is not proof of causation.</p></div><button className="btn primary" type="button" disabled={!data.goals.length} onClick={exportBoard}><FileDown size={18}/> Queue board export</button></header>
    {notice && <p className="export-notice" role="status">{notice}</p>}
    <section className="governance-strip"><ShieldCheck/><span>No individual productivity scores</span><span>Cohorts under {data.governance.minimum_cohort_size} suppressed</span><span>Permission-aware drill-through</span></section>
    <section className="summary-grid" aria-label="Outcome summary"><article><strong>{data.summary.goals}</strong><span>Strategic goals</span></article><article><strong>{data.summary.at_risk}</strong><span>Need attention</span></article><article><strong>{data.summary.source_backed}/{data.summary.metrics}</strong><span>Source-backed metrics</span></article><article><strong>{data.summary.suppressed}</strong><span>Privacy-suppressed</span></article></section>
    <div className="lens-row" aria-label="Outcome lens">{LENSES.map((item) => <button type="button" className={lens === item ? "active" : ""} onClick={() => setLens(item)} key={item}>{item.replace("-", " ")}</button>)}</div>
    {!data.goals.length ? <section className="empty-command-center"><Database/><h2>No authorized goals yet</h2><p>Data-quality gaps remain visible; BragStack never invents a measurement.</p></section> : <section className="goal-list">{data.goals.map((goal) => <article className="goal-card" key={goal.id}><header><div><span className={`status ${goal.status}`}>{goal.status}</span><h2>{goal.title}</h2><p>{goal.description}</p></div><dl><div><dt>Owner</dt><dd>{goal.owner}</dd></div><div><dt>Period</dt><dd>{goal.period}</dd></div></dl></header><div className="metric-table-wrap"><table><caption className="sr-only">Metrics for {goal.title}</caption><thead><tr><th>Outcome</th><th>Baseline → target</th><th>Actual</th><th>Freshness</th><th>Evidence and limitations</th></tr></thead><tbody>{goal.metrics.map((metric) => <tr key={metric.key}><td><strong>{metric.definition}</strong><small>{metric.lens} · {metric.owner}</small></td><td>{metric.baseline ?? "Missing"} → {metric.target ?? "Missing"} {metric.unit}</td><td>{metric.suppressed ? "Suppressed" : metric.actual == null ? "Missing" : `${metric.actual} ${metric.unit}`}</td><td><span className={`freshness ${metric.freshness}`}>{metric.freshness === "current" ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>} {metric.freshness}</span></td><td><p>{metric.limitations}</p>{metric.sources.map((source) => <a href={source.reference.startsWith("http") ? source.reference : undefined} key={source.reference}>{source.title}<ArrowUpRight size={13}/></a>)}</td></tr>)}</tbody></table></div></article>)}</section>}
  </main>;
}
