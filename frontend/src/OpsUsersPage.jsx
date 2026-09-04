import { Fragment, useEffect, useState } from "react";
import { ArrowLeft, BarChart3, ExternalLink, Mail, Search, ShieldCheck, UserRound } from "lucide-react";
import { getOpsAccess, getOpsUserAnalytics, getOpsUserDirectory, resendOpsVerificationEmail } from "./opsApi";
import OpsInviteCard from "./OpsInviteCard.jsx";
import "./OpsUsersPage.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatHours(value) {
  if (value == null) return "—";
  if (value < 24) return `${value}h`;
  return `${Math.round((value / 24) * 10) / 10}d`;
}

function formatLabel(value = "") {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function UserAnalyticsPanel({ analytics, loading }) {
  if (loading) return <div className="ops-user-analytics-loading">Loading user analytics…</div>;
  if (!analytics) return <div className="ops-user-analytics-loading">Analytics could not be loaded.</div>;
  const evidence = analytics.evidence || {};
  const profile = analytics.profile_engagement_30d || {};
  const ttfv = analytics.time_to_first_value || {};
  const features = analytics.feature_adoption || {};

  return <div className="ops-user-analytics-panel">
    <div className="ops-user-analytics-heading">
      <div><p>CAREER EVIDENCE HEALTH</p><h3>Evidence journey & adoption</h3></div>
      <div className="ops-evidence-score"><strong>{analytics.career_evidence_score ?? 0}</strong><span>/ 100 evidence completeness</span></div>
    </div>
    <div className="ops-user-analytics-grid">
      <article><span>Activation</span><strong>{formatLabel(analytics.activation_status)}</strong><small>{formatLabel(analytics.dormancy_status)} · last active {formatDateTime(analytics.last_active_at)}</small></article>
      <article><span>Profile completeness</span><strong>{analytics.profile_completeness ?? 0}%</strong><small>Career identity fields completed</small></article>
      <article><span>First accomplishment</span><strong>{formatHours(ttfv.first_accomplishment_hours)}</strong><small>Time from signup</small></article>
      <article><span>First Impact Receipt</span><strong>{formatHours(ttfv.first_impact_receipt_hours)}</strong><small>Time from signup</small></article>
      <article><span>First packet</span><strong>{formatHours(ttfv.first_packet_hours)}</strong><small>Time from signup</small></article>
      <article><span>Skills documented</span><strong>{evidence.skills_documented ?? 0}</strong><small>{evidence.accomplishments ?? 0} accomplishments · {evidence.impact_receipts ?? 0} receipts</small></article>
      <article><span>Evidence attachment</span><strong>{evidence.evidence_attachment_rate ?? 0}%</strong><small>Receipts containing evidence</small></article>
      <article><span>Confirmation rate</span><strong>{evidence.confirmation_rate ?? 0}%</strong><small>Receipts with confirmed credit</small></article>
      <article><span>Profile views · 30d</span><strong>{profile.views ?? 0}</strong><small>{profile.unique_visitors ?? 0} unique visitors</small></article>
      <article><span>Profile CTA clicks · 30d</span><strong>{profile.outbound_cta_clicks ?? 0}</strong><small>{profile.open_to_talk_clicks ?? 0} Open to Talk clicks</small></article>
      <article><span>Open to Talk conversion</span><strong>{profile.open_to_talk_conversion_rate ?? 0}%</strong><small>Profile views → booking/contact click</small></article>
      <article><span>Public proof</span><strong>{evidence.public_accomplishments ?? 0}</strong><small>{evidence.public_receipts ?? 0} public receipts · {evidence.packets ?? 0} packets</small></article>
    </div>
    <div className="ops-feature-adoption">
      <span>Feature adoption</span>
      <div>{Object.entries(features).map(([feature, adopted]) => <span className={adopted ? "adopted" : "not-adopted"} key={feature}>{formatLabel(feature)}</span>)}</div>
    </div>
  </div>;
}

export default function OpsUsersPage() {
  const [access, setAccess] = useState(null);
  const [data, setData] = useState({ users: [], count: 0 });
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [verified, setVerified] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [analyticsLoadingId, setAnalyticsLoadingId] = useState("");
  const [analyticsByUser, setAnalyticsByUser] = useState({});

  async function load(params = { q, plan, verified }) {
    setLoading(true); setError(""); setActionMessage(""); setActionError("");
    try {
      const [nextAccess, nextData] = await Promise.all([getOpsAccess(), getOpsUserDirectory(params)]);
      setAccess(nextAccess); setData(nextData); setExpandedId("");
    } catch (err) {
      setError(err.response?.status === 403 ? "This account is not authorized for BragStack Ops." : "User directory could not be loaded.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [nextAccess, nextData] = await Promise.all([
          getOpsAccess(),
          getOpsUserDirectory({ q: "", plan: "all", verified: "all" }),
        ]);
        if (!active) return;
        setAccess(nextAccess);
        setData(nextData);
      } catch (err) {
        if (!active) return;
        setError(err.response?.status === 403 ? "This account is not authorized for BragStack Ops." : "User directory could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  function submit(event) { event.preventDefault(); void load(); }

  async function toggleAnalytics(user) {
    if (expandedId === user.id) { setExpandedId(""); return; }
    setExpandedId(user.id);
    if (analyticsByUser[user.id]) return;
    setAnalyticsLoadingId(user.id);
    try {
      const analytics = await getOpsUserAnalytics(user.id);
      setAnalyticsByUser((current) => ({ ...current, [user.id]: analytics }));
    } catch {
      setAnalyticsByUser((current) => ({ ...current, [user.id]: null }));
    } finally {
      setAnalyticsLoadingId("");
    }
  }

  async function resendVerification(user) {
    const confirmed = window.confirm(`Send a new BragStack verification email to ${user.email}?`);
    if (!confirmed) return;

    setSendingId(user.id); setActionMessage(""); setActionError("");
    try {
      await resendOpsVerificationEmail(user.id);
      setActionMessage(`Verification email sent to ${user.email}.`);
    } catch (err) {
      setActionError(err.response?.data?.detail || "Verification email could not be sent.");
    } finally {
      setSendingId("");
    }
  }

  return <main className="ops-users-page">
    <header className="ops-users-header">
      <div><a href="/ops"><ArrowLeft size={16} /> Ops Console</a><p>INTERNAL · CUSTOMER SUPPORT</p><h1>User Accounts</h1><span>Search customer state, invite new users, and inspect evidence adoption without exposing passwords, tokens, payment details, or private content.</span></div>
      <div className="ops-users-role"><ShieldCheck size={18} />{(access?.roles || []).join(", ") || "checking access"}</div>
    </header>

    <OpsInviteCard />

    <form className="ops-users-filters" onSubmit={submit}>
      <label className="ops-users-search"><Search size={17} /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, email, or public slug" /></label>
      <select value={plan} onChange={(event) => setPlan(event.target.value)} aria-label="Plan"><option value="all">All plans</option><option value="free">Free</option><option value="pro">Pro</option></select>
      <select value={verified} onChange={(event) => setVerified(event.target.value)} aria-label="Verification"><option value="all">All verification</option><option value="yes">Verified</option><option value="no">Unverified</option></select>
      <button type="submit">Search users</button>
    </form>

    {actionMessage && <section className="ops-users-action-message success">{actionMessage}</section>}
    {actionError && <section className="ops-users-action-message error">{actionError}</section>}
    {error && <section className="ops-users-error">{error}</section>}
    {!error && <section className="ops-users-panel">
      <div className="ops-users-summary"><div><strong>{data.count ?? 0}</strong><span>accounts shown</span></div><small>Newest accounts first · maximum 50 per search</small></div>
      {loading ? <div className="ops-users-loading">Loading customer accounts…</div> : data.users.length === 0 ? <div className="ops-users-loading">No accounts match those filters.</div> : <div className="ops-users-table-wrap"><table className="ops-users-table"><thead><tr><th>User</th><th>Status</th><th>Plan</th><th>Career proof</th><th>Joined</th><th>Profile</th><th>Analytics</th><th>Support actions</th></tr></thead><tbody>{data.users.map((user) => <Fragment key={user.id}><tr>
        <td><div className="ops-user-identity"><span><UserRound size={17} /></span><div><strong>{user.name || "Unnamed member"}</strong><small>{user.email}</small></div></div></td>
        <td><span className={`ops-status ${user.email_verified ? "ok" : "warn"}`}>{user.email_verified ? "Verified" : "Unverified"}</span></td>
        <td><span className={`ops-plan ${user.plan === "pro" ? "pro" : "free"}`}>{String(user.plan || "free").toUpperCase()}</span></td>
        <td><div className="ops-proof-counts"><strong>{user.counts?.entries ?? 0}</strong><span>accomplishments</span><strong>{user.counts?.impact_receipts ?? 0}</strong><span>receipts</span><strong>{user.counts?.resume_documents ?? 0}</strong><span>résumés</span></div></td>
        <td>{formatDate(user.created_at)}</td>
        <td>{user.public_slug ? <a className="ops-profile-link" href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer">View <ExternalLink size={14} /></a> : <span className="ops-muted">Private / unset</span>}</td>
        <td><button className="ops-analytics-button" type="button" onClick={() => void toggleAnalytics(user)}><BarChart3 size={14} />{expandedId === user.id ? "Hide" : "Analyze"}</button></td>
        <td>{user.email_verified ? <span className="ops-muted">No action needed</span> : <button className="ops-email-button" type="button" disabled={sendingId === user.id} onClick={() => void resendVerification(user)}><Mail size={14} />{sendingId === user.id ? "Sending…" : "Resend verification"}</button>}</td>
      </tr>{expandedId === user.id && <tr className="ops-analytics-row"><td colSpan="8"><UserAnalyticsPanel analytics={analyticsByUser[user.id]} loading={analyticsLoadingId === user.id} /></td></tr>}</Fragment>)}</tbody></table></div>}
    </section>}
  </main>;
}