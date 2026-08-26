import { useEffect, useState } from "react";
import { getOpsAccess, getOpsOverview, getOpsUser } from "./opsApi";
import "./OpsConsolePage.css";

function RequestTable({ rows = [] }) {
  if (!rows.length) return <p className="ops-empty">No matching request events yet.</p>;
  return <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th><th>Request ID</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.request_id}-${row.timestamp}`}><td>{new Date(row.timestamp).toLocaleTimeString()}</td><td>{row.method}</td><td><code>{row.path}</code></td><td>{row.status_code}</td><td>{row.duration_ms} ms</td><td><code>{row.request_id}</code></td></tr>)}</tbody></table></div>;
}

export default function OpsConsolePage() {
  const [access, setAccess] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [userResult, setUserResult] = useState(null);
  const [userError, setUserError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refreshDiagnostics() {
    setLoading(true);
    setError("");
    try {
      const nextAccess = await getOpsAccess();
      const nextOverview = await getOpsOverview();
      setAccess(nextAccess);
      setOverview(nextOverview);
    } catch (err) {
      setError(err.response?.status === 403 ? "This account is not authorized for BragStack Ops." : "Ops diagnostics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const nextAccess = await getOpsAccess();
        const nextOverview = await getOpsOverview();
        if (!active) return;
        setAccess(nextAccess);
        setOverview(nextOverview);
      } catch (err) {
        if (!active) return;
        setError(err.response?.status === 403 ? "This account is not authorized for BragStack Ops." : "Ops diagnostics could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function lookupUser(event) {
    event.preventDefault(); setUserError(""); setUserResult(null);
    try { setUserResult(await getOpsUser(email)); }
    catch (err) { setUserError(err.response?.data?.detail || "User diagnostics could not be loaded."); }
  }

  if (loading) return <main className="ops-page"><div className="ops-loading">Loading operational diagnostics…</div></main>;
  if (error) return <main className="ops-page"><section className="ops-denied"><h1>BragStack Ops</h1><p>{error}</p><a href="/app">Return to BragStack</a></section></main>;

  const service = overview?.service || {};
  const database = overview?.database || {};
  const requests = overview?.requests || {};

  return <main className="ops-page">
    <header className="ops-header"><div><p className="ops-kicker">INTERNAL · READ ONLY</p><h1>BragStack Ops Console</h1><p>Live application diagnostics, request telemetry, database health, and safe user-state debugging.</p></div><div className={`ops-env ${service.environment === "production" ? "production" : "nonprod"}`}>{String(service.environment || access?.environment || "unknown").toUpperCase()}</div></header>
    <div className="ops-toolbar"><span>Roles: {(access?.roles || []).join(", ")}</span><button type="button" onClick={refreshDiagnostics}>Refresh diagnostics</button></div>

    <section className="ops-grid">
      <article className="ops-card"><span>API</span><strong>{service.name || "bragstack-api"}</strong><small>Commit {service.version || "unknown"}</small></article>
      <article className="ops-card"><span>MongoDB</span><strong className={service.mongo === "ok" ? "healthy" : "degraded"}>{service.mongo || "unknown"}</strong><small>Live ping from API process</small></article>
      <article className="ops-card"><span>Recent requests</span><strong>{requests.sample_size || 0}</strong><small>{requests.status_classes?.["5xx"] || 0} server errors · {requests.status_classes?.["4xx"] || 0} client errors</small></article>
      <article className="ops-card"><span>Stored users</span><strong>{database.users ?? "—"}</strong><small>{database.entries ?? "—"} accomplishments · {database.impact_receipts ?? "—"} receipts</small></article>
    </section>

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">REQUEST TELEMETRY</p><h2>Failures</h2></div></div><RequestTable rows={requests.failures} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">PERFORMANCE</p><h2>Slow requests ≥ 500 ms</h2></div></div><RequestTable rows={requests.slow} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">LIVE TRAFFIC</p><h2>Recent requests</h2></div></div><RequestTable rows={requests.recent} /></section>

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">SAFE USER DIAGNOSTICS</p><h2>Account state lookup</h2></div></div><form className="ops-user-search" onSubmit={lookupUser}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" required /><button type="submit">Inspect account state</button></form>{userError && <p className="ops-error">{userError}</p>}{userResult && <div className="ops-user-result"><div><span>Name</span><strong>{userResult.name || "—"}</strong></div><div><span>Email</span><strong>{userResult.email}</strong></div><div><span>Verified</span><strong>{userResult.email_verified ? "Yes" : "No"}</strong></div><div><span>Plan</span><strong>{userResult.plan}</strong></div><div><span>Accomplishments</span><strong>{userResult.counts?.entries ?? 0}</strong></div><div><span>Impact Receipts</span><strong>{userResult.counts?.impact_receipts ?? 0}</strong></div><div><span>Resume docs</span><strong>{userResult.counts?.resume_documents ?? 0}</strong></div></div>}</section>
  </main>;
}
