from app.interview_catalog_seed import build_catalog

def test_phase2_call_center_is_first_class():
    c=next(x for x in build_catalog() if x['title']=='Call Center Representative');assert c['family']=='customer-contact-center' and len(c['questions'])==12
