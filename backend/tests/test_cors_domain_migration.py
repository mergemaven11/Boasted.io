"""Regression guards for frontend origins during the Boasted domain migration."""

import app.main as main


def test_boasted_and_legacy_frontends_are_allowed_by_cors():
    expected_origins = {
        "https://boasted.io",
        "https://www.boasted.io",
        "https://usebragstack.com",
        "https://www.usebragstack.com",
    }

    assert expected_origins.issubset(set(main.cors_origins))
