import { useEffect } from "react";
import { PRIMARY_SITELINKS } from "./primarySitelinks.js";

const PUBLIC_META = {
  "/": {
    title: "BragStack | Career Proof, Resume Builder & Interview Practice",
    description: "BragStack turns everyday wins into reusable career proof for resumes, interviews, reviews, promotions, and your next opportunity.",
  },
  "/login": {
    title: "Sign In to BragStack | Career Proof",
    description: "Sign in to BragStack to access your career proof, Impact Receipts, Resume Builder, and Practice Interviewer.",
  },
  "/register": {
    title: "Sign up for BragStack | Start Free",
    description: "Create a free BragStack account and start turning your accomplishments into career proof for resumes, interviews, reviews, and promotions.",
  },
  "/how-it-works": {
    title: "How BragStack Works | Capture, Prove & Reuse Career Evidence",
    description: "See how BragStack helps you capture accomplishments, create Impact Receipts, reuse evidence for career moments, share selectively, and keep private work private.",
  },
  "/use-cases": {
    title: "BragStack Use Cases | Reviews, Promotions, Resumes & Interviews",
    description: "Explore practical BragStack use cases for performance reviews, promotions, resumes, interviews, career changes, freelancers, founders, and education-to-career proof.",
  },
  "/contact": {
    title: "Contact BragStack | Support, Privacy, Security & Billing",
    description: "Contact BragStack for product support, general questions, privacy requests, security concerns, billing questions, or legal correspondence.",
  },
  "/team": {
    title: "BragStack for Teams | Coming Soon",
    description: "Learn about the planned BragStack Team direction for evidence-backed reviews, employee-controlled sharing, bounded analytics, and organization workflows without surveillance.",
  },
  "/enterprise": {
    title: "BragStack Enterprise | Governance Roadmap for Career Evidence",
    description: "Learn about BragStack's early enterprise direction for identity, governance, retention, admin policy controls, integrations, and employee-controlled evidence boundaries.",
  },
  "/security": {
    title: "BragStack Security | Private-by-Default Career Evidence",
    description: "Read BragStack's security approach, private-by-default model, confidential-work guidance, payment handling, and instructions for reporting a security concern.",
  },
  "/privacy": {
    title: "Privacy Policy | BragStack",
    description: "Read the BragStack Privacy Policy, including information collection, career evidence, sharing, AI-assisted features, retention, security, and privacy choices.",
  },
  "/terms": {
    title: "Terms and Conditions | BragStack",
    description: "Read the terms governing BragStack accounts, user content, acceptable use, subscriptions, AI-assisted career content, confidentiality, and service use.",
  },
  "/nda-safety": {
    title: "NDA & Confidential Work Guidance | BragStack",
    description: "Learn how to document professional accomplishments in BragStack without overriding NDAs, employer policies, client agreements, or confidentiality obligations.",
  },
  "/education": {
    title: "BragStack Education | Turn Learning into Career Proof",
    description: "BragStack Education helps college, university, trade, technical, certification, bootcamp, and continuing-education learners turn real coursework, projects, training, research, and achievements into reusable career proof.",
  },
  "/docs": {
    title: "BragStack Docs | How to Use Career Proof",
    description: "Learn how to use BragStack, Impact Receipts, Resume Builder, Practice Interviewer, privacy controls, and career proof workflows.",
  },
  "/docs/education": {
    title: "BragStack Education Guide | Learning & Career Proof",
    description: "Learn how to use BragStack Education to capture coursework, projects, certifications, achievements, and contributions, then reuse that evidence for applications, resumes, interviews, portfolios, and career planning.",
  },
};

const NOINDEX_PREFIXES = ["/app"];
const NOINDEX_PATHS = new Set(["/upgrade", "/verify-receipt"]);
const OFFICIAL_LOGO_URL = "https://usebragstack.com/bragstack-logo-192.png";

function ensureMeta(selector, attributes) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  return element;
}

function installOfficialIcon() {
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((node) => node.remove());
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/png";
  icon.sizes = "192x192";
  icon.href = "/bragstack-logo-192.png?v=1";
  document.head.appendChild(icon);

  const shortcut = document.createElement("link");
  shortcut.rel = "shortcut icon";
  shortcut.type = "image/png";
  shortcut.href = "/bragstack-logo-192.png?v=1";
  document.head.appendChild(shortcut);

  let appleTouch = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleTouch) {
    appleTouch = document.createElement("link");
    appleTouch.rel = "apple-touch-icon";
    document.head.appendChild(appleTouch);
  }
  appleTouch.href = "/bragstack-logo-192.png?v=1";
}

function isNoindexPath(path) {
  return NOINDEX_PATHS.has(path) || NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export default function useSearchAppearanceMeta(path) {
  useEffect(() => {
    installOfficialIcon();

    const robots = ensureMeta('meta[name="robots"]', { name: "robots" });
    robots.setAttribute("content", isNoindexPath(path) ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    const googlebot = ensureMeta('meta[name="googlebot"]', { name: "googlebot" });
    googlebot.setAttribute("content", isNoindexPath(path) ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    const meta = PUBLIC_META[path];
    if (meta) {
      document.title = meta.title;
      ensureMeta('meta[name="description"]', { name: "description" }).setAttribute("content", meta.description);
      ensureMeta('meta[property="og:title"]', { property: "og:title" }).setAttribute("content", meta.title);
      ensureMeta('meta[property="og:description"]', { property: "og:description" }).setAttribute("content", meta.description);
      ensureMeta('meta[name="twitter:title"]', { name: "twitter:title" }).setAttribute("content", meta.title);
      ensureMeta('meta[name="twitter:description"]', { name: "twitter:description" }).setAttribute("content", meta.description);

      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `https://usebragstack.com${path === "/" ? "/" : path}`;
    }

    const scriptId = "bragstack-search-appearance-schema";
    document.getElementById(scriptId)?.remove();
    if (path !== "/") return undefined;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://usebragstack.com/#website",
          url: "https://usebragstack.com/",
          name: "BragStack",
          alternateName: ["BragStack", "usebragstack.com"],
          publisher: { "@id": "https://usebragstack.com/#organization" },
        },
        {
          "@type": "Organization",
          "@id": "https://usebragstack.com/#organization",
          name: "BragStack",
          url: "https://usebragstack.com/",
          logo: {
            "@type": "ImageObject",
            url: OFFICIAL_LOGO_URL,
            width: 192,
            height: 192,
          },
          image: OFFICIAL_LOGO_URL,
        },
        {
          "@type": "ItemList",
          "@id": "https://usebragstack.com/#primary-navigation",
          name: "BragStack primary navigation",
          itemListElement: PRIMARY_SITELINKS.map(([name, href], index) => ({
            "@type": "ListItem",
            position: index + 1,
            name,
            url: `https://usebragstack.com${href}`,
          })),
        },
        ...PRIMARY_SITELINKS.map(([name, href]) => ({
          "@type": "SiteNavigationElement",
          name,
          url: `https://usebragstack.com${href}`,
        })),
      ],
    };

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => script.remove();
  }, [path]);
}
