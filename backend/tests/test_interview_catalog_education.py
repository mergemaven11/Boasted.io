from app.interview_catalog_seed import build_catalog


def test_education_roles_span_childcare_to_higher_ed():
    titles={c['title'] for c in build_catalog()}
    assert {'Preschool Teacher','Elementary School Teacher','Special Education Teacher','Professor','Academic Advisor','Career Counselor'} <= titles
