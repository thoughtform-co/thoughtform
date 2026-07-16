# ADR-043: Wordmark moves to the bottom-left corner

**Date:** 2026-07-16
**Status:** Accepted
**Scope:** `components/landing/v7/landing.css` (`.hud__brand`, `.hud__rail`,
`.hero__flywheel--ipa`), `public/prototypes/v7/landing-v7-motion.html`
(`.hud` corner markup), `/claude-workshop` (inherits via shared CSS).
Origin lab: `app/(internal)/test/services-wordmark/`.

## Context

Section titles want to live in the top band, aligned to the left rail
(the Linear-style masthead validated in `/test/services-wordmark`), but
the top-left corner was owned by the wordmark lockup (`.hud__brand`) —
a big-title experiment there previously died because it **competed with
the wordmark** (owner, 2026-07-16). The lab tested the fix: relocate the
wordmark to the bottom-left, freeing the top band.

De-risking established the bottom-left corner is functionally empty:

- `#hudBrandmark` (the sigil dock) is **vestigial** — nothing toggles
  `.is-visible`, its `<img>` children are hard-hidden, and the current
  brandmark journey's keyframes are the five `data-brand-anchor` slots;
  the bottom-left slot is not one of them.
- The BL bracket's border-fade trigger (`.hud--brandmark-active`) is
  never applied by any JS — a dead rule from the retired ADR-010/012
  dock choreography.
- Nothing in `lib/v7-parse/` or the test suite pins the `.hud` corner /
  brand markup (only `data-brand-anchor` slots and the rail shells).

## Decision

1. **`.hud__brand` anchors bottom-left** (`bottom: var(--hud-margin)`,
   `left` unchanged), `transform-origin: bottom left` so the scroll
   collapse stays pinned in its corner. Same width, z-index, trigger.
2. **The wordmark's corner carries no bracket** — the rule follows the
   wordmark: the BL bracket div is removed from the prototype markup and
   the **top-left bracket is restored** (`.hud__corner--tl`, whose CSS
   always existed). `.hud__corner--bl` CSS stays (the workshop prototype
   markup isn't edited and may keep its own corners).
3. **Collapse scale 0.82 → 0.68** — once scrolled, the wordmark reads as
   a quiet signature, not a nav element (owner: "even smaller").
4. **The hero pronunciation line (`.hero__flywheel--ipa`) mirrors to the
   bottom-RIGHT** (`left: auto; right: var(--hud-content-inset)`, with
   28px/32px mirrors in the ≤640/≤960 blocks) — the bottom-left gutter
   now belongs to the wordmark.
5. **Rail bottom clearance budgets the lockup**: the sigil-height term
   `clamp(24px, 2.5vw, 40px)` in `.hud__rail`'s `bottom` calc becomes
   `clamp(44px, 3.6vw, 63px)` (the lockup's rendered height at its
   ~300:126 aspect), preserving the ~26-32px breathing gap between the
   rails' lowest ticks and the mark.
6. **`#hudBrandmark` stays in the DOM untouched** (inert). Removing the
   dead dock machinery is separate cleanup, not part of this move.

## Consequences

- `/claude-workshop` imports the same `landing.css` but its prototype
  markup carries **no `.hud__brand` element** (verified live), so no
  wordmark moves there; the only inherited change is the rail-bottom
  budget (rails end ~20px higher — cosmetic). Its own TL+BL brackets
  are authored in its own prototype HTML and are unchanged.
- `tests/visual/landing-page.spec.ts` screenshots `.hud__corner--tl`;
  restoring the element revives that snapshot — a visual-baseline update
  is expected fallout, not a regression.
- The top band is now clear for rail-aligned section mastheads (the
  Linear-register direction explored in `/test/services-wordmark`; its
  right-rail-paragraph question remains open under ADR-031).
