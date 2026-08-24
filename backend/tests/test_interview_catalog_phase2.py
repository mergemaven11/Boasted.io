from app.interview_catalog_seed import build_catalog


def test_phase2_has_broad_family_coverage():
    catalog = build_catalog()
    families = {document["family"] for document in catalog}
    expected = {"customer-contact-center", "administrative-office", "retail-service", "hospitality-food", "warehouse-logistics", "transportation", "healthcare-clinical", "healthcare-admin", "insurance-banking", "human-resources", "legal-compliance", "public-safety-security", "construction-trades", "manufacturing", "engineering", "aviation", "education-childcare", "science-laboratory", "media-creative", "real-estate-property", "executive-management"}
    assert expected <= families


def test_all_phase2_documents_are_catalog_v2():
    catalog = build_catalog()
    assert all(document["catalog_version"] == 2 for document in catalog)
