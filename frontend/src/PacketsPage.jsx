import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  FileCheck2,
  FolderKanban,
  GraduationCap,
  Presentation,
  RefreshCw,
  Rocket,
  Sparkles,
  Trophy,
} from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import PacketBuilderPanel from "./PacketBuilderPanel.jsx";
import PerformancePacketPreview from "./PerformancePacketPreview.jsx";
import { getAllTimeCareerReport, getPerformancePacket } from "./api.js";
import { DEFAULT_PACKET_OPTIONS, PACKET_TYPES, getPacketType } from "./packetCatalog.js";
import "./PacketsPage.css";

const ICONS = {
  "performance-review": FileCheck2,
  promotion: Rocket,
  interview: BriefcaseBusiness,
  certification: Award,
  "program-application": GraduationCap,
  scholarship: Trophy,
  portfolio: Presentation,
  "career-transition": FolderKanban,
};

function PacketsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [packet, setPacket] = useState(null);
  const [building, setBuilding] = useState(false);
  const [options, setOptions] = useState(DEFAULT_PACKET_OPTIONS);

  useEffect(() => {
    let active = true;
    getAllTimeCareerReport()
      .then((data) => { if (active) setReport(data); })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.response?.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        setError(requestError.response?.data?.detail || "Career proof could not be loaded for packets.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const totals = report?.totals ?? {};
  const proofCount = useMemo(() => Number(totals.entries || 0) + Number(totals.impact_receipts || 0) + Number(totals.evidence_items || 0), [totals]);

  function choosePacket(type) {
    setSelectedType(type);
    setPacket(null);
    setError("");
    setOptions((current) => ({
      ...DEFAULT_PACKET_OPTIONS,
      exportFormat: current.exportFormat || "pdf",
      theme: current.theme || "modern-minimal",
      packetType: type,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function buildPacket() {
    if (!selectedType || !report) return;
    setBuilding(true);
    setError("");
    try {
      const data = await getPerformancePacket(undefined, undefined, { ...options, packetType: selectedType });
      setPacket(data.packet);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      console.error(requestError);
      if (requestError.response?.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      setError(requestError.response?.data?.detail || "This packet could not be built.");
    } finally {
      setBuilding(false);
    }
  }

  if (packet) {
    return <PerformancePacketPreview packet={packet} preferredFormat={options.exportFormat || "pdf"} onBack={() => setPacket(null)} backLabel="Back to packet form" />;
  }

  if (loading) {
    return <BragStackLoader compact message="Opening Career Packets…" detail="Loading your accomplishments, Impact Receipts, evidence, and career proof." />;
  }

  if (selectedType) {
    const spec = getPacketType(selectedType);
    return <main className="packets-page">
      <header className="packets-builder-heading">
        <button type="button" className="packets-back-button" onClick={() => setSelectedType("")}><ArrowLeft size={17} />All packets</button>
        <div><span>CAREER PACKETS</span><h1>{spec.label}</h1><p>{spec.example}</p></div>
      </header>
      {error && <div className="packets-error">{String(error)}</div>}
      <PacketBuilderPanel
        options={options}
        onChange={setOptions}
        onBuild={() => void buildPacket()}
        isLoading={building}
        error={error}
        highlights={report?.highlights ?? []}
        showTypeChooser={false}
      />
    </main>;
  }

  return <main className="packets-page">
    <header className="packets-hero">
      <div className="packets-hero-icon"><Sparkles size={24} /></div>
      <div><span>BRAGSTACK PRO · CAREER PACKETS</span><h1>Choose the packet for the moment you’re preparing for.</h1><p>Each packet uses your saved BragStack proof, then asks for the specific context that belongs in that kind of document.</p></div>
    </header>

    {error && <div className="packets-error">{String(error)}</div>}

    <section className="packets-proof-note">
      <Sparkles size={20} />
      <div><strong>The more data you submit, the more useful these packets become.</strong><p>Accomplishments, Impact Receipts, evidence, skills, verified recognition, and measurable results give BragStack more factual material to organize. Packets do not invent missing achievements or outcomes.</p></div>
      <div className="packets-proof-count"><b>{proofCount}</b><span>saved proof signals</span></div>
    </section>

    <section className="packets-grid" aria-label="Available career packets">
      {PACKET_TYPES.map((type) => {
        const Icon = ICONS[type.value] || FileCheck2;
        return <button type="button" className="packet-catalog-card" key={type.value} onClick={() => choosePacket(type.value)}>
          <div className="packet-catalog-icon"><Icon size={22} /></div>
          <span>PRO PACKET</span>
          <h2>{type.label}</h2>
          <p>{type.description}</p>
          <small><strong>Example:</strong> {type.example}</small>
          <b>Build this packet →</b>
        </button>;
      })}
    </section>

    <section className="packets-footer-callout">
      <div><span>DOWNLOAD OPTIONS</span><h2>Every packet can be exported as PDF or DOCX.</h2><p>PDF gives you a polished fixed-layout document. DOCX gives you an editable Word version when you need to tailor wording or add organization-specific details.</p></div>
      <RefreshCw size={28} />
    </section>
  </main>;
}

export default PacketsPage;
