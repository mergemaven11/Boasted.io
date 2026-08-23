import "./LegalPages.css";

const UPDATED = "August 23, 2026";

export function PublicFooter() {
  return (
    <footer className="legal-site-footer">
      <div className="legal-site-footer-grid">
        <div className="legal-site-footer-brand"><a href="/">BragStack</a><p>Turn everyday work into career proof you can use when it matters.</p></div>
        <div><h3>Product</h3><a href="/#product-impact-receipts">Impact Receipts</a><a href="/#product-career-analytics">Career Analytics</a><a href="/#product-reports">Reports</a><a href="/#pricing">Pricing</a></div>
        <div><h3>Resources</h3><a href="/docs">Docs</a><a href="/nda-safety">NDA & confidential work</a><a href="/#how-it-works">How it works</a><a href="/#security">Security</a></div>
        <div><h3>Company</h3><a href="mailto:Tobias.scott@usebragstack.com">Contact</a><a href="/login">Sign in</a><a href="/register">Create account</a></div>
        <div><h3>Legal</h3><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a><a href="/nda-safety">Confidentiality guidance</a></div>
      </div>
      <div className="legal-site-footer-bottom"><span>© 2026 BragStack</span><span>Private by default · Your proof stays yours.</span></div>
    </footer>
  );
}

function LegalLayout({ title, intro, children }) {
  return (
    <main className="legal-page">
      <header className="legal-header"><a className="legal-brand" href="/">BragStack</a><nav aria-label="Legal navigation"><a href="/docs">Docs</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/nda-safety">NDA guidance</a><a href="/login">Sign in</a></nav></header>
      <article className="legal-card">
        <p className="legal-eyebrow">BragStack Legal</p><h1>{title}</h1><p className="legal-updated">Last updated: {UPDATED}</p><p className="legal-intro">{intro}</p>
        <div className="legal-callout">BragStack is built to help you document your work while keeping private career evidence private unless you choose to share it.</div>
        {children}
      </article>
      <PublicFooter />
    </main>
  );
}

export function PrivacyPolicyPage() {
  return <LegalLayout title="Privacy Policy" intro="This policy explains what BragStack collects, why we use it, how information may be shared, and the choices you have when using the Service.">
    <section><h2>1. Information we collect</h2><p>We collect information you provide, including account details, profile information, accomplishments, Impact Receipts, skills, measurable outcomes, notes, job targets, and evidence you upload or reference. We may also collect technical and usage information such as IP address, device and browser information, timestamps, diagnostics, pages used, and essential cookie or local-storage data.</p></section>
    <section><h2>2. Career evidence and private content</h2><p>Your private workspace content is private by default. Content becomes public only when a feature supports sharing and you intentionally make it public. You are responsible for ensuring you are permitted to upload or share workplace, client, or third-party information.</p></section>
    <section><h2>3. How we use information</h2><p>We use information to provide and secure BragStack, authenticate accounts, organize career evidence, generate requested career materials, operate sharing controls, process subscriptions, provide support, troubleshoot problems, improve the Service, prevent abuse, communicate important updates, and comply with law.</p></section>
    <section><h2>4. AI-assisted features</h2><p>Relevant content may be processed by technology providers when you use AI-assisted features. BragStack is designed to ground career outputs in your recorded evidence rather than inventing accomplishments. Generated content may still contain errors, so review it before using or sharing it.</p></section>
    <section><h2>5. Sharing and service providers</h2><p>We do not sell your personal information. We may share information with providers that help us host, secure, analyze, communicate, process payments, or operate the Service; when you direct us to share content; in connection with a business transaction; or where reasonably necessary to comply with law or protect rights and security.</p></section>
    <section><h2>6. Payments</h2><p>Payments may be processed by a third-party payment processor. BragStack may receive subscription status, billing identifiers, and limited transaction metadata, but does not need to store full payment-card numbers.</p></section>
    <section><h2>7. Cookies and analytics</h2><p>We may use essential cookies or local storage for authentication, security, preferences, and core functionality, and analytics technologies to understand product usage. Where required, non-essential technologies will be subject to appropriate consent or controls.</p></section>
    <section><h2>8. Retention and security</h2><p>We retain information as reasonably necessary to provide the Service, maintain security and business records, resolve disputes, enforce agreements, and satisfy legal obligations. We use reasonable safeguards, but no online service can guarantee absolute security.</p></section>
    <section><h2>9. Your rights and choices</h2><p>Depending on where you live, you may have rights to access, correct, delete, export, restrict, or object to certain processing of personal information, or withdraw consent where applicable. We may need to verify your identity before fulfilling a request.</p></section>
    <section><h2>10. Public and shared content</h2><p>If you deliberately publish a profile, share an Impact Receipt, or create a public link, recipients may view, copy, or retain that information. Review sharing settings and remove confidential details before publishing.</p></section>
    <section><h2>11. Children and international use</h2><p>BragStack is intended for users old enough to lawfully use online services in their jurisdiction. If you use BragStack outside the United States, information may be processed in the United States or other countries where service providers operate.</p></section>
    <section><h2>12. Changes and contact</h2><p>We may update this policy as BragStack evolves. Questions or privacy requests can be sent to <a href="mailto:Tobias.scott@usebragstack.com?subject=BragStack%20privacy%20request">Tobias.scott@usebragstack.com</a>.</p></section>
  </LegalLayout>;
}

export function TermsPage() {
  return <LegalLayout title="Terms and Conditions" intro="These Terms govern your access to and use of BragStack. By creating an account or using the Service, you agree to these Terms.">
    <section><h2>1. Eligibility and accounts</h2><p>You must be legally able to enter into these Terms and meet the minimum age required in your jurisdiction. Keep your credentials secure, provide accurate account information, and promptly report suspected unauthorized access.</p></section>
    <section><h2>2. What BragStack provides</h2><p>BragStack helps users record accomplishments and evidence, describe measurable impact, connect skills, control sharing, and turn recorded evidence into career materials such as performance-review packets, resume content, and interview preparation.</p></section>
    <section><h2>3. Your content</h2><p>You retain ownership of content you submit. You grant BragStack a limited license to host, store, process, reproduce, and display that content only as reasonably necessary to provide, secure, improve, and support the Service and features you request.</p></section>
    <section><h2>4. Confidentiality and permissions</h2><p>You must have the rights and permissions necessary to upload or share your content. Do not upload trade secrets, confidential employer or client information, personal data about others, copyrighted material, or other information you are not authorized to provide.</p></section>
    <section><h2>5. Acceptable use</h2><p>You may not use BragStack to violate law or another person’s rights, impersonate others, distribute malicious code, interfere with security or availability, gain unauthorized access, abuse billing systems, distribute spam, or fabricate evidence, credentials, employment history, or accomplishments for fraudulent purposes.</p></section>
    <section><h2>6. AI and career outputs</h2><p>AI-assisted and generated content is provided as a drafting aid and may be incomplete or inaccurate. You are responsible for reviewing outputs before using them professionally. BragStack does not guarantee employment, promotion, compensation, interview outcomes, or acceptance of generated material.</p></section>
    <section><h2>7. Subscriptions and billing</h2><p>Paid features may renew automatically until canceled where disclosed at purchase. Prices, billing intervals, included features, and applicable taxes will be shown before purchase. Except where required by law or expressly stated, fees already paid are non-refundable.</p></section>
    <section><h2>8. Intellectual property and third parties</h2><p>BragStack’s software, design, branding, documentation, and other materials are owned by BragStack or its licensors. The Service may rely on third-party providers whose own terms and privacy policies may apply.</p></section>
    <section><h2>9. Suspension, changes, and availability</h2><p>We may suspend or terminate access when reasonably necessary for Terms violations, security threats, fraud, legal requirements, nonpayment, or material risk. Features may change, and the Service may occasionally be unavailable for maintenance or operational reasons.</p></section>
    <section><h2>10. Disclaimers and limitation of liability</h2><p>To the maximum extent permitted by law, the Service is provided “as is” and “as available.” BragStack disclaims warranties that may legally be disclaimed. To the maximum extent permitted by law, BragStack will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, revenues, data, goodwill, or opportunities. Aggregate liability will not exceed the greater of $100 or the amount you paid BragStack in the 12 months before the event giving rise to the claim.</p></section>
    <section><h2>11. Indemnification</h2><p>To the extent permitted by law, you agree to indemnify BragStack from claims and reasonable expenses arising from your unlawful use of the Service, your content, or your material violation of these Terms or another person’s rights.</p></section>
    <section><h2>12. Governing law and disputes</h2><p>These Terms are governed by the laws of the State of Georgia, United States, except where applicable law requires otherwise. Before filing a formal claim, you and BragStack agree to make a good-faith effort to resolve the dispute informally.</p></section>
    <section><h2>13. Changes and contact</h2><p>We may update these Terms as the Service changes. Questions can be sent to <a href="mailto:Tobias.scott@usebragstack.com?subject=BragStack%20terms">Tobias.scott@usebragstack.com</a>.</p></section>
  </LegalLayout>;
}
