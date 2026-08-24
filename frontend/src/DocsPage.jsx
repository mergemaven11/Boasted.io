import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  FileText,
  Mic2,
  Plug,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import "./DocsPage.css";

const sections = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Start here",
    blurb: "The simplest way to understand BragStack.",
    text: "BragStack helps you remember what you did, prove the impact, and reuse that proof later for resumes, interviews, reviews, promotions, and your public career story.",
    bullets: [
      "Capture a real accomplishment while the details are fresh.",
      "Add the result, evidence, and skills that make the accomplishment believable.",
      "Turn important wins into Impact Receipts.",
      "Reuse your career proof instead of starting from a blank page every time.",
      "Keep your workspace private unless you deliberately choose to share something.",
    ],
  },
  {
    id: "daily-workflow",
    icon: UserRound,
    title: "Your everyday workflow",
    blurb: "A five-minute habit after meaningful work happens.",
    text: "You do not need to document every task. Save the work that shows growth, ownership, problem solving, leadership, customer impact, technical skill, or measurable improvement.",
    bullets: [
      "What happened? Give enough context for future-you to understand it.",
      "What did you personally do? Separate your contribution from the team result.",
      "What changed? Add a metric when you have one, or a concrete outcome when you do not.",
      "What proves it? Add safe evidence, a reference, or a note about where the source lives.",
      "What skill did this demonstrate? Tag skills consistently so patterns become useful later.",
    ],
  },
  {
    id: "impact-receipts",
    icon: ReceiptText,
    title: "Impact Receipts",
    blurb: "Your reusable record of career proof.",
    text: "An Impact Receipt turns a memory into structured proof. Think of it like a receipt for work you actually did: the contribution, result, evidence, skills, credit, and visibility all stay together.",
    bullets: [
      "Accomplishment — what happened.",
      "Contribution — what you personally owned, changed, fixed, built, or influenced.",
      "Result — what improved, shipped, saved, grew, reduced, or became easier.",
      "Evidence — files, links, tickets, messages, dashboards, commits, or safe references.",
      "Skills and credit — what the work demonstrates and who else deserves recognition.",
    ],
  },
  {
    id: "resume-builder",
    icon: FileText,
    title: "Resume Builder",
    blurb: "Build an ATS-friendly resume from proof you already captured.",
    text: "The Resume Builder starts with your Impact Receipts and target job. It helps turn real accomplishments into stronger resume bullets without inventing employers, dates, tools, metrics, or outcomes.",
    bullets: [
      "Enter the target role and, when available, paste the job description.",
      "Choose the career proof that best matches the opportunity, or use all relevant receipts.",
      "BragStack builds role-aware bullets from your recorded evidence.",
      "Review every bullet before using it. Edit anything that does not sound like you.",
      "Keep the strongest bullets focused on action, context, and result — not task lists.",
    ],
  },
  {
    id: "career-intelligence",
    icon: BrainCircuit,
    title: "BragStack Career Intelligence™",
    blurb: "Career-aware reasoning that connects your evidence to the skill being tested.",
    text: "Career Intelligence is the reasoning layer behind BragStack's newer career tools. It looks beyond answer shape and asks whether your evidence actually supports the competency, role, or career goal in front of you.",
    bullets: [
      "Matches career proof to role and competency context.",
      "Looks for ownership, specificity, evidence, result, impact, and relevance.",
      "Uses your saved career proof when personalization is enabled.",
      "Keeps the focus on what you actually did instead of generic career advice.",
      "Supports adaptive coaching in Interview Practice.",
    ],
  },
  {
    id: "interviewer",
    icon: Mic2,
    title: "Practice Interview",
    blurb: "Practice real questions and get evidence-aware coaching.",
    text: "The BragStack Interviewer creates a role-aware practice session, evaluates whether your answer actually proves the skill being tested, and can ask a follow-up when your answer needs more evidence or clarity.",
    bullets: [
      "Choose a target role, experience level, interview type, and number of questions.",
      "Paste a job description when you want tighter role alignment.",
      "Personalize with Impact Receipts when you want the session connected to your own career proof.",
      "Answer naturally by typing or speaking where your browser supports it.",
      "Use the feedback to strengthen context, ownership, specificity, impact, relevance, and communication.",
      "Finish with a strengths-and-improvement summary you can use for your next practice round.",
    ],
  },
  {
    id: "evidence",
    icon: ShieldCheck,
    title: "Evidence without oversharing",
    blurb: "Prove your work while protecting confidential information.",
    text: "Evidence should support your claim, not create a security problem. A reference to where evidence lives can be better than uploading something you are not allowed to keep.",
    bullets: [
      "Good evidence can be a ticket ID, approved screenshot, launch note, customer message, metric snapshot, commit, or manager feedback.",
      "Never upload passwords, credentials, API keys, customer secrets, restricted code, or confidential documents.",
      "Generalize customer names, internal systems, unreleased products, and sensitive metrics when needed.",
      "When the source must stay at work, save a sanitized reference instead of the restricted material itself.",
    ],
  },
  {
    id: "reviews",
    icon: BriefcaseBusiness,
    title: "Reviews, promotions & career packets",
    blurb: "Use proof captured all year instead of rebuilding your story from memory.",
    text: "BragStack can organize your recorded work into material for performance reviews, promotion conversations, interview packets, and other career moments.",
    bullets: [
      "Show repeated ownership and growth over time, not just isolated wins.",
      "Use evidence to support scope, leadership, execution, reliability, and impact.",
      "Include shared credit where appropriate.",
      "Review the final material for company-specific expectations before submitting it.",
    ],
  },
  {
    id: "public-profile",
    icon: FileText,
    title: "Public Proof Profile",
    blurb: "Share selected proof without exposing your private workspace.",
    text: "Your public profile should be a curated window into your work, not a mirror of everything you have saved privately.",
    bullets: [
      "Only intentionally public proof should appear on a public profile.",
      "Use it as a portfolio-style view for recruiters, hiring managers, clients, or collaborators.",
      "Remove confidential details before publishing.",
      "Assume anything public can be copied or reshared by someone else.",
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Billing & Pro",
    blurb: "Understand paid access without billing jargon.",
    text: "Some BragStack features are available through Pro. Checkout and subscription billing are handled through the configured payment provider, while BragStack controls feature access from your verified account entitlement.",
    bullets: [
      "Free access covers the core career-proof workflow where offered.",
      "Pro is currently listed at $9/month where offered.",
      "Canceling normally stops future renewal while access continues through the paid period.",
      "Taxes and payment-provider terms may apply.",
      "Contact support if your payment succeeded but your Pro access does not update.",
    ],
  },
  {
    id: "integrations",
    icon: Plug,
    title: "Connections & sign-in",
    blurb: "Use Google, GitHub, and other connections safely.",
    text: "Connections help with sign-in or bring useful signals into BragStack. A connected service does not automatically make your work public.",
    bullets: [
      "Use Google, GitHub, or email/password where available.",
      "Review imported or suggested information before treating it as career proof.",
      "Disconnect integrations you no longer use.",
      "Protect the Google or GitHub account you use for sign-in.",
    ],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Privacy & NDA safety",
    blurb: "Keep the career value. Leave the secrets behind.",
    text: "BragStack is built around user-controlled visibility, but you are still responsible for following employer policy, client agreements, NDAs, and applicable law.",
    bullets: [
      "Private by default.",
      "Share selectively.",
      "Do not store material you are not authorized to retain.",
      "Use safe summaries and references for restricted work.",
      "Review the NDA guidance before publishing sensitive career proof.",
    ],
  },
  {
    id: "account",
    icon: UserRound,
    title: "Account, export & deletion",
    blurb: "What to do when you need your data or want to leave.",
    text: "Use product controls to update or remove content where available. For account-level access, export, correction, or deletion requests, contact BragStack support.",
    bullets: [
      "Request a copy of your personal information.",
      "Request correction of inaccurate account information.",
      "Request deletion of your account.",
      "Back up career material you want to keep before closing the account.",
      "Some limited records may be retained when required for billing, fraud prevention, security, legal compliance, or backups.",
    ],
  },
  {
    id: "api",
    icon: Wrench,
    title: "API",
    blurb: "Developer access is planned, not part of the everyday user guide.",
    text: "BragStack does not send non-technical users into raw backend endpoints. Public API documentation will be added when a supported customer API is ready.",
    bullets: [
      "No localhost links in customer docs.",
      "Authentication, limits, and examples will be documented when the public API launches.",
      "Private internal endpoints are not a supported customer API.",
    ],
  },
];

const quickLinks = ["impact-receipts", "resume-builder", "interviewer", "career-intelligence", "evidence", "privacy"]
  .map((id) => sections.find((section) => section.id === id))
  .filter(Boolean);

const journey = [
  { title: "Capture", detail: "Save a real accomplishment" },
  { title: "Prove", detail: "Add result + evidence" },
  { title: "Package", detail: "Create an Impact Receipt" },
  { title: "Reuse", detail: "Resume, interview, review, profile" },
];

function searchableText(section) {
  return [section.title, section.blurb, section.text, ...(section.bullets || [])].join(" ").toLowerCase();
}

function DocsPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(
    () => normalizedQuery ? sections.filter((section) => searchableText(section).includes(normalizedQuery)) : sections,
    [normalizedQuery],
  );

  function jumpTo(sectionId) {
    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="docs-page">
      <header className="docs-topbar">
        <a className="docs-brand" href="/"><img src="/brandmark.svg" alt="" /><span><strong>BragStack</strong><small>Help Center</small></span></a>
        <nav aria-label="Documentation header"><a href="/">Product</a><a href="/#pricing">Pricing</a><a href="/nda-safety">NDA guidance</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
      </header>

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="Documentation sections">
          <p>Learn BragStack</p>
          <a href="#getting-started"><BookOpen size={16} />Start Here</a>
          <a href="#impact-receipts"><ReceiptText size={16} />Impact Receipts</a>
          <a href="#resume-builder"><FileText size={16} />Resume Builder</a>
          <a href="#interviewer"><Mic2 size={16} />Practice Interview</a>
          <a href="#career-intelligence"><BrainCircuit size={16} />Career Intelligence</a>
          <a href="#privacy"><ShieldCheck size={16} />Privacy & NDA</a>
          <a href="#billing"><CreditCard size={16} />Billing & Pro</a>
          <a href="#faq"><CircleHelp size={16} />FAQ</a>
          <a href="#contact"><FileText size={16} />Contact</a>
        </aside>

        <article className="docs-content">
          <section className="docs-hero">
            <p className="docs-kicker">BRAGSTACK HELP CENTER</p>
            <h1>Career proof, explained simply.</h1>
            <p>No technical background needed. Pick what you are trying to do and BragStack will show you the shortest path.</p>
            <label className="docs-search">
              <Search size={18} />
              <input
                aria-label="Search documentation"
                placeholder="Try “resume”, “interview”, “evidence”, “billing”…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear documentation search"><X size={17} /></button>}
            </label>
            {normalizedQuery && (
              <div className="docs-search-summary" role="status">
                <strong>{filteredSections.length}</strong> {filteredSections.length === 1 ? "guide" : "guides"} found for “{query.trim()}”
              </div>
            )}
          </section>

          {!normalizedQuery && (
            <>
              <section className="docs-journey" aria-label="How BragStack works">
                <div className="docs-journey-heading"><span>THE BIG PICTURE</span><h2>One career-proof loop</h2><p>Capture once. Reuse when it matters.</p></div>
                <div className="docs-flow">
                  {journey.map((step, index) => (
                    <div className="docs-flow-step" key={step.title}>
                      <span>{index + 1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>
                      {index < journey.length - 1 && <ArrowRight className="docs-flow-arrow" size={18} />}
                    </div>
                  ))}
                </div>
              </section>

              <section className="docs-card-grid" aria-label="Popular documentation">
                {quickLinks.map(({ id, icon: Icon, title, blurb }) => (
                  <a className="docs-card" href={`#${id}`} key={id}><Icon size={20} /><div><strong>{title}</strong><span>{blurb}</span></div></a>
                ))}
              </section>
            </>
          )}

          <div className="docs-body">
            {filteredSections.length ? filteredSections.map(({ id, icon: Icon, title, blurb, text, bullets }) => (
              <section className="docs-section" id={id} key={id}>
                <div className="docs-section-title"><Icon size={21} /><div><h2>{title}</h2><span>{blurb}</span></div></div>
                <p>{text}</p>
                <ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                {normalizedQuery && <button className="docs-jump-button" type="button" onClick={() => { setQuery(""); jumpTo(id); }}>Open full guide <ArrowRight size={15} /></button>}
              </section>
            )) : (
              <section className="docs-empty-state">
                <Search size={28} />
                <h2>No guide matched that search.</h2>
                <p>Try a simpler word like <button type="button" onClick={() => setQuery("resume")}>resume</button>, <button type="button" onClick={() => setQuery("interview")}>interview</button>, <button type="button" onClick={() => setQuery("evidence")}>evidence</button>, or <button type="button" onClick={() => setQuery("billing")}>billing</button>.</p>
              </section>
            )}

            {!normalizedQuery && (
              <>
                <section className="docs-section" id="faq">
                  <div className="docs-section-title"><CircleHelp size={21} /><div><h2>Quick answers</h2><span>The questions people usually mean when they open documentation.</span></div></div>
                  <div className="docs-faq-grid">
                    <article><strong>Is my work public?</strong><p>No. BragStack is private by default. Only proof you deliberately make public should appear on a public surface.</p></article>
                    <article><strong>Will BragStack invent resume claims?</strong><p>It should build from the evidence you recorded. Always review generated material and remove anything inaccurate or unsupported.</p></article>
                    <article><strong>Do I need numbers for every accomplishment?</strong><p>No. Use defensible numbers when you have them. Otherwise describe a concrete, observable outcome.</p></article>
                    <article><strong>Can I use confidential work?</strong><p>Yes, at a safe level allowed by your employer, client, NDA, and policy. Generalize restricted details and never upload material you cannot retain.</p></article>
                  </div>
                </section>

                <section className="docs-section" id="contact">
                  <div className="docs-section-title"><FileText size={21} /><div><h2>Still stuck?</h2><span>Tell us what you were trying to do, not just the error message.</span></div></div>
                  <p>For account, billing, product, documentation, privacy, deletion, or security questions, contact <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>. Include enough context to identify the issue, but never email passwords, access tokens, API keys, or confidential evidence.</p>
                </section>
              </>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}

export default DocsPage;
