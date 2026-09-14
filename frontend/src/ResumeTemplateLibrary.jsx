import { Check, ShieldCheck } from "lucide-react";
import { RESUME_TEMPLATES } from "./resumeTemplates.js";
import "./ResumeTemplateLibrary.css";

function MiniResume({ template }) {
  return (
    <div className={`resume-template-mini ${template.className}`} aria-hidden="true">
      <div className="resume-template-mini-name" />
      <div className="resume-template-mini-contact" />
      <div className="resume-template-mini-rule" />
      <div className="resume-template-mini-heading" />
      <div className="resume-template-mini-line wide" />
      <div className="resume-template-mini-line" />
      <div className="resume-template-mini-heading second" />
      <div className="resume-template-mini-line wide" />
      <div className="resume-template-mini-line wide" />
      <div className="resume-template-mini-line short" />
      <div className="resume-template-mini-heading third" />
      <div className="resume-template-mini-line" />
      <div className="resume-template-mini-line short" />
    </div>
  );
}

export default function ResumeTemplateLibrary({ selectedId, onSelect, compact = false }) {
  return (
    <section
      className={`resume-template-library ${compact ? "compact" : ""}`}
      aria-labelledby="resume-template-library-title"
    >
      <div className="resume-template-library-head">
        <div className="resume-template-library-heading-copy">
          <span className="resume-template-library-kicker">
            <ShieldCheck size={14} /> ATS-safe template library
          </span>
          <h3 id="resume-template-library-title">Choose your presentation.</h3>
          <p>
            Pick the look that fits your story. Every design keeps the same clean,
            machine-readable resume structure underneath.
          </p>
        </div>
        <span className="resume-template-library-count">12 templates</span>
      </div>

      <div className="resume-template-grid">
        {RESUME_TEMPLATES.map((template) => {
          const selected = selectedId === template.id;

          return (
            <button
              type="button"
              key={template.id}
              className={`resume-template-card ${selected ? "selected" : ""}`}
              onClick={() => onSelect(template.id)}
              aria-pressed={selected}
              aria-label={`${selected ? "Selected" : "Choose"} ${template.name} resume template`}
            >
              <span className="resume-template-preview-shell">
                <MiniResume template={template} />
                {selected && (
                  <span className="resume-template-selected-badge" aria-hidden="true">
                    <Check size={13} /> Selected
                  </span>
                )}
              </span>

              <span className="resume-template-card-copy">
                <span className="resume-template-card-title">
                  <strong>{template.name}</strong>
                  <span className="resume-template-card-action" aria-hidden="true">
                    {selected ? "Active" : "Choose"}
                  </span>
                </span>
                <small>{template.audience}</small>
                <span className="resume-template-card-description">{template.description}</span>
                <span className="resume-template-card-meta" aria-hidden="true">
                  <ShieldCheck size={13} /> ATS-safe
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="resume-template-library-note">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>
          Built for clean PDF text extraction: no photos, charts, skill bars, sidebars,
          or multi-column reading traps.
        </span>
      </div>
    </section>
  );
}
