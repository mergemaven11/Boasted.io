from app.interview_catalog_seed import build_catalog

def test_nonbehavioral_questions_tag_role_alignment():
    assert all('role-alignment' in q['competencies'] for c in build_catalog() for q in c['questions'] if q['category']!='behavioral')
