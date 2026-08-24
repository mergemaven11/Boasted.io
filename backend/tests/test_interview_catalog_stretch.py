from app.interview_catalog_seed import build_catalog

def test_three_behavioral_questions_are_stretch_per_role():
    for c in build_catalog():
        assert len([q for q in c['questions'] if q['category']=='behavioral' and q['difficulty']=='stretch'])==3
