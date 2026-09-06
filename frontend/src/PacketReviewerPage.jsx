import {
  ClipboardCheck,
  MessageSquareText,
  PenLine,
  RotateCcw,
} from "lucide-react";

import "./PacketReviewerPage.css";

const REVIEWER_GUIDES = {
  "performance-review": [
    ["Results and impact", "Are the outcomes clear, accurate, and meaningful for the review period?"],
    ["Ownership and contribution", "Is the person’s specific role in the work clear?"],
    ["Collaboration and recognition", "Does the packet show how the work was carried with or recognized by others?"],
    ["Skills and growth", "Does the evidence show capability growth or repeated application?"],
    ["Evidence quality", "Are claims supported well enough to discuss confidently?"],
    ["Review narrative", "Does the packet tell a fair, complete story of the period?"],
  ],
  promotion: [
    ["Expanded scope", "Does the evidence show broader responsibility, complexity, or ownership?"],
    ["Sustained results", "Are the strongest outcomes repeated or durable rather than one-off?"],
    ["Leadership and influence", "Does the record show influence, mentorship, coordination, or initiative where relevant?"],
    ["Next-level capabilities", "Do the documented skills match the expectations of the target level?"],
    ["Evidence quality", "Are the progression claims supported by concrete proof?"],
    ["Case clarity", "Is the argument for progression easy to follow without overstating readiness?"],
  ],
  interview: [
    ["Role relevance", "Are the selected stories relevant to the role or organization?"],
    ["Story clarity", "Can the situation, contribution, result, and learning be understood quickly?"],
    ["Ownership", "Is the candidate’s personal contribution distinct from the team’s work?"],
    ["Outcome strength", "Are results specific and supported where possible?"],
    ["Evidence credibility", "Could the candidate defend the claims if asked for detail?"],
    ["Preparation gaps", "What missing context or follow-up questions should be prepared?"],
  ],
  certification: [
    ["Competency alignment", "Does the evidence map clearly to the credential or licensure expectations?"],
    ["Experience relevance", "Is the documented experience directly relevant to the review?"],
    ["Evidence sufficiency", "Is there enough support for the competencies being claimed?"],
    ["Recency and continuity", "Is the work recent or sustained enough for the stated requirement?"],
    ["Accuracy and compliance", "Are claims precise and free of unsupported or confidential details?"],
    ["Requirement gaps", "What requirements still need stronger proof or clarification?"],
  ],
  "program-application": [
    ["Program alignment", "Does the packet connect the applicant’s evidence to the program’s focus?"],
    ["Growth and learning", "Does the record show learning, persistence, or development?"],
    ["Initiative and impact", "Are there concrete examples of ownership or meaningful contribution?"],
    ["Evidence strength", "Are the strongest statements supported by documented proof?"],
    ["Narrative clarity", "Does the material tell a coherent application story?"],
    ["Missing context", "What should the applicant clarify before submitting?"],
  ],
  scholarship: [
    ["Selection alignment", "Does the evidence connect to the scholarship or award criteria?"],
    ["Leadership or service", "Where relevant, does the packet show initiative, service, or leadership?"],
    ["Documented impact", "Are outcomes specific enough to support the application?"],
    ["Recognition and evidence", "Are meaningful claims backed by evidence or recognition where available?"],
    ["Story clarity", "Does the material support a compelling but factual narrative?"],
    ["Missing context", "What needs clarification before an essay, nomination, or interview?"],
  ],
  portfolio: [
    ["Audience relevance", "Are the selected projects appropriate for the intended audience?"],
    ["Project impact", "Do the examples explain what changed because of the work?"],
    ["Craft and quality", "Does the work demonstrate the quality expected for the field?"],
    ["Skills depth and breadth", "Does the portfolio show the right balance of capability?"],
    ["Evidence credibility", "Are outcomes and claims supported by available proof?"],
    ["Presentation clarity", "Can a reviewer quickly understand the strongest work?"],
  ],
  "career-transition": [
    ["Transferable skills", "Are the strongest transferable capabilities obvious?"],
    ["Target relevance", "Does the packet connect prior work to the target field or role?"],
    ["Evidence bridge", "Are the transition claims grounded in documented examples?"],
    ["Learning and growth", "Does the record show preparation for the new direction?"],
    ["Narrative credibility", "Is the transition story persuasive without claiming undocumented experience?"],
    ["Gaps to address", "What skills, context, or proof should be strengthened next?"],
  ],
};

const FEEDBACK_SECTIONS = [
  ["Strengths / what stands out", MessageSquareText],
  ["Corrections or factual changes", PenLine],
  ["Questions / clarification needed", RotateCcw],
  ["Recommended next steps", ClipboardCheck],
];

function themeClass(packet) {
  return `packet-theme-${packet?.render_config?.theme || "modern-minimal"}`;
}

function PacketReviewerPage({ packet, page, index = 10 }) {
  const criteria = packet?.reviewer_guide?.criteria?.length
    ? packet.reviewer_guide.criteria.map((item) => [item.label, item.prompt])
    : REVIEWER_GUIDES[packet?.kind] || REVIEWER_GUIDES["performance-review"];
  const reviewerName = packet?.branding?.reviewer_name || "";

  return (
    <section className={`packet-sheet packet-document-page packet-reviewer-page ${themeClass(packet)}`}>
      <header className="packet-page-header">
        <div>
          <p>{String(index).padStart(2, "0")} · Reviewer Worksheet</p>
          <h2>Grade the evidence. Leave the record better.</h2>
        </div>
        <div className="packet-page-header-mark">BRAGSTACK</div>
      </header>

      <p className="packet-reviewer-intro">
        Use this page to assess the packet, flag factual corrections, and leave actionable feedback. Ratings are completed by the reviewer—not generated by BragStack.
      </p>

      <div className="packet-reviewer-meta">
        <div><span>Reviewer</span><strong>{reviewerName || "____________________________"}</strong></div>
        <div><span>Role / relationship</span><strong>____________________________</strong></div>
        <div><span>Date</span><strong>________________</strong></div>
        <div><span>Overall assessment</span><strong>____ / 5 &nbsp; or &nbsp; N/A</strong></div>
      </div>

      <section className="packet-reviewer-rubric" aria-label="Reviewer grading rubric">
        <div className="packet-reviewer-rubric-header">
          <div><strong>Section to review</strong><span>1 = needs clarification · 3 = solid · 5 = especially strong</span></div>
          <strong>Grade</strong>
          <strong>Reviewer note</strong>
        </div>
        {criteria.slice(0, 6).map(([label, prompt]) => (
          <div className="packet-reviewer-rubric-row" key={label}>
            <div><strong>{label}</strong><span>{prompt}</span></div>
            <div className="packet-reviewer-grade">____ / 5</div>
            <div className="packet-reviewer-note-line" aria-hidden="true" />
          </div>
        ))}
      </section>

      <div className="packet-reviewer-feedback-grid">
        {FEEDBACK_SECTIONS.map(([label, Icon]) => (
          <section key={label}>
            <div><Icon size={15} /><strong>{label}</strong></div>
            <span className="packet-reviewer-write-line" />
            <span className="packet-reviewer-write-line" />
            <span className="packet-reviewer-write-line" />
          </section>
        ))}
      </div>

      <aside className="packet-reviewer-safety-note">
        <strong>Corrections are suggestions, not automatic edits.</strong>
        <p>Reviewer notes do not overwrite accomplishments, Impact Receipts, evidence, or recognition in BragStack. The packet owner decides what source records should be updated.</p>
      </aside>

      <footer className="packet-page-footer"><span>BragStack · Reviewer Worksheet</span><span>Page {page}</span></footer>
    </section>
  );
}

export default PacketReviewerPage;
