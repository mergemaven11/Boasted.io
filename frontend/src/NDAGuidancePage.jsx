import "./LegalPages.css";

function NDAGuidancePage() {
  return (
    <main className="legal-page">
      <header className="legal-header"><a className="legal-brand" href="/">Boasted</a><nav aria-label="NDA guidance navigation"><a href="/docs">Docs</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Sign in</a></nav></header>
      <article className="legal-card">
        <p className="legal-eyebrow">Boasted Safety Guidance</p>
        <h1>Using Boasted with NDAs and confidential work</h1>
        <p className="legal-intro">Boasted can help people in any profession document career impact without turning confidential employer, client, patient, student, customer, constituent, or third-party information into public content. Your NDA, confidentiality agreement, professional duty, employer policy, client agreement, security rule, privacy obligation, or legal requirement always comes first.</p>
        <div className="legal-callout">Capture the career signal, not the secret. When work is confidential, generalize context, keep sensitive proof private, and do not upload material you are not authorized to store outside its original system.</div>

        <section><h2>1. Your NDA still applies</h2><p>Boasted does not override any confidentiality agreement, employment policy, client contract, professional duty, privacy rule, security obligation, or law. You are responsible for understanding what you may store, reference, reuse, and share.</p></section>

        <section><h2>2. Generalize sensitive context</h2><p>Prefer descriptions such as “enterprise customer,” “customer,” “client,” “patient-care workflow,” “student-support process,” “internal platform,” “internal operation,” “field-service assignment,” “regulated workload,” or “confidential project” instead of restricted names, case identifiers, addresses, account details, code names, internal URLs, repository names, unreleased products, private incidents, proprietary methods, architecture details, or other identifying information.</p></section>

        <section>
          <h2>3. Examples across different kinds of work</h2>
          <p>The goal is the same in every profession: preserve what your work demonstrates without copying restricted information into Boasted.</p>

          <h3>Healthcare and care work</h3>
          <p><strong>Avoid:</strong> patient names, dates of birth, medical-record numbers, diagnoses, treatment details, photos, or other protected health information unless you are specifically authorized to use it.</p>
          <p><strong>Safer version:</strong> “Helped improve consistency in a patient-care handoff process, reducing avoidable follow-up work while following required privacy and safety procedures.”</p>

          <h3>Education</h3>
          <p><strong>Avoid:</strong> student names, grades tied to identifiable students, disability or accommodation information, disciplinary records, family details, or private school-system records.</p>
          <p><strong>Safer version:</strong> “Adapted instruction and family communication to improve participation and engagement across a group of learners.”</p>

          <h3>Retail, hospitality, and customer service</h3>
          <p><strong>Avoid:</strong> customer names, payment details, loyalty-account information, private complaints, security footage, employee records, or internal loss-prevention details.</p>
          <p><strong>Safer version:</strong> “Resolved a recurring service issue, coordinated the right internal support, and helped preserve the customer relationship.”</p>

          <h3>Sales and account management</h3>
          <p><strong>Avoid:</strong> confidential client names, contract terms, nonpublic pricing, pipeline details, margin data, renewal negotiations, or private revenue figures.</p>
          <p><strong>Safer version:</strong> “Managed a complex account conversation, aligned stakeholders around the customer's needs, and contributed to a successful retention outcome.”</p>

          <h3>Skilled trades, maintenance, and field service</h3>
          <p><strong>Avoid:</strong> customer addresses, access codes, alarm details, facility vulnerabilities, private work-order notes, proprietary schematics, or security-sensitive site information.</p>
          <p><strong>Safer version:</strong> “Diagnosed a difficult field issue, completed a safe repair, and restored normal operation while meeting required procedures.”</p>

          <h3>Finance, legal, government, and nonprofit work</h3>
          <p><strong>Avoid:</strong> account numbers, tax information, case details, legal strategy, constituent information, donor records, benefits information, investigative material, or nonpublic government records.</p>
          <p><strong>Safer version:</strong> “Improved a high-volume review process so time-sensitive requests were handled more consistently and accurately.”</p>

          <h3>Creative, media, and marketing work</h3>
          <p><strong>Avoid:</strong> unreleased campaigns, client strategy, embargoed assets, unlicensed source material, private audience data, unpublished drafts, or confidential brand plans.</p>
          <p><strong>Safer version:</strong> “Developed and refined creative work for a confidential campaign, incorporating stakeholder feedback and improving delivery readiness.”</p>

          <h3>Technology and engineering</h3>
          <p><strong>Private architecture work — avoid:</strong> naming private source code, repository names, credentials, internal URLs, unreleased architecture, private incidents, customer identifiers, or exact implementation details.</p>
          <p><strong>Safer version:</strong> “Contributed to a cross-cutting system improvement that increased maintainability and reliability while preserving existing behavior.”</p>
          <p><strong>Why:</strong> The safer version captures the engineering signal without exposing the private codebase or implementation method.</p>
        </section>

        <section>
          <h2>4. Public evidence creates a useful boundary</h2>
          <p>If an employer, client, school, agency, organization, publication, licensing body, portfolio site, public repository, press release, public report, conference presentation, award listing, or other authorized source has already made information public, you may be able to reference what that public source actually shows. Do not add extra private context merely because part of the work is public.</p>
          <div className="legal-callout">Treat the public source as the ceiling: describe what it proves, not additional confidential details you happen to know.</div>
          <p>A public award can support that the award was received; a public campaign can support your credited role; a public project page can support the published result; a public repository change can support the contribution visible there. None of those automatically authorize disclosure of private customers, patients, students, internal processes, financials, incidents, deployment details, architecture, usage levels, or unpublished work.</p>
        </section>

        <section><h2>5. Redact restricted evidence</h2><p>Do not upload screenshots, tickets, logs, source code, records, case files, charts, student work, medical information, documents, messages, contracts, credentials, customer data, client files, employee records, or attachments unless you are authorized to store and reuse them outside the original system.</p></section>

        <section>
          <h2>6. Evidence can be a reference instead of a copy</h2>
          <p>When appropriate, record a private reference without copying restricted content into Boasted.</p>
          <p><strong>Possible references:</strong> “manager feedback,” “supervisor recognition,” “approved work order,” “internal project record,” “training completion,” “public portfolio item,” “customer commendation on file,” “school-approved summary,” “internal case record,” or “private code review.”</p>
          <p><strong>Public evidence:</strong> link only to material you are permitted to reuse and describe only what the source actually shows.</p>
          <p><strong>Private evidence:</strong> use a generalized reference such as “Private internal contribution” without copying restricted names, identifiers, screenshots, records, ticket text, source code, proprietary attachments, or sensitive content.</p>
        </section>

        <section>
          <h2>7. Be conservative with metrics</h2>
          <p>If exact metrics are sensitive, use only an approved public figure, an authorized abstraction, or a truthful qualitative outcome. Never invent or alter a result to get around a confidentiality restriction.</p>
          <p><strong>Avoid when private:</strong> patient counts, student-level results, customer counts, dataset sizes, revenue, margins, donor amounts, caseload details, incident totals, transaction volumes, internal error rates, processing times, productivity targets, unreleased performance gains, property addresses, or system-specific technical measurements.</p>
          <p><strong>Safer:</strong> “improved consistency,” “reduced avoidable rework,” “restored service,” “increased participation,” “strengthened customer retention,” “improved maintainability,” “expanded coverage,” or another truthful qualitative result when the exact internal measurement is not approved for disclosure.</p>
        </section>

        <section>
          <h2>8. Public, generalized, or private?</h2>
          <p><strong>Usually lower risk:</strong> accomplishments whose wording and evidence are fully supported by information already lawfully public or specifically approved for reuse.</p>
          <p><strong>Use caution:</strong> generalized descriptions of private work that communicate your skills without revealing how an employer, client, school, healthcare organization, agency, customer, facility, product, system, or internal process operates.</p>
          <p><strong>Keep private:</strong> protected health or student information, account records, confidential client or constituent data, personnel information, private customer details, source code, unpublished designs or architecture, internal tool names, screenshots, tickets, logs, credentials, proprietary metrics, incident details, unreleased products, trade secrets, or other information your agreement, profession, employer, or law treats as confidential.</p>
        </section>

        <section>
          <h2>9. Boasted's NDA & confidential-work safety controls</h2>
          <p>Boasted places a confidentiality check in front of protected Accomplishment and Impact Receipt writes and public-sharing actions. The user must review the warning and explicitly confirm that the information they are about to submit or publish does not contain material they are prohibited from storing or disclosing.</p>
          <p>The check is intentionally conservative. It is a product safety control, not permission from an employer, client, contract, or lawyer.</p>
        </section>

        <section>
          <h2>10. The local safety scan</h2>
          <p>Before a protected submission continues, Boasted scans draft text in the browser for obvious high-risk patterns. The scan is designed to flag potential credentials or secrets and to call attention to patterns that can indicate code blocks, logs or diagnostics, internal hosts, ticket-style identifiers, and other internal references.</p>
          <p><strong>Blocking examples:</strong> private-key material, bearer tokens, password or API-key assignments, provider access tokens, and signed access-token patterns. When a blocking credential pattern is detected, the protected action cannot continue until the material is removed.</p>
          <p><strong>Review examples:</strong> code-like blocks, stack traces, internal URLs or hosts, ticket-style identifiers, production logs, customer data references, and similar content. A warning does not mean the content is definitely confidential; it means the user should review and generalize it unless disclosure is authorized.</p>
          <div className="legal-callout">The local pattern scan is not a legal review, data-classification system, or guarantee. It can produce false positives and false negatives. “No obvious pattern detected” does not mean an NDA permits the content.</div>
        </section>

        <section>
          <h2>11. Confirmation is enforced again at the API</h2>
          <p>After the user confirms the gate, Boasted creates a short-lived, one-time confidentiality attestation for that protected action. The protected write carries that attestation to the API, and the API rejects protected writes that are missing, expired, already used, or bound to a different action.</p>
          <p>The attestation proves only that Boasted's safety checkpoint was completed. It does not prove that the underlying disclosure is legally permitted.</p>
        </section>

        <section>
          <h2>12. Minimal safety receipts, not copies of your draft</h2>
          <p>Boasted keeps minimal control metadata for confidentiality attestations so the safety mechanism can be audited. The audit record is designed around fields such as the protected action, safety-control version, status, timestamps, and request identifier.</p>
          <p>The confidentiality audit receipt does not intentionally store the career draft or the plaintext one-time token. Operational access to these receipts is restricted to authorized internal roles.</p>
        </section>

        <section>
          <h2>13. “Make this NDA-safe” is a sanitization helper, not a legal verdict</h2>
          <p>The NDA-safe helper is designed to reduce obvious disclosure risk by removing or generalizing common risky details. Depending on the record, it may remove detected credentials, code blocks, diagnostic output, URLs, internal ticket-style identifiers, exact metric values, and public-sharing settings.</p>
          <p>For evidence references, a reference should only be preserved when the user has explicitly identified it as an already-public source and it does not look like an internal host. The public-source ceiling still applies: keeping a public link does not authorize adding private context that is not present in that source.</p>
          <p><strong>Always review the rewritten result.</strong> Automated sanitization cannot know every confidential project name, architecture detail, customer fact, unpublished metric, trade secret, professional restriction, or contractual obligation.</p>
        </section>

        <section>
          <h2>14. Private by default, with another check before disclosure</h2>
          <p>Career evidence should remain private unless the user deliberately chooses to share it. Boasted's safety flow is designed to run another check before disclosure instead of treating a prior private save as permanent permission to publish later.</p>
          <p>Making something private is useful risk reduction, but privacy settings do not make unauthorized third-party storage permissible. If the governing agreement, professional rule, workplace policy, school policy, healthcare policy, client requirement, agency rule, or law prohibits storing the material outside the original system, do not put the restricted material in Boasted.</p>
        </section>

        <section>
          <h2>15. A safer workflow for confidential accomplishments</h2>
          <p><strong>Step 1:</strong> Start with the career outcome you are allowed to claim: what type of problem you addressed, what skill you demonstrated, and what changed.</p>
          <p><strong>Step 2:</strong> Remove names, internal URLs, code names, source code, ticket text, logs, patient or student identifiers, customer identifiers, unreleased details, credentials, and unapproved exact metrics.</p>
          <p><strong>Step 3:</strong> Use the local safety scan and any NDA-safe sanitization helper as an additional check, then personally review the result.</p>
          <p><strong>Step 4:</strong> Keep the record private unless every public detail is authorized. If you use public evidence, describe only what the public source itself proves.</p>
          <p><strong>Step 5:</strong> If the agreement or policy is unclear, stop before submitting and check the governing agreement or an authorized privacy, security, legal, compliance, or professional contact.</p>
        </section>

        <section><h2>16. Generated outputs inherit source sensitivity</h2><p>A resume bullet, review packet, interview story, portfolio statement, certification packet, client-facing summary, or other generated output can still reveal confidential information if the underlying evidence contains it. Review every output before exporting, publishing, or sending it to someone else.</p></section>

        <section>
          <h2>17. What the safety helper cannot decide</h2>
          <p>Boasted cannot determine whether a particular employer considers a project name confidential, whether a metric was approved for disclosure, whether a public source contains everything you are allowed to discuss, whether a professional privacy duty applies, whether an invention-assignment clause applies, or whether a specific disclosure is permitted under a contract or law.</p>
          <p>Do not rely on the scanner, sanitizer, private setting, API attestation, audit receipt, or a successful submission as evidence that disclosure is authorized.</p>
        </section>

        <section><h2>18. When not to store something</h2><p>If an agreement, professional rule, employer policy, school policy, healthcare policy, client requirement, agency rule, or law says information may not be stored in third-party systems, do not put that information in Boasted. Use a sanitized description or leave the restricted evidence out entirely.</p></section>

        <section><h2>19. This is not legal advice</h2><p>Boasted does not review or interpret your NDA, employment agreement, professional obligations, privacy duties, or other restrictions and does not certify that a draft is “NDA compliant.” If you are unsure what is permitted, consult the governing agreement or policy, an authorized privacy/security/legal/compliance contact, your professional guidance where applicable, or qualified counsel. Product questions can be sent to <a href="mailto:Tobias.scott@boasted.io">Tobias.scott@boasted.io</a>.</p></section>
      </article>
    </main>
  );
}

export default NDAGuidancePage;
