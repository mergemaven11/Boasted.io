import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, Gauge, Lightbulb, ReceiptText, Sparkles, Target, TrendingUp } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import "./CareerIntelligencePage.css";

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

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("bragstack_token");
    if (!token) {
      window.location.assign("/login");
      return undefined;
    }

    (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/career-intelligence`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        if (!response.ok) throw new Error(`Career Intelligence request failed (${response.status})`);
        const payload = await response.json();
        if (active) setData(payload);
      } catch (requestError) {
        console.error(requestError);
        if (active) setError("Career Intelligence could not load your proof right now.");
      }
    })();

    return () => { active = false; };
  }, []);

  if (!data && !error) {
    return <BragStackLoader message="Reading your career proof…" detail="Connecting accomplishments, skills, evidence, and Impact Receipts." />;
  }

  if (error) {
    return <main className="ci-page"><section className="ci-error"><strong>Career Intelligence unavailable</strong><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></section></main>;
  }

  const { summary = {}, top_skills: skills = [], gaps = [], recommended_actions: actions = [], top_categories: categories = [] } = data;
  const leadSkill = skills[0];

  return (
    <main className="ci-page">
      <section className="ci-hero">
        <div>
          <span className="ci-kicker"><BrainCircuit size={17} /> BragStack Career Intelligence™</span>
          <h1>Your career proof, interpreted.</h1>
          <p>See what your work actually demonstrates, where your evidence is strongest, and which proof gaps are worth fixing next.</p>
          <div className="ci-hero-actions">
            <a className="ci-primary" href="/app/accomplishments?create=1">Capture new proof <ArrowRight size={17} /></a>
            <a className="ci-secondary" href="/app/impact-receipts">View Impact Receipts</a>
          </div>
        </div>
        <aside className="ci-lead-signal">
          <span>Lead career signal</span>
          {leadSkill ? <><strong>{leadSkill.skill}</strong><SignalBadge signal={leadSkill.signal} /><p>Supported by {leadSkill.demonstrations} proof record{leadSkill.demonstrations === 1 ? "" : "s"}.</p></> : <><strong>Build your signal</strong><p>Add accomplishments and skills to start creating evidence-backed career intelligence.</p></>}
        </aside>
      </section>

      <section className="ci-metrics" aria-label="Career proof summary">
        <article><ReceiptText size={20} /><span>Accomplishments</span><strong>{summary.accomplishments ?? 0}</strong></article>
        <article><Sparkles size={20} /><span>Impact Receipts</span><strong>{summary.impact_receipts ?? 0}</strong></article>
        <article><TrendingUp size={20} /><span>Quantified results</span><strong>{summary.quantified_results ?? 0}</strong></article>
        <article><CheckCircle2 size={20} /><span>Confirmed receipts</span><strong>{summary.confirmed_receipts ?? 0}</strong></article>
      </section>

      <section className="ci-grid">
        <article className="ci-panel ci-skills-panel">
          <div className="ci-panel-heading"><div><span>Evidence map</span><h2>Demonstrated skills</h2></div><Gauge size={22} /></div>
          {skills.length ? <div className="ci-skill-list">{skills.map((skill) => (
            <div className="ci-skill-card" key={skill.skill}>
              <div className="ci-skill-top"><div><strong>{skill.skill}</strong><SignalBadge signal={skill.signal} /></div><span className="ci-points">{skill.evidence_points} proof pts</span></div>
              <div className="ci-bar"><span style={{ width: `${Math.max(6, skill.evidence_points)}%` }} /></div>
              <div className="ci-proof-facts"><span>{skill.demonstrations} demonstrations</span><span>{skill.quantified_examples} quantified</span><span>{skill.evidence_items} evidence</span><span>{skill.confirmations} confirmed</span></div>
            </div>
          ))}</div> : <div className="ci-empty"><p>No skill signals yet.</p><a href="/app/accomplishments?create=1">Add skills to an accomplishment</a></div>}
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

      <p className="ci-methodology">Career Intelligence summarizes user-owned proof. It does not predict hiring, promotion, or employment decisions.</p>
    </main>
  );
}

export default CareerIntelligencePage;
