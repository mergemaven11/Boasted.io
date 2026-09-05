import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Gift, RefreshCcw, XCircle } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import { cancelSubscription, resumeSubscription } from "./api.js";
import "./BillingSettingsPage.css";

function apiBase(){if(window.location.hostname.endsWith(".app.github.dev"))return "/api";return import.meta.env.VITE_API_BASE_URL||import.meta.env.VITE_API_URL||"http://localhost:8000";}
function formatPeriodEnd(value){if(!value)return null;const date=typeof value==="number"?new Date(value*1000):new Date(value);if(Number.isNaN(date.getTime()))return null;return new Intl.DateTimeFormat(undefined,{month:"long",day:"numeric",year:"numeric"}).format(date);}
function formatMoney(amount,currency="usd"){if(amount===null||amount===undefined)return null;try{return new Intl.NumberFormat(undefined,{style:"currency",currency:String(currency||"usd").toUpperCase()}).format(Number(amount));}catch{return `$${Number(amount).toFixed(2)}`;}}
function cardLabel(payment){if(!payment)return "Payment method not available";if(payment.type!=="card")return payment.type||"Payment method on file";const brand=payment.brand?payment.brand.charAt(0).toUpperCase()+payment.brand.slice(1):"Card";return `${brand} •••• ${payment.last4||"----"}`;}

export default function BillingSettingsPage(){
  const[billing,setBilling]=useState(null),[loading,setLoading]=useState(true),[action,setAction]=useState(""),[error,setError]=useState("");
  const periodEnd=useMemo(()=>formatPeriodEnd(billing?.current_period_end),[billing]);
  const isGift=Boolean(billing?.temporary_pro_gift);
  const hasSubscription=Boolean(billing?.has_subscription);
  const isPro=billing?.plan==="pro";
  const isPaidPro=Boolean(isPro&&hasSubscription&&!isGift);
  const cancelling=Boolean(isPaidPro&&billing?.cancel_at_period_end);
  const amount=formatMoney(billing?.amount,billing?.currency);
  const standardAmount=formatMoney(billing?.standard_monthly,"usd");

  async function loadBilling(){
    const token=localStorage.getItem("bragstack_token");
    const response=await fetch(`${apiBase()}/billing/details`,{headers:token?{Authorization:`Bearer ${token}`}:{},cache:"no-store"});
    if(!response.ok)throw new Error(`Billing details returned ${response.status}`);
    return response.json();
  }

  useEffect(()=>{let active=true;(async()=>{try{const data=await loadBilling();if(active)setBilling(data);}catch{if(active)setError("We couldn't load your billing details.");}finally{if(active)setLoading(false);}})();return()=>{active=false};},[]);

  async function runAction(kind){setAction(kind);setError("");try{if(kind==="cancel")await cancelSubscription();else await resumeSubscription();setBilling(await loadBilling());}catch(requestError){setError(requestError.response?.data?.detail||"We couldn't update your subscription. Please try again.");}finally{setAction("");}}
  if(loading)return <BragStackLoader compact message="Loading plan…" detail="Checking your Pro gift or paid subscription status securely."/>;

  return <main className="billing-settings-page">
    <a className="billing-back" href="/app/settings"><ArrowLeft size={18}/> Settings</a>
    <header className="billing-header"><p>ACCOUNT</p><h1>Plan & billing</h1><span>{isGift?"Your complimentary Pro gift does not require a card, payment method, or paid checkout.":"See your plan, renewal details, payment method, and subscription controls."}</span></header>
    {billing?<>
      <section className="billing-card billing-plan-card"><div className="billing-plan-icon">{isGift?<Gift size={24}/>:<CreditCard size={24}/>}</div><div className="billing-plan-copy"><div className="billing-plan-heading"><div><span className="billing-kicker">Current plan</span><h2>{isGift?"BragStack Pro · Free Gift":isPro?"BragStack Pro":"BragStack Free"}</h2></div><span className={`billing-badge ${isPro?"billing-badge-pro":""}`}>{isGift?"Gift":isPro?"Pro":"Free"}</span></div>{isGift?<div className="billing-status-panel"><CheckCircle2 size={20}/><div><strong>Pro is complimentary for now.</strong><span>No card is required, no payment method is collected for this gift, and receiving it does not create a paid subscription or authorize future recurring charges.</span></div></div>:null}{isPaidPro&&!cancelling?<p>{periodEnd?`Your next renewal is ${periodEnd}.`:"Your Pro subscription is active and set to renew."}</p>:null}{cancelling?<div className="billing-status-panel billing-status-cancelled"><XCircle size={20}/><div><strong>Your Pro plan is canceled.</strong><span>{periodEnd?`You'll keep all Pro features until ${periodEnd}. You won't be charged again unless you resume renewal.`:"You'll keep Pro access through the end of your current paid billing period, then automatically switch to Free."}</span></div></div>:null}{!isPro?<div className="billing-status-panel"><CheckCircle2 size={20}/><div><strong>You're on the Free plan.</strong><span>Upgrade whenever paid Pro becomes available.</span></div></div>:null}</div></section>
      {isGift?<section className="billing-detail-grid" aria-label="Complimentary Pro details">
        <article><span>Current access price</span><strong>FREE GIFT</strong><small>{standardAmount?<><del>{standardAmount} / month</del> while the early-access gift is active</>:"Temporary complimentary access"}</small></article>
        <article><span>Payment method</span><strong>Not required</strong><small>BragStack does not ask for a card for this gift</small></article>
        <article><span>Renewal</span><strong>No paid renewal</strong><small>This gift does not create automatic billing</small></article>
        <article><span>Access source</span><strong>Early-access gift</strong><small>Future paid Pro would require separate checkout and consent</small></article>
      </section>:null}
      {isPaidPro?<section className="billing-detail-grid" aria-label="Billing details">
        <article><span>Next charge / renewal</span><strong>{cancelling?"No future charge":periodEnd||"Pending"}</strong><small>{cancelling?"Renewal is turned off":billing.stripe_live?"Synced from Stripe":"Based on your current billing record"}</small></article>
        <article><span>Subscription price</span><strong>{amount||"—"}{amount&&billing.interval?` / ${billing.interval}`:""}</strong><small>{String(billing.currency||"USD").toUpperCase()} · Taxes, if applicable, may be added by Stripe</small></article>
        <article><span>Payment method</span><strong>{cardLabel(billing.payment_method)}</strong><small>{billing.payment_method?.exp_month&&billing.payment_method?.exp_year?`Expires ${String(billing.payment_method.exp_month).padStart(2,"0")}/${String(billing.payment_method.exp_year).slice(-2)}`:"Only safe payment metadata is shown"}</small></article>
        <article><span>Subscription status</span><strong>{String(billing.status||"active").replace(/_/g," ")}</strong><small>{cancelling?"Cancels at period end":"Automatic renewal enabled"}</small></article>
      </section>:null}
      {error?<div className="billing-error" role="alert">{error}</div>:null}
      <section className="billing-card billing-actions-card"><div><h2>{isGift?"Complimentary access":"Subscription"}</h2><p>{isGift?"Use every Pro feature while the early-access gift is active. There is nothing to purchase, cancel, or renew for the gift.":isPaidPro?(cancelling?"Changed your mind? Resume renewal before your paid period ends.":"Canceling stops future renewals. Your paid access stays active through the end of this billing period."):"Paid Pro checkout is not currently required for complimentary access."}</p></div>{isPaidPro&&!cancelling?<button className="billing-button billing-button-danger" type="button" disabled={Boolean(action)} onClick={()=>runAction("cancel")}>{action==="cancel"?<RefreshCcw className="billing-spin" size={17}/>:null}{action==="cancel"?"Canceling…":"Cancel subscription"}</button>:null}{isPaidPro&&cancelling?<button className="billing-button billing-button-primary" type="button" disabled={Boolean(action)} onClick={()=>runAction("resume")}>{action==="resume"?<RefreshCcw className="billing-spin" size={17}/>:null}{action==="resume"?"Resuming…":"Resume subscription"}</button>:null}{!isPro&&!isGift?<a className="billing-button billing-button-primary" href="/upgrade">View Pro</a>:null}</section>
      <p className="billing-security-note">{isGift?"No card or payment method is required for complimentary Pro access.":"BragStack never receives or stores your full card number or CVC. Payment processing stays with Stripe."}</p>
    </>:error?<div className="billing-error" role="alert">{error}</div>:null}
  </main>;
}
