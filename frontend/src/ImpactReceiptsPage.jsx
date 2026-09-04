import "./ProductPolish.css";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Pencil, Plus, ReceiptText, ShieldCheck, Trash2, X } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import { createImpactReceipt, deleteImpactReceipt, getImpactReceipts, updateImpactReceipt } from "./api";

const EMPTY_EVIDENCE = { evidence_type: "other", title: "", reference: "", description: "", is_public: false };
const EMPTY_FORM = { accomplishment: "", contribution: "", result: "", metricLabel: "", metricValue: "", metricContext: "", evidence: [{ ...EMPTY_EVIDENCE }], skills: "", isPublic: false };

function formatLabel(value = "") {
  return value.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeEvidence(items = []) {
  return items.map((item) => ({
    evidence_type: item.evidence_type || "other",
    title: item.title || "",
    reference: item.reference || "",
    description: item.description || "",
    is_public: item.is_public === true,
  }));
}

function EvidenceFields({ items, onChange, onAdd, onRemove }) {
  return (
    <div className="receipt-evidence-editor">
      {items.map((item, index) => (
        <div className="receipt-evidence-item" key={`evidence-${index}`}>
          <div className="receipt-proof-columns">
            <label>Evidence type
              <select value={item.evidence_type} onChange={(event) => onChange(index, "evidence_type", event.target.value)}>
                <option value="support-incident">Support incident</option>
                <option value="pull-request">Pull request</option>
                <option value="ticket">Ticket</option>
                <option value="documentation">Documentation</option>
                <option value="customer-feedback">Customer feedback</option>
                <option value="project-link">Project link</option>
                <option value="attachment">Attachment</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Evidence title
              <input required value={item.title} onChange={(event) => onChange(index, "title", event.target.value)} placeholder="What proves this happened?" />
            </label>
          </div>
          <label>Evidence reference
            <input value={item.reference} onChange={(event) => onChange(index, "reference", event.target.value)} placeholder="URL, ticket number, PR number, document reference…" />
          </label>
          <label>Evidence description
            <textarea value={item.description} onChange={(event) => onChange(index, "description", event.target.value)} placeholder="Why does this support the accomplishment?" />
          </label>
          <div className="receipt-signal-row">
            <label><input type="checkbox" checked={item.is_public} onChange={(event) => onChange(index, "is_public", event.target.checked)} />This evidence may be shared publicly</label>
            {items.length > 1 && <button type="button" onClick={() => onRemove(index)}><Trash2 size={14} /> Remove evidence</button>}
          </div>
        </div>
      ))}
      <button type="button" onClick={onAdd}><Plus size={15} /> Add evidence</button>
    </div>
  );
}

function ReceiptVerificationStatus({ receipt }) {
  const confirmations = receipt.confirmations || [];
  const confirmed = confirmations.filter((item) => item.status === "confirmed");
  const pending = confirmations.filter((item) => item.status === "pending");

  if (!confirmed.length) {
    return (
      <div className="receipt-trust-row">
        <span><ShieldCheck size={14} /> Private by default</span>
        <span>{pending.length} pending verification request{pending.length === 1 ? "" : "s"}</span>
      </div>
    );
  }

  return (
    <>
      <div className="verified-impact-banner">
        <div className="verified-impact-banner-main">
          <CheckCircle2 size={24} />
          <div>
            <strong>Verified Impact</strong>
            <p>This Impact Receipt has been confirmed by {confirmed.length === 1 ? "a third party" : `${confirmed.length} third parties`}.</p>
          </div>
        </div>
        <span className="verified-impact-count">{confirmed.length} confirmed</span>
      </div>
      <div className="receipt-confirmation-details">
        {confirmed.map((confirmation, index) => (
          <div className="receipt-confirmation-detail" key={confirmation.id || `${confirmation.name}-${index}`}>
            <header>
              <div>
                <strong>{confirmation.name || "Verifier"}</strong>
                {confirmation.role && <small>{confirmation.role}</small>}
              </div>
              <span><CheckCircle2 size={13} /> Confirmed</span>
            </header>
            {confirmation.verifier_note && <p className="receipt-confirmation-note">“{confirmation.verifier_note}”</p>}
          </div>
        ))}
      </div>
      <div className="receipt-trust-row">
        <span className="verified-trust-pill"><CheckCircle2 size={14} /> Third-party verified</span>
        {pending.length > 0 && <span>{pending.length} verification request{pending.length === 1 ? "" : "s"} still pending</span>}
        <span><ShieldCheck size={14} /> Verifier notes stay private unless you choose otherwise</span>
      </div>
    </>
  );
}

function ImpactReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  async function loadReceipts() {
    try {
      const data = await getImpactReceipts();
      setReceipts(data.receipts ?? []);
      setError("");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      setError("Impact Receipts could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadReceipts(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const stats = useMemo(() => ({
    publicCount: receipts.filter((receipt) => receipt.is_public).length,
    evidenceCount: receipts.reduce((total, receipt) => total + (receipt.evidence?.length ?? 0), 0),
    confirmedCount: receipts.reduce((total, receipt) => total + (receipt.confirmations?.filter((confirmation) => confirmation.status === "confirmed").length ?? 0), 0),
    verifiedReceiptCount: receipts.filter((receipt) => receipt.confirmations?.some((confirmation) => confirmation.status === "confirmed")).length,
  }), [receipts]);

  function updateForm(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function updateEvidence(index, field, value) { setForm((current) => ({ ...current, evidence: current.evidence.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) })); }
  function addEvidence() { setForm((current) => ({ ...current, evidence: [...current.evidence, { ...EMPTY_EVIDENCE }] })); }
  function removeEvidence(index) { setForm((current) => ({ ...current, evidence: current.evidence.length === 1 ? current.evidence : current.evidence.filter((_, itemIndex) => itemIndex !== index) })); }

  async function submitReceipt(event) {
    event.preventDefault();
    setIsCreating(true); setError(""); setSuccess("");
    const skills = form.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
    const metrics = form.metricLabel.trim() && form.metricValue.trim() ? [{ label: form.metricLabel.trim(), value: form.metricValue.trim(), context: form.metricContext.trim() || null }] : [];
    const evidence = normalizeEvidence(form.evidence).map((item) => ({ ...item, reference: item.reference.trim() || null, description: item.description.trim() || null, title: item.title.trim() }));
    try {
      await createImpactReceipt({ accomplishment: form.accomplishment.trim(), contribution: form.contribution.trim(), result: form.result.trim(), metrics, evidence, skills, credit: [], is_public: form.isPublic });
      setForm(EMPTY_FORM); setShowCreate(false); setSuccess("Impact Receipt saved with evidence."); await loadReceipts();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Impact Receipt could not be saved. Check the required fields.");
    } finally { setIsCreating(false); }
  }

  function beginEdit(receipt) {
    setEditingId(receipt.id);
    setEditForm({ accomplishment: receipt.accomplishment, contribution: receipt.contribution, result: receipt.result, skills: (receipt.skills || []).join(", "), evidence: normalizeEvidence(receipt.evidence?.length ? receipt.evidence : [{ ...EMPTY_EVIDENCE }]), is_public: receipt.is_public === true });
  }
  function updateEdit(field, value) { setEditForm((current) => ({ ...current, [field]: value })); }
  function updateEditEvidence(index, field, value) { setEditForm((current) => ({ ...current, evidence: current.evidence.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) })); }
  function addEditEvidence() { setEditForm((current) => ({ ...current, evidence: [...current.evidence, { ...EMPTY_EVIDENCE }] })); }
  function removeEditEvidence(index) { setEditForm((current) => ({ ...current, evidence: current.evidence.length === 1 ? current.evidence : current.evidence.filter((_, itemIndex) => itemIndex !== index) })); }

  async function saveEdit(receiptId) {
    setUpdatingId(receiptId); setError(""); setSuccess("");
    try {
      await updateImpactReceipt(receiptId, {
        accomplishment: editForm.accomplishment.trim(),
        contribution: editForm.contribution.trim(),
        result: editForm.result.trim(),
        skills: editForm.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        evidence: normalizeEvidence(editForm.evidence).map((item) => ({ ...item, title: item.title.trim(), reference: item.reference.trim() || null, description: item.description.trim() || null })),
        is_public: editForm.is_public,
      });
      setEditingId(null); setEditForm(null); setSuccess("Impact Receipt updated."); await loadReceipts();
    } catch (err) { setError(err.response?.data?.detail ?? "Impact Receipt could not be updated."); }
    finally { setUpdatingId(null); }
  }

  async function toggleVisibility(receipt) {
    setUpdatingId(receipt.id); setError("");
    try { await updateImpactReceipt(receipt.id, { is_public: !receipt.is_public }); await loadReceipts(); }
    catch (err) { setError(err.response?.data?.detail ?? "Receipt visibility could not be changed."); }
    finally { setUpdatingId(null); }
  }

  async function removeReceipt(receipt) {
    if (!window.confirm(`Delete the Impact Receipt “${receipt.accomplishment}”? This cannot be undone.`)) return;
    setUpdatingId(receipt.id); setError(""); setSuccess("");
    try { await deleteImpactReceipt(receipt.id); setSuccess("Impact Receipt deleted."); await loadReceipts(); }
    catch (err) { setError(err.response?.data?.detail ?? "Impact Receipt could not be deleted."); }
    finally { setUpdatingId(null); }
  }

  return <main className="product-page receipt-library-page">
    <section className="product-page-hero">
      <div><p className="mini-label">Evidence-backed career proof</p><h1>Impact Receipts</h1><p>Capture what you accomplished, what changed, the evidence behind it, and the skills you demonstrated. Receipts and evidence stay private unless you explicitly choose to share them.</p></div>
      <button type="button" className="product-page-link" onClick={() => setShowCreate((current) => !current)}>{showCreate ? <X size={16} /> : <Plus size={16} />}{showCreate ? "Close" : "Create Impact Receipt"}</button>
    </section>

    {showCreate && <section className="receipt-library-card receipt-create-card">
      <div className="receipt-library-card-top"><div><p className="mini-label">Minimum evidence workflow</p><h2>Create an Impact Receipt</h2></div><span className="visibility-pill private">Private by default</span></div>
      <form onSubmit={submitReceipt} className="receipt-create-form">
        <label>Accomplishment<input required maxLength={300} value={form.accomplishment} onChange={(event) => updateForm("accomplishment", event.target.value)} /></label>
        <label>Your contribution<textarea required maxLength={2000} value={form.contribution} onChange={(event) => updateForm("contribution", event.target.value)} /></label>
        <label>Result / impact<textarea required maxLength={2000} value={form.result} onChange={(event) => updateForm("result", event.target.value)} /></label>
        <div className="receipt-proof-columns"><label>Metric<input value={form.metricLabel} onChange={(event) => updateForm("metricLabel", event.target.value)} /></label><label>Metric value<input value={form.metricValue} onChange={(event) => updateForm("metricValue", event.target.value)} /></label></div>
        <label>Metric context<input value={form.metricContext} onChange={(event) => updateForm("metricContext", event.target.value)} /></label>
        <EvidenceFields items={form.evidence} onChange={updateEvidence} onAdd={addEvidence} onRemove={removeEvidence} />
        <label>Skills demonstrated<input required value={form.skills} onChange={(event) => updateForm("skills", event.target.value)} /></label>
        <label><input type="checkbox" checked={form.isPublic} onChange={(event) => updateForm("isPublic", event.target.checked)} /> This receipt may be shared publicly</label>
        <button type="submit" disabled={isCreating}>{isCreating ? "Saving…" : "Save Impact Receipt"}</button>
      </form>
    </section>}

    <section className="receipt-kpi-grid">
      <article><ReceiptText size={20} /><span>Total receipts</span><strong>{receipts.length}</strong></article>
      <article><ShieldCheck size={20} /><span>Public receipts</span><strong>{stats.publicCount}</strong></article>
      <article><span className="receipt-kpi-dot" /><span>Evidence items</span><strong>{stats.evidenceCount}</strong></article>
      <article><CheckCircle2 size={20} /><span>Verified receipts</span><strong>{stats.verifiedReceiptCount}</strong></article>
    </section>
    {stats.confirmedCount > 0 && <div className="product-alert success"><CheckCircle2 size={17} /> Your proof has earned {stats.confirmedCount} third-party confirmation{stats.confirmedCount === 1 ? "" : "s"} across {stats.verifiedReceiptCount} verified Impact Receipt{stats.verifiedReceiptCount === 1 ? "" : "s"}.</div>}
    {error && <div className="product-alert error">{error}</div>}
    {success && <div className="product-alert success">{success}</div>}

    {isLoading ? <BragStackLoader compact message="Loading your Impact Receipts…" detail="Gathering evidence-backed outcomes, proof, and confirmation signals." /> : receipts.length === 0 ? (
      <section className="product-empty"><h2>No receipts yet.</h2><p>Create your first evidence-backed receipt, or turn an existing accomplishment into one.</p><a href="/app/accomplishments">Create from an accomplishment <ExternalLink size={16} /></a></section>
    ) : (
      <section className="receipt-library-grid">
        {receipts.map((receipt) => {
          const isVerified = receipt.confirmations?.some((confirmation) => confirmation.status === "confirmed");
          return <article className={`receipt-library-card ${isVerified ? "is-verified" : ""}`} key={receipt.id}>
            <div className="receipt-library-card-top">
              <div><p className="mini-label">Impact Receipt</p><h2>{receipt.accomplishment}</h2></div>
              <div className="receipt-card-actions">
                <button type="button" className={`visibility-pill ${receipt.is_public ? "public" : "private"}`} disabled={updatingId === receipt.id} onClick={() => toggleVisibility(receipt)}>{updatingId === receipt.id ? "Saving…" : receipt.is_public ? "Public" : "Private"}</button>
                <button type="button" aria-label="Edit Impact Receipt" onClick={() => beginEdit(receipt)}><Pencil size={16} /></button>
                <button type="button" aria-label="Delete Impact Receipt" disabled={updatingId === receipt.id} onClick={() => removeReceipt(receipt)}><Trash2 size={16} /></button>
              </div>
            </div>

            <ReceiptVerificationStatus receipt={receipt} />

            {editingId === receipt.id && editForm && <div className="receipt-create-form receipt-edit-form">
              <label>Accomplishment<input value={editForm.accomplishment} onChange={(event) => updateEdit("accomplishment", event.target.value)} /></label>
              <label>Your contribution<textarea value={editForm.contribution} onChange={(event) => updateEdit("contribution", event.target.value)} /></label>
              <label>Result / impact<textarea value={editForm.result} onChange={(event) => updateEdit("result", event.target.value)} /></label>
              <EvidenceFields items={editForm.evidence} onChange={updateEditEvidence} onAdd={addEditEvidence} onRemove={removeEditEvidence} />
              <label>Skills<input value={editForm.skills} onChange={(event) => updateEdit("skills", event.target.value)} /></label>
              <label><input type="checkbox" checked={editForm.is_public} onChange={(event) => updateEdit("is_public", event.target.checked)} /> This receipt may be shared publicly</label>
              <button type="button" disabled={updatingId === receipt.id} onClick={() => saveEdit(receipt.id)}>Save changes</button>
              <button type="button" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</button>
            </div>}

            <div className="receipt-proof-columns"><div><span>Contribution</span><p>{receipt.contribution}</p></div><div><span>Result</span><p>{receipt.result}</p></div></div>
            {receipt.metrics?.length > 0 && <div className="receipt-signal-row">{receipt.metrics.map((metric, index) => <span key={`${metric.label}-${index}`}>{metric.label}: <strong>{metric.value}</strong>{metric.context ? ` · ${metric.context}` : ""}</span>)}</div>}
            <div className="receipt-chip-row">{receipt.skills?.map((skill) => <span key={skill}>{skill}</span>)}</div>
            {receipt.evidence?.length > 0 && <div className="receipt-evidence-list"><span className="receipt-evidence-heading">Evidence</span>{receipt.evidence.map((item, index) => <div className="receipt-evidence-row" key={`${item.title}-${index}`}><div><strong>{item.title}</strong><span>{formatLabel(item.evidence_type)}</span>{item.description && <p>{item.description}</p>}</div><div className="receipt-evidence-actions">{item.reference && <a href={item.reference.startsWith("http") ? item.reference : undefined} title={item.reference}>{item.reference.startsWith("http") ? <ExternalLink size={15} /> : item.reference}</a>}<span className={`visibility-pill ${item.is_public ? "public" : "private"}`}>{item.is_public ? "Public evidence" : "Private evidence"}</span></div></div>)}</div>}
          </article>;
        })}
      </section>
    )}
  </main>;
}

export default ImpactReceiptsPage;
