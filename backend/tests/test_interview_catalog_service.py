from app.interview_catalog_seed import build_catalog


def test_service_roles_are_well_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Cashier','Restaurant Server','Barista','Housekeeper','Hotel Front Desk Agent','Retail Associate','Customer Service Representative'} <= titles
