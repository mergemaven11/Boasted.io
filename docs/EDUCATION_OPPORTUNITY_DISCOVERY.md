# Education Opportunity Discovery

Boasted Education helps a member discover scholarships, postsecondary programs, and federal internships while keeping two things separate:

1. **Personal evidence** comes only from accomplishments and Impact Receipts the member saved in Boasted.
2. **Opportunity data** comes only from first-party submissions or public/API sources whose terms permit the intended use.

Boasted does not scrape proprietary scholarship/job aggregators, copy competitor rankings, or manufacture a personal "fit score." Search suggestions are evidence-connected starting points, not predictions of selection, admission, hiring, salary, graduation, or success.

For the append-only source decision history, see `docs/EDUCATION_SOURCE_AUDIT.md` and the public `/legal/education-data` page.

## Scholarships

### Open Scholarships — approved seed source

- Project: Open Scholarships by Grudged LLC
- Data feed: `https://scholarships.grudged.io/scholarships.json`
- Data license: **CC BY 4.0**
- Required attribution: stored with every imported record and displayed in Scholarship Finder
- Rights basis stored in MongoDB: `open_license`
- Import policy: fail closed if the upstream feed stops identifying itself as the approved CC BY 4.0 source or changes/removes the approved attribution/license metadata

The source is Nevada-first and also contains national opportunities. This is intentionally conservative: Boasted prefers a smaller catalog with a documented right to store/display it over a larger catalog copied from a proprietary scholarship service.

### Provider-submitted scholarships

Providers can submit a scholarship directly to Boasted. A submission is stored as `pending_review`; it is **never auto-published**.

The provider must attest that they are authorized to provide the scholarship information and allow Boasted to store/display it. Review should verify at least:

- provider identity and official domain;
- official scholarship/application URL;
- award amount and deadline;
- eligibility language;
- duplicate/reused listings;
- suspicious fees or misleading promises;
- whether the current cycle is actually open.

### Freshness and expiration

The scholarship adapter records provenance, source verification time, import time, license ID, rights basis, and lifecycle status.

Normal search returns `active` records. Fixed deadlines that pass are soft-expired; source records that disappear are archived rather than hard-deleted. Rolling/upcoming records are not assigned invented expiration dates.

The adapter treats a successful sync as fresh for **7 days**. A free GitHub Actions workflow performs:

- daily deadline expiration cleanup;
- weekly licensed-source refresh;
- manual `sync` / `expire` workflow dispatch when needed.

The workflow requires only the repository Actions secret `MONGO_URL` pointing to production MongoDB.

## Programs

### College Scorecard

Boasted uses the U.S. Department of Education **College Scorecard** API for live institution and field-of-study/program discovery.

Required server configuration:

```text
COLLEGE_SCORECARD_API_KEY=<free api.data.gov API key>
```

The key remains server-side.

Program Finder:

- takes a member-controlled career/subject phrase;
- can start from an evidence-connected search suggestion from Education Intelligence;
- requires a U.S. state or city + state (for example `Atlanta, GA`);
- queries currently operating schools through College Scorecard;
- locally filters returned field-of-study/program titles using transparent search terms;
- shows source institution/program details and limited aggregate context such as student size or average net price when available.

Boasted does **not** turn Scorecard aggregates into a personal cost, salary, admission, completion, or graduation prediction. Program matching is discovery help, not ranking.

## Internships

### USAJOBS

Boasted uses the **USAJOBS** Search API for live federal internship and student-trainee discovery.

Required server configuration:

```text
USAJOBS_API_KEY=<USAJOBS API key>
USAJOBS_USER_AGENT=<email address used to request the key>
```

The browser never receives either value.

Internship Finder:

- starts from a member-controlled career/skill phrase, optionally suggested from saved evidence;
- sends only the final career term + location/radius needed for the public USAJOBS search;
- keeps the returned USAJOBS source fields separate from Boasted annotations;
- only displays records containing an explicit `intern` or `student trainee` signal;
- links users back to the USAJOBS listing.

Boasted does not predict qualification, hiring, selection, or likelihood of success.

## Volunteer opportunities

Volunteer.gov is linked as an official federal volunteer resource. Boasted does **not** scrape or copy its listings because an approved ingestion path was not identified for this implementation.

A useful official link is better than turning public pages into an unlicensed local database.

## How Education Intelligence participates

Boasted runs the member's saved evidence through the existing deterministic `career-paths` Education Toolkit. It produces broad career-direction examples and demonstrated skill signals. Those become optional search suggestions:

```text
saved evidence -> demonstrated skills -> broad direction -> editable search phrase
```

The member can replace the phrase and location before searching. The system does not calculate a fit percentage or declare a "best" program, scholarship, or internship.

## Permanent source audit

Two complementary audit layers are maintained:

1. `docs/EDUCATION_SOURCE_AUDIT.md` is append-only policy history preserved by Git.
2. `education_source_audit_events` records data-minimized runtime access receipts for live College Scorecard and USAJOBS calls.

Runtime audit receipts contain source, operation, timestamp, outcome, HTTP status, result count, and safeguards. They intentionally exclude:

- raw member evidence;
- raw search query/location;
- API keys/credentials;
- full upstream result records.

The runtime audit collection is designed without a TTL and has no public delete endpoint.

## Sources deliberately not active

### CareerOneStop

CareerOneStop was removed from the planned Program/Internship architecture before production activation after review of the full click-license and web-service terms. College Scorecard + USAJOBS provide a simpler compliance model for these features.

### Scraper-based scholarship feeds

Boasted does not ingest Apify/CollegeScholarships.org or Parse.bot/Scholarships.com merely because a scraper/wrapper exists. Access to a scraper does not itself establish rights to commercially republish the underlying database or authored content.

### ScholarshipAPI / NSPA Exchange

- ScholarshipAPI remains a watch-list source until U.S. coverage and binding commercial-use terms are verified for Boasted's intended behavior.
- NSPA Exchange remains a future licensed option once a valid data-client agreement and associated cost make sense for the business.

## Privacy and safety invariants

- Profile location is only a convenience default. The member can replace it before searching.
- Opportunity APIs do not receive raw private accomplishments, Impact Receipts, or essay text.
- No scholarship, program, or internship is presented as guaranteed, best, or statistically matched to the member.
- Opportunity source metadata and rights basis stay visible/auditable.
- New sources require licensing/data-use review before storage or redistribution.
- External API failures never erase or block access to the member's saved evidence.

## Source expansion policy

A new source may be added only when its intended use fits one of these categories:

- first-party provider submission with publication rights;
- U.S. government/open-data source whose terms permit the intended use;
- explicit open license compatible with storage/display, with required attribution implemented;
- paid/licensed feed after a valid agreement is in place.

`Publicly viewable` is **not** itself a rights basis.
