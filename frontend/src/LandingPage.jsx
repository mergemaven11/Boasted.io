import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  FileText,
  GraduationCap,
  Link2,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import "./LandingPage.css";
import "./LandingPageMonetization.css";

const useCases = [
  { icon: TrendingUp, title: "Promotions", description: "Walk into promotion conversations with organized proof of impact, growth, and added responsibility." },
  { icon: MessageSquare, title: "Interviews", description: "Turn real accomplishments into confident stories instead of trying to remember examples under pressure." },
  { icon: FileText, title: "Performance reviews", description: "Build your review throughout the year instead of reconstructing twelve months of work the night before." },
  { icon: Users, title: "1:1 meetings", description: "Bring wins, blockers, lessons, and progress into every conversation with your manager." },
  { icon: Target, title: "Clients and coaching", description: "Document milestones, completed goals, measurable results, and evidence over time." },
  { icon: Briefcase, title: "Freelancers", description: "Turn completed projects into client updates, case studies, testimonials, and proof of value." },
  { icon: GraduationCap, title: "Career changers", description: "Track projects, certifications, new skills, and portfolio evidence as your career develops." },
  { icon: Sparkles, title: "Creators and founders", description: "Capture launches, experiments, customer wins, audience growth, and business milestones." },
];

const workflowSteps = [
  { number: "01", title: "Capture", description: "Save the work while the context is fresh: what happened, what you did, what changed, and what supports it." },
  { number: "02", title: "Prove", description: "Turn important accomplishments into Impact Receipts with contribution, result, evidence, skills, and shared credit." },
  { number: "03", title: "Package", description: "Reuse selected evidence for reviews, promotions, résumés, interview stories, packets, and career analytics." },
  { number: "04", title: "Share", description: "Publish only the proof you choose through a selective Proof Profile while the rest stays private." },
  { number: "05", title: "Connect", description: "When your proof creates interest, opt in to a conversation path without exposing a private calendar or work history." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    tagline: "Start your evidence record",
    features: ["5 proof entries", "1 Impact Receipt", "Basic reports", "Basic Proof Profile", "Skill tracking"],
    cta: "Start free",
    href: "/register",
  },
  {
    name: "Pro",
    price: "$9",
    suffix: "/month",
    tagline: "Turn your evidence into career leverage",
    featured: true,
    badge: "Best for your career",
    features: ["Unlimited proof + Impact Receipts", "Advanced career analytics", "Performance Review Builder", "Promotion Packet", "PDF and career exports", "Advanced profile capabilities"],
    cta: "Unlock BragStack Pro",
    href: "/upgrade",
  },
  {
    name: "Team",
    price: "$15",
    suffix: "/user / month",
    tagline: "Support growth without surveillance",
    badge: "Coming soon",
    features: ["Everything in Pro", "Shared review templates", "Optional manager confirmation", "Review-cycle packets", "Bounded organization analytics", "Centralized billing"],
    cta: "Join Team waitlist",
    href: "mailto:hello@bragstack.app?subject=BragStack%20Team%20waitlist",
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "Governance for larger organizations",
    features: ["Everything in Team", "Enterprise identity roadmap", "Audit and governance controls", "Retention controls", "Admin policy controls", "Custom integrations and support"],
    cta: "Contact us",
    href: "mailto:hello@bragstack.app?subject=BragStack%20Enterprise",
  },
];

const productDetails = [
  {
    id: "product-impact-receipts",
    icon: ReceiptText,
    title: "Impact Receipts",
    description: "BragStack's signature evidence object: what happened, what you contributed, the result, supporting evidence, skills, measurable outcomes when you have them, and shared credit. Unsupported details stay unsupported instead of being invented.",
  },
  {
    id: "product-public-profiles",
    icon: Link2,
    title: "Proof Profiles",
    description: "A portable professional evidence page built from the accomplishments and Impact Receipts you intentionally choose to publish. Your private workspace and unshared evidence stay private.",
  },
  {
    id: "product-reports",
    icon: FileText,
    title: "Professional Packets",
    description: "Package selected evidence for reviews, promotions, interviews, résumés, and other career moments without rebuilding your work history from memory.",
  },
  {
    id: "product-career-analytics",
    icon: BarChart3,
    title: "Career Analytics",
    description: "See patterns across the evidence you captured: recurring skills, categories of impact, activity over time, and evidence coverage. BragStack does not turn those patterns into an employee score.",
  },
  {
    id: "product-open-to-talk",
    icon: MessageSquare,
    title: "Open to Talk",
    description: "An opt-in connection path for people who want to discuss the proof you shared. The first version is designed around user-controlled contact or booking links, not access to your private calendar.",
  },
];

const solutionDetails = [
  {
    id: "solution-performance-reviews",
    title: "Performance Reviews",
    description: "Capture wins throughout the cycle, then use the evidence later instead of reconstructing months of work from memory.",
  },
  {
    id: "solution-promotions",
    title: "Promotions",
    description: "Build a record of scope, ownership, outcomes, leadership, and growth, then organize that evidence into a stronger promotion case.",
  },
  {
    id: "solution-interviews",
    title: "Interviews",
    description: "Keep real situations, actions, outcomes, skills, and evidence close at hand so interview stories come from documented work.",
  },
  {
    id: "solution-freelancers",
    title: "Freelancers",
    description: "Track project outcomes, client value, measurable results, testimonials or evidence references, and reusable case-study material across engagements.",
  },
  {
    id: "solution-teams",
    title: "Teams",
    description: "Use employee-approved evidence for recognition and review workflows while keeping individual ownership separate from bounded organization analytics.",
  },
];

function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/">BragStack</a>
        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#product">Product</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/login">Log in</a>
          <a className="landing-btn landing-btn-small" href="/register">Start free</a>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><ShieldCheck size={15} />NEW BRAGSTACK · CAREER EVIDENCE, NOT JUST CLAIMS</div>
          <h1>Your work deserves<span> receipts.</span></h1>
          <p className="landing-hero-description">
            BragStack helps you capture wins, attach evidence, and turn important work into Impact Receipts. Reuse that proof for performance reviews, promotions, résumés, interviews, and a selective public Proof Profile.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-btn" href="/register">Start my BragStack <ArrowRight size={18} /></a>
            <a className="landing-btn landing-btn-secondary" href="#product">See what&apos;s new</a>
          </div>
          <p className="landing-trust-line">Impact Receipts <span>•</span> Proof Profiles <span>•</span> Professional Packets <span>•</span> Open to Talk</p>
          <p className="landing-trust-line">Private by default <span>•</span> Evidence-backed <span>•</span> You choose what becomes public</p>
        </div>

        <div className="landing-proof-preview">
          <div className="preview-glow" />
          <article className="proof-preview-card">
            <div className="proof-preview-header"><div><p>Impact Receipt</p><span>Evidence-linked</span></div><div className="proof-preview-avatar">B</div></div>
            <div className="proof-preview-meta">Selected professional evidence</div>
            <h2>Improved a recurring customer escalation workflow</h2>
            <p>Documented the failure pattern, clarified the diagnostic path, and created a reusable troubleshooting guide.</p>
            <div className="proof-preview-result"><span>Result</span><strong>A clearer, repeatable resolution path backed by the evidence the user chose to attach.</strong></div>
            <div className="proof-preview-tags"><span>Contribution</span><span>Evidence</span><span>Shared credit</span></div>
          </article>
          <div className="floating-proof-card floating-proof-top"><span>Default visibility</span><strong>Private</strong></div>
          <div className="floating-proof-card floating-proof-bottom"><span>Public proof</span><strong>You choose</strong></div>
        </div>
      </section>

      <section className="landing-workflow premium-workflow" id="how-it-works">
        <div className="landing-section-heading">
          <p>ONE PORTABLE EVIDENCE LOOP</p>
          <h2>Capture → Prove → Package → Share → Connect</h2>
          <span>Capture the work once, keep the evidence under your control, then reuse the right proof when a career moment needs it.</span>
        </div>
        <div className="career-flow" aria-label="BragStack evidence workflow">
          <span>Capture</span><ArrowRight size={18} /><span>Prove</span><ArrowRight size={18} /><span>Package</span><ArrowRight size={18} /><span>Share</span><ArrowRight size={18} /><span>Connect</span>
        </div>
        <div className="premium-workflow-grid">{workflowSteps.map((step) => <article className="workflow-card premium-workflow-card" key={step.number}><span className="workflow-number">{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      </section>

      <section className="landing-problem-section">
        <div className="landing-section-heading">
          <p>WHY IT EXISTS</p><h2>Your career is happening faster than your memory can track it.</h2>
          <span>Projects ship. Praise disappears into chat. Metrics move. Teams change. BragStack gives the evidence somewhere durable to live before the context disappears.</span>
        </div>
        <div className="problem-card-grid">
          <article className="problem-card"><span>01</span><h3>Capture while it is fresh</h3><p>Keep the situation, contribution, result, skills, and source evidence connected.</p></article>
          <article className="problem-card"><span>02</span><h3>Prove without exaggerating</h3><p>Impact Receipts preserve what is supported and leave unsupported claims out.</p></article>
          <article className="problem-card"><span>03</span><h3>Reuse when it matters</h3><p>Turn selected proof into the story a review, interview, résumé, client, or recruiter needs.</p></article>
        </div>
      </section>

      <section className="landing-use-cases" id="product">
        <div className="landing-section-heading"><p>WHAT&apos;S NEW IN BRAGSTACK</p><h2>One place for your career evidence.</h2><span>Impact Receipts are the core. Proof Profiles, Professional Packets, Career Analytics, and Open to Talk help you use that evidence when it matters.</span></div>
        <div className="use-case-grid">{productDetails.map(({ icon: Icon, ...item }) => <article className="use-case-card" id={item.id} key={item.id}><div className="use-case-icon"><Icon size={21} /></div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
      </section>

      <section className="landing-use-cases" id="use-cases">
        <div className="landing-section-heading"><p>BUILT FOR REAL CAREER MOMENTS</p><h2>Useful whenever progress needs to be proven.</h2><span>BragStack is not a social feed or a workplace surveillance system. It is your portable evidence record for the moments when your work needs to speak clearly.</span></div>
        <div className="use-case-grid">{useCases.map(({ icon: Icon, title, description }) => <article className="use-case-card" key={title}><div className="use-case-icon"><Icon size={21} /></div><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="landing-feature-section">
        <div className="landing-feature-copy"><p className="landing-mini-label">IMPACT RECEIPTS</p><h2>Your work deserves receipts.</h2><p>Important accomplishments become structured, reusable proof with contribution, result, evidence, skills, measurable outcomes when available, and shared credit.</p><div className="landing-feature-list"><div><Check size={17} /> Evidence stays attached to the claim it supports</div><div><Check size={17} /> Shared work preserves shared credit</div><div><Check size={17} /> Public visibility is explicit, never assumed</div><div><Check size={17} /> AI assistance cannot silently become career evidence</div></div></div>
        <div className="feature-dashboard-preview"><div className="feature-preview-header"><div><span>Evidence state</span><strong>User controlled</strong></div><div><span>Visibility</span><strong>Private by default</strong></div></div><div className="feature-preview-entry"><div><span className="feature-preview-badge">Impact Receipt</span><small>Portable career evidence</small></div><h3>Contribution → Result → Evidence</h3><p>The receipt keeps the story and its support connected, so the same proof can later power a review, packet, résumé, interview story, or selected public profile.</p><div className="feature-preview-tags"><span>Evidence</span><span>Skills</span><span>Credit</span></div></div></div>
      </section>

      <section className="landing-use-cases" id="solutions">
        <div className="landing-section-heading"><p>SOLUTIONS</p><h2>Package the same proof for the conversation in front of you.</h2><span>The evidence remains yours; BragStack changes how selected evidence is organized for each career moment.</span></div>
        <div className="use-case-grid">{solutionDetails.map((item) => <article className="use-case-card" id={item.id} key={item.id}><div className="use-case-icon"><Target size={21} /></div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
      </section>

      <section className="landing-feature-section" id="security">
        <div className="landing-feature-copy">
          <p className="landing-mini-label">TRUST MODEL</p>
          <h2>Your work record belongs to you.</h2>
          <p>BragStack starts private and makes sharing selective. It is designed to help people document and use their own evidence, not to turn daily work into an employer surveillance stream.</p>
          <div className="landing-feature-list">
            <div><ShieldCheck size={17} /> Private account data and private proof stay behind authentication.</div>
            <div><ShieldCheck size={17} /> Public profiles expose only content the user intentionally publishes.</div>
            <div><ShieldCheck size={17} /> BragStack does not invent verification, metrics, credentials, outcomes, or employment claims.</div>
            <div><ShieldCheck size={17} /> Team and enterprise analytics remain separated from individual evidence ownership and avoid employee scoring.</div>
            <div><ShieldCheck size={17} /> Open to Talk is opt-in and does not require exposing private calendar details.</div>
          </div>
        </div>
        <div className="feature-dashboard-preview">
          <div className="feature-preview-header"><div><span>Default visibility</span><strong>Private</strong></div><div><span>Sharing</span><strong>Selective</strong></div></div>
          <div className="feature-preview-entry"><div><span className="feature-preview-badge">Design principle</span><small>Employee first</small></div><h3>No surveillance. No manufactured proof.</h3><p>BragStack helps people capture, support, package, and selectively share evidence they control. Organization features must not weaken that ownership model.</p><div className="feature-preview-tags"><span>Private by default</span><span>No scoring</span><span>User controlled</span></div></div>
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="landing-section-heading"><p>PRICING</p><h2>Start your evidence record free.</h2><span>Upgrade when you want to package, analyze, and reuse more of the proof you have already captured.</span></div>
        <div className="pricing-grid pricing-grid-four">{plans.map((plan) => <article className={`pricing-card ${plan.featured ? "pricing-card-featured pricing-card-pro" : ""}`} key={plan.name}>{plan.badge && <div className="pricing-popular-label">{plan.badge}</div>}<div className="pricing-card-header"><div><p>{plan.name}</p><h3>{plan.price}{plan.suffix && <span>{plan.suffix}</span>}</h3></div></div><p className="pricing-tagline">{plan.tagline}</p><ul>{plan.features.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}</ul><a className={`landing-btn pricing-button ${plan.featured ? "" : "landing-btn-secondary"}`} href={plan.href}>{plan.cta}{plan.featured && <ArrowRight size={17} />}</a></article>)}</div>
        <div className="pricing-conversion-note"><Zap size={20} /><div><strong>Your existing proof stays yours.</strong><span>Start with capture and Impact Receipts. Upgrade when you are ready to do more with the evidence.</span></div></div>
      </section>

      <section className="landing-final-cta"><div><p>YOUR WORK IS ALREADY HAPPENING.</p><h2>Give the proof somewhere to live.</h2><span>Capture it now, keep it under your control, and have the right evidence ready when the next review, interview, promotion, client, or opportunity arrives.</span></div><a className="landing-btn landing-final-button" href="/register">Build my BragStack <ArrowRight size={18} /></a></section>

      <footer className="mega-footer">
        <div className="mega-footer-brand"><a className="landing-logo" href="/">BragStack</a><p>The evidence layer for professional growth.</p><a className="footer-cta" href="/register">Start building proof <ArrowRight size={15} /></a></div>
        <div className="mega-footer-columns">
          <div><h3>Product</h3><a href="#product-impact-receipts">Impact Receipts</a><a href="#product-public-profiles">Proof Profiles</a><a href="#product-reports">Professional Packets</a><a href="#product-career-analytics">Career Analytics</a><a href="#product-open-to-talk">Open to Talk</a></div>
          <div><h3>Solutions</h3><a href="#solution-performance-reviews">Performance Reviews</a><a href="#solution-promotions">Promotions</a><a href="#solution-interviews">Interviews</a><a href="#solution-freelancers">Freelancers</a><a href="#solution-teams">Teams</a></div>
          <div><h3>Resources</h3><a href="#how-it-works">How it works</a><a href="#use-cases">Use cases</a><a href="/login">Sign in</a><a href="/register">Create account</a></div>
          <div><h3>Company</h3><a href="mailto:hello@bragstack.app">Contact</a><a href="mailto:hello@bragstack.app?subject=BragStack%20Team%20waitlist">Team waitlist</a><a href="mailto:hello@bragstack.app?subject=BragStack%20Enterprise">Enterprise</a><a href="#security">Trust & privacy</a></div>
        </div>
        <div className="mega-footer-bottom"><span>© 2026 BragStack</span><span>Private by default · Your proof stays yours.</span><div><a href="/login">Log in</a><a href="/register">Start free</a></div></div>
      </footer>
    </main>
  );
}

export default LandingPage;
