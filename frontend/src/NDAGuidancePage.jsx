import "./LegalPages.css";

function NDAGuidancePage() {
  return (
    <main className="legal-page">
      <header className="legal-header"><a className="legal-brand" href="/">BragStack</a><nav aria-label="NDA guidance navigation"><a href="/docs">Docs</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Sign in</a></nav></header>
      <article className="legal-card">
        <p className="legal-eyebrow">BragStack Safety Guidance</p>
        <h1>Using BragStack with NDAs and confidential work</h1>
        <p className="legal-intro">BragStack can help you document career impact without turning confidential employer or client information into public content. Your NDA, confidentiality agreement, employer policy, client agreement, security rule, or legal obligation always comes first.</p>
        <div className="legal-callout">Capture the career signal, not the secret. When work is confidential, generalize context, keep sensitive proof private, and do not upload material you are not authorized to store outside its original system.</div>
        <section><h2>1. Your NDA still applies</h2><p>BragStack does not override any confidentiality agreement, employment policy, client contract, security obligation, or law. You are responsible for understanding what you may store and share.</p></section>
        <section><h2>2. Generalize sensitive context</h2><p>Prefer descriptions such as “enterprise customer,” “internal platform,” or “regulated workload” instead of confidential names, code names, internal URLs, repository names, architecture details, customer identifiers, unreleased product information, or private incident details.</p></section>
        <section><h2>3. Redact restricted evidence</h2><p>Do not upload screenshots, tickets, logs, source code, documents, messages, contracts, credentials, customer data, or attachments unless you are authorized to store and reuse them outside the original system.</p></section>
        <section><h2>4. Evidence can be a reference</h2><p>When appropriate, record a private reference such as “internal ticket,” “manager feedback,” or “project dashboard” without copying restricted content into BragStack.</p></section>
        <section><h2>5. Use approved abstractions for metrics</h2><p>If exact metrics are sensitive, use an approved range, percentage, relative improvement, or qualitative outcome only when truthful and permitted. Never invent or alter a result to get around a confidentiality restriction.</p></section>
        <section><h2>6. Keep confidential proof private</h2><p>Do not make an accomplishment or Impact Receipt public unless you are permitted to disclose every detail it contains. Private-by-default controls do not replace your contractual or workplace obligations.</p></section>
        <section><h2>7. Generated outputs inherit source sensitivity</h2><p>A resume bullet, review packet, interview story, or other generated output can still reveal confidential information if the underlying evidence contains it. Review every output before exporting, publishing, or sending it to someone else.</p></section>
        <section><h2>8. When not to store something</h2><p>If an agreement or policy says information may not be stored in third-party systems, do not put that information in BragStack. Use a sanitized description or leave the restricted evidence out entirely.</p></section>
        <section><h2>9. This is not legal advice</h2><p>BragStack does not review or interpret your NDA. If you are unsure what is permitted, consult the agreement, your employer or client policy, an authorized security or legal contact, or qualified counsel. Product questions can be sent to <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>.</p></section>
      </article>
    </main>
  );
}

export default NDAGuidancePage;
