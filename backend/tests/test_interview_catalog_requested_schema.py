from app.interview_catalog_seed import build_catalog

def test_requested_roles_use_schema_one():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert by[x]['schema_version']==1
