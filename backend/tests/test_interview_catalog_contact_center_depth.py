from app.interview_catalog_seed import build_catalog

def test_contact_center_roles_include_multiple_channels():
    titles={c['title'] for c in build_catalog()}
    assert {'Inbound Call Center Representative','Outbound Call Center Representative','Chat Support Representative','Customer Retention Specialist','Escalation Specialist'}<=titles
