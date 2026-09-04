import { useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck, Sparkles, Video } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  if (window.location.hostname === "usebragstack.com" || window.location.hostname === "www.usebragstack.com") {
    return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "https://api.usebragstack.com";
  }
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function UpgradePage() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [billingAcknowledged, setBillingAcknowledged] = useState(false);
  const token = localStorage.getItem("bragstack_token");

  async function startCheckout() {
    if (!token) {
      setStatus("Sign in first to upgrade your BragStack account.");
      return;
    }
    if (!billingAcknowledged) {
      setError("Please confirm the recurring billing terms before continuing to Stripe.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Opening secure Stripe Checkout…");

    try {
      const apiBase = getApiBaseUrl().replace(/\/$/, "");
      const response = await fetch(`${apiBase}/billing/checkout-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.replace("/login");
        return;
      }

      if (!response.ok || !data.url) {
        throw new Error(data.detail || "Stripe Checkout is unavailable right now.");
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      setLoading(false);
      setStatus("Checkout did not open.");
      setError(checkoutError.message || "Please try again.");
    }
  }

  if (loading) {
    return <BragStackLoader message="Opening secure checkout…" detail="Connecting BragStack to Stripe. You'll continue in a secure checkout window." />;
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "min(100%, 660px)", padding: 32, borderRadius: 28, border: "1px solid rgba(148,163,184,.2)", background: "rgba(15,23,42,.88)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Sparkles size={22} />
          <strong>BragStack Pro · $9/month</strong>
        </div>
        <h1>Unlock your full career proof system.</h1>
        <p>Unlimited proof and Impact Receipts, the Practice Interviewer, advanced career analytics, performance-review and promotion packets, PDF exports, integrations, and advanced public profile features.</p>

        <div style={{ display: "grid", gap: 10, margin: "24px 0" }}>
          <span><Video size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Practice role-aware interviews with adaptive answer coaching</span>
          <span><ShieldCheck size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Secure Stripe-hosted checkout</span>
          <span><CreditCard size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Subscription access updates through verified billing events</span>
        </div>

        <div style={{ margin: "24px 0", padding: 18, borderRadius: 18, border: "1px solid rgba(166,220,255,.24)", background: "rgba(2,6,23,.48)" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Recurring subscription terms</strong>
          <p style={{ margin: "0 0 10px", lineHeight: 1.6 }}><strong>$9 per month.</strong> BragStack Pro automatically renews every month until you cancel. Cancel future renewal from BragStack billing settings. Cancellation normally leaves Pro access active through the period already paid for. Fees already paid are non-refundable except where required by law or expressly stated at purchase.</p>
          <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>Review the <a href="/terms" target="_blank" rel="noreferrer">Terms</a>, <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>, and <a href="/legal/georgia-consumer-notice.html" target="_blank" rel="noreferrer">Georgia Billing & Privacy Notice</a>.</p>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", lineHeight: 1.5 }}>
            <input type="checkbox" checked={billingAcknowledged} onChange={(event) => setBillingAcknowledged(event.target.checked)} style={{ marginTop: 4 }} />
            <span>I understand this is a <strong>$9/month automatically renewing subscription</strong> and that I can cancel future renewal using BragStack billing settings.</span>
          </label>
        </div>

        {status && <p><strong>{status}</strong></p>}
        {error && <p style={{ color: "#fecaca" }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          {!token ? (
            <>
              <a className="btn primary" href="/login">Sign in</a>
              <a className="btn secondary" href="/register">Create account</a>
            </>
          ) : (
            <button className="btn primary" type="button" onClick={startCheckout} disabled={!billingAcknowledged}>Continue to secure Stripe checkout</button>
          )}
          <a className="btn secondary" href="/#pricing"><ArrowLeft size={16} /> Back to pricing</a>
        </div>
      </section>
    </main>
  );
}

export default UpgradePage;
