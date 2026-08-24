from app.interview_catalog_seed import build_catalog


def test_every_career_has_behavioral_and_reflection_coverage():
    for career in build_catalog():
        categories={q['category'] for q in career['questions']}
        assert {'behavioral','motivation','strength','growth','reflection'} <= categories
        assert sum(q['category']=='behavioral' for q in career['questions']) == 8
