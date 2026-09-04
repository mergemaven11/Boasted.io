import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import "./CalendlyEmbed.css";

const SCRIPT_ID = "bragstack-calendly-widget-script";
const STYLESHEET_ID = "bragstack-calendly-widget-styles";

function isCalendlyBookingUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && (url.hostname === "calendly.com" || url.hostname.endsWith(".calendly.com"))
      && url.pathname !== "/";
  } catch {
    return false;
  }
}

function ensureCalendlyStyles() {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement("link");
  link.id = STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = "https://assets.calendly.com/assets/external/widget.css";
  document.head.appendChild(link);
}

function ensureCalendlyScript() {
  if (window.Calendly?.initInlineWidget) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.body.appendChild(script);
  });
}

export default function CalendlyEmbed({ url, title = "Book a time", compact = false }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isCalendlyBookingUrl(url) || !containerRef.current) return undefined;

    let active = true;
    const container = containerRef.current;
    container.innerHTML = "";
    setFailed(false);
    ensureCalendlyStyles();

    ensureCalendlyScript()
      .then(() => {
        if (!active || !containerRef.current || !window.Calendly?.initInlineWidget) return;
        containerRef.current.innerHTML = "";
        window.Calendly.initInlineWidget({
          url,
          parentElement: containerRef.current,
        });
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      container.innerHTML = "";
    };
  }, [url]);

  if (!isCalendlyBookingUrl(url)) return null;

  return (
    <section className={`proof-calendly ${compact ? "compact" : ""}`} aria-label="Interactive booking calendar">
      <div className="proof-calendly-heading">
        <div>
          <span>LIVE AVAILABILITY</span>
          <h2>{title}</h2>
          <p>Pick a date and available time right here. You do not need to leave this Proof Portfolio.</p>
        </div>
      </div>
      <div className="proof-calendly-frame" ref={containerRef} aria-label={`${title} interactive Calendly calendar`} />
      {failed && (
        <div className="proof-calendly-fallback" role="status">
          <p>The interactive calendar could not load in this browser.</p>
          <a href={url} target="_blank" rel="noreferrer">Open scheduling page <ExternalLink size={14}/></a>
        </div>
      )}
    </section>
  );
}
