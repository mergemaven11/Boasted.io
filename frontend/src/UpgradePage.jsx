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
  const [status, setStatus] = useState("Review the subscription details before continuing.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("bragstack_token");

  async function startCheckout() {
    if (!token) {
      setLoading(false);
      setStatus("Sign in first to upgrade your BragStack account.");
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

  if (token && loading) {
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

        <div style={{ margin: "22px 0", padding: 18, borderRadius: 18, border: "1px solid rgba(147,197,253,.22)", background: "rgba(2,6,23,.45)" }}>
          <strong>Subscription terms before you buy</strong>
          <ul style={{ margin: "12px 0 0", paddingLeft: 20, color: "#cbd5e1", lineHeight: 1.65 }}>
            <li>BragStack Pro is currently $9 per month, plus any applicable taxes shown at checkout.</li>
            <li>Your subscription renews automatically each month until you cancel.</li>
            <li>You can cancel future renewal through BragStack's available billing controls or support. Cancellation generally leaves paid access active through the end of the current paid period.</li>
            <li>Except where required by law or expressly stated at purchase, charges already paid are non-refundable.</li>
            <li>Stripe's checkout page shows the final amount and any promotion, tax, or payment details that apply to your purchase.</li>
          </ul>
          <p style={{ margin: "12px 0 0", color: "#94a3b8", fontSize: ".85rem", lineHeight: 1.55 }}>
            By continuing and completing the purchase, you agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</a> and acknowledge the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
          </p>
        </div>

        <p><strong>{status}</strong></p>
        {error && <p style={{ color: "#fecaca" }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          {!token ? (
            <>
              <a className="btn primary" href="/login">Sign in</a>
              <a className="btn secondary" href="/register">Create account</a>
            </>
          ) : (
            <button className="btn primary" type="button" onClick={startCheckout}>Continue to Stripe · $9/month</button>
          )}
          <a className="btn secondary" href="/#pricing"><ArrowLeft size={16} /> Back to pricing</a>
        </div>
      </section>
    </main>
  );
}

export default UpgradePage;
