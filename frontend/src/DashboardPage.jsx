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
import "./DashboardActivation.css";

function ActivationGuide({ stage, totalEntries }) {
  const captureStage = stage === "capture";
  const primaryHref = captureStage ? "/app/accomplishments?create=1" : "/app/impact-receipts";
  const primaryLabel = captureStage ? "Capture your first accomplishment" : "Strengthen your first proof";

  return (
    <section className={`command-activation-guide ${stage}`} aria-labelledby="command-activation-title">
      <div className="command-activation-kicker">
        <span>Step {captureStage ? "1" : "2"} of 3</span>
        <p>Core proof loop</p>
      </div>

      <div className="command-activation-copy">
        <p className="command-eyebrow">One job at a time</p>
        <h2 id="command-activation-title">
          {captureStage ? "Capture one real accomplishment." : "Strengthen the proof you already saved."}
        </h2>
        <p>
          {captureStage
            ? "Start with one recent incident, customer win, automation, project, process improvement, or other piece of work that mattered. You do not need to explore the rest of Boasted yet."
            : `You already have ${totalEntries} saved accomplishment${totalEntries === 1 ? "" : "s"}. Now turn one strong example into an Impact Receipt by making the contribution, result, evidence, skills, and shared credit clear.`}
        </p>
      </div>

      <div className="command-activation-steps" aria-label="Boasted activation path">
        <article className={captureStage ? "current" : "done"}>
          <strong>1</strong>
          <span>Capture</span>
          <small>Save one meaningful accomplishment while the details are fresh.</small>
        </article>
        <article className={!captureStage ? "current" : "next"}>
          <strong>2</strong>
          <span>Strengthen</span>
          <small>Turn that work into an evidence-backed Impact Receipt.</small>
        </article>
        <article className="next">
          <strong>3</strong>
          <span>Use it</span>
          <small>Reuse the same proof for a resume, interview, review, or profile.</small>
        </article>
      </div>

      <a className="command-activation-primary" href={primaryHref}>
        {primaryLabel} <ArrowRight size={17} />
      </a>
      <p className="command-activation-note">The broader command center opens up after you have an Impact Receipt to work with.</p>
    </section>
  );
}

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
        if (active) setError("Boasted could not load your career command center.");
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
  const activationStage = totalEntries === 0 ? "capture" : receipts.length === 0 ? "strengthen" : "active";
  const activationFocused = activationStage !== "active";

  const headerEyebrow = activationStage === "capture"
    ? "Start here"
    : activationStage === "strengthen"
      ? "Next step"
      : "Career command center";
  const headerTitle = activationStage === "capture"
    ? "Start with one accomplishment."
    : activationStage === "strengthen"
      ? "You captured the work."
      : `Welcome back, ${firstName}.`;
  const headerAccent = activationStage === "capture"
    ? "That is enough for now."
    : activationStage === "strengthen"
      ? "Now strengthen the proof."
      : "Keep stacking proof.";
  const headerCopy = activationStage === "capture"
    ? "Boasted becomes useful after it has one real piece of your work to build from."
    : activationStage === "strengthen"
      ? "Your next job is to make one saved accomplishment evidence-backed and reusable."
      : "Your next opportunity is easier to explain when your impact is already documented.";
  const primaryHref = activationStage === "capture"
    ? "/app/accomplishments?create=1"
    : activationStage === "strengthen"
      ? "/app/impact-receipts"
      : "/app/accomplishments?create=1";
  const primaryLabel = activationStage === "capture"
    ? "First accomplishment"
    : activationStage === "strengthen"
      ? "Impact Receipt"
      : "New accomplishment";

  if (loading) {
    return <BragStackLoader compact message="Building your career command center…" detail="Loading your accomplishments, evidence, receipts, and skill signals." />;
  }

  return (
    <main className={`command-center ${activationFocused ? "activation-focused" : ""}`}>
      <header className="command-header">
        <div>
          <p className="command-eyebrow">{headerEyebrow}</p>
          <h1>{headerTitle} <span>{headerAccent}</span></h1>
          <p>{headerCopy}</p>
        </div>
        <div className="command-header-actions">
          <span className={`command-plan ${user?.plan === "pro" ? "pro" : "free"}`}>
            {user?.plan === "pro" ? "Pro beta access" : "Beta access"}
          </span>
          <a className="command-primary" href={primaryHref}><Plus size={17} /> {primaryLabel}</a>
        </div>
      </header>

      {error && <div className="command-alert">{error}</div>}

      {activationFocused ? (
        <ActivationGuide stage={activationStage} totalEntries={totalEntries} />
      ) : (
        <>
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
                  <div className="command-empty"><h3>Your proof library starts here.</h3><p>Capture one accomplishment and Boasted will begin turning your work into career evidence.</p><a href="/app/accomplishments?create=1">Create accomplishment</a></div>
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
        </>
      )}
    </main>
  );
}

export default DashboardPage;
