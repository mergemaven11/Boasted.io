import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  Home,
  ListChecks,
  LogOut,
  Menu,
  ReceiptText,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { getCurrentUser } from "./api";
import "./AppShell.css";

const BASE_NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/accomplishments", label: "Accomplishments", icon: ListChecks },
  { href: "/app/impact-receipts", label: "Impact Receipts", icon: ReceiptText },
  { href: "/app/profile", label: "Edit profile", icon: UserRound },
];

function AppSidebar() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = window.location.pathname;

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const data = await getCurrentUser();
        if (isMounted) setUser(data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
        }
      }
    }
    void loadUser();
    return () => { isMounted = false; };
  }, []);

  function logout() {
    localStorage.removeItem("bragstack_token");
    window.location.assign("/login");
  }

  const navItems = [...BASE_NAV_ITEMS];
  if (user?.entitlements?.advanced_reports) navItems.push({ href: "/app/reports", label: "Reports", icon: BarChart3 });

  return (
    <>
      <header className="mobile-app-bar">
        <a className="mobile-brand" href="/app"><img src="/brandmark.svg" alt="" /><strong>BragStack</strong></a>
        <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <a className="sidebar-brand" href="/app">
          <img className="sidebar-logo" src="/brandmark.svg" alt="BragStack" />
          <span><strong>BragStack</strong><small>PROVE · GROW · GET HIRED</small></span>
        </a>

        <div className="sidebar-plan-row">
          <span className={user?.plan === "pro" ? "pro" : "free"}>{user?.plan === "pro" ? "PRO" : "FREE"}</span>
          <small>{user?.plan === "pro" ? "Advanced career proof" : "Core career proof"}</small>
        </div>

        <a className="sidebar-add" href="/app/accomplishments?create=1">+ Create accomplishment</a>

        <nav className="sidebar-nav" aria-label="BragStack navigation">
          <p className="sidebar-section-label">Workspace</p>
          {navItems.map(({ href, label, icon: Icon }) => (
            <a className={path === href ? "active" : ""} href={href} key={href}><Icon size={18} /><span>{label}</span></a>
          ))}

          <p className="sidebar-section-label">Career tools</p>
          <a href="/docs"><FileText size={18} /><span>Docs & guides</span></a>
          {user?.public_slug && <a href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer"><UserRound size={18} /><span>Public Proof Profile</span></a>}
          {user && user.plan !== "pro" && <a className="sidebar-upgrade" href="/upgrade"><Sparkles size={18} /><span>Upgrade to Pro</span></a>}
        </nav>

        <div className="sidebar-footer">
          <a className="sidebar-user" href="/app/profile" aria-label="Edit profile">
            <span className="sidebar-user-avatar">{user?.name?.charAt(0).toUpperCase() || "B"}</span>
            <span><strong>{user?.name || "BragStack member"}</strong><small>{user?.plan === "pro" ? "Pro plan · Edit profile" : "Free plan · Edit profile"}</small></span>
          </a>
          <button type="button" onClick={logout}><LogOut size={17} />Sign out</button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    </>
  );
}

export default AppSidebar;
