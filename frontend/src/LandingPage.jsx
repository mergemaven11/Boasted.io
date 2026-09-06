import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  FileText,
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

const individualSteps = [
  {
    number: "01",
    title: "Save it",
    description: "Write down what you accomplished before the details disappear.",
  },
  {
    number: "02",
    title: "Prove it",
    description: "Add the result, skills, evidence, and shared credit that belong with the work.",
  },
  {
    number: "03",
    title: "Use it",
    description: "Turn the same saved work into a résumé, review, promotion case, or interview story.",
  },
];

const companySteps = [
  {
    number: "01",
    title: "Employees keep the record",
    description: "People save their own wins, results, skills, and evidence as work happens.",
  },
  {
    number: "02",
    title: "Share only what matters",
    description: "Employees choose what enters a review, promotion, development, or confirmation workflow.",
  },
  {
    number: "03",
    title: "Run better conversations",
    description: "Managers get clearer evidence for reviews and growth without turning Boasted into monitoring software.",
  },
];

const individualOutputs = [
  {
    id: "product-resume",
    icon: FileText,
    title: "ATS-friendly résumés",
    description: "Build from your saved work or import an existing résumé and clean it up.",
  },
  {
    id: "product-review",
    icon: TrendingUp,
    title: "Performance reviews",
    description: "Pull together the wins and results that show what changed because of your work.",
  },
  {
    id: "product-promotion",
    icon: Target,
    title: "Promotion packets",
    description: "Organize proof of scope, ownership, growth, and impact for advancement conversations.",
  },
  {
    id: "product-interview",
    icon: MessageSquare,
    title: "Interview practice",
    description: "Turn real accomplishments into stories you can explain clearly under pressure.",
  },
  {
    id: "product-profile",
    icon: Sparkles,
    title: "Proof Profiles",
    description: "Share only the work you choose while the rest of your private record stays private.",
  },
];

const companyOutputs = [
  {
    id: "company-reviews",
    icon: TrendingUp,
    title: "Better performance reviews",
    description: "Employees arrive with real examples from the whole review period, not just what everyone remembers from last week.",
  },
  {
    id: "company-promotions",
    icon: Target,
    title: "Clearer promotion cases",
    description: "Bring scope, ownership, results, and growth into advancement conversations with a more consistent evidence trail.",
  },
  {
    id: "company-development",
    icon: Users,
    title: "More useful growth conversations",
    description: "Help people see recurring strengths, emerging skills, and gaps they may want to develop next.",
  },
  {
    id: "company-governance",
    icon: ShieldCheck,
    title: "Governed workflows",
    description: "Use shared templates, optional manager confirmation, retention controls, and bounded organization analytics without employee scoring.",
  },
  {
    id: "company-admin",
    icon: Building2,
    title: "Less review-cycle scrambling",
    description: "Reuse employee-approved proof across review, promotion, and development workflows instead of rebuilding context from scratch.",
  },
];

const individualPlans = [
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
];

const companyPlans = [
  {
    name: "Team",
    price: "$15",
    suffix: "/user / month",
    tagline: "For growing teams that want better career conversations without surveillance",
    badge: "Coming soon",
    featured: true,
    features: ["Everything in Pro", "Shared review templates", "Optional manager confirmation", "Review-cycle packets", "Bounded organization analytics", "Centralized billing"],
    cta: "Talk about Team",
    href: "mailto:hello@boasted.io?subject=Boasted%20Team",
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "For larger organizations that need governance, policy controls, and support",
    features: ["Everything in Team", "Enterprise identity roadmap", "Audit and governance controls", "Retention controls", "Admin policy controls", "Custom integrations and support"],
    cta: "Talk about Enterprise",
    href: "mailto:hello@boasted.io?subject=Boasted%20Enterprise",
  },
];

function LandingPage() {
  const [audience, setAudience] = useState("individual");
  const isCompany = audience === "company";
  const steps = isCompany ? companySteps : individualSteps;
  const outputs = isCompany ? companyOutputs : individualOutputs;
  const plans = isCompany ? companyPlans : individualPlans;

  return (
    <main className="landing-page landing-page-simple">
      <header className="landing-nav">
        <a className="landing-logo" href="/">Boasted</a>
        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#product">{isCompany ? "Company value" : "What it makes"}</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/login">Log in</a>
          <a className="landing-btn landing-btn-small" href={isCompany ? "mailto:hello@boasted.io?subject=Boasted%20for%20my%20company" : "/register"}>{isCompany ? "Talk to us" : "Start free"}</a>
        </div>
      </header>

      <section className="landing-hero landing-simple-hero">
        <div className="landing-hero-copy">
          <div className="landing-audience-toggle" role="group" aria-label="Choose who Boasted is for">
            <button type="button" className={!isCompany ? "active" : ""} aria-pressed={!isCompany} onClick={() => setAudience("individual")}>For me</button>
            <button type="button" className={isCompany ? "active" : ""} aria-pressed={isCompany} onClick={() => setAudience("company")}>Teams &amp; enterprise</button>
          </div>

          {isCompany ? (
            <>
              <div className="landing-eyebrow"><Building2 size={15} /> FOR TEAMS &amp; ENTERPRISE</div>
              <h1>Help people show their work.<span> Without surveillance.</span></h1>
              <p className="landing-hero-description">
                Boasted gives employees a private place to save proof of their work, then helps companies run clearer reviews, promotions, and development conversations using employee-approved evidence.
              </p>
              <div className="landing-hero-actions">
                <a className="landing-btn" href="mailto:hello@boasted.io?subject=Boasted%20for%20my%20company">Talk to us <ArrowRight size={18} /></a>
                <a className="landing-btn landing-btn-secondary" href="#product">See company value</a>
              </div>
              <p className="landing-trust-line">Employee-owned proof <span>•</span> Optional manager confirmation <span>•</span> No employee scoring</p>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="landing-proof-preview">
          <div className="preview-glow" />
          <article className="proof-preview-card landing-simple-preview-card">
            {isCompany ? (
              <>
                <div className="proof-preview-header"><div><p>Company outcome</p><span>Employee-approved evidence</span></div><div className="proof-preview-avatar">B</div></div>
                <div className="proof-preview-meta">A better review conversation</div>
                <h2>Less recency bias. More complete context.</h2>
                <p>Employees bring documented wins and results from across the review period instead of rebuilding months of work from memory.</p>
                <div className="proof-preview-result"><span>What the company gets</span><strong>Clearer review and promotion conversations while employees keep control of their private career record.</strong></div>
                <div className="proof-preview-tags"><span>Reviews</span><span>Growth</span><span>Governance</span></div>
              </>
            ) : (
              <>
                <div className="proof-preview-header"><div><p>Saved work</p><span>Private career proof</span></div><div className="proof-preview-avatar">B</div></div>
                <div className="proof-preview-meta">One example you can reuse later</div>
                <h2>Improved a recurring customer escalation workflow</h2>
                <p>Documented the failure pattern, clarified the diagnostic path, and created a reusable troubleshooting guide.</p>
                <div className="proof-preview-result"><span>Why save this?</span><strong>Later, this can become a résumé bullet, review example, promotion proof, or interview story.</strong></div>
                <div className="proof-preview-tags"><span>Result</span><span>Skills</span><span>Evidence</span></div>
              </>
            )}
          </article>
        </div>
      </section>

      <section className="landing-workflow premium-workflow landing-simple-workflow" id="how-it-works">
        <div className="landing-section-heading">
          <p>{isCompany ? "HOW IT WORKS AT A COMPANY" : "HOW BOASTED WORKS"}</p>
          <h2>{isCompany ? "Employee-owned proof → Better people decisions" : "Save it → Prove it → Use it"}</h2>
          <span>{isCompany ? "The company gets better career conversations. Employees keep ownership of their private work record." : "Boasted is a private notebook for the good things you do at work — except it can turn those notes into useful career tools later."}</span>
        </div>
        <div className="premium-workflow-grid landing-simple-step-grid">
          {steps.map((step) => (
            <article className="workflow-card premium-workflow-card" key={step.number}>
              <span className="workflow-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
        <div className="landing-simple-receipt-note">
          <Sparkles size={20} />
          <div>
            <strong>{isCompany ? "Impact Receipts make shared career evidence easier to discuss." : "Impact Receipts are the proof version of an important win."}</strong>
            <span>{isCompany ? "Employees can package contribution, result, evidence, skills, and shared credit into a consistent format when they choose to use it in a company workflow." : "They keep what you did, what happened, the evidence, skills, and credit together so you can reuse the story without exaggerating it."}</span>
          </div>
        </div>
      </section>

      <section className="landing-use-cases landing-simple-products" id="product">
        <div className="landing-section-heading">
          <p>{isCompany ? "WHAT YOUR COMPANY GETS" : "WHAT BOASTED MAKES FOR YOU"}</p>
          <h2>{isCompany ? "Career evidence that helps the company too." : "Use the work you already saved."}</h2>
          <span>{isCompany ? "Use employee-approved proof to make reviews, promotions, and development conversations clearer — without building a surveillance system." : "You should not have to remember your whole career from scratch every time someone asks what you have done."}</span>
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

      <section className="landing-feature-section landing-simple-trust" id="security">
        <div className="landing-feature-copy">
          <p className="landing-mini-label">{isCompany ? "TRUST IS PART OF THE PRODUCT" : "YOUR WORK STAYS YOURS"}</p>
          <h2>{isCompany ? "Company value without employee surveillance." : "Private first. Share only when you want to."}</h2>
          <p>{isCompany ? "Boasted is designed so organizations can support reviews and growth without owning every private career note an employee keeps." : "Your private work record is for you. Boasted helps organize what you save; it does not turn your day-to-day work into an employer score."}</p>
          <div className="landing-feature-list">
            {isCompany ? (
              <>
                <div><ShieldCheck size={17} /> Employees keep private proof private by default.</div>
                <div><ShieldCheck size={17} /> Shared workflows use evidence the employee intentionally brings forward.</div>
                <div><ShieldCheck size={17} /> Manager confirmation is optional and does not rewrite the employee&apos;s private history.</div>
                <div><ShieldCheck size={17} /> Organization analytics are bounded and are not designed as employee scores.</div>
                <div><ShieldCheck size={17} /> Enterprise controls can add governance, retention, policy, and integration support.</div>
              </>
            ) : (
              <>
                <div><ShieldCheck size={17} /> Private proof stays behind your account.</div>
                <div><ShieldCheck size={17} /> Public profiles show only what you choose to publish.</div>
                <div><ShieldCheck size={17} /> Boasted does not invent results, credentials, or proof.</div>
                <div><ShieldCheck size={17} /> You can keep confidential details out while still saving the career value of the work.</div>
              </>
            )}
          </div>
        </div>
        <div className="feature-dashboard-preview landing-simple-trust-card">
          {isCompany ? (
            <>
              <div className="feature-preview-header"><div><span>Private record</span><strong>Employee owned</strong></div><div><span>Shared workflow</span><strong>Intentional</strong></div></div>
              <div className="feature-preview-entry"><div><span className="feature-preview-badge">Manager view</span><small>Only approved context</small></div><h3>See what is needed for the conversation — not everything an employee has saved.</h3><p>Boasted separates private career memory from company-facing review and development workflows.</p></div>
            </>
          ) : (
            <>
              <div className="feature-preview-header"><div><span>Default</span><strong>Private</strong></div><div><span>Sharing</span><strong>Your choice</strong></div></div>
              <div className="feature-preview-entry"><div><span className="feature-preview-badge">Simple rule</span><small>You stay in control</small></div><h3>Save the useful part. Leave secrets out.</h3><p>Keep the result, skill, lesson, and credit you are allowed to keep. Do not upload employer secrets, customer secrets, or anything your agreements say you cannot store.</p></div>
            </>
          )}
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="landing-section-heading">
          <p>PRICING</p>
          <h2>{isCompany ? "Bring Boasted to your company." : "Everyone gets Pro for now."}</h2>
          <span>{isCompany ? "Team is built for growing organizations. Enterprise adds deeper governance, policy, identity, retention, and integration support." : "Boasted Pro is temporarily complimentary during early access. No payment method is required."}</span>
        </div>
        <div className={`pricing-grid ${isCompany ? "landing-business-pricing" : "landing-individual-pricing"}`}>
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
        {isCompany ? (
          <div className="pricing-conversion-note"><ShieldCheck size={20} /><div><strong>Sell better career conversations, not monitoring.</strong><span>Boasted&apos;s company story is stronger when employee ownership, selective sharing, and bounded analytics are part of the value proposition.</span></div></div>
        ) : (
          <div className="pricing-conversion-note"><Zap size={20} /><div><strong>No surprise billing.</strong><span>If paid Pro is offered later, you will have to choose it and complete checkout before you are charged.</span></div></div>
        )}
      </section>

      <section className="landing-final-cta landing-simple-final-cta">
        {isCompany ? (
          <><div><p>BETTER CAREER CONVERSATIONS START WITH BETTER CONTEXT.</p><h2>Give your people a better way to show their work.</h2><span>Talk with us about reviews, promotion workflows, employee growth, governance, and where Boasted can fit inside your company.</span></div><a className="landing-btn landing-final-button" href="mailto:hello@boasted.io?subject=Boasted%20for%20my%20company">Talk to us <ArrowRight size={18} /></a></>
        ) : (
          <><div><p>YOUR WORK IS ALREADY HAPPENING.</p><h2>Do not make your future self remember all of it.</h2><span>Save your best work now so it is ready when you need a résumé, review, promotion case, or interview story.</span></div><a className="landing-btn landing-final-button" href="/register">Start free <ArrowRight size={18} /></a></>
        )}
      </section>

      <footer className="mega-footer landing-simple-footer">
        <div className="mega-footer-brand"><a className="landing-logo" href="/">Boasted</a><p>A private place to remember and reuse your best work.</p><a className="footer-cta" href={isCompany ? "mailto:hello@boasted.io?subject=Boasted%20for%20my%20company" : "/register"}>{isCompany ? "Talk to us" : "Start free"} <ArrowRight size={15} /></a></div>
        <div className="mega-footer-columns landing-simple-footer-columns">
          <div><h3>Product</h3><a href="#product">{isCompany ? "Company value" : "What Boasted makes"}</a><a href="#how-it-works">How it works</a><a href="#security">Privacy</a></div>
          <div><h3>Account</h3><a href="/login">Log in</a><a href="/register">Create account</a><a href="#pricing">Pricing</a></div>
          <div><h3>Company</h3><a href="mailto:hello@boasted.io">Contact</a><a href="mailto:hello@boasted.io?subject=Boasted%20Team">Team</a><a href="mailto:hello@boasted.io?subject=Boasted%20Enterprise">Enterprise</a></div>
        </div>
        <div className="mega-footer-bottom"><span>© 2026 Boasted</span><span>Private by default · Your proof stays yours.</span><div><a href="/login">Log in</a><a href={isCompany ? "mailto:hello@boasted.io?subject=Boasted%20for%20my%20company" : "/register"}>{isCompany ? "Talk to us" : "Start free"}</a></div></div>
      </footer>
    </main>
  );
}

export default LandingPage;
