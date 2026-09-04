import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageSquare,
  Search,
  Share2,
  ShieldCheck,
} from "lucide-react";
import CalendlyEmbed from "./CalendlyEmbed.jsx";
import {
  getPublicEntries,
  getPublicImpactReceipts,
  getPublicProfile,
  getPublicTagsSummary,
} from "./api";
import { getPublicProfileConnection } from "./profileConnectionApi";
import { trackPublicProfileEvent } from "./publicAnalytics";
import { getProfileTheme } from "./profileThemes";
import "./ProofProfile.css";
import "./ProofProfileThemes.css";
import "./ProofPortfolio.css";

const PAGE_SIZE = 6;
const FILTERS = [
  "All",
  "Current Job",
  "Previous Job",
  "Personal Development",
  "Side Project",
  "Open Source",
  "Learning / Certification",
];

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") return tags.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function searchableEntry(entry) {
  return [
    entry.title,
    entry.category,
    entry.entry_type,
    entry.entry_date,
    entry.resume_bullet,
    entry.situation,
    entry.action,
    entry.impact,
    entry.lesson,
    ...normalizeTags(entry.tags),
  ].filter(Boolean).join(" ").toLowerCase();
}

function formatSignal(value = "") {
  return value.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function themeStyle(profile) {
  const theme = getProfileTheme(profile?.profile_theme);
  return {
    "--theme-accent": profile?.profile_primary_color || theme.primary,
    "--theme-accent-2": profile?.profile_secondary_color || theme.secondary,
    "--theme-bg": profile?.profile_background_color || theme.background,
  };
}

function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function richShareUrl(slug, version) {
  const encodedSlug = encodeURIComponent(slug || "");
  const encodedVersion = encodeURIComponent(version || "0");
  const isProductionDomain = /(^|\.)usebragstack\.com$/i.test(window.location.hostname);
  const base = isProductionDomain
    ? `${window.location.origin}/share/brag/${encodedSlug}`
    : `${apiBase()}/public/brag/${encodedSlug}/share`;
  return `${base}?v=${encodedVersion}`;
}

function ImpactCard({ receipt, featured = false }) {
  const metric = receipt.metrics?.[0];
  const confirmationCount = Number(receipt.confirmed_count || 0);
  const evidenceCount = receipt.evidence?.length || 0;
  return (
    <article className={`portfolio-impact-card ${featured ? "featured" : ""} ${confirmationCount > 0 ? "verified" : ""}`}>
      {confirmationCount > 0 && (
        <div className="portfolio-verified-stamp">
          <CheckCircle2 size={22} />
          <div><strong>Verified impact</strong><span>{confirmationCount} third-party confirmation{confirmationCount === 1 ? "" : "s"}</span></div>
        </div>
      )}
      <div className="portfolio-card-kicker">
        <span><Award size={15} /> Impact Receipt</span>
        <div className="portfolio-proof-badges">
          {confirmationCount > 0 && <span className="verified"><CheckCircle2 size={13} /> Third-party verified</span>}
          {evidenceCount > 0 && <span><ShieldCheck size={13} /> {evidenceCount} proof item{evidenceCount === 1 ? "" : "s"}</span>}
        </div>
      </div>
      <h3>{receipt.accomplishment}</h3>
      {metric && (
        <div className="portfolio-metric">
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
          {metric.context && <small>{metric.context}</small>}
        </div>
      )}
      <div className="portfolio-impact-copy">
        <div>
          <span>Contribution</span>
          <p>{receipt.contribution}</p>
        </div>
        <div className="portfolio-result">
          <span>Impact</span>
          <p>{receipt.result}</p>
        </div>
      </div>
      <div className="proof-chips portfolio-skill-chips">
        {receipt.skills?.slice(0, 7).map((skill) => <span key={`${receipt.id}-${skill}`}>{skill}</span>)}
      </div>
      {receipt.evidence?.length > 0 && (
        <div className="portfolio-evidence-list">
          {receipt.evidence.slice(0, 3).map((item, index) => (
            item.reference ? (
              <a key={`${receipt.id}-evidence-${index}`} href={item.reference} target="_blank" rel="noreferrer">
                <ShieldCheck size={14} /> {item.title || "Supporting evidence"} <ExternalLink size={13} />
              </a>
            ) : (
              <span key={`${receipt.id}-evidence-${index}`}><ShieldCheck size={14} /> {item.title || "Supporting evidence"}</span>
            )
          ))}
        </div>
      )}
    </article>
  );
}

export default function PublicBragPage() {
  const [profile, setProfile] = useState(null);
  const [connection, setConnection] = useState(null);
  const [entries, setEntries] = useState([]);
  const [meta, setMeta] = useState({ total_entries: 0, activity_last_6_months: [] });
  const [receipts, setReceipts] = useState([]);
  const [tags, setTags] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [offline, setOffline] = useState(false);
  const [shareNotice, setShareNotice] = useState("");

  const slug = useMemo(() => {
    const [, route, value] = window.location.pathname.split("/");
    return route === "brag" ? value : undefined;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [profileData, receiptData, tagData, connectionData] = await Promise.all([
          getPublicProfile(slug),
          getPublicImpactReceipts(slug),
          getPublicTagsSummary(slug),
          getPublicProfileConnection(slug),
        ]);
        setProfile(profileData.profile ?? null);
        setReceipts(receiptData.receipts ?? []);
        setTags(tagData);
        setConnection(connectionData);
        setOffline(false);
        void trackPublicProfileEvent(slug, "profile_view");
      } catch (error) {
        console.error(error);
        setOffline(true);
      }
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicEntries(slug, PAGE_SIZE, (page - 1) * PAGE_SIZE);
        setEntries(data.entries ?? []);
        setMeta({
          total_entries: data.total_entries ?? 0,
          activity_last_6_months: data.activity_last_6_months ?? [],
        });
        setOffline(false);
      } catch (error) {
        console.error(error);
        setOffline(true);
      }
    })();
  }, [slug, page]);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => (
      (!query || searchableEntry(entry).includes(query))
      && (filter === "All" || entry.entry_type === filter)
    ));
  }, [entries, search, filter]);

  const name = profile?.name || "BragStack member";
  const pages = Math.max(1, Math.ceil(meta.total_entries / PAGE_SIZE));
  const start = meta.total_entries ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, meta.total_entries);
  const topSkills = Object.entries(tags?.tags ?? {}).slice(0, 18);
  const publicEvidence = receipts.reduce((count, receipt) => count + (receipt.evidence?.length ?? 0), 0);
  const confirmations = receipts.reduce((count, receipt) => count + Number(receipt.confirmed_count || 0), 0);
  const verifiedReceipts = receipts.filter((receipt) => Number(receipt.confirmed_count || 0) > 0).length;
  const shareVersion = `${verifiedReceipts}-${confirmations}-${meta.total_entries}-${receipts.length}`;

  useEffect(() => {
    if (!profile) return;
    document.title = `${name} — Proof Portfolio | BragStack`;
    const description = profile.headline
      ? `${profile.headline} · ${verifiedReceipts} verified impact${verifiedReceipts === 1 ? "" : "s"} · ${meta.total_entries} selected accomplishment${meta.total_entries === 1 ? "" : "s"}.`
      : `${name}'s evidence-backed career impact on BragStack.`;
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);
  }, [profile, name, verifiedReceipts, meta.total_entries]);

  async function shareProfile() {
    const url = richShareUrl(slug, shareVersion);
    const verifiedText = verifiedReceipts > 0 ? ` ${verifiedReceipts} verified impact${verifiedReceipts === 1 ? "" : "s"}.` : "";
    const shareData = {
      title: `${name} · BragStack Proof Portfolio`,
      text: `View ${name}'s public portfolio of accomplishments and career impact on BragStack.${verifiedText}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareNotice("Shared");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareNotice("Rich link copied");
      } else {
        window.prompt("Copy this Proof Portfolio share link:", url);
        setShareNotice("Ready to copy");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setShareNotice("Share link ready");
    }
    window.setTimeout(() => setShareNotice(""), 2400);
  }

  return (
    <main className="proof-profile proof-portfolio" data-theme={profile?.profile_theme || "default"} style={themeStyle(profile)}>
      <div className="proof-profile-inner">
        <header className="proof-topbar portfolio-topbar">
          <a className="proof-brand" href="/">
            <span className="proof-brand-mark">B</span>
            <span>BragStack</span>
          </a>
          <div className="portfolio-topbar-actions">
            <span className="proof-topbar-tag">Proof Portfolio</span>
            <button className="portfolio-share" type="button" onClick={() => void shareProfile()}>
              <Share2 size={16} /> {shareNotice || "Share"}
            </button>
          </div>
        </header>

        <section className="proof-hero portfolio-hero">
          <div className="portfolio-identity">
            <p className="proof-eyebrow">Professional proof portfolio</p>
            <div className="portfolio-avatar">{name.charAt(0).toUpperCase() || "B"}</div>
            <h1>{name}</h1>
            <p className="proof-headline">{profile?.headline || "Evidence-backed career impact"}</p>
            <p className="proof-bio">{profile?.bio || "A selected portfolio of accomplishments, measurable outcomes, and evidence-backed work."}</p>
            {profile?.location && <p className="proof-location"><MapPin size={15} /> {profile.location}</p>}
            <div className="proof-actions portfolio-actions">
              {connection?.open_to_talk && connection.open_to_talk_url && (
                <a className="proof-action primary" href={connection.open_to_talk_url} target="_blank" rel="noreferrer" onClick={() => void trackPublicProfileEvent(slug, "open_to_talk_click")}>
                  <MessageSquare size={15} /> Open to Talk <ExternalLink size={15} />
                </a>
              )}
              {profile?.github_url && <a className="proof-action" href={profile.github_url} target="_blank" rel="noreferrer" onClick={() => void trackPublicProfileEvent(slug, "github_click")}>GitHub <ExternalLink size={15} /></a>}
              {profile?.portfolio_url && <a className="proof-action" href={profile.portfolio_url} target="_blank" rel="noreferrer" onClick={() => void trackPublicProfileEvent(slug, "portfolio_click")}>Website <ExternalLink size={15} /></a>}
              {profile?.resume_url && <a className="proof-action" href={profile.resume_url} target="_blank" rel="noreferrer" onClick={() => void trackPublicProfileEvent(slug, "resume_click")}>Résumé <ExternalLink size={15} /></a>}
            </div>
          </div>

          <aside className={`portfolio-proof-passport ${verifiedReceipts > 0 ? "has-verified-impact" : ""}`}>
            <p className="proof-eyebrow">Portfolio snapshot</p>
            {verifiedReceipts > 0 && <div className="portfolio-passport-verified"><CheckCircle2 size={18} /><strong>{verifiedReceipts} verified impact{verifiedReceipts === 1 ? "" : "s"}</strong></div>}
            <div className="portfolio-proof-number"><strong>{meta.total_entries}</strong><span>selected accomplishments</span></div>
            <div className="portfolio-passport-grid">
              <div><strong>{receipts.length}</strong><span>Impact Receipts</span></div>
              <div className={confirmations > 0 ? "verified-count" : ""}><strong>{confirmations}</strong><span>third-party confirmations</span></div>
              <div><strong>{publicEvidence}</strong><span>public proof items</span></div>
              <div><strong>{tags?.total_unique_tags ?? 0}</strong><span>demonstrated skills</span></div>
            </div>
            <p className="portfolio-passport-note"><ShieldCheck size={15} /> Everything here was intentionally selected for public sharing.</p>
          </aside>
        </section>

        {offline && <section className="proof-section"><div className="proof-error">Proof Profile data could not be loaded right now.</div></section>}

        {!offline && receipts.length > 0 && (
          <section className="portfolio-section portfolio-featured-impact">
            <div className="portfolio-section-heading">
              <div>
                <p className="proof-eyebrow">Featured impact</p>
                <h2>Work with receipts.</h2>
                <p>Selected outcomes with contribution, measurable impact, skills, and proof attached.</p>
              </div>
              <span className={`portfolio-section-badge ${verifiedReceipts > 0 ? "verified" : ""}`}><ShieldCheck size={14} /> {verifiedReceipts > 0 ? `${verifiedReceipts} verified impact${verifiedReceipts === 1 ? "" : "s"}` : "Evidence-backed"}</span>
            </div>
            <div className="portfolio-impact-grid">
              {receipts.slice(0, 4).map((receipt, index) => <ImpactCard key={receipt.id} receipt={receipt} featured={index === 0} />)}
            </div>
          </section>
        )}

        {!offline && topSkills.length > 0 && (
          <section className="portfolio-section portfolio-skills-section">
            <div className="portfolio-section-heading">
              <div>
                <p className="proof-eyebrow">Demonstrated skills</p>
                <h2>Skills backed by actual work.</h2>
                <p>These skills come from accomplishments this person chose to make public.</p>
              </div>
            </div>
            <div className="portfolio-skill-cloud">
              {topSkills.map(([skill, count]) => <span key={skill}><strong>{skill}</strong><small>{count} proof item{Number(count) === 1 ? "" : "s"}</small></span>)}
            </div>
          </section>
        )}

        <section className="portfolio-section portfolio-work-section">
          <div className="portfolio-section-heading">
            <div>
              <p className="proof-eyebrow">Selected work</p>
              <h2>Accomplishments, not job-description filler.</h2>
              <p>Explore public work by impact, skill, project type, or career context.</p>
            </div>
            <span className="portfolio-section-badge"><BriefcaseBusiness size={14} /> {meta.total_entries} public</span>
          </div>

          <div className="proof-controls portfolio-controls">
            <div className="proof-search">
              <Search size={17} />
              <input
                aria-label="Search public proof"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search by skill, impact, project, or action..."
              />
            </div>
            <div className="proof-filter-row">
              {FILTERS.map((item) => (
                <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => { setFilter(item); setPage(1); }}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="proof-empty">No matching public work on this page. Try another filter or page.</div>
          ) : (
            <div className="portfolio-work-grid">
              {shown.map((entry, index) => (
                <article className="proof-entry-card portfolio-work-card" key={entry.id}>
                  <div className="portfolio-work-card-head">
                    <span className="portfolio-work-index">{String((page - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="proof-eyebrow">{entry.category || "Selected work"}</p>
                      <h3>{entry.title}</h3>
                    </div>
                  </div>
                  <div className="proof-entry-meta"><span>{entry.entry_type || "Career proof"}</span>{entry.entry_date && <span>{entry.entry_date}</span>}</div>
                  <div className="portfolio-work-impact"><span>Impact</span><p>{entry.impact || entry.resume_bullet || "Impact details available in the accomplishment record."}</p></div>
                  {entry.action && <div className="portfolio-work-action"><span>What I did</span><p>{entry.action}</p></div>}
                  <div className="proof-chips portfolio-skill-chips">{normalizeTags(entry.tags).map((tag) => <span key={`${entry.id}-${tag}`}>{tag}</span>)}</div>
                </article>
              ))}
            </div>
          )}

          <div className="proof-pagination portfolio-pagination">
            <span className="proof-pagination-summary">Showing {start}–{end} of {meta.total_entries} selected accomplishments · Page {page} of {pages}</span>
            <div className="proof-pagination-controls">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                <button type="button" aria-current={number === page ? "page" : undefined} className={number === page ? "active" : ""} key={number} onClick={() => setPage(number)}>{number}</button>
              ))}
              <button type="button" disabled={page === pages} onClick={() => setPage((current) => Math.min(pages, current + 1))}>Next</button>
            </div>
          </div>
        </section>

        {connection?.open_to_talk && connection?.open_to_talk_url && (
          <section className="portfolio-section portfolio-contact-section">
            <div className="portfolio-section-heading">
              <div>
                <p className="proof-eyebrow">Connect</p>
                <h2>See the work. Then start the conversation.</h2>
                <p>{connection.open_to_talk_note || `${name} is open to relevant professional conversations.`}</p>
              </div>
            </div>
            <div className="proof-chips portfolio-conversation-types">{connection.open_to_talk_types?.map((type) => <span key={type}>{formatSignal(type)}</span>)}</div>
            <CalendlyEmbed url={connection.open_to_talk_url} title={`Book time with ${name}`} />
          </section>
        )}

        <footer className="portfolio-footer">
          <div><ShieldCheck size={16} /><span>Built from career proof this member chose to publish.</span></div>
          <button type="button" onClick={() => void shareProfile()}><Share2 size={15} /> Share this portfolio</button>
        </footer>
      </div>
    </main>
  );
}
