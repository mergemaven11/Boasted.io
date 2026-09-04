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
  "/education": {
    title: "BragStack Education | Student Wins & Growth for Ages 18+",
    description: "BragStack Education helps students age 18+ capture real wins from school, projects, activities, service, work, and learning for scholarships, programs, internships, essays, and future careers.",
  },
  "/docs": {
    title: "BragStack Docs | How to Use Career Proof",
    description: "Learn how to use BragStack, Impact Receipts, Resume Builder, Practice Interviewer, privacy controls, and career proof workflows.",
  },
  "/docs/education": {
    title: "BragStack Education Guide | Student Wins & Growth for Ages 18+",
    description: "Learn how students age 18+ can use BragStack Education to capture real accomplishments, organize growth, protect private information, and prepare for scholarships, programs, internships, and essay stories.",
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
