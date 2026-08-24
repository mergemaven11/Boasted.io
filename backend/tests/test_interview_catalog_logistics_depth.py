from app.interview_catalog_seed import build_catalog

def test_logistics_roles_include_warehouse_and_supply_chain():
    titles={c['title'] for c in build_catalog()}
    assert {'Warehouse Associate','Forklift Operator','Logistics Coordinator','Supply Chain Analyst','Procurement Specialist','Dispatcher'}<=titles
