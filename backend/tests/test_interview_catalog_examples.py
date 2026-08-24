from app.interview_catalog_seed import build_catalog


def test_catalog_spans_diverse_work():
    titles={c['title'] for c in build_catalog()}
    assert {'Funeral Director','Commercial Pilot','Cosmetologist','Firefighter','Teacher','Truck Driver','Attorney','Data Analyst','Call Center Representative'} <= titles
