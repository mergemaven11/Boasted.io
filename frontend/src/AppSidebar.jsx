import { useEffect, useState } from "react";
import { BarChart3, BrainCircuit, Building2, ChevronDown, FileCheck2, FileText, GraduationCap, Home, LifeBuoy, ListChecks, LogOut, Menu, ReceiptText, Settings, ShieldCheck, UserRound, Users, Video, X } from "lucide-react";
import { getCurrentUser } from "./api";
import { getOpsAccess } from "./opsApi";
import "./AppShell.css";
import "./SidebarCollapsible.css";

const WORKSPACE_ITEMS = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/accomplishments", label: "Accomplishments", icon: ListChecks },
  { href: "/app/impact-receipts", label: "Impact Receipts", icon: ReceiptText },
  { href: "/app/applications", label: "Education", icon: GraduationCap },
  { href: "/app/intelligence", label: "Career Intelligence", icon: BrainCircuit },
];
const CAREER_TOOLS = [
  { href: "/app/resume-builder", label: "Resume Builder", icon: FileText },
  { href: "/app/interview-practice", label: "Practice interview", icon: Video },
  { href: "/app/reports", label: "Career analytics", icon: BarChart3 },
  { href: "/app/reports?packets=1", label: "Career packets", icon: FileCheck2 },
];

function AppSidebar() {
  const [user, setUser] = useState(null); const [mobileOpen, setMobileOpen] = useState(false); const [internalAccess, setInternalAccess] = useState(null);
  const path = window.location.pathname; const search = window.location.search; const hash = window.location.hash;
  const careerToolsActive = path === "/app/resume-builder" || path === "/app/interview-practice" || path === "/app/reports";
  const [careerToolsOpen, setCareerToolsOpen] = useState(() => careerToolsActive || localStorage.getItem("bragstack_career_tools_nav") !== "closed");
  useEffect(() => { let mounted = true; (async () => { try { const data = await getCurrentUser(); if (!mounted) return; setUser(data); try { const access = await getOpsAccess(); if (mounted) setInternalAccess(access?.authorized ? access : null); } catch { if (mounted) setInternalAccess(null); } } catch (error) { if (error.response?.status === 401) { localStorage.removeItem("bragstack_token"); window.location.assign("/login"); } } })(); return () => { mounted = false; }; }, []);
  function logout() { localStorage.removeItem("bragstack_token"); window.location.assign("/login"); }
  function toolIsActive(href) { const target = new URL(href, window.location.origin); return path === target.pathname && search === target.search && hash === target.hash; }
  function toggleCareerTools(event) { const open = event.currentTarget.open; setCareerToolsOpen(open); localStorage.setItem("bragstack_career_tools_nav", open ? "open" : "closed"); }
  const isPro = Boolean(user?.entitlements?.advanced_reports);
  const internalRoles = new Set(internalAccess?.roles || []);
  const canUseOpsConsole = internalRoles.has("ops") || internalRoles.has("security") || internalRoles.has("admin");
  const canUseUserAccounts = internalRoles.has("support") || canUseOpsConsole;
  const canUseGovernance = canUseOpsConsole;
  const hasAnyInternalAccess = canUseOpsConsole || canUseUserAccounts;
  const hasExecutiveImpact = Boolean(user?.entitlements?.executive_command_center) && ["owner", "admin", "executive"].includes(user?.workspace_role);

  return <>
    <header className="mobile-app-bar"><a className="mobile-brand" href="/app"><img src="/brandmark.svg" alt="" /><strong>BragStack</strong></a><button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button></header>
    <aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <a className="sidebar-brand" href="/app"><img className="sidebar-logo" src="/brandmark.svg" alt="BragStack" /><span><strong>BragStack</strong><small>PROVE · GROW · GET HIRED</small></span></a>
      <div className="sidebar-plan-row"><span className={isPro ? "pro" : "free"}>{isPro ? "PRO" : "FREE"}</span><small>{isPro ? "Advanced career proof" : "Core career proof"}</small></div>
      <a className="sidebar-add" href="/app/accomplishments?create=1">+ Create accomplishment</a>
      <nav className="sidebar-nav" aria-label="BragStack navigation">
        <p className="sidebar-section-label">Workspace</p>
        {WORKSPACE_ITEMS.map(({ href, label, icon: Icon }, index) => <div className="sidebar-workspace-item" key={href}><a className={path === href ? "active" : ""} href={href}><Icon size={18} /><span>{label}</span></a>{index === 0 && user?.public_slug && <a className="sidebar-proof-profile" href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer"><UserRound size={18} /><span>Public Proof Profile</span><small>Live</small></a>}</div>)}
        {isPro && <details className={`sidebar-collapsible ${careerToolsActive ? "contains-active" : ""}`} open={careerToolsOpen} onToggle={toggleCareerTools}><summary><span>Career tools</span><ChevronDown size={15} /></summary><div className="sidebar-collapsible-items">{CAREER_TOOLS.map(({ href, label, icon: Icon }) => <a className={toolIsActive(href) ? "active" : ""} href={href} key={`${href}-${label}`}><Icon size={18} /><span>{label}</span></a>)}</div></details>}
        {hasExecutiveImpact && <><p className="sidebar-section-label">Enterprise</p><a className={path === "/app/executive-impact" ? "active" : ""} href="/app/executive-impact"><Building2 size={18}/><span>Executive Impact</span></a></>}
        <p className="sidebar-section-label">Account & tools</p>
        <a className={path.startsWith("/app/settings") || path === "/app/profile" ? "active" : ""} href="/app/settings"><Settings size={18} /><span>Settings</span></a>
        <a href="/support"><LifeBuoy size={18} /><span>Support Hub</span></a>
        {hasAnyInternalAccess && <><p className="sidebar-section-label">Internal</p>{canUseOpsConsole && <a className={path === "/ops" ? "active" : ""} href="/ops"><ShieldCheck size={18} /><span>Ops Console</span></a>}{canUseUserAccounts && <a className={path === "/ops/users" ? "active" : ""} href="/ops/users"><Users size={18} /><span>User Accounts</span></a>}{canUseGovernance && <a className={path === "/ops/ai-verification" ? "active" : ""} href="/ops/ai-verification"><BrainCircuit size={18} /><span>AI Verification</span></a>}{canUseGovernance && <a className={path === "/ops/compliance" ? "active" : ""} href="/ops/compliance"><FileCheck2 size={18} /><span>Governance Reports</span></a>}</>}
        <a href="/docs"><FileText size={18} /><span>Docs & guides</span></a>
      </nav>
      <div className="sidebar-footer"><a className="sidebar-user" href="/app/settings" aria-label="Account settings">{user?.avatar_url ? <img className="sidebar-user-avatar sidebar-user-avatar-image" src={user.avatar_url} alt="" /> : <span className="sidebar-user-avatar">{user?.name?.charAt(0).toUpperCase() || "B"}</span>}<span><strong>{user?.name || "BragStack member"}</strong><small>{isPro ? "Pro access · Settings" : "Account settings"}</small></span></a><button type="button" onClick={logout}><LogOut size={17} />Sign out</button></div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
  </>;
}
export default AppSidebar;
