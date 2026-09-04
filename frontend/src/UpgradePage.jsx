import { ArrowLeft, CheckCircle2, LifeBuoy, Sparkles } from "lucide-react";

function UpgradePage() {
  const token = localStorage.getItem("bragstack_token");

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "min(100%, 680px)", padding: 32, borderRadius: 28, border: "1px solid rgba(148,163,184,.2)", background: "rgba(15,23,42,.88)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Sparkles size={22} />
          <strong>BragStack Pro · Open Access</strong>
        </div>
        <h1>Pro is temporarily unlocked for everyone.</h1>
        <p>Paid upgrades are paused right now. You do not need to enter a card or start a subscription to use the ordinary BragStack Pro career tools during this open-access period.</p>

        <div style={{ display: "grid", gap: 12, margin: "24px 0" }}>
          <span><CheckCircle2 size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Unlimited proof entries and Impact Receipts</span>
          <span><CheckCircle2 size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />Resume Builder, Practice Interview, career analytics, and career packets</span>
          <span><CheckCircle2 size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />No new BragStack Pro subscription is required during open access</span>
        </div>

        <div style={{ margin: "24px 0", padding: 18, borderRadius: 18, border: "1px solid rgba(166,220,255,.24)", background: "rgba(2,6,23,.48)" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>No-charge access is temporary</strong>
          <p style={{ margin: 0, lineHeight: 1.6 }}>BragStack may change plan availability or resume paid plans later. We will not silently create a paid subscription from this page. Any future paid checkout will require clear pricing and an affirmative purchase step.</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          {token ? <a className="btn primary" href="/app">Open BragStack Pro</a> : <a className="btn primary" href="/register">Create free account</a>}
          {token && <a className="btn secondary" href="/app/support"><LifeBuoy size={16} /> Support</a>}
          <a className="btn secondary" href="/"><ArrowLeft size={16} /> Back to BragStack</a>
        </div>
      </section>
    </main>
  );
}

export default UpgradePage;