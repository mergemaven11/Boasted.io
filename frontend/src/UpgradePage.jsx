import { ArrowLeft, Gift, ShieldCheck, Sparkles, Video } from "lucide-react";

function UpgradePage() {
  const token = localStorage.getItem("bragstack_token");

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "min(100%, 660px)", padding: 32, borderRadius: 28, border: "1px solid rgba(148,163,184,.2)", background: "rgba(15,23,42,.88)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Sparkles size={22} />
          <strong>Boasted Pro · complimentary for now</strong>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", margin: "6px 0 12px" }} aria-label="Boasted Pro regular price $9 per month, currently a free gift">
          <del style={{ opacity: .65, fontSize: 18 }}>$9/month</del>
          <strong style={{ fontSize: 30, letterSpacing: "-.03em" }}>FREE GIFT</strong>
          <span style={{ opacity: .8 }}>No card required</span>
        </div>
        <h1>Pro is our gift while Boasted is in early access.</h1>
        <p>Every eligible account currently receives Boasted Pro access, including unlimited proof and Impact Receipts, the Practice Interviewer, advanced career analytics, performance-review and promotion packets, PDF exports, integrations, and advanced public profile features.</p>

        <div style={{ display: "grid", gap: 10, margin: "24px 0" }}>
          <span><Video size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Practice role-aware interviews with adaptive answer coaching</span>
          <span><Gift size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Temporary complimentary Pro access for early users</span>
          <span><ShieldCheck size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />No card, payment method, or paid checkout required for the gift</span>
        </div>

        <div style={{ margin: "24px 0", padding: 18, borderRadius: 18, border: "1px solid rgba(166,220,255,.24)", background: "rgba(2,6,23,.48)" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Temporary promotional access</strong>
          <p style={{ margin: "0 0 10px", lineHeight: 1.6 }}>Boasted Pro is temporarily complimentary as an early-access gift. Receiving this access does <strong>not</strong> create a paid subscription, does not authorize recurring charges, and does not require a card or payment method.</p>
          <p style={{ margin: "0 0 10px", lineHeight: 1.6 }}>This promotional access may change or end later. If Boasted offers paid Pro access again, you will be shown the price and recurring-billing terms and must separately complete checkout and consent before Boasted charges you.</p>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Existing paid subscriptions remain governed by their current billing and cancellation terms. Review the <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          {!token ? (
            <>
              <a className="btn primary" href="/register">Create account with Pro gift</a>
              <a className="btn secondary" href="/login">Sign in</a>
            </>
          ) : (
            <a className="btn primary" href="/app">Use my Pro access</a>
          )}
          <a className="btn secondary" href="/#pricing"><ArrowLeft size={16} /> Back to pricing</a>
        </div>
      </section>
    </main>
  );
}

export default UpgradePage;
