from app import profile_media_routes


def test_public_profile_avatar_returns_saved_photo(monkeypatch):
    avatar = "data:image/jpeg;base64,ZmFrZS1waG90bw=="
    monkeypatch.setattr(
        profile_media_routes,
        "get_user_by_public_slug",
        lambda slug: {"public_slug": slug, "avatar_url": avatar},
    )

    assert profile_media_routes.get_public_profile_avatar("tee-proof") == {
        "avatar_url": avatar
    }


def test_public_profile_avatar_keeps_letter_fallback_when_empty(monkeypatch):
    monkeypatch.setattr(
        profile_media_routes,
        "get_user_by_public_slug",
        lambda slug: {"public_slug": slug, "avatar_url": ""},
    )

    assert profile_media_routes.get_public_profile_avatar("tee-proof") == {
        "avatar_url": ""
    }
