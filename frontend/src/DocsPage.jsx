import { ArrowRight, BookOpen, CreditCard, FileText, LockKeyhole, ReceiptText, ShieldCheck, UserRound } from "lucide-react";
import "./LegalPages.css";

const sections = [
  { id: "getting-started", icon: BookOpen, title: "Getting started", text: "Create an account, verify your email, sign in, and begin capturing accomplishments. BragStack is designed around a simple loop: capture the work, add evidence, describe the impact, connect skills, and reuse that proof later.", bullets: ["Create and verify your account", "Add your first accomplishment", "Turn important wins into Impact Receipts", "Keep everything private until you choose to share it"] },
  { id: "accounts-security", icon: LockKeyhole, title: "Accounts & security", text: "You can use email/password, Google, or GitHub authentication. Password accounts require email verification. Password reset links are single-use and time limited.", bullets: ["Email verification for password signups", "Google and GitHub sign-in", "Password reset by verified email", "Sign out from the BragStack sidebar"] },
  { id: "impact-receipts", icon: ReceiptText, title: "Impact Receipts", text: "Impact Receipts turn a meaningful accomplishment into structured career proof. Record what happened, what you contributed, the result, evidence references, skills, shared credit, and whether the receipt is private or public.", bullets: ["Accomplishment and contribution", "Measurable result and evidence", "Skills and shared credit", "Private or public visibility"] },
  { id: "reports", icon: FileText, title: "Reports & career packets", text: "BragStack uses only the work you recorded to build career material. Pro unlocks advanced reporting and packaging for performance reviews, promotions, interviews, and exports.", bullets: ["Performance review material", "Promotion packets", "Interview preparation", "PDF and career exports"] },
  { id: "proof-profiles", icon: UserRound, title: "Public Proof Profiles", text: "Your account is private by default. A public Proof Profile exposes only entries and Impact Receipts you intentionally mark public. Private entries stay private.", bullets: ["Selective sharing", "Public portfolio-style proof", "Share with recruiters, hiring managers, clients, or your network", "No automatic publication of private work"] },
  { id: "billing", icon: CreditCard, title: "Billing & BragStack Pro", text: "BragStack Pro is billed through Stripe. Checkout is hosted securely by Stripe, and BragStack updates access after verified billing events from Stripe.", bullets: ["Free plan for getting started", "Pro at $9/month", "Stripe-hosted checkout", "Paid features stay locked unless the account has the required entitlement"] },
  { id: "privacy", icon: ShieldCheck, title: "Privacy & data control", text: "Career evidence can contain sensitive work history, so BragStack is built around user-controlled visibility. Your private workspace is not a public portfolio unless you deliberately publish selected proof.", bullets: ["Private by default", "Explicit sharing controls", "No employer surveillance positioning", "Public proof is opt-in per item"] },
];

function DocsPage() {
  return (
    <main className="legal-page docs-document-page">
      <header className="legal-header">
        <a className="legal-brand" href="/">BragStack</a>
        <nav aria-label="Documentation navigation"><a href="#getting-started">Getting started</a><a href="#impact-receipts">Impact Receipts</a><a href="/nda">NDA guidance</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
      </header>
      <article className="legal-card docs-document-card">
        <p className="legal-eyebrow">BragStack Docs</p>
        <h1>Everything you need to build and use your career proof system.</h1>
        <p className="legal-intro">Customer-facing guidance for accounts, accomplishments, Impact Receipts, reports, public proof, privacy, billing, and BragStack Pro.</p>
        <div className="docs-document-actions"><a className="docs-primary-link" href="#getting-started">Start with the basics <ArrowRight size={16} /></a><a href="mailto:Tobias.scott@usebragstack.com?subject=BragStack%20support">Contact support</a></div>
        {sections.map(({ id, icon: Icon, title, text, bullets }) => (
          <section id={id} key={id}>
            <h2 className="docs-section-title"><Icon size={20} />{title}</h2>
            <p>{text}</p>
            <ul className="docs-document-list">{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
          </section>
        ))}
        <section><h2>Need help?</h2><p>For account, billing, product, or privacy questions, contact <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>. If your work is covered by an NDA or confidentiality rule, read our <a href="/nda">NDA & confidential-work guidance</a> before storing or sharing evidence.</p></section>
      </article>
      <footer className="legal-site-footer">
        <div className="legal-site-footer-grid">
          <div className="legal-site-footer-brand"><a href="/">BragStack</a><p>Turn everyday work into career proof you can use when it matters.</p></div>
          <div><h3>Product</h3><a href="/#product-impact-receipts">Impact Receipts</a><a href="/#product-career-analytics">Career Analytics</a><a href="/#product-reports">Reports</a><a href="/#pricing">Pricing</a></div>
          <div><h3>Resources</h3><a href="/docs">Docs</a><a href="/nda">NDA & confidential work</a><a href="/#security">Security</a></div>
          <div><h3>Company</h3><a href="mailto:Tobias.scott@usebragstack.com">Contact</a><a href="/login">Sign in</a><a href="/register">Create account</a></div>
          <div><h3>Legal</h3><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a><a href="/nda">Confidentiality guidance</a></div>
        </div>
        <div className="legal-site-footer-bottom"><span>© 2026 BragStack</span><span>Private by default · Your proof stays yours.</span></div>
      </footer>
    </main>
  );
}

export default DocsPage;
