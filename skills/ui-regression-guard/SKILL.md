---
name: bragstack-ui-regression-guard
description: Prevent BragStack UI regressions across mobile, tablet, desktop, loading, error, and authenticated states before merge.
---

# BragStack UI Regression Guard

## Use this skill when

- changing React components, CSS, routing, navigation, forms, dashboards, auth screens, loading states, or responsive layouts
- fixing a visual bug
- preparing a frontend PR for merge

## Required inputs

- changed frontend files or PR diff
- affected routes/components
- available test/build commands

## Workflow

1. Identify every affected user state: signed out, signing in, loading, empty, populated, error, and signed in.
2. Check responsive behavior at minimum at narrow phone, large phone, tablet portrait, tablet landscape, laptop, and wide desktop widths.
3. Assert that no horizontal page overflow exists unless intentionally designed. Pay special attention to fixed widths, min-width, tables, dialogs, cards, sidebars, and long text.
4. Verify BragStack-owned loading/error UI is shown instead of hosting-provider or raw infrastructure pages whenever the app can control the experience.
5. Test navigation, focus order, keyboard access, labels, contrast-sensitive states, reduced-motion behavior where relevant, and meaningful empty/error copy.
6. Prefer resilient layout primitives: flexible grids, wrapping, max-width containers, minmax(), overflow handling, and content-driven sizing over breakpoint-specific hacks.
7. Add or update automated coverage. Prefer Playwright for route-level behavior and screenshots; use component tests for isolated UI logic.
8. For visually important routes, capture deterministic screenshots at representative mobile/tablet/desktop viewports and fail CI on unexpected diffs after baselines are approved.
9. Run lint, production build, and relevant tests on the exact branch head.
10. Do not approve merge if the bug is fixed at one viewport by breaking another.

## Required output

Report:

- affected routes/states
- viewport matrix tested
- overflow/accessibility findings
- automated tests added or updated
- build/test results
- remaining visual risk, if any

## Final checks

- no clipped content on the right edge
- no accidental horizontal scroll
- no provider-branded loading/error screen in controllable app flows
- touch targets remain usable
- loading, empty, error, and success states all render intentionally
- screenshots are stable and contain no secrets or user-specific data
