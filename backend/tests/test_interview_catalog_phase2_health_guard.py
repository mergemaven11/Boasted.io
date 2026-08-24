from app.interview_catalog_seed import build_catalog

def test_phase2_healthcare_career_guard():assert {'Registered Nurse','Certified Nursing Assistant','Paramedic','Medical Receptionist','Phlebotomist'}<={c['title'] for c in build_catalog()}
