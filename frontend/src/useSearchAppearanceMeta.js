import { useEffect } from "react";
import { PRIMARY_SITELINKS } from "./primarySitelinks.js";

const PUBLIC_META = {
  "/": {
    title: "Boasted | Work Accomplishment Tracker & Career Proof",
    description: "Boasted is a work accomplishment tracker and career proof platform. Capture wins, results, skills, and evidence, then reuse them for resumes, performance reviews, promotions, interviews, portfolios, and opportunities.",
  },
  "/login": {
    title: "Sign In to Boasted | Career Proof",
    description: "Sign in to Boasted to access your career proof, Impact Receipts, Resume Builder, and Practice Interviewer.",
  },
  "/register": {
    title: "Sign up for Boasted | Start Free",
    description: "Create a free Boasted account and start turning your accomplishments into career proof for resumes, interviews, reviews, promotions, portfolios, and career transitions.",
  },
  "/how-it-works": {
    title: "How Boasted Works | Capture, Prove & Reuse Career Evidence",
    description: "See how Boasted helps people in any profession capture accomplishments, create Impact Receipts, reuse evidence for career moments, share selectively, and keep private work private.",
  },
  "/use-cases": {
    title: "Boasted Use Cases | Reviews, Promotions, Resumes & Interviews",
    description: "Explore Boasted use cases across professions for reviews, promotions, resumes, interviews, certifications, career changes, freelancers, founders, students, and education-to-career proof.",
  },
  "/contact": {
    title: "Contact Boasted | Support, Privacy, Security & Billing",
    description: "Contact Boasted for product support, general questions, privacy requests, security concerns, billing questions, or legal correspondence.",
  },
  "/support": {
    title: "Boasted Support Hub | Product Help, Beta Access & Security",
    description: "Get Boasted product and account help, troubleshoot issues, understand complimentary beta access, review NDA guidance, and reach support, billing, privacy, or security contacts.",
  },
  "/team": {
    title: "Boasted for Teams | Coming Soon",
    description: "Learn about the planned Boasted Team direction for evidence-backed reviews, employee-controlled sharing, bounded analytics, and organization workflows without surveillance.",
  },
  "/enterprise": {
    title: "Boasted Enterprise | Governance Roadmap for Career Evidence",
    description: "Learn about Boasted's early enterprise direction for identity, governance, retention, admin policy controls, integrations, and employee-controlled evidence boundaries.",
  },
  "/security": {
    title: "Boasted Security | Private-by-Default Career Evidence",
    description: "Read Boasted's security approach, private-by-default model, confidential-work guidance, payment handling, and instructions for reporting a security concern.",
  },
  "/privacy": {
    title: "Privacy Policy | Boasted",
    description: "Read the Boasted Privacy Policy, including information collection, career evidence, sharing, AI-assisted features, retention, security, and privacy choices.",
  },
  "/terms": {
    title: "Terms and Conditions | Boasted",
    description: "Read the terms governing Boasted accounts, user content, acceptable use, subscriptions, AI-assisted career content, confidentiality, and service use.",
  },
  "/nda-safety": {
    title: "NDA & Confidential Work Guidance | Boasted",
    description: "Learn how people across healthcare, education, trades, service, sales, creative, public-sector, technology, and other work can document accomplishments without overriding NDAs, privacy duties, professional obligations, employer policies, or client agreements.",
  },
  "/education": {
    title: "Boasted Education | Turn Learning into Career Proof",
    description: "Boasted Education helps college, university, trade, technical, certification, bootcamp, and continuing-education learners turn real coursework, projects, training, research, and achievements into reusable career proof.",
  },
  "/docs": {
    title: "Boasted Docs | How to Use Career Proof",
    description: "Learn how people across professions can use Boasted, Impact Receipts, Resume Builder, Practice Interviewer, privacy controls, and career proof workflows.",
  },
  "/docs/education": {
    title: "Boasted Education Guide | Learning & Career Proof",
    description: "Learn how to use Boasted Education to capture coursework, projects, certifications, achievements, and contributions, then reuse that evidence for applications, resumes, interviews, portfolios, and career planning.",
  },
};

const NOINDEX_PREFIXES = ["/app"];
const NOINDEX_PATHS = new Set(["/login", "/register", "/upgrade", "/verify-receipt"]);
const OFFICIAL_LOGO_URL = "https://boasted.io/boasted-logo-192.png";

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

  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.sizes = "48x48";
  favicon.href = "/favicon-48x48.png?v=4";
  document.head.appendChild(favicon);

  const highResolutionIcon = document.createElement("link");
  highResolutionIcon.rel = "icon";
  highResolutionIcon.type = "image/png";
  highResolutionIcon.sizes = "192x192";
  highResolutionIcon.href = "/boasted-logo-192.png?v=4";
  document.head.appendChild(highResolutionIcon);

  const shortcut = document.createElement("link");
  shortcut.rel = "shortcut icon";
  shortcut.type = "image/png";
  shortcut.href = "/favicon-48x48.png?v=4";
  document.head.appendChild(shortcut);

  let appleTouch = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleTouch) {
    appleTouch = document.createElement("link");
    appleTouch.rel = "apple-touch-icon";
    document.head.appendChild(appleTouch);
  }
  appleTouch.sizes = "192x192";
  appleTouch.href = "/boasted-logo-192.png?v=4";
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
      canonical.href = `https://boasted.io${path === "/" ? "/" : path}`;
    }

    const scriptId = "boasted-search-appearance-schema";
    document.getElementById(scriptId)?.remove();
    if (path !== "/") return undefined;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://boasted.io/#website",
          url: "https://boasted.io/",
          name: "Boasted",
          alternateName: ["Boasted.io", "Boasted Career Proof", "BragStack"],
          description: "Boasted is a work accomplishment tracker and career proof platform that helps people capture wins, results, skills, and evidence and reuse them when opportunities arrive.",
          publisher: { "@id": "https://boasted.io/#organization" },
        },
        {
          "@type": "Organization",
          "@id": "https://boasted.io/#organization",
          name: "Boasted",
          alternateName: ["Boasted.io", "Boasted Career Proof", "BragStack"],
          url: "https://boasted.io/",
          description: "Boasted is a work accomplishment tracker and career proof platform for capturing accomplishments, outcomes, skills, and evidence so people can reuse them when opportunities arrive.",
          founder: { "@id": "https://boasted.io/#founder" },
          logo: {
            "@type": "ImageObject",
            url: OFFICIAL_LOGO_URL,
            width: 192,
            height: 192,
          },
          image: OFFICIAL_LOGO_URL,
          sameAs: [
            "https://github.com/mergemaven11/Boasted.io",
          ],
        },
        {
          "@type": "Person",
          "@id": "https://boasted.io/#founder",
          name: "Tobias Scott",
          url: "https://tcs-portfolio.netlify.app/",
          jobTitle: "Founder",
          sameAs: [
            "https://github.com/mergemaven11",
            "https://www.linkedin.com/in/tobias-scott-he-him-b3572751/",
          ],
        },
        {
          "@type": "ItemList",
          "@id": "https://boasted.io/#primary-navigation",
          name: "Boasted primary navigation",
          itemListElement: PRIMARY_SITELINKS.map(([name, href], index) => ({
            "@type": "ListItem",
            position: index + 1,
            name,
            url: `https://boasted.io${href}`,
          })),
        },
        ...PRIMARY_SITELINKS.map(([name, href]) => ({
          "@type": "SiteNavigationElement",
          name,
          url: `https://boasted.io${href}`,
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
