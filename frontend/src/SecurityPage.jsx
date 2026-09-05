import { CreditCard, KeyRound, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { PublicFooter } from "./LegalPages.jsx";
import "./SecurityPage.css";

const protections = [
  { icon: LockKeyhole, title: "Private by default", text: "Your accomplishments, Impact Receipts, resume drafts, interview practice, and other career material stay in your private workspace unless you intentionally choose to share something." },
  { icon: KeyRound, title: "Protected sign-in", text: "BragStack supports account authentication and sign-in providers such as Google and GitHub. Protect the account you use to sign in and sign out on shared devices." },
  { icon: ShieldCheck, title: "Secure connections", text: "Production traffic uses encrypted HTTPS connections. BragStack also uses access controls and hosted infrastructure intended to reduce unauthorized access to application data." },
  { icon: CreditCard, title: "Payments handled by Stripe", text: "Subscription checkout is handled by Stripe. BragStack uses billing status and account entitlement information to unlock paid features rather than storing full payment-card numbers itself." },
];

function SecurityPage() {
  return (
    <main className="security-page">
      <header className="security-topbar">
        <a className="security-brand" href="/"><img src="/brandmark.svg" alt="" /><strong>BragStack</strong></a>
        <nav aria-label="Security page navigation"><a href="/docs">Docs</a><a href="/privacy">Privacy</a><a href="/nda-safety">NDA guidance</a><a href="/login">Sign in</a></nav>
      </header>

      <section className="security-hero">
        <div className="security-hero-copy">
          <span className="security-kicker"><ShieldCheck size={16} /> BRAGSTACK SECURITY</span>
          <h1>Your career proof deserves careful protection.</h1>
          <p>BragStack is designed around a simple idea: your private career evidence should stay private unless you decide otherwise. This page explains our security approach in plain English for people across professions and work settings.</p>
          <div className="security-actions"><a className="security-primary" href="/docs#privacy">Read privacy & NDA guidance</a><a className="security-secondary" href="mailto:security@usebragstack.com?subject=BragStack%20security%20report">Report a security concern</a></div>
        </div>
        <div className="security-lock-card"><ShieldCheck size={42} /><strong>Private by default</strong><span>You decide what becomes public.</span></div>
      </section>

      <section className="security-grid" aria-label="BragStack security protections">
        {protections.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={23} /><h2>{title}</h2><p>{text}</p></article>)}
      </section>

      <section className="security-flow">
        <div><span>1</span><strong>Capture</strong><small>Record work in your private workspace.</small></div>
        <i>→</i>
        <div><span>2</span><strong>Review</strong><small>Remove restricted or unnecessary details.</small></div>
        <i>→</i>
        <div><span>3</span><strong>Choose</strong><small>Keep it private or intentionally share selected proof.</small></div>
      </section>

      <section className="security-guidance">
        <article><h2>What you should never put into BragStack</h2><ul><li>Passwords, API keys, access tokens, access codes, or authentication secrets</li><li>Patient or health information, student records, case files, constituent records, customer data, payment information, or other personal information you are not authorized to retain</li><li>Restricted source code, internal logs, personnel records, private financials, confidential contracts, proprietary schematics, unreleased creative work, trade secrets, or other protected material</li><li>Anything your employer, client, school, healthcare organization, agency, professional rules, contract, NDA, privacy obligations, or applicable law says cannot be stored in a third-party system</li></ul><a href="/nda-safety">See our confidential-work guide →</a></article>
        <article><h2>Report a security issue</h2><p>If you notice unexpected account activity, a suspicious sign-in that may indicate compromise, a privacy or data-exposure problem, or a possible vulnerability, contact the security address with enough detail to investigate. Do not email passwords, access tokens, card details, protected records, or confidential evidence.</p><a href="mailto:security@usebragstack.com?subject=BragStack%20security%20report">security@usebragstack.com →</a></article>
      </section>

      <section className="security-note"><TriangleAlert size={20} /><div><strong>No online service can promise absolute security.</strong><p>BragStack uses reasonable safeguards designed to protect your information, but good account hygiene still matters: use strong credentials, protect your sign-in provider account, and be careful about what workplace, client, patient, student, customer, case, or other restricted material you retain.</p></div></section>
      <PublicFooter />
    </main>
  );
}

export default SecurityPage;
