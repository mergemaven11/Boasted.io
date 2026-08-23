import { ArrowRight, Briefcase, FileText, ReceiptText, Search, Target, TrendingUp, UserRound } from "lucide-react";

const ICONS = {
  briefcase: Briefcase,
  file: FileText,
  receipt: ReceiptText,
  search: Search,
  target: Target,
  trend: TrendingUp,
  user: UserRound,
};

function SeoLandingPage({ content }) {
  const Icon = ICONS[content.icon] || FileText;
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
