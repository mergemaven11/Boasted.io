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
  { id: "getting-started", icon: BookOpen, title: "Getting started", blurb: "Set up BragStack and capture your first win in minutes.", text: "Create an account, verify your email, sign in, and begin capturing accomplishments. BragStack is designed around a simple loop: capture the work, add evidence, describe the impact, connect skills, and reuse that proof later.", bullets: ["Create and verify your account", "Add your first accomplishment", "Turn important wins into Impact Receipts", "Keep everything private until you choose to share it"] },
  { id: "user-guide", icon: UserRound, title: "User guide", blurb: "Understand accounts, profiles, privacy, and daily workflows.", text: "Your BragStack workspace is private by default. Use your profile, accomplishment history, and visibility controls to build a career record you can safely reuse later.", bullets: ["Manage your account and profile", "Use Google, GitHub, or email/password", "Edit a new accomplishment during its edit window", "Control which proof is public"] },
  { id: "features", icon: ReceiptText, title: "Features", blurb: "Learn how accomplishments and Impact Receipts work together.", text: "Impact Receipts turn a meaningful accomplishment into structured career proof. Record what happened, what you contributed, the result, evidence references, skills, shared credit, and whether the receipt is private or public.", bullets: ["Accomplishment and contribution", "Measurable result and evidence", "Skills and shared credit", "Private or public visibility"] },
  { id: "career-tools", icon: BriefcaseBusiness, title: "Career tools", blurb: "Turn proof into review, resume, promotion, and interview material.", text: "BragStack uses only the work you recorded to build career material. Pro unlocks advanced reporting and packaging for performance reviews, promotions, interviews, and exports.", bullets: ["Performance review material", "Promotion packets", "Interview preparation", "Resume and career exports"] },
  { id: "public-profiles", icon: FileText, title: "Public profile", blurb: "Share selected proof without exposing your private workspace.", text: "A public Proof Profile exposes only entries and Impact Receipts you intentionally mark public. Private entries stay private.", bullets: ["Selective sharing", "Portfolio-style career proof", "Share with recruiters, hiring managers, clients, or your network", "No automatic publication of private work"] },
  { id: "billing", icon: CreditCard, title: "Billing & Pro", blurb: "Understand Free, Pro, Stripe checkout, and account access.", text: "BragStack Pro is billed through Stripe. Checkout is hosted securely by Stripe, and BragStack updates access after verified billing events from Stripe.", bullets: ["Free plan for getting started", "Pro at $9/month", "Stripe-hosted checkout", "Paid features stay locked unless the account has the required entitlement"] },
  { id: "integrations", icon: Plug, title: "Integrations", blurb: "See how BragStack connects to the tools around your work.", text: "Integrations are designed to help suggest useful work signals while keeping the user in control of what becomes career proof.", bullets: ["OAuth-based connections where available", "User-controlled proof creation", "No automatic public posting", "More integrations are planned"] },
  { id: "privacy", icon: ShieldCheck, title: "Privacy & NDA safety", blurb: "Protect confidential work while still documenting your impact.", text: "Career evidence can contain sensitive work history, so BragStack is built around user-controlled visibility. For NDA-covered work, generalize sensitive details, avoid restricted uploads, and follow your employer or client policies.", bullets: ["Private by default", "Explicit sharing controls", "NDA-safe guidance", "Public proof is opt-in per item"] },
  { id: "api", icon: Wrench, title: "API", blurb: "Developer access is planned, not exposed as customer documentation yet.", text: "BragStack's customer documentation does not send users to raw localhost or backend API pages. Public API documentation will be published here when it is ready for customer use.", bullets: ["Customer-safe documentation", "No localhost links", "Versioned API docs planned", "Authentication guidance will be published with the API"] },
];

const quickLinks = sections.slice(0, 6);

function DocsPage() {
  return (
    <main className="docs-page">
      <header className="docs-topbar">
        <a className="docs-brand" href="/"><img src="/brandmark.svg" alt="" /><span><strong>BragStack</strong><small>Docs</small></span></a>
        <nav aria-label="Documentation header"><a href="/">Product</a><a href="/nda-safety">NDA guidance</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
      </header>

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="Documentation sections">
          <p>BragStack Docs</p>
          <a href="#getting-started"><BookOpen size={16} />Getting Started</a>
          <a href="#user-guide"><UserRound size={16} />User Guide</a>
          <a href="#features"><ReceiptText size={16} />Features</a>
          <a href="#career-tools"><BriefcaseBusiness size={16} />Career Tools</a>
          <a href="#integrations"><Plug size={16} />Integrations</a>
          <a href="#api"><Wrench size={16} />API <span>Coming</span></a>
          <a href="#faq"><CircleHelp size={16} />FAQ</a>
          <a href="#contact"><FileText size={16} />Contact</a>
        </aside>

        <article className="docs-content">
          <section className="docs-hero">
            <p className="docs-kicker">CUSTOMER-FACING DOCUMENTATION</p>
            <h1>BragStack Docs</h1>
            <p>Learn how to track accomplishments, build your resume, create performance packets, share proof safely, and grow your career with evidence you control.</p>
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

            <section className="docs-section" id="faq"><div className="docs-section-title"><CircleHelp size={21} /><h2>FAQ</h2></div><p><strong>Is my work public?</strong> No. BragStack is private by default and only publishes proof you deliberately mark public.</p><p><strong>Can I use BragStack for confidential work?</strong> Yes, but you should generalize restricted details and follow your NDA or employer/client policy. See the NDA guidance page for practical examples.</p></section>
            <section className="docs-section" id="contact"><div className="docs-section-title"><FileText size={21} /><h2>Contact</h2></div><p>For account, billing, product, documentation, or privacy questions, contact <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}

export default DocsPage;
