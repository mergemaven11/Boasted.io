import {
  BookOpen,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  FileText,
  Plug,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";
import "./DocsPage.css";

const sections = [
  { id: "getting-started", icon: BookOpen, title: "Getting started", blurb: "Set up BragStack and capture your first win in minutes.", text: "Create an account, sign in, and begin capturing accomplishments. BragStack is designed around one repeatable loop: capture the work, add evidence, describe measurable impact, connect skills, and reuse that proof later.", bullets: ["Create an account with Google, GitHub, or email/password", "Add your first accomplishment with enough context to remember what happened later", "Attach evidence or references that support the accomplishment", "Turn important wins into Impact Receipts", "Keep everything private until you deliberately choose to share it"] },
  { id: "user-guide", icon: UserRound, title: "Daily workflow", blurb: "Build the habit without turning BragStack into another chore.", text: "Use BragStack shortly after meaningful work happens. A useful entry usually captures the situation, what you personally did, what changed because of it, the skills involved, and where supporting evidence can be found.", bullets: ["Capture wins while details and metrics are still fresh", "Edit newly created accomplishments during the available edit window", "Use clear, factual language instead of inflated claims", "Add metrics only when you can reasonably support them", "Tag skills consistently so patterns become useful later"] },
  { id: "features", icon: ReceiptText, title: "Impact Receipts", blurb: "Turn a good accomplishment into structured, reusable proof.", text: "Impact Receipts are the core evidence object in BragStack. They organize a meaningful accomplishment into a clear record of contribution, measurable result, supporting evidence, skills, credit, and visibility.", bullets: ["Accomplishment: what happened", "Contribution: what you personally owned or changed", "Result: what improved, shipped, saved, grew, reduced, or enabled", "Evidence: files, links, ticket references, messages, dashboards, or notes you are permitted to retain", "Skills: capabilities demonstrated by the work", "Credit: acknowledge collaborators where appropriate", "Visibility: keep the receipt private or intentionally make selected proof public"] },
  { id: "evidence", icon: ShieldCheck, title: "Evidence quality", blurb: "Use evidence that makes your career claims easier to trust.", text: "Evidence does not have to be dramatic. Useful evidence is simply material that helps support the claim you are recording. A ticket ID, approved screenshot, launch note, customer message, metric snapshot, commit, or manager feedback can all be useful when you are allowed to retain them.", bullets: ["Prefer contemporaneous evidence created near the time of the work", "Keep evidence specific enough to support the claim", "Do not upload secrets, credentials, customer data, source code, or restricted internal material", "Use references or sanitized notes when the underlying material cannot leave a workplace system", "A missing evidence attachment is better than storing something you are not allowed to keep"] },
  { id: "impact", icon: BriefcaseBusiness, title: "Writing measurable impact", blurb: "Describe outcomes without inventing numbers.", text: "Measurable impact can be quantitative or qualitative. Use numbers when they are available and defensible. When they are not, describe observable outcomes such as reduced escalation, faster handoff, lower rework, stronger reliability, improved adoption, clearer ownership, or better customer outcomes.", bullets: ["Use before/after comparisons when available", "Separate your contribution from the team result", "Avoid guessing percentages or dollar values", "Explain the mechanism: what changed and why it mattered", "Prefer a smaller accurate claim over a larger unsupported one"] },
  { id: "career-tools", icon: BriefcaseBusiness, title: "Career tools", blurb: "Turn recorded evidence into review, resume, promotion, and interview material.", text: "BragStack is intended to generate career material from the evidence you have already recorded. The goal is to reduce blank-page work without creating accomplishments that never happened.", bullets: ["Performance-review packets organized from recorded evidence", "Promotion material highlighting scope, ownership, leadership, and results", "Job-targeted resume material grounded in your actual accomplishments", "Interview stories built from real situations, actions, and results", "Exports and advanced career packaging available through applicable plans"] },
  { id: "resume", icon: FileText, title: "Resume material", blurb: "Create stronger bullets without turning the resume into fiction.", text: "When using BragStack for resume material, start with evidence that matches the target role. Strong bullets usually identify the action, technical or business context, and result. BragStack should not add employers, dates, credentials, tools, metrics, or outcomes that you did not record.", bullets: ["Choose accomplishments relevant to the target job", "Prioritize outcomes over task lists", "Keep numbers traceable to recorded evidence", "Use role-appropriate terminology without overstating ownership", "Review every generated bullet before submitting an application"] },
  { id: "reviews", icon: FileText, title: "Performance reviews & promotions", blurb: "Use proof captured throughout the cycle instead of rebuilding the year from memory.", text: "Review and promotion material is strongest when it shows patterns over time. BragStack can help organize evidence by impact, scope, skills, leadership, execution, reliability, and growth, but the underlying claims should still come from your recorded work.", bullets: ["Capture praise and outcomes throughout the year", "Show repeated ownership, not just isolated wins", "Include shared credit where appropriate", "Use evidence to support growth in scope or responsibility", "Review the final packet for company-specific expectations"] },
  { id: "public-profiles", icon: FileText, title: "Public Proof Profile", blurb: "Share selected proof without exposing your private workspace.", text: "A public Proof Profile exposes only entries and Impact Receipts you intentionally mark public. Your private workspace remains separate. Public sharing is useful for recruiters, hiring managers, clients, collaborators, or a portfolio, but only publish information you are comfortable making broadly accessible.", bullets: ["Selective item-level sharing", "Portfolio-style proof of impact", "Private entries are not automatically published", "Remove confidential details before publishing", "Assume public content can be copied by others"] },
  { id: "billing", icon: CreditCard, title: "Billing & Pro", blurb: "Understand Free, Pro, checkout, renewal, and access.", text: "BragStack may offer Free and paid plans. Paid checkout is handled through the configured payment provider, and BragStack updates account access after verified billing events.", bullets: ["Free plan for learning the core proof workflow", "Pro currently listed at $9/month where offered", "Paid plan features are enforced using account entitlements", "Cancel future renewal through available billing controls or support", "A canceled subscription generally remains active through the paid billing period unless otherwise stated", "Taxes and payment-provider terms may apply"] },
  { id: "integrations", icon: Plug, title: "Integrations", blurb: "Bring useful work signals into BragStack without losing control.", text: "Integrations are intended to reduce manual capture by surfacing possible work signals. A signal is not automatically career proof. You should review, edit, and approve information before it becomes part of your career record.", bullets: ["OAuth-based connections where available", "Suggestions remain subject to user review", "No automatic public posting", "Disconnect integrations you no longer use", "More integrations may be introduced over time"] },
  { id: "privacy", icon: ShieldCheck, title: "Privacy & NDA safety", blurb: "Protect confidential work while still documenting your impact.", text: "Career evidence can contain sensitive work history, so BragStack is built around user-controlled visibility. If your work is covered by an NDA or internal security policy, document the impact at the safest level that still preserves its career value.", bullets: ["Private by default", "Explicit sharing controls", "Generalize customer names, internal systems, unreleased products, and sensitive metrics", "Do not upload restricted screenshots, logs, code, credentials, or proprietary documents", "Use evidence references when the source must remain inside your employer’s systems", "Review the dedicated NDA guidance before publishing anything sensitive"] },
  { id: "security", icon: ShieldCheck, title: "Account & security basics", blurb: "Simple practices that protect your career record.", text: "Your BragStack account can contain meaningful professional history. Protect it the same way you would protect other important work accounts.", bullets: ["Use a strong unique password if you sign in with email/password", "Protect your Google or GitHub account if you use OAuth", "Sign out on shared devices", "Do not paste credentials, API keys, access tokens, or customer secrets into accomplishment evidence", "Contact support if you suspect unauthorized access"] },
  { id: "deletion", icon: UserRound, title: "Data access, export & deletion", blurb: "Understand what to do when you want a copy of your data or want to leave.", text: "Where available, use product controls to update or remove content. For account-level access, export, correction, or deletion requests, contact BragStack support. Some limited records may need to be retained for billing, fraud prevention, legal compliance, security, or backup retention.", bullets: ["Request a copy of personal information", "Request correction of inaccurate account information", "Request deletion of your account", "Remove public visibility before deleting when appropriate", "Back up career material you want to keep before closing your account"] },
  { id: "api", icon: Wrench, title: "API", blurb: "Developer access is planned, not exposed as customer documentation yet.", text: "BragStack's customer documentation does not send users to raw localhost or backend API pages. Public API documentation will be published here only when it is ready for supported customer use.", bullets: ["Customer-safe documentation", "No localhost links", "Versioned API docs planned", "Authentication, rate limits, and examples will be documented with the API", "Private internal endpoints should not be treated as a supported public API"] },
];

const quickLinks = sections.slice(0, 6);

function DocsPage() {
  return (
    <main className="docs-page">
      <header className="docs-topbar">
        <a className="docs-brand" href="/"><img src="/brandmark.svg" alt="" /><span><strong>BragStack</strong><small>Docs</small></span></a>
        <nav aria-label="Documentation header"><a href="/">Product</a><a href="/#pricing">Pricing</a><a href="/nda-safety">NDA guidance</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
      </header>

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="Documentation sections">
          <p>BragStack Docs</p>
          <a href="#getting-started"><BookOpen size={16} />Getting Started</a>
          <a href="#user-guide"><UserRound size={16} />Daily Workflow</a>
          <a href="#features"><ReceiptText size={16} />Impact Receipts</a>
          <a href="#evidence"><ShieldCheck size={16} />Evidence Quality</a>
          <a href="#career-tools"><BriefcaseBusiness size={16} />Career Tools</a>
          <a href="#billing"><CreditCard size={16} />Billing & Pro</a>
          <a href="#privacy"><ShieldCheck size={16} />Privacy & NDA</a>
          <a href="#api"><Wrench size={16} />API <span>Coming</span></a>
          <a href="#faq"><CircleHelp size={16} />FAQ</a>
          <a href="#contact"><FileText size={16} />Contact</a>
        </aside>

        <article className="docs-content">
          <section className="docs-hero">
            <p className="docs-kicker">CUSTOMER-FACING DOCUMENTATION</p>
            <h1>BragStack Docs</h1>
            <p>Learn how to capture accomplishments, attach evidence, write measurable impact, create Impact Receipts, build career material, share proof safely, manage billing, and protect confidential work.</p>
            <label className="docs-search"><Search size={18} /><input aria-label="Search documentation" placeholder="Search docs..." /></label>
          </section>

          <section className="docs-card-grid" aria-label="Popular documentation">
            {quickLinks.map(({ id, icon: Icon, title, blurb }) => (
              <a className="docs-card" href={`#${id}`} key={id}><Icon size={20} /><div><strong>{title}</strong><span>{blurb}</span></div></a>
            ))}
          </section>

          <div className="docs-body">
            {sections.map(({ id, icon: Icon, title, text, bullets }) => (
              <section className="docs-section" id={id} key={id}>
                <div className="docs-section-title"><Icon size={21} /><h2>{title}</h2></div>
                <p>{text}</p>
                <ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              </section>
            ))}

            <section className="docs-section" id="faq">
              <div className="docs-section-title"><CircleHelp size={21} /><h2>FAQ</h2></div>
              <p><strong>Is my work public?</strong> No. BragStack is private by default. Only proof you deliberately mark public should appear on a public profile or shareable surface.</p>
              <p><strong>Can I use BragStack for confidential work?</strong> Yes, but only at a level permitted by your employer, client, NDA, and applicable policy. Generalize restricted details and avoid uploading materials you are not authorized to retain.</p>
              <p><strong>What counts as evidence?</strong> Evidence can be a file, approved screenshot, ticket reference, commit, metric, message, launch note, feedback, or a private reference to information that remains in an employer-controlled system.</p>
              <p><strong>Do I need a metric for every accomplishment?</strong> No. Quantitative evidence is useful when available, but qualitative outcomes can also be meaningful if they are concrete and supportable.</p>
              <p><strong>Will BragStack invent resume bullets for me?</strong> It should draft from the evidence you recorded. Always review generated content and remove anything that is inaccurate or unsupported.</p>
              <p><strong>Can I share only one accomplishment?</strong> Yes. Public sharing should be selective; you do not need to expose your whole private career history.</p>
              <p><strong>What happens if I cancel Pro?</strong> Future renewal should stop according to the billing flow, while paid access generally continues through the current paid period unless otherwise stated. Core account data should remain associated with your account subject to the applicable plan and retention rules.</p>
              <p><strong>How do I delete my account or request my data?</strong> Contact support using the address below. Identity verification may be required before account-level privacy requests are completed.</p>
            </section>

            <section className="docs-section" id="contact"><div className="docs-section-title"><FileText size={21} /><h2>Contact & support</h2></div><p>For account, billing, product, documentation, privacy, deletion, or security questions, contact <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>. Include enough context to identify the issue, but do not email passwords, access tokens, API keys, or confidential evidence.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}

export default DocsPage;
