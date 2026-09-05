import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  FileCheck2,
  Plus,
  ReceiptText,
  Target,
} from "lucide-react";

import { getCurrentUser, getEntries, getImpactReceipts, getTagsSummary } from "./api";
import BragStackLoader from "./BragStackLoader.jsx";
import "./DashboardPage.css";

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [receipts, setReceipts] = useState([]);
  const [tags, setTags] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [userData, entriesData, receiptData, tagData] = await Promise.all([
          getCurrentUser(),
          getEntries(5, 0),
          getImpactReceipts(),
          getTagsSummary(),
        ]);

        if (!active) return;
        setUser(userData);
        setEntries(entriesData.entries ?? []);
        setTotalEntries(entriesData.total_entries ?? 0);
        setReceipts(receiptData.receipts ?? []);
        setTags(tagData.tags ?? {});
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        if (active) setError("BragStack could not load your career command center.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { active = false; };
  }, []);

  const skillCount = Object.keys(tags).length;
  const evidenceCount = useMemo(
    () => receipts.reduce((total, receipt) => total + (receipt.evidence?.length ?? 0), 0),
    [receipts],
  );
  const proofCoverage = totalEntries > 0
    ? Math.min(100, Math.round((receipts.length / totalEntries) * 100))
    : 0;
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";
  const topSkills = Object.entries(tags).slice(0, 5);

  if (loading) {
    return <BragStackLoader compact message="Building your career command center…" detail="Loading your accomplishments, evidence, receipts, and skill signals." />;
  }

  return (
    <main className="command-center">
      <header className="command-header">
        <div>
          <p className="command-eyebrow">Career command center</p>
          <h1>Welcome back, {firstName}. <span>Keep stacking proof.</span></h1>
          <p>Your next opportunity is easier to explain when your impact is already documented.</p>
        </div>
        <div className="command-header-actions">
          <span className={`command-plan ${user?.plan === "pro" ? "pro" : "free"}`}>
            {user?.plan === "pro" ? "Pro beta access" : "Beta access"}
          </span>
          <a className="command-primary" href="/app/accomplishments?create=1"><Plus size={17} /> New accomplishment</a>
        </div>
      </header>

      {error && <div className="command-alert">{error}</div>}

      <section className="command-metrics" aria-label="Career proof metrics">
        <article><span className="metric-icon"><BriefcaseBusiness size={18} /></span><p>Total accomplishments</p><strong>{totalEntries}</strong><small>Your documented career wins</small></article>
        <article><span className="metric-icon"><Target size={18} /></span><p>Skills tracked</p><strong>{skillCount}</strong><small>Signals across your proof</small></article>
        <article><span className="metric-icon"><FileCheck2 size={18} /></span><p>Evidence items</p><strong>{evidenceCount}</strong><small>Files and references attached</small></article>
        <article><span className="metric-icon"><ReceiptText size={18} /></span><p>Impact Receipts</p><strong>{receipts.length}</strong><small>Evidence-backed outcomes</small></article>
      </section>

      <section className="command-layout">
        <div className="command-main-column">
          <section className="command-panel recent-proof">
            <div className="command-panel-heading">
              <div><p className="command-eyebrow">Recent proof</p><h2>Latest accomplishments</h2></div>
              <a href="/app/accomplishments">View all <ArrowRight size={15} /></a>
            </div>

            {entries.length === 0 ? (
              <div className="command-empty"><h3>Your proof library starts here.</h3><p>Capture one accomplishment and BragStack will begin turning your work into career evidence.</p><a href="/app/accomplishments?create=1">Create accomplishment</a></div>
            ) : (
              <div className="command-entry-list">
                {entries.map((entry) => (
                  <article className="command-entry" key={entry.id}>
                    <span className="command-entry-mark">B</span>
                    <div className="command-entry-copy">
                      <div className="command-entry-top"><h3>{entry.title}</h3><span>{entry.is_public ? "Public" : "Private"}</span></div>
                      <p>{entry.resume_bullet}</p>
                      <div className="command-tags">{entry.tags?.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="command-panel proof-progress">
            <div className="command-panel-heading"><div><p className="command-eyebrow">Proof health</p><h2>Career evidence coverage</h2></div><strong>{proofCoverage}%</strong></div>
            <div className="coverage-track"><span style={{ width: `${proofCoverage}%` }} /></div>
            <p>{receipts.length} of {totalEntries} accomplishments currently have an Impact Receipt. Add evidence to your strongest wins first.</p>
          </section>
        </div>

        <aside className="command-side-column">
          <section className="command-panel quick-actions">
            <p className="command-eyebrow">Quick actions</p><h2>Move your career proof forward</h2>
            <a className="quick-primary" href="/app/accomplishments?create=1"><Plus size={17} /><span><strong>New accomplishment</strong><small>Capture a win while it is fresh</small></span></a>
            <a href="/app/impact-receipts"><ReceiptText size={17} /><span><strong>Impact Receipts</strong><small>Strengthen proof with evidence</small></span></a>
            <a href="/app/reports"><BarChart3 size={17} /><span><strong>Performance reports</strong><small>Package your impact for review</small></span></a>
          </section>

          <section className="command-panel skill-signals">
            <div className="command-panel-heading"><div><p className="command-eyebrow">Skill signals</p><h2>Your strongest themes</h2></div></div>
            {topSkills.length === 0 ? <p className="muted">Skills appear here as you tag accomplishments.</p> : topSkills.map(([skill, count]) => <div className="skill-signal" key={skill}><span>{skill}</span><strong>{count}</strong></div>)}
          </section>
        </aside>
      </section>
    </main>
  );
}

export default DashboardPage;
