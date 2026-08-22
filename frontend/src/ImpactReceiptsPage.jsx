import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import {
  createImpactReceipt,
  deleteImpactReceipt,
  getImpactReceipts,
  updateImpactReceipt,
} from "./api";

const EMPTY_FORM = {
  accomplishment: "",
  contribution: "",
  result: "",
  metricLabel: "",
  metricValue: "",
  metricContext: "",
  evidenceType: "other",
  evidenceTitle: "",
  evidenceReference: "",
  evidenceDescription: "",
  evidencePublic: false,
  skills: "",
  isPublic: false,
};

function formatLabel(value = "") {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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
    const timeoutId = window.setTimeout(() => {
      void loadReceipts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const stats = useMemo(() => {
    const publicCount = receipts.filter((receipt) => receipt.is_public).length;
    const evidenceCount = receipts.reduce(
      (total, receipt) => total + (receipt.evidence?.length ?? 0),
      0,
    );
    const confirmedCount = receipts.reduce(
      (total, receipt) =>
        total +
        (receipt.confirmations?.filter(
          (confirmation) => confirmation.status === "confirmed",
        ).length ?? 0),
      0,
    );

    return { publicCount, evidenceCount, confirmedCount };
  }, [receipts]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitReceipt(event) {
    event.preventDefault();
    setIsCreating(true);
    setError("");
    setSuccess("");

    const skills = form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const metrics =
      form.metricLabel.trim() && form.metricValue.trim()
        ? [
            {
              label: form.metricLabel.trim(),
              value: form.metricValue.trim(),
              context: form.metricContext.trim() || null,
            },
          ]
        : [];

    try {
      await createImpactReceipt({
        accomplishment: form.accomplishment.trim(),
        contribution: form.contribution.trim(),
        result: form.result.trim(),
        metrics,
        evidence: [
          {
            evidence_type: form.evidenceType,
            title: form.evidenceTitle.trim(),
            reference: form.evidenceReference.trim() || null,
            description: form.evidenceDescription.trim() || null,
            is_public: form.evidencePublic,
          },
        ],
        skills,
        credit: [],
        is_public: form.isPublic,
      });

      setForm(EMPTY_FORM);
      setShowCreate(false);
      setSuccess("Impact Receipt saved with evidence.");
      await loadReceipts();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Impact Receipt could not be saved. Check the required fields.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleVisibility(receipt) {
    setUpdatingId(receipt.id);
    setError("");
    try {
      await updateImpactReceipt(receipt.id, {
        is_public: !receipt.is_public,
      });
      await loadReceipts();
    } catch (err) {
      setError(
        err.response?.data?.detail ?? "Receipt visibility could not be changed.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeReceipt(receipt) {
    const confirmed = window.confirm(
      `Delete the Impact Receipt “${receipt.accomplishment}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setUpdatingId(receipt.id);
    setError("");
    setSuccess("");
    try {
      await deleteImpactReceipt(receipt.id);
      setSuccess("Impact Receipt deleted.");
      await loadReceipts();
    } catch (err) {
      setError(err.response?.data?.detail ?? "Impact Receipt could not be deleted.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="product-page receipt-library-page">
      <section className="product-page-hero">
        <div>
          <p className="mini-label">Evidence-backed career proof</p>
          <h1>Impact Receipts</h1>
          <p>
            Capture what you accomplished, what changed, the evidence behind it,
            and the skills you demonstrated. Receipts and evidence stay private
            unless you explicitly choose to share them.
          </p>
        </div>
        <button
          type="button"
          className="product-page-link"
          onClick={() => setShowCreate((current) => !current)}
        >
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          {showCreate ? "Close" : "Create Impact Receipt"}
        </button>
      </section>

      {showCreate && (
        <section className="receipt-library-card receipt-create-card">
          <div className="receipt-library-card-top">
            <div>
              <p className="mini-label">Minimum evidence workflow</p>
              <h2>Create an Impact Receipt</h2>
            </div>
            <span className="visibility-pill private">Private by default</span>
          </div>

          <form onSubmit={submitReceipt} className="receipt-create-form">
            <label>
              Accomplishment
              <input
                required
                maxLength={300}
                value={form.accomplishment}
                onChange={(event) => updateForm("accomplishment", event.target.value)}
                placeholder="What did you accomplish?"
              />
            </label>

            <label>
              Your contribution
              <textarea
                required
                maxLength={2000}
                value={form.contribution}
                onChange={(event) => updateForm("contribution", event.target.value)}
                placeholder="What specifically did you do?"
              />
            </label>

            <label>
              Result / impact
              <textarea
                required
                maxLength={2000}
                value={form.result}
                onChange={(event) => updateForm("result", event.target.value)}
                placeholder="What changed because of your work?"
              />
            </label>

            <div className="receipt-proof-columns">
              <label>
                Metric
                <input
                  value={form.metricLabel}
                  onChange={(event) => updateForm("metricLabel", event.target.value)}
                  placeholder="e.g. Repeat incidents reduced"
                />
              </label>
              <label>
                Metric value
                <input
                  value={form.metricValue}
                  onChange={(event) => updateForm("metricValue", event.target.value)}
                  placeholder="e.g. 25%"
                />
              </label>
            </div>

            <label>
              Metric context
              <input
                value={form.metricContext}
                onChange={(event) => updateForm("metricContext", event.target.value)}
                placeholder="Optional comparison period or context"
              />
            </label>

            <div className="receipt-proof-columns">
              <label>
                Evidence type
                <select
                  value={form.evidenceType}
                  onChange={(event) => updateForm("evidenceType", event.target.value)}
                >
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
              <label>
                Evidence title
                <input
                  required
                  value={form.evidenceTitle}
                  onChange={(event) => updateForm("evidenceTitle", event.target.value)}
                  placeholder="What proves this happened?"
                />
              </label>
            </div>

            <label>
              Evidence reference
              <input
                value={form.evidenceReference}
                onChange={(event) => updateForm("evidenceReference", event.target.value)}
                placeholder="URL, ticket number, PR number, document reference…"
              />
            </label>

            <label>
              Evidence description
              <textarea
                value={form.evidenceDescription}
                onChange={(event) => updateForm("evidenceDescription", event.target.value)}
                placeholder="Why does this evidence support the accomplishment?"
              />
            </label>

            <label>
              Skills demonstrated
              <input
                required
                value={form.skills}
                onChange={(event) => updateForm("skills", event.target.value)}
                placeholder="Docker, Troubleshooting, Python"
              />
            </label>

            <div className="receipt-signal-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.evidencePublic}
                  onChange={(event) => updateForm("evidencePublic", event.target.checked)}
                />
                This evidence may be shared publicly
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(event) => updateForm("isPublic", event.target.checked)}
                />
                This receipt may be shared publicly
              </label>
            </div>

            <button type="submit" disabled={isCreating}>
              {isCreating ? "Saving…" : "Save Impact Receipt"}
            </button>
          </form>
        </section>
      )}

      <section className="receipt-kpi-grid">
        <article>
          <ReceiptText size={20} />
          <span>Total receipts</span>
          <strong>{receipts.length}</strong>
        </article>
        <article>
          <ShieldCheck size={20} />
          <span>Public receipts</span>
          <strong>{stats.publicCount}</strong>
        </article>
        <article>
          <span className="receipt-kpi-dot" />
          <span>Evidence items</span>
          <strong>{stats.evidenceCount}</strong>
        </article>
        <article>
          <span className="receipt-kpi-dot" />
          <span>Confirmed signals</span>
          <strong>{stats.confirmedCount}</strong>
        </article>
      </section>

      {error && <div className="product-alert error">{error}</div>}
      {success && <div className="product-alert success">{success}</div>}

      {isLoading ? (
        <section className="product-empty">Loading Impact Receipts…</section>
      ) : receipts.length === 0 ? (
        <section className="product-empty">
          <h2>No receipts yet.</h2>
          <p>
            Create your first evidence-backed receipt, or turn an existing
            accomplishment into one.
          </p>
          <a href="/app/accomplishments">
            Create from an accomplishment <ExternalLink size={16} />
          </a>
        </section>
      ) : (
        <section className="receipt-library-grid">
          {receipts.map((receipt) => (
            <article className="receipt-library-card" key={receipt.id}>
              <div className="receipt-library-card-top">
                <div>
                  <p className="mini-label">Impact Receipt</p>
                  <h2>{receipt.accomplishment}</h2>
                </div>
                <div className="receipt-card-actions">
                  <button
                    type="button"
                    className={`visibility-pill ${
                      receipt.is_public ? "public" : "private"
                    }`}
                    disabled={updatingId === receipt.id}
                    onClick={() => toggleVisibility(receipt)}
                  >
                    {updatingId === receipt.id
                      ? "Saving…"
                      : receipt.is_public
                        ? "Public"
                        : "Private"}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete Impact Receipt"
                    disabled={updatingId === receipt.id}
                    onClick={() => removeReceipt(receipt)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="receipt-proof-columns">
                <div>
                  <span>Contribution</span>
                  <p>{receipt.contribution}</p>
                </div>
                <div>
                  <span>Result</span>
                  <p>{receipt.result}</p>
                </div>
              </div>

              {receipt.metrics?.length > 0 && (
                <div className="receipt-proof-columns">
                  {receipt.metrics.map((metric, index) => (
                    <div key={`${receipt.id}-metric-${index}`}>
                      <span>{metric.label}</span>
                      <p>
                        <strong>{metric.value}</strong>
                        {metric.context ? ` — ${metric.context}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="receipt-signal-row">
                <span>{receipt.evidence?.length ?? 0} evidence</span>
                <span>{receipt.skills?.length ?? 0} skills</span>
                <span>{receipt.credit?.length ?? 0} contributors</span>
              </div>

              {receipt.skills?.length > 0 && (
                <div className="receipt-chip-row">
                  {receipt.skills.map((skill) => (
                    <span key={`${receipt.id}-${skill}`}>{skill}</span>
                  ))}
                </div>
              )}

              {receipt.trust_signals?.length > 0 && (
                <div className="receipt-trust-row">
                  {receipt.trust_signals.map((signal) => (
                    <span key={`${receipt.id}-${signal}`}>
                      <ShieldCheck size={14} /> {formatLabel(signal)}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default ImpactReceiptsPage;
