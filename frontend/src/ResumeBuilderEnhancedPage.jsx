import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutTemplate, X } from "lucide-react";
import ResumeBuilderStructuredPage from "./ResumeBuilderStructuredPage.jsx";
import ResumeTemplateLibrary from "./ResumeTemplateLibrary.jsx";
import { DEFAULT_RESUME_TEMPLATE_ID, getResumeTemplate } from "./resumeTemplates.js";
import "./ResumeBuilderEnhancedPage.css";

const STORAGE_KEY = "boasted_resume_template_v1";

function storedTemplateId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_RESUME_TEMPLATE_ID;
  } catch {
    return DEFAULT_RESUME_TEMPLATE_ID;
  }
}

export default function ResumeBuilderEnhancedPage() {
  const hostRef = useRef(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(storedTemplateId);
  const [emptyTarget, setEmptyTarget] = useState(null);
  const [centerTarget, setCenterTarget] = useState(null);
  const [paperBannerTarget, setPaperBannerTarget] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedTemplate = useMemo(() => getResumeTemplate(selectedTemplateId), [selectedTemplateId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const syncTargets = () => {
      const empty = host.querySelector(".resume-v2-empty");
      const center = host.querySelector(".resume-v2-center");
      const paper = host.querySelector(".resume-v2-paper");
      const banner = host.querySelector(".resume-v2-paper-banner");
      setEmptyTarget((current) => current === empty ? current : empty);
      setCenterTarget((current) => current === center ? current : center);
      setPaperBannerTarget((current) => current === banner ? current : banner);

      if (paper) {
        const templateClasses = Array.from(paper.classList).filter((value) => value.startsWith("resume-template-"));
        const alreadyApplied = templateClasses.length === 1 && templateClasses[0] === selectedTemplate.className;
        if (!alreadyApplied) {
          templateClasses.forEach((templateClass) => paper.classList.remove(templateClass));
          paper.classList.add(selectedTemplate.className);
        }
        if (paper.dataset.resumeTemplate !== selectedTemplate.id) paper.dataset.resumeTemplate = selectedTemplate.id;
      }
    };

    syncTargets();
    const observer = new MutationObserver(syncTargets);
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [selectedTemplate]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const clearStaleSectionSnapshot = (event) => {
      if (!event.target.closest(".resume-v2-saved-item")) return;
      try {
        sessionStorage.removeItem("boasted_resume_supporting_sections_v1");
      } catch {
        // No-op when storage is unavailable.
      }
    };
    host.addEventListener("click", clearStaleSectionSnapshot, true);
    return () => host.removeEventListener("click", clearStaleSectionSnapshot, true);
  }, []);

  function chooseTemplate(templateId) {
    setSelectedTemplateId(templateId);
    try {
      localStorage.setItem(STORAGE_KEY, templateId);
    } catch {
      // Template choice still works for the current session.
    }
    setPickerOpen(false);
  }

  return (
    <div className="resume-enhanced-host" ref={hostRef}>
      <ResumeBuilderStructuredPage />

      {emptyTarget && createPortal(
        <>
          <div className="resume-template-pipeline" aria-label="Resume reconstruction workflow">
            <span>Upload</span><b>→</b><span>Extract</span><b>→</b><span>Reconstruct</span><b>→</b><span>Confidence check</span><b>→</b><span>Correct fields</span><b>→</b><span>Master resume</span><b>→</b><span>Template</span><b>→</b><span>ATS text & export</span>
          </div>
          <ResumeTemplateLibrary selectedId={selectedTemplateId} onSelect={chooseTemplate} />
        </>,
        emptyTarget,
      )}

      {paperBannerTarget && createPortal(
        <button type="button" className="resume-template-change-button" onClick={() => setPickerOpen(true)}>
          <LayoutTemplate size={14} /> {selectedTemplate.name}
        </button>,
        paperBannerTarget,
      )}

      {pickerOpen && centerTarget && createPortal(
        <div className="resume-template-picker-overlay" role="dialog" aria-modal="true" aria-label="Choose resume template">
          <div className="resume-template-picker-toolbar"><strong>Resume templates</strong><button type="button" onClick={() => setPickerOpen(false)} aria-label="Close template picker"><X size={16} /></button></div>
          <ResumeTemplateLibrary selectedId={selectedTemplateId} onSelect={chooseTemplate} compact />
        </div>,
        centerTarget,
      )}
    </div>
  );
}
