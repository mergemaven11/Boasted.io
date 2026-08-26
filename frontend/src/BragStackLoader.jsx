import "./BragStackLoader.css";

export default function BragStackLoader({
  message = "Getting your workspace ready…",
  detail = "Loading your career intelligence securely.",
  compact = false,
}) {
  return (
    <div className={`bragstack-loader${compact ? " compact" : ""}`} role="status" aria-live="polite">
      <div className="bragstack-loader-card">
        <div className="bragstack-loader-mark" aria-hidden="true"><span>B</span></div>
        <div className="bragstack-loader-copy">
          <strong>BragStack</strong>
          <h1>{message}</h1>
          <p>{detail}</p>
        </div>
        <div className="bragstack-loader-track" aria-hidden="true"><span /></div>
        <div className="bragstack-loader-skeletons" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
