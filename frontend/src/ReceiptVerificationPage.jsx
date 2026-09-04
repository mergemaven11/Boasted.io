import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareText, ShieldCheck, XCircle } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import { decideReceiptVerification, getReceiptVerification } from "./receiptVerificationApi";
import "./ReceiptVerification.css";

export default function ReceiptVerificationPage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    getReceiptVerification(token).then((result) => { if (active) setData(result); }).catch((err) => {
      if (active) setError(err.response?.data?.detail || "This verification request is invalid, expired, or already completed.");
    });
    return () => { active = false; };
  }, [token]);

  async function respond(nextDecision) {
    setBusy(true); setError("");
    try { await decideReceiptVerification(token, nextDecision, note.trim()); setDecision(nextDecision); }
    catch (err) { setError(err.response?.data?.detail || "Your response could not be recorded."); }
    finally { setBusy(false); }
  }

  if (decision) return <main className="verification-page"><section className="verification-card verification-result"><img src="/brandmark.svg" alt="BragStack"/><CheckCircle2 size={44}/><h1>Response recorded.</h1><p>{decision === "confirmed" ? "You confirmed this career proof." : "You declined this verification request."}{note.trim() ? " Your note was saved with your response." : ""} Thank you for reviewing it.</p><small>No BragStack account was created and no further action is required.</small></section></main>;
  const visibleError = !token ? "This verification link is missing its secure token." : error;
  if (token && !data && !visibleError) return <BragStackLoader message="Verifying secure career proof…" detail="Opening this BragStack verification request securely." />;
  return <main className="verification-page"><section className="verification-card"><header><img src="/brandmark.svg" alt=""/><div><span>BRAGSTACK · CAREER PROOF</span><h1>Review a verification request</h1></div></header>{visibleError && <div className="verification-error">{visibleError}</div>}{data && <><div className="verification-intro"><ShieldCheck size={22}/><p><strong>{data.verifier_name}</strong>, you were asked to review the career proof below. You do not need a BragStack account.</p></div>{data.message && <div className="verification-request-message"><MessageSquareText size={18}/><div><strong>Message from the requester</strong><p>{data.message}</p></div></div>}<article className="verification-claim"><span>ACCOMPLISHMENT</span><h2>{data.accomplishment}</h2><div><b>Contribution</b><p>{data.contribution}</p></div><div><b>Result / impact</b><p>{data.result}</p></div>{data.metrics?.length > 0 && <div><b>Measured impact</b>{data.metrics.map((metric) => <p key={`${metric.label}-${metric.value}`}>{metric.label}: <strong>{metric.value}</strong>{metric.context ? ` · ${metric.context}` : ""}</p>)}</div>}{data.skills?.length > 0 && <p className="verification-skills">{data.skills.join(" · ")}</p>}</article><div className="verification-statement"><strong>What does Confirm mean?</strong><p>{data.statement}</p></div><label className="verification-note-field"><span>Optional note</span><textarea maxLength={800} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context, a clarification, or a reason for declining. This note is shared with the BragStack member and is not automatically published on their Proof Profile."/><small>{note.length}/800</small></label><div className="verification-actions"><button className="confirm" disabled={busy} onClick={() => respond("confirmed")}><CheckCircle2 size={18}/> Confirm</button><button className="decline" disabled={busy} onClick={() => respond("declined")}><XCircle size={18}/> Decline</button></div></>}</section></main>;
}
