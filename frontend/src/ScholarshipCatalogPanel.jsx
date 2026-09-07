import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Filter,
  Info,
  MapPin,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { searchScholarships, submitScholarship } from "./scholarshipApi.js";
import "./ScholarshipCatalogPanel.css";

const LEVELS = [
  ["", "All study levels"],
  ["high-school-senior", "High school senior"],
  ["undergraduate", "Undergraduate"],
  ["community-college", "Community college"],
  ["graduate", "Graduate"],
  ["vocational", "Vocational / trade"],
  ["professional-development", "Professional development"],
];

const BASIS = [
  ["", "Any award basis"],
  ["need", "Need-based"],
  ["merit", "Merit"],
  ["merit-need", "Merit + need"],
  ["field", "Field of study"],
  ["other", "Other"],
];

const AVAILABILITY = [
  ["", "Active opportunities"],
  ["open", "Open now"],
  ["upcoming", "Upcoming"],
  ["rolling", "Rolling deadline"],
  ["unknown", "Verify current cycle"],
];

const QUICK_SEARCHES = [
  "nursing",
  "high school senior $5,000+",
  "need-based undergraduate",
  "women graduate",
  "STEM merit",
];

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "") return "Amount varies";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `$${Number(value).toLocaleString()}`;
  }
}

function awardLabel(item) {
  if (item.award_min && item.award_max && item.award_min !== item.award_max) {
    return `${formatMoney(item.award_min, item.currency)}–${formatMoney(item.award_max, item.currency)}`;
  }
  return formatMoney(item.award_max ?? item.award_min, item.currency);
}

function deadlineLabel(item) {
  if (item.availability === "rolling") return "Rolling deadline";
  if (!item.deadline_date) return item.deadline_type === "varies" ? "Deadline varies" : "Verify deadline";
  const date = new Date(item.deadline_date);
  if (Number.isNaN(date.getTime())) return "Verify deadline";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sourceDate(value) {
  if (!value) return "recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function prettyToken(value = "") {
  return value.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const candidates = [1, page - 1, page, page + 1, pages]
    .filter((value) => value >= 1 && value <= pages);
  const visible = [...new Set(candidates)].sort((a, b) => a - b);
  return <nav className="scholarship-pagination" aria-label="Scholarship result pages">
    <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={17} /> Previous</button>
    <div>
      {visible.map((value, index) => <span key={value} className="scholarship-page-slot">
        {index > 0 && value - visible[index - 1] > 1 ? <small>…</small> : null}
        <button type="button" aria-current={value === page ? "page" : undefined} className={value === page ? "active" : ""} onClick={() => onPage(value)}>{value}</button>
      </span>)}
    </div>
    <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={17} /></button>
  </nav>;
}

function ScholarshipCard({ item }) {
  const tags = [
    ...(item.education_levels || []).slice(0, 2).map(prettyToken),
    item.basis ? prettyToken(item.basis) : "",
    ...(item.tags || []).slice(0, 2).map(prettyToken),
  ].filter(Boolean).slice(0, 4);
  const officialUrl = item.apply_url || item.info_url || item.source_url;
  return <article className="scholarship-card">
    <div className="scholarship-card-topline">
      <span className={`scholarship-availability ${item.availability || "unknown"}`}><span />{item.availability === "open" ? "Open" : prettyToken(item.availability || "verify")}</span>
      {item.license_id ? <span className="scholarship-license"><ShieldCheck size={13} /> Licensed source</span> : null}
    </div>
    <div className="scholarship-card-title">
      <h4>{item.title}</h4>
      <p>{item.sponsor}</p>
    </div>
    <div className="scholarship-card-facts">
      <span><CircleDollarSign size={17} /><strong>{awardLabel(item)}</strong></span>
      <span><CalendarDays size={17} /><strong>{deadlineLabel(item)}</strong></span>
      <span><MapPin size={17} /><strong>{item.residency?.includes("US") ? "United States" : item.residency?.join(", ") || "Check location"}</strong></span>
    </div>
    {item.summary ? <p className="scholarship-summary">{item.summary}</p> : null}
    <div className="scholarship-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="scholarship-card-footer">
      <small>Source checked {sourceDate(item.source_verified_at)}</small>
      {officialUrl ? <a href={officialUrl} target="_blank" rel="noreferrer noopener">Official details <ExternalLink size={14} /></a> : null}
    </div>
  </article>;
}

const EMPTY_SUBMISSION = {
  scholarship_name: "",
  provider_name: "",
  provider_email: "",
  provider_website: "",
  application_url: "",
  description: "",
  award_amount: "",
  deadline: "",
  eligibility: "",
  contact_name: "",
  attestation: false,
  company_fax: "",
};

function ScholarshipSubmission({ onClose }) {
  const [form, setForm] = useState(EMPTY_SUBMISSION);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setError("");
    setMessage("");
    try {
      const result = await submitScholarship(form);
      setMessage(result.message || "Scholarship submitted for review.");
      setForm(EMPTY_SUBMISSION);
    } catch (requestError) {
      setError(requestError.message || "We could not submit this scholarship.");
    } finally {
      setSending(false);
    }
  }

  return <section className="scholarship-submit-panel" id="submit-scholarship" aria-label="Submit a scholarship to Boasted">
    <div className="scholarship-submit-heading">
      <div><p><PlusCircle size={16} /> Scholarship providers</p><h3>Add your scholarship to Boasted</h3><span>Listings are reviewed before they appear in search. Submission never means automatic publication.</span></div>
      <button type="button" className="scholarship-close" onClick={onClose} aria-label="Close scholarship submission"><X size={19} /></button>
    </div>
    <form onSubmit={handleSubmit}>
      <div className="scholarship-form-grid">
        <label>Scholarship name<input required minLength={3} value={form.scholarship_name} onChange={(event) => setField("scholarship_name", event.target.value)} /></label>
        <label>Provider / organization<input required minLength={2} value={form.provider_name} onChange={(event) => setField("provider_name", event.target.value)} /></label>
        <label>Contact name<input value={form.contact_name} onChange={(event) => setField("contact_name", event.target.value)} /></label>
        <label>Provider email<input required type="email" value={form.provider_email} onChange={(event) => setField("provider_email", event.target.value)} /></label>
        <label>Official provider website<input required type="url" placeholder="https://…" value={form.provider_website} onChange={(event) => setField("provider_website", event.target.value)} /></label>
        <label>Official application URL<input required type="url" placeholder="https://…" value={form.application_url} onChange={(event) => setField("application_url", event.target.value)} /></label>
        <label>Award amount<input placeholder="$2,500, full tuition, varies…" value={form.award_amount} onChange={(event) => setField("award_amount", event.target.value)} /></label>
        <label>Deadline<input placeholder="March 15, 2027 / rolling" value={form.deadline} onChange={(event) => setField("deadline", event.target.value)} /></label>
      </div>
      <label>Scholarship description<textarea required minLength={20} rows={4} value={form.description} onChange={(event) => setField("description", event.target.value)} /></label>
      <label>Eligibility requirements<textarea required minLength={10} rows={4} value={form.eligibility} onChange={(event) => setField("eligibility", event.target.value)} /></label>
      <label className="scholarship-attestation"><input required type="checkbox" checked={form.attestation} onChange={(event) => setField("attestation", event.target.checked)} /><span>I confirm that I am authorized to provide this scholarship information and allow Boasted to store and display the submitted listing after review.</span></label>
      <label className="scholarship-honeypot" aria-hidden="true">Company fax<input tabIndex={-1} autoComplete="off" value={form.company_fax} onChange={(event) => setField("company_fax", event.target.value)} /></label>
      {error ? <div className="scholarship-form-message error">{error}</div> : null}
      {message ? <div className="scholarship-form-message success"><BadgeCheck size={17} />{message}</div> : null}
      <div className="scholarship-submit-actions"><button type="submit" className="scholarship-primary" disabled={sending}><Send size={17} />{sending ? "Submitting…" : "Submit for review"}</button><small>Boasted verifies provider identity, links, eligibility, and deadline before publishing.</small></div>
    </form>
  </section>;
}

function ScholarshipCatalogPanel() {
  const [queryInput, setQueryInput] = useState("");
  const [filters, setFilters] = useState({ query: "", state: "", level: "", basis: "", availability: "", minAmount: "", sort: "recent", page: 1, pageSize: 20 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchScholarships(filters)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "Scholarships could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  const understood = useMemo(() => data?.query_interpretation?.understood || [], [data]);

  function searchNow(nextQuery = queryInput) {
    setQueryInput(nextQuery);
    setFilters((current) => ({ ...current, query: nextQuery.trim(), page: 1 }));
  }

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  }

  function clearFilters() {
    setQueryInput("");
    setFilters({ query: "", state: "", level: "", basis: "", availability: "", minAmount: "", sort: "recent", page: 1, pageSize: 20 });
  }

  return <section className="scholarship-catalog" id="scholarship-search" data-testid="scholarship-catalog">
    <div className="scholarship-hero">
      <div className="scholarship-hero-copy">
        <p className="scholarship-eyebrow"><Sparkles size={16} /> Scholarship Search</p>
        <h2>Search for funding without digging through stale lists.</h2>
        <p>Describe what you&apos;re looking for in normal language. Boasted interprets useful filters, keeps source provenance visible, and hides expired cycles from normal search.</p>
      </div>
      <div className="scholarship-hero-stat">
        <strong>{data?.active_total ?? "—"}</strong>
        <span>active licensed opportunities</span>
        <small>More sources are only added after rights review.</small>
      </div>
    </div>

    <form className="scholarship-search-box" onSubmit={(event) => { event.preventDefault(); searchNow(); }}>
      <Search size={23} />
      <label className="sr-only" htmlFor="scholarship-query">Search scholarships</label>
      <input id="scholarship-query" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Try: nursing, high school senior $5,000+, need-based undergraduate…" />
      {queryInput ? <button type="button" className="scholarship-clear-query" aria-label="Clear search" onClick={() => searchNow("")}><X size={17} /></button> : null}
      <button type="submit" className="scholarship-primary">Search</button>
    </form>

    <div className="scholarship-tipbar">
      <div><Info size={16} /><span><strong>Search tip:</strong> include your study level, field, award amount, or words like <em>need-based</em>, <em>merit</em>, <em>rolling</em>, or <em>open</em>.</span></div>
      <div className="scholarship-tip-chips">{QUICK_SEARCHES.map((tip) => <button type="button" key={tip} onClick={() => searchNow(tip)}>{tip}</button>)}</div>
    </div>

    {understood.length ? <div className="scholarship-understood"><Sparkles size={15} /><strong>Boasted understood:</strong>{understood.map((item) => <span key={item}>{item}</span>)}</div> : null}

    <div className="scholarship-toolbar">
      <button type="button" className={`scholarship-filter-toggle ${showFilters ? "active" : ""}`} onClick={() => setShowFilters((value) => !value)}><Filter size={17} /> Filters</button>
      <div className="scholarship-result-count"><strong>{data?.total ?? 0}</strong> results{filters.query ? <> for “{filters.query}”</> : null}</div>
      <div className="scholarship-toolbar-actions">
        <label>Sort<select value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)}><option value="recent">Recently added</option><option value="deadline">Deadline soonest</option><option value="amount">Highest award</option></select></label>
        <label>Per page<select value={filters.pageSize} onChange={(event) => setFilter("pageSize", Number(event.target.value))}><option value={20}>20</option><option value={40}>40</option></select></label>
        <button type="button" className="scholarship-provider-button" onClick={() => setShowSubmission((value) => !value)}><PlusCircle size={17} /> Submit a scholarship</button>
      </div>
    </div>

    {showSubmission ? <ScholarshipSubmission onClose={() => setShowSubmission(false)} /> : null}

    <div className={`scholarship-browser ${showFilters ? "filters-open" : ""}`}>
      <aside className="scholarship-filters" aria-label="Scholarship filters">
        <div className="scholarship-filter-heading"><strong>Refine results</strong><button type="button" onClick={clearFilters}>Reset</button></div>
        <label>Study level<select value={filters.level} onChange={(event) => setFilter("level", event.target.value)}>{LEVELS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Award basis<select value={filters.basis} onChange={(event) => setFilter("basis", event.target.value)}>{BASIS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Status<select value={filters.availability} onChange={(event) => setFilter("availability", event.target.value)}>{AVAILABILITY.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Minimum award<select value={filters.minAmount} onChange={(event) => setFilter("minAmount", event.target.value)}><option value="">Any amount</option><option value="1000">$1,000+</option><option value="2500">$2,500+</option><option value="5000">$5,000+</option><option value="10000">$10,000+</option></select></label>
        <label>State code<input maxLength={2} placeholder="NV" value={filters.state} onChange={(event) => setFilter("state", event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))} /></label>
        <div className="scholarship-filter-note"><BookOpen size={16} /><span>Location filters include national opportunities when they are open to U.S. students.</span></div>
      </aside>

      <div className="scholarship-results">
        {loading ? <div className="scholarship-loading"><span /><strong>Searching scholarships…</strong><small>Checking current active records and source freshness.</small></div> : null}
        {!loading && error ? <div className="scholarship-empty error"><Info size={23} /><h3>Scholarships couldn&apos;t load</h3><p>{error}</p><button type="button" onClick={() => setFilters((current) => ({ ...current }))}>Try again</button></div> : null}
        {!loading && !error && !data?.results?.length ? <div className="scholarship-empty"><Search size={25} /><h3>No active scholarships matched that search.</h3><p>Try fewer words, remove an amount filter, or search a broader study level. We do not pad results with expired or unlicensed listings.</p><button type="button" onClick={clearFilters}>Clear filters</button></div> : null}
        {!loading && !error && data?.results?.length ? <>
          <div className="scholarship-card-grid">{data.results.map((item) => <ScholarshipCard item={item} key={item.id} />)}</div>
          <Pagination page={data.page} pages={data.pages} onPage={(page) => { setFilters((current) => ({ ...current, page })); document.getElementById("scholarship-search")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
        </> : null}
      </div>
    </div>

    <footer className="scholarship-source-footer">
      <div><ShieldCheck size={19} /><span><strong>Rights-checked catalog.</strong> Boasted currently seeds this search from Open Scholarships under CC BY 4.0 and stores the required attribution and source provenance with each record.</span></div>
      <a href="https://scholarships.grudged.io/" target="_blank" rel="noreferrer noopener">Open Scholarships source <ExternalLink size={14} /></a>
      {data?.coverage_notice ? <small>{data.coverage_notice}</small> : null}
    </footer>
  </section>;
}

export default ScholarshipCatalogPanel;
