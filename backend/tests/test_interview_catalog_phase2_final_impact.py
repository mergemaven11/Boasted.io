from app.interview_catalog_seed import build_catalog

def test_phase2_final_impact_metadata():assert all('impact' in q['competencies'] for x in build_catalog() for q in x['questions'][:8])
