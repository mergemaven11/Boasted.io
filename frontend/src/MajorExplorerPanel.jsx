import {
  BookOpenCheck,
  ChevronRight,
  Compass,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import BragStackLoader from "./BragStackLoader.jsx";
import { getMajorExplorer } from "./majorExplorerApi.js";
import "./MajorExplorerPanel.css";

function explorationLabel(value) {
  if (value === "strong-exploration-candidate") return "Strong exploration candidate";
  if (value === "worth-exploring") return "Worth exploring";
  return "Possible direction";
}

function evidenceLabel(value) {
  if (value === "supported") return "Supported by several signals";
  if (value === "developing") return "Developing evidence";
  return "Limited evidence so far";
}

function MajorExplorerPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    getMajorExplorer()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        setData(null);
        setError(requestError.message || "Major Explorer could not be loaded.");
        setLoading(false);
      });
    return () => { active = false; };
  }, [refreshKey]);

  function retry() {
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  }

  const summary = data?.summary || {};
  const disclaimer = data?.disclaimer || {};
  const recommendations = data?.recommendations || [];

  return <section className="major-explorer" id="major-explorer" aria-labelledby="major-explorer-title">
    <div className="major-explorer-heading">
      <div>
        <p className="applications-kicker"><Compass size={15} /> Major Explorer</p>
        <h2 id="major-explorer-title">Not sure what to major in? Explore directions from your real evidence.</h2>
        <p>Boasted looks for patterns in the coursework, projects, activities, skills, and accomplishments you actually saved, then suggests academic directions worth investigating.</p>
      </div>
      <div className="major-explorer-trust"><ShieldCheck size={19} /><span><strong>No “best major” verdict.</strong><small>No fit percentage · no admissions odds · no career-success prediction</small></span></div>
    </div>

    <div className="major-explorer-disclaimer" role="note" aria-label="Major Explorer important disclaimer">
      <ShieldCheck size={21} />
      <div>
        <strong>{disclaimer.title || "Major Explorer is for exploration, not a decision about your future."}</strong>
        <p>{disclaimer.scope || "Recommendations may be incomplete because they reflect only the information available in Boasted."}</p>
        <p>{disclaimer.not_advice || "This is an educational decision-support tool, not academic, career, financial, legal, licensing, or professional advice."}</p>
        <p>{disclaimer.no_guarantees || "It does not predict or guarantee admission, scholarships, graduation, employment, salary, licensing, or career success."}</p>
        <p>{disclaimer.verify_requirements || "Verify program requirements with the relevant institution or authority."}</p>
        <p>{disclaimer.user_decision || "You remain responsible for your education decisions and may want guidance from a qualified advisor."}</p>
      </div>
    </div>

    {loading && <BragStackLoader compact message="Connecting your evidence to possible majors…" detail="Looking for exploration signals without turning them into a prediction or aptitude score." />}

    {!loading && error && <div className="major-explorer-error">
      <strong>Major Explorer could not load.</strong>
      <span>{error}</span>
      <button type="button" onClick={retry}><RefreshCw size={15} /> Try again</button>
    </div>}

    {!loading && data && <>
      <div className="major-explorer-summary" aria-label="Major Explorer evidence summary">
        <div><strong>{summary.proof_records_analyzed ?? 0}</strong><span>proof records reviewed</span></div>
        <div><strong>{summary.distinct_demonstrations ?? 0}</strong><span>distinct demonstrations</span></div>
        <div><strong>{summary.canonical_skills ?? 0}</strong><span>canonical skills</span></div>
        <div><strong>{summary.evidence_domains ?? 0}</strong><span>evidence domains</span></div>
      </div>

      <div className="major-explorer-source-note">
        <Sparkles size={17} />
        <p><strong>Evidence source:</strong> this version uses saved Boasted proof only. Self-reported interests are not mixed into demonstrated evidence, so the product does not pretend that “I like this” and “I have demonstrated this” are the same thing.</p>
      </div>

      {recommendations.length === 0 ? <div className="major-explorer-empty">
        <BookOpenCheck size={30} />
        <h3>There is not enough saved evidence to suggest a direction yet.</h3>
        <p>Add coursework, projects, clubs, research, volunteering, jobs, training, or other real experiences. Major Explorer would rather say “not enough information” than invent a recommendation.</p>
        <a href="/app/accomplishments?create=1&education_feature=major-explorer">Add an experience <ChevronRight size={15} /></a>
      </div> : <div className="major-explorer-grid">
        {recommendations.map((item) => <article className="major-explorer-card" key={item.major_id}>
          <div className="major-explorer-card-top">
            <span className={`major-explorer-fit ${item.fit_label}`}>{explorationLabel(item.fit_label)}</span>
            <span className={`major-explorer-strength ${item.evidence_strength}`}>{evidenceLabel(item.evidence_strength)}</span>
          </div>
          <h3>{item.major}</h3>
          <p className="major-explorer-question">{item.exploration_question}</p>

          <div className="major-explorer-card-section">
            <strong>Why this appeared</strong>
            <ul>{(item.why_it_appeared || []).map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </div>

          <div className="major-explorer-card-section experiment">
            <strong><FlaskConical size={15} /> Reduce the uncertainty</strong>
            <ol>{(item.next_experiments || []).map((experiment) => <li key={experiment}>{experiment}</li>)}</ol>
          </div>

          <div className="major-explorer-unknown">
            <strong>What this does not tell us</strong>
            <p>{item.what_we_do_not_know}</p>
          </div>
        </article>)}
      </div>}

      <div className="major-explorer-methodology">
        <ShieldCheck size={17} />
        <p><strong>Major Explorer v1</strong> ranks evidence alignment for exploration only. It does not determine aptitude, recommend a “best” major, replace an advisor, or predict educational or career outcomes.</p>
      </div>
    </>}
  </section>;
}

export default MajorExplorerPanel;
