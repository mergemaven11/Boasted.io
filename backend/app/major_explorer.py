"""Evidence-backed major exploration built on Boasted Career Intelligence v5.

Major Explorer is intentionally a decision-support tool, not a decision-maker.
It surfaces academic directions worth exploring from the user's own saved proof.
It does not predict admission, scholarships, graduation, employment, salary,
licensing, or career success, and it never claims that one major is objectively
"best" for the user.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from app.career_intelligence_graph import build_career_intelligence_v5

MAJOR_EXPLORER_VERSION = "major-explorer-v1"
MAX_RECOMMENDATIONS = 6

# Profiles are deliberately broad and deterministic. They connect demonstrated
# skills/domains to directions worth investigating; they are not occupational
# aptitude tests and are not intended to reproduce institutional requirements.
MAJOR_PROFILES: dict[str, dict] = {
    "computer-science": {
        "major": "Computer Science",
        "domains": {
            "Software Engineering": 4,
            "Backend Engineering": 3,
            "Frontend Engineering": 3,
            "Programming & Automation": 3,
            "Developer Tooling": 2,
            "Databases": 2,
        },
        "skills": {
            "Python": 4,
            "JavaScript": 4,
            "TypeScript": 3,
            "Java": 4,
            "C++": 4,
            "React": 2,
            "Node.js": 3,
            "FastAPI": 2,
            "SQL": 2,
            "Git": 2,
        },
        "keywords": (
            "programming",
            "coding",
            "algorithm",
            "software",
            "application",
            "computer science",
            "data structure",
        ),
        "exploration_question": "Do you enjoy both building software and learning the theory behind how computation works?",
        "next_experiments": (
            "Try one introductory algorithms or data-structures exercise and notice whether the theory is engaging.",
            "Build a small software project from scratch and compare how much you enjoy design, implementation, and debugging.",
        ),
        "unknowns": "Your saved proof cannot tell us by itself how much you would enjoy theory-heavy computing coursework, discrete math, or a particular program's curriculum.",
    },
    "information-systems": {
        "major": "Information Systems",
        "domains": {
            "Technical Operations": 4,
            "Systems Engineering": 4,
            "Developer Tooling": 3,
            "Databases": 3,
            "Platform Engineering": 3,
            "Software Engineering": 2,
        },
        "skills": {
            "SQL": 4,
            "Linux": 3,
            "Networking": 3,
            "Python": 2,
            "Git": 2,
            "PostgreSQL": 3,
            "MongoDB": 2,
            "Troubleshooting": 4,
        },
        "keywords": (
            "information systems",
            "business system",
            "workflow",
            "process",
            "operations",
            "database",
            "technology",
        ),
        "exploration_question": "Do you like using technology to improve how organizations, teams, and real-world processes work?",
        "next_experiments": (
            "Compare an introductory Information Systems course with a Computer Science course and note which problems feel more natural.",
            "Model a real workflow or small database and decide whether connecting people, process, and technology is satisfying.",
        ),
        "unknowns": "Your evidence does not establish whether you prefer business-process coursework, technical depth, or the specific balance offered by a school's Information Systems program.",
    },
    "computer-engineering": {
        "major": "Computer Engineering",
        "domains": {
            "Edge Computing": 4,
            "Systems Engineering": 4,
            "Software Engineering": 2,
            "Networking": 2,
            "Programming & Automation": 2,
        },
        "skills": {
            "Raspberry Pi": 5,
            "C": 4,
            "C++": 4,
            "Linux": 3,
            "Networking": 2,
            "Python": 2,
            "SSH": 2,
        },
        "keywords": (
            "embedded",
            "microcontroller",
            "hardware",
            "raspberry pi",
            "computer engineering",
            "electronics",
            "firmware",
        ),
        "exploration_question": "Do you enjoy problems where software meets physical hardware and electronics?",
        "next_experiments": (
            "Try a small embedded or microcontroller project that requires both code and basic electronics.",
            "Preview an introductory digital-logic or circuits lesson and compare it with a pure programming task.",
        ),
        "unknowns": "Your saved proof cannot determine whether you would enjoy calculus, circuits, digital logic, or the hardware-heavy parts of a Computer Engineering curriculum.",
    },
    "electrical-engineering": {
        "major": "Electrical Engineering",
        "domains": {
            "Edge Computing": 2,
            "Systems Engineering": 2,
            "Networking": 2,
        },
        "skills": {
            "Raspberry Pi": 2,
            "C": 2,
            "C++": 2,
        },
        "keywords": (
            "circuit",
            "electronics",
            "electrical",
            "signal",
            "sensor",
            "power",
            "microcontroller",
        ),
        "exploration_question": "Are you curious about circuits, signals, electronics, and how physical systems are designed?",
        "next_experiments": (
            "Complete a beginner circuit or sensor lab and note whether the physical troubleshooting is enjoyable.",
            "Review the math and physics prerequisites for one real Electrical Engineering program before treating this as a strong direction.",
        ),
        "unknowns": "Software or hardware tinkering alone is not enough to establish interest in Electrical Engineering's mathematics, physics, circuits, and signals coursework.",
    },
    "data-science-statistics": {
        "major": "Data Science / Statistics",
        "domains": {
            "Databases": 3,
            "Programming & Automation": 3,
            "Software Engineering": 2,
        },
        "skills": {
            "Python": 4,
            "SQL": 4,
            "PostgreSQL": 2,
            "MongoDB": 2,
            "R": 5,
        },
        "keywords": (
            "statistics",
            "statistical",
            "data analysis",
            "dataset",
            "analytics",
            "visualization",
            "machine learning",
            "probability",
        ),
        "exploration_question": "Do you enjoy turning messy data into explanations, models, or decisions?",
        "next_experiments": (
            "Analyze a public dataset and write down whether cleaning, exploring, and interpreting the data feels rewarding.",
            "Try a short probability or statistics lesson and compare that experience with ordinary programming.",
        ),
        "unknowns": "Programming evidence alone does not show whether you enjoy probability, statistics, mathematical modeling, or careful interpretation of uncertainty.",
    },
    "mathematics": {
        "major": "Mathematics",
        "domains": {},
        "skills": {},
        "keywords": (
            "mathematics",
            "math",
            "calculus",
            "algebra",
            "geometry",
            "proof",
            "theorem",
            "olympiad",
        ),
        "exploration_question": "Do you enjoy abstract reasoning and understanding why a result is true, not only applying a formula?",
        "next_experiments": (
            "Try one proof-based math exercise rather than only a computational worksheet.",
            "Look at the required courses for a real Mathematics major and identify which topics genuinely interest you.",
        ),
        "unknowns": "General quantitative ability or technical work does not establish that you would enjoy proof-based, abstract mathematics.",
    },
    "biology": {
        "major": "Biology",
        "domains": {},
        "skills": {},
        "keywords": (
            "biology",
            "biological",
            "genetics",
            "cell",
            "ecology",
            "anatomy",
            "physiology",
            "microbiology",
            "lab",
        ),
        "exploration_question": "Do you enjoy investigating living systems through observation, experimentation, and scientific evidence?",
        "next_experiments": (
            "Try a hands-on biology lab, field activity, or small research exercise and reflect on which part you enjoy most.",
            "Compare the course requirements for Biology with a neighboring field such as Chemistry, Neuroscience, or Environmental Science.",
        ),
        "unknowns": "A few science-related experiences cannot establish whether you would enjoy the breadth of laboratory, quantitative, and theory coursework in a Biology degree.",
    },
    "chemistry": {
        "major": "Chemistry",
        "domains": {},
        "skills": {},
        "keywords": (
            "chemistry",
            "chemical",
            "molecule",
            "reaction",
            "organic chemistry",
            "inorganic chemistry",
            "lab",
        ),
        "exploration_question": "Do you enjoy explaining matter and reactions at the molecular level and working carefully in laboratory settings?",
        "next_experiments": (
            "Try an introductory chemistry lab or problem set and note whether the combination of math, models, and experimentation is appealing.",
            "Review a real Chemistry curriculum, including organic and physical chemistry, before deciding this direction fits your interests.",
        ),
        "unknowns": "General science interest is not enough to predict whether you would enjoy Chemistry's laboratory workload, mathematics, and molecular theory.",
    },
    "psychology": {
        "major": "Psychology",
        "domains": {},
        "skills": {},
        "keywords": (
            "psychology",
            "behavior",
            "cognition",
            "mental",
            "human behavior",
            "research participant",
            "survey",
        ),
        "exploration_question": "Are you interested in studying human behavior and cognition using research methods rather than intuition alone?",
        "next_experiments": (
            "Read or summarize one peer-reviewed psychology study and see whether research design and evidence interest you.",
            "Preview an introductory statistics requirement, because research methods are a meaningful part of many Psychology programs.",
        ),
        "unknowns": "Enjoying people-oriented work does not by itself show that you would enjoy experimental methods, statistics, or the scientific study of behavior.",
    },
    "business-administration": {
        "major": "Business Administration",
        "domains": {
            "Technical Operations": 2,
        },
        "skills": {},
        "keywords": (
            "business",
            "leadership",
            "managed",
            "management",
            "entrepreneur",
            "customer",
            "marketing",
            "operations",
            "finance",
            "sales",
        ),
        "exploration_question": "Do you enjoy coordinating people, resources, customers, and decisions to make an organization work better?",
        "next_experiments": (
            "Take responsibility for a small real project with a budget, timeline, customers, or team coordination and reflect on which part you enjoy.",
            "Compare introductory management, accounting, marketing, and economics material before treating 'business' as one single kind of work.",
        ),
        "unknowns": "Leadership or project experience does not establish which business discipline—if any—you would prefer, and it does not predict business career outcomes.",
    },
    "communications": {
        "major": "Communications",
        "domains": {},
        "skills": {},
        "keywords": (
            "communication",
            "communications",
            "presentation",
            "presented",
            "public speaking",
            "media",
            "journalism",
            "writing",
            "campaign",
        ),
        "exploration_question": "Do you enjoy understanding audiences and shaping clear messages through writing, speaking, media, or research?",
        "next_experiments": (
            "Create the same message for two different audiences and notice whether adapting tone, structure, and medium is interesting.",
            "Compare coursework in Communications, Journalism, Public Relations, and Marketing because their emphases can differ substantially.",
        ),
        "unknowns": "Being a good presenter or writer does not determine whether you would enjoy communications theory, media research, or a specific professional pathway.",
    },
    "mechanical-engineering": {
        "major": "Mechanical Engineering",
        "domains": {},
        "skills": {},
        "keywords": (
            "mechanical",
            "cad",
            "design",
            "prototype",
            "robotics",
            "manufacturing",
            "thermodynamics",
            "mechanism",
        ),
        "exploration_question": "Do you enjoy designing, modeling, building, and testing physical systems and mechanisms?",
        "next_experiments": (
            "Try a simple CAD, mechanism, robotics, or physical prototyping project and reflect on whether iteration is enjoyable.",
            "Preview calculus, physics, statics, and thermodynamics requirements from a real Mechanical Engineering program.",
        ),
        "unknowns": "General building or maker experience does not establish interest in the math, physics, mechanics, and analysis required by Mechanical Engineering.",
    },
}


def _text(value) -> str:
    return str(value or "").strip()


def _entry_text(entry: dict) -> str:
    values = [
        entry.get("title"),
        entry.get("category"),
        entry.get("entry_type"),
        entry.get("situation"),
        entry.get("action"),
        entry.get("impact"),
        entry.get("lesson"),
        *(entry.get("tags") or []),
    ]
    return " ".join(_text(value) for value in values if _text(value)).casefold()


def _fit_label(*, points: int, distinct_signals: int, demonstrations: int) -> str:
    """Return a qualitative exploration label without fake percentage precision."""
    if points >= 24 and distinct_signals >= 3 and demonstrations >= 2:
        return "strong-exploration-candidate"
    if points >= 10 and distinct_signals >= 2:
        return "worth-exploring"
    return "possible-direction"


def _evidence_strength(*, distinct_signals: int, demonstrations: int) -> str:
    if distinct_signals >= 4 and demonstrations >= 3:
        return "supported"
    if distinct_signals >= 2 and demonstrations >= 2:
        return "developing"
    return "limited"


def build_major_explorer(
    entries: Iterable[dict],
    receipts: Iterable[dict],
) -> dict:
    """Return major directions worth exploring from user-owned evidence only."""
    entries = list(entries)
    receipts = list(receipts)
    career = build_career_intelligence_v5(entries, receipts)
    career_graph = career.get("career_graph") or {}

    skills = {
        _text(row.get("skill")): row
        for row in career.get("skills") or []
        if _text(row.get("skill"))
    }
    domains = {
        _text(row.get("domain")): row
        for row in career_graph.get("domains") or []
        if _text(row.get("domain"))
    }
    entry_texts = [_entry_text(entry) for entry in entries]
    distinct_demonstrations = int(
        (career.get("summary") or {}).get("distinct_demonstrations") or 0
    )

    recommendations: list[dict] = []
    for major_id, profile in MAJOR_PROFILES.items():
        points = 0
        evidence_reasons: list[str] = []
        matched_signal_keys: set[str] = set()

        for domain, weight in profile["domains"].items():
            row = domains.get(domain)
            if not row:
                continue
            demonstrations = int(row.get("demonstrations") or 0)
            if demonstrations <= 0:
                continue
            points += weight * min(demonstrations, 4)
            matched_signal_keys.add(f"domain:{domain.casefold()}")
            evidence_reasons.append(
                f"Your saved proof repeatedly connects to {domain} ({demonstrations} distinct demonstration{'s' if demonstrations != 1 else ''})."
            )

        for skill, weight in profile["skills"].items():
            row = skills.get(skill)
            if not row:
                continue
            demonstrations = int(row.get("demonstrations") or 0)
            if demonstrations <= 0:
                continue
            points += weight * min(demonstrations, 4)
            matched_signal_keys.add(f"skill:{skill.casefold()}")
            evidence_reasons.append(
                f"You have demonstrated {skill} across {demonstrations} distinct example{'s' if demonstrations != 1 else ''}."
            )

        keyword_entries: dict[str, int] = defaultdict(int)
        for text in entry_texts:
            for keyword in profile["keywords"]:
                if keyword.casefold() in text:
                    keyword_entries[keyword] += 1

        if keyword_entries:
            top_keywords = sorted(
                keyword_entries.items(),
                key=lambda item: (item[1], len(item[0]), item[0]),
                reverse=True,
            )[:3]
            for keyword, count in top_keywords:
                points += min(count, 3) * 2
                matched_signal_keys.add(f"keyword:{keyword.casefold()}")
            readable = ", ".join(keyword for keyword, _ in top_keywords)
            evidence_reasons.append(
                f"Your accomplishments include subject signals related to {readable}."
            )

        distinct_signals = len(matched_signal_keys)
        if distinct_signals == 0:
            continue

        # Keep breadth conservative: it can never exceed the user's real count of
        # distinct demonstrations, and it is not exposed as a success probability.
        inferred_demo_breadth = min(
            distinct_demonstrations,
            max(
                [
                    int(domains.get(domain, {}).get("demonstrations") or 0)
                    for domain in profile["domains"]
                ]
                + [
                    int(skills.get(skill, {}).get("demonstrations") or 0)
                    for skill in profile["skills"]
                ]
                + [max(keyword_entries.values()) if keyword_entries else 0]
            ),
        )

        recommendations.append(
            {
                "major_id": major_id,
                "major": profile["major"],
                "fit_label": _fit_label(
                    points=points,
                    distinct_signals=distinct_signals,
                    demonstrations=inferred_demo_breadth,
                ),
                "evidence_strength": _evidence_strength(
                    distinct_signals=distinct_signals,
                    demonstrations=inferred_demo_breadth,
                ),
                "evidence_signal_count": distinct_signals,
                "evidence_demonstrations": inferred_demo_breadth,
                "why_it_appeared": evidence_reasons[:4],
                "exploration_question": profile["exploration_question"],
                "next_experiments": list(profile["next_experiments"]),
                "what_we_do_not_know": profile["unknowns"],
                "_points": points,
            }
        )

    label_rank = {
        "strong-exploration-candidate": 3,
        "worth-exploring": 2,
        "possible-direction": 1,
    }
    recommendations.sort(
        key=lambda item: (
            label_rank[item["fit_label"]],
            item["_points"],
            item["evidence_signal_count"],
            item["major"].casefold(),
        ),
        reverse=True,
    )
    for row in recommendations:
        row.pop("_points", None)

    disclaimer = {
        "title": "Major Explorer is for exploration, not a decision about your future.",
        "scope": "Recommendations reflect only the information and evidence currently available in Boasted and may be incomplete.",
        "not_advice": "Major Explorer is an educational decision-support tool, not academic, career, financial, legal, licensing, or professional advice.",
        "no_guarantees": "It does not predict or guarantee admission, scholarships, academic performance, graduation, employment, salary, licensing, or career success.",
        "verify_requirements": "Verify prerequisites, accreditation, transfer rules, program availability, costs, graduation requirements, and licensing requirements with the relevant institution or authority.",
        "user_decision": "You remain responsible for major and education decisions; consider a qualified academic or career advisor for consequential choices.",
    }

    summary = career.get("summary") or {}
    selected = recommendations[:MAX_RECOMMENDATIONS]
    return {
        "summary": {
            "proof_records_analyzed": int(summary.get("total_proof_records") or 0),
            "distinct_demonstrations": distinct_demonstrations,
            "canonical_skills": len(career.get("skills") or []),
            "evidence_domains": len(career_graph.get("domains") or []),
            "recommendations_returned": len(selected),
            "evidence_mode": "saved-proof-only",
            "self_reported_interests_included": False,
        },
        "recommendations": selected,
        "disclaimer": disclaimer,
        "methodology": {
            "version": MAJOR_EXPLORER_VERSION,
            "deterministic": True,
            "career_intelligence_version": (
                (career.get("methodology") or {}).get("version")
                or "career-intelligence-v5"
            ),
            "ranking_meaning": "evidence-alignment-for-exploration-only",
            "fit_percentage": False,
            "best_major_claim": False,
            "decision_maker": False,
            "professional_advice": False,
            "acceptance_prediction": False,
            "scholarship_prediction": False,
            "graduation_prediction": False,
            "employment_prediction": False,
            "salary_prediction": False,
            "licensing_prediction": False,
            "career_success_prediction": False,
            "description": "Uses deterministic mappings from the user's saved accomplishments, Impact Receipts, canonical skills, and evidence domains to surface majors worth exploring. It does not infer aptitude or predict outcomes.",
        },
    }
