from app.interview_catalog_seed import build_catalog

def test_clinical_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Nurse Practitioner','Physician Assistant','Emergency Medical Technician','Paramedic','Surgical Technologist'}<=titles
