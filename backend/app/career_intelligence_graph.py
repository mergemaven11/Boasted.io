"""Deterministic skill normalization and evidence-backed career graph enrichment."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from itertools import combinations
from typing import Iterable

from app.career_intelligence import (
    RECENT_WINDOW_DAYS,
    _clean_text,
    _display_text,
    _document_datetime,
    _document_id,
    _split_skill_values,
    build_career_intelligence,
)
from app.career_intelligence_trajectory import enrich_career_trajectory

TAXONOMY_VERSION = "career-skill-taxonomy-v1"
GRAPH_VERSION = "career-graph-v1"
MAX_GRAPH_SKILL_NODES = 16
MAX_GRAPH_DOMAIN_NODES = 8
MAX_GRAPH_COOCCURRENCE_EDGES = 24

# Exact, curated aliases only. No fuzzy matching, embeddings, or model guesses.
# Unknown skills remain exactly what the user entered after whitespace cleanup.
_CANONICAL_ALIASES: dict[str, tuple[str, ...]] = {
    "AWS": ("aws", "amazon web services"),
    "Azure": ("azure", "microsoft azure", "ms azure"),
    "Bash": ("bash", "bash scripting"),
    "CI/CD": ("ci/cd", "cicd", "ci cd"),
    "Docker": ("docker",),
    "Docker Compose": ("docker compose", "docker-compose"),
    "FastAPI": ("fastapi", "fast api"),
    "Git": ("git",),
    "GitHub": ("github", "git hub"),
    "GitHub Actions": ("github actions", "github action"),
    "GitLab": ("gitlab", "git lab"),
    "GitLab CI": ("gitlab ci", "gitlab ci/cd", "gitlab cicd"),
    "Google Cloud Platform": ("gcp", "google cloud", "google cloud platform"),
    "JavaScript": ("javascript", "java script", "js"),
    "Kubernetes": ("kubernetes", "k8s"),
    "Linux": ("linux",),
    "MongoDB": ("mongodb", "mongo db", "mongo"),
    "Networking": ("networking",),
    "Node.js": ("node.js", "nodejs", "node js"),
    "PostgreSQL": ("postgresql", "postgres", "postgres sql"),
    "Python": ("python",),
    "Raspberry Pi": ("raspberry pi", "raspberrypi"),
    "React": ("react", "react.js", "reactjs", "react js"),
    "SSH": ("ssh", "secure shell"),
    "SQL": ("sql",),
    "Terraform": ("terraform",),
    "TypeScript": ("typescript", "type script", "ts"),
}

_ALIAS_TO_CANONICAL = {
    alias.casefold(): canonical
    for canonical, aliases in _CANONICAL_ALIASES.items()
    for alias in aliases
}

# Curated relationships are intentionally broad career domains, not claims that
# one skill automatically proves mastery of the whole domain. Domain strength is
# calculated only from the user's distinct demonstrations containing mapped skills.
SKILL_DOMAINS: dict[str, tuple[str, ...]] = {
    "Ansible": ("Configuration Management", "Platform Engineering"),
    "AWS": ("Cloud Infrastructure", "Platform Engineering"),
    "Azure": ("Cloud Infrastructure", "Platform Engineering"),
    "Bash": ("Programming & Automation", "Systems Engineering"),
    "CI/CD": ("Delivery Automation", "Developer Tooling"),
    "DNS": ("Networking", "Systems Engineering"),
    "Docker": ("Containers", "Platform Engineering"),
    "Docker Compose": ("Containers", "Platform Engineering"),
    "Edge Computing": ("Edge Computing",),
    "FastAPI": ("Backend Engineering", "Software Engineering"),
    "Git": ("Developer Tooling", "Version Control"),
    "GitHub": ("Developer Tooling", "Version Control"),
    "GitHub Actions": ("Delivery Automation", "Developer Tooling"),
    "GitLab": ("Developer Tooling", "Version Control"),
    "GitLab CI": ("Delivery Automation", "Developer Tooling"),
    "Google Cloud Platform": ("Cloud Infrastructure", "Platform Engineering"),
    "Grafana": ("Observability", "Platform Engineering"),
    "Incident Response": ("Reliability Engineering", "Technical Operations"),
    "JavaScript": ("Software Engineering",),
    "Kubernetes": ("Containers", "Platform Engineering"),
    "Linux": ("Systems Engineering",),
    "MongoDB": ("Databases",),
    "Networking": ("Networking", "Systems Engineering"),
    "Node.js": ("Backend Engineering", "Software Engineering"),
    "Observability": ("Observability", "Platform Engineering"),
    "Platform Engineering": ("Platform Engineering",),
    "PostgreSQL": ("Databases",),
    "Prometheus": ("Observability", "Platform Engineering"),
    "Python": ("Programming & Automation", "Software Engineering"),
    "Raspberry Pi": ("Edge Computing", "Systems Engineering"),
    "React": ("Frontend Engineering", "Software Engineering"),
    "Shell Scripting": ("Programming & Automation", "Systems Engineering"),
    "Site Reliability Engineering": ("Reliability Engineering", "Platform Engineering"),
    "SRE": ("Reliability Engineering", "Platform Engineering"),
    "SSH": ("Systems Engineering", "Networking"),
    "SQL": ("Databases",),
    "Systems Administration": ("Systems Engineering", "Technical Operations"),
    "Systems Engineering": ("Systems Engineering",),
    "TCP/IP": ("Networking", "Systems Engineering"),
    "Terraform": ("Infrastructure as Code", "Platform Engineering"),
    "Troubleshooting": ("Technical Operations",),
    "TypeScript": ("Software Engineering",),
}


def canonicalize_skill(value: str) -> str:
    """Return a canonical skill only when an exact curated alias is known."""
    display = _display_text(value).strip(" \t-–—")
    if not display:
        return ""
    return _ALIAS_TO_CANONICAL.get(display.casefold(), display)


def _skill_values(values) -> list[str]:
    """Split, canonicalize, and de-duplicate one stored skill collection."""
    if values is None:
        return []
    raw_values = [values] if isinstance(values, str) else values
    try:
        iterator = iter(raw_values)
    except TypeError:
        iterator = iter([raw_values])

    normalized: list[str] = []
    seen: set[str] = set()
    for raw_value in iterator:
        for raw_skill in _split_skill_values(raw_value):
            canonical = canonicalize_skill(raw_skill)
            key = canonical.casefold()
            if canonical and key not in seen:
                normalized.append(canonical)
                seen.add(key)
    return normalized


def normalize_career_documents(
    entries: Iterable[dict], receipts: Iterable[dict]
) -> tuple[list[dict], list[dict], list[dict]]:
    """Normalize skill aliases without mutating the user's stored records."""
    entries = list(entries)
    receipts = list(receipts)
    alias_state: dict[str, dict] = defaultdict(
        lambda: {"canonical": "", "aliases": set(), "occurrences": 0}
    )

    def normalize_values(values) -> list[str]:
        if values is None:
            return []
        raw_values = [values] if isinstance(values, str) else values
        try:
            iterator = iter(raw_values)
        except TypeError:
            iterator = iter([raw_values])

        normalized: list[str] = []
        seen: set[str] = set()
        for raw_value in iterator:
            for raw_skill in _split_skill_values(raw_value):
                raw_display = _display_text(raw_skill).strip(" \t-–—")
                canonical = canonicalize_skill(raw_display)
                if not canonical:
                    continue
                key = canonical.casefold()
                state = alias_state[key]
                state["canonical"] = canonical
                state["aliases"].add(raw_display)
                state["occurrences"] += 1
                if key not in seen:
                    normalized.append(canonical)
                    seen.add(key)
        return normalized

    normalized_entries = [
        {**entry, "tags": normalize_values(entry.get("tags", []) or [])}
        for entry in entries
    ]
    normalized_receipts = [
        {**receipt, "skills": normalize_values(receipt.get("skills", []) or [])}
        for receipt in receipts
    ]

    normalization = []
    for key in sorted(alias_state):
        state = alias_state[key]
        aliases = sorted(state["aliases"], key=str.casefold)
        canonical = state["canonical"]
        normalized_aliases = [
            alias for alias in aliases if alias.casefold() != canonical.casefold()
        ]
        normalization.append(
            {
                "canonical": canonical,
                "aliases_seen": aliases,
                "normalized_aliases": normalized_aliases,
                "occurrences": state["occurrences"],
                "merged": bool(normalized_aliases) or len({a.casefold() for a in aliases}) > 1,
            }
        )
    return normalized_entries, normalized_receipts, normalization


def _proof_key(document: dict, *, kind: str, index: int) -> str:
    """Build the same stable proof identity used by the base intelligence engine."""
    document_id = _document_id(document)
    if document_id:
        return f"{kind}:{document_id}"
    return f"{kind}-index:{index}"


def _slug(value: str) -> str:
    """Create a stable graph id component from a display label."""
    chars = []
    previous_dash = False
    for char in value.casefold():
        if char.isalnum():
            chars.append(char)
            previous_dash = False
        elif not previous_dash:
            chars.append("-")
            previous_dash = True
    return "".join(chars).strip("-") or "unknown"


def _domain_trajectory(*, demonstrations: int, recent: int, dated: int) -> str:
    """Classify domain trajectory using the same semantics as skill trajectory."""
    if dated == 0:
        return "undated"
    if demonstrations >= 2:
        if recent >= 2:
            return "current-core"
        if recent == 1:
            return "active"
        return "historical-core"
    if recent == 1:
        return "recent-emerging"
    return "historical"


def _domain_signal(demonstrations: int) -> str:
    """Describe domain durability from distinct demonstrations only."""
    if demonstrations >= 4:
        return "strong"
    if demonstrations >= 2:
        return "established"
    return "emerging"


def enrich_career_graph(
    result: dict,
    entries: Iterable[dict],
    receipts: Iterable[dict],
    normalization: list[dict],
    *,
    now: datetime | None = None,
) -> dict:
    """Build a deterministic graph from canonical skills and distinct proof."""
    entries = list(entries)
    receipts = list(receipts)
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)

    entry_proof_keys: dict[str, str] = {}
    entry_dates: dict[str, datetime | None] = {}
    proof_dates: dict[str, datetime | None] = {}
    proof_skills: dict[str, set[str]] = defaultdict(set)
    skill_labels: dict[str, str] = {}

    for index, entry in enumerate(entries):
        proof_key = _proof_key(entry, kind="entry", index=index)
        entry_id = _document_id(entry)
        observed_at = _document_datetime(entry)
        proof_dates[proof_key] = observed_at
        if entry_id:
            entry_proof_keys[entry_id] = proof_key
            entry_dates[entry_id] = observed_at
        for skill in _skill_values(entry.get("tags", []) or []):
            key = skill.casefold()
            proof_skills[proof_key].add(key)
            skill_labels[key] = skill

    for index, receipt in enumerate(receipts):
        source_entry_id = _clean_text(receipt.get("source_entry_id")) or None
        linked_key = entry_proof_keys.get(source_entry_id or "")
        proof_key = linked_key or _proof_key(receipt, kind="receipt", index=index)
        if linked_key is not None and source_entry_id:
            observed_at = entry_dates.get(source_entry_id) or _document_datetime(receipt)
        else:
            observed_at = _document_datetime(receipt)
        proof_dates.setdefault(proof_key, observed_at)
        for skill in _skill_values(receipt.get("skills", []) or []):
            key = skill.casefold()
            proof_skills[proof_key].add(key)
            skill_labels[key] = skill

    skill_rows = {
        _clean_text(skill.get("skill")).casefold(): skill
        for skill in result.get("skills") or []
        if _clean_text(skill.get("skill"))
    }
    normalization_by_key = {
        row["canonical"].casefold(): row for row in normalization if row.get("canonical")
    }

    selected_skill_rows = list(result.get("skills") or [])[:MAX_GRAPH_SKILL_NODES]
    selected_skill_keys = {
        _clean_text(skill.get("skill")).casefold()
        for skill in selected_skill_rows
        if _clean_text(skill.get("skill"))
    }

    domain_proofs: dict[str, set[str]] = defaultdict(set)
    domain_skills: dict[str, set[str]] = defaultdict(set)
    for proof_key, skill_keys in proof_skills.items():
        for skill_key in skill_keys:
            label = skill_labels.get(skill_key) or skill_rows.get(skill_key, {}).get("skill")
            for domain in SKILL_DOMAINS.get(label, ()):
                domain_proofs[domain].add(proof_key)
                domain_skills[domain].add(skill_key)

    domain_rows: list[dict] = []
    for domain, proof_keys in domain_proofs.items():
        demonstrations = len(proof_keys)
        dates = [proof_dates.get(proof_key) for proof_key in proof_keys]
        dated = sum(1 for observed_at in dates if observed_at is not None)
        recent = sum(
            1
            for observed_at in dates
            if observed_at is not None
            and 0 <= (now - observed_at).days <= RECENT_WINDOW_DAYS
        )
        ranked_members = sorted(
            domain_skills[domain],
            key=lambda key: (
                int(skill_rows.get(key, {}).get("demonstrations") or 0),
                int(skill_rows.get(key, {}).get("evidence_points") or 0),
                (skill_labels.get(key) or key).casefold(),
            ),
            reverse=True,
        )
        domain_rows.append(
            {
                "domain": domain,
                "demonstrations": demonstrations,
                "signal": _domain_signal(demonstrations),
                "trajectory": _domain_trajectory(
                    demonstrations=demonstrations,
                    recent=recent,
                    dated=dated,
                ),
                "recent_demonstrations": recent,
                "skills": [
                    skill_labels.get(key)
                    or skill_rows.get(key, {}).get("skill")
                    or key
                    for key in ranked_members[:5]
                ],
            }
        )

    trajectory_rank = {
        "current-core": 6,
        "active": 5,
        "recent-emerging": 4,
        "historical-core": 3,
        "historical": 2,
        "undated": 1,
    }
    signal_rank = {"strong": 3, "established": 2, "emerging": 1}
    domain_rows.sort(
        key=lambda row: (
            signal_rank[row["signal"]],
            row["demonstrations"],
            trajectory_rank[row["trajectory"]],
            row["domain"].casefold(),
        ),
        reverse=True,
    )
    selected_domains = domain_rows[:MAX_GRAPH_DOMAIN_NODES]
    selected_domain_names = {row["domain"] for row in selected_domains}

    nodes: list[dict] = []
    node_ids: dict[tuple[str, str], str] = {}
    for skill in selected_skill_rows:
        label = _clean_text(skill.get("skill"))
        if not label:
            continue
        key = label.casefold()
        node_id = f"skill:{_slug(label)}"
        node_ids[("skill", key)] = node_id
        normalization_row = normalization_by_key.get(key, {})
        nodes.append(
            {
                "id": node_id,
                "type": "skill",
                "label": label,
                "demonstrations": int(skill.get("demonstrations") or 0),
                "signal": skill.get("signal"),
                "support_level": skill.get("support_level"),
                "trajectory": skill.get("trajectory"),
                "aliases_seen": normalization_row.get("aliases_seen", [label]),
            }
        )

    for domain in selected_domains:
        label = domain["domain"]
        node_id = f"domain:{_slug(label)}"
        node_ids[("domain", label)] = node_id
        nodes.append(
            {
                "id": node_id,
                "type": "domain",
                "label": label,
                "demonstrations": domain["demonstrations"],
                "signal": domain["signal"],
                "trajectory": domain["trajectory"],
                "skills": domain["skills"],
            }
        )

    edges: list[dict] = []
    for skill_key in selected_skill_keys:
        label = skill_labels.get(skill_key) or skill_rows.get(skill_key, {}).get("skill")
        source_id = node_ids.get(("skill", skill_key))
        if not label or not source_id:
            continue
        skill_proof_count = int(skill_rows.get(skill_key, {}).get("demonstrations") or 0)
        for domain in SKILL_DOMAINS.get(label, ()):
            if domain not in selected_domain_names:
                continue
            target_id = node_ids.get(("domain", domain))
            if target_id:
                edges.append(
                    {
                        "source": source_id,
                        "target": target_id,
                        "relationship": "supports-domain",
                        "demonstrations": skill_proof_count,
                    }
                )

    cooccurrence_counts: dict[tuple[str, str], int] = defaultdict(int)
    for skill_keys in proof_skills.values():
        selected = sorted(skill_keys & selected_skill_keys)
        for left, right in combinations(selected, 2):
            cooccurrence_counts[(left, right)] += 1

    ranked_cooccurrences = sorted(
        cooccurrence_counts.items(),
        key=lambda item: (
            item[1],
            skill_labels.get(item[0][0], item[0][0]).casefold(),
            skill_labels.get(item[0][1], item[0][1]).casefold(),
        ),
        reverse=True,
    )[:MAX_GRAPH_COOCCURRENCE_EDGES]

    for (left, right), demonstrations in ranked_cooccurrences:
        source_id = node_ids.get(("skill", left))
        target_id = node_ids.get(("skill", right))
        if source_id and target_id:
            edges.append(
                {
                    "source": source_id,
                    "target": target_id,
                    "relationship": "co-demonstrated",
                    "demonstrations": demonstrations,
                    "strength": "repeated" if demonstrations >= 2 else "observed",
                }
            )

    merged_normalizations = [row for row in normalization if row.get("merged")]
    current_domains = [
        row
        for row in selected_domains
        if row["signal"] in {"established", "strong"}
        and row["trajectory"] in {"current-core", "active"}
    ]
    durable_domains = [
        row for row in selected_domains if row["signal"] in {"established", "strong"}
    ]
    profile_domains = current_domains or durable_domains or selected_domains[:3]

    if profile_domains:
        top_names = [row["domain"] for row in profile_domains[:3]]
        graph_summary = (
            f"Your proof clusters into evidence-backed domains including "
            f"{', '.join(top_names)}. These domains are derived from canonical skills "
            "and distinct work demonstrations, not title matching or hiring predictions."
        )
    else:
        graph_summary = (
            "Add more specifically tagged accomplishments to reveal evidence-backed "
            "relationships between skills and broader career domains."
        )

    profile = result.setdefault("career_profile", {})
    profile["evidence_domains"] = [row["domain"] for row in profile_domains[:4]]
    profile["graph_summary"] = graph_summary

    summary = result.setdefault("summary", {})
    summary["canonical_skill_count"] = len(result.get("skills") or [])
    summary["normalized_alias_group_count"] = len(merged_normalizations)
    summary["career_domain_count"] = len(domain_rows)

    result["career_graph"] = {
        "version": GRAPH_VERSION,
        "taxonomy_version": TAXONOMY_VERSION,
        "normalization_strategy": "exact-curated-aliases-only",
        "domains": selected_domains,
        "normalizations": merged_normalizations,
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "skill_nodes": sum(1 for node in nodes if node["type"] == "skill"),
            "domain_nodes": sum(1 for node in nodes if node["type"] == "domain"),
            "edges": len(edges),
            "co_demonstration_edges": sum(
                1 for edge in edges if edge["relationship"] == "co-demonstrated"
            ),
            "merged_alias_groups": len(merged_normalizations),
        },
    }

    methodology = result.setdefault("methodology", {})
    methodology["version"] = "career-intelligence-v5"
    methodology["schema_version"] = "career-intelligence-v5"
    methodology["taxonomy_version"] = TAXONOMY_VERSION
    methodology["graph_version"] = GRAPH_VERSION
    methodology["skill_normalization"] = "exact-curated-aliases-only"
    methodology["description"] = (
        "Signals summarize user-owned proof. BragStack separates durability, proof "
        "support, and temporal trajectory; normalizes only exact curated skill aliases; "
        "and builds a deterministic career graph from distinct demonstrations, "
        "co-demonstrated skills, and curated skill-to-domain relationships. Unknown "
        "skills are preserved rather than fuzzy-matched. Linked receipts remain tied "
        "to the underlying work, and BragStack does not predict hiring or promotion outcomes."
    )
    return result


def build_career_intelligence_v5(
    entries: Iterable[dict],
    receipts: Iterable[dict],
    *,
    now: datetime | None = None,
) -> dict:
    """Run the complete v5 deterministic Career Intelligence pipeline."""
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    normalized_entries, normalized_receipts, normalization = normalize_career_documents(
        entries, receipts
    )
    result = build_career_intelligence(
        normalized_entries,
        normalized_receipts,
        now=now,
    )
    result = enrich_career_trajectory(
        result,
        normalized_entries,
        normalized_receipts,
        now=now,
    )
    return enrich_career_graph(
        result,
        normalized_entries,
        normalized_receipts,
        normalization,
        now=now,
    )
