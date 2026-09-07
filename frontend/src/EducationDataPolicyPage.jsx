import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FileClock,
  GraduationCap,
  Landmark,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import "./EducationDataPolicyPage.css";

const approvedSources = [
  {
    name: "Open Scholarships",
    publisher: "Grudged LLC / Open Scholarships",
    status: "Approved · stored catalog",
    rights: "CC BY 4.0",
    use: "Licensed scholarship seed. Boasted validates the source license identity, license URL, and required attribution before writes.",
    url: "https://github.com/Grudged/open-scholarships",
  },
  {
    name: "College Scorecard",
    publisher: "U.S. Department of Education",
    status: "Approved · live API",
    rights: "Public federal dataset / Data.gov licensing metadata",
    use: "Program and institution discovery. Aggregate cost/outcome fields remain context and are not personal predictions.",
    url: "https://collegescorecard.ed.gov/data/",
  },
  {
    name: "USAJOBS",
    publisher: "U.S. Office of Personnel Management",
    status: "Approved · live API",
    rights: "USAJOBS API Terms of Service",
    use: "Live federal internship and student-trainee discovery with source links. API credentials remain server-side.",
    url: "https://developer.usajobs.gov/",
  },
  {
    name: "O*NET 31.0 Database",
    publisher: "U.S. Department of Labor / ETA",
    status: "Approved · reference data",
    rights: "CC BY 4.0, subject to O*NET exceptions",
    use: "Occupation/skill taxonomy and career exploration context with required attribution.",
    url: "https://www.onetcenter.org/database.html",
  },
  {
    name: "NCES CIP-SOC Crosswalk",
    publisher: "NCES / U.S. Bureau of Labor Statistics",
    status: "Approved · reference data",
    rights: "Official federal reference data",
    use: "Broad field-of-study to occupation exploration. Never treated as a guarantee of employment.",
    url: "https://nces.ed.gov/ipeds/cipcode/post3.aspx?y=56",
  },
  {
    name: "BLS OEWS",
    publisher: "U.S. Bureau of Labor Statistics",
    status: "Approved · reference data",
    rights: "Official federal statistical data",
    use: "Aggregate wage/employment context with geography and source period shown; never a personal salary prediction.",
    url: "https://www.bls.gov/oes/",
  },
];

const blockedSources = [
  {
    name: "CareerOneStop Web API",
    status: "Not used",
    reason: "Removed from this implementation after review of the click-license and web-service terms. Boasted chose College Scorecard + USAJOBS to reduce compliance burden and keep the product model simpler.",
  },
  {
    name: "Apify Scholarship Finder / CollegeScholarships.org scraper",
    status: "Blocked pending permission",
    reason: "A scraper subscription does not grant Boasted rights to copy the underlying CollegeScholarships.org database. No ingestion unless the original data owner gives explicit compatible permission.",
  },
  {
    name: "Parse.bot Scholarships.com wrapper",
    status: "Blocked",
    reason: "Third-party scraping/wrapping does not establish redistribution rights to the underlying Scholarships.com content.",
  },
  {
    name: "ScholarshipAPI",
    status: "Watch list",
    reason: "Promising integration product, but Boasted will not activate it until U.S. coverage and final commercial-use terms are verified for the intended storage/display behavior.",
  },
  {
    name: "NSPA Exchange",
    status: "Future licensed option",
    reason: "Potential large-scale scholarship source once Boasted has an active data-client agreement and the related membership/license cost is justified.",
  },
];

const auditEntries = [
  ["2026-09-07", "CareerOneStop removed", "After reviewing the full click license and web-service terms, Boasted removed CareerOneStop from the planned Programs/Internships architecture before production activation."],
  ["2026-09-07", "College Scorecard approved", "Selected as the official U.S. Department of Education source for live program/institution discovery."],
  ["2026-09-07", "USAJOBS approved", "Selected for live federal internship/student-trainee discovery using server-side API authentication and direct source links."],
  ["2026-09-07", "Scraper-based scholarship feeds rejected", "Apify/CollegeScholarships.org and Parse.bot/Scholarships.com were kept out because access to a scraper does not establish rights to republish the source database."],
  ["2026-09-07", "Scholarship catalog source gate hardened", "Open Scholarships import remains fail-closed on license identity, license URL, and required-attribution drift."],
  ["2026-09-07", "Permanent audit policy adopted", "Education source decisions are append-only in repository documentation/Git history. Runtime external-source access receipts are data-minimized and stored without a TTL or public delete route."],
];

export default function EducationDataPolicyPage() {
  useEffect(() => {
    document.title = "Education Data & Source Audit | Boasted";
  }, []);

  return <main className="education-data-policy">
    <header className="education-data-nav">
      <a href="/education"><ArrowLeft size={16}/> Education</a>
      <a className="education-data-brand" href="/">Boasted</a>
      <nav><a href="/docs/education">Education guide</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
    </header>

    <section className="education-data-hero">
      <div className="education-data-kicker"><ShieldCheck size={17}/> EDUCATION DATA & SOURCE AUDIT</div>
      <h1>What Boasted uses, why we can use it, <span>and what we refuse to copy.</span></h1>
      <p>This public transparency record documents the data sources used by Boasted Education, the rights basis we rely on, important safeguards, and sources we intentionally keep out when permission is unclear or the compliance burden does not fit the product.</p>
      <div className="education-data-badges"><span><FileClock size={16}/> Last reviewed: September 7, 2026</span><span><Database size={16}/> Append-only source history</span><span><LockKeyhole size={16}/> No API keys or private evidence published here</span></div>
    </section>

    <section className="education-data-principles">
      <article><ShieldCheck size={21}/><h2>Rights before scale</h2><p>A source is not approved just because a website is public or a scraper exists. Storage/display needs an actual rights basis.</p></article>
      <article><GraduationCap size={21}/><h2>Evidence stays separate</h2><p>Public datasets add context. Personal claims about a member still come from accomplishments and evidence the member saved.</p></article>
      <article><Database size={21}/><h2>Audit without oversharing</h2><p>Runtime access receipts exclude raw user search text, locations, private evidence, API credentials, and complete upstream records.</p></article>
    </section>

    <section className="education-data-section" id="approved">
      <div className="education-data-heading"><CheckCircle2 size={22}/><div><small>ACTIVE / APPROVED</small><h2>Sources currently allowed in Education</h2><p>Every source has a defined use and a documented rights basis. Source-specific attribution and limitations still apply.</p></div></div>
      <div className="education-data-source-grid">{approvedSources.map((source) => <article key={source.name}><div className="education-data-source-top"><span>{source.status}</span><Landmark size={18}/></div><h3>{source.name}</h3><small>{source.publisher}</small><dl><div><dt>Rights basis</dt><dd>{source.rights}</dd></div><div><dt>Boasted use</dt><dd>{source.use}</dd></div></dl><a href={source.url} target="_blank" rel="noreferrer noopener">Official/source page <ExternalLink size={14}/></a></article>)}</div>
    </section>

    <section className="education-data-section education-data-blocked" id="blocked">
      <div className="education-data-heading"><Ban size={22}/><div><small>NOT ACTIVE</small><h2>Sources Boasted deliberately does not ingest</h2><p>This list is part of the audit trail. “No” is sometimes the most useful compliance decision.</p></div></div>
      <div className="education-data-blocked-grid">{blockedSources.map((source) => <article key={source.name}><span>{source.status}</span><h3>{source.name}</h3><p>{source.reason}</p></article>)}</div>
    </section>

    <section className="education-data-section" id="audit">
      <div className="education-data-heading"><Clock3 size={22}/><div><small>CHANGE HISTORY</small><h2>Permanent source-decision audit</h2><p>New decisions should be appended rather than silently rewriting history. The repository version of this policy is preserved by Git commit history.</p></div></div>
      <div className="education-data-timeline">{auditEntries.map(([date, title, text]) => <article key={`${date}-${title}`}><time>{date}</time><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>

    <section className="education-data-section education-data-runtime">
      <div className="education-data-heading"><Database size={22}/><div><small>RUNTIME RECEIPTS</small><h2>External API access also leaves a compliance receipt.</h2></div></div>
      <p>For College Scorecard and USAJOBS calls, Boasted records a data-minimized internal event containing the source, operation, timestamp, outcome, HTTP status, result count, and safeguards. The collection has no TTL and no public delete endpoint. It intentionally does <strong>not</strong> record private member evidence, raw search queries/locations, API credentials, or full upstream result records.</p>
      <div className="education-data-runtime-rule"><LockKeyhole size={18}/><span>This public page is transparency documentation, not a promise that third-party services will never change their terms. Boasted re-reviews a source when material terms, licensing, or interfaces change.</span></div>
    </section>

    <section className="education-data-cta">
      <ShieldCheck size={27}/><h2>Legal clarity beats a bigger scraped database.</h2><p>Boasted would rather ship fewer clearly reusable records than build a commercial product on data rights we cannot explain.</p><div><a href="/docs/education">Read the Education guide <ArrowRight size={16}/></a><a href="/education">Back to Education</a></div>
    </section>
  </main>;
}
