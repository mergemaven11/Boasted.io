import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, LifeBuoy, RefreshCcw, XCircle } from "lucide-react";
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
  const openPro=Boolean(billing?.open_pro_access);
  const hasPaidSubscription=Boolean(billing?.has_subscription);
  const cancelling=Boolean(hasPaidSubscription&&billing?.cancel_at_period_end);
  const amount=formatMoney(billing?.amount,billing?.currency);

  async function loadBilling(){
    const token=localStorage.getItem("bragstack_token");
    const response=await fetch(`${apiBase()}/billing/details`,{headers:token?{Authorization:`Bearer ${token}`}:{},cache:"no-store"});
    if(!response.ok)throw new Error(`Billing details returned ${response.status}`);
    return response.json();
  }

  useEffect(()=>{let active=true;(async()=>{try{const data=await loadBilling();if(active)setBilling(data);}catch{if(active)setError("We couldn't load your billing details.");}finally{if(active)setLoading(false);}})();return()=>{active=false};},[]);

  async function runAction(kind){setAction(kind);setError("");try{if(kind==="cancel")await cancelSubscription();else await resumeSubscription();setBilling(await loadBilling());}catch(requestError){setError(requestError.response?.data?.detail||"We couldn't update your subscription. Please try again.");}finally{setAction("");}}
  if(loading)return <BragStackLoader compact message="Loading billing…" detail="Checking your plan and any existing Stripe subscription."/>;

  return <main className="billing-settings-page">
    <a className="billing-back" href="/app/settings"><ArrowLeft size={18}/> Settings</a>
    <header className="billing-header"><p>ACCOUNT</p><h1>Plan & billing</h1><span>See your current access and manage any Stripe subscription already connected to your account.</span></header>
    {billing?<>
      <section className="billing-card billing-plan-card"><div className="billing-plan-icon"><CreditCard size={24}/></div><div className="billing-plan-copy"><div className="billing-plan-heading"><div><span className="billing-kicker">Current access</span><h2>{openPro?"BragStack Pro · Open Access":hasPaidSubscription?"BragStack Pro":"BragStack Free"}</h2></div><span className={`billing-badge ${(openPro||hasPaidSubscription)?"billing-badge-pro":""}`}>{openPro?"Pro open":"Free"}</span></div>{openPro&&!hasPaidSubscription?<div className="billing-status-panel"><CheckCircle2 size={20}/><div><strong>Pro is currently unlocked at no charge.</strong><span>No card is required and this open-access state does not create a new recurring subscription.</span></div></div>:null}{hasPaidSubscription&&!cancelling?<p>{periodEnd?`Your existing Stripe subscription is currently scheduled to renew on ${periodEnd}.`:"Your existing Stripe subscription is still active."}</p>:null}{hasPaidSubscription&&openPro&&!cancelling?<div className="billing-status-panel billing-status-cancelled"><XCircle size={20}/><div><strong>Paid upgrades are paused, but existing subscriptions can still renew.</strong><span>If you do not want another charge, cancel future renewal below. Your ordinary Pro tools remain available during the open-access period.</span></div></div>:null}{cancelling?<div className="billing-status-panel billing-status-cancelled"><XCircle size={20}/><div><strong>Your paid renewal is canceled.</strong><span>{periodEnd?`Stripe will not renew this subscription after ${periodEnd}.`:"Future renewal is turned off."} Open Pro access is currently available separately at no charge.</span></div></div>:null}{!openPro&&!hasPaidSubscription?<div className="billing-status-panel"><CheckCircle2 size={20}/><div><strong>You're on the Free plan.</strong><span>Paid upgrades are not currently being offered from this page.</span></div></div>:null}</div></section>
      {hasPaidSubscription?<section className="billing-detail-grid" aria-label="Existing Stripe subscription details">
        <article><span>Next charge / renewal</span><strong>{cancelling?"No future charge":periodEnd||"Pending"}</strong><small>{cancelling?"Renewal is turned off":billing.stripe_live?"Synced from Stripe":"Based on your current billing record"}</small></article>
        <article><span>Subscription price</span><strong>{amount||"—"}{amount&&billing.interval?` / ${billing.interval}`:""}</strong><small>{String(billing.currency||"USD").toUpperCase()} · Taxes, if applicable, may be added by Stripe</small></article>
        <article><span>Payment method</span><strong>{cardLabel(billing.payment_method)}</strong><small>{billing.payment_method?.exp_month&&billing.payment_method?.exp_year?`Expires ${String(billing.payment_method.exp_month).padStart(2,"0")}/${String(billing.payment_method.exp_year).slice(-2)}`:"Only safe payment metadata is shown"}</small></article>
        <article><span>Subscription status</span><strong>{String(billing.status||"active").replace(/_/g," ")}</strong><small>{cancelling?"Cancels at period end":"Automatic renewal may still be enabled"}</small></article>
      </section>:null}
      {error?<div className="billing-error" role="alert">{error}</div>:null}
      <section className="billing-card billing-actions-card"><div><h2>{hasPaidSubscription?"Existing subscription":"Open access"}</h2><p>{hasPaidSubscription?(cancelling?"Future paid renewal is already off.":"Canceling stops future paid renewals. BragStack's current open Pro access is separate from this Stripe subscription."):"There is no new paid subscription to manage. Pro is currently available without starting one."}</p></div>{hasPaidSubscription&&!cancelling?<button className="billing-button billing-button-danger" type="button" disabled={Boolean(action)} onClick={()=>runAction("cancel")}>{action==="cancel"?<RefreshCcw className="billing-spin" size={17}/>:null}{action==="cancel"?"Canceling…":"Cancel future renewal"}</button>:null}{hasPaidSubscription&&cancelling&&!openPro?<button className="billing-button billing-button-primary" type="button" disabled={Boolean(action)} onClick={()=>runAction("resume")}>{action==="resume"?<RefreshCcw className="billing-spin" size={17}/>:null}{action==="resume"?"Resuming…":"Resume subscription"}</button>:null}{!hasPaidSubscription?<a className="billing-button billing-button-primary" href="/app">Use Pro now</a>:null}<a className="billing-button" href="/app/support"><LifeBuoy size={16}/> Billing support</a></section>
      <p className="billing-security-note">BragStack never receives or stores your full card number or CVC. Payment processing stays with Stripe.</p>
    </>:error?<div className="billing-error" role="alert">{error}</div>:null}
  </main>;
}
