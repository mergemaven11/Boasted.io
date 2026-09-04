import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, LockKeyhole, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import axios from "axios";
import "./AIVerificationPage.css";

function getBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const api = axios.create({ baseURL: getBaseUrl() });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const LABELS = {
  resume_builder: "Resume Builder",
  career_intelligence: "Career Intelligence",
  interview_practice: "Aisha / Interview Practice",
  evidence_assistant: "Evidence Assistant",
};

function StatusPill({ ok, children }) {
  return <span className={`ai-verify-pill ${ok ? "ok" : "warn"}`}>{ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{children}</span>;
}

function AIVerificationPage() {
  const [summary, setSummary] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [summaryResponse, policyResponse] = await Promise.all([
        api.get("/ops/ai-verification/summary?days=30"),
        api.get("/ops/ai-verification/release-policy"),
      ]);
      setSummary(summaryResponse.data);
      setPolicy(policyResponse.data);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      setError(requestError.response?.data?.detail || "AI verification metrics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const features = useMemo(() => Object.entries(summary?.features || {}), [summary]);
  const resumeGate = summary?.release_gate?.resume_builder;

  if (loading) return <main className="ai-verify-page"><div className="ai-verify-loading"><RefreshCw className="ai-verify-spin" size={22} /> Loading verification telemetry…</div></main>;
  if (error) return <main className="ai-verify-page"><section className="ai-verify-error"><XCircle size={22} /><div><strong>AI verification unavailable</strong><p>{String(error)}</p><button type="button" onClick={() => void load()}>Try again</button></div></section></main>;

  return <main className="ai-verify-page">
    <header className="ai-verify-header">
      <div><p>INTERNAL · RELEASE QUALITY</p><h1><BrainCircuit size={30} /> AI verification dashboard</h1><span>Track grounding, provenance, fabrication failures, and release readiness across BragStack smart features.</span></div>
      <button type="button" onClick={() => void load()}><RefreshCw size={16} /> Refresh</button>
    </header>

    <section className={`ai-release-gate ${resumeGate?.ready ? "ready" : "blocked"}`}>
      <div className="ai-release-icon">{resumeGate?.ready ? <ShieldCheck size={30} /> : <LockKeyhole size={30} />}</div>
      <div><p>OPEN SIGN-UP GATE · RESUME QUALITY</p><h2>{resumeGate?.ready ? "Resume suggestion gate is ready" : "Resume suggestion gate is not ready yet"}</h2><span>{resumeGate?.ready ? "Required quality thresholds are currently satisfied." : "Open sign-ups stay blocked on this gate until the required sample count and zero-fabrication thresholds are satisfied."}</span></div>
      <StatusPill ok={Boolean(resumeGate?.ready)}>{resumeGate?.ready ? "READY" : "BLOCKED"}</StatusPill>
    </section>

    <section className="ai-verify-grid">
      {features.map(([key, feature]) => <article className="ai-feature-card" key={key}>
        <div className="ai-feature-title"><div><span>{LABELS[key] || key}</span><small>{feature.instrumented ? `${feature.samples} verification samples` : "No verification samples yet"}</small></div><StatusPill ok={feature.instrumented && feature.failed === 0}>{feature.instrumented ? `${feature.pass_rate}% pass` : "NOT VERIFIED"}</StatusPill></div>
        <div className="ai-feature-stats"><div><span>Passed</span><strong>{feature.passed}</strong></div><div><span>Failed</span><strong>{feature.failed}</strong></div><div><span>Samples</span><strong>{feature.samples}</strong></div></div>
        {feature.top_error_codes?.length ? <div className="ai-error-codes">{feature.top_error_codes.map((item) => <span key={item.code}>{item.code}<b>{item.count}</b></span>)}</div> : <p className="ai-no-errors">{feature.instrumented ? "No verification failures in this window." : "Instrumentation must be added before this feature can be called verified."}</p>}
      </article>)}
    </section>

    <section className="ai-verify-columns">
      <article className="ai-panel">
        <div className="ai-panel-title"><div><p>RESUME BUILDER</p><h2>Hard release checks</h2></div><ShieldCheck size={22} /></div>
        <div className="ai-check-list">{Object.entries(resumeGate?.checks || {}).map(([key, ok]) => <div key={key}><span>{ok ? <CheckCircle2 size={17} /> : <XCircle size={17} />}{key.replaceAll("_", " ")}</span><b>{ok ? "PASS" : "BLOCK"}</b></div>)}</div>
        <p className="ai-threshold-note">Minimum samples: {resumeGate?.thresholds?.minimum_samples ?? 20}. Required pass rate: 100%. Unsupported numeric, provenance, and fabrication failures allowed: 0.</p>
      </article>

      <article className="ai-panel">
        <div className="ai-panel-title"><div><p>PRIVACY</p><h2>What this dashboard stores</h2></div><LockKeyhole size={22} /></div>
        <ul className="ai-privacy-list"><li>Quality metadata and error codes</li><li>Provider/model/version identifiers</li><li>Source and generated-item counts</li><li><strong>No resume text</strong></li><li><strong>No job description</strong></li><li><strong>No private evidence or generated output body</strong></li></ul>
      </article>
    </section>

    <section className="ai-panel ai-failures-panel">
      <div className="ai-panel-title"><div><p>FAILURES</p><h2>Recent verification errors</h2></div><AlertTriangle size={22} /></div>
      {summary?.recent_failures?.length ? <div className="ai-failures-table"><div className="ai-failures-row header"><span>Feature</span><span>Task</span><span>Errors</span><span>Provider / model</span><span>Time</span></div>{summary.recent_failures.map((item, index) => <div className="ai-failures-row" key={`${item.feature}-${item.task}-${index}`}><span>{LABELS[item.feature] || item.feature}</span><span>{item.task}</span><span>{(item.violation_codes || []).join(", ") || "unknown"}</span><span>{[item.provider, item.model_id, item.model_revision].filter(Boolean).join(" · ") || "—"}</span><span>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</span></div>)}</div> : <p className="ai-empty">No recorded verification failures in the current window.</p>}
    </section>

    <section className="ai-policy-note"><strong>Policy {policy?.policy_version}</strong><span>Experimental model-backed AI: <b>{policy?.experimental_model_ai_enabled ? "ENABLED" : "OFF"}</b> · Evaluation suite: {policy?.evaluation_suite_version}</span><p>Untracked smart features are treated as <b>not verified</b>, never as passing.</p></section>
  </main>;
}

export default AIVerificationPage;
