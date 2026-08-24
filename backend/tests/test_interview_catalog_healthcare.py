from app.interview_catalog_seed import build_catalog


def test_healthcare_roles_have_broad_depth():
    titles={c['title'] for c in build_catalog()}
    assert {'Registered Nurse','Certified Nursing Assistant','Home Health Aide','Medical Receptionist','Phlebotomist','Paramedic','ICU Nurse'} <= titles
