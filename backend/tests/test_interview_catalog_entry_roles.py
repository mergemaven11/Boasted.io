from app.interview_catalog_seed import build_catalog

def test_entry_level_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Cashier','Call Center Representative','Warehouse Associate','Data Entry Clerk','Food Service Worker','Retail Associate'}<=titles
