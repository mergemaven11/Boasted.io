import { useEffect } from "react";
import { ArrowRight, Briefcase, Check, FileText, ReceiptText, Search, Target, TrendingUp, UserRound } from "lucide-react";
import { getSeoSitelinkTitle } from "./seoSitelinkMeta.js";
import { PRIMARY_SITELINKS } from "./seoSitelinks.js";
import { SEO_GUIDE_LINKS } from "./seoLandingContent.js";
import "./SeoLandingPages.css";

const ICONS = { briefcase: Briefcase, file: FileText, receipt: ReceiptText, search: Search, target: Target, trend: TrendingUp, user: UserRound };

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value);
}

function installContentSchema({ canonicalUrl, title, content }) {
  const scriptId = "boasted-seo-content-schema";
  document.getElementById(scriptId)?.remove();

  if (content.kind !== "guide" && content.kind !== "hub") return () => {};

  const organization = { "@id": "https://boasted.io/#organization" };
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Boasted", item: "https://boasted.io/" },
    { "@type": "ListItem", position: 2, name: "Career Guides", item: "https://boasted.io/guides" },
  ];

  if (content.kind === "guide") {
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: content.eyebrow, item: canonicalUrl });
  }

  const primaryNode = content.kind === "guide"
    ? {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: content.title,
        description: content.description,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
        author: organization,
        publisher: organization,
        about: content.keywords || [],
        isPartOf: { "@id": "https://boasted.io/#website" },
      }
    : {
        "@type": "CollectionPage",
        "@id": canonicalUrl,
        name: title,
        description: content.description,
        isPartOf: { "@id": "https://boasted.io/#website" },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: SEO_GUIDE_LINKS.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: guide.label,
            url: `https://boasted.io${guide.href}`,
          })),
        },
      };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      primaryNode,
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumbs`,
        itemListElement: breadcrumbItems,
      },
    ],
  };

  const script = document.createElement("script");
  script.id = scriptId;
  script.type = "application/ld+json";
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
  return () => script.remove();
}

function GuideBreadcrumbs({ content }) {
  if (content.kind !== "guide" && content.kind !== "hub") return null;
  return (
    <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span aria-hidden="true">/</span>
      {content.kind === "guide" ? <><a href="/guides">Guides</a><span aria-hidden="true">/</span><span aria-current="page">{content.eyebrow}</span></> : <span aria-current="page">Guides</span>}
    </nav>
  );
}

function GuideArticle({ content }) {
  if (content.kind !== "guide" || !content.sections?.length) return null;
  return (
    <article className="seo-guide-article">
      <header className="seo-guide-article-heading">
        <p className="landing-mini-label">PRACTICAL GUIDE</p>
        <h2>Turn career advice into a record you can actually reuse.</h2>
        <p>Use the ideas below as a working system. Keep claims truthful, preserve shared credit, and protect confidential information while you document the work you may need later.</p>
      </header>
      <div className="seo-guide-sections">
        {content.sections.map((section, index) => (
          <section className="seo-guide-section" key={section.heading}>
            <span className="seo-guide-step">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              {section.bullets?.length ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
              {section.example ? <aside className="seo-guide-example"><strong>Example</strong><p>{section.example}</p></aside> : null}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function GuideFaq({ content }) {
  if (content.kind !== "guide" || !content.faq?.length) return null;
  return (
    <section className="seo-guide-faq" aria-labelledby="guide-faq-title">
      <div className="landing-section-heading">
        <p>COMMON QUESTIONS</p>
        <h2 id="guide-faq-title">Questions people ask when they start documenting their work.</h2>
      </div>
      <div className="seo-guide-faq-list">
        {content.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
      </div>
    </section>
  );
}

function GuideHub({ content }) {
  if (content.kind !== "hub") return null;
  return (
    <section className="seo-guide-hub" aria-labelledby="guide-hub-title">
      <div className="landing-section-heading">
        <p>CAREER ACCOMPLISHMENT LIBRARY</p>
        <h2 id="guide-hub-title">Start with the problem you are trying to solve.</h2>
        <span className="seo-section-copy">Each guide teaches a distinct part of the same workflow: capture useful work while it is fresh, preserve the evidence behind it, then reshape that record for the career moment in front of you.</span>
      </div>
      <div className="seo-guide-card-grid">
        {SEO_GUIDE_LINKS.map((guide, index) => (
          <a className="seo-guide-card" href={guide.href} key={guide.href}>
            <span className="seo-card-number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{guide.label}</h3>
            <p>{guide.description}</p>
            <span className="seo-guide-card-action">Read guide <ArrowRight size={17}/></span>
          </a>
        ))}
      </div>
    </section>
  );
}

function SeoLandingPage({ content }) {
  const Icon = ICONS[content.icon] || FileText;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const isGuide = content.kind === "guide";
  const isHub = content.kind === "hub";
  const relatedLinks = isGuide
    ? SEO_GUIDE_LINKS.filter(({ href }) => href !== path).slice(0, 4)
    : isHub
      ? SEO_GUIDE_LINKS
      : PRIMARY_SITELINKS.filter(({ href }) => href !== path && href !== "/login").slice(0, 4);

  useEffect(() => {
    const title = getSeoSitelinkTitle(path, `${content.eyebrow} | Boasted`);
    const canonicalUrl = `https://boasted.io${path}`;
    document.title = title;
    setMetaContent('meta[name="description"]', content.description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', content.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:type"]', isGuide ? "article" : "website");
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', content.description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;
    return installContentSchema({ canonicalUrl, title, content });
  }, [content, isGuide, path]);

  return <main className={`landing-page seo-product-page${isGuide || isHub ? " seo-guide-page" : ""}`}>
    <header className="landing-nav">
      <a className="landing-logo" href="/" aria-label="Boasted home">Boasted</a>
      <nav className="landing-nav-links" aria-label="Boasted products"><a href="/resume-accomplishments">Resume Builder</a><a href="/interview-preparation">Interview Prep</a><a href="/impact-receipts">Impact Receipts</a><a href="/guides">Guides</a><a href="/pricing">Pricing</a></nav>
      <div className="landing-nav-actions"><a className="landing-login-link" href="/login">Sign in</a><a className="landing-btn landing-btn-small" href="/register">Start free</a></div>
    </header>

    <GuideBreadcrumbs content={content} />

    <section className="seo-product-hero">
      <div className="landing-hero-copy"><div className="landing-eyebrow"><Icon size={16}/>{content.eyebrow}</div><h1>{content.title}</h1><p className="landing-hero-description">{content.description}</p><div className="landing-hero-actions"><a className="landing-btn" href="/register">Start free <ArrowRight size={18}/></a><a className="landing-btn landing-btn-secondary" href={isGuide || isHub ? "/guides" : "/how-it-works"}>{isGuide ? "More guides" : isHub ? "See how Boasted works" : "See how it works"}</a></div><div className="seo-trust-row" aria-label="Boasted benefits"><span><Check size={15}/> Private by default</span><span><Check size={15}/> Preserve shared credit</span><span><Check size={15}/> Built for real career moments</span></div></div>
      <aside className="seo-product-summary" aria-label={`${content.eyebrow} overview`}><span className="seo-summary-label">{isGuide || isHub ? "GUIDE AT A GLANCE" : "WHAT YOU GET"}</span><div className="seo-summary-icon"><Icon size={28}/></div><h2>{isGuide || isHub ? "Remember the work before you need to explain it." : "Turn your work into career-ready proof."}</h2><p>{isGuide || isHub ? "Capture facts while they are fresh, then turn the same record into the format your next career moment needs." : "Capture the context behind what you did, then reuse that evidence when a resume, interview, or opportunity needs it."}</p><div className="seo-summary-list">{content.points.slice(0,3).map((point)=><span key={point}><Check size={16}/> {point}</span>)}</div></aside>
    </section>

    {isGuide ? <GuideArticle content={content} /> : null}
    {isHub ? <GuideHub content={content} /> : null}

    {!isGuide && !isHub ? <section className="seo-value-section"><div className="landing-section-heading"><p>BUILT AROUND YOUR EVIDENCE</p><h2>Useful when your work needs to speak for you.</h2><span className="seo-section-copy">Keep the accomplishment, context, result, and supporting proof together instead of rebuilding your story every time.</span></div><div className="seo-value-grid">{content.points.map((point,index)=><article className="seo-value-card" key={point}><span className="seo-card-number">0{index+1}</span><h3>{point}</h3><p>Use the evidence already in your Boasted to make this career moment clearer, faster, and easier to support.</p></article>)}</div></section> : null}

    <GuideFaq content={content} />

    <section className="seo-explore-section"><div className="seo-explore-heading"><div><p className="landing-mini-label">{isGuide || isHub ? "KEEP LEARNING" : "EXPLORE BOASTED"}</p><h2>{isGuide || isHub ? "Build the whole accomplishment-to-opportunity workflow." : "One career story. Connected tools."}</h2></div><p>{isGuide || isHub ? "Move from capturing work to reviews, resumes, interviews, portfolios, and promotion evidence without losing the facts behind the story." : "Move between the tools without losing the evidence behind your work."}</p></div><nav className="seo-related-grid" aria-label={isGuide || isHub ? "Related career guides" : "Related Boasted pages"}>{relatedLinks.map(({label,href,description})=><a className="seo-related-card" href={href} key={href}><span><strong>{label}</strong>{description ? <small>{description}</small> : null}</span><ArrowRight size={18}/></a>)}</nav></section>

    <section className="seo-final-cta"><div><p className="landing-mini-label">YOUR WORK ALREADY HAPPENED</p><h2>Make sure you can prove it.</h2><p>Start building a career record you can actually use when the next opportunity arrives.</p></div><a className="landing-btn" href="/register">Build your Boasted <ArrowRight size={18}/></a></section>
  </main>;
}

export default SeoLandingPage;
