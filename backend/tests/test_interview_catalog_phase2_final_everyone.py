from app.interview_catalog_seed import build_catalog

def test_phase2_final_broad_career_mission():
    t={x['title'] for x in build_catalog()};assert {'Call Center Representative','Data Analyst','Risk Analyst','Cashier','Nurse Practitioner','Electrician','Truck Driver','Teacher','Attorney','Software Engineer','Funeral Director'}<=t
