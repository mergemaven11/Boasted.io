# Boasted marketing page — 2026 polish

Design direction for this pass:

- Calm, premium dark UI instead of loud gradient-heavy startup styling.
- One clear visual accent (Boasted violet) with quieter secondary surfaces.
- Stronger hierarchy: hero and product proof carry the attention; navigation and support copy recede.
- Fluid type and spacing with `clamp()` rather than device-specific fixed sizing.
- Responsive cards that collapse intentionally instead of squeezing text.
- Two-column pricing on desktop and one-column pricing on small screens for readability.
- Marketing CSS scoped to `.landing-page` and loaded after legacy/global guards to reduce regressions elsewhere in the app.
- Mobile-safe overflow behavior at 540px, 780px, and 1080px breakpoints.
- Reduced-motion support and below-the-fold `content-visibility` for a lighter render path.

Reference direction: modern 2026 SaaS pages emphasize calmer visual hierarchy, restrained navigation, product-first screenshots, fewer simultaneous focal points, and intentional mobile layout rather than simply shrinking desktop UI.
