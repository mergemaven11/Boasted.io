import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, X } from "lucide-react";

import {
  armConfidentialityAttestation,
  scanSubmissionContainer,
} from "./ndaSafety.js";
import "./NDAInformationGate.css";

const PROTECTED_PATHS = new Set([
  "/app/accomplishments",
  "/app/impact-receipts",
]);

function normalizedPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function isProtectedSubmission(form) {
  const path = normalizedPath();
  if (!PROTECTED_PATHS.has(path)) return false;

  if (path === "/app/accomplishments") {
    return form.classList.contains("modal-card");
  }

  return form.classList.contains("receipt-create-form");
}

function isProtectedActionButton(button) {
  const path = normalizedPath();

  if (path === "/app/accomplishments") {
    return button.classList.contains("proof-visibility-button");
  }

  if (path !== "/app/impact-receipts") return false;

  if (button.closest(".receipt-edit-form")) {
    return button.textContent?.trim() === "Save changes";
  }

  return button.classList.contains("visibility-pill")
    && Boolean(button.closest(".receipt-card-actions"));
}

function safetyContainerForButton(button) {
  return (
    button.closest(".receipt-edit-form") ||
    button.closest(".receipt-library-card") ||
    button.closest(".accomplishment-card") ||
    null
  );
}

function NDAInformationGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [safetyFindings, setSafetyFindings] = useState([]);
  const pendingActionRef = useRef(null);
  const bypassSubmitRef = useRef(null);
  const bypassClickRef = useRef(null);

  const blockingFindings = useMemo(
    () => safetyFindings.filter((item) => item.severity === "block"),
    [safetyFindings],
  );
  const warningFindings = useMemo(
    () => safetyFindings.filter((item) => item.severity === "warning"),
    [safetyFindings],
  );

  const closeGate = useCallback(() => {
    pendingActionRef.current = null;
    setConfirmed(false);
    setSafetyFindings([]);
    setIsOpen(false);
  }, []);

  const queueAction = useCallback((action, container = null) => {
    pendingActionRef.current = action;
    setSafetyFindings(scanSubmissionContainer(container));
    setConfirmed(false);
    setIsOpen(true);
  }, []);

  function continueAction() {
    if (!confirmed || !pendingActionRef.current || blockingFindings.length > 0) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setConfirmed(false);
    setSafetyFindings([]);
    setIsOpen(false);
    armConfidentialityAttestation();
    window.setTimeout(action, 0);
  }

  useEffect(() => {
    function handleSubmit(event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !isProtectedSubmission(form)) return;

      if (bypassSubmitRef.current === form) {
        bypassSubmitRef.current = null;
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      queueAction(() => {
        bypassSubmitRef.current = form;
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit(submitter || undefined);
        } else if (submitter instanceof HTMLElement) {
          submitter.click();
        }
      }, form);
    }

    function handleClick(event) {
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (!(button instanceof HTMLButtonElement) || !isProtectedActionButton(button)) return;

      if (bypassClickRef.current === button) {
        bypassClickRef.current = null;
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      queueAction(() => {
        bypassClickRef.current = button;
        button.click();
      }, safetyContainerForButton(button));
    }

    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [queueAction]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") closeGate();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeGate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="nda-gate-backdrop" role="presentation">
      <section
        className="nda-gate-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nda-gate-title"
        aria-describedby="nda-gate-description"
      >
        <header className="nda-gate-header">
          <div className="nda-gate-title-row">
            <span className="nda-gate-icon"><ShieldCheck size={22} /></span>
            <div>
              <p className="nda-gate-eyebrow">NDA & confidentiality check</p>
              <h2 id="nda-gate-title">Before Boasted sends or publishes this work information</h2>
            </div>
          </div>
          <button type="button" className="nda-gate-close" onClick={closeGate} aria-label="Close confidentiality check">
            <X size={19} />
          </button>
        </header>

        <div className="nda-gate-warning" id="nda-gate-description">
          <AlertTriangle size={19} />
          <p>
            Do not submit information that an NDA, employment agreement, client agreement,
            security policy, or other obligation prohibits you from storing or disclosing.
          </p>
        </div>

        {blockingFindings.length > 0 ? (
          <div className="nda-gate-warning nda-gate-local-scan blocker">
            <AlertTriangle size={19} />
            <div>
              <strong>Boasted found a potential credential or secret pattern.</strong>
              <p>For safety, this submission cannot continue yet. Return to the draft and remove the sensitive material. The scanner does not send your draft anywhere.</p>
            </div>
          </div>
        ) : warningFindings.length > 0 ? (
          <div className="nda-gate-warning nda-gate-local-scan">
            <AlertTriangle size={19} />
            <div>
              <strong>{warningFindings.length} item{warningFindings.length === 1 ? "" : "s"} should be reviewed.</strong>
              <p>The local scan noticed code-like, diagnostic, ticket-style, or internal-reference patterns. Generalize them unless you are authorized to store and disclose them.</p>
            </div>
          </div>
        ) : (
          <div className="nda-gate-local-clear">
            <CheckCircle2 size={17} />
            <span>No obvious credential, code-block, diagnostic, or internal-reference pattern was detected locally. This is not a legal determination.</span>
          </div>
        )}

        <div className="nda-gate-grid">
          <div>
            <strong>Do not upload or paste</strong>
            <ul>
              <li>Nonpublic source code, object code, internal technical details, designs, specifications, or inventions.</li>
              <li>Internal tickets, logs, screenshots, documents, credentials, repository details, or unreleased plans.</li>
              <li>Nonpublic customer, vendor, personnel, financial, pricing, production, performance, or business information.</li>
            </ul>
          </div>
          <div>
            <strong>Safer career evidence</strong>
            <ul>
              <li>Public information or material you are explicitly authorized to disclose and store.</li>
              <li>Sanitized descriptions such as “internal platform,” “enterprise customer,” or “regulated workload.”</li>
              <li>Generalized impact and permitted metrics that preserve the career signal without exposing the secret.</li>
            </ul>
          </div>
        </div>

        <label className="nda-gate-confirmation">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>
            I confirm that the information I am about to submit or publish does not contain
            confidential, proprietary, restricted, or other material I am prohibited from storing or disclosing.
          </span>
        </label>

        <p className="nda-gate-footnote">
          Boasted does not interpret your agreement or decide what your employer or client permits.
          If you are unsure, stop and check the agreement or an authorized legal/security contact. {" "}
          <a href="/nda-safety" target="_blank" rel="noreferrer">Read NDA safety guidance</a>.
        </p>

        <div className="nda-gate-actions">
          <button type="button" className="nda-gate-cancel" onClick={closeGate}>Cancel</button>
          <button
            type="button"
            className="nda-gate-continue"
            onClick={continueAction}
            disabled={!confirmed || blockingFindings.length > 0}
          >
            {blockingFindings.length > 0 ? "Remove sensitive material first" : "I confirm — continue"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default NDAInformationGate;
