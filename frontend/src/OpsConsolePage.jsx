import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCheck,
  Clock3,
  ExternalLink,
  Inbox,
  Info,
  Search,
} from "lucide-react";
import {
  assignOpsRolesByEmail,
  getLatestComplianceAudit,
  getIntelligenceVerificationSummary,
  getOpsAccess,
  getOpsAudit,
  getOpsObservability,
  getOpsOverview,
  getOpsTeam,
  getOpsUser,
  updateOpsRoles,
} from "./opsApi";
import BragStackLoader from "./BragStackLoader.jsx";
import ComplianceAuditPanel from "./ComplianceAuditPanel.jsx";
import FounderAnalyticsPanel from "./FounderAnalyticsPanel.jsx";
import "./OpsConsolePage.css";
import "./ComplianceAuditPanel.css";

const OPS_INBOX_STORAGE_KEY = "bragstack_ops_inbox_state_v1";
const ATTENTION_PRIORITIES = new Set(["urgent", "action", "warning"]);

function readInboxState() {
  if (typeof window === "undefined") return { read: {}, archived: {}, snoozedUntil: {} };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(OPS_INBOX_STORAGE_KEY) || "{}");
    return {
      read: parsed.read || {},
      archived: parsed.archived || {},
      snoozedUntil: parsed.snoozedUntil || {},
    };
  } catch {
    return { read: {}, archived: {}, snoozedUntil: {} };
  }
}

function relativeTime(value) {
  if (!value) return "recently";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "recently";
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(diffSeconds) < 60) return formatter.format(diffSeconds, "second");
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");
  return formatter.format(Math.round(diffHours / 24), "day");
}

function isFutureTimestamp(value) {
  return Number(value || 0) > Date.now();
}

function governanceArea(finding = {}) {
  const id = String(finding.control_id || "");
  const category = String(finding.category || "").toLowerCase();
  if (id.startsWith("BUS-") || id.startsWith("FUND-") || category.includes("fundraising") || category.includes("corporate") || category.includes("tax")) return "Business";
  if (id.startsWith("AI-") || id.startsWith("MINORS-") || category.includes("younger") || category.includes("safety")) return "Safety";
  if (id.startsWith("PRIV-VENDOR") || id.startsWith("PRIV-RETENTION") || id.startsWith("GOV-") || category.includes("data lifecycle") || category.includes("vendor")) return "Security";
  return "Legal";
}

function governancePriority(finding = {}) {
  if (finding.status === "gap" && finding.severity === "blocker") return "urgent";
  if (finding.status === "gap" || finding.status === "counsel_review" || finding.severity === "high") return "action";
  if (finding.status === "needs_evidence" || finding.status === "upcoming") return "warning";
  return "info";
}

function buildOpsMessages({ service = {}, persisted = {}, audit = null, compliance = null, intelligence = null }) {
  const messages = [];

  (intelligence?.recent_failures || []).slice(0, 12).forEach((failure, index) => {
    const feature = String(failure.feature || "intelligence").replaceAll("_", " ");
    const codes = failure.violation_codes || [];
    messages.push({
      id: `intelligence:${failure.feature}:${failure.task}:${failure.created_at || index}`,
      source: "BragStack Intelligence",
      category: feature,
      priority: "urgent",
      title: `${feature} result was withheld`,
      summary: codes.length ? `Safety verification found: ${codes.join(", ")}.` : "The shared intelligence engine reported a verification failure.",
      meaning: "BragStack failed closed instead of showing a result that did not pass its evidence, provenance, or safety rules.",
      nextStep: "Open the Intelligence Verification report, review the violation code and affected feature, then reproduce and correct the invariant before release.",
      detail: `${failure.task || "unknown task"} · ${failure.model_id || "shared engine"}`,
      createdAt: failure.created_at,
      externalUrl: "/ops/ai-verification",
    });
  });

  if (compliance) {
    const overall = String(compliance.summary?.overall || "action_required");
    const blockers = compliance.summary?.blockers?.length || 0;
    messages.push({
      id: `governance:${compliance.receipt_id}`,
      source: "Governance",
      category: "Whole-business report",
      priority: overall === "blocked" ? "urgent" : overall === "action_required" ? "action" : "info",
      title: `Governance scan: ${overall.replaceAll("_", " ")}`,
      summary: `${blockers} blocker${blockers === 1 ? "" : "s"} · ${(compliance.findings || []).length} controls reviewed across legal, business, security, and safety readiness.`,
      meaning: "This is the latest timestamped governance receipt. It records evidence, gaps, counsel-review items, and upcoming obligations; it is not a legal certification.",
      nextStep: overall === "ready" ? "Keep the evidence current and rerun the scan after material product, business, vendor, legal, or security changes." : "Open the governance report, start with blockers and high-severity findings, and preserve evidence as each issue is resolved.",
      detail: `Receipt ${compliance.receipt_id}`,
      createdAt: compliance.generated_at,
      syncRecommended: overall !== "ready",
      externalUrl: "/ops/compliance",
    });

    (compliance.findings || [])
      .filter((finding) => !["pass", "not_applicable"].includes(finding.status))
      .slice(0, 16)
      .forEach((finding) => {
        const area = governanceArea(finding);
        messages.push({
          id: `governance:${compliance.receipt_id}:${finding.control_id}`,
          source: "Governance",
          category: `${area} report`,
          priority: governancePriority(finding),
          title: finding.title,
          summary: finding.summary,
          meaning: `${area} control ${finding.control_id} is marked ${String(finding.status || "unknown").replaceAll("_", " ")} with ${finding.severity || "unknown"} severity in the latest governance scan.`,
          nextStep: finding.next_action,
          detail: finding.counsel_required ? `${finding.control_id} · counsel review` : finding.control_id,
          createdAt: compliance.generated_at,
          syncRecommended: finding.severity === "blocker" || finding.severity === "high" || finding.counsel_required,
          externalUrl: "/ops/compliance#compliance-readiness",
        });
      });
  }

  if (service.mongo && service.mongo !== "ok") {
    messages.push({
      id: `infra:mongo:${service.mongo}`,
      source: "Infrastructure",
      category: "Database",
      priority: "urgent",
      title: "MongoDB health needs attention",
      summary: `The API reports MongoDB as ${service.mongo}. Production data operations may be affected.`,
      meaning: "BragStack's API cannot confirm a healthy database connection. Reads or writes may fail until connectivity recovers.",
      nextStep: "Refresh diagnostics once. If MongoDB is still degraded, check the database and Render service health before shipping more changes.",
      createdAt: new Date().toISOString(),
      syncRecommended: true,
    });
  }

  const serverErrors = Number(persisted.status_classes?.["5xx"] || 0);
  if (serverErrors > 0) {
    messages.push({
      id: `app:5xx:${serverErrors}:${persisted.sample_size || 0}`,
      source: "Application",
      category: "Server errors",
      priority: serverErrors >= 5 ? "urgent" : "warning",
      title: `${serverErrors} server error${serverErrors === 1 ? "" : "s"} in the retention window`,
      summary: "BragStack has persisted 5xx responses that are worth reviewing before they become a user-facing pattern.",
      meaning: "At least one request failed because of a server-side problem, rather than a normal user validation error.",
      nextStep: "Review Recent 4xx / 5xx requests and Grouped backend exceptions below. Repeated paths or fingerprints deserve a code fix first.",
      createdAt: persisted.failures?.[0]?.created_at || persisted.failures?.[0]?.timestamp,
      syncRecommended: serverErrors >= 5,
    });
  }

  (persisted.errors || []).slice(0, 5).forEach((row) => {
    messages.push({
      id: `error:${row.fingerprint}`,
      source: "Application",
      category: "Exception group",
      priority: Number(row.count || 0) >= 3 ? "action" : "warning",
      title: row.error_type || "Grouped backend exception",
      summary: `${row.method || "REQUEST"} ${row.path || "unknown path"} · ${row.count || 1} occurrence${Number(row.count || 1) === 1 ? "" : "s"}.`,
      meaning: "The same sanitized backend exception fingerprint occurred more than once or was important enough to retain for review.",
      nextStep: "Match the route and fingerprint to the latest deploy. If the count is growing, inspect the route implementation and recent changes before it spreads.",
      detail: row.version ? `Version ${row.version}` : null,
      createdAt: row.last_seen,
      syncRecommended: Number(row.count || 0) >= 3,
    });
  });

  (persisted.failures || []).slice(0, 8).forEach((row) => {
    const status = Number(row.status_code || 0);
    if (status < 500) return;
    messages.push({
      id: `failure:${row.request_id || `${row.method}:${row.path}:${row.created_at || row.timestamp}`}`,
      source: "Application",
      category: "Failed request",
      priority: "warning",
      title: `${status} response on ${row.path || "request"}`,
      summary: `${row.method || "REQUEST"} ${row.path || "unknown path"} returned ${status}${row.duration_ms != null ? ` in ${row.duration_ms} ms` : ""}.`,
      meaning: "A specific production API request failed with a server error. One isolated failure can be transient; repeated failures are a pattern.",
      nextStep: "Use the request ID in the Persistent Failures table and compare it with grouped exceptions, the route, and the deployed commit.",
      detail: row.request_id ? `Request ${row.request_id}` : null,
      createdAt: row.created_at || row.timestamp,
      syncRecommended: true,
    });
  });

  (persisted.slow || []).slice(0, 4).forEach((row) => {
    const duration = Number(row.duration_ms || 0);
    if (duration < 2000) return;
    messages.push({
      id: `slow:${row.request_id || `${row.method}:${row.path}:${row.created_at || row.timestamp}`}`,
      source: "Performance",
      category: "Slow request",
      priority: duration >= 5000 ? "action" : "info",
      title: "Slow production request detected",
      summary: `${row.method || "REQUEST"} ${row.path || "unknown path"} took ${duration} ms.`,
      meaning: "A production request took long enough that a user may have experienced visible waiting.",
      nextStep: "Look for repeated slow calls to the same path. Prioritize optimization when the route is common, user-facing, or repeatedly above the threshold.",
      detail: row.request_id ? `Request ${row.request_id}` : null,
      createdAt: row.created_at || row.timestamp,
      syncRecommended: duration >= 5000,
    });
  });

  (audit?.events || []).slice(0, 8).forEach((event, index) => {
    const isVerification = event.event === "verification_email_resent";
    const isInvite = event.event === "user_invite_sent";
    const isRoleChange = !isVerification && !isInvite;
    messages.push({
      id: `admin:${event.created_at || index}:${event.event || "activity"}`,
      source: "Admin",
      category: isInvite ? "User invitation" : isVerification ? "Account support" : "Access control",
      priority: "info",
      title: isInvite ? "User invitation sent" : isVerification ? "Verification email resent" : "Internal access updated",
      summary: isInvite
        ? `An authorized operator invited ${event.target_email || "a new user"} to create a BragStack account.`
        : isVerification
          ? "An authorized operator resent an account verification email."
          : "An authorized operator changed internal role permissions. The detailed audit record remains below.",
      meaning: isInvite
        ? "A registration invitation was sent. No account or password was created for the recipient."
        : isVerification
          ? "A user who already has an account was sent a new verification email."
          : "Someone's internal BragStack permissions changed, which can affect access to Ops or administrative tools.",
      nextStep: isInvite
        ? "No action is needed unless the recipient says the invitation was not received."
        : isVerification
          ? "No action is needed unless the user still cannot verify their account."
          : "Review the audit entry below and confirm the new roles follow least-privilege access.",
      createdAt: event.created_at,
      syncRecommended: Boolean(isRoleChange),
    });
  });

  const priorityWeight = { urgent: 4, action: 3, warning: 2, info: 1 };
  return messages.sort((a, b) => {
    const priorityDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (priorityDiff) return priorityDiff;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

function PriorityIcon({ priority }) {
  if (ATTENTION_PRIORITIES.has(priority)) return <AlertTriangle size={18} aria-hidden="true" />;
  return <Info size={18} aria-hidden="true" />;
}

function OpsInbox({ service, persisted, audit, compliance, intelligence }) {
  const messages = useMemo(() => buildOpsMessages({ service, persisted, audit, compliance, intelligence }), [service, persisted, audit, compliance, intelligence]);
  const [state, setState] = useState(readInboxState);
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try { window.localStorage.setItem(OPS_INBOX_STORAGE_KEY, JSON.stringify(state)); } catch { /* optional */ }
  }, [state]);

  const isSnoozed = (id) => isFutureTimestamp(state.snoozedUntil[id]);
  const isArchived = (id) => Boolean(state.archived[id]);
  const isRead = (id) => Boolean(state.read[id]);
  const unreadCount = messages.filter((message) => !isRead(message.id) && !isArchived(message.id) && !isSnoozed(message.id)).length;
  const attentionCount = messages.filter((message) => ATTENTION_PRIORITIES.has(message.priority) && !isArchived(message.id) && !isSnoozed(message.id)).length;
  const snoozedCount = messages.filter((message) => isSnoozed(message.id) && !isArchived(message.id)).length;

  const filteredMessages = messages.filter((message) => {
    const archived = isArchived(message.id);
    const snoozed = isSnoozed(message.id);
    if (filter === "archived" && !archived) return false;
    if (filter === "snoozed" && (!snoozed || archived)) return false;
    if (filter !== "archived" && archived) return false;
    if (filter !== "snoozed" && snoozed) return false;
    if (filter === "attention" && !ATTENTION_PRIORITIES.has(message.priority)) return false;
    if (filter === "updates" && message.priority !== "info") return false;
    if (query.trim()) {
      const haystack = `${message.title} ${message.summary} ${message.source} ${message.category} ${message.meaning || ""} ${message.nextStep || ""}`.toLowerCase();
      if (!haystack.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  function markRead(id) {
    setState((current) => ({ ...current, read: { ...current.read, [id]: true } }));
  }

  function toggleDetails(id) {
    markRead(id);
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  }

  function archiveMessage(id) {
    setState((current) => ({
      ...current,
      read: { ...current.read, [id]: true },
      archived: { ...current.archived, [id]: !current.archived[id] },
    }));
  }

  function snoozeMessage(id) {
    setState((current) => ({
      ...current,
      read: { ...current.read, [id]: true },
      snoozedUntil: { ...current.snoozedUntil, [id]: Date.now() + (60 * 60 * 1000) },
    }));
  }

  const filters = [
    ["all", "All", messages.filter((message) => !isArchived(message.id) && !isSnoozed(message.id)).length],
    ["attention", "Needs attention", attentionCount],
    ["updates", "Updates", messages.filter((message) => message.priority === "info" && !isArchived(message.id) && !isSnoozed(message.id)).length],
    ["snoozed", "Snoozed", snoozedCount],
    ["archived", "Archived", messages.filter((message) => isArchived(message.id)).length],
  ];

  return <section className="ops-panel ops-inbox-panel">
    <div className="ops-inbox-heading">
      <div>
        <p className="ops-kicker">FOUNDER · OPS INBOX</p>
        <h2><Inbox size={22} aria-hidden="true" /> Messages worth reading</h2>
        <p>Legal, business, security, safety, application, and access-control findings arrive here as plain-English Ops messages. Tap <strong>View details</strong> to see what it means and exactly what to do next.</p>
      </div>
      <div className="ops-inbox-summary" aria-label="Ops inbox summary">
        <div><Bell size={17} /><strong>{unreadCount}</strong><span>Unread</span></div>
        <div><AlertTriangle size={17} /><strong>{attentionCount}</strong><span>Attention</span></div>
      </div>
    </div>

    <div className="ops-inbox-controls">
      <div className="ops-inbox-tabs" role="tablist" aria-label="Ops Inbox filters">
        {filters.map(([value, label, count]) => <button className={filter === value ? "active" : ""} key={value} type="button" onClick={() => setFilter(value)}>{label}<span>{count}</span></button>)}
      </div>
      <label className="ops-inbox-search"><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages" /></label>
    </div>

    <div className="ops-message-list">
      {filteredMessages.length === 0 && <div className="ops-inbox-empty"><CheckCheck size={30} /><strong>Nothing needs your attention here.</strong><span>Try another filter, refresh diagnostics, or run a governance scan.</span></div>}
      {filteredMessages.map((message) => <article className={`ops-message ${message.priority} ${isRead(message.id) ? "read" : "unread"}`} key={message.id}>
        <div className="ops-message-icon"><PriorityIcon priority={message.priority} /></div>
        <div className="ops-message-body">
          <div className="ops-message-meta"><span className={`ops-priority ${message.priority}`}>{message.priority}</span><span>{message.category}</span><span>{message.source}</span><span>{relativeTime(message.createdAt)}</span>{!isRead(message.id) && <span className="ops-unread-dot">Unread</span>}{message.syncRecommended && <span className="ops-sync-badge">Discuss recommended</span>}</div>
          <h3>{message.title}</h3><p>{message.summary}</p>{message.detail && <small>{message.detail}</small>}
          {expanded[message.id] && <div className="ops-message-explainer"><div><strong>What this means</strong><p>{message.meaning || message.summary}</p></div><div><strong>What to do next</strong><p>{message.nextStep || "No immediate action is required."}</p></div></div>}
        </div>
        <div className="ops-message-actions">
          <button type="button" className="ops-details-button" onClick={() => toggleDetails(message.id)}><Info size={15} /> {expanded[message.id] ? "Hide details" : "View details"}</button>
          {!isRead(message.id) && <button type="button" onClick={() => markRead(message.id)}><CheckCheck size={15} /> Mark read</button>}
          {!isArchived(message.id) && <button type="button" onClick={() => snoozeMessage(message.id)}><Clock3 size={15} /> Snooze 1h</button>}
          <button type="button" onClick={() => archiveMessage(message.id)}><Archive size={15} /> {isArchived(message.id) ? "Restore" : "Archive"}</button>
          {message.externalUrl && <a href={message.externalUrl}><ExternalLink size={15} /> Open report</a>}
        </div>
      </article>)}
    </div>
  </section>;
}

function RequestTable({ rows = [] }) {
  if (!rows.length) return <p className="ops-empty">No matching request events yet.</p>;
  return <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th><th>Request ID</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.request_id}-${row.created_at || row.timestamp}`}><td>{new Date(row.created_at || row.timestamp).toLocaleTimeString()}</td><td>{row.method}</td><td><code>{row.path}</code></td><td>{row.status_code}</td><td>{row.duration_ms} ms</td><td><code>{row.request_id}</code></td></tr>)}</tbody></table></div>;
}

function ErrorGroups({ rows = [] }) {
  if (!rows.length) return <p className="ops-empty">No persisted exception groups in the current retention window.</p>;
  return <div className="ops-error-groups">{rows.map((row) => <article key={row.fingerprint}><div><strong>{row.error_type}</strong><code>{row.fingerprint}</code></div><span>{row.method} {row.path}</span><small>{row.count} occurrence{row.count === 1 ? "" : "s"} · last seen {new Date(row.last_seen).toLocaleString()} · {row.version || "unknown version"}</small></article>)}</div>;
}

function AuditEventRow({ event }) {
  if (event.event === "verification_email_resent") return <div><strong>{event.actor_email}</strong><span>resent verification email</span><code>{event.target_email}</code></div>;
  if (event.event === "user_invite_sent") return <div><strong>{event.actor_email}</strong><span>invited a new user</span><code>{event.target_email}</code></div>;
  return <div><strong>{event.actor_email}</strong><span>changed {event.target_email}</span><code>{(event.previous_roles || []).join(", ") || "none"} → {(event.next_roles || []).join(", ") || "none"}</code></div>;
}

function RoleManager({ team, setTeam, audit, setAudit }) {
  const [saving, setSaving] = useState("");
  const [roleError, setRoleError] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRoles, setAssignRoles] = useState(["support"]);
  const roles = team?.allowed_roles || [];

  async function toggleRole(member, role) {
    const nextRoles = member.roles.includes(role) ? member.roles.filter((item) => item !== role) : [...member.roles, role];
    setSaving(member.id);
    setRoleError("");
    try {
      const updated = await updateOpsRoles(member.id, nextRoles);
      setTeam((current) => ({ ...current, members: current.members.map((item) => item.id === member.id ? updated : item) }));
      setAudit(await getOpsAudit());
    } catch (err) {
      setRoleError(err.response?.data?.detail || "Role update failed.");
    } finally {
      setSaving("");
    }
  }

  function toggleAssignRole(role) {
    setAssignRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  }

  async function assignAccess(event) {
    event.preventDefault();
    if (!assignRoles.length) { setRoleError("Choose at least one role."); return; }
    setSaving("assign");
    setRoleError("");
    try {
      const updated = await assignOpsRolesByEmail(assignEmail, assignRoles);
      setTeam((current) => {
        const existing = (current?.members || []).some((item) => item.id === updated.id);
        const members = existing
          ? current.members.map((item) => item.id === updated.id ? updated : item)
          : [updated, ...(current?.members || [])];
        return { ...current, members };
      });
      setAudit(await getOpsAudit());
      setAssignEmail("");
      setAssignRoles(["support"]);
    } catch (err) {
      setRoleError(err.response?.data?.detail || "Access assignment failed.");
    } finally {
      setSaving("");
    }
  }

  return <>
    {roleError && <p className="ops-error">{roleError}</p>}
    <form className="ops-user-search" onSubmit={assignAccess}>
      <input type="email" value={assignEmail} onChange={(event) => setAssignEmail(event.target.value)} placeholder="verified-operator@example.com" required />
      <div className="ops-role-list">{roles.map((role) => <label key={`assign-${role}`}><input type="checkbox" checked={assignRoles.includes(role)} disabled={saving === "assign"} onChange={() => toggleAssignRole(role)} /><span>{role}</span></label>)}</div>
      <button type="submit" disabled={saving === "assign"}>{saving === "assign" ? "Assigning…" : "Assign access"}</button>
    </form>
    <p className="ops-empty">The person must already have a verified BragStack account. If they do not, invite them first; an invitation alone never grants internal access.</p>
    <div className="ops-team-grid">{(team?.members || []).map((member) => <article className="ops-team-card" key={member.id}>
      <div><strong>{member.name || member.email}</strong><small>{member.email}</small></div>
      {member.bootstrap_admin && <span className="ops-bootstrap-badge">Bootstrap admin</span>}
      <div className="ops-role-list">{roles.map((role) => <label key={role}><input type="checkbox" checked={member.roles.includes(role)} disabled={saving === member.id || member.bootstrap_admin && role === "admin"} onChange={() => void toggleRole(member, role)} /><span>{role}</span></label>)}</div>
      <small>Effective: {(member.effective_roles || []).join(", ") || "none"}</small>
    </article>)}</div>
    <div className="ops-audit-list"><h3>Recent admin actions</h3>{(audit?.events || []).length === 0 && <p className="ops-empty">No admin actions recorded yet.</p>}{(audit?.events || []).map((event, index) => <AuditEventRow event={event} key={`${event.created_at}-${index}`} />)}</div>
  </>;
}

export default function OpsConsolePage() {
  const [access, setAccess] = useState(null);
  const [overview, setOverview] = useState(null);
  const [observability, setObservability] = useState(null);
  const [team, setTeam] = useState(null);
  const [audit, setAudit] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [userResult, setUserResult] = useState(null);
  const [userError, setUserError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDiagnostics() {
    const nextAccess = await getOpsAccess();
    const [nextOverview, nextObservability, nextCompliance, nextIntelligence] = await Promise.all([getOpsOverview(), getOpsObservability(), getLatestComplianceAudit(), getIntelligenceVerificationSummary()]);
    let nextTeam = null;
    let nextAudit = null;
    if ((nextAccess.roles || []).includes("admin")) [nextTeam, nextAudit] = await Promise.all([getOpsTeam(), getOpsAudit()]);
    return { nextAccess, nextOverview, nextObservability, nextTeam, nextAudit, nextCompliance, nextIntelligence };
  }

  async function refreshDiagnostics() {
    setLoading(true);
    setError("");
    try {
      const data = await loadDiagnostics();
      setAccess(data.nextAccess); setOverview(data.nextOverview); setObservability(data.nextObservability); setTeam(data.nextTeam); setAudit(data.nextAudit); setCompliance(data.nextCompliance); setIntelligence(data.nextIntelligence);
    } catch (err) {
      setError(err.response?.status === 404 ? "This account is not authorized for the BragStack Ops Console." : "Ops diagnostics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await loadDiagnostics();
        if (!active) return;
        setAccess(data.nextAccess); setOverview(data.nextOverview); setObservability(data.nextObservability); setTeam(data.nextTeam); setAudit(data.nextAudit); setCompliance(data.nextCompliance); setIntelligence(data.nextIntelligence);
      } catch (err) {
        if (!active) return;
        setError(err.response?.status === 404 ? "This account is not authorized for the BragStack Ops Console." : "Ops diagnostics could not be loaded.");
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

  if (loading) return <BragStackLoader compact message="Loading BragStack Ops…" detail="Checking governance reports, founder analytics, service health, telemetry, database state, and authorized diagnostics." />;
  if (error) return <main className="ops-page"><section className="ops-denied"><h1>BragStack Ops</h1><p>{error}</p><a href="/app">Return to BragStack</a></section></main>;

  const service = overview?.service || {};
  const database = overview?.database || {};
  const requests = overview?.requests || {};
  const analytics = overview?.analytics || {};
  const persisted = observability || {};
  const isAdmin = (access?.roles || []).includes("admin");

  return <main className="ops-page">
    <header className="ops-header"><div><p className="ops-kicker">INTERNAL · EXPLICIT ACCESS ONLY</p><h1>BragStack Ops Console</h1><p>Whole-business governance scanning, Legal/Business/Security/Safety reports, Ops Inbox alerts, founder analytics, application diagnostics, safe user-state debugging, and audited internal access management.</p></div><div className={`ops-env ${service.environment === "production" ? "production" : "nonprod"}`}>{String(service.environment || access?.environment || "unknown").toUpperCase()}</div></header>
    <div className="ops-toolbar"><span>Authorized roles: {(access?.roles || []).join(", ")}</span><button type="button" onClick={refreshDiagnostics}>Refresh Ops</button></div>

    <section className="ops-grid">
      <article className="ops-card"><span>API</span><strong>{service.name || "bragstack-api"}</strong><small>Commit {service.version || "unknown"}</small></article>
      <article className="ops-card"><span>MongoDB</span><strong className={service.mongo === "ok" ? "healthy" : "degraded"}>{service.mongo || "unknown"}</strong><small>Live ping from API process</small></article>
      <article className="ops-card"><span>Governance</span><strong>{compliance?.summary?.overall?.replaceAll("_", " ") || "not scanned"}</strong><small>{compliance?.receipt_id || "Run a scan to create a receipt"}</small></article>
      <article className="ops-card"><span>Stored users</span><strong>{database.users ?? "—"}</strong><small>{database.entries ?? "—"} accomplishments · {database.impact_receipts ?? "—"} receipts</small></article>
    </section>

    <ComplianceAuditPanel onReceiptChange={setCompliance} />
    <OpsInbox service={service} persisted={persisted} audit={isAdmin ? audit : null} compliance={compliance} intelligence={intelligence} />
    <FounderAnalyticsPanel analytics={analytics} />

    {isAdmin && <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">ADMIN · TEAM & ROLES</p><h2>Invite, assign, and audit internal access</h2><p>Only verified accounts you explicitly assign receive internal access. Grant the minimum role needed; every change is persisted and audit logged.</p></div></div><RoleManager team={team} setTeam={setTeam} audit={audit} setAudit={setAudit} /></section>}

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">PERSISTENT OBSERVABILITY V2</p><h2>Grouped backend exceptions</h2><p>Sanitized fingerprints survive restarts and deployments without storing request bodies, headers, tokens, query strings, or exception messages.</p></div></div><ErrorGroups rows={persisted.errors} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">PERSISTENT FAILURES</p><h2>Recent 4xx / 5xx requests</h2></div></div><RequestTable rows={persisted.failures} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">PERSISTENT PERFORMANCE</p><h2>Slow requests ≥ 500 ms</h2></div></div><RequestTable rows={persisted.slow} /></section>

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">LIVE PROCESS TELEMETRY</p><h2>Current-process failures</h2></div></div><RequestTable rows={requests.failures} /></section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">LIVE TRAFFIC</p><h2>Recent requests</h2></div></div><RequestTable rows={requests.recent} /></section>

    <section className="ops-panel"><div className="ops-panel-heading"><div><p className="ops-kicker">SAFE USER DIAGNOSTICS</p><h2>Account state lookup</h2></div></div><form className="ops-user-search" onSubmit={lookupUser}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" required /><button type="submit">Inspect account state</button></form>{userError && <p className="ops-error">{userError}</p>}{userResult && <div className="ops-user-result"><div><span>Name</span><strong>{userResult.name || "—"}</strong></div><div><span>Email</span><strong>{userResult.email}</strong></div><div><span>Verified</span><strong>{userResult.email_verified ? "Yes" : "No"}</strong></div><div><span>Plan</span><strong>{userResult.plan}</strong></div><div><span>Accomplishments</span><strong>{userResult.counts?.entries ?? 0}</strong></div><div><span>Impact Receipts</span><strong>{userResult.counts?.impact_receipts ?? 0}</strong></div><div><span>Resume docs</span><strong>{userResult.counts?.resume_documents ?? 0}</strong></div></div>}</section>
  </main>;
}
