import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, LockKeyhole, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import axios from "axios";
import { AISHA_RELEASE_SUITE_VERSION, runAishaReleaseEvaluation } from "./aiVerificationReleaseEvaluation.js";
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
  education_intelligence: "Education Intelligence",
  interview_practice: "Aisha / Interview Practice",
  compliance_intelligence: "Compliance Intelligence",
  evidence_assistant: "Evidence Assistant",
};

function StatusPill({ ok, neutral = false, children }) {
  const tone = neutral ? "neutral" : ok ? "ok" : "warn";
  const icon = neutral ? <LockKeyhole size={14} /> : ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />;
  return <span className={`ai-verify-pill ${tone}`}>{icon}{children}</span>;
}

function AIVerificationPage() {
  const [summary, setSummary] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [releaseRunning, setReleaseRunning] = useState(false);
  const [releaseMessage, setReleaseMessage] = useState("");
  const [releaseFailed, setReleaseFailed] = useState(false);

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

  async function runReleaseChecks() {
    setReleaseRunning(true);
    setReleaseMessage("");
    setReleaseFailed(false);
    try {
      const serverResponse = await api.post("/ops/ai-verification/run-release-evaluation");
      const aishaCases = runAishaReleaseEvaluation();
      const aishaResponse = await api.post("/ops/ai-verification/record-aisha-release-evaluation", {
        suite_version: AISHA_RELEASE_SUITE_VERSION,
        cases: aishaCases,
      });
      const failed = Number(serverResponse.data?.resume_builder?.failed || 0)
        + Number(serverResponse.data?.compliance_intelligence?.failed || 0)
        + Number(aishaResponse.data?.failed || 0);
      const samples = Number(serverResponse.data?.resume_builder?.samples || 0)
        + Number(serverResponse.data?.compliance_intelligence?.samples || 0)
        + Number(aishaResponse.data?.samples || 0);
      setReleaseFailed(failed > 0);
      setReleaseMessage(
        failed > 0
          ? `${failed} of ${samples} release checks need attention. Review the failure codes below.`
          : `${samples} release checks passed on this deployed revision.`,
      );
      await load();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      const detail = requestError.response?.data?.detail;
      setReleaseFailed(true);
      setReleaseMessage(typeof detail === "string" ? detail : "Release checks could not be completed.");
    } finally {
      setReleaseRunning(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/ops/ai-verification/summary?days=30"),
      api.get("/ops/ai-verification/release-policy"),
    ])
      .then(([summaryResponse, policyResponse]) => {
        if (!active) return;
        setSummary(summaryResponse.data);
        setPolicy(policyResponse.data);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.response?.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        setError(requestError.response?.data?.detail || "AI verification metrics could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const features = useMemo(() => Object.entries(summary?.features || {}), [summary]);
  const resumeGate = summary?.release_gate?.resume_builder;

  if (loading) return <main className="ai-verify-page"><div className="ai-verify-loading"><RefreshCw className="ai-verify-spin" size={22} /> Loading verification telemetry…</div></main>;
  if (error) return <main className="ai-verify-page"><section className="ai-verify-error"><XCircle size={22} /><div><strong>AI verification unavailable</strong><p>{String(error)}</p><button type="button" onClick={() => void load()}>Try again</button></div></section></main>;

  return <main className="ai-verify-page">
    <header className="ai-verify-header">
      <div><p>INTERNAL · RELEASE QUALITY</p><h1><BrainCircuit size={30} /> AI verification dashboard</h1><span>Track grounding, provenance, fabrication failures, and release readiness across BragStack smart features.</span></div>
      <div className="ai-verify-actions">
        <div>
          <button type="button" className="ai-run-checks" disabled={releaseRunning} onClick={() => void runReleaseChecks()}>{releaseRunning ? <RefreshCw className="ai-verify-spin" size={16} /> : <ShieldCheck size={16} />} {releaseRunning ? "Running checks…" : "Run release checks"}</button>
          <button type="button" disabled={releaseRunning} onClick={() => void load()}><RefreshCw size={16} /> Refresh</button>
        </div>
        {releaseMessage ? <small className={releaseFailed ? "failed" : "passed"}>{releaseMessage}</small> : null}
      </div>
    </header>

    <section className={`ai-release-gate ${resumeGate?.ready ? "ready" : "blocked"}`}>
      <div className="ai-release-icon">{resumeGate?.ready ? <ShieldCheck size={30} /> : <LockKeyhole size={30} />}</div>
      <div><p>OPEN SIGN-UP GATE · RESUME QUALITY</p><h2>{resumeGate?.ready ? "Resume suggestion gate is ready" : "Resume suggestion gate is not ready yet"}</h2><span>{resumeGate?.ready ? "Required quality thresholds are currently satisfied on this deployed revision." : "Open sign-ups stay blocked on this gate until the required sample count and zero-fabrication thresholds are satisfied."}</span></div>
      <StatusPill ok={Boolean(resumeGate?.ready)}>{resumeGate?.ready ? "READY" : "BLOCKED"}</StatusPill>
    </section>

    <section className="ai-verify-grid">
      {features.map(([key, feature]) => {
        const disabledByPolicy = key === "evidence_assistant" && !policy?.experimental_model_ai_enabled;
        const sampleBreakdown = feature.instrumented
          ? `${feature.samples} samples · ${feature.runtime_samples ?? feature.samples} runtime · ${feature.evaluation_samples ?? 0} release`
          : "No verification samples yet";
        return <article className="ai-feature-card" key={key}>
          <div className="ai-feature-title">
            <div><span>{LABELS[key] || key}</span><small>{disabledByPolicy ? "Disabled by release policy" : sampleBreakdown}</small></div>
            <StatusPill neutral={disabledByPolicy} ok={feature.instrumented && feature.failed === 0}>
              {disabledByPolicy ? "DISABLED" : feature.instrumented ? `${feature.pass_rate}% pass` : "NOT VERIFIED"}
            </StatusPill>
          </div>
          <div className="ai-feature-stats"><div><span>Passed</span><strong>{feature.passed}</strong></div><div><span>Failed</span><strong>{feature.failed}</strong></div><div><span>Samples</span><strong>{feature.samples}</strong></div></div>
          {feature.top_error_codes?.length
            ? <div className="ai-error-codes">{feature.top_error_codes.map((item) => <span key={item.code}>{item.code}<b>{item.count}</b></span>)}</div>
            : <p className="ai-no-errors">{disabledByPolicy
              ? "Experimental model-backed AI is intentionally off and is not customer-facing."
              : feature.instrumented
                ? feature.advisory_count
                  ? `No engine verification failures. ${feature.advisory_count} compliance advisory code(s) remain in the compliance audit.`
                  : "No verification failures in this window."
                : "No measured verification sample exists for this deployed revision yet."}</p>}
        </article>;
      })}
    </section>

    <section className="ai-verify-columns">
      <article className="ai-panel">
        <div className="ai-panel-title"><div><p>RESUME BUILDER</p><h2>Hard release checks</h2></div><ShieldCheck size={22} /></div>
        <div className="ai-check-list">{Object.entries(resumeGate?.checks || {}).map(([key, ok]) => <div key={key}><span>{ok ? <CheckCircle2 size={17} /> : <XCircle size={17} />}{key.replaceAll("_", " ")}</span><b>{ok ? "PASS" : "BLOCK"}</b></div>)}</div>
        <p className="ai-threshold-note">Minimum samples: {resumeGate?.thresholds?.minimum_samples ?? 20}. Required pass rate: 100%. Unsupported numeric, provenance, and fabrication failures allowed: 0. Release-evaluation samples are tied to the current deployed revision and reruns replace the same cases instead of inflating the count.</p>
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

    <section className="ai-policy-note"><strong>Policy {policy?.policy_version}</strong><span>Experimental model-backed AI: <b>{policy?.experimental_model_ai_enabled ? "ENABLED" : "OFF"}</b> · Evaluation suite: {policy?.evaluation_suite_version}</span><p>Untracked active smart features are treated as <b>not verified</b>, never as passing. Disabled experimental features stay explicitly marked disabled.</p></section>
  </main>;
}

export default AIVerificationPage;
