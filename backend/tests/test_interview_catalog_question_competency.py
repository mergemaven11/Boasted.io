from app.interview_catalog_seed import build_catalog

def test_motivation_questions_include_role_alignment_competency():
    assert all('role-alignment' in next(q['competencies'] for q in c['questions'] if q['category']=='motivation') for c in build_catalog())
