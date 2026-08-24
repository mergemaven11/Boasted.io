from app.interview_catalog_seed import build_catalog

def test_requested_roles_have_competencies():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert all(q['competencies'] for q in by[x]['questions'])
