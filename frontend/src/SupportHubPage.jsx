import {
  ArrowLeft,
  BookOpen,
  CreditCard,
  FileWarning,
  HelpCircle,
  LifeBuoy,
  LockKeyhole,
  Mail,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import "./SupportHubPage.css";
import "./SupportHubNavbarFix.css";

const supportCards = [
  {
    icon: BookOpen,
    eyebrow: "Learn Boasted",
    title: "Docs & getting started",
    description: "Learn how accomplishments, Impact Receipts, Proof Profiles, reports, education tools, and career intelligence fit together.",
    href: "/docs",
    action: "Open docs",
  },
  {
    icon: Wrench,
    eyebrow: "Something went wrong",
    title: "Troubleshooting",
    description: "Start with common fixes for sign-in, verification, browser, upload, and product issues before contacting support.",
    href: "/help/troubleshooting.html",
    action: "Troubleshoot an issue",
  },
  {
    icon: FileWarning,
    eyebrow: "Protect confidential work",
    title: "NDA & confidential-work guidance",
    description: "Learn what not to upload and how to capture the career signal without copying protected employer, client, patient, student, customer, or proprietary information.",
    href: "/nda-safety",
    action: "Review NDA guidance",
  },
  {
    icon: LockKeyhole,
    eyebrow: "Privacy & security",
    title: "Security center",
    description: "Review Boasted's private-by-default approach, sensitive-data guidance, security boundaries, and reporting instructions.",
    href: "/security",
    action: "Open security center",
  },
];

const contactCards = [
  { icon: LifeBuoy, title: "Product & account support", email: "support@boasted.io", description: "Sign-in, account access, product behavior, bugs, and general help." },
  { icon: CreditCard, title: "Billing", email: "billing@boasted.io", description: "Existing paid subscriptions, charges, cancellations, and billing records." },
  { icon: ShieldCheck, title: "Security", email: "security@boasted.io", description: "Security concerns or suspected vulnerabilities. Do not email passwords, access tokens, or confidential evidence." },
  { icon: Mail, title: "Privacy", email: "privacy@boasted.io", description: "Privacy questions and requests concerning your Boasted information." },
];

export default function SupportHubPage() {
  const token = localStorage.getItem("bragstack_token");

  return <main className="support-hub-page">
    <header className="support-hub-topbar">
      <div className="support-hub-topbar-inner">
        <a className="support-hub-brand" href="/"><span>Boasted</span><em>Beta</em></a>
        <nav aria-label="Support navigation"><a href="/docs">Docs</a><a href="/security">Security</a><a href="/nda-safety">NDA guidance</a>{token ? <a className="support-account-link" href="/app">My workspace</a> : <a className="support-account-link" href="/login">Sign in</a>}</nav>
      </div>
    </header>

    <section className="support-hub-hero">
      <a className="support-back" href={token ? "/app" : "/"}><ArrowLeft size={16} /> {token ? "Back to workspace" : "Back to Boasted"}</a>
      <div className="support-hero-icon"><LifeBuoy size={30} /></div>
      <p className="support-kicker">BOASTED SUPPORT HUB</p>
      <h1>Help when you need it.<br/><span>Clear answers when you don&apos;t.</span></h1>
      <p className="support-hero-copy">Find product guidance, troubleshoot an issue, protect confidential work, understand beta access, or reach the right Boasted support channel.</p>
      <div className="support-hero-actions"><a className="support-primary" href="mailto:support@boasted.io?subject=Boasted%20Support">Contact support <Mail size={17} /></a><a className="support-secondary" href="/docs"><BookOpen size={17} /> Browse docs</a></div>
    </section>

    <section className="support-section" aria-labelledby="support-start-title">
      <div className="support-section-heading"><p>START HERE</p><h2 id="support-start-title">What can we help with?</h2></div>
      <div className="support-card-grid">{supportCards.map(({ icon: Icon, ...card }) => <a className="support-card" href={card.href} key={card.title}><div className="support-card-icon"><Icon size={22}/></div><p>{card.eyebrow}</p><h3>{card.title}</h3><span>{card.description}</span><strong>{card.action} →</strong></a>)}</div>
    </section>

    <section className="support-beta-panel" id="beta-access">
      <div className="support-beta-icon"><Sparkles size={25}/></div>
      <div><p className="support-kicker">BETA ACCESS</p><h2>Everyone gets complimentary Pro access for now.</h2><p>During this beta, eligible accounts receive Pro features without completing a new paid checkout. Complimentary access does not create a paid subscription and does not authorize future recurring charges. If paid Pro is offered again later, pricing and billing terms will be shown and a separate checkout and consent will be required before a new charge.</p><small>Existing paid subscriptions are separate from the complimentary beta grant and keep their own billing and cancellation controls.</small></div>
    </section>

    <section className="support-section" aria-labelledby="support-faq-title">
      <div className="support-section-heading"><p>QUICK ANSWERS</p><h2 id="support-faq-title">Common beta questions</h2></div>
      <div className="support-faq-list">
        <details><summary><HelpCircle size={18}/> Why does my account say Pro?</summary><p>Boasted is temporarily granting eligible beta accounts complimentary Pro feature access. That feature access is not evidence that you have a paid subscription.</p></details>
        <details><summary><CreditCard size={18}/> Will complimentary Pro charge me later?</summary><p>No new recurring charge is authorized by receiving complimentary beta access. A future paid offer would require a separate checkout and billing consent. If you already had a paid subscription, manage that existing subscription from Plan & billing.</p></details>
        <details><summary><FileWarning size={18}/> Can I put confidential workplace material into Boasted?</summary><p>Only upload or describe information you are authorized to use. Never assume Boasted overrides an NDA, employer policy, professional duty, privacy rule, client restriction, or law. Review the NDA & confidential-work guide before using sensitive work material.</p></details>
        <details><summary><MessageCircleQuestion size={18}/> What should I send when reporting a bug?</summary><p>Tell us what you were trying to do, what happened, the page or feature involved, and your browser/device when useful. Do not send passwords, authentication tokens, confidential work evidence, patient/student/client records, or other protected information in a support email.</p></details>
        <details><summary><HelpCircle size={18}/> How do I add Calendly to my public profile?</summary><p>Open Settings → Integrations, paste your public Calendly scheduling URL, turn on “Show on my public Proof Profile,” then save. Use the live preview to confirm visitors can choose a time before sharing your profile.</p></details>
        <details><summary><HelpCircle size={18}/> How do I connect Google Calendar?</summary><p>Open Settings → Integrations and choose Connect Google Calendar. Complete Google’s authorization screen, return to Boasted, and confirm the connection shows as active. Calendar details stay private unless a feature explicitly asks you to share something.</p></details>
        <details><summary><HelpCircle size={18}/> How do I connect Outlook Calendar?</summary><p>Open Settings → Integrations and choose Connect Microsoft Outlook. Complete Microsoft’s authorization screen, return to Boasted, and confirm the connection shows as active. Disconnect the calendar from the same page whenever you want.</p></details>
      </div>
    </section>

    <section className="support-section" aria-labelledby="support-contact-title">
      <div className="support-section-heading"><p>CONTACT</p><h2 id="support-contact-title">Reach the right inbox.</h2><span>Use the most specific address when you can so your question lands in the right place.</span></div>
      <div className="support-contact-grid">{contactCards.map(({ icon: Icon, ...contact }) => <a href={`mailto:${contact.email}?subject=Boasted%20${encodeURIComponent(contact.title)}`} key={contact.email}><Icon size={20}/><div><h3>{contact.title}</h3><strong>{contact.email}</strong><p>{contact.description}</p></div></a>)}</div>
    </section>

    <footer className="support-hub-footer"><a className="support-hub-brand" href="/"><span>Boasted</span><em>Beta</em></a><div><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/security">Security</a><a href="/nda-safety">NDA guidance</a></div><small>Support guidance is operational information, not legal advice.</small></footer>
  </main>;
}
