import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  FileStack,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PacketHistoryPanel from "./PacketHistoryPanel.jsx";
import { PACKET_TYPES, getPacketType } from "./packetCatalog.js";
import "./PacketBuilderPanel.css";
import "./PacketTypeChooser.css";

const CAREER_AREAS = ["", "Healthcare", "Education", "Technology", "Sales", "Operations", "Skilled Trades", "Creative", "Customer Service", "Management", "Government", "Nonprofit", "Student", "Other"];
const CREDENTIAL_REVIEW_TYPES = ["Certification / Licensure Review", "License Renewal", "Certification Review", "Recertification", "Continuing Education Review", "Competency Review", "Other Credential Review"];
const APPLICATION_TYPES = ["Program application", "Academic program", "Fellowship", "Residency", "Apprenticeship", "Leadership program", "Training program", "Other program"];
const PERFORMANCE_SECTIONS = [
  ["impact-analytics", "Impact Analytics"],
  ["signature-accomplishments", "Signature Accomplishments"],
  ["measurable-results", "Measurable Results"],
  ["skills-growth", "Skills & Growth"],
  ["contribution-recognition", "Contribution & Verified Recognition"],
  ["impact-receipts", "Impact Receipt appendix"],
  ["evidence-index", "Evidence Index"],
  ["review-summary", "Review Summary & talking points"],
];
const THEMES = [
  ["classic-dossier", "Classic dossier"],
  ["modern-minimal", "Modern minimal"],
  ["executive-report", "Executive report"],
];

function PacketBuilderPanel({ options, onChange, onBuild, isLoading, error, highlights = [], showTypeChooser = true }) {
  const packetType = options.packetType || "performance-review";
  const spec = getPacketType(packetType);
  const isPerformance = packetType === "performance-review";
  const isPromotion = packetType === "promotion";
  const isInterview = packetType === "interview";
  const isCertification = packetType === "certification";
  const isProgram = packetType === "program-application";
  const isScholarship = packetType === "scholarship";
  const isPortfolio = packetType === "portfolio";
  const isTransition = packetType === "career-transition";
  const selectedEntryIds = options.selectedEntryIds ?? [];
  const signatureEntryIds = options.signatureEntryIds ?? [];
  const selectedSections = options.sections ?? PERFORMANCE_SECTIONS.map(([key]) => key);
  const canFeatureAccomplishments = isPerformance || isProgram || isScholarship || isPortfolio || isTransition;

  function update(name, value) {
    onChange((current) => ({ ...current, [name]: value }));
  }

  function changePacketType(value) {
    onChange((current) => ({
      ...current,
      packetType: value,
      ...(value === "interview" && !(current.selectedEntryIds?.length)
        ? { selectedEntryIds: highlights.slice(0, 5).map((item) => item.entry_id).filter(Boolean) }
        : {}),
    }));
  }

  function toggleList(name, entryId, max = 8) {
    onChange((current) => {
      const selected = current[name] ?? [];
      if (selected.includes(entryId)) return { ...current, [name]: selected.filter((id) => id !== entryId) };
      if (selected.length >= max) return current;
      return { ...current, [name]: [...selected, entryId] };
    });
  }

  function moveSignature(entryId, direction) {
    onChange((current) => {
      const selected = [...(current.signatureEntryIds ?? [])];
      const index = selected.indexOf(entryId);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= selected.length) return current;
      [selected[index], selected[next]] = [selected[next], selected[index]];
      return { ...current, signatureEntryIds: selected };
    });
  }

  function toggleSection(section) {
    onChange((current) => {
      const selected = current.sections ?? PERFORMANCE_SECTIONS.map(([key]) => key);
      return {
        ...current,
        sections: selected.includes(section)
          ? selected.filter((value) => value !== section)
          : PERFORMANCE_SECTIONS.map(([key]) => key).filter((value) => [...selected, section].includes(value)),
      };
    });
  }

  function setItemNote(entryId, note) {
    onChange((current) => ({
      ...current,
      itemNotes: { ...(current.itemNotes ?? {}), [entryId]: note },
    }));
  }

  return <>
    <PacketHistoryPanel refreshKey={isLoading} compact />
    <section className="packet-builder-pro" aria-labelledby="packet-builder-title">
      <div className="packet-builder-pro-header">
        <div className="packet-builder-pro-icon"><FileStack size={22} /></div>
        <div><span>Boasted Pro · Professional Packet</span><h2 id="packet-builder-title">Build {spec.label}</h2><p>{spec.description}</p><p className="packet-builder-example"><strong>Example:</strong> {spec.example}</p></div>
      </div>

      <aside className="packet-data-strength-note">
        <Sparkles size={18} />
        <div><strong>More proof makes a stronger packet.</strong><p>The more data you submit—accomplishments, Impact Receipts, evidence, skills, verified recognition, and measurable results—the more accurate and helpful your packet can be. Boasted only uses the proof you have actually saved.</p></div>
      </aside>

      {showTypeChooser && <div className="packet-type-chooser" role="group" aria-label="Choose packet type">
        {PACKET_TYPES.map((type) => {
          const active = packetType === type.value;
          return <button type="button" key={type.value} className={active ? "active" : ""} aria-pressed={active} onClick={() => changePacketType(type.value)}><span className="packet-type-check" aria-hidden="true">{active ? "✓" : ""}</span><strong>{type.label}</strong><small>{type.description}</small></button>;
        })}
      </div>}

      <div className="packet-builder-fields">
        <label><span>Career / work area</span><select value={options.careerArea ?? ""} onChange={(event) => update("careerArea", event.target.value)}>{CAREER_AREAS.map((area) => <option key={area || "neutral"} value={area}>{area || "Career-neutral"}</option>)}</select></label>
        <label><span>Current role / headline</span><input type="text" value={options.roleTitle ?? ""} onChange={(event) => update("roleTitle", event.target.value)} placeholder="Software Engineer, Student, RN, Operations Lead" maxLength={160} /></label>
        <label><span>Current organization / school</span><input type="text" value={options.organization ?? ""} onChange={(event) => update("organization", event.target.value)} placeholder="Optional" maxLength={180} /></label>

        {isPromotion && <><label><span>Target role</span><input value={options.targetRole ?? ""} onChange={(event) => update("targetRole", event.target.value)} placeholder="Senior Manager, Lead Teacher, RN II" maxLength={160} /></label><label><span>Target level / progression</span><input value={options.targetLevel ?? ""} onChange={(event) => update("targetLevel", event.target.value)} placeholder="Optional level, grade, or step" maxLength={120} /></label></>}
        {isInterview && <><label><span>Target role</span><input value={options.targetRole ?? ""} onChange={(event) => update("targetRole", event.target.value)} placeholder="Assistant Principal, Store Manager, Designer" maxLength={160} /></label><label><span>Target organization</span><input value={options.targetOrganization ?? ""} onChange={(event) => update("targetOrganization", event.target.value)} placeholder="Optional employer" maxLength={180} /></label></>}
        {isCertification && <><label><span>Credential / license name</span><input value={options.credentialName ?? ""} onChange={(event) => update("credentialName", event.target.value)} placeholder="RN License Renewal, OSHA 30, Teaching Certificate" maxLength={180} /></label><label><span>Issuing / reviewing body</span><input value={options.issuingBody ?? ""} onChange={(event) => update("issuingBody", event.target.value)} placeholder="Board, agency, association, employer" maxLength={180} /></label><label><span>Review type</span><select value={options.reviewType ?? CREDENTIAL_REVIEW_TYPES[0]} onChange={(event) => update("reviewType", event.target.value)}>{CREDENTIAL_REVIEW_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label className="packet-builder-wide-field"><span>Requirements / notes</span><textarea value={options.requirementNotes ?? ""} onChange={(event) => update("requirementNotes", event.target.value)} placeholder="Renewal requirements, competency areas, documents requested, or other review notes." maxLength={1200} rows={3} /></label></>}
        {isProgram && <><label><span>Program name</span><input value={options.programName ?? ""} onChange={(event) => update("programName", event.target.value)} placeholder="Cybersecurity Fellowship, BSN Program, Leadership Academy" maxLength={180} /></label><label><span>Institution / provider</span><input value={options.institutionName ?? ""} onChange={(event) => update("institutionName", event.target.value)} placeholder="School, employer, association, training provider" maxLength={180} /></label><label><span>Application type</span><select value={options.applicationType ?? APPLICATION_TYPES[0]} onChange={(event) => update("applicationType", event.target.value)}>{APPLICATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label><span>Application deadline</span><input type="date" value={options.applicationDeadline ?? ""} onChange={(event) => update("applicationDeadline", event.target.value)} /></label><label className="packet-builder-wide-field"><span>Prompt / requirements</span><textarea value={options.applicationPrompt ?? ""} onChange={(event) => update("applicationPrompt", event.target.value)} placeholder="Paste the program prompt, selection criteria, prerequisites, or what you want this packet to emphasize." maxLength={1800} rows={4} /></label></>}
        {isScholarship && <><label><span>Scholarship / award name</span><input value={options.scholarshipName ?? ""} onChange={(event) => update("scholarshipName", event.target.value)} placeholder="Community Leadership Scholarship" maxLength={180} /></label><label><span>Sponsor / organization</span><input value={options.sponsorName ?? ""} onChange={(event) => update("sponsorName", event.target.value)} placeholder="Foundation, school, employer, association" maxLength={180} /></label><label><span>Selection focus</span><input value={options.awardFocus ?? ""} onChange={(event) => update("awardFocus", event.target.value)} placeholder="Leadership, service, innovation, academic growth" maxLength={180} /></label><label><span>Deadline</span><input type="date" value={options.scholarshipDeadline ?? ""} onChange={(event) => update("scholarshipDeadline", event.target.value)} /></label><label className="packet-builder-wide-field"><span>Essay prompt / award criteria</span><textarea value={options.essayPrompt ?? ""} onChange={(event) => update("essayPrompt", event.target.value)} placeholder="Paste the essay prompt or award criteria so your proof is organized around the actual request." maxLength={1800} rows={4} /></label></>}
        {isPortfolio && <><label><span>Portfolio title</span><input value={options.portfolioTitle ?? ""} onChange={(event) => update("portfolioTitle", event.target.value)} placeholder="Platform Engineering Portfolio" maxLength={180} /></label><label><span>Audience / reviewer</span><input value={options.portfolioAudience ?? ""} onChange={(event) => update("portfolioAudience", event.target.value)} placeholder="Recruiter, hiring manager, client, faculty panel" maxLength={180} /></label><label><span>Portfolio focus</span><input value={options.portfolioFocus ?? ""} onChange={(event) => update("portfolioFocus", event.target.value)} placeholder="Reliability, leadership, design, customer impact" maxLength={180} /></label><label className="packet-builder-wide-field"><span>Project / showcase notes</span><textarea value={options.projectNotes ?? ""} onChange={(event) => update("projectNotes", event.target.value)} placeholder="What should the reader understand about the work you want to showcase?" maxLength={1800} rows={4} /></label></>}
        {isTransition && <><label><span>Target industry / field</span><input value={options.targetIndustry ?? ""} onChange={(event) => update("targetIndustry", event.target.value)} placeholder="Cloud engineering, healthcare, education, product operations" maxLength={180} /></label><label><span>Target role</span><input value={options.targetRole ?? ""} onChange={(event) => update("targetRole", event.target.value)} placeholder="Platform Engineer, Program Manager, RN" maxLength={160} /></label><label><span>Transition goal</span><input value={options.transitionGoal ?? ""} onChange={(event) => update("transitionGoal", event.target.value)} placeholder="Move from support engineering into platform engineering" maxLength={300} /></label><label className="packet-builder-wide-field"><span>Transferable skills to emphasize</span><textarea value={options.transferableSkillsFocus ?? ""} onChange={(event) => update("transferableSkillsFocus", event.target.value)} placeholder="Troubleshooting, incident response, customer communication, automation, leadership..." maxLength={1200} rows={3} /></label><label className="packet-builder-wide-field"><span>Transition notes</span><textarea value={options.transitionNotes ?? ""} onChange={(event) => update("transitionNotes", event.target.value)} placeholder="Context, constraints, goals, or experience that should shape the transition story." maxLength={1800} rows={4} /></label></>}
      </div>

      {canFeatureAccomplishments && <section className="packet-story-picker packet-feature-picker" aria-label="Featured accomplishment selection"><div className="packet-story-picker-heading"><div><span>Featured proof</span><strong>{signatureEntryIds.length} of 8 selected</strong></div><p>Optional. Select the accomplishments you most want this packet to emphasize. Leave everything unselected to let Boasted rank your strongest documented proof automatically.</p></div>{highlights.length ? <div className="packet-story-options packet-signature-options">{highlights.map((highlight) => { const selected = signatureEntryIds.includes(highlight.entry_id); const selectedIndex = signatureEntryIds.indexOf(highlight.entry_id); return <div key={highlight.entry_id} className={`packet-signature-option ${selected ? "selected" : ""}`}><label><input type="checkbox" checked={selected} disabled={!selected && signatureEntryIds.length >= 8} onChange={() => toggleList("signatureEntryIds", highlight.entry_id)} /><span><strong>{highlight.title}</strong><small>{highlight.category || "Accomplishment"}{highlight.result ? ` · ${highlight.result}` : ""}</small></span></label>{selected && <div className="packet-reorder"><button type="button" disabled={selectedIndex === 0} onClick={() => moveSignature(highlight.entry_id, -1)} aria-label="Move up"><ArrowUp size={14} /></button><span>{selectedIndex + 1}</span><button type="button" disabled={selectedIndex === signatureEntryIds.length - 1} onClick={() => moveSignature(highlight.entry_id, 1)} aria-label="Move down"><ArrowDown size={14} /></button></div>}</div>; })}</div> : <p className="packet-story-empty">Add accomplishments to give this packet more material to work with.</p>}</section>}

      {isPerformance && <div className="packet-platform-grid"><section className="packet-platform-panel"><div className="packet-platform-heading"><FileStack size={17} /><div><strong>Packet sections</strong><span>Cover + Executive Scorecard always stay</span></div></div><div className="packet-section-checks">{PERFORMANCE_SECTIONS.map(([key, label]) => <label key={key}><input type="checkbox" checked={selectedSections.includes(key)} onChange={() => toggleSection(key)} /><span>{label}</span></label>)}</div></section><section className="packet-platform-panel"><div className="packet-platform-heading"><ShieldCheck size={17} /><div><strong>Manager-ready annotations</strong><span>User-authored context · never counted as evidence</span></div></div><label className="packet-platform-field"><span>Packet context note</span><textarea rows={3} maxLength={1500} value={options.packetNote ?? ""} onChange={(event) => update("packetNote", event.target.value)} placeholder="Constraints, scope changes, next-step goals, or context for the review conversation." /></label>{signatureEntryIds.length > 0 && <div className="packet-item-notes">{signatureEntryIds.map((entryId) => { const item = highlights.find((highlight) => highlight.entry_id === entryId); return <label className="packet-platform-field" key={entryId}><span>{item?.title || "Selected accomplishment"}</span><input maxLength={800} value={options.itemNotes?.[entryId] ?? ""} onChange={(event) => setItemNote(entryId, event.target.value)} placeholder="Optional packet-only context" /></label>; })}</div>}<label className="packet-evidence-export-toggle"><input type="checkbox" checked={options.includeNotes !== false} onChange={(event) => update("includeNotes", event.target.checked)} /><span>Include annotations in preview/download<small>Turn off to keep user-authored context out of the exported packet.</small></span></label></section></div>}

      {isInterview && <section className="packet-story-picker" aria-label="Interview story selection"><div className="packet-story-picker-heading"><div><span>Choose your interview stories</span><strong>{selectedEntryIds.length} of 8 selected</strong></div><p>Pick the accomplishments you actually want to discuss. Boasted will not invent missing story details.</p></div>{highlights.length ? <div className="packet-story-options">{highlights.map((highlight) => { const checked = selectedEntryIds.includes(highlight.entry_id); return <label key={highlight.entry_id} className={checked ? "selected" : ""}><input type="checkbox" checked={checked} disabled={!checked && selectedEntryIds.length >= 8} onChange={() => toggleList("selectedEntryIds", highlight.entry_id)} /><span><strong>{highlight.title}</strong><small>{highlight.category || "Accomplishment"}{highlight.result ? ` · ${highlight.result}` : ""}</small></span></label>; })}</div> : <p className="packet-story-empty">Add accomplishments to choose interview stories.</p>}<label className="packet-evidence-export-toggle"><input type="checkbox" checked={options.includeEvidenceReferences === true} onChange={(event) => update("includeEvidenceReferences", event.target.checked)} /><span>Include evidence references in this packet<small>Off by default so private proof stays private unless you explicitly export it.</small></span></label></section>}

      <section className="packet-presentation-panel">
        <div className="packet-platform-heading"><Palette size={17} /><div><strong>Document style & download</strong><span>The theme changes presentation, never the underlying facts.</span></div></div>
        <div className="packet-presentation-fields">
          <label><span>Theme</span><select value={options.theme ?? "modern-minimal"} onChange={(event) => update("theme", event.target.value)}>{THEMES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label><span>Prepared for</span><input value={options.reviewerName ?? ""} onChange={(event) => update("reviewerName", event.target.value)} placeholder="Manager, committee, recruiter, reviewer" maxLength={120} /></label>
          <label><span>Cover label</span><input value={options.brandName ?? ""} onChange={(event) => update("brandName", event.target.value)} placeholder="Optional organization or personal brand" maxLength={120} /></label>
        </div>
        <div className="packet-format-choice" role="radiogroup" aria-label="Preferred download format">
          <button type="button" className={(options.exportFormat ?? "pdf") === "pdf" ? "active" : ""} onClick={() => update("exportFormat", "pdf")} aria-pressed={(options.exportFormat ?? "pdf") === "pdf"}><strong>PDF</strong><span>Polished, fixed-layout sharing</span></button>
          <button type="button" className={options.exportFormat === "docx" ? "active" : ""} onClick={() => update("exportFormat", "docx")} aria-pressed={options.exportFormat === "docx"}><strong>DOCX</strong><span>Editable Microsoft Word document</span></button>
        </div>
      </section>

      <div className="packet-builder-pro-footer">
        <label className="packet-confidential-toggle"><input type="checkbox" checked={options.confidential !== false} onChange={(event) => update("confidential", event.target.checked)} /><span><ShieldCheck size={16} />Mark packet confidential</span></label>
        <div className="packet-builder-pro-action"><div><BriefcaseBusiness size={16} />Uses your saved Boasted proof</div><button type="button" onClick={onBuild} disabled={isLoading || (isInterview && selectedEntryIds.length === 0)}>{isLoading ? "Building packet…" : `Build ${spec.shortLabel} preview`}</button></div>
      </div>
      {error && <p className="packet-builder-pro-error">{String(error)}</p>}
    </section>
  </>;
}

export default PacketBuilderPanel;
