from app.interview_catalog_seed import build_catalog


def test_wellness_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Cosmetologist','Hair Stylist','Barber','Massage Therapist','Personal Trainer','Yoga Instructor'} <= titles
