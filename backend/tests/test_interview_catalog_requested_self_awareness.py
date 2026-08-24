from app.interview_catalog_seed import build_catalog

def test_requested_nonbehavioral_questions_have_self_awareness():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert all('self-awareness' in q['competencies'] for q in by[x]['questions'] if q['category']!='behavioral')
