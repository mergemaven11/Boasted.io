"""Regression tests for Career Intelligence v5 normalization and career graph."""
from datetime import datetime, timezone

from app.career_intelligence_graph import (
    build_career_intelligence_v5,
    canonicalize_skill,
)
from app.career_intelligence_routes import _verify_intelligence


def test_curated_aliases_merge_before_durability_scoring():
    """K8s and Kubernetes should become one repeated canonical skill."""
    now = datetime(2026, 9, 5, tzinfo=timezone.utc)
    entries = [
        {
            "_id": "e1",
            "category": "Platform Engineering",
            "tags": ["K8s", "Docker"],
            "impact": "Deployed a service",
            "entry_date": "2026-07-01",
        },
        {
            "_id": "e2",
            "category": "Platform Engineering",
            "tags": ["Kubernetes", "Terraform"],
            "impact": "Improved deployment reliability by 20%",
            "entry_date": "2026-08-01",
        },
    ]

    result = build_career_intelligence_v5(entries, [], now=now)

    kubernetes = next(
        skill for skill in result["skills"] if skill["skill"] == "Kubernetes"
    )
    assert kubernetes["demonstrations"] == 2
    assert kubernetes["signal"] == "established"
    assert not any(skill["skill"] == "K8s" for skill in result["skills"])
    assert result["summary"]["normalized_alias_group_count"] == 1
    assert result["methodology"]["version"] == "career-intelligence-v5"

    normalizations = result["career_graph"]["normalizations"]
    kubernetes_aliases = next(
        row for row in normalizations if row["canonical"] == "Kubernetes"
    )
    assert set(kubernetes_aliases["aliases_seen"]) == {"K8s", "Kubernetes"}


def test_unknown_skills_are_not_fuzzy_merged():
    """The engine should preserve unknown near-matches rather than guess equivalence."""
    result = build_career_intelligence_v5(
        [
            {
                "_id": "e1",
                "category": "Data",
                "tags": ["Data Engineer"],
                "impact": "Built a pipeline",
                "entry_date": "2026-07-01",
            },
            {
                "_id": "e2",
                "category": "Data",
                "tags": ["Data Engineering"],
                "impact": "Documented a platform",
                "entry_date": "2026-08-01",
            },
        ],
        [],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    names = {skill["skill"] for skill in result["skills"]}
    assert "Data Engineer" in names
    assert "Data Engineering" in names
    assert result["summary"]["normalized_alias_group_count"] == 0
    assert result["career_graph"]["normalization_strategy"] == "exact-curated-aliases-only"


def test_career_graph_builds_domains_from_distinct_demonstrations():
    """Mapped canonical skills should form evidence-backed career domains."""
    result = build_career_intelligence_v5(
        [
            {
                "_id": "e1",
                "category": "Operations",
                "tags": ["Docker", "K8s", "Linux"],
                "impact": "Shipped a containerized service",
                "entry_date": "2026-07-01",
            },
            {
                "_id": "e2",
                "category": "Infrastructure",
                "tags": ["Kubernetes", "Terraform", "Linux"],
                "impact": "Automated infrastructure changes",
                "entry_date": "2026-08-01",
            },
        ],
        [],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    domains = {row["domain"]: row for row in result["career_graph"]["domains"]}
    assert domains["Platform Engineering"]["demonstrations"] == 2
    assert domains["Platform Engineering"]["signal"] == "established"
    assert domains["Systems Engineering"]["demonstrations"] == 2
    assert "Platform Engineering" in result["career_profile"]["evidence_domains"]
    assert result["summary"]["career_domain_count"] >= 3


def test_graph_co_demonstration_edges_use_underlying_work_not_receipt_volume():
    """A linked receipt should enrich one skill relationship, not duplicate it."""
    entries = [
        {
            "_id": "e1",
            "category": "Platform Engineering",
            "tags": ["K8s", "Docker"],
            "impact": "Deployed a service",
            "entry_date": "2026-07-01",
        },
        {
            "_id": "e2",
            "category": "Platform Engineering",
            "tags": ["Kubernetes", "Docker"],
            "impact": "Improved a deployment",
            "entry_date": "2026-08-01",
        },
    ]
    receipts = [
        {
            "_id": "r1",
            "source_entry_id": "e1",
            "skills": ["Kubernetes", "Docker"],
            "evidence": [
                {"title": "Runbook"},
                {"title": "Dashboard"},
                {"title": "Ticket"},
            ],
            "created_at": "2026-09-05",
        }
    ]

    result = build_career_intelligence_v5(
        entries,
        receipts,
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    nodes = {node["label"]: node["id"] for node in result["career_graph"]["nodes"]}
    pair = {nodes["Kubernetes"], nodes["Docker"]}
    edges = [
        edge
        for edge in result["career_graph"]["edges"]
        if edge["relationship"] == "co-demonstrated"
        and {edge["source"], edge["target"]} == pair
    ]
    assert len(edges) == 1
    assert edges[0]["demonstrations"] == 2
    assert edges[0]["strength"] == "repeated"


def test_v5_graph_passes_route_invariants():
    """The full v5 payload should satisfy the API's fail-closed verification."""
    entries = [
        {
            "_id": "e1",
            "category": "Platform Engineering",
            "tags": ["Postgres", "Python", "Docker"],
            "impact": "Reduced deployment time by 30%",
            "entry_date": "2026-07-01",
        },
        {
            "_id": "e2",
            "category": "Platform Engineering",
            "tags": ["PostgreSQL", "Python", "K8s"],
            "impact": "Improved reliability",
            "entry_date": "2026-08-01",
        },
    ]
    receipts = []

    result = build_career_intelligence_v5(
        entries,
        receipts,
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    assert _verify_intelligence(result, entries, receipts) == []
    assert canonicalize_skill("Postgres") == "PostgreSQL"
    assert canonicalize_skill("PostgreSQL") == "PostgreSQL"
