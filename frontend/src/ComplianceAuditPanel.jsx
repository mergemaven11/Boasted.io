import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileCheck2, Gavel, PlayCircle, ShieldAlert } from "lucide-react";
import { getComplianceAuditHistory, getLatestComplianceAudit, runComplianceAudit } from "./opsApi";

const STATUS_LABELS = {
  pass: "Pass",
  gap: "Gap",
  needs_evidence: "Needs evidence",
  counsel_review: "Counsel review",
  upcoming: "Upcoming",
  not_applicable: "Not applicable",
};

const STATUS_RANK = { gap: 5, counsel_review: 4, needs_evidence: 3, upcoming: 2, pass: 1, not_applicable: 0 };
const SEVERITY_RANK = { blocker: 5, high: 4, medium: 3, low: 2, info: 1 };

function downloadReceipt(receipt) {
  if (!receipt) return;
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${receipt.receipt_id || "bragstack-compliance-receipt"}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function FindingIcon({ status }) {
  if (status === "pass" || status === "not_applicable") return <CheckCircle2 size={18} aria-hidden="true" />;
  if (status === "counsel_review") return <Gavel size={18} aria-hidden="true" />;
  return <AlertTriangle size={18} aria-hidden="true" />;
}

export default function ComplianceAuditPanel({ onReceiptChange = null }) {
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  function selectReceipt(nextReceipt) {
    setReceipt(nextReceipt || null);
    if (onReceiptChange) onReceiptChange(nextReceipt || null);
  }

  useEffect(() => {
    let active = true;
    Promise.all([getLatestComplianceAudit(), getComplianceAuditHistory(10)])
      .then(([latest, historyResponse]) => {
        if (!active) return;
        setReceipt(latest || null);
        if (onReceiptChange) onReceiptChange(latest || null);
        setHistory(historyResponse?.receipts || []);
      })
      .catch((err) => {
        if (!active || err.response?.status === 404) return;
        setError(err.response?.data?.detail || "Governance receipts could not be loaded.");
      });
    return () => { active = false; };
  }, [onReceiptChange]);

  async function runAudit() {
    setRunning(true);
    setError("");
    try {
      const nextReceipt = await runComplianceAudit();
      selectReceipt(nextReceipt);
      const historyResponse = await getComplianceAuditHistory(10);
      setHistory(historyResponse?.receipts || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Governance scan could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  const sortedFindings = useMemo(() => [...(receipt?.findings || [])].sort((a, b) => {
    const statusDiff = (STATUS_RANK[b.status] || 0) - (STATUS_RANK[a.status] || 0);
    if (statusDiff) return statusDiff;
    return (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
  }), [receipt]);

  const summary = receipt?.summary || {};
  const statusCounts = summary.by_status || {};

  return <section className="ops-panel compliance-panel" id="compliance-readiness">
    <div className="ops-panel-heading compliance-heading">
      <div>
        <p className="ops-kicker">OPS · LEGAL · BUSINESS · SECURITY · SAFETY</p>
        <h2><ShieldAlert size={22} aria-hidden="true" /> Whole-business governance scan</h2>
        <p>Runs conservative controls across legal readiness, business formation, privacy, billing, security evidence, retention, vendors, marketing, AI safety, fundraising, and governance. Findings also feed the Ops Inbox. A pass is evidence—not a legal certification.</p>
      </div>
      <div className="compliance-actions">
        <button type="button" className="compliance-run" disabled={running} onClick={() => void runAudit()}><PlayCircle size={17} /> {running ? "Running scan…" : "Run governance scan"}</button>
        <button type="button" disabled={!receipt} onClick={() => downloadReceipt(receipt)}><Download size={17} /> Download receipt</button>
      </div>
    </div>

    {error && <p className="ops-error">{error}</p>}
    {!receipt && !error && <div className="compliance-empty"><FileCheck2 size={30} /><strong>No governance receipt yet.</strong><span>Run the first scan to establish a timestamped baseline and populate Ops Inbox findings.</span></div>}

    {receipt && <>
      <div className="compliance-receipt-meta">
        <div><span>Receipt</span><strong>{receipt.receipt_id}</strong></div>
        <div><span>Generated</span><strong>{new Date(receipt.generated_at).toLocaleString()}</strong></div>
        <div><span>Rule pack</span><strong>{receipt.rule_pack_version}</strong></div>
        <div><span>Environment</span><strong>{receipt.environment || "unknown"}</strong></div>
        <div className="compliance-hash"><span>SHA-256 integrity</span><code>{receipt.integrity_sha256}</code></div>
      </div>

      <div className="compliance-scorebar">
        <div className={`compliance-overall ${summary.overall || "action_required"}`}><span>Overall</span><strong>{String(summary.overall || "action_required").replaceAll("_", " ")}</strong></div>
        <div><span>Blockers</span><strong>{(summary.blockers || []).length}</strong></div>
        <div><span>Gaps</span><strong>{statusCounts.gap || 0}</strong></div>
        <div><span>Needs evidence</span><strong>{statusCounts.needs_evidence || 0}</strong></div>
        <div><span>Counsel review</span><strong>{statusCounts.counsel_review || 0}</strong></div>
        <div><span>Passed</span><strong>{statusCounts.pass || 0}</strong></div>
      </div>

      <p className="compliance-disclaimer"><strong>Important:</strong> {receipt.disclaimer}</p>

      <div className="compliance-findings">
        {sortedFindings.map((finding) => <article className={`compliance-finding ${finding.status} ${finding.severity}`} key={finding.control_id}>
          <div className="compliance-finding-icon"><FindingIcon status={finding.status} /></div>
          <div className="compliance-finding-body">
            <div className="compliance-finding-meta"><span className={`compliance-status ${finding.status}`}>{STATUS_LABELS[finding.status] || finding.status}</span><span>{finding.severity}</span><span>{finding.category}</span><code>{finding.control_id}</code>{finding.counsel_required && <span className="compliance-counsel">Counsel</span>}</div>
            <h3>{finding.title}</h3>
            <p>{finding.summary}</p>
            <div className="compliance-next"><strong>Next action</strong><p>{finding.next_action}</p></div>
            {(finding.evidence || []).length > 0 && <details><summary>Evidence snapshot</summary><ul>{finding.evidence.map((item) => <li key={item}><code>{item}</code></li>)}</ul></details>}
            {(finding.sources || []).length > 0 && <details><summary>Governing / reference sources</summary><ul>{finding.sources.map((source) => <li key={`${finding.control_id}-${source.url}`}><a href={source.url} target="_blank" rel="noreferrer">{source.authority}: {source.title}</a><small>{source.jurisdiction}{source.effective_date ? ` · effective ${source.effective_date}` : ""} · verified {source.last_verified}</small></li>)}</ul></details>}
          </div>
        </article>)}
      </div>

      <div className="compliance-history">
        <h3>Recent timestamped receipts</h3>
        {history.length === 0 && <p className="ops-empty">No prior receipts.</p>}
        {history.map((item) => <button type="button" key={item.receipt_id} onClick={() => selectReceipt(item)}>
          <span>{new Date(item.generated_at).toLocaleString()}</span><strong>{item.summary?.overall?.replaceAll("_", " ") || "audit"}</strong><code>{item.receipt_id}</code>
        </button>)}
      </div>
    </>}
  </section>;
}
