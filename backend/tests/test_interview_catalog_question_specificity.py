from app.interview_catalog_seed import build_catalog

def test_behavioral_questions_assess_specificity():
    assert all('specificity' in q['competencies'] for c in build_catalog() for q in c['questions'] if q['category']=='behavioral')
