# ADR-039: Hero CSS-only first-paint reveal — mobile-LCP lever (flag-gated prototype)

**Status:** Proposed — PROTOTYPE behind a flag, OFF by default. Requires owner
(Vince) visual sign-off before it becomes the default path. This is brand motion
language, not a mechanical perf tweak.
**Date:** 2026-07-14
**Context:** Phase 4 device-hardening. The 2026-07-14 sweep left mobile LCP
~7.9 s as the single largest remaining visitor-facing cost.

## Context

The landing's entrance motion is the `[data-m]` reveal system (`landing.css` +
`useRevealMotion`): every `[data-m]` element starts hidden (`opacity: 0` plus a
role-specific transform / clip-path) and is revealed by adding `.is-in`, which
`useRevealMotion` does from a **post-hydration `useEffect`** (an IntersectionObserver,
plus an explicit rAF reveal for `.hero [data-m]`).

On mobile this makes the hero paragraph — the **LCP element** — invisible until
hydration. Lighthouse mobile attributes ~93% of LCP to **render-delay**: LCP ≈
hydration time (~7.9 s), because the largest text can't paint until JS runs and
flips `.is-in`. The hero image + fonts already preload (Phase 3); the hero copy
is the bottleneck, and it is gated on JS, not on the network.

## Decision

Reveal the **first-viewport** `[data-m]` elements with a **CSS on-load
animation** instead of the post-hydration JS, so they paint at ~FCP. Ship it
**behind a flag**, OFF by default, for owner sign-off.

**Flag plumbing.** An inline `<head>` script (`app/layout.tsx`) sets
`html[data-hero-css-reveal="1"]` before `<body>` paints, driven by a
`?heroReveal=css` query param (per-URL, same build — the A/B lever) with the
`NEXT_PUBLIC_HERO_CSS_REVEAL` env var as the no-param default. Setting the
attribute in `<head>` (the established theme-script pattern) means the CSS
applies on first paint, before hydration, with no dynamic rendering.

**The reveal (CSS).** Under the flag, `html[data-hero-css-reveal="1"] .hero
[data-m]` runs `@keyframes heroCssReveal` on load. The keyframe defines only the
`to` frame, so the browser's **implicit `from` is each element's own
role-specific hidden state** — the entrance is identical to the `.is-in`
transition (title clip-reveal, eyebrow wipe, body rise), just triggered by the
animation at ~FCP instead of by JS at hydration. `animation-fill-mode: both`
holds the end state. Reduced motion reveals instantly (no animation, no motion).

**No double-fire.** Because the animation's end state equals the `.is-in` end
state and fill holds it, a later `.is-in` is a visual no-op. Belt-and-braces,
`useRevealMotion` **skips its explicit hero rAF reveal** when the flag is
active. Below-the-fold choreography (IntersectionObserver reveals, station
pauses, staggers) is completely unchanged.

## Consequences

### Positive

- Mobile LCP collapses from hydration-bound (~7.9 s) toward FCP — the hero copy
  paints on load. Measured A/B: see the Phase 4 ledger entry.
- Zero effect when the flag is off (default). No dynamic rendering; the inline
  script is a few bytes.

### Negative / open

- The flagged path reveals the first-viewport `[data-m]` elements **together**
  (the JS per-index `--m-i` stagger is set post-hydration, too late for the CSS
  animation). Acceptable for a prototype; a CSS `nth-child` stagger is the
  refinement before this becomes default.
- This is the hero's entrance — **brand motion**. It must be eyeballed by Vince
  in the first second on a real mobile before flipping the default. The
  before/after screenshots + Lighthouse numbers are provided for that review.

## References

- `app/layout.tsx` (flag script), `components/landing/v7/landing.css`
  (`heroCssReveal`), `components/landing/v7/hooks/useRevealMotion.ts` (guard).
- `landing-v7-compositing` skill (the `data-m` reveal contract), `landing-performance`
  skill (this is the "CSS-only first-viewport reveal" open lever it names).
