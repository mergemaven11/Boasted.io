import { CreditCard, KeyRound, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { PublicFooter } from "./LegalPages.jsx";
import "./SecurityPage.css";

const protections = [
  { icon: LockKeyhole, title: "Private by default", text: "Your accomplishments, Impact Receipts, application preparation, resume drafts, interview practice, and other evidence stay in your private workspace unless you intentionally choose to share something." },
  { icon: KeyRound, title: "Protected sign-in", text: "BragStack supports account authentication and sign-in providers such as Google and GitHub. Protect the account you use to sign in, use strong credentials, and sign out on shared devices." },
  { icon: ShieldCheck, title: "Encrypted connections", text: "Production traffic uses HTTPS connections. BragStack also uses application access controls and hosted infrastructure intended to reduce unauthorized access to application data." },
  { icon: CreditCard, title: "Payment processing", text: "Subscription checkout is handled by a payment processor such as Stripe. BragStack uses billing status and account entitlement information to unlock paid features rather than storing full payment-card numbers itself." },
];

function SecurityPage() {
  return (
    <main className="security-page">
      <header className="security-topbar">
        <a className="security-brand" href="/"><img src="/brandmark.svg" alt="" /><strong>BragStack</strong></a>
        <nav aria-label="Security page navigation"><a href="/docs">Docs</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/nda-safety">NDA guidance</a><a href="/login">Sign in</a></nav>
      </header>

      <section className="security-hero">
        <div className="security-hero-copy">
          <span className="security-kicker"><ShieldCheck size={16} /> BRAGSTACK SECURITY</span>
          <h1>Your evidence deserves careful protection.</h1>
          <p>BragStack is designed around a simple idea: private career and education evidence should stay private unless you decide otherwise. This page explains the current security approach in plain English without claiming that any online service can eliminate risk.</p>
          <div className="security-actions"><a className="security-primary" href="/docs#privacy">Read privacy & NDA guidance</a><a className="security-secondary" href="mailto:security@usebragstack.com?subject=BragStack%20security%20report">Report a security concern</a></div>
        </div>
        <div className="security-lock-card"><ShieldCheck size={42} /><strong>Private by default</strong><span>You decide what becomes public.</span></div>
      </section>

      <section className="security-grid" aria-label="BragStack security protections">
        {protections.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={23} /><h2>{title}</h2><p>{text}</p></article>)}
      </section>

      <section className="security-flow">
        <div><span>1</span><strong>Capture</strong><small>Record only information you are allowed to retain.</small></div>
        <i>→</i>
        <div><span>2</span><strong>Review</strong><small>Remove restricted, unnecessary, or highly sensitive details.</small></div>
        <i>→</i>
        <div><span>3</span><strong>Choose</strong><small>Keep it private or intentionally share selected proof.</small></div>
      </section>

      <section className="security-guidance">
        <article><h2>What you should never put into BragStack</h2><ul><li>Passwords, API keys, access tokens, recovery codes, or authentication secrets</li><li>Full payment-card data, bank credentials, Social Security or national-identification numbers, or government-ID images</li><li>Medical records, biometric identifiers, restricted student records, background-check material, or similarly regulated/highly sensitive records</li><li>Customer data or third-party personal information you are not authorized to retain</li><li>Restricted source code, internal logs, confidential documents, recommendation letters, trade secrets, classified information, or proprietary review material</li><li>Anything your employer, school, client, contract, NDA, policy, or law says cannot leave its original system</li></ul><a href="/nda-safety">See our confidential-work guide →</a></article>
        <article><h2>Report a security issue</h2><p>If you notice unexpected account activity, a suspicious sign-in that may indicate compromise, a privacy or data-exposure problem, or a possible vulnerability, contact the security address with enough detail to investigate. Do not email passwords, access tokens, card details, government identifiers, or confidential evidence.</p><a href="mailto:security@usebragstack.com?subject=BragStack%20security%20report">security@usebragstack.com →</a></article>
      </section>

      <section className="security-guidance">
        <article><h2>Security features are not a compliance certification</h2><p>Do not assume BragStack is approved for a regulated workflow merely because the product uses HTTPS, authentication, private-by-default controls, or hosted infrastructure. Any specific certification or contractual compliance status must be stated expressly in current official materials or a signed agreement.</p></article>
        <article><h2>BragStack is not your only archive</h2><p>Keep your own copy of legally required, official, irreplaceable, or mission-critical records. BragStack may use backups and recovery processes, but no online service should be treated as the only copy of material you cannot afford to lose.</p></article>
      </section>

      <section className="security-note"><TriangleAlert size={20} /><div><strong>No online service can promise absolute security.</strong><p>BragStack uses reasonable safeguards designed to reduce risk, but vulnerabilities, provider failures, user mistakes, phishing, compromised devices, and other security events can still occur. Protect your credentials, connected accounts, and the information you choose to store or share.</p></div></section>
      <PublicFooter />
    </main>
  );
}

export default SecurityPage;
