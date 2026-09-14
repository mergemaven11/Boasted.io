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
    <section className={`resume-template-library ${compact ? "compact" : ""}`} aria-labelledby="resume-template-library-title">
      <div className="resume-template-library-head">
        <div>
          <span className="resume-template-library-kicker"><ShieldCheck size={14} /> ATS-safe template library</span>
          <h3 id="resume-template-library-title">Choose your presentation.</h3>
          <p>All 12 designs use a single machine-readable content order. Style changes; your structured resume data does not.</p>
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
            >
              <MiniResume template={template} />
              <span className="resume-template-card-copy">
                <span className="resume-template-card-title"><strong>{template.name}</strong>{selected && <em><Check size={12} /> Selected</em>}</span>
                <small>{template.audience}</small>
                <span>{template.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="resume-template-library-note">
        No photos, skill bars, charts, sidebars, or multi-column reading traps. Templates are designed for clean PDF text extraction and easy correction in structured fields.
      </div>
    </section>
  );
}
