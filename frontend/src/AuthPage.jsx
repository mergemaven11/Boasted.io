import { useEffect, useRef, useState } from "react";
import { Lock, Mail, Sparkles, UserPlus } from "lucide-react";
import "./AuthPage.css";

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function waitForApiReady(apiBaseUrl, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("application/json")) {
        return true;
      }
    } catch {
      // A sleeping Render service can refuse or delay requests while it allocates
      // compute. Stay on BragStack's branded UI and retry until it is actually live.
    } finally {
      window.clearTimeout(requestTimeout);
    }

    await sleep(700);
  }

  return false;
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.74 0-1.27.45-2.3 1.2-3.11-.12-.3-.52-1.48.11-3.08 0 0 .98-.31 3.16 1.19a10.9 10.9 0 0 1 5.75 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.08.75.81 1.2 1.84 1.2 3.11 0 4.46-2.71 5.45-5.29 5.74.42.36.79 1.07.79 2.16v3.02c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function AuthPage({ mode = "login", onLogin }) {
  const isRegister = mode === "register";
  const apiBaseUrl = getApiBaseUrl().replace(/\/$/, "");
  const apiWarmPromiseRef = useRef(null);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const initialResetToken = hashParams.get("reset_token") || "";
  const initialVerifyToken = hashParams.get("verify_token") || "";

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlowSubmit, setIsSlowSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [connectingProvider, setConnectingProvider] = useState("");
  const [showReset, setShowReset] = useState(Boolean(initialResetToken));
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(Boolean(initialVerifyToken));

  async function ensureApiReady() {
    if (!apiWarmPromiseRef.current) {
      apiWarmPromiseRef.current = waitForApiReady(apiBaseUrl).finally(() => {
        apiWarmPromiseRef.current = null;
      });
    }
    return apiWarmPromiseRef.current;
  }

  useEffect(() => {
    void ensureApiReady();
  }, [apiBaseUrl]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const oauthToken = hash.get("oauth_token");
    const verifyToken = hash.get("verify_token");
    const resetTokenFromHash = hash.get("reset_token");

    if (oauthToken) {
      localStorage.setItem("bragstack_token", oauthToken);
      history.replaceState(null, "", "/login");
      window.location.replace("/app");
      return;
    }

    if (!isRegister && !verifyToken && !resetTokenFromHash && localStorage.getItem("bragstack_token")) {
      window.location.replace("/app");
      return;
    }

    if (verifyToken) {
      history.replaceState(null, "", "/login");
      void (async () => {
        try {
          const ready = await ensureApiReady();
          if (!ready) throw new Error("BragStack is taking longer than expected to start. Please try again.");

          const response = await fetch(`${apiBaseUrl}/auth/email-verification/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: verifyToken }),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.detail || "This verification link is invalid or expired.");
          localStorage.setItem("bragstack_token", data.access_token);
          window.location.replace("/app");
        } catch (error) {
          setErrorMessage(error.message || "This verification link is invalid or expired.");
          setIsVerifying(false);
        }
      })();
      return;
    }

    if (resetTokenFromHash) {
      history.replaceState(null, "", "/login");
    }
  }, [apiBaseUrl, isRegister]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setIsSlowSubmit(false);
    setErrorMessage("");
    setVerificationMessage("");
    const slowSubmitTimer = window.setTimeout(() => setIsSlowSubmit(true), 1200);

    try {
      const ready = await ensureApiReady();
      if (!ready) throw new Error("BragStack is taking longer than expected to start. Please try again.");

      if (isRegister) {
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Could not create your account. Try again.");
        setVerificationEmail(formData.email);
        setVerificationMessage(
          data.email_sent === false
            ? "Your account was created, but the verification email could not be sent yet. Use Resend verification below."
            : "Account created. Check your email and click the verification link before signing in.",
        );
      } else {
        await onLogin({ email: formData.email, password: formData.password });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.detail ||
          error.message ||
          (isRegister
            ? "Could not create your account. Try again."
            : "Could not log you in. Check your email and password."),
      );
    } finally {
      window.clearTimeout(slowSubmitTimer);
      setIsSlowSubmit(false);
      setIsSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!verificationEmail) return;
    setVerificationSubmitting(true);
    setVerificationMessage("");
    try {
      const ready = await ensureApiReady();
      if (!ready) throw new Error("BragStack is taking longer than expected to start. Please try again.");

      const response = await fetch(`${apiBaseUrl}/auth/email-verification/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Verification email could not be resent.");
      setVerificationMessage("A new verification email has been sent. Check your inbox.");
    } catch (error) {
      setVerificationMessage(error.message || "Verification email could not be resent.");
    } finally {
      setVerificationSubmitting(false);
    }
  }

  async function startOAuth(provider) {
    setConnectingProvider(provider);
    setErrorMessage("");

    try {
      const ready = await ensureApiReady();
      if (!ready) throw new Error("BragStack is taking longer than expected to start. Please try again.");
      window.location.assign(`${apiBaseUrl}/auth/${provider}/login`);
    } catch (error) {
      setErrorMessage(error.message || `Could not connect to ${provider}. Please try again.`);
      setConnectingProvider("");
    }
  }

  async function handleResetRequest(event) {
    event.preventDefault();
    setResetSubmitting(true);
    setResetMessage("");

    try {
      const ready = await ensureApiReady();
      if (!ready) throw new Error("BragStack is taking longer than expected to start. Please try again.");

      const response = await fetch(`${apiBaseUrl}/auth/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Password reset is unavailable right now.");
      setResetMessage("If that email belongs to an account, we sent a password reset link.");
    } catch (error) {
      setResetMessage(error.message || "Password reset is unavailable right now.");
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleResetConfirm(event) {
    event.preventDefault();
    setResetMessage("");

    if (newPassword.length < 8) {
      setResetMessage("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetMessage("The passwords do not match.");
      return;
    }

    setResetSubmitting(true);
    try {
      const ready = await ensureApiReady();
      if (!ready) throw new Error("BragStack is taking longer than expected to start. Please try again.");

      const response = await fetch(`${apiBaseUrl}/auth/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "This reset link is invalid or expired.");
      setResetMessage("Password updated. You can sign in now.");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setResetMessage(error.message || "This reset link is invalid or expired.");
    } finally {
      setResetSubmitting(false);
    }
  }

  const submitLabel = isSubmitting
    ? isRegister
      ? isSlowSubmit
        ? "Preparing your workspace…"
        : "Creating your account…"
      : isSlowSubmit
        ? "Opening your workspace…"
        : "Signing you in…"
    : isRegister
      ? "Create account"
      : "Log in";

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

        <form className="auth-card" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className="auth-icon">
            {isRegister ? <UserPlus size={24} /> : <Sparkles size={24} />}
          </div>

          <p className="mini-label">{isRegister ? "Create account" : "Welcome back"}</p>
          <h2>{isRegister ? "Start your BragStack" : "Log in to BragStack"}</h2>
          <p className="auth-muted">
            {isRegister
              ? "Create your private workspace for career proof."
              : "Open your dashboard and keep building your proof."}
          </p>

          {isVerifying && <div className="auth-reset-panel"><strong>Verifying your email…</strong><p>One moment while BragStack confirms your account.</p></div>}
          {errorMessage && <div className="auth-error">{errorMessage}</div>}

          {verificationMessage && (
            <div className="auth-reset-panel">
              <strong>Email verification</strong>
              <p>{verificationMessage}</p>
              {verificationEmail && (
                <button type="button" onClick={resendVerification} disabled={verificationSubmitting}>
                  {verificationSubmitting ? "Sending…" : "Resend verification email"}
                </button>
              )}
            </div>
          )}

          {isRegister && (
            <label className="auth-field">
              Name
              <div>
                <UserPlus size={17} />
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Tee" required />
              </div>
            </label>
          )}

          <label className="auth-field">
            Email
            <div>
              <Mail size={17} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
          </label>

          <label className="auth-field">
            Password
            <div>
              <Lock size={17} />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" minLength={8} required />
            </div>
          </label>

          {!isRegister && (
            <button type="button" className="auth-forgot-link" onClick={() => setShowReset((current) => !current)}>
              Forgot password?
            </button>
          )}

          <button className="btn primary auth-submit" disabled={isSubmitting || isVerifying || Boolean(connectingProvider)}>
            {submitLabel}
          </button>

          {isSlowSubmit && (
            <p className="auth-submit-status" role="status">
              Securely connecting to BragStack…
            </p>
          )}

          {showReset && !isRegister && (
            <div className="auth-reset-panel">
              {resetToken ? (
                <>
                  <strong>Choose a new password</strong>
                  <p>This reset link can be used once and expires after 30 minutes.</p>
                  <div className="auth-reset-stack">
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" minLength={8} />
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" minLength={8} />
                    <button type="button" onClick={handleResetConfirm} disabled={resetSubmitting || !newPassword || !confirmPassword}>
                      {resetSubmitting ? "Updating..." : "Update password"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <strong>Reset your password</strong>
                  <p>Enter the email address on your BragStack account.</p>
                  <div className="auth-reset-row">
                    <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="you@example.com" />
                    <button type="button" onClick={handleResetRequest} disabled={resetSubmitting || !resetEmail}>
                      {resetSubmitting ? "Sending..." : "Send link"}
                    </button>
                  </div>
                </>
              )}
              {resetMessage && <small>{resetMessage}</small>}
            </div>
          )}

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="auth-oauth-grid">
            <button type="button" className="auth-oauth-button auth-oauth-google" onClick={() => startOAuth("google")} disabled={Boolean(connectingProvider)}>
              <span className="auth-google-mark" aria-hidden="true">G</span>
              <span>{connectingProvider === "google" ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>
            <button type="button" className="auth-oauth-button auth-oauth-github" onClick={() => startOAuth("github")} disabled={Boolean(connectingProvider)}>
              <GitHubMark />
              <span>{connectingProvider === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
            </button>
          </div>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to BragStack?"}{" "}
            <a href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create one"}</a>
          </p>
        </form>
      </section>
    </main>
  );
}

export default AuthPage;
