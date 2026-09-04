"""Crawler-friendly social sharing for public BragStack Proof Portfolios."""
from __future__ import annotations

from html import escape
from io import BytesIO
import os
import textwrap
from urllib.parse import quote

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from PIL import Image, ImageDraw, ImageFont

from app.database import entries_collection, impact_receipts_collection
from app.public_slug_routes import get_user_by_public_slug, normalize_slug


router = APIRouter(prefix="/public", tags=["public-share"])
PUBLIC_FRONTEND_URL = os.getenv("FRONTEND_URL", "https://usebragstack.com").rstrip("/")
PUBLIC_API_URL = os.getenv("PUBLIC_API_URL", "https://api.usebragstack.com").rstrip("/")


def _plural(value: int, singular: str, plural: str | None = None) -> str:
    word = singular if value == 1 else (plural or f"{singular}s")
    return f"{value} {word}"


def _share_stats(user_id: str) -> dict:
    entry_query = {"user_id": user_id, "is_public": True}
    receipt_query = {"user_id": user_id, "is_public": True}
    public_entries = entries_collection.count_documents(entry_query)
    public_receipts = impact_receipts_collection.count_documents(receipt_query)
    verified_receipts = impact_receipts_collection.count_documents(
        {
            **receipt_query,
            "confirmations": {"$elemMatch": {"status": "confirmed"}},
        }
    )
    return {
        "public_entries": public_entries,
        "public_receipts": public_receipts,
        "verified_receipts": verified_receipts,
    }


def _share_metadata(slug: str) -> dict:
    normalized = normalize_slug(slug)
    user = get_user_by_public_slug(normalized)
    user_id = str(user["_id"])
    stats = _share_stats(user_id)
    name = str(user.get("name") or "BragStack member").strip()[:100]
    headline = str(user.get("headline") or "Evidence-backed career impact").strip()[:180]
    canonical = f"{PUBLIC_FRONTEND_URL}/brag/{quote(normalized, safe='')}"
    image_url = f"{PUBLIC_API_URL}/public/brag/{quote(normalized, safe='')}/share-card.png"
    if stats["verified_receipts"]:
        proof_line = f"{_plural(stats['verified_receipts'], 'verified impact')} · {_plural(stats['public_entries'], 'selected accomplishment')}"
    elif stats["public_receipts"]:
        proof_line = f"{_plural(stats['public_receipts'], 'Impact Receipt')} · {_plural(stats['public_entries'], 'selected accomplishment')}"
    else:
        proof_line = _plural(stats["public_entries"], "selected accomplishment")
    description = f"{headline} · {proof_line}. View this evidence-backed Proof Portfolio on BragStack."
    return {
        "slug": normalized,
        "name": name,
        "headline": headline,
        "canonical": canonical,
        "image_url": image_url,
        "description": description[:300],
        **stats,
    }


def _font(size: int, *, bold: bool = False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _fit_lines(text: str, width: int, *, max_lines: int = 2) -> list[str]:
    words = str(text or "").split()
    if not words:
        return []
    # Character wrapping is only a first pass; pixel width is constrained again
    # when drawing, which keeps unusually wide strings from escaping the card.
    approx = max(12, width // 19)
    lines = textwrap.wrap(" ".join(words), width=approx, break_long_words=True)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .") + "…"
    return lines


def _draw_badge(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, *, verified: bool = False) -> int:
    x, y = xy
    font = _font(24, bold=True)
    label = text.upper()
    bbox = draw.textbbox((0, 0), label, font=font)
    width = bbox[2] - bbox[0] + 38
    fill = (14, 77, 66) if verified else (24, 38, 64)
    outline = (52, 211, 153) if verified else (80, 111, 151)
    draw.rounded_rectangle((x, y, x + width, y + 48), radius=24, fill=fill, outline=outline, width=2)
    draw.text((x + 19, y + 10), label, font=font, fill=(220, 252, 231) if verified else (219, 234, 254))
    return width


@router.get("/brag/{slug}/share", response_class=HTMLResponse, name="public_portfolio_share")
def public_portfolio_share(slug: str):
    """Return personalized Open Graph metadata, then send humans to the portfolio."""
    data = _share_metadata(slug)
    title = f"{data['name']} — Proof Portfolio | BragStack"
    safe_title = escape(title, quote=True)
    safe_description = escape(data["description"], quote=True)
    safe_canonical = escape(data["canonical"], quote=True)
    safe_image = escape(data["image_url"], quote=True)
    # Social crawlers generally do not execute this script, but real visitors do.
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{safe_title}</title>
<meta name="description" content="{safe_description}" />
<link rel="canonical" href="{safe_canonical}" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="BragStack" />
<meta property="og:title" content="{safe_title}" />
<meta property="og:description" content="{safe_description}" />
<meta property="og:url" content="{safe_canonical}" />
<meta property="og:image" content="{safe_image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{safe_title}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{safe_title}" />
<meta name="twitter:description" content="{safe_description}" />
<meta name="twitter:image" content="{safe_image}" />
</head>
<body style="margin:0;background:#050816;color:#e2e8f0;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh">
<main style="max-width:620px;padding:32px;text-align:center">
<p>Opening {escape(data['name'])}’s BragStack Proof Portfolio…</p>
<p><a style="color:#7dd3fc" href="{safe_canonical}">Continue to the portfolio</a></p>
</main>
<script>window.location.replace({data['canonical']!r});</script>
</body>
</html>"""
    return HTMLResponse(
        html,
        headers={"Cache-Control": "public, max-age=300, stale-while-revalidate=600"},
    )


@router.get("/brag/{slug}/share-card.png", name="public_portfolio_share_card")
def public_portfolio_share_card(slug: str):
    """Render a 1200×630 social preview using only explicitly public metadata/counts."""
    data = _share_metadata(slug)
    width, height = 1200, 630
    image = Image.new("RGB", (width, height), (5, 8, 22))
    pixels = image.load()
    # Subtle two-axis gradient without depending on CSS/browser rendering.
    for y in range(height):
        y_ratio = y / max(height - 1, 1)
        for x in range(width):
            x_ratio = x / max(width - 1, 1)
            pixels[x, y] = (
                int(6 + 10 * x_ratio),
                int(10 + 18 * y_ratio),
                int(27 + 30 * (1 - x_ratio) + 8 * y_ratio),
            )

    draw = ImageDraw.Draw(image)
    draw.ellipse((875, -210, 1325, 240), fill=(25, 83, 118))
    draw.ellipse((-180, 390, 220, 790), fill=(58, 42, 105))
    draw.rounded_rectangle((58, 52, 1142, 578), radius=42, fill=(10, 18, 38), outline=(42, 81, 121), width=2)

    eyebrow_font = _font(25, bold=True)
    name_font = _font(64, bold=True)
    headline_font = _font(31)
    footer_font = _font(23, bold=True)

    draw.text((104, 94), "BRAGSTACK  ·  PROOF PORTFOLIO", font=eyebrow_font, fill=(125, 211, 252))
    initial = (data["name"][:1] or "B").upper()
    draw.rounded_rectangle((104, 152, 188, 236), radius=24, fill=(58, 147, 186), outline=(125, 211, 252), width=2)
    initial_bbox = draw.textbbox((0, 0), initial, font=_font(42, bold=True))
    draw.text((146 - (initial_bbox[2] - initial_bbox[0]) / 2, 162), initial, font=_font(42, bold=True), fill=(3, 12, 25))

    draw.text((216, 155), data["name"], font=name_font, fill=(248, 250, 252))
    headline_y = 254
    for line in _fit_lines(data["headline"], 930, max_lines=2):
        draw.text((104, headline_y), line, font=headline_font, fill=(190, 207, 223))
        headline_y += 43

    badge_y = 380
    badge_x = 104
    if data["verified_receipts"]:
        badge_x += _draw_badge(
            draw,
            (badge_x, badge_y),
            _plural(data["verified_receipts"], "verified impact"),
            verified=True,
        ) + 14
    elif data["public_receipts"]:
        badge_x += _draw_badge(draw, (badge_x, badge_y), _plural(data["public_receipts"], "Impact Receipt")) + 14
    _draw_badge(draw, (badge_x, badge_y), _plural(data["public_entries"], "accomplishment"))

    draw.line((104, 492, 1096, 492), fill=(40, 66, 94), width=2)
    draw.text((104, 520), "Evidence-backed career impact · usebragstack.com", font=footer_font, fill=(141, 168, 191))
    draw.text((1003, 516), "B", font=_font(36, bold=True), fill=(125, 211, 252))

    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=300, stale-while-revalidate=600"},
    )
