import { ArrowRight, Briefcase, FileText, ReceiptText, Search, Target, TrendingUp, UserRound } from "lucide-react";

const PAGE_CONTENT = {
  "/resume-accomplishments": {
    eyebrow: "Resume accomplishments",
    title: "Turn real work accomplishments into stronger resume bullets.",
    description: "BragStack helps you capture the situation, action, measurable result, skills, and evidence behind your work so your resume is built from documented accomplishments instead of memory.",
    icon: FileText,
    points: ["Capture measurable outcomes while they are fresh", "Reuse evidence-backed accomplishments across job applications", "Keep resume material grounded in work you actually performed"],
  },
  "/career-portfolio": {
    eyebrow: "Career portfolio",
    title: "Build a professional portfolio from evidence, not generic claims.",
    description: "Create a private career proof library and selectively publish accomplishments and Impact Receipts as a professional portfolio for hiring managers, recruiters, clients, and collaborators.",
    icon: Briefcase,
    points: ["Private by default", "Choose exactly what becomes public", "Connect accomplishments to evidence, skills, and measurable impact"],
  },
  "/performance-reviews": {
    eyebrow: "Performance reviews",
    title: "Prepare performance reviews from a year of captured proof.",
    description: "Track wins continuously and organize documented impact into review-ready material instead of rebuilding months of work at the last minute.",
    icon: TrendingUp,
    points: ["Document scope, ownership, impact, and growth", "Capture evidence throughout the review cycle", "Generate review material from recorded accomplishments"],
  },
  "/promotion-packet": {
    eyebrow: "Promotion packet",
    title: "Make your promotion case with documented impact.",
    description: "Organize evidence around increased scope, leadership, execution, measurable outcomes, and growth so promotion conversations are supported by a clear record of work.",
    icon: Target,
    points: ["Show progression in scope and responsibility", "Highlight measurable business or technical impact", "Package evidence into a promotion-ready narrative"],
  },
  "/interview-preparation": {
    eyebrow: "Interview preparation",
    title: "Prepare interview stories from accomplishments you already documented.",
    description: "Keep real situations, actions, results, metrics, and skills available for behavioral and technical interviews instead of trying to remember your best examples under pressure.",
    icon: Search,
    points: ["Build STAR-style stories from real work", "Find examples by skill, project, or impact", "Use evidence-backed stories for job interviews"],
  },
  "/impact-receipts": {
    eyebrow: "Impact Receipts",
    title: "Create receipts for the work that moved something forward.",
    description: "Impact Receipts structure an accomplishment around your contribution, result, evidence, skills, shared credit, and visibility so important work becomes reusable career proof.",
    icon: ReceiptText,
    points: ["Attach evidence references", "Record measurable outcomes and shared credit", "Keep receipts private or intentionally publish them"],
  },
  "/career-analytics": {
    eyebrow: "Career analytics",
    title: "See the patterns across your accomplishments and skills.",
    description: "BragStack turns captured proof into a clearer view of recurring skills, categories of impact, evidence coverage, ownership patterns, and career activity over time.",
    icon: TrendingUp,
    points: ["Track recurring skills", "See where your strongest evidence exists", "Identify career signals across your documented work"],
  },
  "/public-proof-profiles": {
    eyebrow: "Public proof profiles",
    title: "Share selected career proof without exposing your entire work history.",
    description: "Create a public professional proof profile from only the accomplishments and Impact Receipts you intentionally choose to share with recruiters, hiring managers, clients, or your network.",
    icon: UserRound,
    points: ["Private account by default", "Granular public visibility", "A shareable proof layer for resumes and portfolios"],
  },
};

export function getSeoLandingPage(path) {
  return PAGE_CONTENT[path] || null;
}

function SeoLandingPage({ content }) {
  const Icon = content.icon;
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/">BragStack</a>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/login">Log in</a>
          <a className="landing-btn landing-btn-small" href="/register">Start free</a>
        </div>
      </header>

      <section className="landing-hero" style={{ minHeight: "auto", paddingBottom: 48 }}>
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><Icon size={16} />{content.eyebrow}</div>
          <h1>{content.title}</h1>
          <p className="landing-hero-description">{content.description}</p>
          <div className="landing-hero-actions">
            <a className="landing-btn" href="/register">Start building career proof <ArrowRight size={18} /></a>
            <a className="landing-btn landing-btn-secondary" href="/#how-it-works">How BragStack works</a>
          </div>
        </div>
      </section>

      <section className="landing-problem-section">
        <div className="landing-section-heading">
          <p>BUILT FOR CAREER PROOF</p>
          <h2>Use documented accomplishments everywhere your work needs to speak for you.</h2>
        </div>
        <div className="problem-card-grid">
          {content.points.map((point, index) => (
            <article className="problem-card" key={point}>
              <span>0{index + 1}</span>
              <h3>{point}</h3>
              <p>BragStack keeps the source accomplishment connected to the context and proof behind it.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-feature-section">
        <div className="landing-feature-copy">
          <p className="landing-mini-label">ONE CAREER PROOF SYSTEM</p>
          <h2>Resumes, portfolios, interviews, reviews, promotions, and job searches can start from the same evidence.</h2>
          <p>Capture once, organize the proof, and reuse it when the next career opportunity arrives.</p>
          <a className="landing-btn" href="/register">Create your BragStack <ArrowRight size={18} /></a>
        </div>
      </section>
    </main>
  );
}

export default SeoLandingPage;
