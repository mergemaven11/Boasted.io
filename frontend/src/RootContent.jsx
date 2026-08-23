import { useEffect, useState } from "react";

import AccomplishmentsPage from "./AccomplishmentsPage.jsx";
import App from "./App.jsx";
import AppSidebar from "./AppSidebar.jsx";
import DocsPage from "./DocsPage.jsx";
import ImpactReceiptsPage from "./ImpactReceiptsPage.jsx";
import NDAGuidancePage from "./NDAGuidancePage.jsx";
import SeoLandingPage from "./SeoLandingPages.jsx";
import UpgradePage from "./UpgradePage.jsx";
import { getCurrentUser } from "./api.js";
import { getSeoLandingPage } from "./seoLandingContent.js";

function ProRequired() {
  return (
    <main className="page">
      <section className="notice">
        <strong>BragStack Pro</strong>
        <span>This feature is available on Pro. Upgrade to unlock advanced reports and career packaging.</span>
        <a className="btn primary" href="/upgrade">Upgrade to Pro</a>
      </section>
    </main>
  );
}

function PublicLegalFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(148,163,184,.16)", padding: "20px 24px 28px", textAlign: "center", fontSize: 14, opacity: .9 }}>
      <a href="/docs" style={{ marginRight: 18 }}>Docs</a>
      <a href="/nda-safety" style={{ marginRight: 18 }}>NDA & confidential work</a>
      <a href="mailto:Tobias.scott@usebragstack.com">Support</a>
    </footer>
  );
}

function RootContent() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const seoLandingContent = getSeoLandingPage(path);
  const isUpgradePage = path === "/upgrade";
  const isDocsPage = path === "/docs";
  const isNdaPage = path === "/nda-safety";
  const isAuthenticatedApp = path.startsWith("/app");
  const [user, setUser] = useState(null);
  const [planLoaded, setPlanLoaded] = useState(!isAuthenticatedApp);

  useEffect(() => {
    if (!isAuthenticatedApp) return undefined;

    let active = true;
    async function loadPlan() {
      try {
        const data = await getCurrentUser();
        if (active) {
          setUser(data);
          document.body.dataset.bragstackPlan = data.plan || "free";
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
      } finally {
        if (active) setPlanLoaded(true);
      }
    }

    void loadPlan();
    return () => { active = false; };
  }, [isAuthenticatedApp]);

  if (isUpgradePage) return <UpgradePage />;
  if (isDocsPage) return <><DocsPage /><PublicLegalFooter /></>;
  if (isNdaPage) return <><NDAGuidancePage /><PublicLegalFooter /></>;
  if (seoLandingContent) return <><SeoLandingPage content={seoLandingContent} /><PublicLegalFooter /></>;

  let Content = App;
  if (path === "/app/accomplishments") {
    Content = AccomplishmentsPage;
  } else if (path === "/app/impact-receipts") {
    Content = ImpactReceiptsPage;
  } else if (path === "/app/reports" && planLoaded && !user?.entitlements?.advanced_reports) {
    Content = ProRequired;
  }

  if (!isAuthenticatedApp) return <><Content /><PublicLegalFooter /></>;
  if (!planLoaded) return <div className="app-shell"><div className="authenticated-content" /></div>;

  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="authenticated-content"><Content /></div>
    </div>
  );
}

export default RootContent;
