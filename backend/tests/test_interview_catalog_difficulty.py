from app.interview_catalog_seed import build_catalog


def test_each_career_contains_stretch_questions():
    for c in build_catalog():
        assert sum(q['difficulty']=='stretch' for q in c['questions'])==3
