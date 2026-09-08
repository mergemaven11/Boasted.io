(() => {
  const SITE_URL = "https://boasted.io";
  const PERSONAL_EMAIL = "Tobias.scott@boasted.io";
  const CONTACT_EMAIL = "contact@boasted.io";
  const SUPPORT_EMAIL = "support@boasted.io";
  const PRIVACY_EMAIL = "privacy@boasted.io";
  const LEGAL_EMAIL = "legal@boasted.io";
  const SECURITY_EMAIL = "security@boasted.io";
  const BILLING_EMAIL = "billing@boasted.io";

  const routeMeta = {
    "/": ["Boasted | Turn Your Work Into Career Proof", "Boasted helps professionals capture wins, attach evidence, create Impact Receipts, build Proof Profiles and Professional Packets, and selectively share career proof when it matters."],
    "/docs": ["Boasted Docs | Career Proof, Billing, Privacy & Product Help", "Customer documentation for Boasted accounts, Impact Receipts, reports, public proof profiles, privacy, billing, and Boasted Pro."],
    "/support": ["Boasted Support Hub | Product Help, Beta Access & Security", "Get Boasted product and account help, troubleshoot issues, understand complimentary beta access, review NDA guidance, and reach support, billing, privacy, or security contacts."],
    "/how-it-works": ["How Boasted Works | Capture, Prove & Reuse Career Evidence", "See how Boasted helps you capture accomplishments, create Impact Receipts, reuse evidence for career moments, share selectively, and keep private work private."],
    "/use-cases": ["Boasted Use Cases | Reviews, Promotions, Resumes & Interviews", "Explore Boasted use cases for performance reviews, promotions, resumes, interviews, career changes, freelancers, founders, and adults in education."],
    "/contact": ["Contact Boasted | Support, Privacy, Security & Billing", "Contact Boasted for product support, privacy requests, security concerns, billing questions, general questions, or legal correspondence."],
    "/team": ["Boasted for Teams | Coming Soon", "Learn about the planned Boasted Team direction for evidence-backed reviews, employee-controlled sharing, bounded analytics, and organization workflows without surveillance."],
    "/enterprise": ["Boasted Enterprise | Governance Roadmap for Career Evidence", "Learn about Boasted's early enterprise direction for identity, governance, retention, admin policy controls, integrations, and employee-controlled evidence boundaries."],
    "/security": ["Boasted Security | Private-by-Default Career Evidence", "Read Boasted's security approach, private-by-default model, confidential-work guidance, payment handling, and instructions for reporting a security concern."],
    "/privacy": ["Privacy Policy | Boasted", "Read the Boasted Privacy Policy, including information collection, career evidence, sharing, AI-assisted features, retention, security, and privacy choices."],
    "/terms": ["Terms and Conditions | Boasted", "Read the terms governing Boasted accounts, user content, acceptable use, subscriptions, AI-assisted career content, confidentiality, and service use."],
    "/nda-safety": ["NDA & Confidential Work Guidance | Boasted", "Learn how to document professional accomplishments in Boasted without overriding NDAs, employer policies, client agreements, or confidentiality obligations."],
    "/resume-accomplishments": ["Resume Accomplishments & Achievement Tracker | Boasted", "Track work accomplishments, measurable impact, and evidence so you can build stronger resume bullets from real career proof."],
    "/career-portfolio": ["Career Portfolio & Professional Proof Profile | Boasted", "Build a professional career portfolio from selected accomplishments, skills, evidence, and measurable impact while keeping your account private by default."],
    "/performance-reviews": ["Performance Review Accomplishment Tracker | Boasted", "Capture wins throughout the year and turn documented impact into performance-review material without rebuilding months of work from memory."],
    "/promotion-packet": ["Promotion Packet & Career Impact Evidence | Boasted", "Organize scope, ownership, leadership, growth, and measurable results into evidence-backed promotion material."],
    "/interview-preparation": ["Interview Preparation From Real Work Accomplishments | Boasted", "Prepare behavioral and technical interview stories from documented situations, actions, results, metrics, and skills."],
    "/impact-receipts": ["Impact Receipts | Evidence-Backed Work Accomplishments | Boasted", "Create structured proof of your contribution, result, evidence, skills, shared credit, and measurable career impact."],
    "/career-analytics": ["Career Analytics for Skills, Accomplishments & Impact | Boasted", "See patterns across your skills, work accomplishments, evidence coverage, ownership, and career impact over time."],
    "/public-proof-profiles": ["Public Career Proof Profiles for Hiring & Portfolios | Boasted", "Share selected accomplishments and Impact Receipts with recruiters, hiring managers, clients, and your network without exposing private work history."],
    "/guides": ["Career Accomplishment Guides | Boasted", "Practical guides for tracking work accomplishments, building a brag document, preparing performance-review evidence, writing resume achievements, creating STAR interview stories, and organizing promotion proof."],
    "/guides/brag-document": ["What Is a Brag Document? Work Accomplishment Guide | Boasted", "Learn how to build a brag document that captures wins, results, evidence, skills, and shared credit for reviews, resumes, interviews, and promotions."],
    "/guides/track-work-accomplishments": ["How to Track Work Accomplishments | Boasted", "Use a simple system to track work accomplishments, measurable results, evidence, skills, and shared credit throughout the year instead of rebuilding your career story from memory."],
    "/guides/performance-review-accomplishments": ["Performance Review Accomplishments Guide | Boasted", "Learn how to prepare specific performance-review accomplishments using scope, action, result, evidence, growth, collaboration, and measurable impact."],
    "/guides/star-interview-stories": ["STAR Interview Stories: Method & Examples | Boasted", "Prepare STAR interview stories from real situations, actions, results, decisions, and lessons instead of memorized generic scripts."],
    "/guides/resume-accomplishment-examples": ["Resume Accomplishment Examples & Writing Guide | Boasted", "Turn job duties into truthful resume accomplishment bullets using action, scope, results, metrics, and context across technical support, software, operations, service, and leadership work."],
    "/guides/promotion-packet": ["Promotion Packet Guide: Evidence & Impact | Boasted", "Build a promotion packet around role criteria, sustained impact, increased scope, leadership, collaboration, growth, and supporting evidence collected over time."],
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
    const canonicalPath = path.startsWith("/brag/") || path.startsWith("/guides") || routeMeta[path] ? path : "/";
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

  function ensureBetaLockup(nav) {
    if (!nav) return;
    const logo = nav.querySelector(".landing-logo");
    if (!logo) return;
    logo.textContent = "Boasted";
    logo.setAttribute("aria-label", "Boasted home");
    let lockup = logo.closest(".landing-brand-lockup");
    if (!lockup) {
      lockup = document.createElement("div");
      lockup.className = "landing-brand-lockup";
      logo.parentNode.insertBefore(lockup, logo);
      lockup.appendChild(logo);
    }
    if (!lockup.querySelector(".landing-beta-badge")) {
      const badge = document.createElement("span");
      badge.className = "landing-beta-badge";
      badge.textContent = "Beta";
      lockup.appendChild(badge);
    }
  }

  function patchMarketingNavbar(root = document) {
    const nav = root.querySelector?.(".landing-nav") || document.querySelector(".landing-nav");
    if (!nav) return;
    ensureBetaLockup(nav);

    const links = nav.querySelector(".landing-nav-links");
    if (links && !links.querySelector('a[href="/support"]')) {
      const support = document.createElement("a");
      support.href = "/support";
      support.textContent = "Support";
      const pricing = links.querySelector('a[href="#pricing"], a[href="/#pricing"]');
      links.insertBefore(support, pricing || null);
    }

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

  function ensureFooterLink(column, label, href) {
    if (!column) return;
    const normalized = label.trim().toLowerCase();
    let link = Array.from(column.querySelectorAll("a")).find((item) => item.textContent?.trim().toLowerCase() === normalized);
    if (!link) {
      link = document.createElement("a");
      link.textContent = label;
      column.appendChild(link);
    }
    link.setAttribute("href", href);
  }

  function ensureDarkFooterLinks(root = document) {
    const footer = root.querySelector?.(".mega-footer") || document.querySelector(".mega-footer");
    if (!footer) return;
    const columns = footer.querySelector(".mega-footer-columns");
    if (!columns) return;

    const footerBrand = footer.querySelector(".mega-footer-brand");
    if (footerBrand) {
      const logo = footerBrand.querySelector(".landing-logo");
      if (logo) {
        let lockup = logo.closest(".landing-brand-lockup");
        if (!lockup) {
          lockup = document.createElement("div");
          lockup.className = "landing-brand-lockup landing-brand-lockup-footer";
          logo.parentNode.insertBefore(lockup, logo);
          lockup.appendChild(logo);
        }
        if (!lockup.querySelector(".landing-beta-badge")) {
          const badge = document.createElement("span");
          badge.className = "landing-beta-badge";
          badge.textContent = "Beta";
          lockup.appendChild(badge);
        }
      }
    }

    const byHeading = (heading) => Array.from(columns.children).find((column) => column.querySelector("h3")?.textContent?.trim().toLowerCase() === heading);
    const resources = byHeading("resources");
    const company = byHeading("company");

    if (resources) {
      const docsPlaceholder = Array.from(resources.children).find((item) => item.textContent?.trim().toLowerCase().startsWith("docs"));
      if (docsPlaceholder && docsPlaceholder.tagName !== "A") { const docs = document.createElement("a"); docs.href = "/docs"; docs.textContent = "Docs"; docsPlaceholder.replaceWith(docs); }
      ensureFooterLink(resources, "How it works", "/how-it-works");
      ensureFooterLink(resources, "Use cases", "/use-cases");
      ensureFooterLink(resources, "Career guides", "/guides");
      ensureFooterLink(resources, "Support Hub", "/support");
      ensureFooterLink(resources, "Docs", "/docs");
      ensureFooterLink(resources, "Sign in", "/login");
      ensureFooterLink(resources, "Create account", "/register");
      ensureFooterLink(resources, "NDA & confidential work", "/nda-safety");
    }

    if (company) {
      ensureFooterLink(company, "Contact", "/contact");
      ensureFooterLink(company, "Team waitlist", "/team");
      ensureFooterLink(company, "Enterprise", "/enterprise");
      ensureFooterLink(company, "Trust & privacy", "/security");
    }

    if (!byHeading("legal")) {
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
    if (path === "/docs" || path === "/support" || text.includes("support") || href.includes("support")) return SUPPORT_EMAIL;
    return CONTACT_EMAIL;
  }

  function patchNamedPublicLink(link, text) {
    const routes = {
      "how it works": "/how-it-works",
      "use cases": "/use-cases",
      "career guides": "/guides",
      "guides": "/guides",
      "support": "/support",
      "support hub": "/support",
      "contact": "/contact",
      "team waitlist": "/team",
      "enterprise": "/enterprise",
      "trust & privacy": "/security",
    };
    if (routes[text]) link.setAttribute("href", routes[text]);
  }

  function patchLinks(root = document) {
    root.querySelectorAll?.("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const text = (link.textContent || "").trim().toLowerCase();
      patchNamedPublicLink(link, text);
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