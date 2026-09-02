import { useEffect, useRef, useState } from "react";
import ResumeBuilderStructuredPage from "./ResumeBuilderStructuredPage.jsx";
import "./ResumeBuilderGuidedPage.css";

const STEP_LABELS = ["Add resume", "Review & confirm", "Target job", "ATS results"];

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
      <ResumeBuilderStructuredPage />
    </div>
  );
}
