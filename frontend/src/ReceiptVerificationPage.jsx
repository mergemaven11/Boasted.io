import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { decideReceiptVerification, getReceiptVerification } from "./receiptVerificationApi";
import "./ReceiptVerification.css";

export default function ReceiptVerificationPage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState("");

  useEffect(() => {
    let active = true;
    if (!token) { setError("This verification link is missing its secure token."); return undefined; }
    getReceiptVerification(token).then((result) => { if (active) setData(result); }).catch((err) => {
      if (active) setError(err.response?.data?.detail || "This verification request is invalid, expired, or already completed.");
    });
    return () => { active = false; };
  }, [token]);

  async function respond(nextDecision) {
    setBusy(true); setError("");
    try { await decideReceiptVerification(token, nextDecision); setDecision(nextDecision); }
    catch (err) { setError(err.response?.data?.detail || "Your response could not be recorded."); }
    finally { setBusy(false); }
  }

  if (decision) return <main className="verification-page"><section className="verification-card verification-result"><img src="/brandmark.svg" alt="BragStack"/><CheckCircle2 size={44}/><h1>Response recorded.</h1><p>{decision === "confirmed" ? "You confirmed this career proof." : "You declined this verification request."} Thank you for reviewing it.</p><small>No BragStack account was created and no further action is required.</small></section></main>;

  return <main className="verification-page"><section className="verification-card"><header><img src="/brandmark.svg" alt=""/><div><span>BRAGSTACK · CAREER PROOF</span><h1>Review a verification request</h1></div></header>{error && <div className="verification-error">{error}</div>}{!data && !error && <p>Loading secure verification request…</p>}{data && <><div className="verification-intro"><ShieldCheck size={22}/><p><strong>{data.verifier_name}</strong>, you were asked to review the career proof below. You do not need a BragStack account.</p></div><article className="verification-claim"><span>ACCOMPLISHMENT</span><h2>{data.accomplishment}</h2><div><b>Contribution</b><p>{data.contribution}</p></div><div><b>Result / impact</b><p>{data.result}</p></div>{data.metrics?.length > 0 && <div><b>Measured impact</b>{data.metrics.map((metric) => <p key={`${metric.label}-${metric.value}`}>{metric.label}: <strong>{metric.value}</strong>{metric.context ? ` · ${metric.context}` : ""}</p>)}</div>}{data.skills?.length > 0 && <p className="verification-skills">{data.skills.join(" · ")}</p>}</article><div className="verification-statement"><strong>What does Confirm mean?</strong><p>{data.statement}</p></div><div className="verification-actions"><button className="confirm" disabled={busy} onClick={() => respond("confirmed")}><CheckCircle2 size={18}/> Confirm</button><button className="decline" disabled={busy} onClick={() => respond("declined")}><XCircle size={18}/> Decline</button></div></>}</section></main>;
}
