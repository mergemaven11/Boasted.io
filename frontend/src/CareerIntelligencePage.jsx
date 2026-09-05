import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Lightbulb,
  ReceiptText,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
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

function LoadingShell() {
  return (
    <main className="ci-page">
      <section className="ci-hero">
        <div>
          <span className="ci-kicker"><BrainCircuit size={17} /> BragStack Career Intelligence™</span>
          <h1>Your career proof, interpreted.</h1>
          <p>See what your body of work repeatedly demonstrates, how well each signal is supported, and what is emerging next.</p>
          <div className="ci-hero-actions">
            <a className="ci-primary" href="/app/accomplishments?create=1">Capture new proof <ArrowRight size={17} /></a>
            <a className="ci-secondary" href="/app/impact-receipts">View Impact Receipts</a>
          </div>
        </div>
        <aside className="ci-lead-signal">
          <span>Analyzing your proof</span>
          <strong>Building your combined career signal…</strong>
          <p>Your accomplishments and Impact Receipts are being reconciled into distinct work demonstrations, durable skills, proof quality, and career themes.</p>
        </aside>
      </section>
      <BragStackLoader message="Reading your career proof…" detail="Separating repetition, proof quality, themes, and recent growth." />
    </main>
  );
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
        const demonstrations = payload?.summary?.distinct_demonstrations ?? total;
        setRefreshMessage(`Career Intelligence re-ran across ${total} saved proof record${total === 1 ? "" : "s"}, representing ${demonstrations} distinct work demonstration${demonstrations === 1 ? "" : "s"}.`);
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

  if (!data && !error) return <LoadingShell />;

  if (error) {
    return (
      <main className="ci-page">
        <section className="ci-error">
          <strong>Career Intelligence unavailable</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void loadIntelligence({ refresh: true })}>Try again</button>
        </section>
      </main>
    );
  }

  const {
    summary = {},
    gaps = [],
    recommended_actions: actions = [],
    top_categories: categories = [],
    career_profile: careerProfile = {},
    career_themes: careerThemes = [],
  } = data;

  const totalProofRecords = summary.total_proof_records ?? ((summary.accomplishments ?? 0) + (summary.impact_receipts ?? 0));
  const distinctDemonstrations = summary.distinct_demonstrations ?? totalProofRecords;
  const profileSkills = Array.isArray(careerProfile.primary_skills) && careerProfile.primary_skills.length
    ? careerProfile.primary_skills
    : allSkills.slice(0, 4).map((skill) => skill.skill);
  const profileThemes = Array.isArray(careerProfile.primary_themes) ? careerProfile.primary_themes : [];
  const profileHeadline = careerProfile.headline || profileThemes.join(" · ") || profileSkills.slice(0, 3).join(" · ");
  const profileSummary = careerProfile.summary || (
    profileSkills.length
      ? "These are the strongest repeated signals across your saved proof, with proof quality and recency tracked separately."
      : "Add accomplishments and skills to start creating evidence-backed career intelligence."
  );
  const recentGrowth = Array.isArray(careerProfile.recent_emerging_skills)
    ? careerProfile.recent_emerging_skills
    : [];
  const themeRows = Array.isArray(careerThemes) && careerThemes.length
    ? careerThemes
    : categories.map(({ category, count }) => ({ theme: category, demonstrations: count }));

  return (
    <main className="ci-page">
      <section className="ci-hero">
        <div>
          <span className="ci-kicker"><BrainCircuit size={17} /> BragStack Career Intelligence™</span>
          <h1>Your career proof, interpreted.</h1>
          <p>See what your body of work repeatedly demonstrates, how strongly each signal is supported, and what is emerging next.</p>
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
          <span>Combined career signal</span>
          {profileSkills.length ? (
            <>
              <strong>{profileHeadline}</strong>
              <p>
                <b>{totalProofRecords} saved proof record{totalProofRecords === 1 ? "" : "s"} → {distinctDemonstrations} distinct demonstration{distinctDemonstrations === 1 ? "" : "s"}.</b>{" "}
                {profileSummary}
              </p>
              {careerProfile.maturity && <p><b>Profile maturity:</b> {titleCase(careerProfile.maturity)} evidence coverage.</p>}
              {recentGrowth.length > 0 && (
                <p><b>Recent growth:</b> {recentGrowth.join(" · ")}. These stay separate from durable strengths until they repeat across distinct work examples.</p>
              )}
            </>
          ) : (
            <>
              <strong>Build your signal</strong>
              <p>{profileSummary}</p>
            </>
          )}
        </aside>
      </section>

      <section className="ci-metrics" aria-label="Career proof summary">
        <article>
          <ReceiptText size={20} />
          <span>Total proof analyzed</span>
          <strong>{totalProofRecords}</strong>
          <small>{summary.accomplishments ?? 0} accomplishments + {summary.impact_receipts ?? 0} receipts</small>
        </article>
        <article>
          <Sparkles size={20} />
          <span>Distinct demonstrations</span>
          <strong>{distinctDemonstrations}</strong>
          <small>Linked receipts enrich proof without double-counting work</small>
        </article>
        <article>
          <TrendingUp size={20} />
          <span>Quantified coverage</span>
          <strong>{summary.quantified_coverage_percent ?? 0}%</strong>
          <small>{summary.quantified_results ?? 0} measurable demonstration{summary.quantified_results === 1 ? "" : "s"}</small>
        </article>
        <article>
          <CheckCircle2 size={20} />
          <span>Evidence-backed</span>
          <strong>{summary.evidence_coverage_percent ?? 0}%</strong>
          <small>{summary.confirmed_demonstrations ?? 0} confirmed demonstration{summary.confirmed_demonstrations === 1 ? "" : "s"}</small>
        </article>
      </section>

      <section className="ci-grid">
        <article className="ci-panel ci-skills-panel">
          <div className="ci-panel-heading"><div><span>Evidence map</span><h2>Demonstrated skills</h2></div><Gauge size={22} /></div>
          {allSkills.length ? (
            <>
              <div className="ci-skill-list">
                {visibleSkills.map((skill) => (
                  <div className="ci-skill-card" key={skill.skill}>
                    <div className="ci-skill-top">
                      <div><strong>{skill.skill}</strong><SignalBadge signal={skill.signal} /></div>
                      <span className="ci-points">{skill.evidence_points} proof pts</span>
                    </div>
                    <div className="ci-bar"><span style={{ width: `${Math.max(6, skill.evidence_points)}%` }} /></div>
                    <div className="ci-proof-facts">
                      <span>{skill.demonstrations} distinct demonstrations</span>
                      <span>{titleCase(skill.support_level || "basic")} proof support</span>
                      <span>{skill.quantified_examples ?? 0} quantified</span>
                      <span>{skill.evidence_backed_demonstrations ?? 0} evidence-backed</span>
                      <span>{skill.confirmed_demonstrations ?? 0} confirmed</span>
                      <span>{skill.impact_receipts ?? 0} receipts</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ci-skill-pagination" aria-label="Skills pagination">
                <span>Showing {(skillPage - 1) * SKILLS_PER_PAGE + 1}–{Math.min(skillPage * SKILLS_PER_PAGE, allSkills.length)} of {allSkills.length} skills</span>
                <div>
                  <button type="button" disabled={skillPage === 1} onClick={() => setSkillPage((page) => Math.max(1, page - 1))}>Previous</button>
                  <strong>Page {skillPage} of {totalSkillPages}</strong>
                  <button type="button" disabled={skillPage === totalSkillPages} onClick={() => setSkillPage((page) => Math.min(totalSkillPages, page + 1))}>Next</button>
                </div>
              </div>
            </>
          ) : (
            <div className="ci-empty"><p>No skill signals yet.</p><a href="/app/accomplishments?create=1">Add skills to an accomplishment</a></div>
          )}
        </article>

        <aside className="ci-side-stack">
          <article className="ci-panel">
            <div className="ci-panel-heading"><div><span>Next moves</span><h2>Recommended actions</h2></div><Lightbulb size={22} /></div>
            <ol className="ci-actions">{actions.map((action, index) => <li key={action}><span>{index + 1}</span><p>{action}</p></li>)}</ol>
          </article>

          <article className="ci-panel">
            <div className="ci-panel-heading"><div><span>Career breadth</span><h2>Career themes</h2></div><Target size={22} /></div>
            {themeRows.length ? (
              <div className="ci-categories">
                {themeRows.slice(0, 5).map((theme) => (
                  <div key={theme.theme}>
                    <span>{theme.theme}</span>
                    <strong>{theme.demonstrations ?? 0}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ci-muted">Career themes will appear as you capture accomplishments.</p>
            )}
          </article>
        </aside>
      </section>

      <section className="ci-panel ci-gaps-panel">
        <div className="ci-panel-heading"><div><span>Evidence gaps</span><h2>Ways to strengthen your case</h2></div><BrainCircuit size={22} /></div>
        {gaps.length ? (
          <div className="ci-gap-grid">{gaps.map((gap) => <article key={gap.type}><strong>{gap.title}</strong><p>{gap.detail}</p><span>{gap.action}</span></article>)}</div>
        ) : (
          <div className="ci-healthy"><CheckCircle2 size={22} /><div><strong>Your proof foundation looks healthy.</strong><p>Keep capturing fresh accomplishments and evidence as your work changes.</p></div></div>
        )}
      </section>

      <p className="ci-methodology">
        Career Intelligence separates durable signals from proof quality and recency. Repetition is measured across distinct work demonstrations; linked Impact Receipts enrich the original work instead of creating fake repetition, attachment volume cannot inflate breadth, and creating a receipt later does not make old work look newly demonstrated.
      </p>
    </main>
  );
}

export default CareerIntelligencePage;
