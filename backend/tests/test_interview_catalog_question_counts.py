from app.interview_catalog_seed import build_catalog


def test_every_career_has_exactly_twelve_linked_questions():
    assert all(c['question_count']==len(c['questions'])==12 for c in build_catalog())
