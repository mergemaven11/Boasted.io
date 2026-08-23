import { LockKeyhole, ShieldCheck, FileText, EyeOff } from "lucide-react";

function NDAGuidancePage() {
  return (
    <main className="landing-page" style={{ minHeight: "100vh", paddingBottom: 56 }}>
      <header className="landing-nav">
        <a className="landing-logo" href="/">BragStack</a>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/docs">Docs</a>
          <a className="landing-btn landing-btn-small" href="/register">Start free</a>
        </div>
      </header>

      <section className="landing-hero" style={{ minHeight: "auto", paddingBottom: 36 }}>
        <div className="landing-hero-copy" style={{ maxWidth: 880 }}>
          <div className="landing-eyebrow"><LockKeyhole size={16} />NDA-safe career proof</div>
          <h1>Use BragStack without turning confidential work into public content.</h1>
          <p className="landing-hero-description">
            BragStack is designed for career evidence, but an NDA, confidentiality agreement, employer policy, client agreement, security rule, or legal obligation always comes first. BragStack does not override those obligations and cannot determine what your specific agreement allows.
          </p>
        </div>
      </section>

      <section className="landing-problem-section" style={{ paddingTop: 16 }}>
        <div className="landing-section-heading">
          <p>SAFE PRACTICES</p>
          <h2>Capture the impact without exposing protected information.</h2>
          <span>When work is confidential, preserve the career signal while removing the details that could identify a client, system, product, incident, roadmap, dataset, customer, or internal process.</span>
        </div>

        <div className="problem-card-grid">
          <article className="problem-card">
            <ShieldCheck size={22} />
            <h3>Generalize sensitive context</h3>
            <p>Use descriptions such as “enterprise customer,” “internal platform,” or “regulated workload” instead of confidential names, code names, URLs, repository names, architecture details, or customer identifiers.</p>
          </article>
          <article className="problem-card">
            <FileText size={22} />
            <h3>Redact restricted evidence</h3>
            <p>Do not upload screenshots, tickets, logs, source code, documents, messages, contracts, credentials, customer data, or attachments unless you are authorized to store and reuse them outside the original system.</p>
          </article>
          <article className="problem-card">
            <EyeOff size={22} />
            <h3>Keep confidential proof private</h3>
            <p>Do not make an accomplishment or Impact Receipt public unless the underlying information is approved for external disclosure. Private-by-default controls are not a substitute for following your NDA or employer policy.</p>
          </article>
        </div>
      </section>

      <section className="landing-feature-section">
        <div className="landing-feature-copy" style={{ maxWidth: 920 }}>
          <p className="landing-mini-label">WHAT TO WRITE INSTEAD</p>
          <h2>Focus on your contribution, transferable skill, and outcome.</h2>
          <p>For example, instead of naming a confidential client or internal system, record: “Improved deployment reliability for a high-volume production service by standardizing container diagnostics and reducing repeat escalations.” If an exact metric is confidential, use an approved range, relative improvement, or qualitative result only when your agreement permits it.</p>
          <p>When in doubt, leave the sensitive detail out. You can still capture leadership, troubleshooting, ownership, collaboration, scale, complexity, and the type of impact without revealing protected information.</p>
        </div>
      </section>

      <section className="landing-feature-section">
        <div className="landing-feature-copy" style={{ maxWidth: 920 }}>
          <p className="landing-mini-label">YOUR RESPONSIBILITY</p>
          <h2>You decide what you are permitted to record and share.</h2>
          <p>BragStack does not review your NDA, verify disclosure permissions, or provide legal advice. If you are unsure whether information can be stored, exported, placed on a résumé, shown in a portfolio, or shared publicly, consult the agreement, your employer or client policy, an authorized manager or security/legal contact, or qualified legal counsel.</p>
          <p>For questions about BragStack itself, contact Tobias.scott@usebragstack.com.</p>
        </div>
      </section>
    </main>
  );
}

export default NDAGuidancePage;
