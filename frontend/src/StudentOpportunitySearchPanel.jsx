import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
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
  Users,
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

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
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
  return <article className="student-opportunity-card program-card">
    <div className="student-opportunity-card-top">
      <span className="opportunity-kind training"><GraduationCap size={14} /> College program</span>
      {source.cip_code ? <span className="opportunity-posted">CIP {source.cip_code}</span> : null}
    </div>
    <h4>{source.title || "Program"}</h4>
    {source.provider ? <p className="student-opportunity-provider">{source.provider}</p> : null}
    <div className="student-opportunity-facts">
      {location ? <span><MapPin size={15} />{location}</span> : null}
      {source.credential ? <span><GraduationCap size={15} />{source.credential}</span> : null}
      {source.student_size ? <span><Users size={15} />{Number(source.student_size).toLocaleString()} students</span> : null}
      {source.avg_net_price != null ? <span><BadgeDollarSign size={15} />Avg. net price context: {money(source.avg_net_price)}</span> : null}
    </div>
    {boasted.why_shown ? <p className="student-opportunity-reason"><Sparkles size={14} />{cleanReason(boasted.why_shown)}</p> : null}
    <footer>
      <small>College Scorecard aggregate data · verify program details and cost with the school</small>
      {source.url ? <a href={source.url.startsWith("http") ? source.url : `https://${source.url}`} target="_blank" rel="noreferrer noopener">View institution <ExternalLink size={14} /></a> : null}
    </footer>
  </article>;
}

function InternshipCard({ item }) {
  const source = item.source || {};
  const boasted = item.boasted || {};
  return <article className="student-opportunity-card internship-card">
    <div className="student-opportunity-card-top">
      <span className="opportunity-kind internship"><BriefcaseBusiness size={14} /> Federal internship</span>
      {source.posted_at ? <span className="opportunity-posted"><CalendarDays size={13} />{new Date(source.posted_at).toLocaleDateString()}</span> : null}
    </div>
    <h4>{source.title || "Federal internship opportunity"}</h4>
    {source.company ? <p className="student-opportunity-provider">{source.company}</p> : null}
    <div className="student-opportunity-facts">
      {source.location ? <span><MapPin size={15} />{source.location}</span> : null}
      {source.deadline ? <span><CalendarDays size={15} />Closes {new Date(source.deadline).toLocaleDateString()}</span> : null}
    </div>
    {source.description ? <p className="student-opportunity-description">{source.description}</p> : null}
    {boasted.why_shown ? <p className="student-opportunity-reason"><Sparkles size={14} />{cleanReason(boasted.why_shown)}</p> : null}
    <footer>
      <small>Live open USAJOBS listing · no hiring prediction</small>
      {source.url ? <a href={source.url} target="_blank" rel="noreferrer noopener">Open on USAJOBS <ExternalLink size={14} /></a> : null}
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
        setQuery(result.suggested_queries?.[0]?.query || "");
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
  const sourceConfigured = isPrograms ? context?.program_api_configured : context?.internship_api_configured;

  async function runSearch(nextPage = 1, nextQuery = query) {
    if (!location.trim()) {
      setError(isPrograms ? "Enter a state or city and state, such as Atlanta, GA." : "Enter a city, state, or ZIP code so Boasted knows where to look.");
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

  const relatedTerms = data?.search_interpretation?.related_terms || [];

  return <section className="student-opportunity-panel" data-mode={mode}>
    <div className="student-opportunity-hero">
      <div>
        <p className="student-opportunity-kicker"><Sparkles size={16} /> {isPrograms ? "Program Finder" : "Internship Finder"}</p>
        <h2>{isPrograms ? "Explore college programs connected to the directions already showing up in your work." : "Find current federal internships connected to your demonstrated skills and career directions."}</h2>
        <p>{isPrograms
          ? "Boasted turns your saved evidence into editable search ideas, then checks U.S. Department of Education College Scorecard data for programs in the city or state you choose."
          : "Boasted turns your demonstrated skills and career directions into editable search ideas, then searches all currently open USAJOBS announcements. Related career wording is expanded locally so one search can cover titles such as computer engineer, software engineer, backend engineer, and software developer without making one API call per synonym."}</p>
      </div>
      <div className="student-opportunity-trust"><ShieldCheck size={20} /><span><strong>No fake match score.</strong><small>Evidence-connected suggestions · official public data · you choose what to pursue</small></span></div>
    </div>

    <div className="student-opportunity-tipbar">
      <Info size={17} />
      <div><strong>{isPrograms ? "How to search programs:" : "How to search internships:"}</strong><span>{isPrograms
        ? "Try a career or subject such as software, nursing, cybersecurity, marketing, finance, teaching, design, or engineering. Use a state or city + state, such as Atlanta, GA."
        : "Use the career language you would naturally type. Boasted corrects a few obvious search typos, expands known related titles locally, and searches currently open announcements without a hidden 30-day posted-date cutoff."}</span></div>
    </div>

    <form className={`student-opportunity-search ${isPrograms ? "program-search" : ""}`} onSubmit={(event) => { event.preventDefault(); void runSearch(1); }}>
      <label className="student-opportunity-query"><Search size={19} /><span>Career / subject</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isPrograms ? "e.g. software" : "e.g. computer engineer"} /></label>
      <label><MapPin size={18} /><span>Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder={isPrograms ? "Atlanta, GA or GA" : "City, state or ZIP"} /></label>
      {!isPrograms ? <label><span>Within</span><select value={radius} onChange={(event) => setRadius(Number(event.target.value))}><option value={10}>10 miles</option><option value={25}>25 miles</option><option value={50}>50 miles</option><option value={100}>100 miles</option></select></label> : null}
      <button type="submit" disabled={loading || loadingContext || !sourceConfigured}>{loading ? "Searching…" : "Search"}</button>
    </form>

    {suggestions.length ? <div className="student-opportunity-suggestions"><span>From your Boasted evidence:</span>{suggestions.slice(0, 5).map((item) => <button type="button" key={`${item.query}-${item.direction}`} onClick={() => chooseSuggestion(item)}>{item.query}</button>)}</div> : null}

    {!sourceConfigured && !loadingContext ? <div className="student-opportunity-setup"><Info size={19} /><div><strong>{isPrograms ? "College Scorecard connection needed" : "USAJOBS connection needed"}</strong><span>{isPrograms ? "The feature is ready; the server needs a free api.data.gov key before live College Scorecard program results can load." : "The feature is ready; the server needs a USAJOBS API key plus the email used to register that key."}</span></div></div> : null}
    {error ? <div className="student-opportunity-error"><Info size={18} />{error}</div> : null}

    {loading ? <div className="student-opportunity-loading"><span /><strong>Checking current {isPrograms ? "programs" : "federal internships"}…</strong><small>Using your chosen location and search direction.</small></div> : null}

    {!loading && searched && data ? <>
      {!isPrograms && relatedTerms.length > 1 ? <div className="student-opportunity-callout"><Sparkles size={18} /><span><strong>Related titles included.</strong> {relatedTerms.slice(0, 6).join(" · ")}</span></div> : null}
      {!isPrograms && data.fallback_notice ? <div className="student-opportunity-callout"><MapPin size={18} /><span><strong>Location broadened.</strong> {data.fallback_notice}</span></div> : null}

      <div className="student-opportunity-results-head">
        <div><strong>{isPrograms ? data.training_total ?? data.results?.length ?? 0 : data.total ?? data.results?.length ?? 0}</strong><span>{isPrograms ? "program matches in this search" : "open internship matches in this search"}</span></div>
        <label>Show<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={20}>20</option><option value={40}>40</option></select></label>
      </div>

      {isPrograms && data.coverage_notice ? <div className="student-opportunity-callout"><Building2 size={18} /><span><strong>Transparent discovery.</strong> {data.coverage_notice}</span></div> : null}

      {data.results?.length ? <div className="student-opportunity-grid">{data.results.map((item) => isPrograms ? <ProgramCard item={item} key={item.id} /> : <InternshipCard item={item} key={item.id} />)}</div> : <div className="student-opportunity-empty"><Search size={24} /><h3>No {isPrograms ? "programs" : "federal internships"} matched that search.</h3><p>Try a broader career term, a different location, or another evidence-based suggestion above.</p></div>}

      <SearchPager page={page} pages={data.pages || 0} onPage={(value) => void runSearch(value)} />

      <div className="student-opportunity-source">
        <ShieldCheck size={18} />
        <div>
          <strong>{isPrograms ? "College Scorecard · U.S. Department of Education" : "USAJOBS · U.S. Office of Personnel Management"}</strong>
          <span>{isPrograms ? "Official public institution and field-of-study context. Aggregate cost/outcome data is context, not a personal prediction." : "Live public federal job opportunity announcements. Boasted keeps the source listing separate from its evidence-based search suggestions and caches identical searches briefly to avoid unnecessary provider calls."}</span>
        </div>
        <a href={isPrograms ? "https://collegescorecard.ed.gov/" : "https://www.usajobs.gov/"} target="_blank" rel="noreferrer noopener">Source <ExternalLink size={14} /></a>
      </div>

      <div className="student-opportunity-legal"><ShieldCheck size={17}/><span>Want the licensing/source history? <a href="/legal/education-data">Read Boasted&apos;s Education Data & Source Audit</a>.</span></div>

      {isPrograms ? <div className="student-opportunity-volunteer"><HandHeart size={19} /><div><strong>Looking specifically to volunteer?</strong><span>Volunteer.gov is the official federal volunteer opportunity portal. Boasted links to it rather than copying its listings without an approved data-use path.</span></div><a href="https://www.volunteer.gov/" target="_blank" rel="noreferrer noopener">Search Volunteer.gov <ExternalLink size={14} /></a></div> : null}
    </> : null}
  </section>;
}
