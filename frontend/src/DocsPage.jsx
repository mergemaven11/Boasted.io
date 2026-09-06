import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  FileText,
  HeartPulse,
  Mic2,
  Plug,
  ReceiptText,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import DocsFeatureWalkthroughs from "./DocsFeatureWalkthroughs";
import "./DocsPage.css";

const sections = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Start here",
    blurb: "The simplest way to understand Boasted.",
    text: "Boasted helps you remember meaningful work, turn it into career proof, and reuse that proof when you need it.",
    bullets: [
      "Capture an accomplishment while the details are still fresh.",
      "Write down what you personally did and what changed afterward.",
      "Add safe evidence when you have it.",
      "Reuse the same proof for resumes, interviews, reviews, promotions, and your public profile.",
      "Keep your workspace private unless you deliberately choose to share something.",
    ],
  },
  {
    id: "dashboard",
    icon: BriefcaseBusiness,
    title: "Career Dashboard",
    blurb: "A quick view of the career proof you have already captured.",
    text: "The dashboard is your starting point when you want to see recent accomplishments, skills, evidence, and Impact Receipts without opening every part of your workspace.",
    bullets: [
      "See how much career proof you have documented.",
      "Review recent accomplishments without digging through your full library.",
      "Spot skills and themes that appear repeatedly in your work.",
      "See which important accomplishments may be worth turning into Impact Receipts.",
      "Jump quickly into the next task you want to complete.",
    ],
  },
  {
    id: "accomplishments",
    icon: FileText,
    title: "Accomplishments Library",
    blurb: "Your searchable history of meaningful work.",
    text: "Accomplishments are the raw career stories you capture before the details disappear from memory. Save enough context that your future self can understand the situation, your action, and the outcome.",
    bullets: [
      "Record work from a current job, previous job, side project, learning experience, open-source work, or personal development.",
      "Capture the situation, what you did, what changed, and what you learned.",
      "Add skills or tags so useful examples are easier to find later.",
      "Search your library when you need a story for a resume, interview, review, or promotion conversation.",
      "Choose carefully before marking any accomplishment public.",
    ],
  },
  {
    id: "daily-workflow",
    icon: UserRound,
    title: "Your everyday workflow",
    blurb: "A small habit that makes future career moments easier.",
    text: "You do not need to record every task. Save the work you would want to remember six months from now.",
    bullets: [
      "A problem you solved.",
      "A customer or teammate you helped.",
      "A process you improved.",
      "Something you built, launched, fixed, led, or learned.",
      "A result that shows growth, ownership, reliability, leadership, or impact.",
    ],
  },
  {
    id: "impact-receipts",
    icon: ReceiptText,
    title: "Impact Receipts",
    blurb: "Your reusable record of career proof.",
    text: "An Impact Receipt keeps the important parts of a work story together so you do not have to rebuild it from memory later.",
    bullets: [
      "What happened — the accomplishment or situation.",
      "What you did — your personal contribution.",
      "What changed — the result or impact.",
      "What supports it — a safe reference, link, note, metric, or other evidence when available.",
      "What it shows — skills, strengths, and shared credit.",
    ],
  },
  {
    id: "verification",
    icon: ShieldCheck,
    title: "Receipt Verification",
    blurb: "Optional confirmation from someone who knows the work.",
    text: "When a collaborator, manager, stakeholder, or organization genuinely knows the work behind an Impact Receipt, you can ask them to confirm whether the claim accurately describes your contribution and result.",
    bullets: [
      "Choose a receipt that the verifier actually has enough context to review.",
      "Send a private confirmation request.",
      "The verifier can review the claim without creating a Boasted account.",
      "They can confirm or decline the specific claim.",
      "Their email address is kept private and is not displayed on your public profile.",
    ],
  },
  {
    id: "resume-builder",
    icon: FileText,
    title: "Resume Builder",
    blurb: "Build a focused resume from proof you already captured.",
    text: "Give Boasted the job you want, choose the proof that fits, and turn your real accomplishments into a stronger resume draft.",
    bullets: [
      "Paste the target role and job description.",
      "Choose accomplishments that genuinely support that opportunity.",
      "Turn those wins into concise resume language.",
      "See areas where the job asks for something your current proof does not show.",
      "Edit the final draft so it stays accurate and sounds like you.",
    ],
  },
  {
    id: "career-intelligence",
    icon: BrainCircuit,
    title: "Boasted Career Intelligence™",
    blurb: "Plain-language guidance about the strength of your career story.",
    text: "Career Intelligence helps you understand whether an accomplishment or answer clearly shows the skill, result, or experience you are trying to communicate.",
    bullets: [
      "Helps you choose the most useful proof for a job or career goal.",
      "Points out when a story is too vague or missing your personal contribution.",
      "Highlights when a result or example is clear and convincing.",
      "Uses your saved career proof when you choose to personalize a feature with it.",
      "Supports coaching in Resume Builder and Practice Interview without inventing experience for you.",
    ],
  },
  {
    id: "interviewer",
    icon: Mic2,
    title: "Practice Interview",
    blurb: "Practice real answers and learn what to improve next.",
    text: "Choose the job you are preparing for and Aisha guides you through one question at a time. Speak or type naturally, then use the feedback to strengthen your next attempt.",
    bullets: [
      "Choose a target role, experience level, interview type, and number of questions.",
      "Paste a job description when you want the practice to feel more specific to an opportunity.",
      "Optionally personalize the session with your own Impact Receipts.",
      "Answer one question at a time instead of memorizing a script.",
      "Read coaching on clarity, relevance, ownership, structure, specificity, impact, and communication.",
      "Use follow-up prompts to strengthen weak parts of an answer.",
      "Finish with a summary of what to keep and what to practice next.",
    ],
  },
  {
    id: "analytics",
    icon: TrendingUp,
    title: "Career Analytics",
    blurb: "See recurring themes in the career proof you have actually recorded.",
    text: "Career Analytics helps you step back from individual accomplishments and notice patterns across your record, such as skills you demonstrate repeatedly, the types of work you do most often, and how much evidence you have collected.",
    bullets: [
      "See totals for accomplishments, Impact Receipts, evidence, and other recorded proof.",
      "Notice skills that appear repeatedly across your career stories.",
      "Review the mix of work and accomplishments you have captured.",
      "Use the patterns as preparation for career conversations rather than as invented rankings or promises.",
    ],
  },
  {
    id: "career-packets",
    icon: BriefcaseBusiness,
    title: "Career Packets",
    blurb: "Package selected proof for one specific career moment.",
    text: "Career Packets help you choose the right recorded examples for the situation in front of you instead of handing someone your entire proof library.",
    bullets: [
      "Prepare a performance review from selected accomplishments and results.",
      "Build a promotion case around growth, ownership, scope, and repeated impact.",
      "Create an interview packet with useful stories to review before the conversation.",
      "Create a certification packet when you need organized evidence of relevant work.",
      "Review every packet before using it and remove confidential details that do not belong.",
    ],
  },
  {
    id: "evidence",
    icon: ShieldCheck,
    title: "Evidence without oversharing",
    blurb: "Support your story while protecting confidential information.",
    text: "Evidence should make a claim easier to trust, not create a privacy or security problem.",
    bullets: [
      "Useful evidence can be an approved screenshot, ticket reference, launch note, metric, message, commit, or manager feedback.",
      "Do not save passwords, access tokens, API keys, customer secrets, restricted code, or confidential documents.",
      "Generalize customer names, internal systems, unreleased work, and sensitive metrics when needed.",
      "If the original proof must stay at work, save a safe summary or reference instead.",
    ],
  },
  {
    id: "reviews",
    icon: BriefcaseBusiness,
    title: "Reviews, promotions & career packets",
    blurb: "Use proof captured all year instead of rebuilding your story from memory.",
    text: "Boasted can help you gather the work that shows how your scope, skills, and impact changed over time.",
    bullets: [
      "Look for repeated ownership, leadership, reliability, and results.",
      "Pull together examples from across the review period.",
      "Give shared credit where it belongs.",
      "Use the material as preparation for your review or promotion conversation.",
      "Adjust the final version to match your company or manager's expectations.",
    ],
  },
  {
    id: "public-profile",
    icon: FileText,
    title: "Public Proof Profile",
    blurb: "Share selected proof without exposing your private workspace.",
    text: "Your public profile is a curated career story. It is not a copy of everything you save in Boasted.",
    bullets: [
      "Publish only the proof you intentionally want other people to see.",
      "Use it as a portfolio-style view for recruiters, hiring managers, clients, or collaborators.",
      "Remove confidential details before publishing.",
      "Assume anything public can be copied or reshared.",
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Billing & Pro",
    blurb: "Paid access without billing jargon.",
    text: "Some Boasted features are available through Pro. Your account shows the plan and access available to you.",
    bullets: [
      "Free access covers the core career-proof workflow where offered.",
      "Pro is currently listed at $9/month where offered.",
      "Canceling normally stops the next renewal while access continues through the paid period.",
      "Contact support if a payment succeeds but your account does not reflect the expected access.",
    ],
  },
  {
    id: "integrations",
    icon: Plug,
    title: "Connections & sign-in",
    blurb: "Use connected accounts without losing control of what you share.",
    text: "Connected accounts can make sign-in easier or help bring useful information into Boasted. Connecting an account does not automatically publish your work.",
    bullets: [
      "Use Google, GitHub, or email/password where available.",
      "Review imported or suggested information before treating it as career proof.",
      "Disconnect services you no longer use.",
      "Protect the account you use to sign in.",
    ],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Privacy & NDA safety",
    blurb: "Keep the career value. Leave the secrets behind.",
    text: "Boasted gives you control over what you save and share, but you are still responsible for following employer policy, client agreements, NDAs, and applicable law.",
    bullets: [
      "Keep your workspace private by default.",
      "Share only what you mean to share.",
      "Do not store material you are not allowed to retain.",
      "Use safe summaries and references for restricted work.",
      "Review the NDA guidance before publishing sensitive career proof.",
    ],
  },
  {
    id: "account",
    icon: UserRound,
    title: "Account, export & deletion",
    blurb: "What to do when you need your data or want to leave.",
    text: "Use the available account and product controls to update or remove your content. Contact support when you need account-level help.",
    bullets: [
      "Request a copy of your personal information.",
      "Request correction of inaccurate information.",
      "Request deletion of your account.",
      "Back up career material you want to keep before closing your account.",
    ],
  },
];

const quickLinks = ["accomplishments", "impact-receipts", "resume-builder", "interviewer", "career-intelligence", "analytics", "evidence", "privacy"]
  .map((id) => sections.find((section) => section.id === id))
  .filter(Boolean);

const journey = [
  { title: "Capture", detail: "Save a real accomplishment" },
  { title: "Prove", detail: "Add result + safe evidence" },
  { title: "Package", detail: "Create an Impact Receipt" },
  { title: "Reuse", detail: "Resume, interview, review, profile" },
];

const searchableText = (section) => [section.title, section.blurb, section.text, ...(section.bullets || [])].join(" ").toLowerCase();

function RegisteredNurseExample() {
  return <section className="docs-example" id="example-registered-nurse">
    <div className="docs-example-header">
      <span className="docs-example-kicker"><HeartPulse size={17}/> REAL-WORLD EXAMPLE</span>
      <h2>Meet Maya, a registered nurse.</h2>
      <p>On a busy medical-surgical unit, Maya can turn patient-care wins, safety leadership, and measurable quality improvement into career proof without exposing patient information.</p>
    </div>
    <div className="docs-example-story">
      <article className="docs-example-card purple"><span>1 · CAPTURE</span><strong>“I recognized a subtle change in a patient's condition and escalated care before the situation became an emergency.”</strong><p>Maya records the clinical judgment and teamwork, while leaving out names, dates, room numbers, and other protected health information.</p></article>
      <article className="docs-example-card blue"><span>2 · ADD HER CONTRIBUTION</span><strong>What Maya personally did</strong><p>Reassessed the patient, identified a concerning trend, communicated the change using SBAR, activated the appropriate escalation path, and coordinated a safe handoff to the higher-acuity team.</p></article>
      <article className="docs-example-card green"><span>3 · ADD THE RESULT</span><strong>What changed</strong><p>The patient was stabilized and transferred for a higher level of care before further deterioration. Maya's documentation shows clinical judgment, communication, prioritization, and patient advocacy.</p></article>
    </div>
    <div className="docs-mini-dashboard">
      <div className="docs-mini-stat"><small>Early deterioration escalations</small><strong>12</strong><span className="good">recognized + escalated</span></div>
      <div className="docs-mini-stat"><small>Peer coaching assists</small><strong>9</strong><span className="good">supported teammates</span></div>
      <div className="docs-mini-stat"><small>Safety recognitions</small><strong>4</strong><span>example period</span></div>
    </div>
    <div className="docs-bar-chart" aria-label="Example nursing accomplishment trend">
      <div className="docs-chart-heading"><div><TrendingUp size={18}/><strong>Maya's nursing-impact trend</strong></div><span>Example only</span></div>
      <div className="docs-chart-row"><label>Patient safety</label><div><i style={{ width: "92%" }}/></div><strong>High</strong></div>
      <div className="docs-chart-row"><label>Clinical leadership</label><div><i style={{ width: "84%" }}/></div><strong>High</strong></div>
      <div className="docs-chart-row"><label>Team support</label><div><i style={{ width: "76%" }}/></div><strong>High</strong></div>
    </div>
    <div className="docs-example-output">
      <span>THEN MAYA CAN REUSE THAT SAME PROOF</span>
      <div className="docs-output-grid">
        <article><strong style={{ color: "#c4b5fd" }}>Resume</strong><p>Turn the story into a concise bullet about clinical judgment, escalation, patient advocacy, and interdisciplinary coordination.</p></article>
        <article><strong style={{ color: "#93c5fd" }}>Interview</strong><p>Use the story for questions about recognizing deterioration, prioritization, communication under pressure, or patient safety.</p></article>
        <article><strong style={{ color: "#6ee7b7" }}>Performance review</strong><p>Show a recurring pattern of sound judgment, safe escalation, teamwork, and support for other nurses.</p></article>
      </div>
    </div>

    <div className="docs-example-output" aria-label="Major registered nurse impact example">
      <span>EXAMPLE 2 · MAJOR UNIT-LEVEL IMPACT</span>
      <p style={{ margin: "10px 0 0", color: "#fde68a", fontWeight: 800 }}>Now Maya documents a much bigger accomplishment: she helps change a safety outcome for an entire nursing unit.</p>
    </div>
    <div className="docs-example-story">
      <article className="docs-example-card purple"><span>1 · BIG ACCOMPLISHMENT</span><strong>“I led a nurse-driven fall-prevention improvement effort after identifying a pattern of preventable patient falls on my unit.”</strong><p>This is stronger than one successful shift because Maya is documenting a repeat problem, leadership across disciplines, and an outcome that affected many patients.</p></article>
      <article className="docs-example-card blue"><span>2 · OWNERSHIP + LEADERSHIP</span><strong>What Maya personally did</strong><p>Reviewed fall-event patterns with unit leadership, helped redesign bedside risk huddles and purposeful-rounding checks, partnered with nursing assistants and therapy staff, trained 42 team members, and reviewed adherence data each week.</p></article>
      <article className="docs-example-card green"><span>3 · HUGE, MEASURABLE RESULTS</span><strong>What changed</strong><p>In this illustrative six-month example, total patient falls dropped 52% from 23 to 11, falls with injury dropped 75% from 8 to 2, median call-light response time improved 31%, and the prevention bundle was adopted by a second unit.</p></article>
    </div>
    <div className="docs-mini-dashboard">
      <div className="docs-mini-stat"><small>Total patient falls</small><strong>−52%</strong><span className="good">23 → 11</span></div>
      <div className="docs-mini-stat"><small>Falls with injury</small><strong>−75%</strong><span className="good">8 → 2</span></div>
      <div className="docs-mini-stat"><small>Call-light response</small><strong>31%</strong><span className="good">faster median</span></div>
    </div>
    <div className="docs-example-output">
      <span>WHAT HIGH-IMPACT NURSING PROOF CAN LOOK LIKE</span>
      <div className="docs-output-grid">
        <article><strong style={{ color: "#c4b5fd" }}>Resume</strong><p>Led a nurse-driven fall-prevention initiative that helped reduce unit falls 52% and falls with injury 75% over six months, with the safety bundle later adopted by a second unit.</p></article>
        <article><strong style={{ color: "#93c5fd" }}>Interview</strong><p>Use the example to demonstrate patient-safety leadership, quality improvement, data-informed decision making, interdisciplinary collaboration, and influence without formal management authority.</p></article>
        <article><strong style={{ color: "#6ee7b7" }}>Promotion / review</strong><p>Shows Maya moving beyond excellent bedside care into unit-level leadership with measurable patient-safety results, staff education, and a process that scaled beyond her immediate team.</p></article>
      </div>
      <p style={{ margin: "12px 0 0", color: "#cfd7e8", fontSize: ".78rem" }}>All names, counts, percentages, and outcomes in this example are fictional and illustrative. Real nurses should use only accurate, supportable results and must not include patient-identifying or otherwise restricted information.</p>
    </div>
  </section>;
}

export default function DocsPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => q ? sections.filter((section) => searchableText(section).includes(q)) : sections, [q]);

  return <main className="docs-page">
    <header className="docs-topbar">
      <a className="docs-brand" href="/"><img src="/brandmark.svg" alt=""/><span><strong>Boasted</strong><small>Help Center</small></span></a>
      <nav aria-label="Documentation header"><a href="/">Product</a><a href="/#pricing">Pricing</a><a href="/security">Security</a><a href="/nda-safety">NDA guidance</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
    </header>

    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label="Documentation sections">
        <p>Learn Boasted</p>
        <a href="#getting-started"><BookOpen size={16}/>Start Here</a>
        <a href="#example-registered-nurse"><HeartPulse size={16}/>Nursing Example</a>
        <a href="#feature-guide"><BriefcaseBusiness size={16}/>All Features</a>
        <a href="#impact-receipt-demo"><ReceiptText size={16}/>Impact Receipts</a>
        <a href="#verification-demo"><ShieldCheck size={16}/>Verification</a>
        <a href="#interview-demo"><Mic2 size={16}/>Interview Demo</a>
        <a href="#resume-demo"><FileText size={16}/>Resume Demo</a>
        <a href="#analytics-demo"><TrendingUp size={16}/>Career Analytics</a>
        <a href="#review-demo"><BriefcaseBusiness size={16}/>Reviews & Promotion</a>
        <a href="#public-profile-demo"><UserRound size={16}/>Public Profile</a>
        <a href="#safe-evidence"><ShieldCheck size={16}/>Safe Evidence</a>
        <a href="#career-intelligence"><BrainCircuit size={16}/>Career Intelligence</a>
        <a href="/security"><ShieldCheck size={16}/>Security</a>
        <a href="#billing"><CreditCard size={16}/>Billing & Pro</a>
        <a href="#faq"><CircleHelp size={16}/>FAQ</a>
      </aside>

      <article className="docs-content">
        <section className="docs-hero">
          <p className="docs-kicker">BOASTED HELP CENTER</p>
          <h1>Career proof, explained simply.</h1>
          <p>No technical background needed. Learn what each feature does, when to use it, and how your work can move from a memory to a resume, interview story, review, promotion packet, or portfolio.</p>
          <label className="docs-search">
            <Search size={18}/>
            <input aria-label="Search documentation" placeholder="Try “resume”, “verification”, “interview”, “analytics”, “privacy”…" value={query} onChange={(event) => setQuery(event.target.value)}/>
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear documentation search"><X size={17}/></button>}
          </label>
          {q && <div className="docs-search-summary" role="status"><strong>{filtered.length}</strong> {filtered.length === 1 ? "guide" : "guides"} found for “{query.trim()}”</div>}
        </section>

        {!q && <>
          <section className="docs-journey" aria-label="How Boasted works">
            <div className="docs-journey-heading"><span>THE BIG PICTURE</span><h2>One career-proof loop</h2><p>Capture once. Reuse when it matters.</p></div>
            <div className="docs-flow">{journey.map((step, index) => <div className={`docs-flow-step step-${index + 1}`} key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < journey.length - 1 && <ArrowRight className="docs-flow-arrow" size={18}/>}</div>)}</div>
          </section>
          <RegisteredNurseExample/>
          <section id="executive-impact" className="docs-section">
            <span className="plan-badge">Enterprise</span>
            <h2>Executive Impact Command Center</h2>
            <p>For Enterprise workspace owners, admins, and executives. Open <strong>Enterprise → Executive Impact</strong> to review authorized strategic goals and evidence-backed outcome metrics.</p>
            <ol>
              <li>Confirm you are in the intended Enterprise workspace and have an owner, admin, or executive role.</li>
              <li>Select an outcome lens, then review each metric’s definition, owner, period, source, freshness, and limitations.</li>
              <li>Use only authorized source links. Small cohorts and restricted projects remain suppressed.</li>
              <li>Queue a bounded board export; every export is watermarked and written to the audit record.</li>
            </ol>
            <p><strong>Expected result:</strong> observed organizational outcomes are connected to strategic goals without employee rankings or unsupported causal claims. Missing measurements stay visibly missing.</p>
            <p><strong>Troubleshooting:</strong> if access is denied, verify plan, workspace, and role with a workspace owner. If a value is stale or missing, correct its source record or metric definition; do not estimate it in the narrative. Workspace retention, correction, export, and deletion controls apply to these records.</p>
          </section>
          <DocsFeatureWalkthroughs/>
          <section className="docs-card-grid" aria-label="Popular documentation">{quickLinks.map(({ id, icon: Icon, title, blurb }) => <a className="docs-card" href={`#${id}`} key={id}><Icon size={20}/><div><strong>{title}</strong><span>{blurb}</span></div></a>)}</section>
        </>}

        <div className="docs-body">
          {filtered.length ? filtered.map(({ id, icon: Icon, title, blurb, text, bullets }) => <section className="docs-section" id={id} key={id}><div className="docs-section-title"><Icon size={21}/><div><h2>{title}</h2><span>{blurb}</span></div></div><p>{text}</p><ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></section>) : <section className="docs-empty-state"><Search size={26}/><h2>No guide matched that search.</h2><p>Try <button onClick={() => setQuery("resume")}>resume</button>, <button onClick={() => setQuery("interview")}>interview</button>, or <button onClick={() => setQuery("verification")}>verification</button>.</p></section>}

          {!q && <>
            <section className="docs-section" id="faq">
              <div className="docs-section-title"><CircleHelp size={21}/><div><h2>FAQ</h2><span>Quick answers without jargon.</span></div></div>
              <div className="docs-faq-grid">
                <article><strong>Is my work public?</strong><p>No. Your workspace is private by default. You decide what to share.</p></article>
                <article><strong>Do I need numbers for everything?</strong><p>No. Use numbers when you genuinely have them. Clear qualitative outcomes still matter.</p></article>
                <article><strong>Will Boasted invent experience for me?</strong><p>It should build from the proof and information you provide. Review anything you plan to use before sending or publishing it.</p></article>
                <article><strong>Can non-technical jobs use Boasted?</strong><p>Absolutely. Customer service, healthcare, education, operations, sales, trades, administration, and many other careers create valuable proof every day.</p></article>
                <article><strong>Does interview feedback mean I will pass or fail a real interview?</strong><p>No. It is practice coaching designed to help you make your answers clearer and stronger.</p></article>
                <article><strong>What if my best work is confidential?</strong><p>Keep the secret parts out. Save a safe summary of the problem, your contribution, and the result instead.</p></article>
                <article><strong>Do I have to ask someone to verify every receipt?</strong><p>No. Verification is optional. Use it when an appropriate person can genuinely confirm a specific claim.</p></article>
                <article><strong>What is the difference between an accomplishment and an Impact Receipt?</strong><p>An accomplishment is the fuller work story you capture. An Impact Receipt packages an important win into reusable proof with your contribution, result, supporting evidence, skills, and credit together.</p></article>
                <article><strong>What are Career Packets for?</strong><p>They help you select and organize relevant proof for a performance review, promotion, interview, or certification conversation without rebuilding the story from scratch.</p></article>
                <article><strong>Does Career Analytics rank me against other people?</strong><p>No. It is meant to help you understand patterns in the proof you recorded, not assign your worth or promise a career outcome.</p></article>
              </div>
            </section>
            <section className="docs-section" id="contact">
              <div className="docs-section-title"><FileText size={21}/><div><h2>Contact & support</h2><span>Need a human?</span></div></div>
              <p>For account, billing, product, documentation, privacy, deletion, or security questions, contact <a href="mailto:Tobias.scott@boasted.io">Tobias.scott@boasted.io</a>. Do not email passwords, access tokens, API keys, or confidential evidence.</p>
            </section>
          </>}
        </div>
      </article>
    </div>
  </main>;
}