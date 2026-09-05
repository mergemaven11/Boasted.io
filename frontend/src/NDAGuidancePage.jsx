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

        <section>
          <h2>3. Examples: describe the engineering outcome, not the private implementation</h2>
          <p><strong>Private architecture work — avoid:</strong> “Migrated every router into handlers across all application routes.”</p>
          <p><strong>Safer version:</strong> “Contributed to a cross-cutting backend refactoring initiative that improved consistency, maintainability, and extensibility while preserving existing behavior.”</p>
          <p><strong>Why:</strong> The safer version captures the engineering signal without disclosing the private codebase's internal routing structure or implementation method.</p>

          <p><strong>Private operational tooling — avoid:</strong> “Built a UI that shows the state of the company's large-data ingestion system.”</p>
          <p><strong>Safer version:</strong> “Developed user-facing functionality for an internal engineering tool that improved visibility into long-running operational workflows.”</p>
          <p><strong>Why:</strong> The safer version preserves the accomplishment without exposing internal system names, workflow states, data characteristics, architecture, or operational details.</p>

          <p><strong>Private testing work — avoid:</strong> naming an unreleased feature, internal screen, ticket, repository, or exact implementation detail.</p>
          <p><strong>Safer version:</strong> “Added cross-platform automated coverage for an internal engineering change and surfaced a defect before broader release.”</p>
        </section>

        <section>
          <h2>4. Public evidence creates a useful boundary</h2>
          <p>If the employer or client has already made a merge request, release note, public repository change, conference talk, documentation page, or similar material public, you may be able to reference what that public source actually shows. Do not add extra private context merely because part of the work is public.</p>
          <div className="legal-callout">Treat the public source as the ceiling: describe what it proves, not additional internal details you happen to know.</div>
          <p><strong>Example:</strong> A public merge request showing support for an additional cloud-storage provider can support an accomplishment about adding that integration. It does not automatically authorize disclosure of private customers, architecture, deployment details, usage levels, incidents, or internal performance data.</p>
        </section>

        <section><h2>5. Redact restricted evidence</h2><p>Do not upload screenshots, tickets, logs, source code, documents, messages, contracts, credentials, customer data, or attachments unless you are authorized to store and reuse them outside the original system.</p></section>

        <section>
          <h2>6. Evidence can be a reference</h2>
          <p>When appropriate, record a private reference such as “internal code review,” “manager feedback,” or “project record” without copying restricted content into BragStack.</p>
          <p><strong>Public evidence example:</strong> link to the public merge request and describe only what is visible there.</p>
          <p><strong>Private evidence example:</strong> use “Private internal engineering contribution” with no repository URL, screenshot, ticket text, source code, customer information, or proprietary attachment.</p>
        </section>

        <section>
          <h2>7. Be conservative with metrics</h2>
          <p>If exact metrics are sensitive, use only an approved public figure, an authorized abstraction, or a qualitative outcome that is truthful and permitted. Never invent or alter a result to get around a confidentiality restriction.</p>
          <p><strong>Avoid:</strong> private route counts, customer counts, dataset sizes, transaction volumes, incident totals, processing times, internal error rates, unreleased performance gains, or revenue figures.</p>
          <p><strong>Safer:</strong> “Improved maintainability,” “restored a workflow,” “added cross-platform test coverage,” or another truthful qualitative result when the exact internal measurement is not approved for disclosure.</p>
        </section>

        <section>
          <h2>8. Public, generalized, or private?</h2>
          <p><strong>Usually lower risk:</strong> accomplishments whose wording and evidence are fully supported by information already lawfully public.</p>
          <p><strong>Use caution:</strong> generalized descriptions of private work that communicate your skills without revealing how the employer's systems, products, operations, customers, or internal processes work.</p>
          <p><strong>Keep private:</strong> source code, unpublished architecture, internal tool names, screenshots, tickets, logs, credentials, customer data, proprietary metrics, incident details, unreleased features, or other information your agreement or employer treats as confidential.</p>
        </section>

        <section><h2>9. Keep confidential proof private</h2><p>Do not make an accomplishment or Impact Receipt public unless you are permitted to disclose every detail it contains. Private-by-default controls do not replace your contractual or workplace obligations.</p></section>

        <section><h2>10. Generated outputs inherit source sensitivity</h2><p>A resume bullet, review packet, interview story, or other generated output can still reveal confidential information if the underlying evidence contains it. Review every output before exporting, publishing, or sending it to someone else.</p></section>

        <section><h2>11. When not to store something</h2><p>If an agreement or policy says information may not be stored in third-party systems, do not put that information in BragStack. Use a sanitized description or leave the restricted evidence out entirely.</p></section>

        <section><h2>12. This is not legal advice</h2><p>BragStack does not review or interpret your NDA. If you are unsure what is permitted, consult the agreement, your employer or client policy, an authorized security or legal contact, or qualified counsel. Product questions can be sent to <a href="mailto:Tobias.scott@usebragstack.com">Tobias.scott@usebragstack.com</a>.</p></section>
      </article>
    </main>
  );
}

export default NDAGuidancePage;
