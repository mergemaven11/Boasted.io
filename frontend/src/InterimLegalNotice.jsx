import "./LegalPages.css";

const EFFECTIVE = "September 5, 2026";

function NoticeShell({ eyebrow, title, children }) {
  return (
    <section className="legal-page" aria-label={title}>
      <article className="legal-card">
        <p className="legal-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="legal-updated">Effective: {EFFECTIVE}</p>
        {children}
      </article>
    </section>
  );
}

export function InterimTermsNotice() {
  return (
    <NoticeShell eyebrow="BragStack Interim Use Notice" title="Important conditions for using BragStack during early operation">
      <p className="legal-intro">
        This interim notice supplements and is incorporated into the BragStack Terms and Conditions below until it is replaced by a later published version. It is intended to make current-use boundaries clear while the product is still evolving. Nothing here limits rights or remedies that cannot legally be waived.
      </p>

      <section>
        <h3>Account eligibility</h3>
        <p>Use BragStack only if you are legally permitted to use the Service under the full Terms and applicable law. Creating an account requires affirmative acceptance of the current Terms and acknowledgment of the current Privacy Policy.</p>
      </section>

      <section>
        <h3>Career and education assistance, not professional or guaranteed advice</h3>
        <p>BragStack provides career and education organization, drafting, coaching, evidence-management, resume, interview-practice, reporting, and related software tools. It is not a law firm, employer, recruiter, background-check provider, financial adviser, medical provider, admissions office, school, or human-resources decision maker. Outputs are not legal, financial, medical, employment, admissions, or other professional advice, and BragStack does not guarantee jobs, interviews, promotions, compensation, hiring decisions, admissions, scholarships, or other outcomes.</p>
        <p>You are responsible for reviewing and verifying generated or suggested content before using it. Do not present AI-generated text, metrics, dates, credentials, employment facts, academic facts, or verification statements as true unless you have confirmed that they are accurate.</p>
      </section>

      <section>
        <h3>Your content, permissions, and confidentiality remain your responsibility</h3>
        <p>Only upload, store, reference, or publish information you have the right to use. BragStack does not override an NDA, confidentiality clause, employer or school policy, client agreement, security rule, export-control obligation, intellectual-property right, student-record restriction, or other legal duty. Do not upload passwords, API keys, access tokens, trade secrets, restricted source code, customer data, protected student records, regulated information, or confidential employer/client materials you are not authorized to retain.</p>
        <p>If a generalized description or approved reference is enough to document an accomplishment, use that instead of copying sensitive source material. Anything you intentionally make public may be copied, retained, or redistributed by other people.</p>
      </section>

      <section>
        <h3>Early-stage service and availability</h3>
        <p>BragStack is an evolving software service. Features, limits, integrations, labels, workflows, and availability may change as the product develops. Maintenance, vendor failures, outages, security work, or technical issues may temporarily interrupt access. Do not rely on BragStack as the sole repository for legally required, irreplaceable, safety-critical, or mission-critical records; keep your own copies of important material.</p>
      </section>

      <section>
        <h3>Public sharing and third-party verification</h3>
        <p>Private workspace material is intended to remain private unless a feature clearly supports sharing and you intentionally publish or share it. Before making a Proof Profile, Impact Receipt, or other item public, review it for confidential, personal, restricted, or protected information. A verification response means only what the verifier actually confirmed; it is not an audit, certification, background check, school endorsement, employer endorsement, or guarantee unless that is expressly and truthfully stated.</p>
      </section>

      <section>
        <h3>Prohibited misuse</h3>
        <p>Do not use BragStack to fabricate accomplishments, academic records, or credentials, impersonate another person, harass or spam others, violate law or another person’s rights, bypass access controls, attempt unauthorized access, distribute malware, interfere with service availability, scrape the Service through unauthorized means, misuse verifier contact information, or evade subscription or usage limits.</p>
      </section>

      <section>
        <h3>Temporary complimentary Pro access</h3>
        <p>During early access, BragStack may temporarily grant Pro features to eligible accounts at no charge as a promotional gift. Complimentary Pro access is not a paid subscription, does not require a payment method, does not authorize recurring charges, and does not by itself create any obligation to purchase Pro later.</p>
        <p>This promotional access may be modified or ended in the future. If BragStack later offers paid Pro access, the applicable price, billing interval, renewal behavior, and cancellation terms will be presented separately, and BragStack will require a separate purchase flow and billing consent before charging an account that only received complimentary access.</p>
        <p>Existing paid subscriptions are separate from complimentary promotional access and remain governed by the billing and cancellation terms that apply to those subscriptions unless BragStack expressly changes them in accordance with applicable law.</p>
      </section>

      <section>
        <h3>Billing and subscriptions</h3>
        <p>When a paid plan is offered, the price, billing interval, renewal behavior, material limits, and cancellation terms presented at checkout control the purchase. A recurring subscription continues until canceled as disclosed at purchase. Cancellation stops future renewal subject to the terms shown at purchase and applicable law; cancellation does not automatically create a refund for time already paid unless BragStack states otherwise or law requires one.</p>
      </section>

      <section>
        <h3>Existing protections in the full Terms still apply</h3>
        <p>The full Terms below contain additional provisions concerning account responsibility, acceptable use, intellectual property, third-party services, suspension and termination, service availability, backups, disclaimers, limitation of liability, indemnification, governing law, and other legal terms. This notice adds current operating boundaries; it does not replace those provisions.</p>
      </section>
    </NoticeShell>
  );
}

export function InterimPrivacyNotice() {
  return (
    <NoticeShell eyebrow="BragStack Interim Privacy Notice" title="How to use BragStack safely while the service evolves">
      <p className="legal-intro">
        This notice supplements the Privacy Policy below and highlights the privacy rules most important to current use. The full Privacy Policy remains controlling. BragStack will update its disclosures when product behavior, providers, or legal requirements materially change.
      </p>

      <section>
        <h3>Private by default does not mean risk-free</h3>
        <p>BragStack is designed so private career and education evidence stays in your private workspace unless you intentionally share it. No online service can promise absolute security, however. Use strong credentials, protect your sign-in accounts, and avoid storing information that does not need to be in BragStack.</p>
      </section>

      <section>
        <h3>Minimize workplace, education, and third-party data</h3>
        <p>Do not upload confidential employer or client documents, protected student records, trade secrets, restricted source code, customer information, passwords, access tokens, school-system credentials, or other data you are not authorized to retain. When you provide another person’s contact information for an Impact Receipt verification request, use only the information reasonably necessary for that request and do not use the feature for marketing, spam, harassment, retaliation, or unrelated contact.</p>
      </section>

      <section>
        <h3>AI-assisted features may use service providers</h3>
        <p>When you choose an AI-assisted feature, the information necessary to perform that request may be processed by technology providers used to deliver the feature. AI output can be incomplete or wrong. Review it before using or sharing it, and do not add sensitive information that is unnecessary for the task.</p>
      </section>

      <section>
        <h3>Public links can leave your control</h3>
        <p>If you intentionally publish a Proof Profile, Impact Receipt, or shareable link, other people may view, copy, download, retain, or redistribute the information. Removing a link later cannot guarantee deletion of copies already made by others.</p>
      </section>

      <section>
        <h3>Account eligibility and consent records</h3>
        <p>Use BragStack only if you are legally permitted to use the Service under the full Terms and applicable law. When a new account accepts the required Terms and Privacy Policy, BragStack records the current document versions and server-side acceptance time as part of the account record.</p>
      </section>

      <section>
        <h3>Requests and questions</h3>
        <p>Depending on where you live, applicable law may provide privacy rights in addition to the choices BragStack voluntarily offers. Requests concerning access, correction, export, deletion, or privacy can be sent to <a href="mailto:privacy@usebragstack.com?subject=BragStack%20privacy%20request">privacy@usebragstack.com</a>. Security concerns can be sent to <a href="mailto:security@usebragstack.com?subject=BragStack%20security%20report">security@usebragstack.com</a>.</p>
      </section>
    </NoticeShell>
  );
}
