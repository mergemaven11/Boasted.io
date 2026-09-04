import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  Mail,
  ReceiptText,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import "./PublicInfoPages.css";

const CONTACT_EMAILS = [
  {
    title: "General questions",
    email: "contact@usebragstack.com",
    description: "Product questions, partnerships, press, feedback, and anything that does not fit another category.",
  },
  {
    title: "Account & product support",
    email: "support@usebragstack.com",
    description: "Sign-in problems, unexpected product behavior, exports, account questions, and help using BragStack.",
  },
  {
    title: "Privacy",
    email: "privacy@usebragstack.com",
    description: "Access, correction, deletion, export, privacy-rights requests, or questions about how personal information is handled.",
  },
  {
    title: "Security",
    email: "security@usebragstack.com",
    description: "Suspected vulnerabilities, account compromise, unexpected data exposure, or other security concerns.",
  },
  {
    title: "Billing",
    email: "billing@usebragstack.com",
    description: "Subscription status, invoices, renewals, cancellations, or other billing questions.",
  },
  {
    title: "Legal",
    email: "legal@usebragstack.com",
    description: "Terms, legal notices, intellectual-property questions, or formal legal correspondence.",
  },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Capture the work while the context is fresh",
    text: "Create an accomplishment record when something meaningful happens. Record the situation, what you contributed, what changed, the skills involved, and any measurable result you can actually support.",
    bullets: [
      "Describe your contribution rather than claiming the entire team's work.",
      "Add metrics only when you know where the number came from.",
      "Reference useful evidence without copying restricted employer or client material into BragStack.",
    ],
  },
  {
    number: "02",
    title: "Turn important accomplishments into Impact Receipts",
    text: "Impact Receipts organize a strong accomplishment into reusable proof: contribution, result, evidence, skills, shared credit, and visibility. The goal is a clearer record of what happened—not a more impressive-sounding version of it.",
    bullets: [
      "Evidence can support a claim without making the underlying private file public.",
      "Shared work should preserve shared credit.",
      "Where verification is available, a collaborator can confirm the claim they were specifically asked to review.",
    ],
  },
  {
    number: "03",
    title: "Package the right proof for the career moment",
    text: "The same underlying evidence can be reorganized for different needs. A performance review needs a different presentation than a resume, promotion packet, or interview story, but the facts should stay consistent.",
    bullets: [
      "Build resume material from documented accomplishments.",
      "Prepare review and promotion material from evidence captured throughout the cycle.",
      "Use real situations and outcomes as the source for interview practice.",
    ],
  },
  {
    number: "04",
    title: "Share selectively",
    text: "BragStack is designed around private-by-default career evidence. Public proof should be a deliberate subset of your workspace, not a mirror of everything you have recorded.",
    bullets: [
      "Review every public item for confidential or identifying information first.",
      "Publish only the accomplishments or receipts you intentionally choose.",
      "Remember that someone who can view public content may copy or retain it outside BragStack.",
    ],
  },
  {
    number: "05",
    title: "Keep building a durable evidence record",
    text: "Career proof becomes more useful when it is captured continuously. Over time, your records can reveal recurring skills, stronger categories of impact, evidence gaps, and examples worth reusing later.",
    bullets: [
      "Use career analytics as a view into your own documented history, not as an employee score.",
      "Update records when you learn that a metric, date, or attribution needs correction.",
      "Keep private evidence private when sharing would create unnecessary risk.",
    ],
  },
];

const USE_CASES = [
  {
    title: "Performance reviews",
    intro: "Build the review throughout the year instead of rebuilding it from memory at the deadline.",
    capture: "Wins, customer outcomes, reliability improvements, completed projects, praise, ownership, mentoring, lessons, and measurable impact.",
    use: "A review-ready record that helps you describe scope, results, growth, and specific examples with less guesswork.",
  },
  {
    title: "Promotions & raises",
    intro: "Show how your scope and impact changed over time rather than relying on a list of tasks.",
    capture: "Expanded responsibility, leadership, cross-team work, difficult problems, repeated impact, new skills, and evidence of higher-level work.",
    use: "Promotion material organized around ownership, outcomes, progression, and the strongest proof you have available.",
  },
  {
    title: "Resume & job search",
    intro: "Keep the raw material for stronger resume bullets before old projects become hard to remember.",
    capture: "Situation, action, result, technologies, scale, constraints, metrics, and the parts of the work you personally owned.",
    use: "Resume material grounded in real accomplishments instead of generic responsibility statements or invented numbers.",
  },
  {
    title: "Interview preparation",
    intro: "Prepare stories from work you actually did, with enough context to explain your decisions and impact clearly.",
    capture: "Challenges, tradeoffs, actions, mistakes, recovery, collaboration, leadership, customer impact, technical decisions, and results.",
    use: "A library of real examples for behavioral, situational, leadership, and technical conversations.",
  },
  {
    title: "Career changers",
    intro: "Make new skills visible by documenting how and where you used them.",
    capture: "Projects, labs, certifications, volunteer work, coursework, open-source work, practical exercises, and transferable accomplishments.",
    use: "Evidence that connects previous experience to the skills and responsibilities of the next role you are pursuing.",
  },
  {
    title: "Freelancers & consultants",
    intro: "Turn completed engagements into a reusable record of client value without exposing private client information.",
    capture: "Problems solved, deliverables, before-and-after outcomes, approved testimonials, measurable results, and reusable lessons.",
    use: "Case-study material, client updates, portfolio proof, and a clearer record of the kinds of outcomes you repeatedly deliver.",
  },
  {
    title: "Founders & creators",
    intro: "Document the work behind launches and experiments instead of keeping the whole company story in your head.",
    capture: "Launches, product changes, customer feedback, experiments, operational improvements, audience milestones, and lessons learned.",
    use: "A factual record that can support future hiring, fundraising conversations, partnerships, portfolios, or your own career story.",
  },
  {
    title: "Adult education & early career",
    intro: "Adults age 18+ can document growth before they have a long employment history.",
    capture: "Projects, academic work, service, internships, competitions, leadership, certifications, practical skills, and meaningful learning milestones.",
    use: "Material for internships, scholarships, applications, portfolios, interviews, and early-career storytelling. BragStack accounts are 18+ for now.",
  },
];

function Header() {
  return (
    <header className="public-info-topbar">
      <a className="public-info-brand" href="/"><img src="/brandmark.svg" alt="" /><strong>BragStack</strong></a>
      <nav aria-label="Public information navigation">
        <a href="/how-it-works">How it works</a>
        <a href="/use-cases">Use cases</a>
        <a href="/security">Trust & privacy</a>
        <a href="/docs">Docs</a>
        <a href="/login">Sign in</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="public-info-footer">
      <div className="public-info-footer-grid">
        <div className="public-info-footer-brand"><a href="/">BragStack</a><p>Turn everyday work into career proof you can use when it matters.</p></div>
        <div><h3>Resources</h3><a href="/how-it-works">How it works</a><a href="/use-cases">Use cases</a><a href="/docs">Docs</a><a href="/nda-safety">NDA & confidential work</a></div>
        <div><h3>Company</h3><a href="/contact">Contact</a><a href="/team">Team waitlist</a><a href="/enterprise">Enterprise</a><a href="/security">Trust & privacy</a></div>
        <div><h3>Legal</h3><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a><a href="/nda-safety">Confidentiality guidance</a></div>
      </div>
      <div className="public-info-footer-bottom"><span>© 2026 BragStack</span><span>Private by default · Your proof stays yours.</span><div><a href="/login">Log in</a><a href="/register">Start free</a></div></div>
    </footer>
  );
}

function Hero({ eyebrow, title, description, badge, primaryHref = "/register", primaryLabel = "Start free", secondaryHref = "/docs", secondaryLabel = "Read the docs" }) {
  return (
    <section className="public-info-hero">
      <div>
        <span className="public-info-kicker"><ReceiptText size={16} /> {eyebrow}</span>
        {badge && <span className="public-info-status">{badge}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="public-info-actions">
          <a className="public-info-primary" href={primaryHref}>{primaryLabel}<ArrowRight size={17} /></a>
          <a className="public-info-secondary" href={secondaryHref}>{secondaryLabel}</a>
        </div>
      </div>
      <aside className="public-info-principles">
        <ShieldCheck size={31} />
        <strong>Evidence before exaggeration.</strong>
        <span>BragStack is designed to help you organize what you can support, keep private work private, and choose what becomes public.</span>
      </aside>
    </section>
  );
}

function HowItWorksPage() {
  return (
    <>
      <Header />
      <Hero
        eyebrow="HOW BRAGSTACK WORKS"
        title="Capture → Prove → Package → Share → Keep building."
        description="BragStack gives your accomplishments somewhere durable to live before the details disappear. Capture the work once, connect the evidence you are allowed to keep, and reuse the strongest proof when a career moment needs it."
        secondaryHref="/nda-safety"
        secondaryLabel="Confidential-work guide"
      />
      <section className="public-info-intro-grid">
        <article><Target size={23} /><h2>What BragStack is</h2><p>A private career-evidence workspace for documenting accomplishments, impact, skills, evidence references, and reusable professional stories.</p></article>
        <article><LockKeyhole size={23} /><h2>What stays private</h2><p>Your account and private proof are not meant to become public automatically. Sharing is a separate, intentional action.</p></article>
        <article><FileCheck2 size={23} /><h2>What “proof” means here</h2><p>Proof can include your own structured record, supporting evidence references, measurable results, shared credit, and verification where a feature supports it.</p></article>
      </section>
      <section className="public-info-section">
        <div className="public-info-section-heading"><span>THE WORKFLOW</span><h2>Five steps, with the details that matter.</h2><p>Each stage has a different job. The product should help you preserve facts—not blur the line between documented work and generated wording.</p></div>
        <div className="public-info-step-list">
          {HOW_IT_WORKS.map((step) => (
            <article key={step.number} className="public-info-step">
              <span className="public-info-step-number">{step.number}</span>
              <div><h3>{step.title}</h3><p>{step.text}</p><ul>{step.bullets.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></div>
            </article>
          ))}
        </div>
      </section>
      <section className="public-info-section public-info-example">
        <div className="public-info-section-heading"><span>EXAMPLE</span><h2>What a healthy evidence trail can look like.</h2></div>
        <div className="public-info-example-grid">
          <article><strong>Situation</strong><p>A recurring customer escalation took too long to diagnose because troubleshooting knowledge was scattered.</p></article>
          <article><strong>Contribution</strong><p>You documented the failure pattern, clarified the diagnostic path, and created a reusable internal troubleshooting guide.</p></article>
          <article><strong>Result</strong><p>The team gained a more repeatable resolution path. Add a time or percentage improvement only if you have a reliable source for it.</p></article>
          <article><strong>Evidence</strong><p>Reference an approved ticket, dashboard, sanitized screenshot, public artifact, or manager-confirmed result only when your policies allow it.</p></article>
        </div>
      </section>
      <section className="public-info-warning"><ShieldCheck size={21} /><div><h2>Confidentiality comes before career proof.</h2><p>Do not move passwords, secrets, source code, customer data, private logs, restricted documents, trade secrets, or material covered by an NDA or employer policy into BragStack just to make an accomplishment look stronger. A generalized description is often safer and still useful.</p><a href="/nda-safety">Read the NDA & confidential-work guidance →</a></div></section>
      <Footer />
    </>
  );
}

function UseCasesPage() {
  return (
    <>
      <Header />
      <Hero
        eyebrow="BRAGSTACK USE CASES"
        title="Use the same documented work for different career moments."
        description="A good career-proof system should reduce rework. Capture the facts once, then organize the relevant subset for a review, promotion, resume, interview, portfolio, or next opportunity without changing what actually happened."
        secondaryHref="/how-it-works"
        secondaryLabel="See the workflow"
      />
      <section className="public-info-section">
        <div className="public-info-section-heading"><span>REAL CAREER MOMENTS</span><h2>What to capture—and what it can become.</h2><p>These are examples, not guarantees of a particular hiring, compensation, school, or promotion outcome.</p></div>
        <div className="public-info-use-grid">
          {USE_CASES.map((item) => (
            <article key={item.title}>
              <BriefcaseBusiness size={22} />
              <h3>{item.title}</h3>
              <p>{item.intro}</p>
              <div><strong>Capture</strong><span>{item.capture}</span></div>
              <div><strong>Use it for</strong><span>{item.use}</span></div>
            </article>
          ))}
        </div>
      </section>
      <section className="public-info-section public-info-boundaries">
        <div className="public-info-section-heading"><span>BOUNDARIES</span><h2>What BragStack should not become.</h2></div>
        <div className="public-info-intro-grid">
          <article><ShieldCheck size={22} /><h3>Not a fabrication engine</h3><p>Generated wording should never silently create employers, credentials, dates, metrics, projects, or outcomes you did not provide.</p></article>
          <article><LockKeyhole size={22} /><h3>Not an employer surveillance feed</h3><p>Your private career evidence is for you. Planned organization features are intended to use bounded, user-approved sharing rather than hidden observation.</p></article>
          <article><FileCheck2 size={22} /><h3>Not a reason to break confidentiality</h3><p>If a detail is restricted, leave it out or generalize it. Your employer, client, contract, NDA, and applicable law still control what you may retain or disclose.</p></article>
        </div>
      </section>
      <Footer />
    </>
  );
}

function ContactPage() {
  return (
    <>
      <Header />
      <Hero
        eyebrow="CONTACT BRAGSTACK"
        title="Get your question to the right place."
        description="Use the address that best matches what you need. Keeping support, privacy, security, billing, and legal requests separate helps important messages reach the right workflow."
        primaryHref="mailto:contact@usebragstack.com?subject=BragStack%20question"
        primaryLabel="Email BragStack"
        secondaryHref="/docs"
        secondaryLabel="Check the docs first"
      />
      <section className="public-info-section">
        <div className="public-info-section-heading"><span>CONTACT ROUTES</span><h2>Choose the address that fits your request.</h2><p>Do not send passwords, authentication tokens, full payment-card numbers, employer secrets, or confidential evidence by email.</p></div>
        <div className="public-info-contact-grid">
          {CONTACT_EMAILS.map((item) => (
            <article key={item.email}><Mail size={21} /><h3>{item.title}</h3><p>{item.description}</p><a href={`mailto:${item.email}?subject=BragStack%20${encodeURIComponent(item.title)}`}>{item.email}</a></article>
          ))}
        </div>
      </section>
      <section className="public-info-section">
        <div className="public-info-section-heading"><span>HELP US HELP YOU</span><h2>What to include in a useful support message.</h2></div>
        <div className="public-info-intro-grid">
          <article><h3>Account issue</h3><p>Include the email address associated with the account, the page you were using, what you expected to happen, what happened instead, and the approximate time of the problem.</p></article>
          <article><h3>Bug report</h3><p>Include reproducible steps, device/browser information, screenshots with sensitive information removed, and any error text that is safe to share.</p></article>
          <article><h3>Security report</h3><p>Describe the suspected vulnerability or exposure clearly. Avoid testing against other users, accessing data you are not authorized to access, or emailing secrets as proof.</p></article>
        </div>
      </section>
      <Footer />
    </>
  );
}

function TeamPage() {
  return (
    <>
      <Header />
      <Hero
        eyebrow="BRAGSTACK FOR TEAMS"
        badge="COMING SOON"
        title="Support professional growth without turning career evidence into surveillance."
        description="BragStack Team is planned as an organization layer around the employee-controlled evidence model. The goal is to make reviews, recognition, and development easier while keeping private individual proof separate from what a person intentionally shares with an organization."
        primaryHref="mailto:contact@usebragstack.com?subject=BragStack%20Team%20waitlist"
        primaryLabel="Join the Team waitlist"
        secondaryHref="/security"
        secondaryLabel="Read the trust model"
      />
      <section className="public-info-section">
        <div className="public-info-section-heading"><span>PLANNED DIRECTION</span><h2>What the Team product is intended to support.</h2><p>These capabilities are roadmap direction, not a promise that every item is generally available today.</p></div>
        <div className="public-info-use-grid public-info-use-grid-small">
          <article><Users size={22} /><h3>Shared review templates</h3><p>Give teams a consistent structure for review cycles without forcing every person's private BragStack workspace into the organization.</p></article>
          <article><FileCheck2 size={22} /><h3>Optional manager confirmation</h3><p>Let a user request confirmation for specific work when confirmation is appropriate instead of treating a manager as the owner of the record.</p></article>
          <article><ReceiptText size={22} /><h3>Review-cycle packets</h3><p>Organize employee-approved evidence into clearer performance and development conversations.</p></article>
          <article><Target size={22} /><h3>Bounded organization analytics</h3><p>Provide useful aggregate or workflow-level signals without turning a person's private evidence history into an employee score.</p></article>
          <article><BriefcaseBusiness size={22} /><h3>Centralized billing</h3><p>Make it practical for an organization to pay for participating users while keeping account ownership and permissions explicit.</p></article>
        </div>
      </section>
      <section className="public-info-section public-info-boundaries">
        <div className="public-info-section-heading"><span>DESIGN PRINCIPLES</span><h2>What we are trying to protect as teams are added.</h2></div>
        <div className="public-info-intro-grid">
          <article><LockKeyhole size={22} /><h3>Private means private</h3><p>An organization should not automatically receive a copy of everything an employee records in a personal career workspace.</p></article>
          <article><ShieldCheck size={22} /><h3>Sharing should be understandable</h3><p>People should know what they are sharing, who can see it, and why an organization is asking for it.</p></article>
          <article><Users size={22} /><h3>Recognition should preserve credit</h3><p>Collaborative work should not be flattened into a single-person claim simply because the software makes that easier.</p></article>
        </div>
      </section>
      <section className="public-info-warning"><Users size={21} /><div><h2>Current availability</h2><p>Individual BragStack accounts are the live product today. Team features are still being developed. Joining the waitlist is an expression of interest, not a purchase commitment or guarantee of a launch date.</p><a href="mailto:contact@usebragstack.com?subject=BragStack%20Team%20waitlist">Join the Team waitlist →</a></div></section>
      <Footer />
    </>
  );
}

function EnterprisePage() {
  return (
    <>
      <Header />
      <Hero
        eyebrow="BRAGSTACK ENTERPRISE"
        badge="EARLY / PLANNED"
        title="Governed career evidence for larger organizations—without pretending the enterprise layer is finished."
        description="The enterprise direction builds on BragStack's employee-controlled evidence model with additional identity, policy, retention, governance, and support capabilities. Enterprise is not presented here as a generally available compliance product today."
        primaryHref="mailto:contact@usebragstack.com?subject=BragStack%20Enterprise"
        primaryLabel="Discuss enterprise needs"
        secondaryHref="/security"
        secondaryLabel="Security overview"
      />
      <section className="public-info-section">
        <div className="public-info-section-heading"><span>ENTERPRISE ROADMAP</span><h2>Capabilities being considered for larger deployments.</h2><p>The exact package should be driven by real customer requirements, security review, and the controls BragStack can actually support at launch.</p></div>
        <div className="public-info-use-grid public-info-use-grid-small">
          <article><Users size={22} /><h3>Enterprise identity</h3><p>Organization-managed sign-in and identity controls are part of the enterprise roadmap. Specific SSO or provisioning standards should not be assumed until they are documented as available.</p></article>
          <article><ShieldCheck size={22} /><h3>Audit & governance controls</h3><p>Provide administrators with appropriate records and policy controls for enterprise workflows while avoiding access to unrelated private career evidence.</p></article>
          <article><FileCheck2 size={22} /><h3>Retention controls</h3><p>Support organization policy around records that belong to enterprise workflows, with clearer separation from a person's private evidence where the product model requires it.</p></article>
          <article><LockKeyhole size={22} /><h3>Admin policy controls</h3><p>Define what an organization can request, what can be shared into an organization workflow, and which controls apply to managed enterprise use.</p></article>
          <article><BriefcaseBusiness size={22} /><h3>Integrations & support</h3><p>Evaluate customer-specific integration and support needs instead of claiming broad integrations before they exist and are tested.</p></article>
        </div>
      </section>
      <section className="public-info-section">
        <div className="public-info-section-heading"><span>PROCUREMENT & TRUST</span><h2>Questions we expect serious enterprise buyers to ask.</h2></div>
        <div className="public-info-intro-grid">
          <article><h3>What data does BragStack store?</h3><p>Enterprise evaluation should document the exact data flows, roles, retention behavior, public/private sharing boundaries, and third-party services used by the version being evaluated.</p></article>
          <article><h3>What security attestations exist?</h3><p>Do not assume BragStack holds SOC 2, ISO 27001, HIPAA, FedRAMP, or another certification unless BragStack explicitly publishes that current status. Security claims should match evidence.</p></article>
          <article><h3>Can an employer see private evidence?</h3><p>The product direction is to keep individual evidence ownership separate from bounded organization workflows. Any enterprise permission model should state exactly what admins can and cannot access.</p></article>
        </div>
      </section>
      <section className="public-info-warning"><ShieldCheck size={21} /><div><h2>Enterprise is a conversation before it is a contract.</h2><p>BragStack should only commit to controls, integrations, support levels, or compliance requirements after confirming that the product and operating processes can meet them. If your organization has specific procurement, security, privacy, or data-residency requirements, include them in your inquiry.</p><a href="mailto:contact@usebragstack.com?subject=BragStack%20Enterprise">Start an enterprise conversation →</a></div></section>
      <Footer />
    </>
  );
}

export default function PublicInfoPage({ page }) {
  if (page === "how-it-works") return <HowItWorksPage />;
  if (page === "use-cases") return <UseCasesPage />;
  if (page === "contact") return <ContactPage />;
  if (page === "team") return <TeamPage />;
  if (page === "enterprise") return <EnterprisePage />;
  return <HowItWorksPage />;
}
