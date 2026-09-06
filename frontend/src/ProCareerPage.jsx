import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import PacketBuilderPanel from "./PacketBuilderPanel";
import PacketsPage from "./PacketsPage.jsx";
import PerformancePacketPreview from "./PerformancePacketPreview";
import { getAllTimeCareerReport, getPerformancePacket } from "./api";
import "./ProCareerPage.css";

const LEGACY_PACKET_TYPES = new Set(["performance-review", "promotion", "interview", "certification"]);

function AnalyticsCareerPage() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("packet");
  const packetMode = LEGACY_PACKET_TYPES.has(requested) ? requested : null;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [packet, setPacket] = useState(null);
  const [building, setBuilding] = useState(false);
  const [options, setOptions] = useState({
    packetType: packetMode || "performance-review",
    careerArea: "",
    roleTitle: "",
    organization: "",
    targetRole: "",
    targetLevel: "",
    targetOrganization: "",
    selectedEntryIds: [],
    includeEvidenceReferences: false,
    confidential: true,
    exportFormat: "pdf",
    theme: "modern-minimal",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      setReport(await getAllTimeCareerReport());
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Career analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getAllTimeCareerReport()
      .then((data) => { if (active) setReport(data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.detail || "Career analytics could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function build() {
    if (!report) return;
    setBuilding(true);
    setError("");
    try {
      const data = await getPerformancePacket(undefined, undefined, options);
      setPacket(data.packet);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "This packet could not be built.");
    } finally {
      setBuilding(false);
    }
  }

  const skills = useMemo(() => Object.entries(report?.top_skills || {}).slice(0, 8), [report]);
  const categories = useMemo(() => Object.entries(report?.categories || {}).slice(0, 8), [report]);

  if (packet) return <PerformancePacketPreview packet={packet} preferredFormat={options.exportFormat} onBack={() => setPacket(null)} />;
  if (loading) return <BragStackLoader compact message="Analyzing your career proof…" detail="Turning your accomplishments, evidence, and results into career intelligence." />;

  const totals = report?.totals || {};
  if (packetMode) {
    return <main className="pro-career-page">
      <header className="pro-page-header"><div><span>BOASTED PRO · CAREER PACKETS</span><h1>{packetMode === "promotion" ? "Build your promotion case." : packetMode === "interview" ? "Build your interview packet." : packetMode === "certification" ? "Build your certification packet." : "Build your performance review."}</h1><p>Turn recorded accomplishments, evidence, results, and skills into a focused professional artifact.</p></div></header>
      {error && <div className="pro-error">{String(error)}</div>}
      <div id="packet-builder"><PacketBuilderPanel options={options} onChange={setOptions} onBuild={() => void build()} isLoading={building} error={error} highlights={report?.highlights || []} /></div>
    </main>;
  }

  const maxSkill = Math.max(1, ...skills.map(([, value]) => Number(value) || 0));
  const maxCat = Math.max(1, ...categories.map(([, value]) => Number(value) || 0));
  return <main className="pro-career-page">
    <header className="pro-page-header"><div><span>BOASTED PRO · CAREER ANALYTICS</span><h1>Your career proof, visualized.</h1><p>See what your recorded evidence actually says about your work—without invented scores or vanity metrics.</p></div><button onClick={() => void load()}><RefreshCw size={16} />Refresh</button></header>
    {error && <div className="pro-error">{String(error)}</div>}
    <section className="pro-kpis"><article><strong>{totals.entries || 0}</strong><span>Accomplishments</span></article><article><strong>{totals.impact_receipts || 0}</strong><span>Impact Receipts</span></article><article><strong>{totals.evidence_items || 0}</strong><span>Evidence items</span></article><article><strong>{totals.quantified_results || 0}</strong><span>Quantified results</span></article></section>
    <section className="pro-chart-grid"><article className="pro-chart"><div className="pro-chart-title"><BarChart3 /><div><span>SKILL SIGNALS</span><h2>Most demonstrated skills</h2></div></div>{skills.length ? skills.map(([name, value]) => <div className="bar-row" key={name}><div><span>{name}</span><strong>{value}</strong></div><div className="bar-track"><i style={{ width: `${Math.max(5, (Number(value) / maxSkill) * 100)}%` }} /></div></div>) : <p className="empty">Add skills to accomplishments to populate this chart.</p>}</article><article className="pro-chart"><div className="pro-chart-title"><TrendingUp /><div><span>WORK MIX</span><h2>Career activity by category</h2></div></div>{categories.length ? categories.map(([name, value]) => <div className="bar-row" key={name}><div><span>{name}</span><strong>{value}</strong></div><div className="bar-track alt"><i style={{ width: `${Math.max(5, (Number(value) / maxCat) * 100)}%` }} /></div></div>) : <p className="empty">Categories appear as you record accomplishments.</p>}</article></section>
    <section className="pro-insight"><span>PROOF COVERAGE</span><h2>Evidence-backed career record</h2><div className="coverage-grid"><div><b>{totals.confirmed_assertions || 0}</b><small>Confirmed contributions</small></div><div><b>{(totals.public_entries || 0) + (totals.public_receipts || 0)}</b><small>Public proof items</small></div><div><b>{report?.highlights?.length || 0}</b><small>Career highlights</small></div></div></section>
  </main>;
}

export default function ProCareerPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("packets") === "1") return <PacketsPage />;
  return <AnalyticsCareerPage />;
}
