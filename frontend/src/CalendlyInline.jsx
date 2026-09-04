import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import "./CalendlyInline.css";

const CALENDLY_SCRIPT_ID = "bragstack-calendly-widget-script";
const CALENDLY_CSS_ID = "bragstack-calendly-widget-css";

function ensureCalendlyCss() {
  if (document.getElementById(CALENDLY_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = CALENDLY_CSS_ID;
  link.rel = "stylesheet";
  link.href = "https://assets.calendly.com/assets/external/widget.css";
  document.head.appendChild(link);
}

function loadCalendlyScript() {
  if (window.Calendly?.initInlineWidget) return Promise.resolve();

  const existing = document.getElementById(CALENDLY_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = CALENDLY_SCRIPT_ID;
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.body.appendChild(script);
  });
}

export default function CalendlyInline({ url, title = "Schedule a conversation" }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    if (!container || !url) return undefined;

    setFailed(false);
    container.innerHTML = "";
    ensureCalendlyCss();

    loadCalendlyScript()
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
      if (container) container.innerHTML = "";
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="calendly-inline-shell">
      <div ref={containerRef} className="calendly-inline-widget-host" aria-label={title} />
      {failed && (
        <div className="calendly-inline-fallback" role="status">
          <p>The embedded scheduler could not load.</p>
          <a href={url} target="_blank" rel="noreferrer">Open Calendly <ExternalLink size={15}/></a>
        </div>
      )}
    </div>
  );
}
