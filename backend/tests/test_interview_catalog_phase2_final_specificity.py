from app.interview_catalog_seed import build_catalog

def test_phase2_final_specificity_metadata():assert all('specificity' in q['competencies'] for x in build_catalog() for q in x['questions'][:8])
