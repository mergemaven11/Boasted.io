import { ExternalLink } from "lucide-react";
import "./CalendlyEmbed.css";

function isCalendlyBookingUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "calendly.com" || url.hostname.endsWith(".calendly.com"));
  } catch {
    return false;
  }
}

export default function CalendlyEmbed({ url, title = "Book a time" }) {
  if (!isCalendlyBookingUrl(url)) return null;
  return (
    <section className="proof-calendly" aria-label="Booking calendar">
      <div className="proof-calendly-heading">
        <div><span>BOOK A CONVERSATION</span><h2>{title}</h2><p>Choose an available time directly from this Proof Profile.</p></div>
        <a href={url} target="_blank" rel="noreferrer">Open in Calendly <ExternalLink size={14}/></a>
      </div>
      <div className="proof-calendly-frame"><iframe title="Calendly booking calendar" src={url} loading="lazy" allow="payment" /></div>
    </section>
  );
}
