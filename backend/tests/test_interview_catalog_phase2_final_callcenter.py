from app.interview_catalog_seed import build_catalog

def test_phase2_final_callcenter():
    c=next(x for x in build_catalog() if x['title']=='Call Center Representative');assert c['family']=='customer-contact-center'
