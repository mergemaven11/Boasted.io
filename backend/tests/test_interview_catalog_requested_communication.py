from app.interview_catalog_seed import build_catalog

def test_requested_questions_have_communication_competency():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert all('communication' in q['competencies'] for q in by[x]['questions'])
