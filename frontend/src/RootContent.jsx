import { lazy, Suspense, useEffect, useState } from "react";
import BragStackLoader from "./BragStackLoader.jsx";
import { getSeoLandingPage } from "./seoLandingContent.js";
import useSearchAppearanceMeta from "./useSearchAppearanceMeta.js";
import "./LandingBeta.css";

const lazyPage = (loader) => lazy(loader);
const App = lazyPage(() => import("./App.jsx"));
const AccomplishmentsPage = lazyPage(() => import("./AccomplishmentsPage.jsx"));
const AIVerificationPage = lazyPage(() => import("./AIVerificationPage.jsx"));
const AppSidebar = lazyPage(() => import("./AppSidebar.jsx"));
const ApplicationsHubPage = lazyPage(() => import("./ApplicationsHubPage.jsx"));
const AppearanceSettingsPage = lazyPage(() => import("./AppearanceSettingsPage.jsx"));
const BillingSettingsPage = lazyPage(() => import("./BillingSettingsPage.jsx"));
const CareerIntelligencePage = lazyPage(() => import("./CareerIntelligencePage.jsx"));
const ComplianceAuditPage = lazyPage(() => import("./ComplianceAuditPage.jsx"));
const DashboardPage = lazyPage(() => import("./DashboardPage.jsx"));
const DocsPage = lazyPage(() => import("./DocsPage.jsx"));
const EducationDataPolicyPage = lazyPage(() => import("./EducationDataPolicyPage.jsx"));
const EducationGuidePage = lazyPage(() => import("./EducationGuidePage.jsx"));
const EducationMarketingPage = lazyPage(() => import("./EducationMarketingPage.jsx"));
const ExecutiveImpactPage = lazyPage(() => import("./ExecutiveImpactPage.jsx"));
const ImpactReceiptsPage = lazyPage(() => import("./ImpactReceiptsPage.jsx"));
const InterviewPracticeExperience = lazyPage(() => import("./InterviewPracticeExperience.jsx"));
const LandingInterviewShowcase = lazyPage(() => import("./LandingInterviewShowcase.jsx"));
const LandingResumeShowcase = lazyPage(() => import("./LandingResumeShowcase.jsx"));
const OpsConsolePage = lazyPage(() => import("./OpsConsolePage.jsx"));
const OpsUsersPage = lazyPage(() => import("./OpsUsersPage.jsx"));
const PublicInfoPage = lazyPage(() => import("./PublicInfoPages.jsx"));
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
const SupportHubPage = lazyPage(() => import("./SupportHubPage.jsx"));
const LegalPageRouter = lazyPage(() => import("./LegalPageRouter.jsx"));

const INTERVIEW_PATH = "/app/interview-practice";

function hardStopInterviewMedia() {
  window.__bragstackInterviewActive = false;
  try { window.speechSynthesis?.cancel?.(); } catch { /* ignore */ }
  try { window.speechSynthesis?.pause?.(); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("bragstack:interview-teardown"));
}

function installInterviewSpeechGuard() {
  const synth = window.speechSynthesis;
  if (!synth?.speak || synth.__bragstackGuardInstalled) return () => {};

  const nativeSpeak = synth.speak.bind(synth);
  const guardedSpeak = (utterance) => {
    const onInterviewRoute = (window.location.pathname.replace(/\/$/, "") || "/") === INTERVIEW_PATH;
    if (!window.__bragstackInterviewActive || !onInterviewRoute) {
      try { utterance?.dispatchEvent?.(new Event("error")); } catch { /* ignore */ }
      return;
    }
    nativeSpeak(utterance);
  };

  synth.speak = guardedSpeak;
  synth.__bragstackGuardInstalled = true;
  return () => {
    if (synth.speak === guardedSpeak) synth.speak = nativeSpeak;
    delete synth.__bragstackGuardInstalled;
  };
}

function RouteFallback() { return <BragStackLoader message="Opening Boasted…" detail="Loading the tools you need." />; }
function LegacyShareRedirect({ path }) {
  useEffect(() => {
    const parts = path.split("/").filter(Boolean);
    const slug = parts[0] === "share" && parts[1] === "brag" ? parts[2] : "";
    window.location.replace(slug ? `/brag/${slug}${window.location.search}` : "/");
  }, [path]);
  return <BragStackLoader message="Opening Proof Portfolio…" detail="Preserving the shared profile theme and public proof." />;
}
function LegacyUpgradeRedirect() {
  useEffect(() => { window.location.replace("/support#beta-access"); }, []);
  return <BragStackLoader message="Opening beta access help…" detail="Paid upgrade UI is not offered during the complimentary beta period." />;
}
function ProRequired({ feature = "This feature" }) { return <main className="page"><section className="notice"><strong>Feature access</strong><span>{feature} is not available for this account right now. Check the Support Hub for beta-access details or contact support.</span><a className="btn primary" href="/support#beta-access">Open Support Hub</a></section></main>; }
function ImpactReceiptsWithVerification() { return <><ImpactReceiptsPage /><ReceiptVerificationCenter /></>; }

function RootContent() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  useSearchAppearanceMeta(path);
  const seoLandingContent = getSeoLandingPage(path);
  const isAuthenticatedApp = path.startsWith("/app") || path.startsWith("/ops");
  const [user, setUser] = useState(null);
  const [planLoaded, setPlanLoaded] = useState(!isAuthenticatedApp);

  useEffect(() => {
    const uninstallSpeechGuard = installInterviewSpeechGuard();
    const killOnNavigation = () => hardStopInterviewMedia();
    window.addEventListener("pagehide", killOnNavigation);
    window.addEventListener("beforeunload", killOnNavigation);
    window.addEventListener("popstate", killOnNavigation);
    return () => {
      window.removeEventListener("pagehide", killOnNavigation);
      window.removeEventListener("beforeunload", killOnNavigation);
      window.removeEventListener("popstate", killOnNavigation);
      hardStopInterviewMedia();
      uninstallSpeechGuard();
    };
  }, []);

  useEffect(() => {
    if (path === INTERVIEW_PATH) {
      window.__bragstackInterviewActive = true;
      try { window.speechSynthesis?.resume?.(); } catch { /* ignore */ }
      return () => hardStopInterviewMedia();
    }
    hardStopInterviewMedia();
    return undefined;
  }, [path]);

  useEffect(() => {
    if (!isAuthenticatedApp) return undefined;
    let active = true;
    (async () => {
      try {
        const { getCurrentUser } = await import("./api.js");
        const data = await getCurrentUser();
        if (active) { setUser(data); document.body.dataset.bragstackPlan = data.plan || "free"; }
      } catch (error) {
        if (error.response?.status === 401) { localStorage.removeItem("bragstack_token"); window.location.assign("/login"); return; }
      } finally { if (active) setPlanLoaded(true); }
    })();
    return () => { active = false; };
  }, [isAuthenticatedApp]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      document.querySelectorAll('a[href="/#security"]').forEach((link) => link.setAttribute("href", "/security"));

      if (path === "/docs") {
        const docsHeaderNav = document.querySelector(".docs-topbar nav");
        if (docsHeaderNav && !docsHeaderNav.querySelector('a[href="/docs/education"]')) {
          const educationGuideLink = document.createElement("a");
          educationGuideLink.href = "/docs/education";
          educationGuideLink.textContent = "Education";
          docsHeaderNav.insertBefore(educationGuideLink, docsHeaderNav.firstChild);
        }
        const docsSidebar = document.querySelector(".docs-sidebar");
        if (docsSidebar && !docsSidebar.querySelector('a[href="/docs/education"]')) {
          const educationSidebarLink = document.createElement("a");
          educationSidebarLink.href = "/docs/education";
          educationSidebarLink.textContent = "🎓 Education for students";
          docsSidebar.insertBefore(educationSidebarLink, docsSidebar.children[1] || null);
        }
        return;
      }

      if (path !== "/") return;
      const landingNav = document.querySelector(".landing-nav-links");
      if (landingNav && !landingNav.querySelector('a[href="/education"]')) {
        const educationLink = document.createElement("a");
        educationLink.href = "/education";
        educationLink.textContent = "Education";
        const pricingLink = landingNav.querySelector('a[href="#pricing"]');
        landingNav.insertBefore(educationLink, pricingLink || null);
      }
      if (landingNav && !landingNav.querySelector('a[href="/support"]')) {
        const supportLink = document.createElement("a");
        supportLink.href = "/support";
        supportLink.textContent = "Support";
        const pricingLink = landingNav.querySelector('a[href="#pricing"]');
        landingNav.insertBefore(supportLink, pricingLink || null);
      }

      const headerLogo = document.querySelector(".landing-nav > .landing-logo");
      if (headerLogo && !document.querySelector(".landing-nav .landing-brand-lockup")) {
        const lockup = document.createElement("div");
        lockup.className = "landing-brand-lockup";
        headerLogo.parentNode.insertBefore(lockup, headerLogo);
        lockup.appendChild(headerLogo);
        const beta = document.createElement("span");
        beta.className = "landing-beta-badge";
        beta.textContent = "Beta";
        lockup.appendChild(beta);
      }

      const footerLogo = document.querySelector(".mega-footer-brand > .landing-logo");
      if (footerLogo && !document.querySelector(".mega-footer-brand .landing-brand-lockup")) {
        const lockup = document.createElement("div");
        lockup.className = "landing-brand-lockup landing-brand-lockup-footer";
        footerLogo.parentNode.insertBefore(lockup, footerLogo);
        lockup.appendChild(footerLogo);
        const beta = document.createElement("span");
        beta.className = "landing-beta-badge";
        beta.textContent = "Beta";
        lockup.appendChild(beta);
      }

      document.querySelectorAll('a[href*="@boasted.io"]').forEach((link) => { const href = link.getAttribute("href") || ""; const subject = href.includes("?subject=") ? `?${href.split("?")[1]}` : ""; link.setAttribute("href", `mailto:Tobias.scott@boasted.io${subject}`); });
      document.querySelectorAll(".mega-footer-columns span").forEach((node) => { if (node.textContent?.trim() !== "Docs · coming soon") return; const link = document.createElement("a"); link.href = "/docs"; link.textContent = "Docs"; node.replaceWith(link); });
      const resourceHeading = Array.from(document.querySelectorAll(".mega-footer-columns h3")).find((node) => node.textContent?.trim() === "Resources");
      const resourceColumn = resourceHeading?.parentElement;
      if (resourceColumn && !resourceColumn.querySelector('a[href="/support"]')) {
        const supportLink = document.createElement("a");
        supportLink.href = "/support";
        supportLink.textContent = "Support Hub";
        resourceColumn.appendChild(supportLink);
      }
      if (resourceColumn && !resourceColumn.querySelector('a[href="/docs"]')) {
        const docsLink = document.createElement("a");
        docsLink.href = "/docs";
        docsLink.textContent = "Docs & guides";
        resourceColumn.appendChild(docsLink);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [path]);

  let content;
  if (path.startsWith("/share/brag/")) content = <LegacyShareRedirect path={path} />;
  else if (path === "/privacy" || path === "/terms") content = <LegalPageRouter page={path === "/privacy" ? "privacy" : "terms"} />;
  else if (path === "/legal/education-data") content = <EducationDataPolicyPage />;
  else if (path === "/verify-receipt") content = <ReceiptVerificationPage />;
  else if (path === "/upgrade") content = <LegacyUpgradeRedirect />;
  else if (path === "/support") content = <SupportHubPage />;
  else if (path === "/education") content = <EducationMarketingPage />;
  else if (path === "/docs/education") content = <EducationGuidePage />;
  else if (path === "/docs") content = <DocsPage />;
  else if (path === "/nda-safety") content = <NDAGuidancePage />;
  else if (path === "/security") content = <SecurityPage />;
  else if (path === "/how-it-works") content = <PublicInfoPage page="how-it-works" />;
  else if (path === "/use-cases") content = <PublicInfoPage page="use-cases" />;
  else if (path === "/contact") content = <PublicInfoPage page="contact" />;
  else if (path === "/team") content = <PublicInfoPage page="team" />;
  else if (path === "/enterprise") content = <PublicInfoPage page="enterprise" />;
  else if (seoLandingContent) content = <SeoLandingPage content={seoLandingContent} />;
  else if (path === "/") content = <><App /><LandingInterviewShowcase /><LandingResumeShowcase /><SearchSitelinksNav /></>;
  else {
    let Content = App; let contentProps = {};
    if (path === "/app") Content = DashboardPage;
    else if (path === "/ops") Content = OpsConsolePage;
    else if (path === "/ops/users") Content = OpsUsersPage;
    else if (path === "/ops/ai-verification") Content = AIVerificationPage;
    else if (path === "/ops/compliance") Content = ComplianceAuditPage;
    else if (path === "/app/settings") Content = SettingsPage;
    else if (path === "/app/profile") Content = ProfilePage;
    else if (path === "/app/settings/appearance") Content = AppearanceSettingsPage;
    else if (path === "/app/settings/billing") Content = BillingSettingsPage;
    else if (path === "/app/accomplishments") Content = AccomplishmentsPage;
    else if (path === "/app/impact-receipts") Content = ImpactReceiptsWithVerification;
    else if (path === "/app/applications") Content = ApplicationsHubPage;
    else if (path === "/app/intelligence") Content = CareerIntelligencePage;
    else if (path === "/app/executive-impact" && planLoaded) { Content = user?.entitlements?.executive_command_center ? ExecutiveImpactPage : ProRequired; contentProps = user?.entitlements?.executive_command_center ? {} : { feature: "Executive Impact Command Center (Enterprise)" }; }
    else if (path === "/app/resume-builder" && planLoaded) { Content = user?.entitlements?.resume_builder ? ResumeBuilderPage : ProRequired; contentProps = user?.entitlements?.resume_builder ? {} : { feature: "Resume Builder and ATS Guardian" }; }
    else if (path === "/app/reports" && planLoaded) { Content = user?.entitlements?.advanced_reports ? ProCareerPage : ProRequired; contentProps = user?.entitlements?.advanced_reports ? {} : { feature: "Career analytics and career packets" }; }
    else if (path === INTERVIEW_PATH && planLoaded) { Content = user?.entitlements?.interview_practice ? InterviewPracticeExperience : ProRequired; contentProps = user?.entitlements?.interview_practice ? {} : { feature: "Practice Interviewer" }; }

    if (!isAuthenticatedApp) content = <Content {...contentProps} />;
    else if (!planLoaded) content = <BragStackLoader message="Preparing your workspace…" detail="Connecting your account and career intelligence." />;
    else content = <div className="app-shell"><AppSidebar /><div className="authenticated-content"><Content {...contentProps} /></div>{!path.startsWith("/ops") && <ProductTour user={user} />}</div>;
  }
  return <Suspense fallback={<RouteFallback />}>{content}</Suspense>;
}
export default RootContent;
