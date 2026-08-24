from app.interview_catalog_seed import build_catalog


def test_environmental_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Farm Manager','Landscaper','Arborist','Forester','Water Treatment Operator','Environmental Health Specialist'} <= titles
