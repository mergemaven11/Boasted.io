import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  FileText,
  GraduationCap,
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
    text: "BragStack helps you remember meaningful work and learning, turn it into evidence, and reuse that evidence when you need it.",
    bullets: [
      "Capture an accomplishment while the details are still fresh.",
      "Write down what you personally did and what changed afterward.",
      "Add safe evidence when you have it.",
      "Reuse the same proof for resumes, interviews, reviews, promotions, applications, and your public profile.",
      "Keep your workspace private unless you deliberately choose to share something.",
    ],
  },
  {
    id: "dashboard",
    icon: BriefcaseBusiness,
    title: "Career Dashboard",
    blurb: "A quick view of the evidence you have already captured.",
    text: "The dashboard is your starting point when you want to see recent accomplishments, skills, evidence, and Impact Receipts without opening every part of your workspace.",
    bullets: [
      "See how much evidence you have documented.",
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
    blurb: "Your searchable history of meaningful work and learning.",
    text: "Accomplishments are the raw stories you capture before the details disappear from memory. Save enough context that your future self can understand the situation, your action, and the outcome.",
    bullets: [
      "Record work from a current job, previous job, side project, learning experience, school or university context, open-source work, service, or personal development.",
      "Capture the situation, what you did, what changed, and what you learned.",
      "Add skills or tags so useful examples are easier to find later.",
      "Search your library when you need a story for a resume, interview, review, promotion, scholarship, internship, or application.",
      "Choose carefully before marking any accomplishment public.",
    ],
  },
  {
    id: "daily-workflow",
    icon: UserRound,
    title: "Your everyday workflow",
    blurb: "A small habit that makes future career and application moments easier.",
    text: "You do not need to record every task. Save the work, learning, service, leadership, or growth you would want to remember six months from now.",
    bullets: [
      "A problem you solved.",
      "A customer, teammate, classmate, or community you helped.",
      "A process you improved.",
      "Something you built, launched, fixed, led, researched, organized, or learned.",
      "A result that shows growth, ownership, reliability, leadership, contribution, or impact.",
    ],
  },
  {
    id: "impact-receipts",
    icon: ReceiptText,
    title: "Impact Receipts",
    blurb: "Your reusable record of evidence.",
    text: "An Impact Receipt keeps the important parts of an accomplishment together so you do not have to rebuild it from memory later.",
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
    blurb: "Optional confirmation from someone who genuinely knows the work.",
    text: "When a collaborator, manager, educator, stakeholder, or organization representative genuinely knows the work behind an Impact Receipt, you can ask them to confirm whether the specific claim accurately describes your contribution and result.",
    bullets: [
      "Choose a receipt that the verifier actually has enough context to review.",
      "Send a private confirmation request only when you have a reasonable basis to contact that person.",
      "The verifier can review the claim without creating a BragStack account.",
      "They can confirm or decline the specific claim.",
      "Verification is not an independent audit, background check, legal certification, or guarantee from BragStack.",
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
      "Guidance is preparation support, not a hiring, promotion, compensation, or employment decision.",
    ],
  },
  {
    id: "applications",
    icon: GraduationCap,
    title: "Applications & Education Intelligence",
    blurb: "Organize real evidence for scholarships, programs, internships, and essay planning.",
    text: "The Applications workbench ranks your own saved accomplishments for a selected application workflow. It is designed to help you find relevant evidence, not predict whether you will be admitted, funded, hired, or selected.",
    bullets: [
      "Scholarship mode looks for real evidence of leadership, service, academics, initiative, and sustained effort.",
      "Special Program mode surfaces experiences that may show subject depth, curiosity, collaboration, initiative, and growth.",
      "Internship mode prioritizes demonstrated skills, responsibility, teamwork, initiative, and results.",
      "Essay Prep surfaces real story candidates; you remain responsible for writing in your own voice and following each institution's AI and originality rules.",
      "BragStack does not generate admissions odds, scholarship odds, selection scores, or invented activities.",
      "Always check official eligibility, deadlines, prompts, word limits, and submission instructions with the school, employer, program, scholarship provider, or application platform.",
      "During the current self-service phase, BragStack accounts are intended for users age 18 or older.",
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
      "Practice feedback does not predict whether you will pass, fail, receive an offer, or receive a particular level of compensation.",
    ],
  },
  {
    id: "analytics",
    icon: TrendingUp,
    title: "Career Analytics",
    blurb: "See recurring themes in the proof you have actually recorded.",
    text: "Career Analytics helps you step back from individual accomplishments and notice patterns across your record, such as skills you demonstrate repeatedly, the types of work you do most often, and how much evidence you have collected.",
    bullets: [
      "See totals for accomplishments, Impact Receipts, evidence, and other recorded proof.",
      "Notice skills that appear repeatedly across your career stories.",
      "Review the mix of work and accomplishments you have captured.",
      "Use the patterns as preparation for career conversations rather than as invented rankings or promises.",
      "Analytics are not a measure of personal worth, employment eligibility, or an official professional assessment.",
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
      "A packet is preparation material; the recipient decides what evidence they accept and what outcome follows.",
    ],
  },
  {
    id: "evidence",
    icon: ShieldCheck,
    title: "Evidence without oversharing",
    blurb: "Support your story while protecting confidential and restricted information.",
    text: "Evidence should make a claim easier to trust, not create a privacy, security, contractual, or legal problem.",
    bullets: [
      "Useful evidence can be an approved screenshot, ticket reference, launch note, metric, message, commit, educator feedback, or manager feedback when you are allowed to use it.",
      "Do not save passwords, access tokens, API keys, Social Security or national-identification numbers, full card data, bank credentials, customer secrets, restricted student records, medical records, restricted code, classified information, or confidential documents.",
      "Generalize customer names, internal systems, unreleased work, school or program identifiers, and sensitive metrics when needed.",
      "If the original proof must stay in an employer, school, client, or other restricted system, save a safe summary or reference instead.",
      "Private-by-default does not override an NDA, policy, contract, intellectual-property obligation, or law.",
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
      "BragStack does not guarantee a promotion, raise, rating, or other employment outcome.",
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
      "Use it as a portfolio-style view for recruiters, hiring managers, clients, collaborators, or other intended audiences.",
      "Remove confidential, sensitive, restricted, and unnecessary third-party details before publishing.",
      "Assume anything public can be copied, indexed, screenshotted, quoted, downloaded, or reshared.",
      "You are responsible for the accuracy and permissions behind what you publish.",
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Billing & Pro",
    blurb: "Paid access without billing jargon.",
    text: "Some BragStack features are available through Pro. Your account shows the plan and access available to you.",
    bullets: [
      "Free access covers the core evidence workflow where offered.",
      "Pro pricing is shown at purchase and may change over time.",
      "Canceling normally stops the next renewal while access continues through the paid period unless applicable law or the purchase screen says otherwise.",
      "Except where required by law or stated at purchase, paid fees are generally non-refundable.",
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
      "Review imported or suggested information before treating it as career or education proof.",
      "Third-party services have their own terms, privacy practices, availability, and security controls.",
      "Disconnect services you no longer use where the product supports it.",
      "Protect the account you use to sign in.",
    ],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Privacy & NDA safety",
    blurb: "Keep the value. Leave the secrets and restricted data behind.",
    text: "BragStack gives you controls over what you save and share, but you are still responsible for following employer policy, school rules, client agreements, NDAs, privacy obligations, intellectual-property restrictions, and applicable law.",
    bullets: [
      "Keep your workspace private by default.",
      "Share only what you intentionally mean to share and are permitted to disclose.",
      "Do not store material you are not allowed to retain or information that belongs in a regulated system of record.",
      "Use safe summaries and references for restricted work.",
      "Review the NDA guidance before publishing sensitive proof.",
      "During the current self-service phase, accounts are intended for users who are at least 18 years old.",
      "Read the Privacy Policy and Terms for the complete rules that apply to the Service.",
    ],
  },
  {
    id: "legal-boundaries",
    icon: ShieldCheck,
    title: "Important product boundaries",
    blurb: "What BragStack can help with — and what it does not decide for you.",
    text: "BragStack is software for organizing evidence, preparing materials, and practicing communication. It is not a substitute for an official source, a licensed professional, or the decision maker for an opportunity.",
    bullets: [
      "No guarantee of employment, promotion, compensation, admissions, scholarship, certification, or selection outcomes.",
      "No admissions odds, scholarship odds, or high-impact eligibility decisions.",
      "No legal, tax, financial, medical, mental-health, immigration, admissions, or employment-law advice unless a separate written service explicitly says otherwise.",
      "No affiliation or endorsement is implied when BragStack references a school, employer, scholarship provider, application platform, job board, social network, or other third party.",
      "Verify important requirements, deadlines, and eligibility rules with the official source.",
      "Review all AI-assisted, ranked, scored, or generated material before relying on or submitting it.",
    ],
  },
  {
    id: "account",
    icon: UserRound,
    title: "Account, export & deletion",
    blurb: "What to do when you need your data or want to leave.",
    text: "Use the available account and product controls to update or remove your content. Contact support when you need account-level help.",
    bullets: [
      "Request a copy of your personal information where supported or required.",
      "Request correction of inaccurate personal information.",
      "Request deletion of your account.",
      "Back up material you want to keep before closing your account.",
      "Copies that other people already downloaded, screenshotted, exported, or reshared may remain outside BragStack's control.",
    ],
  },
];

const quickLinks = ["accomplishments", "impact-receipts", "applications", "resume-builder", "interviewer", "career-intelligence", "evidence", "privacy"]
  .map((id) => sections.find((section) => section.id === id))
  .filter(Boolean);

const journey = [
  { title: "Capture", detail: "Save a real accomplishment" },
  { title: "Prove", detail: "Add result + safe evidence" },
  { title: "Package", detail: "Create an Impact Receipt" },
  { title: "Reuse", detail: "Career, profile, or application" },
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
      <nav aria-label="Documentation header"><a href="/">Product</a><a href="/#pricing">Pricing</a><a href="/security">Security</a><a href="/nda-safety">NDA guidance</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Sign in</a></nav>
    </header>

    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label="Documentation sections">
        <p>Learn BragStack</p>
        <a href="#getting-started"><BookOpen size={16}/>Start Here</a>
        <a href="#example-call-center"><Headphones size={16}/>Simple Example</a>
        <a href="#feature-guide"><BriefcaseBusiness size={16}/>All Features</a>
        <a href="#impact-receipt-demo"><ReceiptText size={16}/>Impact Receipts</a>
        <a href="#verification-demo"><ShieldCheck size={16}/>Verification</a>
        <a href="#applications"><GraduationCap size={16}/>Applications</a>
        <a href="#interview-demo"><Mic2 size={16}/>Interview Demo</a>
        <a href="#resume-demo"><FileText size={16}/>Resume Demo</a>
        <a href="#analytics-demo"><TrendingUp size={16}/>Career Analytics</a>
        <a href="#review-demo"><BriefcaseBusiness size={16}/>Reviews & Promotion</a>
        <a href="#public-profile-demo"><UserRound size={16}/>Public Profile</a>
        <a href="#safe-evidence"><ShieldCheck size={16}/>Safe Evidence</a>
        <a href="#career-intelligence"><BrainCircuit size={16}/>Career Intelligence</a>
        <a href="#legal-boundaries"><ShieldCheck size={16}/>Product Boundaries</a>
        <a href="/security"><ShieldCheck size={16}/>Security</a>
        <a href="#billing"><CreditCard size={16}/>Billing & Pro</a>
        <a href="#faq"><CircleHelp size={16}/>FAQ</a>
      </aside>

      <article className="docs-content">
        <section className="docs-hero">
          <p className="docs-kicker">BRAGSTACK HELP CENTER</p>
          <h1>Career and education evidence, explained simply.</h1>
          <p>No technical background needed. Learn what each feature does, when to use it, what it does not promise, and how real accomplishments can move from memory to a resume, interview story, review, promotion packet, public profile, internship, scholarship, or application.</p>
          <label className="docs-search">
            <Search size={18}/>
            <input aria-label="Search documentation" placeholder="Try “resume”, “applications”, “verification”, “privacy”, “NDA”…" value={query} onChange={(event) => setQuery(event.target.value)}/>
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear documentation search"><X size={17}/></button>}
          </label>
          {q && <div className="docs-search-summary" role="status"><strong>{filtered.length}</strong> {filtered.length === 1 ? "guide" : "guides"} found for “{query.trim()}”</div>}
        </section>

        {!q && <>
          <section className="docs-journey" aria-label="How BragStack works">
            <div className="docs-journey-heading"><span>THE BIG PICTURE</span><h2>One evidence loop</h2><p>Capture once. Reuse when it matters.</p></div>
            <div className="docs-flow">{journey.map((step, index) => <div className={`docs-flow-step step-${index + 1}`} key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < journey.length - 1 && <ArrowRight className="docs-flow-arrow" size={18}/>}</div>)}</div>
          </section>
          <CallCenterExample/>
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
          {filtered.length ? filtered.map(({ id, icon: Icon, title, blurb, text, bullets }) => <section className="docs-section" id={id} key={id}><div className="docs-section-title"><Icon size={21}/><div><h2>{title}</h2><span>{blurb}</span></div></div><p>{text}</p><ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></section>) : <section className="docs-empty-state"><Search size={26}/><h2>No guide matched that search.</h2><p>Try <button onClick={() => setQuery("applications")}>applications</button>, <button onClick={() => setQuery("resume")}>resume</button>, <button onClick={() => setQuery("verification")}>verification</button>, or <button onClick={() => setQuery("privacy")}>privacy</button>.</p></section>}

          {!q && <>
            <section className="docs-section" id="faq">
              <div className="docs-section-title"><CircleHelp size={21}/><div><h2>FAQ</h2><span>Quick answers without jargon.</span></div></div>
              <div className="docs-faq-grid">
                <article><strong>Is my work public?</strong><p>No. Your workspace is private by default. You decide what to share, but anything you intentionally make public can be copied or reshared by other people.</p></article>
                <article><strong>Do I need numbers for everything?</strong><p>No. Use numbers when you genuinely have them and are permitted to disclose them. Clear qualitative outcomes still matter.</p></article>
                <article><strong>Will BragStack invent experience for me?</strong><p>It is designed to build from the proof and information you provide, not fabricate achievements. Automated output can still be wrong, so review anything you plan to use before sending or publishing it.</p></article>
                <article><strong>Can non-technical jobs use BragStack?</strong><p>Absolutely. Customer service, healthcare, education, operations, sales, trades, administration, public service, and many other careers create valuable proof every day.</p></article>
                <article><strong>Does interview feedback mean I will pass or fail a real interview?</strong><p>No. It is practice coaching designed to help you make your answers clearer and stronger. It does not predict a hiring outcome.</p></article>
                <article><strong>Does the Applications workbench predict whether I will be admitted or win a scholarship?</strong><p>No. It ranks your own saved evidence for relevance. It does not generate admissions odds, scholarship odds, or a selection score.</p></article>
                <article><strong>Will Essay Prep write a personal story for me?</strong><p>It should surface real story candidates from your evidence. You are responsible for writing in your own voice and following the institution's rules on originality, AI, and outside help.</p></article>
                <article><strong>Can someone under 18 create an account?</strong><p>Not during the current self-service phase. Until dedicated minor-consent and child/student privacy controls exist, accounts are intended for users age 18 or older.</p></article>
                <article><strong>What if my best work is confidential?</strong><p>Keep the secret parts out. Save a safe summary of the problem, your contribution, and the result instead, and follow your NDA, employer, client, or school rules.</p></article>
                <article><strong>Do I have to ask someone to verify every receipt?</strong><p>No. Verification is optional. Use it only when an appropriate person can genuinely confirm a specific claim and you have a reasonable basis to contact them.</p></article>
                <article><strong>What does verification legally prove?</strong><p>It records the verifier's response to a specific claim. It is not an independent audit, background check, notarization, credential verification, or legal certification by BragStack.</p></article>
                <article><strong>What is the difference between an accomplishment and an Impact Receipt?</strong><p>An accomplishment is the fuller story you capture. An Impact Receipt packages an important win into reusable proof with your contribution, result, supporting evidence, skills, and credit together.</p></article>
                <article><strong>What are Career Packets for?</strong><p>They help you select and organize relevant proof for a performance review, promotion, interview, or certification conversation without rebuilding the story from scratch. They do not guarantee the recipient will accept the evidence or give a particular outcome.</p></article>
                <article><strong>Does Career Analytics rank me against other people?</strong><p>No. It is meant to help you understand patterns in the proof you recorded, not assign your worth, determine eligibility, or promise a career outcome.</p></article>
                <article><strong>Is BragStack legal, admissions, HR, medical, or financial advice?</strong><p>No. BragStack is software for evidence organization, drafting, and practice. For a decision that needs professional advice, use an appropriately qualified professional.</p></article>
                <article><strong>Can I upload regulated or highly sensitive records?</strong><p>BragStack is not intended as the system of record for passwords, government identifiers, full payment-card data, bank credentials, medical records, restricted student records, classified information, or other highly sensitive data. See the Privacy Policy, Terms, Security page, and NDA guidance.</p></article>
              </div>
            </section>
            <section className="docs-section" id="contact">
              <div className="docs-section-title"><FileText size={21}/><div><h2>Contact & support</h2><span>Need a human?</span></div></div>
              <p>For account, billing, product, documentation, privacy, deletion, legal, or security questions, contact <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>. Security reports may also be sent to <a href="mailto:security@usebragstack.com">security@usebragstack.com</a>. Do not email passwords, access tokens, API keys, government identifiers, payment-card details, or confidential evidence.</p>
            </section>
          </>}
        </div>
      </article>
    </div>
  </main>;
}
