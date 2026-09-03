"""Document this first-party Python module."""
from app.interview_catalog_seed import build_catalog
from app.interview_question_rotation import select_rotated_questions


def test_catalog_contains_at_least_500_careers_and_24000_questions():
    """Verify catalog contains at least 500 careers and 24000 questions."""
    catalog = build_catalog()
    assert len(catalog) >= 500
    assert sum(document["question_count"] for document in catalog) >= 24000


def test_career_slugs_are_unique_and_questions_are_linked():
    """Verify career slugs are unique and questions are linked."""
    catalog = build_catalog()
    slugs = [document["slug"] for document in catalog]
    assert len(slugs) == len(set(slugs))
    for document in catalog:
        assert document["question_count"] == len(document["questions"]) == 48
        assert len({question["question_id"] for question in document["questions"]}) == 48
        assert all(question["active"] is True for question in document["questions"])


def test_requested_roles_have_deep_domain_specific_question_banks():
    """Verify requested roles have deep domain specific question banks."""
    by_title = {document["title"]: document for document in build_catalog()}
    for title in ["Call Center Representative", "Risk Analyst", "Data Analyst"]:
        assert title in by_title
        assert by_title[title]["question_count"] == 48
    assert any("handle-time" in q["text"] or "angry caller" in q["text"] for q in by_title["Call Center Representative"]["questions"])
    assert any("control" in q["text"].lower() or "risk" in q["text"].lower() for q in by_title["Risk Analyst"]["questions"])
    assert any("data source" in q["text"].lower() or "query" in q["text"].lower() for q in by_title["Data Analyst"]["questions"])


def test_intent_driven_prompts_put_the_scored_competency_first():
    """Verify intent driven prompts put the scored competency first."""
    risk_analyst = next(c for c in build_catalog() if c["title"] == "Risk Analyst")
    by_category = {question["category"]: question for question in risk_analyst["questions"]}
    assert by_category["motivation"]["competencies"][0] == "role-alignment"
    assert by_category["strength"]["competencies"][0] == "role-alignment"
    assert by_category["growth"]["competencies"][0] == "learning"
    assert by_category["reflection"]["competencies"][0] == "learning"


def test_four_ten_question_interviews_can_avoid_repeats():
    """Verify four ten question interviews can avoid repeats."""
    career = next(c for c in build_catalog() if c["title"] == "Data Analyst")
    used = set()
    for index in range(4):
        session = select_rotated_questions(career["questions"], count=10, exclude_ids=used, seed=index)
        ids = {question["question_id"] for question in session}
        assert len(session) == 10
        assert used.isdisjoint(ids)
        used.update(ids)
    assert len(used) == 40


def test_rotation_recycles_only_when_fresh_questions_are_insufficient():
    """Verify rotation recycles only when fresh questions are insufficient."""
    career = next(c for c in build_catalog() if c["title"] == "Risk Analyst")
    excluded = {question["question_id"] for question in career["questions"][:44]}
    fresh_ids = {question["question_id"] for question in career["questions"][44:]}
    selected = select_rotated_questions(career["questions"], count=8, exclude_ids=excluded, seed="recycle")
    selected_ids = {question["question_id"] for question in selected}
    assert fresh_ids <= selected_ids
    assert len(selected) == 8
