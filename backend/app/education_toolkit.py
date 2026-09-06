"""Evidence-backed Education toolkit for Boasted.

The toolkit turns the Education hub into a set of real, auditable workflows rather
than a collection of links. Every output is derived from the member's saved
accomplishments and Impact Receipts. Public career/education sources are exposed
as provenance and exploration references; they are never used to manufacture
personal claims or outcome predictions.
"""
from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Iterable

EDUCATION_TOOLKIT_VERSION = "education-toolkit-v2"
MAX_EVIDENCE = 8
MAX_GAPS = 5

EDUCATION_ENTRY_TYPES = {
    "High School",
    "College / University",
    "Learning / Certification",
}

QUANTIFIED_PATTERN = re.compile(
    r"(?:\$\s?\d|\b\d+(?:\.\d+)?\s?(?:%|x)(?!\w)|"
    r"\b\d+(?:\.\d+)?\s?(?:hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?|"
    r"people|students?|members?|participants?|attendees?|volunteers?|projects?|awards?|"
    r"events?|dollars?|courses?|credits?)\b)",
    re.IGNORECASE,
)

SOURCE_REGISTRY = [
    {
        "id": "onet-31",
        "name": "O*NET 31.0 Database",
        "publisher": "U.S. Department of Labor, Employment and Training Administration",
        "version": "31.0 (August 2026)",
        "url": "https://www.onetcenter.org/database.html",
        "license": "CC BY 4.0",
        "use": "Occupation, skill, knowledge, work-activity, and education/training reference taxonomy.",
        "runtime": "reference",
    },
    {
        "id": "nces-cip-soc",
        "name": "NCES 2020 CIP-SOC Crosswalk",
        "publisher": "National Center for Education Statistics and U.S. Bureau of Labor Statistics",
        "version": "2020 CIP to 2018 SOC",
        "url": "https://nces.ed.gov/ipeds/cipcode/post3.aspx?y=56",
        "license": "U.S. federal public data",
        "use": "Relates instructional programs to occupations for broad education/career exploration.",
        "runtime": "reference",
    },
    {
        "id": "bls-oews-2025",
        "name": "BLS Occupational Employment and Wage Statistics",
        "publisher": "U.S. Bureau of Labor Statistics",
        "version": "May 2025 estimates (released May 2026)",
        "url": "https://www.bls.gov/oes/tables.htm",
        "license": "U.S. federal public data",
        "use": "Occupation-level employment and wage context; never a personal salary prediction.",
        "runtime": "reference",
    },
    {
        "id": "college-scorecard",
        "name": "College Scorecard",
        "publisher": "U.S. Department of Education",
        "version": "Public dataset",
        "url": "https://collegescorecard.ed.gov/data/",
        "license": "CC BY 4.0 dataset catalog terms",
        "use": "Optional institution/program context and aggregate outcomes with documented cohort limitations.",
        "runtime": "reference",
    },
    {
        "id": "careeronestop",
        "name": "CareerOneStop Web API",
        "publisher": "U.S. Department of Labor",
        "version": "Current API",
        "url": "https://api.careeronestop.org/api-explorer/",
        "license": "Public API; token required",
        "use": "Optional future live skills-gap, occupation, training, salary, and tools/technology enrichment.",
        "runtime": "optional-adapter",
    },
]

SKILL_TAXONOMY = {
    "Research": ["research", "investigat", "literature review", "experiment", "study"],
    "Data analysis": ["data", "analysis", "analyz", "statistics", "spreadsheet", "excel", "sql"],
    "Programming": ["program", "coding", "coded", "python", "javascript", "java", "software", "api"],
    "Technical problem solving": ["troubleshoot", "debug", "problem solv", "diagnos", "root cause", "technical"],
    "Communication": ["communicat", "explained", "wrote", "writing", "present", "presentation", "briefed"],
    "Collaboration": ["team", "collaborat", "partnered", "group", "peer", "stakeholder"],
    "Leadership": ["led", "leadership", "captain", "president", "mentor", "organized", "coordinated"],
    "Project management": ["project", "planned", "schedule", "milestone", "organized", "deliverable", "coordinated"],
    "Design": ["design", "prototype", "wireframe", "creative", "visual", "ux", "ui"],
    "Teaching & mentoring": ["teach", "taught", "tutor", "mentor", "coached", "trained", "instruction"],
    "Service & support": ["service", "support", "customer", "client", "patient", "community", "volunteer"],
    "Documentation": ["document", "report", "procedure", "guide", "manual", "record"],
}

CAREER_DIRECTIONS = [
    {
        "id": "technology-data",
        "title": "Technology & data",
        "skills": {"Programming", "Data analysis", "Technical problem solving", "Documentation"},
        "examples": ["Software development", "Data analysis", "IT and platform operations", "Cybersecurity support"],
    },
    {
        "id": "research-engineering",
        "title": "Research & engineering",
        "skills": {"Research", "Data analysis", "Technical problem solving", "Design"},
        "examples": ["Research assistance", "Engineering support", "Laboratory work", "Quality and testing"],
    },
    {
        "id": "business-operations",
        "title": "Business & operations",
        "skills": {"Project management", "Communication", "Data analysis", "Collaboration", "Documentation"},
        "examples": ["Operations", "Project coordination", "Business analysis", "Program support"],
    },
    {
        "id": "education-community",
        "title": "Education & community impact",
        "skills": {"Teaching & mentoring", "Communication", "Leadership", "Service & support", "Collaboration"},
        "examples": ["Education support", "Training", "Community programs", "Student services"],
    },
    {
        "id": "health-service",
        "title": "Health & human services",
        "skills": {"Service & support", "Communication", "Collaboration", "Research", "Documentation"},
        "examples": ["Healthcare support", "Public health programs", "Human services", "Care coordination"],
    },
    {
        "id": "communication-design",
        "title": "Communication & design",
        "skills": {"Communication", "Design", "Project management", "Collaboration", "Research"},
        "examples": ["Communications", "Content and media", "Design support", "Marketing coordination"],
    },
]

TOOL_PROFILES = {
    "education-profile": {
        "title": "My Education",
        "mode": "capture",
        "categories": set(),
        "terms": ["degree", "program", "school", "college", "university", "training", "education"],
        "primary_action": {"label": "Add education milestone", "href": "/app/accomplishments?create=1&education_feature=education"},
        "prompts": [
            "What program, school, credential, or learning milestone was this?",
            "What did you complete, contribute, or learn that is worth remembering?",
            "What date, scope, result, or proof would make the record useful later?",
        ],
    },
    "coursework": {
        "title": "Coursework",
        "mode": "capture",
        "categories": {"Coursework"},
        "terms": ["course", "class", "lab", "assignment", "semester", "curriculum"],
        "primary_action": {"label": "Add coursework", "href": "/app/accomplishments?create=1&education_feature=coursework"},
        "prompts": [
            "Which course, lab, or assignment best demonstrates something you can now do?",
            "What did you personally create, analyze, solve, present, or learn?",
            "Which tools, methods, or professional skills did the work require?",
        ],
    },
    "academic-projects": {
        "title": "Academic Projects",
        "mode": "capture",
        "categories": {"Academic Project", "Capstone / Thesis", "Research"},
        "terms": ["project", "capstone", "thesis", "research", "prototype", "presentation", "lab"],
        "primary_action": {"label": "Add academic project", "href": "/app/accomplishments?create=1&education_feature=academic-projects"},
        "prompts": [
            "What problem or question did the project address?",
            "What was your own contribution, especially if this was team work?",
            "What artifact, result, presentation, metric, or feedback can support the claim?",
        ],
    },
    "certifications": {
        "title": "Certifications & Training",
        "mode": "capture",
        "categories": {"Certification / Course"},
        "terms": ["certification", "certificate", "license", "bootcamp", "training", "credential"],
        "primary_action": {"label": "Add certification or training", "href": "/app/accomplishments?create=1&education_feature=certifications"},
        "prompts": [
            "What credential or training did you complete and who issued it?",
            "When did you earn it, and does it have an expiration or renewal date you should remember?",
            "What knowledge or hands-on skill did you actually demonstrate?",
        ],
    },
    "academic-achievements": {
        "title": "Academic Achievements",
        "mode": "capture",
        "categories": {"Academic Achievement", "Award / Honor", "STEM / Competition"},
        "terms": ["award", "honor", "scholarship", "recognition", "competition", "dean", "achievement"],
        "primary_action": {"label": "Add academic achievement", "href": "/app/accomplishments?create=1&education_feature=achievements"},
        "prompts": [
            "What was the recognition and what organization awarded it?",
            "What did you do to earn it, rather than recording only the title?",
            "If selection criteria or ranking is known and safe to share, capture it accurately.",
        ],
    },
    "group-projects": {
        "title": "Group Project Contributions",
        "mode": "capture",
        "categories": {"Academic Project", "Capstone / Thesis", "Research"},
        "terms": ["team", "group", "collaborat", "partner", "project", "capstone"],
        "primary_action": {"label": "Add group contribution", "href": "/app/accomplishments?create=1&education_feature=group-projects"},
        "prompts": [
            "What was the team responsible for delivering?",
            "What did you personally own, decide, build, research, organize, or present?",
            "What team result can you describe without taking credit for other people's work?",
        ],
    },
    "graduation-progress": {
        "title": "Graduation Progress",
        "mode": "capture",
        "categories": {"Academic Milestone", "Capstone / Thesis"},
        "terms": ["graduat", "milestone", "practicum", "capstone", "requirement", "credits", "completed"],
        "primary_action": {"label": "Add progress milestone", "href": "/app/accomplishments?create=1&education_feature=graduation-progress"},
        "prompts": [
            "Which meaningful requirement, practicum, capstone, or program phase did you complete?",
            "What work or capability did that milestone require?",
            "Record only progress you can verify; Boasted does not predict graduation.",
        ],
    },
    "experience-translator": {
        "title": "Experience Translator",
        "mode": "translate",
        "categories": set(),
        "terms": ["class", "course", "research", "club", "service", "training", "project", "volunteer"],
        "primary_action": {"label": "Add an experience", "href": "/app/accomplishments?create=1&education_feature=experience-translator"},
        "prompts": [
            "Start with what you actually did—not a job title you never held.",
            "Name the transferable skills supported by the work and point back to the evidence.",
            "Use career language only when it remains an accurate description of the original experience.",
        ],
    },
    "impact-receipts": {
        "title": "Education Impact Receipts",
        "mode": "proof",
        "categories": set(),
        "terms": [],
        "primary_action": {"label": "Open Impact Receipts", "href": "/app/impact-receipts"},
        "prompts": [
            "Which education accomplishments would benefit most from supporting evidence?",
            "Can a result be quantified accurately, or is a qualitative result more honest?",
            "Only ask someone to confirm work they genuinely know enough to confirm.",
        ],
    },
    "education-skills": {
        "title": "Skills from Education",
        "mode": "skills",
        "categories": set(),
        "terms": [],
        "primary_action": {"label": "Open Career Intelligence", "href": "/app/intelligence"},
        "prompts": [
            "Skills appear only when your saved evidence contains a supporting signal.",
            "Multiple examples strengthen a signal; a single keyword is not treated as mastery.",
            "Add context to vague records so future skill evidence is easier to understand.",
        ],
    },
    "career-match": {
        "title": "Career Match & Skill Gaps",
        "mode": "career",
        "categories": set(),
        "terms": [],
        "primary_action": {"label": "Open Career Intelligence", "href": "/app/intelligence"},
        "prompts": [
            "Compare demonstrated skills with a role you are curious about; do not treat the result as a hiring score.",
            "A gap means your saved record does not show the skill clearly—it does not prove you lack the skill.",
            "Use official occupation descriptions and a real job posting to validate what matters for a specific goal.",
        ],
    },
    "resume-builder": {
        "title": "Résumé Builder",
        "mode": "reuse",
        "categories": set(),
        "terms": [],
        "primary_action": {"label": "Open Résumé Builder", "href": "/app/resume-builder"},
        "prompts": [
            "Prioritize records with clear action, scope, result, skills, and evidence.",
            "Coursework belongs on a résumé when it supports the role; it should not crowd out stronger experience.",
            "Keep every generated bullet traceable to what you actually saved and correct anything that is off.",
        ],
    },
    "interview-prep": {
        "title": "Interview Prep",
        "mode": "reuse",
        "categories": set(),
        "terms": [],
        "primary_action": {"label": "Practice interview answers", "href": "/app/interview-practice"},
        "prompts": [
            "Choose examples where you can explain the situation, your own action, the result, and what you learned.",
            "For group work, be precise about the boundary between the team result and your contribution.",
            "Practice from evidence; do not memorize an embellished story.",
        ],
    },
    "academic-portfolio": {
        "title": "Academic Portfolio",
        "mode": "portfolio",
        "categories": set(),
        "terms": [],
        "primary_action": {"label": "Open Profile", "href": "/app/profile"},
        "prompts": [
            "Choose only the education evidence you intentionally want public.",
            "Strong portfolio records explain your contribution and point to safe artifacts or proof.",
            "Keep private records private; the toolkit never changes visibility automatically.",
        ],
    },
    "career-paths": {
        "title": "Career Path Explorer",
        "mode": "career",
        "categories": set(),
        "terms": [],
        "primary_action": {"label": "Open Career Intelligence", "href": "/app/intelligence"},
        "prompts": [
            "Explore directions supported by demonstrated skills, then check official occupation information.",
            "The order is an evidence-exploration aid—not a fit percentage, aptitude test, or 'best career' verdict.",
            "A broad direction can be useful even when your eventual job title is not listed.",
        ],
    },
}


def _text(value) -> str:
    return str(value or "").strip()


def _entry_id(entry: dict) -> str:
    return _text(entry.get("_id") or entry.get("id"))


def _searchable(entry: dict) -> str:
    values = [
        entry.get("title"), entry.get("category"), entry.get("entry_type"),
        entry.get("situation"), entry.get("action"), entry.get("impact"),
        entry.get("lesson"), entry.get("resume_bullet"), *(entry.get("tags") or []),
    ]
    return " ".join(_text(value) for value in values if _text(value)).casefold()


def _education_entries(entries: Iterable[dict]) -> list[dict]:
    entries = list(entries)
    explicit = [entry for entry in entries if _text(entry.get("entry_type")) in EDUCATION_ENTRY_TYPES]
    education_categories = {
        "Academic Achievement", "Coursework", "Academic Project", "Capstone / Thesis",
        "Academic Milestone", "Award / Honor", "Research", "STEM / Competition",
        "Certification / Course", "Special Program", "Extracurricular Activity",
        "Community Service",
    }
    ids = {_entry_id(entry) for entry in explicit}
    inferred = [entry for entry in entries if _entry_id(entry) not in ids and _text(entry.get("category")) in education_categories]
    return explicit + inferred


def _receipt_state(receipts: Iterable[dict]) -> dict[str, dict]:
    state: dict[str, dict] = defaultdict(lambda: {
        "receipt_count": 0,
        "evidence_items": 0,
        "confirmations": 0,
        "has_metrics": False,
    })
    for receipt in receipts:
        source_id = _text(receipt.get("source_entry_id"))
        if not source_id:
            continue
        item = state[source_id]
        item["receipt_count"] += 1
        item["evidence_items"] += len(receipt.get("evidence") or [])
        item["confirmations"] += sum(
            1 for confirmation in receipt.get("confirmations") or []
            if confirmation.get("status") == "confirmed"
        )
        item["has_metrics"] = bool(item["has_metrics"] or receipt.get("metrics"))
    return state


def _quality(entry: dict, linked: dict) -> dict:
    missing = []
    if not _text(entry.get("situation")):
        missing.append("context")
    if not _text(entry.get("action")):
        missing.append("your contribution")
    if not _text(entry.get("impact")):
        missing.append("result or outcome")
    if not _text(entry.get("lesson")):
        missing.append("learning or reflection")
    if not entry.get("tags"):
        missing.append("skills/tags")
    has_measure = bool(QUANTIFIED_PATTERN.search(_searchable(entry)) or linked.get("has_metrics"))
    support = "well-supported" if linked.get("evidence_items") and linked.get("confirmations") else (
        "supported" if linked.get("evidence_items") or linked.get("confirmations") else "saved-record"
    )
    return {
        "missing_details": missing[:4],
        "has_measurable_detail": has_measure,
        "support_level": support,
        "has_evidence": bool(linked.get("evidence_items")),
        "has_confirmation": bool(linked.get("confirmations")),
    }


def _rank_entries(entries: list[dict], receipts: dict[str, dict], profile: dict) -> list[dict]:
    ranked = []
    categories = profile.get("categories") or set()
    terms = [term.casefold() for term in profile.get("terms") or []]
    for entry in entries:
        text = _searchable(entry)
        category = _text(entry.get("category"))
        linked = receipts.get(_entry_id(entry), {})
        quality = _quality(entry, linked)
        points = 8
        reasons = []
        if categories and category in categories:
            points += 24
            reasons.append(f"Saved as {category}")
        term_hits = [term for term in terms if term in text]
        if term_hits:
            points += min(len(term_hits), 4) * 5
            reasons.append("Contains details relevant to this Education tool")
        if _text(entry.get("action")):
            points += 8
            reasons.append("Your contribution is described")
        if _text(entry.get("impact")):
            points += 8
        if quality["has_measurable_detail"]:
            points += 6
            reasons.append("Includes measurable scope or result")
        if quality["has_evidence"]:
            points += 7
            reasons.append("Has supporting evidence")
        if quality["has_confirmation"]:
            points += 5
            reasons.append("Has confirmation")
        ranked.append({
            "entry_id": _entry_id(entry),
            "title": _text(entry.get("title")) or "Untitled accomplishment",
            "category": category or "Uncategorized",
            "entry_type": _text(entry.get("entry_type")) or "Other",
            "entry_date": _text(entry.get("entry_date")),
            "is_public": bool(entry.get("is_public")),
            "reasons": reasons[:4] or ["Saved education evidence available for review"],
            **quality,
            "_points": points,
        })
    ranked.sort(key=lambda item: (item["_points"], item["title"].casefold()), reverse=True)
    for item in ranked:
        item.pop("_points", None)
    return ranked[:MAX_EVIDENCE]


def _skill_signals(entries: list[dict]) -> list[dict]:
    signals = []
    for skill, aliases in SKILL_TAXONOMY.items():
        matched_ids = []
        matched_titles = []
        for entry in entries:
            text = _searchable(entry)
            if any(alias.casefold() in text for alias in aliases):
                matched_ids.append(_entry_id(entry))
                matched_titles.append(_text(entry.get("title")) or "Untitled accomplishment")
        if matched_ids:
            signals.append({
                "skill": skill,
                "demonstrations": len(matched_ids),
                "evidence_entry_ids": matched_ids[:5],
                "evidence_titles": matched_titles[:3],
                "signal": "supported" if len(matched_ids) >= 2 else "emerging",
            })
    signals.sort(key=lambda item: (item["demonstrations"], item["skill"]), reverse=True)
    return signals


def _career_directions(skill_signals: list[dict]) -> list[dict]:
    demonstrated = {item["skill"] for item in skill_signals}
    directions = []
    for direction in CAREER_DIRECTIONS:
        matched = sorted(demonstrated & direction["skills"])
        if not matched:
            continue
        directions.append({
            "id": direction["id"],
            "title": direction["title"],
            "demonstrated_skills": matched,
            "example_work_areas": direction["examples"],
            "evidence_signal_count": len(matched),
            "meaning": "Broad direction to explore from saved evidence; not a fit score or employment prediction.",
        })
    directions.sort(key=lambda item: (item["evidence_signal_count"], item["title"]), reverse=True)
    return directions[:6]


def _gaps(recommended: list[dict], tool_id: str) -> list[dict]:
    gaps = []
    if not recommended:
        return [{
            "label": "No matching education evidence yet",
            "detail": "Your saved record does not yet contain education evidence this tool can use.",
            "action": "Capture one real learning experience, project, credential, milestone, or contribution.",
        }]
    missing_counter = Counter(detail for item in recommended for detail in item.get("missing_details") or [])
    for detail, count in missing_counter.most_common(MAX_GAPS):
        gaps.append({
            "label": f"Strengthen {detail}",
            "detail": f"{count} of the strongest records shown here could use clearer {detail}.",
            "action": f"Edit the original record only if you can add accurate {detail} from what really happened.",
        })
    if tool_id == "impact-receipts":
        unsupported = sum(1 for item in recommended if not item.get("has_evidence"))
        if unsupported:
            gaps.insert(0, {
                "label": "Supporting evidence",
                "detail": f"{unsupported} highlighted education record(s) do not yet have supporting evidence attached through an Impact Receipt.",
                "action": "Add only evidence you are allowed to retain and share.",
            })
    if tool_id == "academic-portfolio":
        private_count = sum(1 for item in recommended if not item.get("is_public"))
        if private_count:
            gaps.insert(0, {
                "label": "Private records",
                "detail": f"{private_count} highlighted record(s) are private. Boasted will not publish them automatically.",
                "action": "Review each record and choose visibility yourself only when you are comfortable sharing it.",
            })
    return gaps[:MAX_GAPS]


def build_education_toolkit(entries: Iterable[dict], receipts: Iterable[dict], tool_id: str) -> dict:
    """Build one Education tool from the member's saved evidence."""
    if tool_id not in TOOL_PROFILES:
        raise ValueError(f"Unsupported Education tool: {tool_id}")

    all_entries = list(entries)
    all_receipts = list(receipts)
    education_entries = _education_entries(all_entries)
    receipts_by_entry = _receipt_state(all_receipts)
    profile = TOOL_PROFILES[tool_id]
    ranked = _rank_entries(education_entries, receipts_by_entry, profile)
    skills = _skill_signals(education_entries)
    directions = _career_directions(skills)

    evidence_with_receipts = sum(1 for entry in education_entries if receipts_by_entry.get(_entry_id(entry), {}).get("receipt_count"))
    public_entries = sum(1 for entry in education_entries if entry.get("is_public"))

    secondary_actions = []
    if tool_id in {"coursework", "academic-projects", "group-projects", "experience-translator"}:
        secondary_actions.append({"label": "See skills from education", "tool_id": "education-skills"})
    if tool_id in {"education-skills", "career-match", "career-paths"}:
        secondary_actions.append({"label": "Build résumé evidence", "tool_id": "resume-builder"})
    if tool_id in {"resume-builder", "interview-prep", "academic-portfolio"}:
        secondary_actions.append({"label": "Strengthen proof", "tool_id": "impact-receipts"})

    return {
        "tool": {
            "id": tool_id,
            "title": profile["title"],
            "mode": profile["mode"],
            "prompts": profile["prompts"],
            "primary_action": profile["primary_action"],
            "secondary_actions": secondary_actions,
        },
        "summary": {
            "education_records": len(education_entries),
            "matching_records": len(ranked),
            "records_with_impact_receipts": evidence_with_receipts,
            "public_records": public_entries,
            "demonstrated_skill_signals": len(skills),
            "career_directions_to_explore": len(directions),
        },
        "recommended_evidence": ranked,
        "gaps": _gaps(ranked, tool_id),
        "skill_signals": skills[:12] if profile["mode"] in {"skills", "career", "translate", "reuse"} else [],
        "career_directions": directions if profile["mode"] == "career" else [],
        "sources": SOURCE_REGISTRY if profile["mode"] == "career" else SOURCE_REGISTRY[:2],
        "methodology": {
            "version": EDUCATION_TOOLKIT_VERSION,
            "deterministic": True,
            "evidence_mode": "member-saved-proof-only",
            "external_sources_are_personal_evidence": False,
            "fit_percentage": False,
            "best_major_claim": False,
            "best_career_claim": False,
            "admissions_prediction": False,
            "scholarship_prediction": False,
            "graduation_prediction": False,
            "employment_prediction": False,
            "salary_prediction": False,
            "employment_decision": False,
            "description": (
                "Ranks and organizes the member's own Education evidence. Public sources provide occupation and "
                "education taxonomy context only; they do not create personal claims or predict outcomes."
            ),
        },
    }
