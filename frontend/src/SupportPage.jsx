import { useMemo, useState } from "react";
import { AlertTriangle, Bug, CreditCard, GraduationCap, LifeBuoy, Lightbulb, LockKeyhole, Send, UserRound, Accessibility } from "lucide-react";
import "./SupportPage.css";

const categories = [
  { value: "bug", label: "Bug / something is broken", icon: Bug, hint: "Broken buttons, errors, incorrect behavior, or something that does not work as expected." },
  { value: "account", label: "Account / sign-in", icon: UserRound, hint: "Login, verification, password reset, account access, or profile problems." },
  { value: "billing", label: "Billing / subscription", icon: CreditCard, hint: "Existing Stripe subscriptions, cancellation, refunds, receipts, or billing questions." },
  { value: "education", label: "Education / applications", icon: GraduationCap, hint: "Education records, applications, scholarships, internships, essays, or student workflows." },
  { value: "feature", label: "Feature request", icon: Lightbulb, hint: "Tell us what would make BragStack more useful to you." },
  { value: "accessibility", label: "Accessibility", icon: Accessibility, hint: "Keyboard, screen reader, contrast, motion, focus, or other accessibility issues." },
  { value: "privacy_security", label: "Privacy / security", icon: LockKeyhole, hint: "Privacy concerns, unexpected exposure, suspicious behavior, or security questions." },
  { value: "other", label: "Other", icon: LifeBuoy, hint: "Anything that does not fit the categories above." },
];

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  if (window.location.hostname === "usebragstack.com" || window.location.hostname === "www.usebragstack.com") {
    return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "https://api.usebragstack.com";
  }
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export default function SupportPage() {
  const [form, setForm] = useState({ category: "bug", title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const selected = useMemo(() => categories.find((item) => item.value === form.category) || categories[0], [form.category]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("bragstack_token");
      if (!token) {
        window.location.assign("/login");
        return;
      }
      const response = await fetch(`${getApiBaseUrl().replace(/\/$/, "")}/beta/support-ticket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          page_url: window.location.href,
          browser: navigator.userAgent || "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(data.detail || "Your support request could not be submitted.");
      setResult(data);
      setForm({ category: form.category, title: "", description: "" });
    } catch (requestError) {
      setError(requestError.message || "Your support request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  const SelectedIcon = selected.icon;

  return (
    <main className="support-page">
      <header className="support-hero">
        <div className="support-hero-icon"><LifeBuoy size={26} /></div>
        <div><p>SUPPORT CENTER</p><h1>Tell us what needs attention.</h1><span>Choose a category and send the details. Your request is saved to BragStack support and can be synchronized into our private GitHub issue workflow.</span></div>
      </header>

      <section className="support-safety" role="note">
        <AlertTriangle size={20} />
        <div><strong>Keep sensitive information out of support tickets.</strong><span>Do not submit passwords, access tokens, API keys, full payment-card data, Social Security numbers, medical information, student records, confidential employer documents, source code you cannot share, or other restricted material.</span></div>
      </section>

      <div className="support-layout">
        <section className="support-categories" aria-label="Support categories">
          <h2>What can we help with?</h2>
          {categories.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" className={form.category === value ? "active" : ""} onClick={() => update("category", value)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </section>

        <form className="support-form" onSubmit={submit}>
          <div className="support-selected-category"><SelectedIcon size={19} /><div><strong>{selected.label}</strong><span>{selected.hint}</span></div></div>
          <label>Short summary<input value={form.title} onChange={(event) => update("title", event.target.value)} minLength={4} maxLength={140} placeholder="Example: Resume Builder export button does nothing" required /></label>
          <label>What happened?<textarea value={form.description} onChange={(event) => update("description", event.target.value)} minLength={10} maxLength={6000} rows={9} placeholder="What were you trying to do? What happened instead? If this is a bug, include the steps that reproduce it and any error message that is safe to share." required /></label>
          <p className="support-form-note">We automatically include the current BragStack page and basic browser/device information to help reproduce technical issues. We do not ask you to paste credentials or private evidence.</p>
          {error && <div className="support-error" role="alert">{error}</div>}
          {result && <div className="support-success" role="status"><strong>Request received · {result.ticket_id}</strong><span>{result.github_synced && result.github_issue_number ? `Added to our private GitHub queue as issue #${result.github_issue_number}.` : "It is safely recorded in BragStack's support queue."}</span></div>}
          <button className="support-submit" type="submit" disabled={submitting}><Send size={17} />{submitting ? "Sending…" : "Submit support request"}</button>
        </form>
      </div>

      <section className="support-contact"><strong>Need to follow up?</strong><span>Email <a href="mailto:tobias.scott@usebragstack.com">tobias.scott@usebragstack.com</a> and include your BragStack ticket ID. Never email passwords or secrets.</span></section>
    </main>
  );
}
