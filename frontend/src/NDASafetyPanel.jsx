import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

import "./NDASafetyPanel.css";

function NDASafetyPanel({ findings = [], onMakeSafe }) {
  const blocking = findings.filter((item) => item.severity === "block");
  const warnings = findings.filter((item) => item.severity === "warning");
  const infos = findings.filter((item) => item.severity === "info");
  const hasFindings = findings.length > 0;

  return (
    <section className={`nda-safety-panel ${blocking.length ? "has-blocker" : warnings.length ? "has-warning" : "is-clear"}`}>
      <div className="nda-safety-panel-heading">
        <div className="nda-safety-panel-title">
          <span className="nda-safety-panel-icon"><ShieldCheck size={19} /></span>
          <div>
            <strong>NDA & confidential-work helper</strong>
            <p>This check runs in your browser. Your draft is not sent anywhere just to run this scan.</p>
          </div>
        </div>
        <span className="nda-safety-panel-status">
          {blocking.length ? `${blocking.length} blocker${blocking.length === 1 ? "" : "s"}` : warnings.length ? `${warnings.length} review item${warnings.length === 1 ? "" : "s"}` : "No obvious high-risk pattern"}
        </span>
      </div>

      {hasFindings ? (
        <div className="nda-safety-findings">
          {findings.slice(0, 5).map((finding) => (
            <div className={`nda-safety-finding ${finding.severity}`} key={`${finding.id}-${finding.field}`}>
              {finding.severity === "block" ? <AlertTriangle size={16} /> : finding.severity === "warning" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <div>
                <strong>{finding.field}</strong>
                <p>{finding.message}</p>
              </div>
            </div>
          ))}
          {findings.length > 5 && <p className="nda-safety-more">{findings.length - 5} more item{findings.length - 5 === 1 ? "" : "s"} should be reviewed.</p>}
        </div>
      ) : (
        <p className="nda-safety-clear"><CheckCircle2 size={16} /> No obvious credential, internal-reference, code-block, or diagnostic patterns were detected. This does not mean an NDA permits the content.</p>
      )}

      <div className="nda-safety-actions">
        <button type="button" onClick={onMakeSafe} className="nda-safety-rewrite">
          <ShieldCheck size={16} /> Make this NDA-safe
        </button>
        <p>
          The helper removes obvious credentials, code blocks, ticket-style identifiers, internal references, and public sharing. For Impact Receipts it also clears exact metric values and keeps only references you explicitly marked as already public.
        </p>
      </div>

      {(blocking.length > 0 || warnings.length > 0) && (
        <p className="nda-safety-boundary">
          BragStack cannot interpret an employment agreement or decide what your employer or client permits. When unsure, generalize the career signal or leave restricted material out. <a href="/nda-safety" target="_blank" rel="noreferrer">Read the NDA safety guide</a>.
        </p>
      )}

      {infos.length > 0 && <span className="nda-safety-info-count">{infos.length} public-source reminder{infos.length === 1 ? "" : "s"}</span>}
    </section>
  );
}

export default NDASafetyPanel;
