import { useEffect } from "react";
import "./PublicInfoPage.css";

const PAGES = {
  "/how-it-works": {
    title: "How BragStack Works | Build Career Proof",
    heading: "How BragStack works",
    description: "Capture accomplishments while they are fresh, turn them into evidence-backed Impact Receipts, and reuse that proof for reviews, resumes, interviews, promotions, and career growth.",
    points: ["Capture the win and measurable result.", "Attach evidence, skills, context, and shared credit.", "Build Impact Receipts you control.", "Reuse your proof when career opportunities arrive."],
  },
  "/impact-receipts": {
    title: "Impact Receipts | BragStack",
    heading: "Impact Receipts",
    description: "Turn a work accomplishment into structured career proof with your contribution, result, evidence, skills, measurable outcomes, shared credit, and visibility controls.",
    points: ["Document what you contributed.", "Record measurable results and supporting evidence.", "Connect the skills demonstrated by the work.", "Keep receipts private or intentionally share selected proof."],
  },
  "/resume-accomplishments": {
    title: "Resume Accomplishments | BragStack",
    heading: "Resume accomplishments backed by real work",
    description: "Build stronger resume material from accomplishments you already documented instead of trying to reconstruct your best work from memory during a job search.",
    points: ["Capture outcomes and metrics when they happen.", "Keep context behind each accomplishment.", "Connect evidence and relevant skills.", "Turn documented work into stronger resume material."],
  },
  "/performance-reviews": {
    title: "Performance Reviews | BragStack",
    heading: "Be ready for performance reviews",
    description: "Capture wins throughout the review cycle so you can walk into performance conversations with organized examples of impact, ownership, growth, and results.",
    points: ["Build your review throughout the year.", "Keep measurable outcomes with the work that produced them.", "Surface patterns in skills and ownership.", "Package documented proof into review-ready material."],
  },
  "/career-portfolio": {
    title: "Career Portfolio | BragStack",
    heading: "A career portfolio built from proof",
    description: "Organize accomplishments, evidence, skills, and selected Impact Receipts into career proof you can keep private or intentionally share through a public profile.",
    points: ["Keep your work history organized in one place.", "Choose exactly what becomes public.", "Show evidence-backed accomplishments instead of generic claims.", "Build a portfolio that grows as your career grows."],
  },
  "/pricing": {
    title: "Pricing | BragStack",
    heading: "Simple pricing that starts free",
    description: "Start building career proof for free. Upgrade when you need unlimited proof, deeper career analytics, review and promotion builders, exports, integrations, and advanced profile capabilities.",
    points: ["Free — $0: 5 proof entries, 1 Impact Receipt, basic reports and skill tracking.", "Pro — $9/month: unlimited proof, advanced analytics, builders and exports.", "Team — coming soon for shared review workflows and centralized billing.", "Enterprise — custom security, governance, administration and support."],
  },
};

const sitelinks = [
  ["How BragStack Works", "/how-it-works"],
  ["Impact Receipts", "/impact-receipts"],
  ["Resume Accomplishments", "/resume-accomplishments"],
  ["Performance Reviews", "/performance-reviews"],
  ["Career Portfolio", "/career-portfolio"],
  ["Pricing", "/pricing"],
];

export function isPublicInfoPath(path) {
  return Boolean(PAGES[path]);
}

export default function PublicInfoPage({ path }) {
  const page = PAGES[path];

  useEffect(() => {
    document.title = page.title;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://usebragstack.com${path}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = page.description;
  }, [page, path]);

  return (
    <main className="public-info-page">
      <header className="public-info-nav">
        <a className="public-info-brand" href="/">BragStack</a>
        <nav aria-label="Public pages"><a href="/how-it-works">How it works</a><a href="/pricing">Pricing</a><a href="/login">Log in</a><a className="public-info-cta" href="/register">Start free</a></nav>
      </header>

      <article className="public-info-content">
        <p className="public-info-eyebrow">BRAGSTACK CAREER PROOF</p>
        <h1>{page.heading}</h1>
        <p className="public-info-lead">{page.description}</p>
        <div className="public-info-points">{page.points.map((point) => <div key={point}>{point}</div>)}</div>
        <a className="public-info-primary" href="/register">Start building proof →</a>
      </article>

      <section className="public-info-links" aria-labelledby="explore-bragstack">
        <h2 id="explore-bragstack">Explore BragStack</h2>
        <p>Clear, public pages for the career moments BragStack helps you prepare for.</p>
        <div className="public-info-link-grid">{sitelinks.filter(([, href]) => href !== path).map(([label, href]) => <a key={href} href={href}><strong>{label}</strong><span>Learn more →</span></a>)}</div>
      </section>

      <footer className="public-info-footer"><a href="/">BragStack</a><span>Turn your work into career proof.</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer>
    </main>
  );
}
