from app.interview_catalog_seed import build_catalog

def test_seed_stats_can_be_computed_from_documents():
    c=build_catalog();assert sum(x['question_count'] for x in c)==len(c)*12
