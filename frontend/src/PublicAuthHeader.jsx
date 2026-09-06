import "./PublicAuthHeader.css";

export default function PublicAuthHeader() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const isRegister = path === "/register";
  const isLogin = path === "/login";

  if (!isRegister && !isLogin) return null;

  return (
    <div className="public-auth-register-actions" aria-label="Return to Boasted">
      <a className="public-auth-button public-auth-button-primary" href="/">Return</a>
    </div>
  );
}
