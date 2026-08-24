from app.interview_catalog_seed import build_catalog

def test_requested_nonbehavioral_questions_have_role_alignment():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert all('role-alignment' in q['competencies'] for q in by[x]['questions'] if q['category']!='behavioral')
