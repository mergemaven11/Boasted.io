from app.interview_catalog_seed import build_catalog

def test_retail_roles_include_store_operations():
    titles={c['title'] for c in build_catalog()}
    assert {'Cashier','Stock Associate','Store Manager','Assistant Store Manager','Visual Merchandiser','Loss Prevention Associate'}<=titles
