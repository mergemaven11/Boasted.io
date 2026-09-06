"""Regression tests for crawler-safe public Proof Portfolio sharing."""
from io import BytesIO

import mongomock
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
import app.public_share_routes as share_routes
import app.public_slug_routes as slug_routes


client = TestClient(app)


@pytest.fixture
def share_context(monkeypatch):
    db = mongomock.MongoClient()["public_share_test"]
    monkeypatch.setattr(slug_routes, "users_collection", db.users)
    monkeypatch.setattr(share_routes, "entries_collection", db.entries)
    monkeypatch.setattr(share_routes, "impact_receipts_collection", db.impact_receipts)
    user_id = db.users.insert_one({
        "name": "Tee <script>alert(1)</script>",
        "headline": "Platform Engineer & Product Builder",
        "public_slug": "tee-proof",
    }).inserted_id
    uid = str(user_id)
    db.entries.insert_many([
        {"user_id": uid, "title": "Public one", "is_public": True},
        {"user_id": uid, "title": "Public two", "is_public": True},
        {"user_id": uid, "title": "Private secret accomplishment", "is_public": False},
    ])
    db.impact_receipts.insert_many([
        {
            "user_id": uid,
            "is_public": True,
            "accomplishment": "Public verified impact",
            "confirmations": [{"status": "confirmed", "verifier_note": "Private praise"}],
        },
        {
            "user_id": uid,
            "is_public": True,
            "accomplishment": "Public self-documented impact",
            "confirmations": [],
        },
        {
            "user_id": uid,
            "is_public": False,
            "accomplishment": "Private verified impact",
            "result": "Do not expose this result",
            "confirmations": [{"status": "confirmed", "verifier_note": "Private note"}],
        },
    ])
    return db


def test_share_page_uses_personalized_public_counts_and_escapes_profile_text(share_context):
    response = client.get("/public/brag/tee-proof/share")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    html = response.text
    assert "Tee &lt;script&gt;alert(1)&lt;/script&gt; — Proof Portfolio | Boasted" in html
    assert "Platform Engineer &amp; Product Builder" in html
    assert "1 verified impact" in html
    assert "2 selected accomplishments" in html
    assert 'property="og:image"' in html
    assert 'name="twitter:card" content="summary_large_image"' in html
    assert "Private secret accomplishment" not in html
    assert "Do not expose this result" not in html
    assert "Private praise" not in html
    assert "Private note" not in html


def test_share_card_is_1200_by_630_png_and_uses_only_public_aggregate_metadata(share_context):
    response = client.get("/public/brag/tee-proof/share-card.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    image = Image.open(BytesIO(response.content))
    assert image.size == (1200, 630)
    assert image.format == "PNG"


def test_share_routes_return_404_for_unknown_profile(share_context):
    assert client.get("/public/brag/no-such-person/share").status_code == 404
    assert client.get("/public/brag/no-such-person/share-card.png").status_code == 404
