import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import "./LandingPage.css";
import "./LandingPageMonetization.css";
import "./LandingPageSimple.css";

const simpleSteps = [
  {
    number: "01",
    title: "Save it",
    description: "Capture a win, project, result, lesson, or piece of work while you still remember the details.",
  },
  {
    number: "02",
    title: "Prove it",
    description: "Keep the result, evidence, skills, and shared credit connected to the work instead of scattered everywhere.",
  },
  {
    number: "03",
    title: "Use it",
    description: "Reuse the same saved record when you need a résumé, review, promotion case, interview story, profile, or application.",
  },
];

const outcomes = [
  { icon: FileText, title: "Résumé", description: "Build from work you already saved." },
  { icon: TrendingUp, title: "Performance review", description: "Bring back the wins and results that matter." },
  { icon: Target, title: "Promotion", description: "Show scope, ownership, growth, and impact." },
  { icon: MessageSquare, title: "Interview", description: "Turn real work into stories you can explain clearly." },
  { icon: Sparkles, title: "Proof Profile", description: "Share only the proof you choose to make public." },
  { icon: GraduationCap, title: "School & opportunity", description: "Reuse projects and achievements for internships, scholarships, and programs." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    tagline: "Start building your record",
    badge: "Start here",
    features: ["5 proof entries", "1 Impact Receipt", "Basic reports", "Basic Proof Profile", "Skill tracking"],
    cta: "Start free",
    href: "/register",
  },
  {
    name: "Pro",
    price: "$0",
    suffix: " for now",
    tagline: "Complimentary early access",
    featured: true,
    badge: "Early access gift",
    features: ["Unlimited proof + Impact Receipts", "Career Intelligence", "Résumé Builder", "Performance Review Builder", "Promotion Packet", "PDF and career exports"],
    cta: "Get Pro free for now",
    href: "/register",
  },
  {
    name: "Team",
    price: "$15",
    suffix: "/user / month",
    tagline: "Shared review workflows without surveillance",
    badge: "Coming soon",
    features: ["Everything in Pro", "Team review dashboard", "Shared review templates", "Optional manager confirmation", "Review-cycle packets", "Bounded team analytics", "Centralized billing"],
    cta: "Talk about Team",
    href: "mailto:hello@boasted.io?subject=Boasted%20Team",
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "Governance and controls for larger organizations",
    features: ["Everything in Team", "Enterprise admin dashboard", "Identity and SSO roadmap", "Audit and governance controls", "Retention and policy controls", "Custom integrations and support"],
    cta: "Talk about Enterprise",
    href: "mailto:hello@boasted.io?subject=Boasted%20Enterprise",
  },
];

const organizationTabs = {
  team: {
    label: "Teams",
    icon: Users,
    eyebrow: "FOR TEAMS",
    title: "Make reviews and growth conversations easier.",
    description: "Employees keep their own private record, then intentionally bring selected proof into reviews, promotions, and development conversations.",
    bullets: [
      "Shared review and promotion templates",
      "Optional manager confirmation for selected accomplishments",
      "Review-cycle packets built from employee-approved proof",
      "Bounded team trends instead of employee scoring",
    ],
    preview: [
      ["Review packets", "18 / 24", "ready"],
      ["Confirmations", "Optional", "selected proof"],
      ["Private notes", "Hidden", "employee-owned"],
    ],
    cta: "Talk about Team",
    href: "mailto:hello@boasted.io?subject=Boasted%20Team",
  },
  enterprise: {
    label: "Enterprise",
    icon: Building2,
    eyebrow: "FOR ENTERPRISE",
    title: "Add governance without turning career proof into surveillance.",
    description: "Larger organizations can add administration, policy, retention, identity, and integration controls while preserving the boundary around a person's private record.",
    bullets: [
      "Workspace and review-program administration",
      "Identity and SSO roadmap",
      "Retention and governance controls",
      "Custom integrations and implementation support",
    ],
    preview: [
      ["Policies", "Managed", "workspace controls"],
      ["Retention", "Configurable", "company workflows"],
      ["Analytics", "Bounded", "no leaderboard"],
    ],
    cta: "Talk about Enterprise",
    href: "mailto:hello@boasted.io?subject=Boasted%20Enterprise",
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    eyebrow: "FOR STUDENTS",
    title: "Give schoolwork, projects, and achievements somewhere to go.",
    description: "Students can save what they have done, then reuse it for résumés, internships, scholarships, programs, portfolios, and early-career opportunities.",
    bullets: [
      "Academic Portfolio and education-focused Impact Receipts",
      "Scholarship, program, and federal internship discovery",
      "Skills from education and evidence-connected career directions",
      "Student proof stays private unless the student chooses to share it",
    ],
    preview: [
      ["Student proof", "Private", "shared by choice"],
      ["Programs", "Explore", "official data"],
      ["Internships", "Discover", "live listings"],
    ],
    cta: "Explore Education",
    href: "/education",
  },
};

function LandingPage() {
  const [organizationTab, setOrganizationTab] = useState("team");
  const organization = organizationTabs[organizationTab];

  return (
    <main className="landing-page landing-page-simple">
      <header className="landing-nav">
        <a className="landing-logo" href="/">Boasted</a>
        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#impact-receipt">Impact Receipt</a>
          <a href="#outcomes">What it helps with</a>
          <a href="#trust">Privacy</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/login">Log in</a>
          <a className="landing-btn landing-btn-small" href="/register">Start free</a>
        </div>
      </header>

      <section className="landing-hero landing-simple-hero landing-thirty-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><Sparkles size={15} /> ONE PLACE FOR WHAT YOU HAVE DONE</div>
          <h1>Never lose track of what you&apos;ve accomplished.</h1>
          <p className="landing-hero-description">
            Save your work, wins, projects, skills, and proof in one place — so when a job, review, promotion, interview, scholarship, or other opportunity comes up, you are ready.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-btn" href="/register">Start building my record <ArrowRight size={18} /></a>
            <a className="landing-btn landing-btn-secondary" href="#how-it-works">See how it works</a>
          </div>
          <p className="landing-trust-line">Free to start <span>•</span> Private by default <span>•</span> You decide what to share</p>
        </div>

        <div className="landing-product-shot" aria-label="Example Boasted Impact Receipt">
          <div className="landing-product-shot-glow" />
          <article className="impact-window">
            <div className="impact-window-bar">
              <div className="impact-window-dots" aria-hidden="true"><span /><span /><span /></div>
              <div className="impact-window-location">Boasted / Impact Receipt</div>
              <div className="impact-window-status"><ShieldCheck size={14} /> Private</div>
            </div>
            <div className="impact-window-body">
              <div className="impact-shot-kicker">IMPACT RECEIPT</div>
              <h2>Reduced repeat customer escalations by improving the troubleshooting path.</h2>
              <div className="impact-shot-grid">
                <div><span>Accomplishment</span><p>Created a reusable diagnostic guide for a recurring support failure.</p></div>
                <div><span>Contribution</span><p>Mapped the failure pattern, clarified checks, and documented the recovery path.</p></div>
                <div className="impact-shot-result"><span>Result</span><p>Faster triage and fewer repeat handoffs for the same issue pattern.</p></div>
                <div><span>Evidence</span><p>Runbook · ticket examples · before/after workflow notes</p></div>
                <div><span>Skills</span><p>Troubleshooting · documentation · systems thinking</p></div>
                <div><span>Credit</span><p>Individual contribution with team review</p></div>
              </div>
            </div>
          </article>
          <p className="landing-product-shot-caption">This is the idea: your work stops living in your memory, inbox, chat history, and random notes.</p>
        </div>
      </section>

      <section className="landing-thirty-thesis" aria-label="Boasted in one sentence">
        <span>Boasted in one sentence</span>
        <strong>It remembers what you have done, keeps the proof with it, and helps you use it later.</strong>
      </section>

      <section className="landing-workflow premium-workflow landing-simple-workflow" id="how-it-works">
        <div className="landing-section-heading">
          <p>THE WHOLE MODEL</p>
          <h2>Save it. Prove it. Use it.</h2>
          <span>You do not need to become a career-planning expert. Just keep a record of the things you do while the details are still fresh.</span>
        </div>
        <div className="premium-workflow-grid landing-simple-step-grid">
          {simpleSteps.map((step) => (
            <article className="workflow-card premium-workflow-card" key={step.number}>
              <span className="workflow-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-impact-section" id="impact-receipt">
        <div className="landing-impact-copy">
          <p className="landing-mini-label">THE PART THAT MAKES BOASTED DIFFERENT</p>
          <h2>Do not just remember the win. Keep the receipt.</h2>
          <p>An Impact Receipt keeps the story of an accomplishment together: what happened, what you contributed, what changed, what supports the claim, which skills were involved, and who deserves credit.</p>
          <div className="landing-impact-points">
            <div><Check size={18} /><span><strong>Context stays attached.</strong> You do not have to reconstruct the story months later.</span></div>
            <div><Check size={18} /><span><strong>Proof stays attached.</strong> Results, evidence references, and skills stay connected to the work.</span></div>
            <div><Check size={18} /><span><strong>Credit stays honest.</strong> Individual contribution and shared work can both be represented.</span></div>
          </div>
        </div>
        <div className="landing-impact-anatomy" aria-label="Impact Receipt anatomy">
          <div><span>01</span><strong>What happened?</strong><p>The accomplishment.</p></div>
          <div><span>02</span><strong>What did you do?</strong><p>Your contribution.</p></div>
          <div><span>03</span><strong>What changed?</strong><p>The result.</p></div>
          <div><span>04</span><strong>What supports it?</strong><p>Evidence.</p></div>
          <div><span>05</span><strong>What did it show?</strong><p>Skills.</p></div>
          <div><span>06</span><strong>Who helped?</strong><p>Credit.</p></div>
        </div>
      </section>

      <section className="landing-use-cases landing-simple-products" id="outcomes">
        <div className="landing-section-heading">
          <p>ONE RECORD. MANY MOMENTS.</p>
          <h2>Use the work you already saved.</h2>
          <span>These are outcomes of the same record — not six different products you have to maintain.</span>
        </div>
        <div className="landing-outcome-flow">
          <div className="landing-outcome-source"><Sparkles size={21} /><span>Your saved work</span><strong>One record</strong></div>
          <div className="landing-outcome-line" aria-hidden="true" />
          <div className="use-case-grid landing-simple-output-grid">
            {outcomes.map(({ icon: Icon, ...item }) => (
              <article className="use-case-card" key={item.title}>
                <div className="use-case-icon"><Icon size={21} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-memory-problem">
        <div className="landing-memory-number">6 months</div>
        <div>
          <p className="landing-mini-label">THE PROBLEM IS TIME</p>
          <h2>Six months from now, will you remember everything you did this month?</h2>
          <p>Projects blur together. Numbers disappear. Teams change. Managers leave. School semesters end. Useful links get buried. Boasted gives the important parts somewhere to live before that happens.</p>
        </div>
      </section>

      <section className="landing-feature-section landing-simple-trust" id="trust">
        <div className="landing-feature-copy">
          <p className="landing-mini-label">YOUR INFORMATION IS YOURS</p>
          <h2>Private first. Share only when you want to.</h2>
          <p>Your record is for you. Boasted helps you organize what you save; it does not turn your day-to-day work into an employer activity feed or score.</p>
          <div className="landing-feature-list">
            <div><ShieldCheck size={17} /> Private proof stays behind your account.</div>
            <div><ShieldCheck size={17} /> Public Proof Profiles show only what you choose to publish.</div>
            <div><ShieldCheck size={17} /> Boasted does not invent results, credentials, or proof.</div>
            <div><ShieldCheck size={17} /> You can keep confidential details out while still saving the career value of the work.</div>
          </div>
        </div>
        <div className="feature-dashboard-preview landing-simple-trust-card">
          <div className="feature-preview-header"><div><span>Default</span><strong>Private</strong></div><div><span>Sharing</span><strong>Your choice</strong></div></div>
          <div className="feature-preview-entry"><div><span className="feature-preview-badge">Your record</span><small>You stay in control</small></div><h3>Save the useful part. Leave secrets out.</h3><p>Keep the result, skill, lesson, and credit you are allowed to keep. Do not upload employer secrets, customer secrets, or anything your agreements say you cannot store.</p></div>
        </div>
      </section>

      <section className="landing-org-section" id="organizations">
        <div className="landing-section-heading landing-org-heading">
          <p>FOR MORE THAN ONE PERSON</p>
          <h2>The same idea can work for teams, organizations, and students.</h2>
          <span>The individual record stays the center. Organization features sit around it instead of replacing it.</span>
        </div>

        <div className="landing-org-tabs" role="tablist" aria-label="Organization solutions">
          {Object.entries(organizationTabs).map(([key, tab]) => {
            const Icon = tab.icon;
            const active = organizationTab === key;
            return (
              <button key={key} type="button" role="tab" aria-selected={active} className={active ? "active" : ""} onClick={() => setOrganizationTab(key)}>
                <Icon size={17} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="landing-org-panel">
          <div className="landing-org-copy">
            <div className="landing-mini-label">{organization.eyebrow}</div>
            <h3>{organization.title}</h3>
            <p>{organization.description}</p>
            <div className="landing-org-feature-list">
              {organization.bullets.map((feature) => <div key={feature}><Check size={17} /> <span>{feature}</span></div>)}
            </div>
            <a className="landing-btn" href={organization.href}>{organization.cta} <ArrowRight size={17} /></a>
          </div>

          <div className="landing-org-dashboard">
            <div className="landing-org-dashboard-title"><LayoutDashboard size={19} /><div><span>Workspace preview</span><strong>{organization.label}</strong></div></div>
            <div className="landing-org-stats">
              {organization.preview.map(([label, value, detail]) => (
                <div key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
              ))}
            </div>
            <div className="landing-org-privacy"><ShieldCheck size={17} /><span>{organizationTab === "education" ? "Student proof stays private unless the student chooses to share it." : "Private individual notes are not exposed as an employer activity feed."}</span></div>
          </div>
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="landing-section-heading">
          <p>SIMPLE PRICING</p>
          <h2>Start free. Keep your record growing.</h2>
          <span>Pro is temporarily complimentary during early access. Team and Enterprise are available for organization conversations.</span>
        </div>
        <div className="pricing-grid pricing-grid-four">
          {plans.map((plan) => (
            <article className={`pricing-card ${plan.featured ? "pricing-card-featured pricing-card-pro" : ""}`} key={plan.name}>
              {plan.badge && <div className="pricing-popular-label">{plan.badge}</div>}
              <div className="pricing-card-header"><div><p>{plan.name}</p><h3>{plan.price}{plan.suffix && <span>{plan.suffix}</span>}</h3></div></div>
              <p className="pricing-tagline">{plan.tagline}</p>
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}</ul>
              <a className={`landing-btn pricing-button ${plan.featured ? "" : "landing-btn-secondary"}`} href={plan.href}>{plan.cta}{plan.featured && <ArrowRight size={17} />}</a>
            </article>
          ))}
        </div>
        <div className="pricing-conversion-note"><Zap size={20} /><div><strong>No surprise billing.</strong><span>If paid Pro is offered later, you will have to choose it and complete checkout before you are charged.</span></div></div>
      </section>

      <section className="landing-final-cta landing-simple-final-cta">
        <div><p>YOUR WORK SHOULD NOT DISAPPEAR JUST BECAUSE TIME PASSES.</p><h2>Start keeping the record your future self will wish you had.</h2><span>Save what you have done now. Use it whenever the next opportunity shows up.</span></div>
        <a className="landing-btn landing-final-button" href="/register">Start building my record <ArrowRight size={18} /></a>
      </section>

      <footer className="mega-footer landing-simple-footer">
        <div className="mega-footer-brand"><a className="landing-logo" href="/">Boasted</a><p>One place to remember what you have done and use it later.</p><a className="footer-cta" href="/register">Start free <ArrowRight size={15} /></a></div>
        <div className="mega-footer-columns landing-simple-footer-columns">
          <div><h3>Product</h3><a href="#how-it-works">How it works</a><a href="#impact-receipt">Impact Receipts</a><a href="#outcomes">What it helps with</a></div>
          <div><h3>Organizations</h3><a href="#organizations" onClick={() => setOrganizationTab("team")}>Teams</a><a href="#organizations" onClick={() => setOrganizationTab("enterprise")}>Enterprise</a><a href="/education">Education</a></div>
          <div><h3>Account & trust</h3><a href="/login">Log in</a><a href="/register">Create account</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
        </div>
        <div className="mega-footer-bottom"><span>© 2026 Boasted</span><span>Private by default · Your proof stays yours.</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
      </footer>
    </main>
  );
}

export default LandingPage;
