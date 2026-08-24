from app.interview_catalog_seed import build_catalog

def test_requested_document_schema_complete():
    req={'schema_version','catalog_version','slug','title','family','aliases','active','questions','question_count','updated_at'};by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert req<=set(by[x])
