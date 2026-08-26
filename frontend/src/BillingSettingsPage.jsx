import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, RefreshCcw, XCircle } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import { cancelSubscription, getBillingStatus, resumeSubscription } from "./api.js";
import "./BillingSettingsPage.css";

function formatPeriodEnd(timestamp) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export default function BillingSettingsPage() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");

  const periodEnd = useMemo(() => formatPeriodEnd(billing?.current_period_end), [billing]);
  const isPro = billing?.plan === "pro";
  const cancelling = Boolean(isPro && billing?.cancel_at_period_end);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getBillingStatus();
        if (active) setBilling(data);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.detail || "We couldn't load your billing details.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function runAction(kind) {
    setAction(kind);
    setError("");
    try {
      const data = kind === "cancel" ? await cancelSubscription() : await resumeSubscription();
      setBilling(data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "We couldn't update your subscription. Please try again.");
    } finally {
      setAction("");
    }
  }

  if (loading) {
    return <BragStackLoader compact message="Loading billing…" detail="Checking your plan and subscription status securely." />;
  }

  return (
    <main className="billing-settings-page">
      <a className="billing-back" href="/app/settings"><ArrowLeft size={18} /> Settings</a>
      <header className="billing-header">
        <p>ACCOUNT</p>
        <h1>Plan & billing</h1>
        <span>Review your plan, renewal status, and subscription controls.</span>
      </header>

      {billing ? (
        <>
          <section className="billing-card billing-plan-card">
            <div className="billing-plan-icon"><CreditCard size={24} /></div>
            <div className="billing-plan-copy">
              <div className="billing-plan-heading">
                <div>
                  <span className="billing-kicker">Current plan</span>
                  <h2>{isPro ? "BragStack Pro" : "BragStack Free"}</h2>
                </div>
                <span className={`billing-badge ${isPro ? "billing-badge-pro" : ""}`}>{isPro ? "Pro" : "Free"}</span>
              </div>

              {isPro && !cancelling ? (
                <p>{periodEnd ? `Your subscription renews on ${periodEnd}.` : "Your Pro subscription is active and set to renew."}</p>
              ) : null}

              {cancelling ? (
                <div className="billing-status-panel billing-status-cancelled">
                  <XCircle size={20} />
                  <div>
                    <strong>Your Pro plan is canceled.</strong>
                    <span>{periodEnd ? `You'll keep all Pro features until ${periodEnd}. After that, your account will automatically switch to the Free plan. You won't be charged again.` : "You'll keep Pro access through the end of your current paid billing period, then automatically switch to Free."}</span>
                  </div>
                </div>
              ) : null}

              {!isPro ? (
                <div className="billing-status-panel">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>You're on the Free plan.</strong>
                    <span>Upgrade whenever you want access to BragStack Pro features.</span>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {error ? <div className="billing-error" role="alert">{error}</div> : null}

          <section className="billing-card billing-actions-card">
            <div>
              <h2>Subscription</h2>
              <p>{isPro ? (cancelling ? "Changed your mind? Resume renewal before your paid period ends." : "Canceling stops future renewals. Your paid access stays active through the end of this billing period.") : "You can move to Pro from the upgrade page."}</p>
            </div>

            {isPro && !cancelling ? (
              <button className="billing-button billing-button-danger" type="button" disabled={Boolean(action)} onClick={() => runAction("cancel")}>
                {action === "cancel" ? <RefreshCcw className="billing-spin" size={17} /> : null}
                {action === "cancel" ? "Canceling…" : "Cancel subscription"}
              </button>
            ) : null}

            {isPro && cancelling ? (
              <button className="billing-button billing-button-primary" type="button" disabled={Boolean(action)} onClick={() => runAction("resume")}>
                {action === "resume" ? <RefreshCcw className="billing-spin" size={17} /> : null}
                {action === "resume" ? "Resuming…" : "Resume subscription"}
              </button>
            ) : null}

            {!isPro ? <a className="billing-button billing-button-primary" href="/upgrade">Upgrade to Pro</a> : null}
          </section>
        </>
      ) : error ? <div className="billing-error" role="alert">{error}</div> : null}
    </main>
  );
}
