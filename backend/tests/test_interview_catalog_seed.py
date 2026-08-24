from app.interview_catalog_seed import build_catalog


def test_catalog_contains_100_careers_and_1200_questions():
    catalog = build_catalog()

    assert len(catalog) == 100
    assert sum(document["question_count"] for document in catalog) == 1200


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


def test_role_specific_questions_include_career_title():
    catalog = build_catalog()
    nurse = next(document for document in catalog if document["title"] == "Registered Nurse")
    software_engineer = next(document for document in catalog if document["title"] == "Software Engineer")

    assert any("Registered Nurse" in question["text"] for question in nurse["questions"])
    assert any("Software Engineer" in question["text"] for question in software_engineer["questions"])
