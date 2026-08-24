from app.interview_catalog_seed import build_catalog

def test_nonbehavioral_questions_assess_self_awareness():
    assert all('self-awareness' in q['competencies'] for c in build_catalog() for q in c['questions'] if q['category']!='behavioral')
