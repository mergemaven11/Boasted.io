from app.interview_catalog_seed import build_catalog

def test_question_total_equals_careers_times_twelve():
    c=build_catalog();assert sum(x['question_count'] for x in c)==12*len(c)
