from app.interview_catalog_seed import build_catalog

def test_all_questions_assess_communication():
    assert all('communication' in q['competencies'] for c in build_catalog() for q in c['questions'])
