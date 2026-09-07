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
  { number: "01", title: "Save it", description: "Write down what you accomplished before the details disappear." },
  { number: "02", title: "Prove it", description: "Add the result, skills, evidence, and shared credit that belong with the work." },
  { number: "03", title: "Use it", description: "Turn the same saved work into a résumé, review, promotion case, or interview story." },
];

const outputs = [
  { id: "product-resume", icon: FileText, title: "ATS-friendly résumés", description: "Build from your saved work or import an existing résumé and clean it up." },
  { id: "product-review", icon: TrendingUp, title: "Performance reviews", description: "Pull together the wins and results that show what changed because of your work." },
  { id: "product-promotion", icon: Target, title: "Promotion packets", description: "Organize proof of scope, ownership, growth, and impact for advancement conversations." },
  { id: "product-interview", icon: MessageSquare, title: "Interview practice", description: "Turn real accomplishments into stories you can explain clearly under pressure." },
  { id: "product-profile", icon: Sparkles, title: "Proof Profiles", description: "Share only the work you choose while the rest of your private record stays private." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    tagline: "A simple place to start saving your work",
    badge: "Base plan",
    features: ["5 proof entries", "1 Impact Receipt", "Basic reports", "Basic Proof Profile", "Skill tracking"],
    cta: "Create account — Pro gift included",
    href: "/register",
  },
  {
    name: "Pro",
    price: "$0",
    suffix: " for now",
    tagline: "Temporary complimentary early-access gift",
    featured: true,
    badge: "Complimentary Pro gift",
    features: ["Unlimited proof + Impact Receipts", "Career Intelligence", "Resume Builder", "Performance Review Builder", "Promotion Packet", "PDF and career exports"],
    cta: "Get Pro free for now",
    href: "/register",
  },
  {
    name: "Team",
    price: "$15",
    suffix: "/user / month",
    tagline: "Better reviews and growth conversations without surveillance",
    badge: "Coming soon",
    features: ["Everything in Pro", "Team review dashboard", "Shared review templates", "Optional manager confirmation", "Review-cycle packets", "Bounded team analytics", "Centralized billing"],
    cta: "Talk about Team",
    href: "mailto:hello@boasted.io?subject=Boasted%20Team",
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "Governance and deeper controls for larger organizations",
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
    title: "Make review season easier for managers and employees.",
    description: "Team adds a shared company workspace around employee-owned proof. People keep their private career record, then intentionally bring selected evidence into reviews, promotions, and development conversations.",
    features: [
      "Review dashboard for packet readiness and workflow status",
      "Shared review and promotion templates",
      "Optional manager confirmation for selected accomplishments",
      "Review-cycle packets built from employee-approved proof",
      "Bounded team trends instead of employee scores",
      "Centralized seats, billing, and workspace administration",
    ],
    stats: [
      ["Review packets", "18 / 24", "ready"],
      ["Confirmations", "Optional", "selected proof only"],
      ["Private notes", "Hidden", "not a manager feed"],
    ],
    rows: [
      ["Review cycle", "Q4 Growth Review", "In progress"],
      ["Packet readiness", "18 of 24", "On track"],
      ["Shared template", "Growth + Impact", "Active"],
      ["Team trends", "Aggregate only", "Bounded"],
    ],
    cta: "Talk about Team",
    href: "mailto:hello@boasted.io?subject=Boasted%20Team",
  },
  enterprise: {
    label: "Enterprise",
    icon: Building2,
    eyebrow: "FOR ENTERPRISE",
    title: "Add governance without turning career proof into surveillance.",
    description: "Enterprise is for organizations that need stronger administration, identity, retention, policy, and integration controls while preserving the line between an employee's private record and company-facing workflows.",
    features: [
      "Enterprise admin dashboard for workspaces and review programs",
      "Identity and SSO roadmap for larger deployments",
      "Retention policies and administrative governance controls",
      "Audit-oriented history for company-managed workflows",
      "Custom integrations and implementation support",
      "Bounded organization analytics designed for programs, not ranking people",
    ],
    stats: [
      ["Policies", "Managed", "workspace controls"],
      ["Retention", "Configurable", "company workflows"],
      ["Analytics", "Bounded", "no leaderboard"],
    ],
    rows: [
      ["Identity", "SSO / directory", "Roadmap"],
      ["Retention", "Policy controlled", "Managed"],
      ["Review programs", "Multiple workspaces", "Centralized"],
      ["Integrations", "Custom", "Supported"],
    ],
    cta: "Talk about Enterprise",
    href: "mailto:hello@boasted.io?subject=Boasted%20Enterprise",
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    eyebrow: "FOR EDUCATION",
    title: "Turn learning into proof students can actually reuse.",
    description: "Education helps students and early-career users save coursework, projects, certifications, achievements, leadership, and practical experience, then reuse that evidence for résumés, interviews, scholarships, programs, internships, and career exploration.",
    features: [
      "Scholarship Finder with licensed source provenance, filters, query understanding, and provider submissions",
      "Program Finder using U.S. Department of Education College Scorecard data",
      "Federal Internship Finder using live USAJOBS public listings",
      "Major Explorer, Skills from Education, and evidence-connected career directions",
      "Academic Portfolio and education-focused Impact Receipts",
      "Public Education Data & Source Audit documenting approved and blocked sources",
    ],
    stats: [
      ["Scholarships", "Licensed", "source-gated catalog"],
      ["Programs", "Scorecard", "official public data"],
      ["Internships", "USAJOBS", "live federal listings"],
    ],
    rows: [
      ["Student evidence", "Private", "Shared by choice"],
      ["Opportunity search", "Evidence-connected", "Editable"],
      ["Source rights", "Audited", "Public log"],
      ["Predictions", "None", "No fake fit score"],
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
          <a href="#product">What it makes</a>
          <a href="#organizations">Organizations</a>
          <a href="/education">Education</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/login">Log in</a>
          <a className="landing-btn landing-btn-small" href="/register">Start free</a>
        </div>
      </header>

      <section className="landing-hero landing-simple-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><ShieldCheck size={15} /> YOUR PRIVATE CAREER RECORD</div>
          <h1>Remember what you did<span> at work.</span></h1>
          <p className="landing-hero-description">
            Save your wins, results, skills, and proof in one private place. Boasted turns them into résumés, performance reviews, promotion packets, and interview stories.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-btn" href="/register">Start free <ArrowRight size={18} /></a>
            <a className="landing-btn landing-btn-secondary" href="#how-it-works">See how it works</a>
          </div>
          <p className="landing-trust-line">Private by default <span>•</span> You choose what to share <span>•</span> No made-up claims</p>
        </div>

        <div className="landing-proof-preview">
          <div className="preview-glow" />
          <article className="proof-preview-card landing-simple-preview-card">
            <div className="proof-preview-header"><div><p>Saved work</p><span>Private career proof</span></div><div className="proof-preview-avatar">B</div></div>
            <div className="proof-preview-meta">One example you can reuse later</div>
            <h2>Improved a recurring customer escalation workflow</h2>
            <p>Documented the failure pattern, clarified the diagnostic path, and created a reusable troubleshooting guide.</p>
            <div className="proof-preview-result"><span>Why save this?</span><strong>Later, this can become a résumé bullet, review example, promotion proof, or interview story.</strong></div>
            <div className="proof-preview-tags"><span>Result</span><span>Skills</span><span>Evidence</span></div>
          </article>
        </div>
      </section>

      <section className="landing-workflow premium-workflow landing-simple-workflow" id="how-it-works">
        <div className="landing-section-heading">
          <p>HOW BOASTED WORKS</p>
          <h2>Save it → Prove it → Use it</h2>
          <span>Boasted is a private notebook for the good things you do at work — except it can turn those notes into useful career tools later.</span>
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
        <div className="landing-simple-receipt-note">
          <Sparkles size={20} />
          <div><strong>Impact Receipts keep an important win together.</strong><span>What you did, what happened, the evidence, skills, and credit stay connected so you can reuse the story without exaggerating it.</span></div>
        </div>
      </section>

      <section className="landing-use-cases landing-simple-products" id="product">
        <div className="landing-section-heading">
          <p>WHAT BOASTED MAKES FOR YOU</p>
          <h2>Use the work you already saved.</h2>
          <span>You should not have to remember your whole career from scratch every time someone asks what you have done.</span>
        </div>
        <div className="use-case-grid landing-simple-output-grid">
          {outputs.map(({ icon: Icon, ...item }) => (
            <article className="use-case-card" id={item.id} key={item.id}>
              <div className="use-case-icon"><Icon size={21} /></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-org-section" id="organizations">
        <div className="landing-section-heading landing-org-heading">
          <p>FOR ORGANIZATIONS & EDUCATION</p>
          <h2>Different workspaces. Same proof-first idea.</h2>
          <span>Choose a tab to see how Boasted can support a team, a larger organization, or students without making private proof a surveillance feed.</span>
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
              {organization.features.map((feature) => <div key={feature}><Check size={17} /> <span>{feature}</span></div>)}
            </div>
            <a className="landing-btn" href={organization.href}>{organization.cta} <ArrowRight size={17} /></a>
          </div>

          <div className="landing-org-dashboard">
            <div className="landing-org-dashboard-title"><LayoutDashboard size={19} /><div><span>Workspace preview</span><strong>{organization.label}</strong></div></div>
            <div className="landing-org-stats">
              {organization.stats.map(([label, value, detail]) => (
                <div key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
              ))}
            </div>
            <div className="landing-org-table">
              {organization.rows.map(([label, value, status]) => (
                <div className="landing-org-row" key={label}><span>{label}</span><strong>{value}</strong><em>{status}</em></div>
              ))}
            </div>
            <div className="landing-org-privacy"><ShieldCheck size={17} /><span>{organizationTab === "education" ? "Student proof stays private unless the user chooses to share it." : "Private employee notes are not exposed as a manager activity feed."}</span></div>
          </div>
        </div>
      </section>

      <section className="landing-feature-section landing-simple-trust" id="security">
        <div className="landing-feature-copy">
          <p className="landing-mini-label">YOUR WORK STAYS YOURS</p>
          <h2>Private first. Share only when you want to.</h2>
          <p>Your private work record is for you. Boasted helps organize what you save; it does not turn your day-to-day work into an employer score.</p>
          <div className="landing-feature-list">
            <div><ShieldCheck size={17} /> Private proof stays behind your account.</div>
            <div><ShieldCheck size={17} /> Public profiles show only what you choose to publish.</div>
            <div><ShieldCheck size={17} /> Boasted does not invent results, credentials, or proof.</div>
            <div><ShieldCheck size={17} /> You can keep confidential details out while still saving the career value of the work.</div>
          </div>
        </div>
        <div className="feature-dashboard-preview landing-simple-trust-card">
          <div className="feature-preview-header"><div><span>Default</span><strong>Private</strong></div><div><span>Sharing</span><strong>Your choice</strong></div></div>
          <div className="feature-preview-entry"><div><span className="feature-preview-badge">Simple rule</span><small>You stay in control</small></div><h3>Save the useful part. Leave secrets out.</h3><p>Keep the result, skill, lesson, and credit you are allowed to keep. Do not upload employer secrets, customer secrets, or anything your agreements say you cannot store.</p></div>
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="landing-section-heading">
          <p>PRICING</p>
          <h2>Start free. Grow into Team or Enterprise.</h2>
          <span>All four plans stay visible. Pro is temporarily complimentary during early access; Team and Enterprise are available for company conversations.</span>
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
        <div><p>YOUR WORK IS ALREADY HAPPENING.</p><h2>Do not make your future self remember all of it.</h2><span>Save your best work now so it is ready when you need a résumé, review, promotion case, or interview story.</span></div>
        <a className="landing-btn landing-final-button" href="/register">Start free <ArrowRight size={18} /></a>
      </section>

      <footer className="mega-footer landing-simple-footer">
        <div className="mega-footer-brand"><a className="landing-logo" href="/">Boasted</a><p>A private place to remember and reuse your best work.</p><a className="footer-cta" href="/register">Start free <ArrowRight size={15} /></a></div>
        <div className="mega-footer-columns landing-simple-footer-columns">
          <div><h3>Product</h3><a href="#product">What Boasted makes</a><a href="#how-it-works">How it works</a><a href="#security">Privacy</a></div>
          <div><h3>Organizations</h3><a href="#organizations" onClick={() => setOrganizationTab("team")}>Teams</a><a href="#organizations" onClick={() => setOrganizationTab("enterprise")}>Enterprise</a><a href="/education">Education</a></div>
          <div><h3>Account</h3><a href="/login">Log in</a><a href="/register">Create account</a><a href="#pricing">Pricing</a></div>
          <div><h3>Legal & trust</h3><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal/education-data">Education data audit</a></div>
        </div>
        <div className="mega-footer-bottom"><span>© 2026 Boasted</span><span>Private by default · Your proof stays yours.</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
      </footer>
    </main>
  );
}

export default LandingPage;
