"""Ensure no API client can bypass the verified resume build path."""

from app.main import app


def test_verified_resume_build_route_precedes_legacy_builder():
    matches = [
        route
        for route in app.routes
        if getattr(route, "path", None) == "/resume-builder/build"
        and "POST" in (getattr(route, "methods", set()) or set())
    ]

    assert matches, "Expected the canonical resume build route to exist"
    assert matches[0].endpoint.__name__ == "build_verified_resume"
