from app.interview_catalog_seed import build_catalog

def test_requested_behavioral_questions_have_impact_competency():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert all('impact' in q['competencies'] for q in by[x]['questions'] if q['category']=='behavioral')
