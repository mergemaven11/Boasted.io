"""Ensure no API client can bypass the verified resume build path."""

import inspect

import app.main as main_module
from app.resume_builder_routes import router as legacy_resume_router
from app.verified_resume_routes import build_verified_resume, router as verified_resume_router


def test_verified_router_owns_canonical_resume_build_path():
    verified_matches = [
        route
        for route in verified_resume_router.routes
        if getattr(route, "path", None) == "/resume-builder/build"
        and "POST" in (getattr(route, "methods", set()) or set())
    ]
    assert verified_matches
    assert verified_matches[0].endpoint is build_verified_resume


def test_verified_router_is_mounted_before_legacy_resume_router():
    source = inspect.getsource(main_module)
    verified_mount = source.index("app.include_router(verified_resume_router)")
    legacy_mount = source.index("app.include_router(resume_builder_router)")
    assert verified_mount < legacy_mount

    # The legacy route may remain temporarily for backwards-compatible module
    # ownership, but Starlette matches routes in mount order. The verified
    # router therefore owns the canonical runtime path.
    assert any(
        getattr(route, "path", None) == "/resume-builder/build"
        for route in legacy_resume_router.routes
    )
