import { useEffect, useState } from "react";
import { MailCheck, Send, ShieldCheck } from "lucide-react";
import { getImpactReceipts } from "./api";
import { requestReceiptVerification } from "./receiptVerificationApi";
import "./ReceiptVerification.css";

const EMPTY = { receiptId: "", name: "", email: "", role: "", confirmation_type: "stakeholder", message: "" };

export default function ReceiptVerificationCenter() {
  const [receipts, setReceipts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getImpactReceipts().then((data) => { if (active) { const items = data.receipts || []; setReceipts(items); setForm((current) => ({ ...current, receiptId: current.receiptId || items[0]?.id || "" })); } }).catch(() => { if (active) setError("Verification requests could not be loaded."); });
    return () => { active = false; };
  }, []);

  function change(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setNotice(""); setError("");
    try {
      await requestReceiptVerification(form.receiptId, { name: form.name.trim(), email: form.email.trim(), role: form.role.trim(), confirmation_type: form.confirmation_type, message: form.message.trim() });
      setNotice("Verification request sent. The verifier has 7 days to respond.");
      setForm((current) => ({ ...EMPTY, receiptId: current.receiptId }));
    } catch (err) { setError(err.response?.data?.detail || "Verification request could not be sent."); }
    finally { setBusy(false); }
  }

  return <section className="verification-center"><div className="verification-center-copy"><div className="verification-center-title"><ShieldCheck size={24}/><div><span>THIRD-PARTY CONFIRMATION</span><h2>Request verification</h2></div></div><h3>Turn your career claim into confirmed proof.</h3><p>Ask a collaborator, manager, stakeholder, or organization to confirm that an Impact Receipt accurately reflects the work you contributed and the result described.</p><p>They’ll receive a secure email link where they can review the claim and <strong>Confirm</strong> or <strong>Decline</strong>. They don’t need a Boasted account.</p><p className="verification-privacy"><MailCheck size={17}/> The verifier’s email stays private and is never displayed on your public Boasted profile.</p></div>{receipts.length > 0 ? <form className="verification-request-form" onSubmit={submit}><label>Impact Receipt<select required value={form.receiptId} onChange={(e) => change("receiptId", e.target.value)}>{receipts.map((receipt) => <option key={receipt.id} value={receipt.id}>{receipt.accomplishment}</option>)}</select></label><div className="verification-form-grid"><label>Verifier name<input required maxLength={100} value={form.name} onChange={(e) => change("name", e.target.value)} placeholder="Jane Smith"/></label><label>Verifier email<input required type="email" value={form.email} onChange={(e) => change("email", e.target.value)} placeholder="jane@company.com"/></label></div><div className="verification-form-grid"><label>Role (optional)<input maxLength={120} value={form.role} onChange={(e) => change("role", e.target.value)} placeholder="Engineering Manager"/></label><label>Relationship<select value={form.confirmation_type} onChange={(e) => change("confirmation_type", e.target.value)}><option value="collaborator">Collaborator</option><option value="stakeholder">Manager / stakeholder</option><option value="organization">Organization</option></select></label></div><label>Message (optional)<textarea maxLength={500} value={form.message} onChange={(e) => change("message", e.target.value)} placeholder="Would you confirm that this accurately reflects the project and impact we worked on?"/></label>{error && <div className="verification-error">{error}</div>}{notice && <div className="verification-success">{notice}</div>}<button type="submit" disabled={busy}><Send size={17}/>{busy ? "Sending…" : "Request verification"}</button></form> : <p className="verification-empty">Create an Impact Receipt first, then you can request confirmation.</p>}</section>;
}
