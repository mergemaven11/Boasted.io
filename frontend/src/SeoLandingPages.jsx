import { useEffect } from "react";
import { ArrowRight, Briefcase, Check, FileText, ReceiptText, Search, Target, TrendingUp, UserRound } from "lucide-react";
import { getSeoSitelinkTitle } from "./seoSitelinkMeta.js";
import { PRIMARY_SITELINKS } from "./seoSitelinks.js";
import "./SeoLandingPages.css";

const ICONS = { briefcase: Briefcase, file: FileText, receipt: ReceiptText, search: Search, target: Target, trend: TrendingUp, user: UserRound };

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value);
}

function SeoLandingPage({ content }) {
  const Icon = ICONS[content.icon] || FileText;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const relatedLinks = PRIMARY_SITELINKS.filter(({ href }) => href !== path && href !== "/login").slice(0, 4);
  const primaryAction = content.primaryAction || { label: "Start free", href: "/register" };
  const secondaryAction = content.secondaryAction || { label: "See how it works", href: "/how-it-works" };
  const trustItems = content.trustItems || ["Private by default", "Evidence stays connected", "Built for real career moments"];

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

  return <main className="landing-page seo-product-page">
    <header className="landing-nav">
      <a className="landing-logo" href="/" aria-label="BragStack home">BragStack</a>
      <nav className="landing-nav-links" aria-label="BragStack products"><a href="/impact-receipts">Impact Receipts</a><a href="/public-proof-profiles">Proof Profiles</a><a href="/professional-packets">Professional Packets</a><a href="/pricing">Pricing</a></nav>
      <div className="landing-nav-actions"><a className="landing-login-link" href="/docs">Docs</a><a className="landing-login-link" href="/login">Sign in</a><a className="landing-btn landing-btn-small" href="/register">Start free</a></div>
    </header>

    <section className="seo-product-hero">
      <div className="landing-hero-copy">
        <div className="landing-eyebrow"><Icon size={16}/>{content.eyebrow}</div>
        {content.status && <div className="seo-status-pill">{content.status}</div>}
        <h1>{content.title}</h1>
        <p className="landing-hero-description">{content.description}</p>
        <div className="landing-hero-actions"><a className="landing-btn" href={primaryAction.href}>{primaryAction.label} <ArrowRight size={18}/></a><a className="landing-btn landing-btn-secondary" href={secondaryAction.href}>{secondaryAction.label}</a></div>
        <div className="seo-trust-row" aria-label="BragStack page principles">{trustItems.map((item) => <span key={item}><Check size={15}/> {item}</span>)}</div>
      </div>
      <aside className="seo-product-summary" aria-label={`${content.eyebrow} overview`}>
        <span className="seo-summary-label">{content.summaryLabel || "WHAT TO KNOW"}</span>
        <div className="seo-summary-icon"><Icon size={28}/></div>
        <h2>{content.summaryTitle || "Turn your work into career-ready proof."}</h2>
        <p>{content.summaryDescription || "Capture the context behind what you did, then reuse that evidence when a resume, interview, review, or opportunity needs it."}</p>
        <div className="seo-summary-list">{content.points.slice(0, 3).map((point) => <span key={point}><Check size={16}/> {point}</span>)}</div>
      </aside>
    </section>

    <section className="seo-value-section">
      <div className="landing-section-heading"><p>{content.sectionEyebrow || "BUILT AROUND YOUR EVIDENCE"}</p><h2>{content.sectionTitle || "Useful when your work needs to speak for you."}</h2><span className="seo-section-copy">{content.sectionDescription || "Keep the accomplishment, context, result, and supporting proof together instead of rebuilding your story every time."}</span></div>
      <div className="seo-value-grid">{content.points.map((point, index) => <article className="seo-value-card" key={point}><span className="seo-card-number">{String(index + 1).padStart(2, "0")}</span><h3>{point}</h3><p>{content.cardDescription || "Use the information already in BragStack to make this professional moment clearer, faster, and easier to support."}</p></article>)}</div>
    </section>

    <section className="seo-explore-section">
      <div className="seo-explore-heading"><div><p className="landing-mini-label">EXPLORE BRAGSTACK</p><h2>One career story. Connected tools.</h2></div><p>Move between the tools without losing the evidence behind your work.</p></div>
      <nav className="seo-related-grid" aria-label="Related BragStack pages">{relatedLinks.map(({ label, href }) => <a className="seo-related-card" href={href} key={href}><span>{label}</span><ArrowRight size={18}/></a>)}</nav>
    </section>

    <section className="seo-final-cta"><div><p className="landing-mini-label">{content.finalEyebrow || "READY WHEN YOU ARE"}</p><h2>{content.finalTitle || "Give your work somewhere useful to live."}</h2><p>{content.finalDescription || "Keep your career proof organized now so you can use the right evidence when the next opportunity arrives."}</p></div><a className="landing-btn" href={primaryAction.href}>{primaryAction.label} <ArrowRight size={18}/></a></section>
  </main>;
}

export default SeoLandingPage;
