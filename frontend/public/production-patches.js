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
    "/": ["BragStack | Turn Your Work Into Career Proof", "BragStack helps professionals capture wins, attach evidence, create Impact Receipts, build Proof Profiles and Professional Packets, and selectively share career proof when it matters."],
    "/docs": ["BragStack Docs | Career Proof, Billing, Privacy & Product Help", "Customer documentation for BragStack accounts, Impact Receipts, reports, public proof profiles, privacy, billing, and BragStack Pro."],
    "/support": ["BragStack Support Hub | Product Help, Beta Access & Security", "Get BragStack product and account help, troubleshoot issues, understand complimentary beta access, review NDA guidance, and reach support, billing, privacy, or security contacts."],
    "/how-it-works": ["How BragStack Works | Capture, Prove & Reuse Career Evidence", "See how BragStack helps you capture accomplishments, create Impact Receipts, reuse evidence for career moments, share selectively, and keep private work private."],
    "/use-cases": ["BragStack Use Cases | Reviews, Promotions, Resumes & Interviews", "Explore BragStack use cases for performance reviews, promotions, resumes, interviews, career changes, freelancers, founders, and adults in education."],
    "/contact": ["Contact BragStack | Support, Privacy, Security & Billing", "Contact BragStack for product support, privacy requests, security concerns, billing questions, general questions, or legal correspondence."],
    "/team": ["BragStack for Teams | Coming Soon", "Learn about the planned BragStack Team direction for evidence-backed reviews, employee-controlled sharing, bounded analytics, and organization workflows without surveillance."],
    "/enterprise": ["BragStack Enterprise | Governance Roadmap for Career Evidence", "Learn about BragStack's early enterprise direction for identity, governance, retention, admin policy controls, integrations, and employee-controlled evidence boundaries."],
    "/security": ["BragStack Security | Private-by-Default Career Evidence", "Read BragStack's security approach, private-by-default model, confidential-work guidance, payment handling, and instructions for reporting a security concern."],
    "/privacy": ["Privacy Policy | BragStack", "Read the BragStack Privacy Policy, including information collection, career evidence, sharing, AI-assisted features, retention, security, and privacy choices."],
    "/terms": ["Terms and Conditions | BragStack", "Read the terms governing BragStack accounts, user content, acceptable use, subscriptions, AI-assisted career content, confidentiality, and service use."],
    "/nda-safety": ["NDA & Confidential Work Guidance | BragStack", "Learn how to document professional accomplishments in BragStack without overriding NDAs, employer policies, client agreements, or confidentiality obligations."],
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

  function ensureBetaLockup(nav) {
    if (!nav) return;
    const logo = nav.querySelector(".landing-logo");
    if (!logo) return;
    logo.textContent = "BragStack";
    logo.setAttribute("aria-label", "BragStack home");
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
      ensureFooterLink(resources, "Support Hub", "/support");
      ensureFooterLink(resources, "Docs & guides", "/docs");
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