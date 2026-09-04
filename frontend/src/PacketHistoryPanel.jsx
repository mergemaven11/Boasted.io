import { Clock3, FileCheck2, FileDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import "./PacketHistoryPanel.css";

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function packetLabel(kind = "") {
  const labels = {
    "performance-review": "Performance Review Packet",
    "promotion": "Promotion Packet",
    "interview": "Interview Packet",
    "certification": "Certification & Licensure Packet",
    "shared-performance-review": "Shared Performance Review Packet",
  };
  return labels[kind] || String(kind || "Packet").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function PacketHistoryPanel({ refreshKey = 0, compact = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const token = localStorage.getItem("bragstack_token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase()}/packets/history?limit=${compact ? 8 : 20}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Packet history returned ${response.status}`);
      const data = await response.json();
      setItems(data.history || []);
    } catch (requestError) {
      console.error(requestError);
      setError("Packet history could not load right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // refreshKey intentionally re-queries after a packet build/export.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <section className={`packet-history-panel ${compact ? "compact" : ""}`} aria-label="Packet history">
      <div className="packet-history-heading">
        <div><span>PACKET HISTORY</span><h2>Your generated packets</h2><p>BragStack stores metadata only here—never packet bodies, evidence contents, or private notes.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? "packet-history-spin" : ""} /> Refresh</button>
      </div>

      {error ? <div className="packet-history-error">{error}</div> : null}
      {loading && !items.length ? <div className="packet-history-empty"><Clock3 size={20} /><span>Loading packet history…</span></div> : null}
      {!loading && !items.length ? <div className="packet-history-empty"><FileCheck2 size={22} /><div><strong>No packet history yet.</strong><span>Build a packet and it will appear here immediately—even before you download the PDF.</span></div></div> : null}

      {items.length ? <div className="packet-history-list">{items.map((item) => {
        const exported = item.activity === "pdf_exported";
        const period = item.review_period || {};
        return <article key={item.id}>
          <div className={`packet-history-icon ${exported ? "exported" : "generated"}`}>{exported ? <FileDown size={17} /> : <FileCheck2 size={17} />}</div>
          <div className="packet-history-main">
            <div><strong>{packetLabel(item.packet_kind)}</strong><span className={`packet-history-status ${exported ? "exported" : "generated"}`}>{exported ? "PDF exported" : "Generated"}</span></div>
            <span>{formatDate(item.generated_at)}</span>
            <small>{period.label || (period.start_date && period.end_date ? `${period.start_date} → ${period.end_date}` : "All recorded work")}{item.career_area ? ` · ${item.career_area}` : ""}</small>
          </div>
          <div className="packet-history-meta">{item.filename ? <span>{item.filename}</span> : <span>Preview created</span>}{item.page_count ? <small>{item.page_count} page{item.page_count === 1 ? "" : "s"}</small> : null}</div>
        </article>;
      })}</div> : null}
    </section>
  );
}
