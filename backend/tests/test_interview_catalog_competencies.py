from app.interview_catalog_seed import build_catalog


def test_every_question_has_competency_metadata():
    for c in build_catalog():
        assert all(q['competencies'] for q in c['questions'])
