from pathlib import Path
import re

from app.auth_routes import PROFILE_LAYOUTS, PROFILE_THEMES, ProfileUpdateRequest


ROOT = Path(__file__).resolve().parents[2]
FRONTEND_THEMES = ROOT / "frontend" / "src" / "profileThemes.js"


def _frontend_theme_ids() -> set[str]:
    source = FRONTEND_THEMES.read_text(encoding="utf-8")
    return set(re.findall(r'id:\s*"([^"]+)"', source))


def test_every_frontend_profile_theme_is_accepted_by_backend():
    theme_ids = _frontend_theme_ids()
    assert theme_ids
    assert theme_ids == PROFILE_THEMES
    for theme_id in theme_ids:
        payload = ProfileUpdateRequest(profile_theme=theme_id)
        assert payload.profile_theme == theme_id


def test_newer_profile_themes_are_part_of_the_persistence_contract():
    assert {
        "midnight",
        "aurora",
        "ember",
        "monochrome",
        "ocean",
        "orchid",
        "forest",
        "copper",
        "rose-gold",
        "blueprint",
        "studio",
        "research",
    } <= PROFILE_THEMES


def test_professional_profile_layouts_are_persisted():
    assert PROFILE_LAYOUTS == {"editorial", "executive-sidebar", "career-timeline", "studio-split"}
    for layout_id in PROFILE_LAYOUTS:
        payload = ProfileUpdateRequest(profile_layout=layout_id)
        assert payload.profile_layout == layout_id


def test_structured_profile_sections_validate():
    payload = ProfileUpdateRequest(
        work_history=[{"role": "Support Engineer", "company": "Example Co"}],
        profile_projects=[{"name": "Impact system", "skills": ["Docker", "FastAPI"]}],
    )
    assert payload.work_history[0].role == "Support Engineer"
    assert payload.profile_projects[0].skills == ["Docker", "FastAPI"]
