from app.interview_catalog_seed import build_catalog


def test_all_seeded_careers_and_questions_are_active():
    for c in build_catalog():
        assert c['active'] is True
        assert all(q['active'] is True for q in c['questions'])
