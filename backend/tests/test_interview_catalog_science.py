from app.interview_catalog_seed import build_catalog


def test_science_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Laboratory Technician','Biologist','Chemist','Microbiologist','Epidemiologist','GIS Analyst'} <= titles
