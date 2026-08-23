import { useState } from "react";
import { Lock, Mail, Sparkles, UserPlus } from "lucide-react";
import "./AuthPage.css";

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function GitHubMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
    >
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.74 0-1.27.45-2.3 1.2-3.11-.12-.3-.52-1.48.11-3.08 0 0 .98-.31 3.16 1.19a10.9 10.9 0 0 1 5.75 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.08.75.81 1.2 1.84 1.2 3.11 0 4.46-2.71 5.45-5.29 5.74.42.36.79 1.07.79 2.16v3.02c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function AuthPage({ mode = "login", onLogin, onRegister }) {
  const isRegister = mode === "register";
  const apiBaseUrl = getApiBaseUrl().replace(/\/$/, "");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (isRegister) {
        await onRegister(formData);
      } else {
        await onLogin({ email: formData.email, password: formData.password });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        isRegister
          ? "Could not create your account. Try again."
          : "Could not log you in. Check your email and password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="mini-label">BragStack</p>
          <h1>
            Save your wins before
            <span> they disappear.</span>
          </h1>
          <p>
            Track technical work, turn progress into resume bullets, and build a
            private career proof system you can reuse for reviews, interviews,
            raises, and job searches.
          </p>
          <div className="auth-proof-list">
            <span>Private by default</span>
            <span>Resume-ready proof</span>
            <span>Weekly summaries</span>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-icon">
            {isRegister ? <UserPlus size={24} /> : <Sparkles size={24} />}
          </div>

          <p className="mini-label">
            {isRegister ? "Create account" : "Welcome back"}
          </p>
          <h2>{isRegister ? "Start your BragStack" : "Log in to BragStack"}</h2>
          <p className="auth-muted">
            {isRegister
              ? "Create your private workspace for career proof."
              : "Open your dashboard and keep building your proof."}
          </p>

          <div className="auth-oauth-grid">
            <a
              className="auth-oauth-button auth-oauth-google"
              href={`${apiBaseUrl}/auth/google/login`}
            >
              <span className="auth-google-mark" aria-hidden="true">G</span>
              <span>Continue with Google</span>
            </a>
            <a
              className="auth-oauth-button auth-oauth-github"
              href={`${apiBaseUrl}/auth/github/login`}
            >
              <GitHubMark />
              <span>Continue with GitHub</span>
            </a>
          </div>

          <div className="auth-divider"><span>or use email</span></div>

          {errorMessage && <div className="auth-error">{errorMessage}</div>}

          {isRegister && (
            <label className="auth-field">
              Name
              <div>
                <UserPlus size={17} />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tee"
                  required
                />
              </div>
            </label>
          )}

          <label className="auth-field">
            Email
            <div>
              <Mail size={17} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            Password
            <div>
              <Lock size={17} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>
          </label>

          <button className="btn primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Working..." : isRegister ? "Create account" : "Log in"}
          </button>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to BragStack?"}{" "}
            <a href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Log in" : "Create one"}
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}

export default AuthPage;
