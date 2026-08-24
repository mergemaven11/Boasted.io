import { useEffect } from "react";
import {
  ArrowRight,
  Briefcase,
  FileText,
  ReceiptText,
  Search,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { getSeoSitelinkTitle } from "./seoSitelinkMeta.js";

const ICONS = {
  briefcase: Briefcase,
  file: FileText,
  receipt: ReceiptText,
  search: Search,
  target: Target,
  trend: TrendingUp,
  user: UserRound,
};

const SITELINKS = [
  ["How BragStack Works", "/how-it-works"],
  ["Impact Receipts", "/impact-receipts"],
  ["Resume Accomplishments", "/resume-accomplishments"],
  ["Performance Reviews", "/performance-reviews"],
  ["Career Portfolio", "/career-portfolio"],
  ["Pricing", "/pricing"],
];

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value);
}

function SeoLandingPage({ content }) {
  const Icon = ICONS[content.icon] || FileText;
  const path = window.location.pathname.replace(/\/$/, "") || "/";

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
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/">BragStack</a>
        <nav className="landing-nav-links" aria-label="BragStack">
          <a href="/how-it-works">How it works</a>
          <a href="/impact-receipts">Impact Receipts</a>
          <a href="/pricing">Pricing</a>
        </nav>
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
            <a className="landing-btn landing-btn-secondary" href="/how-it-works">How BragStack works</a>
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
          <p className="landing-mini-label">EXPLORE BRAGSTACK</p>
          <h2>Career proof for the moments that matter.</h2>
          <div className="problem-card-grid">
            {SITELINKS.filter(([, href]) => href !== path).map(([label, href], index) => (
              <a className="problem-card" href={href} key={href} style={{ textDecoration: "none" }}>
                <span>0{index + 1}</span>
                <h3>{label}</h3>
                <p>Learn more about {label.toLowerCase()} →</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default SeoLandingPage;
