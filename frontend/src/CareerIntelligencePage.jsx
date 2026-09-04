import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, Gauge, Lightbulb, ReceiptText, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import "./CareerIntelligencePage.css";

const SKILLS_PER_PAGE = 6;

function getApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function titleCase(value = "") {
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function SignalBadge({ signal }) {
  return <span className={`ci-signal ci-signal-${signal}`}>{titleCase(signal)}</span>;
}

function CareerIntelligencePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshMessage, setRefreshMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [skillPage, setSkillPage] = useState(1);

  async function loadIntelligence({ refresh = false } = {}) {
    const token = localStorage.getItem("bragstack_token");
    if (!token) {
      window.location.assign("/login");
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
      setRefreshMessage("");
    }
    setError("");

    try {
      const cacheBuster = refresh ? `?refresh=${Date.now()}` : "";
      const response = await fetch(`${getApiBaseUrl()}/career-intelligence${cacheBuster}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(`Career Intelligence request failed (${response.status})`);
      const payload = await response.json();
      setData(payload);
      setSkillPage(1);
      if (refresh) {
        const accomplishments = payload?.summary?.accomplishments ?? 0;
        const receipts = payload?.summary?.impact_receipts ?? 0;
        const total = payload?.summary?.total_proof_records ?? accomplishments + receipts;
        setRefreshMessage(`Career Intelligence re-ran across ${total} proof record${total === 1 ? "" : "s"}: ${accomplishments} accomplishment${accomplishments === 1 ? "" : "s"} + ${receipts} Impact Receipt${receipts === 1 ? "" : "s"}.`);
      }
    } catch (requestError) {
      console.error(requestError);
      if (data) setRefreshMessage("Career Intelligence could not refresh right now. Your previous results are still shown.");
      else setError("Career Intelligence could not load your proof right now.");
    } finally {
      if (refresh) setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadIntelligence(), 0);
    return () => window.clearTimeout(timeoutId);
    // Initial load only. Re-runs are explicit so the user knows when fresh proof is analyzed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSkills = useMemo(() => {
    if (Array.isArray(data?.skills) && data.skills.length) return data.skills;
    return Array.isArray(data?.top_skills) ? data.top_skills : [];
  }, [data]);
  const totalSkillPages = Math.max(1, Math.ceil(allSkills.length / SKILLS_PER_PAGE));
  const visibleSkills = allSkills.slice((skillPage - 1) * SKILLS_PER_PAGE, skillPage * SKILLS_PER_PAGE);

  if (!data && !error) {
    return <BragStackLoader message="Reading your career proof…" detail="Connecting accomplishments, skills, evidence, and Impact Receipts." />;
  }

  if (error) {
    return <main className="ci-page"><section className="ci-error"><strong>Career Intelligence unavailable</strong><p>{error}</p><button type="button" onClick={() => void loadIntelligence({ refresh: true })}>Try again</button></section></main>;
  }

  const { summary = {}, gaps = [], recommended_actions: actions = [], top_categories: categories = [] } = data;
  const leadSkill = data.top_skills?.[0] || allSkills[0];
  const totalProofRecords = summary.total_proof_records ?? ((summary.accomplishments ?? 0) + (summary.impact_receipts ?? 0));

  return (
    <main className="ci-page">
      <section className="ci-hero">
        <div>
          <span className="ci-kicker"><BrainCircuit size={17} /> BragStack Career Intelligence™</span>
          <h1>Your career proof, interpreted.</h1>
          <p>See what your work actually demonstrates, where your evidence is strongest, and which proof gaps are worth fixing next.</p>
          <div className="ci-hero-actions">
            <a className="ci-primary" href="/app/accomplishments?create=1">Capture new proof <ArrowRight size={17} /></a>
            <button className="ci-secondary ci-refresh" type="button" disabled={isRefreshing} onClick={() => void loadIntelligence({ refresh: true })}>
              <RefreshCw size={16} className={isRefreshing ? "ci-spin" : ""} /> {isRefreshing ? "Re-running…" : "Re-run intelligence"}
            </button>
            <a className="ci-secondary" href="/app/impact-receipts">View Impact Receipts</a>
          </div>
          {refreshMessage && <div className="ci-refresh-message" role="status">{refreshMessage}</div>}
        </div>
        <aside className="ci-lead-signal">
          <span>Lead career signal</span>
          {leadSkill ? <><strong>{leadSkill.skill}</strong><SignalBadge signal={leadSkill.signal} /><p><b>{totalProofRecords} total proof record{totalProofRecords === 1 ? "" : "s"} analyzed</b> across {summary.accomplishments ?? 0} accomplishment{summary.accomplishments === 1 ? "" : "s"} and {summary.impact_receipts ?? 0} Impact Receipt{summary.impact_receipts === 1 ? "" : "s"}. This specific skill appears in {leadSkill.demonstrations} distinct demonstration{leadSkill.demonstrations === 1 ? "" : "s"}.</p></> : <><strong>Build your signal</strong><p>Add accomplishments and skills to start creating evidence-backed career intelligence.</p></>}
        </aside>
      </section>

      <section className="ci-metrics" aria-label="Career proof summary">
        <article><ReceiptText size={20} /><span>Total proof analyzed</span><strong>{totalProofRecords}</strong><small>{summary.accomplishments ?? 0} accomplishments + {summary.impact_receipts ?? 0} receipts</small></article>
        <article><Sparkles size={20} /><span>Impact Receipts</span><strong>{summary.impact_receipts ?? 0}</strong></article>
        <article><TrendingUp size={20} /><span>Quantified results</span><strong>{summary.quantified_results ?? 0}</strong></article>
        <article><CheckCircle2 size={20} /><span>Confirmed receipts</span><strong>{summary.confirmed_receipts ?? 0}</strong></article>
      </section>

      <section className="ci-grid">
        <article className="ci-panel ci-skills-panel">
          <div className="ci-panel-heading"><div><span>Evidence map</span><h2>Demonstrated skills</h2></div><Gauge size={22} /></div>
          {allSkills.length ? <>
            <div className="ci-skill-list">{visibleSkills.map((skill) => (
              <div className="ci-skill-card" key={skill.skill}>
                <div className="ci-skill-top"><div><strong>{skill.skill}</strong><SignalBadge signal={skill.signal} /></div><span className="ci-points">{skill.evidence_points} proof pts</span></div>
                <div className="ci-bar"><span style={{ width: `${Math.max(6, skill.evidence_points)}%` }} /></div>
                <div className="ci-proof-facts"><span>{skill.demonstrations} distinct demonstrations</span><span>{skill.accomplishments ?? 0} accomplishments</span><span>{skill.impact_receipts ?? 0} receipts</span><span>{skill.quantified_examples} quantified</span><span>{skill.evidence_items} evidence</span><span>{skill.confirmations} confirmed</span></div>
              </div>
            ))}</div>
            <div className="ci-skill-pagination" aria-label="Skills pagination">
              <span>Showing {(skillPage - 1) * SKILLS_PER_PAGE + 1}–{Math.min(skillPage * SKILLS_PER_PAGE, allSkills.length)} of {allSkills.length} skills</span>
              <div><button type="button" disabled={skillPage === 1} onClick={() => setSkillPage((page) => Math.max(1, page - 1))}>Previous</button><strong>Page {skillPage} of {totalSkillPages}</strong><button type="button" disabled={skillPage === totalSkillPages} onClick={() => setSkillPage((page) => Math.min(totalSkillPages, page + 1))}>Next</button></div>
            </div>
          </> : <div className="ci-empty"><p>No skill signals yet.</p><a href="/app/accomplishments?create=1">Add skills to an accomplishment</a></div>}
        </article>

        <aside className="ci-side-stack">
          <article className="ci-panel">
            <div className="ci-panel-heading"><div><span>Next moves</span><h2>Recommended actions</h2></div><Lightbulb size={22} /></div>
            <ol className="ci-actions">{actions.map((action, index) => <li key={action}><span>{index + 1}</span><p>{action}</p></li>)}</ol>
          </article>

          <article className="ci-panel">
            <div className="ci-panel-heading"><div><span>Career breadth</span><h2>Top career areas</h2></div><Target size={22} /></div>
            {categories.length ? <div className="ci-categories">{categories.map(({ category, count }) => <div key={category}><span>{category}</span><strong>{count}</strong></div>)}</div> : <p className="ci-muted">Career areas will appear as you capture accomplishments.</p>}
          </article>
        </aside>
      </section>

      <section className="ci-panel ci-gaps-panel">
        <div className="ci-panel-heading"><div><span>Evidence gaps</span><h2>Ways to strengthen your case</h2></div><BrainCircuit size={22} /></div>
        {gaps.length ? <div className="ci-gap-grid">{gaps.map((gap) => <article key={gap.type}><strong>{gap.title}</strong><p>{gap.detail}</p><span>{gap.action}</span></article>)}</div> : <div className="ci-healthy"><CheckCircle2 size={22} /><div><strong>Your proof foundation looks healthy.</strong><p>Keep capturing fresh accomplishments and evidence as your work changes.</p></div></div>}
      </section>

      <p className="ci-methodology">Career Intelligence analyzes every saved accomplishment and Impact Receipt. Skill-specific demonstration counts are de-duplicated when a receipt comes from the same accomplishment, so a second document strengthens the proof without falsely inflating the skill.</p>
    </main>
  );
}

export default CareerIntelligencePage;
