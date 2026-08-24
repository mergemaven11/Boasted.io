from app.interview_catalog_seed import build_catalog

def test_technician_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'HVAC Technician','Phlebotomist','Avionics Technician','Fiber Optic Technician','CNC Operator','Veterinary Technician'}<=titles
