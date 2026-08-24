from app.interview_catalog_seed import build_catalog


def test_questions_have_nontrivial_text():
    for career in build_catalog():
        assert all(len(q['text'])>=35 for q in career['questions'])
