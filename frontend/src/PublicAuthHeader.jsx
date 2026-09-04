import "./PublicAuthHeader.css";

export default function PublicAuthHeader() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const isRegister = path === "/register";
  const isLogin = path === "/login";

  if (!isRegister && !isLogin) return null;

  if (isRegister) {
    return (
      <div className="public-auth-register-actions" aria-label="Registration shortcuts">
        <a className="public-auth-button public-auth-button-secondary" href="/docs">Docs</a>
        <a className="public-auth-button public-auth-button-primary" href="/">Return</a>
      </div>
    );
  }

  return (
    <header className="public-auth-header" aria-label="BragStack public navigation">
      <a className="public-auth-brand" href="/">BragStack</a>

      <nav className="public-auth-links" aria-label="Public site navigation">
        <a href="/#how-it-works">How it works</a>
        <a href="/#product">Product</a>
        <a href="/#pricing">Pricing</a>
      </nav>

      <div className="public-auth-actions">
        <a className="public-auth-button public-auth-button-secondary" href="/docs">Docs</a>
        <a className="public-auth-button public-auth-button-primary" href="/register">Start free</a>
      </div>
    </header>
  );
}
