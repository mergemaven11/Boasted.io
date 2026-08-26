import { useEffect } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  FileText,
  ReceiptText,
  Search,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { getSeoSitelinkTitle } from "./seoSitelinkMeta.js";
import { PRIMARY_SITELINKS } from "./seoSitelinks.js";

const ICONS = {
  briefcase: Briefcase,
  file: FileText,
  receipt: ReceiptText,
  search: Search,
  target: Target,
  trend: TrendingUp,
  user: UserRound,
};

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value);
}

function SeoLandingPage({ content }) {
  const Icon = ICONS[content.icon] || FileText;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const relatedLinks = PRIMARY_SITELINKS.filter(({ href }) => href !== path && href !== "/login").slice(0, 4);

  useEffect(() => {
    const title = getSeoSitelinkTitle(path, `${content.eyebrow} | BragStack`);
    const canonicalUrl = `https://usebragstack.com${path}`;

    document.title = title;
    setMetaContent('meta[name="description"]', content.description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', content.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', content.description);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;
  }, [content, path]);

  return (
    <main className="landing-page seo-product-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/" aria-label="BragStack home">BragStack</a>
        <nav className="landing-nav-links" aria-label="BragStack products">
          <a href="/resume-accomplishments">Resume Builder</a>
          <a href="/interview-preparation">Interview Prep</a>
          <a href="/impact-receipts">Impact Receipts</a>
          <a href="/pricing">Pricing</a>
        </nav>
        <div className="landing-nav-actions">
          <a className="landing-login-link" href="/login">Sign in</a>
          <a className="landing-btn landing-btn-small" href="/register">Start free</a>
        </div>
      </header>

      <section className="seo-product-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><Icon size={16} />{content.eyebrow}</div>
          <h1>{content.title}</h1>
          <p className="landing-hero-description">{content.description}</p>
          <div className="landing-hero-actions">
            <a className="landing-btn" href="/register">Start free <ArrowRight size={18} /></a>
            <a className="landing-btn landing-btn-secondary" href="/how-it-works">See how it works</a>
          </div>
          <div className="seo-trust-row" aria-label="BragStack benefits">
            <span><Check size={15} /> No credit card</span>
            <span><Check size={15} /> Your proof stays connected</span>
            <span><Check size={15} /> Built for real career moments</span>
          </div>
        </div>

        <aside className="seo-product-summary" aria-label={`${content.eyebrow} overview`}>
          <span className="seo-summary-label">WHAT YOU GET</span>
          <div className="seo-summary-icon"><Icon size={28} /></div>
          <h2>Turn your work into career-ready proof.</h2>
          <p>Capture the context behind what you did, then reuse that evidence when a resume, interview, or opportunity needs it.</p>
          <div className="seo-summary-list">
            {content.points.slice(0, 3).map((point) => <span key={point}><Check size={16} /> {point}</span>)}
          </div>
        </aside>
      </section>

      <section className="seo-value-section">
        <div className="landing-section-heading">
          <p>BUILT AROUND YOUR EVIDENCE</p>
          <h2>Useful when your work needs to speak for you.</h2>
          <span className="seo-section-copy">Keep the accomplishment, context, result, and supporting proof together instead of rebuilding your story every time.</span>
        </div>
        <div className="seo-value-grid">
          {content.points.map((point, index) => (
            <article className="seo-value-card" key={point}>
              <span className="seo-card-number">0{index + 1}</span>
              <h3>{point}</h3>
              <p>Use the evidence already in your BragStack to make this career moment clearer, faster, and easier to support.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-explore-section">
        <div className="seo-explore-heading">
          <div>
            <p className="landing-mini-label">EXPLORE BRAGSTACK</p>
            <h2>One career story. Connected tools.</h2>
          </div>
          <p>Move between the tools without losing the evidence behind your work.</p>
        </div>
        <nav className="seo-related-grid" aria-label="Related BragStack pages">
          {relatedLinks.map(({ label, href }) => (
            <a className="seo-related-card" href={href} key={href}>
              <span>{label}</span>
              <ArrowRight size={18} />
            </a>
          ))}
        </nav>
      </section>

      <section className="seo-final-cta">
        <div>
          <p className="landing-mini-label">YOUR WORK ALREADY HAPPENED</p>
          <h2>Make sure you can prove it.</h2>
          <p>Start building a career record you can actually use when the next opportunity arrives.</p>
        </div>
        <a className="landing-btn" href="/register">Build your BragStack <ArrowRight size={18} /></a>
      </section>
    </main>
  );
}

export default SeoLandingPage;