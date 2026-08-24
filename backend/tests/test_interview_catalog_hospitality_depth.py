from app.interview_catalog_seed import build_catalog

def test_hospitality_roles_include_front_and_back_of_house():
    titles={c['title'] for c in build_catalog()}
    assert {'Restaurant Server','Line Cook','Dishwasher','Barista','Hotel Front Desk Agent','Housekeeper'}<=titles
