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
  X,
} from "lucide-react";
import DocsFeatureWalkthroughs from "./DocsFeatureWalkthroughs";
import "./DocsPage.css";

const sections = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Start here",
    blurb: "The simplest way to understand BragStack.",
    text: "BragStack helps you remember meaningful work, turn it into career proof, and reuse that proof when you need it.",
    bullets: [
      "Capture an accomplishment while the details are still fresh.",
      "Write down what you personally did and what changed afterward.",
      "Add safe evidence when you have it.",
      "Reuse the same proof for resumes, interviews, reviews, promotions, and your public profile.",
      "Keep your workspace private unless you deliberately choose to share something.",
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
    id: "resume-builder",
    icon: FileText,
    title: "Resume Builder",
    blurb: "Build a focused resume from proof you already captured.",
    text: "Give BragStack the job you want, choose the proof that fits, and turn your real accomplishments into a stronger resume draft.",
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
    title: "BragStack Career Intelligence™",
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
    text: "BragStack can help you gather the work that shows how your scope, skills, and impact changed over time.",
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
    text: "Your public profile is a curated career story. It is not a copy of everything you save in BragStack.",
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
    text: "Some BragStack features are available through Pro. Your account shows the plan and access available to you.",
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
    text: "Connected accounts can make sign-in easier or help bring useful information into BragStack. Connecting an account does not automatically publish your work.",
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
    text: "BragStack gives you control over what you save and share, but you are still responsible for following employer policy, client agreements, NDAs, and applicable law.",
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

const quickLinks = ["impact-receipts", "resume-builder", "interviewer", "career-intelligence", "evidence", "privacy"]
  .map((id) => sections.find((section) => section.id === id))
  .filter(Boolean);

const journey = [
  { title: "Capture", detail: "Save a real accomplishment" },
  { title: "Prove", detail: "Add result + safe evidence" },
  { title: "Package", detail: "Create an Impact Receipt" },
  { title: "Reuse", detail: "Resume, interview, review, profile" },
];

const searchableText = (section) => [section.title, section.blurb, section.text, ...(section.bullets || [])].join(" ").toLowerCase();

function CallCenterExample() {
  return <section className="docs-example" id="example-call-center">
    <div className="docs-example-header">
      <span className="docs-example-kicker"><Headphones size={17}/> REAL-WORLD EXAMPLE</span>
      <h2>Meet Maya, a call center agent.</h2>
      <p>Maya does not need a technical job to use BragStack. She only needs to notice when her work makes something better.</p>
    </div>
    <div className="docs-example-story">
      <article className="docs-example-card purple"><span>1 · Capture</span><strong>“I helped calm a difficult billing call.”</strong><p>Maya records what happened while she still remembers the details.</p></article>
      <article className="docs-example-card blue"><span>2 · Add her contribution</span><strong>What she did</strong><p>Explained the charge clearly, found the billing issue, coordinated a correction, and prevented an escalation.</p></article>
      <article className="docs-example-card green"><span>3 · Add the result</span><strong>What changed</strong><p>The issue was resolved in one interaction, the customer relationship was preserved, and her supervisor praised the call.</p></article>
    </div>
    <div className="docs-mini-dashboard">
      <div className="docs-mini-stat"><small>Resolved without escalation</small><strong>18</strong><span className="good">↑ this month</span></div>
      <div className="docs-mini-stat"><small>Positive customer mentions</small><strong>7</strong><span className="good">↑ 3 from last month</span></div>
      <div className="docs-mini-stat"><small>Coaching assists</small><strong>5</strong><span>helped teammates</span></div>
    </div>
    <div className="docs-bar-chart" aria-label="Example accomplishment trend">
      <div className="docs-chart-heading"><div><TrendingUp size={18}/><strong>Maya's career-proof trend</strong></div><span>Example only</span></div>
      <div className="docs-chart-row"><label>Customer saves</label><div><i style={{ width: "78%" }}/></div><strong>18</strong></div>
      <div className="docs-chart-row"><label>Positive feedback</label><div><i style={{ width: "58%" }}/></div><strong>7</strong></div>
      <div className="docs-chart-row"><label>Team support</label><div><i style={{ width: "42%" }}/></div><strong>5</strong></div>
    </div>
    <div className="docs-example-output">
      <span>THEN MAYA CAN REUSE THAT SAME PROOF</span>
      <div className="docs-output-grid">
        <article><strong>Resume</strong><p>Turn the story into a concise accomplishment bullet.</p></article>
        <article><strong>Interview</strong><p>Use the same example when asked about de-escalation, problem solving, or customer judgment.</p></article>
        <article><strong>Performance review</strong><p>Show a pattern of customer saves, positive feedback, and peer support across the review period.</p></article>
      </div>
    </div>
  </section>;
}

export default function DocsPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => q ? sections.filter((section) => searchableText(section).includes(q)) : sections, [q]);

  return <main className="docs-page">
    <header className="docs-topbar">
      <a className="docs-brand" href="/"><img src="/brandmark.svg" alt=""/><span><strong>BragStack</strong><small>Help Center</small></span></a>
      <nav aria-label="Documentation header"><a href="/">Product</a><a href="/#pricing">Pricing</a><a href="/security">Security</a><a href="/nda-safety">NDA guidance</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
    </header>

    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label="Documentation sections">
        <p>Learn BragStack</p>
        <a href="#getting-started"><BookOpen size={16}/>Start Here</a>
        <a href="#example-call-center"><Headphones size={16}/>Simple Example</a>
        <a href="#impact-receipt-demo"><ReceiptText size={16}/>Impact Receipts</a>
        <a href="#interview-demo"><Mic2 size={16}/>Interview Demo</a>
        <a href="#resume-demo"><FileText size={16}/>Resume Demo</a>
        <a href="#career-intelligence"><BrainCircuit size={16}/>Career Intelligence</a>
        <a href="/security"><ShieldCheck size={16}/>Security</a>
        <a href="#privacy"><ShieldCheck size={16}/>Privacy & NDA</a>
        <a href="#billing"><CreditCard size={16}/>Billing & Pro</a>
        <a href="#faq"><CircleHelp size={16}/>FAQ</a>
      </aside>

      <article className="docs-content">
        <section className="docs-hero">
          <p className="docs-kicker">BRAGSTACK HELP CENTER</p>
          <h1>Career proof, explained simply.</h1>
          <p>No technical background needed. Learn what each feature does, when to use it, and how your work can move from a memory to a resume, interview story, review, promotion packet, or portfolio.</p>
          <label className="docs-search">
            <Search size={18}/>
            <input aria-label="Search documentation" placeholder="Try “resume”, “interview”, “evidence”, “billing”…" value={query} onChange={(event) => setQuery(event.target.value)}/>
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear documentation search"><X size={17}/></button>}
          </label>
          {q && <div className="docs-search-summary" role="status"><strong>{filtered.length}</strong> {filtered.length === 1 ? "guide" : "guides"} found for “{query.trim()}”</div>}
        </section>

        {!q && <>
          <section className="docs-journey" aria-label="How BragStack works">
            <div className="docs-journey-heading"><span>THE BIG PICTURE</span><h2>One career-proof loop</h2><p>Capture once. Reuse when it matters.</p></div>
            <div className="docs-flow">{journey.map((step, index) => <div className={`docs-flow-step step-${index + 1}`} key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < journey.length - 1 && <ArrowRight className="docs-flow-arrow" size={18}/>}</div>)}</div>
          </section>
          <CallCenterExample/>
          <DocsFeatureWalkthroughs/>
          <section className="docs-card-grid" aria-label="Popular documentation">{quickLinks.map(({ id, icon: Icon, title, blurb }) => <a className="docs-card" href={`#${id}`} key={id}><Icon size={20}/><div><strong>{title}</strong><span>{blurb}</span></div></a>)}</section>
        </>}

        <div className="docs-body">
          {filtered.length ? filtered.map(({ id, icon: Icon, title, blurb, text, bullets }) => <section className="docs-section" id={id} key={id}><div className="docs-section-title"><Icon size={21}/><div><h2>{title}</h2><span>{blurb}</span></div></div><p>{text}</p><ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></section>) : <section className="docs-empty-state"><Search size={26}/><h2>No guide matched that search.</h2><p>Try <button onClick={() => setQuery("resume")}>resume</button>, <button onClick={() => setQuery("interview")}>interview</button>, or <button onClick={() => setQuery("privacy")}>privacy</button>.</p></section>}

          {!q && <>
            <section className="docs-section" id="faq">
              <div className="docs-section-title"><CircleHelp size={21}/><div><h2>FAQ</h2><span>Quick answers without jargon.</span></div></div>
              <div className="docs-faq-grid">
                <article><strong>Is my work public?</strong><p>No. Your workspace is private by default. You decide what to share.</p></article>
                <article><strong>Do I need numbers for everything?</strong><p>No. Use numbers when you genuinely have them. Clear qualitative outcomes still matter.</p></article>
                <article><strong>Will BragStack invent experience for me?</strong><p>It should build from the proof and information you provide. Review anything you plan to use before sending or publishing it.</p></article>
                <article><strong>Can non-technical jobs use BragStack?</strong><p>Absolutely. Customer service, healthcare, education, operations, sales, trades, administration, and many other careers create valuable proof every day.</p></article>
                <article><strong>Does interview feedback mean I will pass or fail a real interview?</strong><p>No. It is practice coaching designed to help you make your answers clearer and stronger.</p></article>
                <article><strong>What if my best work is confidential?</strong><p>Keep the secret parts out. Save a safe summary of the problem, your contribution, and the result instead.</p></article>
              </div>
            </section>
            <section className="docs-section" id="contact">
              <div className="docs-section-title"><FileText size={21}/><div><h2>Contact & support</h2><span>Need a human?</span></div></div>
              <p>For account, billing, product, documentation, privacy, deletion, or security questions, contact <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>. Do not email passwords, access tokens, API keys, or confidential evidence.</p>
            </section>
          </>}
        </div>
      </article>
    </div>
  </main>;
}
