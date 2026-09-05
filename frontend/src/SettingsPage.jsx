import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  GraduationCap,
  Palette,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { closeCurrentAccount } from "./accountApi.js";
import CalendarIntegrationsPage from "./CalendarIntegrationsPage.jsx";
import { startProductTour } from "./productTourActions.js";
import "./SettingsPage.css";

const SETTINGS = [
  {
    href: "/app/profile",
    icon: UserRound,
    title: "Profile",
    description: "Name, location, headline, bio, career details, Open to Talk, and public profile information.",
  },
  {
    href: "/app/settings?section=integrations",
    icon: CalendarDays,
    title: "Integrations",
    description: "Embed your interactive Calendly calendar on your public Proof Portfolio and manage private calendar connections.",
  },
  {
    href: "/app/settings/appearance",
    icon: Palette,
    title: "Profile appearance",
    description: "Public-page themes, career-inspired styles, and your custom profile colors.",
  },
  {
    href: "/app/settings/privacy",
    icon: ShieldCheck,
    title: "Privacy & sharing",
    description: "Control what stays private and what can appear on your public proof profile.",
    comingSoon: true,
  },
  {
    href: "/app/settings/billing",
    icon: CreditCard,
    title: "Plan & billing",
    description: "See your current plan, complimentary Pro gift status, and billing controls for any existing paid subscription.",
  },
];

export default function SettingsPage() {
  const section = new URLSearchParams(window.location.search).get("section");
  const [notice] = useState(() => sessionStorage.getItem("bragstack_settings_notice") || "");
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingAccount, setClosingAccount] = useState(false);
  const [closeError, setCloseError] = useState("");

  useEffect(() => {
    if (notice) sessionStorage.removeItem("bragstack_settings_notice");
  }, [notice]);

  useEffect(() => {
    if (!closeDialogOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape" && !closingAccount) setCloseDialogOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDialogOpen, closingAccount]);

  if (section === "integrations") return <CalendarIntegrationsPage />;

  function openCloseDialog() {
    setCloseError("");
    setCloseDialogOpen(true);
  }

  function dismissCloseDialog() {
    if (closingAccount) return;
    setCloseError("");
    setCloseDialogOpen(false);
  }

  async function handleCloseAccount() {
    setClosingAccount(true);
    setCloseError("");
    try {
      await closeCurrentAccount();
      localStorage.removeItem("bragstack_token");
      sessionStorage.removeItem("bragstack_settings_notice");
      window.location.assign("/login?account=closed");
    } catch (requestError) {
      setCloseError(
        requestError.response?.data?.detail
        || "Your account could not be closed right now. Please try again.",
      );
      setClosingAccount(false);
    }
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <p>ACCOUNT</p>
        <h1>Settings</h1>
        <span>Manage your profile, integrations, public appearance, privacy, and BragStack account.</span>
      </header>

      {notice && <div className="settings-success" role="status">✓ {notice}</div>}

      <section className="settings-grid">
        {SETTINGS.map(({ href, icon: Icon, title, description, comingSoon }) => (
          comingSoon ? (
            <div className="settings-card settings-card-disabled" key={title}>
              <div className="settings-card-icon"><Icon size={22} /></div>
              <div>
                <div className="settings-card-title"><h2>{title}</h2><small>Coming soon</small></div>
                <p>{description}</p>
              </div>
            </div>
          ) : (
            <a className="settings-card" href={href} key={title}>
              <div className="settings-card-icon"><Icon size={22} /></div>
              <div>
                <div className="settings-card-title"><h2>{title}</h2><ChevronRight size={19} /></div>
                <p>{description}</p>
              </div>
            </a>
          )
        ))}

        <button className="settings-card settings-card-button" type="button" onClick={startProductTour}>
          <div className="settings-card-icon"><GraduationCap size={22} /></div>
          <div>
            <div className="settings-card-title"><h2>Help & tutorial</h2><ChevronRight size={19} /></div>
            <p>Restart the guided BragStack tour whenever you want a refresher.</p>
          </div>
        </button>
      </section>

      <section className="settings-danger-zone" aria-labelledby="close-account-heading">
        <div>
          <p>DANGER ZONE</p>
          <h2 id="close-account-heading">Close account</h2>
          <span>Permanently close your BragStack account and remove your user-owned workspace data.</span>
        </div>
        <button className="settings-close-account-button" type="button" onClick={openCloseDialog}>
          <Trash2 size={18} />
          Close account
        </button>
      </section>

      {closeDialogOpen && (
        <div className="settings-close-backdrop" role="presentation">
          <section
            className="settings-close-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-close-title"
            aria-describedby="settings-close-description"
          >
            <button
              type="button"
              className="settings-close-dialog-x"
              onClick={dismissCloseDialog}
              aria-label="Cancel account closure"
              disabled={closingAccount}
            >
              <X size={20} />
            </button>

            <div className="settings-close-dialog-icon"><Trash2 size={23} /></div>
            <p className="settings-close-eyebrow">CLOSE ACCOUNT</p>
            <h2 id="settings-close-title">Are you sure?</h2>
            <p id="settings-close-description">
              This permanently deletes your BragStack account and user-owned workspace data. This cannot be undone.
            </p>
            <ul>
              <li>Your profile, accomplishments, Impact Receipts, saved resumes, shares, and other user-owned product data will be removed.</li>
              <li>Limited billing, security, legal, or operational records may be retained when required for legitimate compliance purposes.</li>
              <li>If you have an active paid subscription, cancel it in Plan & billing before closing your account.</li>
              <li>Copies of information that other people already saved from a public share cannot be remotely deleted.</li>
            </ul>

            {closeError && <div className="settings-close-error" role="alert">{closeError}</div>}

            <div className="settings-close-actions">
              <button type="button" className="settings-close-cancel" onClick={dismissCloseDialog} disabled={closingAccount}>
                Cancel
              </button>
              <button
                type="button"
                className="settings-close-confirm"
                onClick={handleCloseAccount}
                disabled={closingAccount}
              >
                {closingAccount ? "Closing account…" : "Yes, close my account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
