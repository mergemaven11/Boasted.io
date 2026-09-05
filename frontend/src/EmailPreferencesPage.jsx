import { useEffect, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { getCurrentUser, updateMarketingPreferences } from "./api.js";
import BragStackLoader from "./BragStackLoader.jsx";
import "./EmailPreferencesPage.css";

export default function EmailPreferencesPage() {
  const [optedIn, setOptedIn] = useState(false);
  const [savedValue, setSavedValue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (!active) return;
        const current = Boolean(user?.marketing_email_opt_in);
        setOptedIn(current);
        setSavedValue(current);
      })
      .catch(() => {
        if (active) setError("We could not load your email preference. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const user = await updateMarketingPreferences(optedIn);
      const current = Boolean(user?.marketing_email_opt_in);
      setOptedIn(current);
      setSavedValue(current);
      setMessage(
        current
          ? "You are opted in to occasional BragStack marketing emails."
          : "You are opted out of BragStack marketing emails.",
      );
    } catch {
      setError("Your preference could not be saved. Nothing was changed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <BragStackLoader compact message="Loading email preferences…" detail="Checking your saved consent choice." />;
  }

  return (
    <main className="email-preferences-page">
      <a className="email-preferences-back" href="/app/settings"><ArrowLeft size={18} /> Settings</a>
      <header className="email-preferences-header">
        <p>ACCOUNT</p>
        <h1>Email preferences</h1>
        <span>Control optional product updates, early-access announcements, and promotional offers.</span>
      </header>

      <form className="email-preferences-card" onSubmit={handleSubmit}>
        <div className="email-preferences-icon"><Mail size={24} /></div>
        <div>
          <h2>Marketing emails</h2>
          <p>Account-security, verification, password-reset, and service messages are separate from this optional setting.</p>
        </div>

        <label className="email-preferences-toggle">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={(event) => setOptedIn(event.target.checked)}
          />
          <span>
            <strong>Send me occasional BragStack updates and offers.</strong>
            <small>I can change this choice or unsubscribe at any time.</small>
          </span>
        </label>

        <div className="email-preferences-safety">
          <ShieldCheck size={19} />
          <span>Changing this setting does not affect your account, complimentary Pro access, or ability to use BragStack.</span>
        </div>

        {message && <p className="email-preferences-success" role="status">{message}</p>}
        {error && <p className="email-preferences-error" role="alert">{error}</p>}

        <button className="btn primary" type="submit" disabled={saving || optedIn === savedValue}>
          {saving ? "Saving…" : "Save email preference"}
        </button>
      </form>
    </main>
  );
}
