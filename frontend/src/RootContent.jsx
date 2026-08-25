import { useEffect, useState } from "react";
import AccomplishmentsPage from "./AccomplishmentsPage.jsx";
import App from "./App.jsx";
import AppSidebar from "./AppSidebar.jsx";
import AppearanceSettingsPage from "./AppearanceSettingsPage.jsx";
import BillingSettingsPage from "./BillingSettingsPage.jsx";
import DashboardPage from "./DashboardPage.jsx";
import DocsPage from "./DocsPage.jsx";
import ImpactReceiptsPage from "./ImpactReceiptsPage.jsx";
import InterviewPracticeExperience from "./InterviewPracticeExperience.jsx";
import LandingInterviewShowcase from "./LandingInterviewShowcase.jsx";
import LandingResumeShowcase from "./LandingResumeShowcase.jsx";
import ReceiptVerificationCenter from "./ReceiptVerificationCenter.jsx";
import ReceiptVerificationPage from "./ReceiptVerificationPage.jsx";
import ResumeBuilderPage from "./ResumeBuilderPage.jsx";
import SearchSitelinksNav from "./SearchSitelinksNav.jsx";
import SecurityPage from "./SecurityPage.jsx";
import { PrivacyPolicyPage, PublicFooter, TermsPage } from "./LegalPages.jsx";
import NDAGuidancePage from "./NDAGuidancePage.jsx";
import ProductTour from "./ProductTour.jsx";
import ProfilePage from "./ProfilePage.jsx";
import ProCareerPage from "./ProCareerPage.jsx";
import SeoLandingPage from "./SeoLandingPages.jsx";
import SettingsPage from "./SettingsPage.jsx";
import UpgradePage from "./UpgradePage.jsx";
import { getCurrentUser } from "./api.js";
import { getSeoLandingPage } from "./seoLandingContent.js";
import useSearchAppearanceMeta from "./useSearchAppearanceMeta.js";

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
  const isUpgradePage = path === "/upgrade";
  const isDocsPage = path === "/docs";
  const isNdaPage = path === "/nda-safety";
  const isSecurityPage = path === "/security";
  const isVerificationPage = path === "/verify-receipt";
  const isAuthenticatedApp = path.startsWith("/app");
  const [user, setUser] = useState(null);
  const [planLoaded, setPlanLoaded] = useState(!isAuthenticatedApp);

  useEffect(() => {
    if (!isAuthenticatedApp) return undefined;
    let active = true;
    (async () => {
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

  if (path === "/privacy") return <PrivacyPolicyPage />;
  if (path === "/terms") return <TermsPage />;
  if (isVerificationPage) return <ReceiptVerificationPage />;
  if (isUpgradePage) return <UpgradePage />;
  if (isDocsPage) return <><DocsPage /><PublicFooter /></>;
  if (isNdaPage) return <><NDAGuidancePage /><PublicFooter /></>;
  if (isSecurityPage) return <SecurityPage />;
  if (seoLandingContent) return <SeoLandingPage content={seoLandingContent} />;
  if (path === "/") return <><App /><LandingInterviewShowcase /><LandingResumeShowcase /><SearchSitelinksNav /></>;

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

  if (!isAuthenticatedApp) return <Content {...contentProps} />;
  if (!planLoaded) return <div className="app-shell"><div className="authenticated-content" /></div>;

  return <div className="app-shell"><AppSidebar /><div className="authenticated-content"><Content {...contentProps} /></div><ProductTour user={user} /></div>;
}

export default RootContent;
