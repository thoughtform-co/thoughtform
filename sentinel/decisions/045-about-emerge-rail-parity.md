# ADR-045: About emerge sequence + rail parity (parallax retired)

**Date:** 2026-07-16
**Status:** Accepted; the DESKTOP emerge is superseded by
[ADR-047](047-about-deck-flip-stage.md) (same day) — on the capable path
`#about` is now the pinned deck-flip stage and the static `.voidwalker`
block (with this ADR's emerge choreography, particle-halo fix, portrait
role, and rail parity) is the mobile / reduced-motion / WebGL-fallback /
flag-off surface. Everything below remains live on that fallback path.
**Scope:** `components/landing/v7/LandingPage.tsx` (voidwalker tagging block +
parallax entry removed), `public/prototypes/v7/landing-v7-motion.html`
(authored `data-m` attrs on the about block, `<style>` mirror, inline-JS
scroll fallback), `components/landing/v7/landing.css` (`--rail-inset` token,
`portrait` role, portrait centering, emerge choreography, particle-halo fix,
desktop parity block), `components/landing/home-v2/services/services.css`
(`--masthead-inset` consumes the shared token).
Amends ADR-044 (token promotion) and the ADR-018-era about composition.

## Context

`#about` kept its earliest corridor-era composition: a centered
`max-width: 1180px` grid floating mid-viewport, with the right-side portrait
cluster (`.voidwalker__orbit`) riding a `data-parallax="0.06"` translate —
the whole cluster drifted ~±42px against the bio column while scrolling.
The owner rejected the drift ("no parallax scroll-over — the portrait card
emerges, then the diagrams surround it") and asked for structural parity
with the ADR-044 services masthead (same left/right text edges).

Pre-existing defects found and fixed in passing:

- The 12-dot particle halo was **invisible since authoring**: the spans'
  `translateY(calc(var(--r) * -1))` resolved the percentage against the
  span's own 3px height, so every dot sat ~1.4px from center, hidden behind
  the portrait.
- Chrome clips IntersectionObserver geometry by the **target's own
  `clip-path`** (intersection rect collapses to a zero-height strip), so
  fully-clipped hidden roles (`title`, `eyebrow`, now `portrait`) never
  cross the 0.12 area threshold — the production scroll fallback in
  `useRevealMotion` is what actually reveals them. The standalone prototype
  had no such fallback: 44 elements (every `title` on the page) stayed
  permanently hidden once scrolled past.

## Decision

1. **Parallax retired; emerge is authored markup.** The
   `.voidwalker__orbit` parallax entry and the whole JS tagging block are
   deleted from `LandingPage.tsx`; the about block in the prototype HTML now
   carries authored attrs: `.voidwalker` `data-m-group`, `.voidwalker__copy`
   `data-m="body"`, `.voidwalker__orbit` `data-m-group` **only** (the
   container must never hide as a unit), labels `data-m="eyebrow"`, svg
   `data-m="instrument"`, particles `data-m="fade"`, portrait
   `data-m="portrait"` (new role).

2. **Emerge choreography** (landing.css, after the voidwalker block):
   portrait at delay 0 (title-grade rise + top-down clip wipe, 880ms) →
   svg at 6×`--m-stagger` → particles at 8× → labels at
   `(9 + --m-i)×` sweeping tl→tr→bl→br (right-side labels wipe from the
   right via `inset(0 0 0 100%)`). **Hidden-state overrides stay ≤ (0,2,0)
   specificity** so the generic `[data-m][data-m].is-in` reveal (0,3,0)
   always wins — never `#about`-scope them. The reduced-motion collapse
   targets `[data-m]` generically, so the new role flattens automatically.

3. **Portrait centering moved off the transform channel**:
   `inset: 0; margin: auto` (+ definite width + aspect-ratio) replaces
   `left/top: 50% + translate(-50%,-50%)`. The reveal writes `transform`
   on `.is-in` and PRM writes `transform: none !important`; either would
   have thrown a transform-centered portrait off-center. Rule: **an element
   that takes a `data-m` role must not center via transform.**

4. **Rail parity via a shared token.** `--rail-inset:
calc(var(--hud-margin) + 8vw)` is promoted to `landing.css :root`;
   `--masthead-inset` (services.css) consumes it with the original calc as
   fallback (standalone labs keep working). The masthead's effective
   viewport inset is **two layers**: the station's generic
   `--hud-content-inset` padding + `--masthead-inset`. `#about` therefore
   keeps its station padding untouched and pulls the `.voidwalker` grid a
   further `margin-inline: var(--rail-inset)` inboard with
   `justify-content: space-between; max-width: none` — measured exact
   (0px delta) against `.services-masthead__lead/__intro` at 1968w.
   Scoped `@media (min-width: 961px)`; the ≤960px centered stack
   (2026-07-15 decision) is byte-untouched.

5. **Particle halo geometry fixed**: each span is now a rotated diameter
   arm (`height: calc(var(--r) * 2)`, centered, `rotate(var(--a))`) with
   the dot on its top tip via `::before` — the authored `--a`/`--r` values
   are unchanged and now actually produce the halo.

6. **Prototype parity**: the `<style>` mirror carries the centering
   refactor, `portrait` role, and choreography; the inline reveal JS gains
   the production-style rAF scroll fallback (detaches when everything has
   revealed). Production ignores injected `<script>` (innerHTML never
   executes it), so this is standalone-only behavior.

## Consequences

- The about beat is now: opaque cover arrives → portrait clip-wipes in →
  rings/halo/readouts materialize around it (~1.3s total) → everything
  sits welded (no drift). Reverse scroll does not replay (IO one-shot,
  consistent with every other station).
- The `.about__stats` selector in `LandingPage.tsx`'s tagging array and the
  prototype's `.about__dial` tagging block are dead code from the retired
  dial design — left in place (no-op), janitorial candidates.
- Any future station that wants the masthead's text edges should compose
  the same two layers (station padding + `--rail-inset`), not invent a
  third inset.
- Chrome's clip-path-aware IO means **clipped hidden states reveal via the
  scroll fallback, not the observer** — a new `data-m` role with a fully
  clipping hidden state is fine in production but needs the fallback
  wherever the reveal JS is reimplemented (the prototype now has one).

## Update (2026-07-17) — the parity formula is band-derived (ADR-048)

§4's formula `--rail-inset: calc(var(--hud-margin) + 8vw)` is superseded by
the [ADR-048](048-editorial-band.md) editorial-band derivation:
`calc(var(--band-margin) − var(--hud-content-inset))`, i.e. 0 below the
~1503px cap crossover (the grids then span the full station content box,
hero-edge-aligned) and band-centering above it. The **two-layer composition
contract stands unchanged** — station padding + `--rail-inset`, "compose
the same two layers, never invent a third inset" — the band system IS that
composition, now capped. The services.css `--masthead-inset` fallback calc
deliberately keeps the pre-band formula (standalone-harness path).
