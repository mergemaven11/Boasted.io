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
          <p>BragStack is designed around a simple idea: your private career evidence should stay private unless you decide otherwise. This page explains our security approach in plain English.</p>
          <div className="security-actions"><a className="security-primary" href="/docs#privacy">Read privacy & NDA guidance</a><a className="security-secondary" href="mailto:support@usebragstack.com?subject=BragStack%20security%20report">Report a security concern</a></div>
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
        <article><h2>What you should never put into BragStack</h2><ul><li>Passwords, API keys, access tokens, or authentication secrets</li><li>Customer data or personal information you are not authorized to retain</li><li>Restricted source code, internal logs, confidential documents, or trade secrets</li><li>Anything your employer, client, contract, or NDA says cannot leave its systems</li></ul><a href="/nda-safety">See our confidential-work guide →</a></article>
        <article><h2>If something looks wrong</h2><p>If you notice unexpected account activity, a suspicious sign-in, a privacy problem, or a possible vulnerability, contact us with enough detail to investigate. Do not email passwords, access tokens, or confidential evidence.</p><a href="mailto:support@usebragstack.com?subject=BragStack%20security%20report">support@usebragstack.com →</a></article>
      </section>

      <section className="security-guidance" aria-label="Technical troubleshooting">
        <article><h2>Sign-in or account access problems</h2><p><strong>Recommended fixes:</strong> retry from the BragStack sign-in page, confirm you are using the same Google, GitHub, or email account you originally registered with, disable aggressive privacy extensions for the sign-in attempt, and try a private/incognito window. If an OAuth window closes or redirects unexpectedly, return to BragStack and sign in again instead of repeatedly refreshing the callback page.</p><a href="mailto:support@usebragstack.com?subject=BragStack%20sign-in%20support">Contact support →</a></article>
        <article><h2>Payment succeeded but Pro is locked</h2><p><strong>Recommended fixes:</strong> wait a few seconds, refresh the app once, then sign out and back in so your account entitlement can reload. Confirm you completed checkout using the same BragStack account. Do not send card numbers or payment credentials by email; a receipt time and the email used for BragStack are enough for us to investigate.</p><a href="mailto:support@usebragstack.com?subject=BragStack%20billing%20support">Contact support →</a></article>
        <article><h2>Interview voice, microphone, or Aisha is not working</h2><p><strong>Recommended fixes:</strong> allow microphone permission for usebragstack.com, close other apps that may be using the microphone, reload the interview page, and start a new practice session. If speech is unavailable, use text answering temporarily. Include your browser, device, and what happened immediately before the failure when reporting the issue.</p><a href="mailto:support@usebragstack.com?subject=BragStack%20interview%20support">Contact support →</a></article>
        <article><h2>Page will not load, save, or update</h2><p><strong>Recommended fixes:</strong> confirm your internet connection, refresh once, then sign out and back in. Avoid submitting the same form repeatedly while a request is still processing. If the problem continues, capture the page name, approximate time, browser, and the exact error message or screenshot. Never include passwords, access tokens, or confidential workplace evidence.</p><a href="mailto:support@usebragstack.com?subject=BragStack%20technical%20support">Contact support →</a></article>
      </section>

      <section className="security-note"><TriangleAlert size={20} /><div><strong>No online service can promise absolute security.</strong><p>BragStack uses reasonable safeguards designed to protect your information, but good account hygiene still matters: use strong credentials, protect your Google or GitHub account, and be careful about what workplace material you retain.</p></div></section>
      <PublicFooter />
    </main>
  );
}

export default SecurityPage;
