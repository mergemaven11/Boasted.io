import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import ResumeBuilderStructuredPage from "./ResumeBuilderStructuredPage.jsx";
import "./ResumeBuilderGuidedPage.css";
import "./ResumeTemplateGallery.css";

const STEP_LABELS = ["Add resume", "Review & confirm", "Target job", "ATS results"];
const TEMPLATE_STORAGE_KEY = "bragstack_resume_template_v1";
const RESUME_TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    tag: "Traditional",
    description: "Centered header, serif name, strong section rules.",
  },
  {
    id: "modern",
    name: "Modern",
    tag: "Recommended",
    description: "Clean left-aligned layout with a restrained navy accent.",
  },
  {
    id: "executive",
    name: "Executive",
    tag: "Leadership",
    description: "Polished typography and understated senior-level styling.",
  },
  {
    id: "technical",
    name: "Technical",
    tag: "Engineering",
    description: "Compact, scannable spacing for skills-heavy careers.",
  },
  {
    id: "minimal",
    name: "Minimal",
    tag: "Clean",
    description: "Lightweight styling with generous whitespace and simple rules.",
  },
];

function getInitialTemplate() {
  if (typeof window === "undefined") return "modern";
  const stored = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
  return RESUME_TEMPLATES.some((template) => template.id === stored) ? stored : "modern";
}

function focusElement(element) {
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  window.setTimeout(() => {
    const focusTarget = element.matches?.("input, textarea, button, [tabindex]")
      ? element
      : element.querySelector?.("input, textarea, button, [tabindex], h1, h2, h3");
    if (!focusTarget) return;
    if (!focusTarget.hasAttribute("tabindex") && /^H[1-6]$/.test(focusTarget.tagName)) {
      focusTarget.setAttribute("tabindex", "-1");
    }
    focusTarget.focus({ preventScroll: true });
  }, 420);
}

function getStep(host) {
  if (!host) return 1;
  if (host.querySelector(".ats-scan-score-card")) return 4;
  if (host.querySelector(".resume-confirm-shell")) return 2;
  if (host.querySelector(".resume-v2-upload.ready") && host.querySelector(".resume-v2-form .resume-v2-primary:not(:disabled)")) return 3;
  return 1;
}

function destinationForStep(host, step) {
  if (!host) return null;
  if (step === 1) return host.querySelector(".resume-v2-upload");
  if (step === 2) return host.querySelector(".resume-confirm-shell");
  if (step === 3) return host.querySelector(".resume-v2-form");
  return host.querySelector(".ats-scan-score-card") || host.querySelector(".resume-v2-right");
}

export default function ResumeBuilderGuidedPage() {
  const hostRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);
  const [templateId, setTemplateId] = useState(getInitialTemplate);
  const pendingStepRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const syncStep = () => {
      const nextStep = getStep(host);
      setActiveStep(nextStep);
      host.dataset.guidedStep = String(nextStep);

      if (pendingStepRef.current === nextStep) {
        const destination = destinationForStep(host, nextStep);
        if (destination) {
          pendingStepRef.current = null;
          window.requestAnimationFrame(() => focusElement(destination));
        }
      }
    };

    const observer = new MutationObserver(syncStep);
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "disabled"] });

    const handleChange = (event) => {
      if (event.target.matches('input[type="file"]')) pendingStepRef.current = 2;
    };

    const handleClick = (event) => {
      if (event.target.closest(".resume-v2-start-blank")) pendingStepRef.current = 2;
      if (event.target.closest(".resume-v2-saved-item")) pendingStepRef.current = 3;
      if (event.target.closest(".resume-confirm-primary")) pendingStepRef.current = 3;
      if (event.target.closest(".resume-v2-paper-banner button")) pendingStepRef.current = 2;
    };

    const handleSubmit = (event) => {
      if (event.target.matches(".resume-v2-form")) pendingStepRef.current = 4;
    };

    host.addEventListener("change", handleChange, true);
    host.addEventListener("click", handleClick, true);
    host.addEventListener("submit", handleSubmit, true);
    syncStep();

    return () => {
      observer.disconnect();
      host.removeEventListener("change", handleChange, true);
      host.removeEventListener("click", handleClick, true);
      host.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.dataset.resumeTemplate = templateId;
    try {
      window.localStorage.setItem(TEMPLATE_STORAGE_KEY, templateId);
    } catch {
      // Keep template selection usable even when storage is unavailable.
    }
  }, [templateId]);

  function goToStep(step) {
    const destination = destinationForStep(hostRef.current, step);
    if (destination) focusElement(destination);
  }

  return (
    <div className="resume-guided-host" ref={hostRef}>
      <nav className="resume-guided-progress" aria-label="Resume builder steps">
        <div className="resume-guided-mobile-label">Step {activeStep} of 4 · {STEP_LABELS[activeStep - 1]}</div>
        <div className="resume-guided-progress-row">
          {STEP_LABELS.map((label, index) => {
            const step = index + 1;
            const complete = step < activeStep;
            const current = step === activeStep;
            return (
              <button
                key={label}
                type="button"
                className={`${current ? "active" : ""} ${complete ? "done" : ""}`.trim()}
                aria-current={current ? "step" : undefined}
                onClick={() => goToStep(step)}
              >
                <strong>{complete ? "✓" : step}</strong>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <section className="resume-template-gallery" aria-labelledby="resume-template-gallery-title">
        <div className="resume-template-gallery-head">
          <div>
            <span className="resume-template-eyebrow">ATS-FRIENDLY TEMPLATES</span>
            <h2 id="resume-template-gallery-title">Choose your resume style</h2>
            <p>Five visual treatments, one safe reading order. The resume content stays single-column with standard headings, no tables, no text boxes, and the ATS text view stays unchanged.</p>
          </div>
          <div className="resume-template-ats-pill"><ShieldCheck size={16} /><span><strong>ATS-safe structure</strong><small>Style changes only</small></span></div>
        </div>

        <div className="resume-template-options">
          {RESUME_TEMPLATES.map((template) => {
            const selected = template.id === templateId;
            return (
              <button
                type="button"
                className={`resume-template-option ${selected ? "active" : ""}`}
                key={template.id}
                aria-pressed={selected}
                onClick={() => setTemplateId(template.id)}
              >
                <span className={`resume-template-thumb thumb-${template.id}`} aria-hidden="true">
                  <i className="resume-template-thumb-name" />
                  <i className="resume-template-thumb-contact" />
                  <i className="resume-template-thumb-heading" />
                  <i className="resume-template-thumb-line wide" />
                  <i className="resume-template-thumb-line" />
                  <i className="resume-template-thumb-heading second" />
                  <i className="resume-template-thumb-line wide" />
                  <i className="resume-template-thumb-line short" />
                </span>
                <span className="resume-template-option-copy">
                  <span className="resume-template-option-title"><strong>{template.name}</strong><em>{template.tag}</em></span>
                  <span>{template.description}</span>
                  <small className={selected ? "selected" : ""}>{selected ? <><CheckCircle2 size={13} /> Selected</> : "Select template"}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <ResumeBuilderStructuredPage />
    </div>
  );
}
