import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck, Sparkles } from "lucide-react";

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  if (window.location.hostname === "usebragstack.com" || window.location.hostname === "www.usebragstack.com") {
    return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "https://api.usebragstack.com";
  }
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function UpgradePage() {
  const [status, setStatus] = useState("Preparing secure checkout…");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    void startCheckout();
    // Checkout should start only once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "min(100%, 620px)", padding: 32, borderRadius: 28, border: "1px solid rgba(148,163,184,.2)", background: "rgba(15,23,42,.88)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Sparkles size={22} />
          <strong>BragStack Pro · $9/month</strong>
        </div>
        <h1>Unlock your full career proof system.</h1>
        <p>Unlimited proof and Impact Receipts, advanced career analytics, performance-review and promotion packets, PDF exports, integrations, and advanced public profile features.</p>

        <div style={{ display: "grid", gap: 10, margin: "24px 0" }}>
          <span><ShieldCheck size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Secure Stripe-hosted checkout</span>
          <span><CreditCard size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Subscription access updates through verified billing events</span>
        </div>

        <p><strong>{status}</strong></p>
        {error && <p style={{ color: "#fecaca" }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          {!token ? (
            <>
              <a className="btn primary" href="/login">Sign in</a>
              <a className="btn secondary" href="/register">Create account</a>
            </>
          ) : !loading ? (
            <button className="btn primary" type="button" onClick={startCheckout}>Try checkout again</button>
          ) : null}
          <a className="btn secondary" href="/#pricing"><ArrowLeft size={16} /> Back to pricing</a>
        </div>
      </section>
    </main>
  );
}

export default UpgradePage;
