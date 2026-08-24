from app.interview_catalog_seed import build_catalog


def test_catalog_contains_at_least_500_careers_and_6000_questions():
    catalog = build_catalog()
    assert len(catalog) >= 500
    assert sum(document["question_count"] for document in catalog) >= 6000


def test_career_slugs_are_unique_and_questions_are_linked():
    catalog = build_catalog()
    slugs = [document["slug"] for document in catalog]
    assert len(slugs) == len(set(slugs))
    for document in catalog:
        assert document["title"]
        assert document["family"]
        assert document["question_count"] == len(document["questions"]) == 12
        assert len({question["question_id"] for question in document["questions"]}) == 12
        assert all(question["active"] is True for question in document["questions"])


def test_priority_everyday_and_existing_roles_are_present():
    catalog = build_catalog()
    titles = {document["title"] for document in catalog}
    for title in ["Call Center Representative", "Customer Service Representative", "Risk Analyst", "Data Analyst", "Warehouse Associate", "Certified Nursing Assistant", "Administrative Assistant", "Security Officer", "Restaurant Server", "Aircraft Mechanic"]:
        assert title in titles


def test_role_specific_questions_include_career_title_and_correct_article():
    catalog = build_catalog()
    by_title = {document["title"]: document for document in catalog}
    assert any("Registered Nurse" in q["text"] for q in by_title["Registered Nurse"]["questions"])
    assert any("Software Engineer" in q["text"] for q in by_title["Software Engineer"]["questions"])
    electrician = by_title["Electrician"]
    assert any("working as an Electrician" in q["text"] for q in electrician["questions"])
    assert not any("working as a Electrician" in q["text"] for q in electrician["questions"])
