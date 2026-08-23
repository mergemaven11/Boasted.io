import { ArrowRight, BookOpen, CreditCard, FileText, LockKeyhole, ReceiptText, ShieldCheck, UserRound } from "lucide-react";
import "./LandingPage.css";

const sections = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting started",
    text: "Create an account, verify your email, sign in, and begin capturing accomplishments. BragStack is designed around a simple loop: capture the work, add evidence, describe the impact, connect skills, and reuse that proof later.",
    bullets: ["Create and verify your account", "Add your first accomplishment", "Turn important wins into Impact Receipts", "Keep everything private until you choose to share it"],
  },
  {
    id: "accounts-security",
    icon: LockKeyhole,
    title: "Accounts & security",
    text: "You can use email/password, Google, or GitHub authentication. Password accounts require email verification. Password reset links are single-use and time limited.",
    bullets: ["Email verification for password signups", "Google and GitHub sign-in", "Password reset by verified email", "Sign out from the BragStack sidebar"],
  },
  {
    id: "impact-receipts",
    icon: ReceiptText,
    title: "Impact Receipts",
    text: "Impact Receipts turn a meaningful accomplishment into structured career proof. Record what happened, what you contributed, the result, evidence references, skills, shared credit, and whether the receipt is private or public.",
    bullets: ["Accomplishment and contribution", "Measurable result and evidence", "Skills and shared credit", "Private or public visibility"],
  },
  {
    id: "reports",
    icon: FileText,
    title: "Reports & career packets",
    text: "BragStack uses only the work you recorded to build career material. Pro unlocks advanced reporting and packaging for performance reviews, promotions, interviews, and exports.",
    bullets: ["Performance review material", "Promotion packets", "Interview preparation", "PDF and career exports"],
  },
  {
    id: "proof-profiles",
    icon: UserRound,
    title: "Public Proof Profiles",
    text: "Your account is private by default. A public Proof Profile exposes only entries and Impact Receipts you intentionally mark public. Private entries stay private.",
    bullets: ["Selective sharing", "Public portfolio-style proof", "Share with recruiters, hiring managers, clients, or your network", "No automatic publication of private work"],
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Billing & BragStack Pro",
    text: "BragStack Pro is billed through Stripe. Checkout is hosted securely by Stripe, and BragStack updates access after verified billing events from Stripe.",
    bullets: ["Free plan for getting started", "Pro at $9/month", "Stripe-hosted checkout", "Paid features stay locked unless the account has the required entitlement"],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Privacy & data control",
    text: "Career evidence can contain sensitive work history, so BragStack is built around user-controlled visibility. Your private workspace is not a public portfolio unless you deliberately publish selected proof.",
    bullets: ["Private by default", "Explicit sharing controls", "No employer surveillance positioning", "Public proof is opt-in per item"],
  },
];

function DocsPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/">BragStack</a>
        <nav className="landing-nav-links" aria-label="Documentation navigation">
          <a href="#getting-started">Getting started</a>
          <a href="#impact-receipts">Impact Receipts</a>
          <a href="#billing">Billing</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/login">Sign in</a>
          <a className="landing-btn landing-btn-small" href="/register">Create account</a>
        </div>
      </header>

      <section className="landing-hero" style={{ minHeight: "auto", paddingBottom: 48 }}>
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><BookOpen size={16} />BragStack Docs</div>
          <h1>Everything you need to build and use your career proof system.</h1>
          <p className="landing-hero-description">Customer-facing guidance for accounts, accomplishments, Impact Receipts, reports, public proof, privacy, and BragStack Pro.</p>
          <div className="landing-hero-actions">
            <a className="landing-btn" href="#getting-started">Start with the basics <ArrowRight size={18} /></a>
            <a className="landing-btn landing-btn-secondary" href="mailto:Tobias.scott@usebragstack.com?subject=BragStack%20support">Contact support</a>
          </div>
        </div>
      </section>

      <section className="landing-use-cases" style={{ paddingTop: 32 }}>
        <div className="use-case-grid">
          {sections.map(({ id, icon: Icon, title, text, bullets }) => (
            <article className="use-case-card" id={id} key={id}>
              <div className="use-case-icon"><Icon size={21} /></div>
              <h2>{title}</h2>
              <p>{text}</p>
              <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
                {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-feature-section">
        <div className="landing-feature-copy">
          <p className="landing-mini-label">NEED HELP?</p>
          <h2>BragStack support is one email away.</h2>
          <p>For account, billing, product, or privacy questions, contact Tobias.scott@usebragstack.com.</p>
          <a className="landing-btn" href="mailto:Tobias.scott@usebragstack.com?subject=BragStack%20support">Email BragStack support <ArrowRight size={18} /></a>
        </div>
      </section>
    </main>
  );
}

export default DocsPage;
