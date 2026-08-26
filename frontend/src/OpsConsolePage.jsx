import { useEffect, useState } from "react";
import {
  getOpsAccess,
  getOpsAudit,
  getOpsObservability,
  getOpsOverview,
  getOpsTeam,
  getOpsUser,
  updateOpsRoles,
} from "./opsApi";
import BragStackLoader from "./BragStackLoader.jsx";
import "./OpsConsolePage.css";

function RequestTable({ rows = [] }) {
  if (!rows.length) return <p className="ops-empty">No matching request events yet.</p>;
  return <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th><th>Request ID</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.request_id}-${row.created_at || row.timestamp}`}><td>{new Date(row.created_at || row.timestamp).toLocaleTimeString()}</td><td>{row.method}</td><td><code>{row.path}</code></td><td>{row.status_code}</td><td>{row.duration_ms} ms</td><td><code>{row.request_id}</code></td></tr>)}</tbody></table></div>;
}

function ErrorGroups({ rows = [] }) {
  if (!rows.length) return <p className="ops-empty">No persisted exception groups in the current retention window.</p>;
  return <div className="ops-error-groups">{rows.map((row) => <article key={row.fingerprint}><div><strong>{row.error_type}</strong><code>{row.fingerprint}</code></div><span>{row.method} {row.path}</span><small>{row.count} occurrence{row.count === 1 ? "" : "s"} · last seen {new Date(row.last_seen).toLocaleString()} · {row.version || "unknown version"}</small></article>)}</div>;
}

function AuditEventRow({ event }) {
  if (event.event === "verification_email_resent") {
    return <div><strong>{event.actor_email}</strong><span>resent verification email</span><code>{event.target_email}</code></div>;
  }
  return <div><strong>{event.actor_email}</strong><span>changed {event.target_email}</span><code>{(event.previous_roles || []).join(", ") || "none"} → {(event.next_roles || []).join(", ") || "none"}</code></div>;
}

function RoleManager({ team, setTeam, audit, setAudit }) {
  const [saving, setSaving] = useState("");
  const [roleError, setRoleError] = useState("");
  const roles = team?.allowed_roles || [];

  async function toggleRole(member, role) {
    const nextRoles = member.roles.includes(role)
      ? member.roles.filter((item) => item !== role)
      : [...member.roles, role];
    setSaving(member.id);
    setRoleError("");
    try {
      const updated = await updateOpsRoles(member.id, nextRoles);
      setTeam((current) => ({
        ...current,
        members: current.members.map((item) => item.id === member.id ? updated : item),
      }));
      setAudit(await getOpsAudit());
    } catch (err) {
      setRoleError(err.response?.data?.detail || "Role update failed.");
    } finally {
      setSaving("");
    }
  }

  return <>
    {roleError && <p className="ops-error">{roleError}</p>}
    <div className="ops-team-grid">
      {(team?.members || []).map((member) => <article className="ops-team-card" key={member.id}>
        <div><strong>{member.name || member.email}</strong><small>{member.email}</small></div>
        {member.bootstrap_admin && <span className="ops-bootstrap-badge">Bootstrap admin</span>}
        <div className="ops-role-list">
          {roles.map((role) => <label key={role}>
            <input
              type="checkbox"
              checked={member.roles.includes(role)}
              disabled={saving === member.id}
              onChange={() => void toggleRole(member, role)}
            />
            <span>{role}</span>
          </label>)}
        </div>
        <small>Effective: {(member.effective_roles || []).join(", ") || "none"}</small>
      </article>)}
    </div>
    <div className="ops-audit-list">
      <h3>Recent admin actions</h3>
      {(audit?.events || []).length === 0 && <p className="ops-empty">No admin actions recorded yet.</p>}
      {(audit?.events || []).map((event, index) => <AuditEventRow event={event} key={`${event.created_at}-${index}`} />)}
    </div>
  </>;
}

export default function OpsConsolePage() {
  const [access, setAccess] = useState(null);
  const [overview, setOverview] = useState(null);
  const [observability, setObservability] = useState(null);
  const [team, setTeam] = useState(null);
  const [audit, setAudit] = useState(null);
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
      const [nextOverview, nextObservability] = await Promise.all([getOpsOverview(), getOpsObservability()]);
      setAccess(nextAccess);
      setOverview(nextOverview);
      setObservability(nextObservability);
      if ((nextAccess.roles || []).includes("admin")) {
        const [nextTeam, nextAudit] = await Promise.all([getOpsTeam(), getOpsAudit()]);
        setTeam(nextTeam);
        setAudit(nextAudit);
      }
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
        const [nextOverview, nextObservability] = await Promise.all([getOpsOverview(), getOpsObservability()]);
        let nextTeam = null;
        let nextAudit = null;
        if ((nextAccess.roles || []).includes("admin")) {
          [nextTeam, nextAudit] = await Promise.all([getOpsTeam(), getOpsAudit()]);
        }
        if (!active) return;
        setAccess(nextAccess);
        setOverview(nextOverview);
        setObservability(nextObservability);
        setTeam(nextTeam);
        setAudit(nextAudit);
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

  if (loading) return <BragStackLoader compact message="Loading BragStack Ops…" detail="Checking service health, telemetry, database state, and authorized diagnostics." />;
  if (error) return <main className="ops-page"><section className="ops-denied"><h1>BragStack Ops</h1><p>{error}</p><a href="/app">Return to BragStack</a></section></main>;

  const service = overview?.service || {};
  const database = overview?.database || {};
  const requests = overview?.requests || {};
  const persisted = observability || {};
  const isAdmin = (access?.roles || []).includes("admin");

  return <main className="ops-page">
    <header className="ops-header"><div><p className="ops-kicker">INTERNAL · CONTROLLED ACCESS</p><h1>BragStack Ops Console</h1><p>Live application diagnostics, persistent request tracing, grouped errors, database health, safe user-state debugging, and audited internal access management.</p></div><div className={`ops-env ${service.environment === "production" ? "production" : "nonprod"}`}>{String(service.environment || access?.environment || "unknown").toUpperCase()}</div></header>
    <div className="ops-toolbar"><span>Roles: {(access?.roles || []).join(", ")}</span><button type="button" onClick={refreshDiagnostics}>Refresh diagnostics</button></div>

    <section className="ops-grid">
      <article className="ops-card"><span>API</span><strong>{service.name || "bragstack-api"}</strong><small>Commit {service.version || "unknown"}</small></article>
      <article className="ops-card"><span>MongoDB</span><strong className={service.mongo === "ok" ? "healthy" : "degraded"}>{service.mongo || "unknown"}</strong><small>Live ping from API process</small></article>
      <article className="ops-card"><span>Persisted traces</span><strong>{persisted.sample_size || 0}</strong><small>{persisted.status_classes?.["5xx"] || 0} server errors · {persisted.retention_days || 14}-day retention</small></article>
      <article className="ops-card"><span>Stored users</span><strong>{database.users ?? "—"}</strong><small>{database.entries ?? "—"} accomplishments · {database.impact_receipts ?? "—"} receipts</small></article>
    </section>

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">PERSISTENT OBSERVABILITY V2</p><h2>Grouped backend exceptions</h2><p>Sanitized fingerprints survive restarts and deployments without storing request bodies, headers, tokens, query strings, or exception messages.</p></div></div><ErrorGroups rows={persisted.errors} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">PERSISTENT FAILURES</p><h2>Recent 4xx / 5xx requests</h2></div></div><RequestTable rows={persisted.failures} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">PERSISTENT PERFORMANCE</p><h2>Slow requests ≥ 500 ms</h2></div></div><RequestTable rows={persisted.slow} /></section>

    {isAdmin && <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">ADMIN · TEAM & ROLES</p><h2>Internal access management</h2><p>Grant only the minimum role needed. Changes are persisted and audit logged.</p></div></div><RoleManager team={team} setTeam={setTeam} audit={audit} setAudit={setAudit} /></section>}

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">LIVE PROCESS TELEMETRY</p><h2>Current-process failures</h2></div></div><RequestTable rows={requests.failures} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">LIVE TRAFFIC</p><h2>Recent requests</h2></div></div><RequestTable rows={requests.recent} /></section>

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">SAFE USER DIAGNOSTICS</p><h2>Account state lookup</h2></div></div><form className="ops-user-search" onSubmit={lookupUser}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" required /><button type="submit">Inspect account state</button></form>{userError && <p className="ops-error">{userError}</p>}{userResult && <div className="ops-user-result"><div><span>Name</span><strong>{userResult.name || "—"}</strong></div><div><span>Email</span><strong>{userResult.email}</strong></div><div><span>Verified</span><strong>{userResult.email_verified ? "Yes" : "No"}</strong></div><div><span>Plan</span><strong>{userResult.plan}</strong></div><div><span>Accomplishments</span><strong>{userResult.counts?.entries ?? 0}</strong></div><div><span>Impact Receipts</span><strong>{userResult.counts?.impact_receipts ?? 0}</strong></div><div><span>Resume docs</span><strong>{userResult.counts?.resume_documents ?? 0}</strong></div></div>}</section>
  </main>;
}
