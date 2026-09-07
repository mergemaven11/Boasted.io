import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  HandHeart,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  findStudentInternships,
  findStudentPrograms,
  getStudentOpportunityContext,
} from "./studentOpportunityApi.js";
import "./StudentOpportunitySearchPanel.css";

function cleanReason(reason) {
  if (!reason) return "";
  const skills = (reason.supported_by || []).slice(0, 3);
  return skills.length
    ? `${reason.direction} · supported by ${skills.join(", ")}`
    : reason.direction || "";
}

function SearchPager({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return <nav className="student-opportunity-pagination" aria-label="Opportunity result pages">
    <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={16} /> Previous</button>
    <span>Page <strong>{page}</strong> of {pages}</span>
    <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={16} /></button>
  </nav>;
}

function ProgramCard({ item }) {
  const source = item.source || {};
  const boasted = item.boasted || {};
  const location = [source.city, source.state, source.zip].filter(Boolean).join(", ");
  const isYouthSupport = boasted.display_kind === "youth-support";
  return <article className="student-opportunity-card program-card">
    <div className="student-opportunity-card-top">
      <span className={`opportunity-kind ${isYouthSupport ? "free-support" : "training"}`}>
        {isYouthSupport ? <HandHeart size={14} /> : <GraduationCap size={14} />}
        {isYouthSupport ? "Youth support program" : "Training program"}
      </span>
      {boasted.wioa_or_etp_signal ? <span className="opportunity-funded"><BadgeDollarSign size={14} /> Funding may be available</span> : null}
    </div>
    <h4>{source.title || "Program"}</h4>
    {source.provider ? <p className="student-opportunity-provider">{source.provider}</p> : null}
    <div className="student-opportunity-facts">
      {location ? <span><MapPin size={15} />{location}{source.distance ? ` · ${source.distance} mi` : ""}</span> : null}
      {source.credential ? <span><GraduationCap size={15} />{source.credential}</span> : null}
    </div>
    {source.formats?.length ? <div className="student-opportunity-tags">{source.formats.slice(0, 3).map((value) => <span key={value}>{value}</span>)}</div> : null}
    {boasted.why_shown ? <p className="student-opportunity-reason"><Sparkles size={14} />{cleanReason(boasted.why_shown)}</p> : null}
    <footer>
      <small>Cost/funding status not changed by Boasted — verify with the provider</small>
      {source.url ? <a href={source.url} target="_blank" rel="noreferrer noopener">View program <ExternalLink size={14} /></a> : null}
    </footer>
  </article>;
}

function InternshipCard({ item }) {
  const source = item.source || {};
  const boasted = item.boasted || {};
  return <article className="student-opportunity-card internship-card">
    <div className="student-opportunity-card-top">
      <span className="opportunity-kind internship"><BriefcaseBusiness size={14} /> Internship signal verified by Boasted</span>
      {source.posted_at ? <span className="opportunity-posted"><CalendarDays size={13} />{source.posted_at}</span> : null}
    </div>
    <h4>{source.title || "Internship opportunity"}</h4>
    {source.company ? <p className="student-opportunity-provider">{source.company}</p> : null}
    <div className="student-opportunity-facts">
      {source.location ? <span><MapPin size={15} />{source.location}{source.distance ? ` · ${source.distance} mi` : ""}</span> : null}
    </div>
    {source.description ? <p className="student-opportunity-description">{source.description}</p> : null}
    {boasted.why_shown ? <p className="student-opportunity-reason"><Sparkles size={14} />{cleanReason(boasted.why_shown)}</p> : null}
    <footer>
      <small>CareerOneStop listing text shown as received · no hiring prediction</small>
      {source.url ? <a href={source.url} target="_blank" rel="noreferrer noopener">Open listing <ExternalLink size={14} /></a> : null}
    </footer>
  </article>;
}

export default function StudentOpportunitySearchPanel({ mode }) {
  const isPrograms = mode === "programs";
  const [context, setContext] = useState(null);
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(25);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let active = true;
    getStudentOpportunityContext()
      .then((result) => {
        if (!active) return;
        setContext(result);
        setLocation(result.location || "");
        const suggested = result.suggested_queries?.[0]?.query || "";
        setQuery(suggested);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        setError(requestError.message || "Opportunity suggestions could not be loaded.");
      })
      .finally(() => { if (active) setLoadingContext(false); });
    return () => { active = false; };
  }, []);

  const suggestions = useMemo(() => context?.suggested_queries || [], [context]);

  async function runSearch(nextPage = 1, nextQuery = query) {
    if (!location.trim()) {
      setError("Enter a city, state, or ZIP code so Boasted knows where to look.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const request = {
        location: location.trim(),
        query: nextQuery.trim(),
        radius,
        page: nextPage,
        pageSize,
      };
      const result = isPrograms ? await findStudentPrograms(request) : await findStudentInternships(request);
      setData(result);
      setPage(nextPage);
      setQuery(nextQuery);
    } catch (requestError) {
      if (requestError.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      setError(requestError.message || "Opportunity search failed.");
    } finally {
      setLoading(false);
    }
  }

  function chooseSuggestion(item) {
    setQuery(item.query);
    void runSearch(1, item.query);
  }

  return <section className="student-opportunity-panel" data-mode={mode}>
    <div className="student-opportunity-hero">
      <div>
        <p className="student-opportunity-kicker"><Sparkles size={16} /> {isPrograms ? "Program Finder" : "Internship Finder"}</p>
        <h2>{isPrograms ? "Find nearby programs that can help you build what comes next." : "Find internships connected to the skills and directions already showing up in your record."}</h2>
        <p>{isPrograms
          ? "Boasted uses your saved education evidence to suggest search directions, then searches official local training and support data. You can always change the search or location."
          : "Boasted turns your demonstrated skills and career directions into search ideas, then checks current job listings for explicit intern/internship signals near you."}</p>
      </div>
      <div className="student-opportunity-trust"><ShieldCheck size={20} /><span><strong>No fake match score.</strong><small>Evidence-connected suggestions · live source data · you choose what to pursue</small></span></div>
    </div>

    <div className="student-opportunity-tipbar">
      <Info size={17} />
      <div><strong>{isPrograms ? "How to search programs:" : "How to search internships:"}</strong><span>{isPrograms
        ? "Try a career direction or skill such as cybersecurity, nursing, graphic design, welding, teaching, or project management. Add your city/ZIP and widen the radius if needed."
        : "Start with a career area instead of a company name: software development, data analysis, public health, marketing, research, design, finance, or another direction from your evidence."}</span></div>
    </div>

    <form className="student-opportunity-search" onSubmit={(event) => { event.preventDefault(); void runSearch(1); }}>
      <label className="student-opportunity-query"><Search size={19} /><span>Career / skill</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isPrograms ? "e.g. cybersecurity" : "e.g. software development"} /></label>
      <label><MapPin size={18} /><span>Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, state or ZIP" /></label>
      <label><span>Within</span><select value={radius} onChange={(event) => setRadius(Number(event.target.value))}><option value={10}>10 miles</option><option value={25}>25 miles</option><option value={50}>50 miles</option><option value={100}>100 miles</option></select></label>
      <button type="submit" disabled={loading || loadingContext}>{loading ? "Searching…" : "Search"}</button>
    </form>

    {suggestions.length ? <div className="student-opportunity-suggestions"><span>From your Boasted evidence:</span>{suggestions.slice(0, 5).map((item) => <button type="button" key={`${item.query}-${item.direction}`} onClick={() => chooseSuggestion(item)}>{item.query}</button>)}</div> : null}

    {!context?.api_configured && !loadingContext ? <div className="student-opportunity-setup"><Info size={19} /><div><strong>CareerOneStop license/API connection needed</strong><span>Boasted will not request CareerOneStop data until the API credentials and an active, unexpired CareerOneStop license grant are configured on the server.</span></div></div> : null}
    {error ? <div className="student-opportunity-error"><Info size={18} />{error}</div> : null}

    {loading ? <div className="student-opportunity-loading"><span /><strong>Checking current {isPrograms ? "programs" : "internships"}…</strong><small>Using your chosen location and search direction.</small></div> : null}

    {!loading && searched && data ? <>
      <div className="student-opportunity-results-head">
        <div><strong>{isPrograms ? data.training_total ?? data.results?.length ?? 0 : data.results?.length ?? 0}</strong><span>{isPrograms ? "career-focused training results" : "internship listings on this page"}</span></div>
        <label>Show<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={20}>20</option><option value={40}>40</option></select></label>
      </div>

      {isPrograms && data.results?.some((item) => item.boasted?.display_kind === "youth-support") ? <div className="student-opportunity-callout"><HandHeart size={18} /><span><strong>Youth-support programs included.</strong> Contact each provider to confirm services, eligibility, and any cost.</span></div> : null}

      {data.results?.length ? <div className="student-opportunity-grid">{data.results.map((item) => isPrograms ? <ProgramCard item={item} key={item.id} /> : <InternshipCard item={item} key={item.id} />)}</div> : <div className="student-opportunity-empty"><Search size={24} /><h3>No {isPrograms ? "programs" : "internships"} matched that search.</h3><p>Try a broader career term, a larger radius, or another evidence-based suggestion above.</p></div>}

      {isPrograms ? <SearchPager page={page} pages={data.pages || 0} onPage={(value) => void runSearch(value)} /> : <SearchPager page={page} pages={(data.results?.length || 0) >= pageSize ? page + 1 : page} onPage={(value) => void runSearch(value)} />}

      <div className="student-opportunity-source">
        <ShieldCheck size={18} />
        <div>
          <strong>CareerOneStop data attribution</strong>
          <span>{data.source?.required_attribution || "CareerOneStop data source acknowledgement: U.S. Department of Labor Employment and Training Administration (DOLETA) and Minnesota Department of Employment & Economic Development (DEED)."}</span>
        </div>
        <a href="https://www.careeronestop.org/" target="_blank" rel="noreferrer noopener">Source <ExternalLink size={14} /></a>
      </div>

      {isPrograms ? <div className="student-opportunity-volunteer"><HandHeart size={19} /><div><strong>Looking specifically to volunteer?</strong><span>Volunteer.gov is the official federal volunteer opportunity portal. We link to it, but we are not copying its listings until we have an approved API/data-use path.</span></div><a href="https://www.volunteer.gov/" target="_blank" rel="noreferrer noopener">Search Volunteer.gov <ExternalLink size={14} /></a></div> : null}
    </> : null}
  </section>;
}
