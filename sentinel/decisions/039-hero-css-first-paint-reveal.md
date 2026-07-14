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
[data-m]` paints **opaque from the first frame** and enters with a
**transform-only** rise (`@keyframes heroCssReveal` defines only the `to`
frame; the implicit `from` is the role's rise offset). `opacity`, `clip-path`
and `filter` are forced to their revealed values up front. Reduced motion
reveals instantly (no animation, no motion).

**Why transform-only (both alternatives measured on the prod build):**

1. _Full-choreography CSS reveal_ (animating the role's clip-wipe/filter):
   clip-path/filter animations are **main-thread**, and hydration jams the main
   thread exactly when the paint is needed. LCP stayed ~9.6 s.
2. _Composited fade_ (opacity+transform, from opacity 0): visually perfect —
   screenshots show the headline fully painted at 700 ms under 4× CPU throttle
   vs MISSING without the flag — but LCP **still** ~9.6 s, because Chrome
   **excludes opacity-0 paints from LCP** and a compositor-driven fade produces
   no new main-thread paint records; the h1's next recorded paint is the
   hydration re-render. Any fade-from-zero on the LCP element structurally pins
   the metric to hydration.

Hence: opaque first paint + rise. On first load the hero trades its fade /
clip-wipe entrance for a pure rise — below-the-fold choreography unchanged.

**No double-fire.** Because the animation's end state equals the `.is-in` end
state and fill holds it, a later `.is-in` is a visual no-op. Belt-and-braces,
`useRevealMotion` **skips its explicit hero rAF reveal** when the flag is
active. Below-the-fold choreography (IntersectionObserver reveals, station
pauses, staggers) is completely unchanged.

## What the A/B actually measured (read before trusting any LCP number)

Three methods, prod build (`.next-verify`, localhost:3014), mobile emulation:

| Method                                                | Flag OFF             | Flag ON              | Verdict                             |
| ----------------------------------------------------- | -------------------- | -------------------- | ----------------------------------- |
| Screenshots @700 ms, 4× CPU throttle                  | headline **MISSING** | headline **painted** | the real user-visible win           |
| Real Chrome LCP entries (PerformanceObserver, 4× CPU) | H1 @ **292 ms**      | H1 @ **236 ms**      | metric already early in BOTH states |
| Lighthouse simulated (lantern, mobile)                | LCP 9.6 s            | LCP 9.5 s            | artifact — doesn't move             |
| Lighthouse devtools-throttled                         | LCP = FCP 3.5 s      | LCP = FCP 3.6 s      | network-bound on this machine       |

Two findings that reframe the premise:

1. **This Chromium records the H1's LCP entry at first paint even at
   `opacity: 0`** (flag OFF: entry at 292 ms while the headline is invisible
   until hydration — the 700 ms screenshot proves it). So field LCP was likely
   never actually pinned by the reveal; the sweep's "mobile LCP 7.9 s at 93%
   render-delay, hydration+reveal-gated" reading came from **lantern**, whose
   pessimistic text-LCP graph chains the JS bundle into the estimate — which is
   also why lantern reports ~9.5 s in BOTH flag states here.
2. **The user-visible problem is real regardless of the metric:** without the
   flag the hero headline IS invisible until hydration (seconds on a throttled
   device). The flag fixes what users see; no lab LCP method credits it.

A/B screenshots for the owner review: `assets-staging/hero-reveal-ab/`
(gitignored, like `hero-candidates/`).

## Consequences

### Positive

- The hero headline paints at ~FCP instead of at hydration — screenshot-proven
  under 4× CPU throttle. On a real mid-range phone this is seconds of
  perceived-paint win on the most important element of the page.
- Zero effect when the flag is off (default). No dynamic rendering; the inline
  script is a few bytes.

### Negative / open

- The flagged path reveals the first-viewport `[data-m]` elements **together**
  (the JS per-index `--m-i` stagger is set post-hydration, too late for the CSS
  animation). Acceptable for a prototype; a CSS `nth-child` stagger is the
  refinement before this becomes default.
- On first load the hero enters with a pure rise — no fade, no clip-wipe (the
  measured constraints above rule those out). This is the hero's entrance —
  **brand motion**. It must be eyeballed by Vince on a real mobile before
  flipping the default; the A/B screenshots are staged for that review.
- Lab Lighthouse will NOT credit the change (see the measurement table) — the
  evidence for the win is the screenshots + real paint entries, not the lab
  LCP number. Field (CrUX) LCP was likely early already.

## References

- `app/layout.tsx` (flag script), `components/landing/v7/landing.css`
  (`heroCssReveal`), `components/landing/v7/hooks/useRevealMotion.ts` (guard).
- `landing-v7-compositing` skill (the `data-m` reveal contract), `landing-performance`
  skill (this is the "CSS-only first-viewport reveal" open lever it names).
