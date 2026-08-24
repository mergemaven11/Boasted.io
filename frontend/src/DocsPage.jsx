import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  FileText,
  Headphones,
  Mic2,
  Plug,
  ReceiptText,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import "./DocsPage.css";

const sections = [
  { id: "getting-started", icon: BookOpen, title: "Start here", blurb: "The simplest way to understand BragStack.", text: "BragStack helps you remember what you did, prove the impact, and reuse that proof later for resumes, interviews, reviews, promotions, and your public career story.", bullets: ["Capture a real accomplishment while the details are fresh.", "Add the result, evidence, and skills that make it believable.", "Turn important wins into Impact Receipts.", "Reuse your proof instead of starting from a blank page every time.", "Keep your workspace private unless you deliberately choose to share something."] },
  { id: "daily-workflow", icon: UserRound, title: "Your everyday workflow", blurb: "A five-minute habit after meaningful work happens.", text: "You do not need to document every task. Save the work that shows growth, ownership, problem solving, leadership, customer impact, technical skill, or measurable improvement.", bullets: ["What happened?", "What did you personally do?", "What changed because of it?", "What safely proves it?", "What skill did this demonstrate?"] },
  { id: "impact-receipts", icon: ReceiptText, title: "Impact Receipts", blurb: "Your reusable record of career proof.", text: "An Impact Receipt turns a memory into structured proof. Think of it like a receipt for work you actually did: contribution, result, evidence, skills, credit, and visibility stay together.", bullets: ["Accomplishment — what happened.", "Contribution — what you personally owned, changed, fixed, built, or influenced.", "Result — what improved, shipped, saved, grew, reduced, or became easier.", "Evidence — files, links, tickets, messages, dashboards, commits, or safe references.", "Skills and credit — what the work demonstrates and who else deserves recognition."] },
  { id: "resume-builder", icon: FileText, title: "Resume Builder", blurb: "Build an ATS-friendly resume from proof you already captured.", text: "The Resume Builder starts with your Impact Receipts and target job. It turns real accomplishments into stronger resume bullets without inventing employers, dates, tools, metrics, or outcomes.", bullets: ["Enter the target role and paste the job description when available.", "Choose the career proof that best matches the opportunity.", "BragStack builds role-aware bullets from recorded evidence.", "Review every bullet before using it.", "Keep the strongest bullets focused on action, context, and result."] },
  { id: "career-intelligence", icon: BrainCircuit, title: "BragStack Career Intelligence™", blurb: "Career-aware reasoning that connects your evidence to the skill being tested.", text: "Career Intelligence looks beyond polished wording and asks whether your evidence actually supports the competency, role, or career goal in front of you.", bullets: ["Matches career proof to role and competency context.", "Looks for ownership, specificity, evidence, result, impact, and relevance.", "Uses saved career proof when personalization is enabled.", "Keeps the focus on what you actually did instead of generic advice.", "Supports adaptive coaching in Interview Practice."] },
  { id: "interviewer", icon: Mic2, title: "Practice Interview", blurb: "Practice real questions and get evidence-aware coaching.", text: "The BragStack Interviewer creates a role-aware practice session, evaluates whether your answer actually proves the skill being tested, and can ask a follow-up when your answer needs more evidence or clarity.", bullets: ["Choose a target role, experience level, interview type, and number of questions.", "Paste a job description for tighter role alignment.", "Personalize with Impact Receipts to connect questions to your own proof.", "Answer naturally by typing or speaking where supported.", "Use feedback to strengthen context, ownership, specificity, impact, relevance, and communication.", "Finish with a strengths-and-improvement summary."] },
  { id: "evidence", icon: ShieldCheck, title: "Evidence without oversharing", blurb: "Prove your work while protecting confidential information.", text: "Evidence should support your claim, not create a security problem. A reference to where evidence lives can be better than uploading something you are not allowed to keep.", bullets: ["Good evidence can be a ticket ID, approved screenshot, launch note, customer message, metric snapshot, commit, or manager feedback.", "Never upload passwords, credentials, API keys, customer secrets, restricted code, or confidential documents.", "Generalize customer names, internal systems, unreleased products, and sensitive metrics when needed.", "When the source must stay at work, save a sanitized reference instead."] },
  { id: "reviews", icon: BriefcaseBusiness, title: "Reviews, promotions & career packets", blurb: "Use proof captured all year instead of rebuilding your story from memory.", text: "BragStack can organize your recorded work into material for performance reviews, promotion conversations, interview packets, and other career moments.", bullets: ["Show repeated ownership and growth over time.", "Use evidence to support scope, leadership, execution, reliability, and impact.", "Include shared credit where appropriate.", "Review final material for company-specific expectations."] },
  { id: "public-profile", icon: FileText, title: "Public Proof Profile", blurb: "Share selected proof without exposing your private workspace.", text: "Your public profile should be a curated window into your work, not a mirror of everything saved privately.", bullets: ["Only intentionally public proof should appear.", "Use it as a portfolio-style view for recruiters, hiring managers, clients, or collaborators.", "Remove confidential details before publishing.", "Assume anything public can be copied or reshared."] },
  { id: "billing", icon: CreditCard, title: "Billing & Pro", blurb: "Understand paid access without billing jargon.", text: "Some BragStack features are available through Pro. Checkout and subscription billing are handled through the configured payment provider, while BragStack controls feature access from your verified account entitlement.", bullets: ["Free access covers the core career-proof workflow where offered.", "Pro is currently listed at $9/month where offered.", "Canceling normally stops future renewal while access continues through the paid period.", "Contact support if payment succeeded but Pro access does not update."] },
  { id: "integrations", icon: Plug, title: "Connections & sign-in", blurb: "Use Google, GitHub, and other connections safely.", text: "Connections help with sign-in or bring useful signals into BragStack. A connected service does not automatically make your work public.", bullets: ["Use Google, GitHub, or email/password where available.", "Review imported or suggested information before treating it as career proof.", "Disconnect integrations you no longer use.", "Protect the Google or GitHub account you use for sign-in."] },
  { id: "privacy", icon: ShieldCheck, title: "Privacy & NDA safety", blurb: "Keep the career value. Leave the secrets behind.", text: "BragStack is built around user-controlled visibility, but you are still responsible for following employer policy, client agreements, NDAs, and applicable law.", bullets: ["Private by default.", "Share selectively.", "Do not store material you are not authorized to retain.", "Use safe summaries and references for restricted work.", "Review the NDA guidance before publishing sensitive career proof."] },
  { id: "account", icon: UserRound, title: "Account, export & deletion", blurb: "What to do when you need your data or want to leave.", text: "Use product controls to update or remove content where available. For account-level access, export, correction, or deletion requests, contact BragStack support.", bullets: ["Request a copy of your personal information.", "Request correction of inaccurate information.", "Request deletion of your account.", "Back up career material you want to keep before closing the account."] },
  { id: "api", icon: Wrench, title: "API", blurb: "Developer access is planned, not part of the everyday user guide.", text: "BragStack does not send non-technical users into raw backend endpoints. Public API documentation will be added when a supported customer API is ready.", bullets: ["No localhost links in customer docs.", "Authentication, limits, and examples will be documented when the public API launches.", "Private internal endpoints are not a supported customer API."] },
];

const quickLinks = ["impact-receipts", "resume-builder", "interviewer", "career-intelligence", "evidence", "privacy"].map((id) => sections.find((section) => section.id === id)).filter(Boolean);
const journey = [
  { title: "Capture", detail: "Save a real accomplishment" },
  { title: "Prove", detail: "Add result + evidence" },
  { title: "Package", detail: "Create an Impact Receipt" },
  { title: "Reuse", detail: "Resume, interview, review, profile" },
];

function searchableText(section) {
  return [section.title, section.blurb, section.text, ...(section.bullets || [])].join(" ").toLowerCase();
}

function CallCenterExample() {
  return (
    <section className="docs-example" id="example-call-center">
      <div className="docs-example-header">
        <span className="docs-example-kicker"><Headphones size={17} /> REAL-WORLD EXAMPLE</span>
        <h2>Meet Maya, a call center agent.</h2>
        <p>Maya does not need to be technical. She only needs to notice when her work makes something better.</p>
      </div>

      <div className="docs-example-story">
        <article className="docs-example-card purple"><span>1 · Capture</span><strong>“I helped calm a difficult billing call.”</strong><p>Maya records what happened while she still remembers the details.</p></article>
        <article className="docs-example-card blue"><span>2 · Add proof</span><strong>What she did</strong><p>Explained the charge clearly, found the billing issue, coordinated a correction, and prevented an escalation.</p></article>
        <article className="docs-example-card green"><span>3 · Add result</span><strong>What changed</strong><p>The customer stayed, the issue was resolved in one interaction, and her supervisor praised the call.</p></article>
      </div>

      <div className="docs-mini-dashboard">
        <div className="docs-mini-stat"><small>Resolved without escalation</small><strong>18</strong><span className="good">↑ this month</span></div>
        <div className="docs-mini-stat"><small>Positive customer mentions</small><strong>7</strong><span className="good">↑ 3 from last month</span></div>
        <div className="docs-mini-stat"><small>Coaching assists</small><strong>5</strong><span>helped teammates</span></div>
      </div>

      <div className="docs-bar-chart" aria-label="Example accomplishment trend">
        <div className="docs-chart-heading"><div><TrendingUp size={18} /><strong>Maya's career-proof trend</strong></div><span>Example only</span></div>
        <div className="docs-chart-row"><label>Customer saves</label><div><i style={{ width: "78%" }} /></div><strong>18</strong></div>
        <div className="docs-chart-row"><label>Positive feedback</label><div><i style={{ width: "58%" }} /></div><strong>7</strong></div>
        <div className="docs-chart-row"><label>Team support</label><div><i style={{ width: "42%" }} /></div><strong>5</strong></div>
      </div>

      <div className="docs-example-output">
        <span>THEN BRAGSTACK CAN HELP MAYA REUSE THAT PROOF</span>
        <div className="docs-output-grid">
          <article><strong>Resume</strong><p>“Resolved complex billing concerns while preventing escalations and preserving customer relationships.”</p></article>
          <article><strong>Interview</strong><p>“Tell me about a time you de-escalated a difficult customer situation.”</p></article>
          <article><strong>Performance review</strong><p>Show a pattern of customer saves, positive feedback, and peer support across the review period.</p></article>
        </div>
      </div>
    </section>
  );
}

function DocsPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => normalizedQuery ? sections.filter((section) => searchableText(section).includes(normalizedQuery)) : sections, [normalizedQuery]);

  return (
    <main className="docs-page">
      <header className="docs-topbar">
        <a className="docs-brand" href="/"><img src="/brandmark.svg" alt="" /><span><strong>BragStack</strong><small>Help Center</small></span></a>
        <nav aria-label="Documentation header"><a href="/">Product</a><a href="/#pricing">Pricing</a><a href="/security">Security</a><a href="/nda-safety">NDA guidance</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
      </header>

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="Documentation sections">
          <p>Learn BragStack</p>
          <a href="#getting-started"><BookOpen size={16} />Start Here</a>
          <a href="#example-call-center"><Headphones size={16} />Simple Example</a>
          <a href="#impact-receipts"><ReceiptText size={16} />Impact Receipts</a>
          <a href="#resume-builder"><FileText size={16} />Resume Builder</a>
          <a href="#interviewer"><Mic2 size={16} />Practice Interview</a>
          <a href="#career-intelligence"><BrainCircuit size={16} />Career Intelligence</a>
          <a href="/security"><ShieldCheck size={16} />Security</a>
          <a href="#privacy"><ShieldCheck size={16} />Privacy & NDA</a>
          <a href="#billing"><CreditCard size={16} />Billing & Pro</a>
          <a href="#faq"><CircleHelp size={16} />FAQ</a>
        </aside>

        <article className="docs-content">
          <section className="docs-hero">
            <p className="docs-kicker">BRAGSTACK HELP CENTER</p>
            <h1>Career proof, explained simply.</h1>
            <p>No technical background needed. BragStack helps you turn everyday work into proof you can reuse when you need a resume, interview story, review, promotion packet, or portfolio.</p>
            <label className="docs-search"><Search size={18} /><input aria-label="Search documentation" placeholder="Try “resume”, “interview”, “evidence”, “billing”…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear documentation search"><X size={17} /></button>}</label>
            {normalizedQuery && <div className="docs-search-summary" role="status"><strong>{filteredSections.length}</strong> {filteredSections.length === 1 ? "guide" : "guides"} found for “{query.trim()}”</div>}
          </section>

          {!normalizedQuery && <>
            <section className="docs-journey" aria-label="How BragStack works">
              <div className="docs-journey-heading"><span>THE BIG PICTURE</span><h2>One career-proof loop</h2><p>Capture once. Reuse when it matters.</p></div>
              <div className="docs-flow">{journey.map((step, index) => <div className={`docs-flow-step step-${index + 1}`} key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < journey.length - 1 && <ArrowRight className="docs-flow-arrow" size={18} />}</div>)}</div>
            </section>
            <CallCenterExample />
            <section className="docs-card-grid" aria-label="Popular documentation">{quickLinks.map(({ id, icon: Icon, title, blurb }) => <a className="docs-card" href={`#${id}`} key={id}><Icon size={20} /><div><strong>{title}</strong><span>{blurb}</span></div></a>)}</section>
          </>}

          <div className="docs-body">
            {filteredSections.length ? filteredSections.map(({ id, icon: Icon, title, blurb, text, bullets }) => <section className="docs-section" id={id} key={id}><div className="docs-section-title"><Icon size={21} /><div><h2>{title}</h2><span>{blurb}</span></div></div><p>{text}</p><ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></section>) : <section className="docs-empty-state"><Search size={26} /><h2>No guide matched that search.</h2><p>Try a simpler word like <button type="button" onClick={() => setQuery("resume")}>resume</button>, <button type="button" onClick={() => setQuery("interview")}>interview</button>, or <button type="button" onClick={() => setQuery("privacy")}>privacy</button>.</p></section>}

            {!normalizedQuery && <>
              <section className="docs-section" id="faq"><div className="docs-section-title"><CircleHelp size={21} /><div><h2>FAQ</h2><span>Quick answers without jargon.</span></div></div><div className="docs-faq-grid"><article><strong>Is my work public?</strong><p>No. Your workspace is private by default. You choose what to share.</p></article><article><strong>Do I need numbers for everything?</strong><p>No. Use numbers when you have them. Clear qualitative outcomes still count.</p></article><article><strong>Will BragStack make things up?</strong><p>Career tools are designed to build from proof you recorded. Always review final output before using it.</p></article><article><strong>Can non-technical jobs use BragStack?</strong><p>Absolutely. Customer service, healthcare, education, operations, sales, trades, administration, and many other careers create measurable proof every day.</p></article></div></section>
              <section className="docs-section" id="contact"><div className="docs-section-title"><FileText size={21} /><div><h2>Contact & support</h2><span>Need a human?</span></div></div><p>For account, billing, product, documentation, privacy, deletion, or security questions, contact <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>. Do not email passwords, access tokens, API keys, or confidential evidence.</p></section>
            </>}
          </div>
        </article>
      </div>
    </main>
  );
}

export default DocsPage;
