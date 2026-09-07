# Education Opportunity Discovery

Boasted Education can help a student discover scholarships, nearby training/support programs, and current internship listings while keeping two things separate:

1. **The student's evidence** comes only from accomplishments and Impact Receipts the member actually saved in Boasted.
2. **Opportunity data** comes only from first-party provider submissions or public/API sources whose terms permit the way Boasted uses them.

Boasted does not scrape proprietary scholarship/job aggregators, copy competitor rankings, or manufacture a personal "fit score." Search suggestions are evidence-connected starting points, not predictions of selection, admission, hiring, salary, graduation, or success.

## Scholarships

### Open Scholarships — approved seed source

- Project: Open Scholarships by Grudged LLC
- Data feed: `https://scholarships.grudged.io/scholarships.json`
- Data license: **CC BY 4.0**
- Required attribution: stored with every imported record and displayed in the Scholarship Finder source area
- Rights basis stored in MongoDB: `open_license`
- Import policy: fail closed if the upstream feed stops identifying itself as the approved CC BY 4.0 source or removes the required attribution metadata

The source is currently Nevada-first and also contains national opportunities. This is an intentionally conservative initial source: Boasted prefers a smaller catalog with a documented right to store/display it over a larger catalog copied from a proprietary scholarship service.

### Provider-submitted scholarships

Providers can submit a scholarship directly to Boasted. A submission is stored as `pending_review`; it is **never auto-published**.

The provider must attest that they are authorized to provide the scholarship information and allow Boasted to store/display the listing. Review should verify at least:

- provider identity and official domain;
- official scholarship/application URL;
- award amount and deadline;
- eligibility language;
- duplicate/reused listings;
- suspicious fees or misleading promises;
- whether the new cycle is actually open.

### Freshness and expiration

The scholarship adapter records source provenance, source verification time, import time, license ID, rights basis, and the current lifecycle status.

Normal search only returns `active` records. Fixed deadlines that pass are soft-expired; source records that disappear are archived rather than hard-deleted. Rolling/upcoming records are not assigned an invented expiration date.

The adapter treats a successful sync as fresh for **7 days**. The first catalog request seeds an empty database; later requests queue a refresh when the last successful sync is older than seven days. A protected `/scholarships/sync` route is also available for an operator or production scheduler to force a refresh.

> Deployment note: request-driven freshness is not a substitute for a production cron. Configure a weekly production scheduler to call the sync job/route if guaranteed calendar-based refreshes are required.

## Programs

### CareerOneStop Web API

Boasted uses the U.S. Department of Labor CareerOneStop Web API for live program discovery. CareerOneStop explicitly exposes career, employment, and education data for third-party sites and identifies its API datasets as open data under USDOL's Open Data Policy.

Required server configuration:

```text
CAREERONESTOP_USER_ID=<registered CareerOneStop API user id>
CAREERONESTOP_API_TOKEN=<server-side API token>
```

Never expose the token in the frontend bundle.

The program search uses:

- **Training Programs (v2)** for nearby education/training programs connected to the member's chosen career/skill term;
- **Youth Program Finder** on the first page for local free job, career, education, and training assistance programs.

Boasted does not infer a training program's price when CareerOneStop does not provide it. If the upstream data indicates an Eligible Training Provider/WIOA source, the UI says **funding may be available** rather than claiming the program is free.

### How Education Intelligence participates

Boasted runs the member's saved education proof through the existing deterministic `career-paths` Education Toolkit. It produces broad career-direction examples and demonstrated skill signals. Those become optional search suggestions, for example:

```text
Saved evidence -> demonstrated skills -> broad career direction -> search phrase
```

The member can edit or replace the phrase and location before searching. The system does not calculate a fit percentage or declare a "best program."

### Volunteer opportunities

Volunteer.gov is linked as an official federal volunteer-opportunity resource. Boasted does **not** scrape or copy its listings because an approved public opportunity API/data-use path was not identified for this implementation.

This is intentional: a useful link is better than turning publicly visible pages into an unlicensed local database.

## Internships

Boasted uses CareerOneStop's Job Search API rather than scraping an internship board.

The member's demonstrated skills/career directions provide the initial search phrase, and the member supplies/edits the location and radius. Boasted appends an internship term to the live search and then only displays returned records that themselves contain an explicit `intern`/`internship` signal in the title or supplied snippet.

This avoids silently relabeling ordinary jobs as internships.

Every result remains a current-source listing with a link back to the upstream listing. Boasted does not predict hiring or imply that evidence-connected search suggestions mean the student is qualified or likely to be selected.

## Privacy and safety invariants

- Profile location is only a convenience default for local search. The member may replace it before searching.
- Opportunity APIs do not receive the member's private accomplishments, Impact Receipts, or essay text. They receive the final search keyword/location needed to perform the public search.
- No scholarship, program, or internship is presented as guaranteed, best, or statistically matched to the member.
- Opportunity source metadata and rights basis stay visible/auditable.
- New sources require a licensing/data-use review before an adapter may store or redistribute their data.

## Source expansion policy

A new source may be added only when its use fits one of these categories:

- first-party provider submission with publication rights;
- U.S. government/open-data source whose terms permit the intended API/database use;
- explicit open license compatible with storage/display, with required attribution implemented;
- paid/licensed feed after a valid agreement is in place.

`Publicly viewable` is **not** itself a rights basis.
