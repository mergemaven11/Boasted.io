(() => {
  const SITE_URL = "https://usebragstack.com";
  const PERSONAL_EMAIL = "Tobias.scott@usebragstack.com";
  const CONTACT_EMAIL = "contact@usebragstack.com";
  const SUPPORT_EMAIL = "support@usebragstack.com";
  const PRIVACY_EMAIL = "privacy@usebragstack.com";
  const LEGAL_EMAIL = "legal@usebragstack.com";
  const SECURITY_EMAIL = "security@usebragstack.com";
  const BILLING_EMAIL = "billing@usebragstack.com";

  const routeMeta = {
    "/": ["BragStack | Resume Accomplishments, Career Portfolio & Job Search Proof", "Capture work accomplishments and turn them into evidence-backed resume bullets, career portfolios, interview stories, performance reviews, promotion packets, and job-search proof."],
    "/docs": ["BragStack Docs | Career Proof, Billing, Privacy & Product Help", "Customer documentation for BragStack accounts, Impact Receipts, reports, public proof profiles, privacy, billing, and BragStack Pro."],
    "/resume-accomplishments": ["Resume Accomplishments & Achievement Tracker | BragStack", "Track work accomplishments, measurable impact, and evidence so you can build stronger resume bullets from real career proof."],
    "/career-portfolio": ["Career Portfolio & Professional Proof Profile | BragStack", "Build a professional career portfolio from selected accomplishments, skills, evidence, and measurable impact while keeping your account private by default."],
    "/performance-reviews": ["Performance Review Accomplishment Tracker | BragStack", "Capture wins throughout the year and turn documented impact into performance-review material without rebuilding months of work from memory."],
    "/promotion-packet": ["Promotion Packet & Career Impact Evidence | BragStack", "Organize scope, ownership, leadership, growth, and measurable results into evidence-backed promotion material."],
    "/interview-preparation": ["Interview Preparation From Real Work Accomplishments | BragStack", "Prepare behavioral and technical interview stories from documented situations, actions, results, metrics, and skills."],
    "/impact-receipts": ["Impact Receipts | Evidence-Backed Work Accomplishments | BragStack", "Create structured proof of your contribution, result, evidence, skills, shared credit, and measurable career impact."],
    "/career-analytics": ["Career Analytics for Skills, Accomplishments & Impact | BragStack", "See patterns across your skills, work accomplishments, evidence coverage, ownership, and career impact over time."],
    "/public-proof-profiles": ["Public Career Proof Profiles for Hiring & Portfolios | BragStack", "Share selected accomplishments and Impact Receipts with recruiters, hiring managers, clients, and your network without exposing private work history."],
  };

  function setMeta(selector, attrs) {
    let element = document.head.querySelector(selector);
    if (!element) { element = document.createElement("meta"); document.head.appendChild(element); }
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  }

  function setCanonical(url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = url;
  }

  function applySeo() {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const isPrivate = path.startsWith("/app") || ["/login", "/register", "/upgrade"].includes(path);
    const canonicalPath = path.startsWith("/brag/") || routeMeta[path] ? path : "/";
    const canonicalUrl = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
    setCanonical(canonicalUrl);
    setMeta('meta[name="robots"]', { name: "robots", content: isPrivate ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" });
    if (routeMeta[path]) {
      const [title, description] = routeMeta[path];
      document.title = title;
      setMeta('meta[name="description"]', { name: "description", content: description });
      setMeta('meta[property="og:title"]', { property: "og:title", content: title });
      setMeta('meta[property="og:description"]', { property: "og:description", content: description });
      setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
      setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
      setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    }
  }

  function patchMarketingNavbar(root = document) {
    const nav = root.querySelector?.(".landing-nav") || document.querySelector(".landing-nav");
    if (!nav || nav.dataset.brandPatched === "true") return;
    const logo = nav.querySelector(".landing-logo");
    if (logo) { logo.textContent = ""; logo.setAttribute("aria-label", "BragStack home"); }
    const actions = nav.querySelector(".landing-nav-actions");
    if (actions) {
      if (!actions.querySelector('a[href="/docs"]')) {
        const docs = document.createElement("a");
        docs.href = "/docs";
        docs.className = "landing-login-link landing-docs-link";
        docs.textContent = "Docs";
        actions.prepend(docs);
      }
      if (!actions.querySelector('a[href="/#pricing"]')) {
        const pricing = document.createElement("a");
        pricing.href = "/#pricing";
        pricing.className = "landing-login-link landing-pricing-link";
        pricing.textContent = "Pricing";
        const login = actions.querySelector('a[href="/login"]');
        if (login) actions.insertBefore(pricing, login);
        else actions.appendChild(pricing);
      }
    }
    nav.dataset.brandPatched = "true";
  }

  function ensureDarkFooterLinks(root = document) {
    const footer = root.querySelector?.(".mega-footer") || document.querySelector(".mega-footer");
    if (!footer || footer.dataset.legalLinksPatched === "true") return;
    const columns = footer.querySelector(".mega-footer-columns");
    if (!columns) return;
    const resources = Array.from(columns.children).find((column) => column.querySelector("h3")?.textContent?.trim().toLowerCase() === "resources");
    if (resources) {
      const docsPlaceholder = Array.from(resources.children).find((item) => item.textContent?.trim().toLowerCase().startsWith("docs"));
      if (docsPlaceholder) { const docs = document.createElement("a"); docs.href = "/docs"; docs.textContent = "Docs"; docsPlaceholder.replaceWith(docs); }
      if (!resources.querySelector('a[href="/nda-safety"]')) { const nda = document.createElement("a"); nda.href = "/nda-safety"; nda.textContent = "NDA & confidential work"; resources.appendChild(nda); }
    }
    if (!Array.from(columns.children).some((column) => column.querySelector("h3")?.textContent?.trim().toLowerCase() === "legal")) {
      const legal = document.createElement("div");
      legal.innerHTML = '<h3>Legal</h3><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a><a href="/nda-safety">Confidentiality guidance</a>';
      columns.appendChild(legal);
    }
    footer.dataset.legalLinksPatched = "true";
  }

  function roleEmailForLink(link) {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const text = (link.textContent || "").trim().toLowerCase();
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (path === "/privacy" || text.includes("privacy") || href.includes("privacy")) return PRIVACY_EMAIL;
    if (path === "/terms" || text.includes("legal") || href.includes("legal")) return LEGAL_EMAIL;
    if (text.includes("security") || href.includes("security")) return SECURITY_EMAIL;
    if (text.includes("billing") || href.includes("billing")) return BILLING_EMAIL;
    if (path === "/docs" || text.includes("support") || href.includes("support")) return SUPPORT_EMAIL;
    return CONTACT_EMAIL;
  }

  function patchLinks(root = document) {
    root.querySelectorAll?.("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const text = (link.textContent || "").trim().toLowerCase();
      if (href.toLowerCase().startsWith(`mailto:${PERSONAL_EMAIL.toLowerCase()}`)) {
        const query = href.includes("?") ? href.slice(href.indexOf("?")) : "";
        const roleEmail = roleEmailForLink(link);
        link.setAttribute("href", `mailto:${roleEmail}${query}`);
        if ((link.textContent || "").trim().toLowerCase() === PERSONAL_EMAIL.toLowerCase()) link.textContent = roleEmail;
      }
      if (href === "http://localhost:8000/docs" || href === "https://api.usebragstack.com/docs") {
        link.setAttribute("href", "/docs"); link.removeAttribute("target"); link.removeAttribute("rel"); if (text.includes("api docs")) link.textContent = "Docs";
      }
      if (text.startsWith("docs") && (href === "#" || href === "" || text.includes("coming soon"))) { link.setAttribute("href", "/docs"); link.textContent = "Docs"; }
    });
    patchMarketingNavbar(root);
    ensureDarkFooterLinks(root);
  }

  applySeo(); patchLinks();
  const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => { if (node.nodeType === Node.ELEMENT_NODE) patchLinks(node); })));
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
