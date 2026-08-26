import { lazy, Suspense, useEffect, useState } from "react";
import { getSeoLandingPage } from "./seoLandingContent.js";
import useSearchAppearanceMeta from "./useSearchAppearanceMeta.js";

const lazyPage = (loader) => lazy(loader);
const App = lazyPage(() => import("./App.jsx"));
const AccomplishmentsPage = lazyPage(() => import("./AccomplishmentsPage.jsx"));
const AppSidebar = lazyPage(() => import("./AppSidebar.jsx"));
const AppearanceSettingsPage = lazyPage(() => import("./AppearanceSettingsPage.jsx"));
const BillingSettingsPage = lazyPage(() => import("./BillingSettingsPage.jsx"));
const DashboardPage = lazyPage(() => import("./DashboardPage.jsx"));
const DocsPage = lazyPage(() => import("./DocsPage.jsx"));
const ImpactReceiptsPage = lazyPage(() => import("./ImpactReceiptsPage.jsx"));
const InterviewPracticeExperience = lazyPage(() => import("./InterviewPracticeExperience.jsx"));
const LandingInterviewShowcase = lazyPage(() => import("./LandingInterviewShowcase.jsx"));
const LandingResumeShowcase = lazyPage(() => import("./LandingResumeShowcase.jsx"));
const ReceiptVerificationCenter = lazyPage(() => import("./ReceiptVerificationCenter.jsx"));
const ReceiptVerificationPage = lazyPage(() => import("./ReceiptVerificationPage.jsx"));
const ResumeBuilderPage = lazyPage(() => import("./ResumeBuilderPage.jsx"));
const SearchSitelinksNav = lazyPage(() => import("./SearchSitelinksNav.jsx"));
const SecurityPage = lazyPage(() => import("./SecurityPage.jsx"));
const NDAGuidancePage = lazyPage(() => import("./NDAGuidancePage.jsx"));
const ProductTour = lazyPage(() => import("./ProductTour.jsx"));
const ProfilePage = lazyPage(() => import("./ProfilePage.jsx"));
const ProCareerPage = lazyPage(() => import("./ProCareerPage.jsx"));
const SeoLandingPage = lazyPage(() => import("./SeoLandingPages.jsx"));
const SettingsPage = lazyPage(() => import("./SettingsPage.jsx"));
const UpgradePage = lazyPage(() => import("./UpgradePage.jsx"));
const LegalPages = lazyPage(() => import("./LegalPages.jsx"));

function RouteFallback() {
  return <div className="route-loading" role="status" aria-label="Loading BragStack" />;
}

function ProRequired({ feature = "This feature" }) {
  return (
    <main className="page">
      <section className="notice">
        <strong>BragStack Pro</strong>
        <span>{feature} is available on Pro. Upgrade to unlock advanced career tools.</span>
        <a className="btn primary" href="/upgrade">Upgrade to Pro</a>
      </section>
    </main>
  );
}

function ImpactReceiptsWithVerification() {
  return <><ImpactReceiptsPage /><ReceiptVerificationCenter /></>;
}

function RootContent() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  useSearchAppearanceMeta(path);
  const seoLandingContent = getSeoLandingPage(path);
  const isAuthenticatedApp = path.startsWith("/app");
  const [user, setUser] = useState(null);
  const [planLoaded, setPlanLoaded] = useState(!isAuthenticatedApp);

  useEffect(() => {
    if (!isAuthenticatedApp) return undefined;
    let active = true;
    (async () => {
      try {
        // Keep axios and the authenticated API surface out of public-page startup.
        // App routes already wait for plan data, so loading the client here does not
        // change the public routing contract or entitlement behavior.
        const { getCurrentUser } = await import("./api.js");
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
    })();
    return () => { active = false; };
  }, [isAuthenticatedApp]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      document.querySelectorAll('a[href="/#security"]').forEach((link) => link.setAttribute("href", "/security"));
      if (path !== "/") return;
      document.querySelectorAll('a[href*="@bragstack.app"]').forEach((link) => {
        const href = link.getAttribute("href") || "";
        const subject = href.includes("?subject=") ? `?${href.split("?")[1]}` : "";
        link.setAttribute("href", `mailto:Tobias.scott@usebragstack.com${subject}`);
      });
      document.querySelectorAll(".mega-footer-columns span").forEach((node) => {
        if (node.textContent?.trim() !== "Docs · coming soon") return;
        const link = document.createElement("a");
        link.href = "/docs";
        link.textContent = "Docs";
        node.replaceWith(link);
      });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [path]);

  let content;
  if (path === "/privacy" || path === "/terms") {
    content = <LegalPages page={path === "/privacy" ? "privacy" : "terms"} />;
  } else if (path === "/verify-receipt") content = <ReceiptVerificationPage />;
  else if (path === "/upgrade") content = <UpgradePage />;
  else if (path === "/docs") content = <DocsPage />;
  else if (path === "/nda-safety") content = <NDAGuidancePage />;
  else if (path === "/security") content = <SecurityPage />;
  else if (seoLandingContent) content = <SeoLandingPage content={seoLandingContent} />;
  else if (path === "/") content = <><App /><LandingInterviewShowcase /><LandingResumeShowcase /><SearchSitelinksNav /></>;
  else {
    let Content = App;
    let contentProps = {};
    if (path === "/app") Content = DashboardPage;
    else if (path === "/app/settings") Content = SettingsPage;
    else if (path === "/app/profile") Content = ProfilePage;
    else if (path === "/app/settings/appearance") Content = AppearanceSettingsPage;
    else if (path === "/app/settings/billing") Content = BillingSettingsPage;
    else if (path === "/app/accomplishments") Content = AccomplishmentsPage;
    else if (path === "/app/impact-receipts") Content = ImpactReceiptsWithVerification;
    else if (path === "/app/resume-builder" && planLoaded) {
      Content = user?.entitlements?.resume_builder ? ResumeBuilderPage : ProRequired;
      contentProps = user?.entitlements?.resume_builder ? {} : { feature: "Resume Builder and ATS Guardian" };
    } else if (path === "/app/reports" && planLoaded) {
      Content = user?.entitlements?.advanced_reports ? ProCareerPage : ProRequired;
      contentProps = user?.entitlements?.advanced_reports ? {} : { feature: "Career analytics and career packets" };
    } else if (path === "/app/interview-practice" && planLoaded) {
      Content = user?.entitlements?.interview_practice ? InterviewPracticeExperience : ProRequired;
      contentProps = user?.entitlements?.interview_practice ? {} : { feature: "Practice Interviewer" };
    }

    if (!isAuthenticatedApp) content = <Content {...contentProps} />;
    else if (!planLoaded) content = <div className="app-shell"><div className="authenticated-content" /></div>;
    else content = <div className="app-shell"><AppSidebar /><div className="authenticated-content"><Content {...contentProps} /></div><ProductTour user={user} /></div>;
  }

  return <Suspense fallback={<RouteFallback />}>{content}</Suspense>;
}

export default RootContent;
