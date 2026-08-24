from app.interview_catalog_seed import build_catalog

def test_real_estate_roles_include_sales_and_property_ops():
    titles={c['title'] for c in build_catalog()}
    assert {'Real Estate Agent','Leasing Consultant','Property Manager','Home Inspector','Escrow Officer','Title Agent'}<=titles
