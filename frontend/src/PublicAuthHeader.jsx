import "./PublicAuthHeader.css";

export default function PublicAuthHeader() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const isRegister = path === "/register";
  const isLogin = path === "/login";

  if (!isRegister && !isLogin) return null;

  const cta = isRegister
    ? { href: "/", label: "Return" }
    : { href: "/register", label: "Start free" };

  return (
    <header className="public-auth-header" aria-label="BragStack public navigation">
      <a className="public-auth-brand" href="/">BragStack</a>

      {!isRegister && (
        <nav className="public-auth-links" aria-label="Public site navigation">
          <a href="/#how-it-works">How it works</a>
          <a href="/#product">Product</a>
          <a href="/#pricing">Pricing</a>
        </nav>
      )}

      <div className="public-auth-actions">
        <a className="public-auth-button public-auth-button-secondary" href="/docs">Docs</a>
        <a className="public-auth-button public-auth-button-primary" href={cta.href}>{cta.label}</a>
      </div>
    </header>
  );
}
