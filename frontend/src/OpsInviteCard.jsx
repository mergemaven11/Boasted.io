import { MailPlus, Send } from "lucide-react";
import { useState } from "react";
import { sendOpsUserInvite } from "./opsApi.js";
import "./OpsInviteCard.css";

export default function OpsInviteCard({ compact = false, onSent }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSending(true); setMessage(""); setError("");
    try {
      const result = await sendOpsUserInvite({ email: email.trim(), name: name.trim() });
      setMessage(`Invitation sent to ${result.email}.`);
      setEmail(""); setName("");
      onSent?.(result);
    } catch (err) {
      setError(err.response?.data?.detail || "Invitation could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return <section className={`ops-invite-card ${compact ? "compact" : ""}`} id="invite-user">
    <div className="ops-invite-heading"><span><MailPlus size={18} /></span><div><p>INVITE A USER</p><h2>Send a Boasted invitation</h2><small>They receive a normal registration link. Boasted does not create a password or account on their behalf.</small></div></div>
    <form onSubmit={submit} className="ops-invite-form">
      <label><span>Name <small>optional</small></span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Jane Doe" /></label>
      <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="jane@example.com" /></label>
      <button type="submit" disabled={sending}><Send size={16} /> {sending ? "Sending…" : "Send invite"}</button>
    </form>
    {message && <div className="ops-invite-notice success" role="status">{message}</div>}
    {error && <div className="ops-invite-notice error" role="alert">{error}</div>}
  </section>;
}
