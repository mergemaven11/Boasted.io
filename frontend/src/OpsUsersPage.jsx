import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Search, ShieldCheck, UserRound } from "lucide-react";
import { getOpsAccess, getOpsUserDirectory } from "./opsApi";
import "./OpsUsersPage.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function OpsUsersPage() {
  const [access, setAccess] = useState(null);
  const [data, setData] = useState({ users: [], count: 0 });
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [verified, setVerified] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(params = { q, plan, verified }) {
    setLoading(true); setError("");
    try {
      const [nextAccess, nextData] = await Promise.all([getOpsAccess(), getOpsUserDirectory(params)]);
      setAccess(nextAccess); setData(nextData);
    } catch (err) {
      setError(err.response?.status === 403 ? "This account is not authorized for BragStack Ops." : "User directory could not be loaded.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load({ q: "", plan: "all", verified: "all" }); }, []);

  function submit(event) { event.preventDefault(); void load(); }

  return <main className="ops-users-page">
    <header className="ops-users-header">
      <div><a href="/ops"><ArrowLeft size={16} /> Ops Console</a><p>INTERNAL · CUSTOMER SUPPORT</p><h1>User Accounts</h1><span>Search customer state without exposing passwords, tokens, payment details, or private content.</span></div>
      <div className="ops-users-role"><ShieldCheck size={18} />{(access?.roles || []).join(", ") || "checking access"}</div>
    </header>

    <form className="ops-users-filters" onSubmit={submit}>
      <label className="ops-users-search"><Search size={17} /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, email, or public slug" /></label>
      <select value={plan} onChange={(event) => setPlan(event.target.value)} aria-label="Plan"><option value="all">All plans</option><option value="free">Free</option><option value="pro">Pro</option></select>
      <select value={verified} onChange={(event) => setVerified(event.target.value)} aria-label="Verification"><option value="all">All verification</option><option value="yes">Verified</option><option value="no">Unverified</option></select>
      <button type="submit">Search users</button>
    </form>

    {error && <section className="ops-users-error">{error}</section>}
    {!error && <section className="ops-users-panel">
      <div className="ops-users-summary"><div><strong>{data.count ?? 0}</strong><span>accounts shown</span></div><small>Newest accounts first · maximum 50 per search</small></div>
      {loading ? <div className="ops-users-loading">Loading customer accounts…</div> : data.users.length === 0 ? <div className="ops-users-loading">No accounts match those filters.</div> : <div className="ops-users-table-wrap"><table className="ops-users-table"><thead><tr><th>User</th><th>Status</th><th>Plan</th><th>Career proof</th><th>Joined</th><th>Profile</th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id}>
        <td><div className="ops-user-identity"><span><UserRound size={17} /></span><div><strong>{user.name || "Unnamed member"}</strong><small>{user.email}</small></div></div></td>
        <td><span className={`ops-status ${user.email_verified ? "ok" : "warn"}`}>{user.email_verified ? "Verified" : "Unverified"}</span></td>
        <td><span className={`ops-plan ${user.plan === "pro" ? "pro" : "free"}`}>{String(user.plan || "free").toUpperCase()}</span></td>
        <td><div className="ops-proof-counts"><strong>{user.counts?.entries ?? 0}</strong><span>accomplishments</span><strong>{user.counts?.impact_receipts ?? 0}</strong><span>receipts</span><strong>{user.counts?.resume_documents ?? 0}</strong><span>résumés</span></div></td>
        <td>{formatDate(user.created_at)}</td>
        <td>{user.public_slug ? <a className="ops-profile-link" href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer">View <ExternalLink size={14} /></a> : <span className="ops-muted">Private / unset</span>}</td>
      </tr>)}</tbody></table></div>}
    </section>}
  </main>;
}
