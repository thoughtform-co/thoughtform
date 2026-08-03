# ADR-060: The hero key visual glitches between themes

**Status:** Accepted · 2026-08-03
**Flag:** `THEME_TOGGLE` (`components/landing/v7/themeToggle.ts`) — the glitch
mounts with the switch that causes it
**Extends:** [ADR-058](058-light-mode-theme.md) Update 2, which gave the hero
two plates. ⚠ It does NOT amend §2's hard cut — see "What this is not"
**Kernel:** `lib/key-visual/themeGlitch.ts` · **Leaf:**
`components/landing/v7/HeroThemeGlitch.tsx`

## Context

ADR-058 Update 2 made the hero key visual theme-dependent: a dark plate and
a light one. The flip between them was a hard cut, which is right for
colour tokens and wrong for a full-bleed painting — the whole top of the
page changes at once, with nothing to explain it.

Owner's ask, and the choice made against three options: _"a cool glitch
effect between the dark mode key visual and the light mode one"_ →
**slice-tear + pixel resolve**, over a calmer pixel dissolve and a louder
CRT-with-channel-ghosting.

## Decision

A canvas is laid over the hero holding the OUTGOING plate, and torn away.

### 1. It masks a cut; it does not perform one

⚠ **§2's hard cut is not amended.** `themeStore.setMode` still writes the
module ref, the `<html>` attribute and localStorage in one synchronous
task, and the CSS still flips in that same task. The hero is already
showing the new plate before the first frame of the effect. The canvas sits
ON TOP of that finished state holding a picture of the old one.

This is what makes the whole thing safe to fail. Every failure path —
plates not warm, reduced motion, hidden tab, scrolled past the hero, no 2D
context — ends in "no canvas", which is exactly the behaviour the site had
before. The effect can never leave the hero in a wrong state, because it
never owns the hero's state.

### 2. The subscriber paints synchronously, and that is the trick

zustand notifies listeners inside `set()`, so a subscriber runs in the same
task as the attribute write — before the browser has painted a single frame
of the flipped hero. The canvas is created, sized and drawn there.

⚠ **Defer any of it and the new plate flashes for one frame** before the
glitch starts, which reads as a bug in the swap rather than a transition.
So: subscribe with `useThemeStore.subscribe`, never a selector hook (React
batches, and the frame is gone by the time a render lands) — which is also
the leaf contract, since `LandingPage` must stay render-stable.

Verified live: sampling in the same task as the click already shows
`data-theme="light"`, the img `display: none`, the light background
present, AND the canvas inserted.

### 3. Choreography lives in a pure kernel

`glitchFrame(plan, elapsedMs)` returns bands — `{y0, y1, source, offsetX,
cell, alpha}` — plus an optional scanline. No DOM, no canvas, no clock. The
controller only maps that to `drawImage` calls.

Three phases: the old plate tears (slice offsets on a sine, so the first
painted frame is the plate exactly as it was), then bands flip to the new
plate on a shuffled rank cascade with the mosaic resolving 24px → the house
3px grid, then a settle releases 3px → native.

⚠ **The `done` frame must be the IDENTITY** — every band new, offset 0,
cell 1, alpha 1 — because the controller removes the canvas the frame
after. End on a 3px mosaic and the hero visibly pops at the exact moment
the effect is meant to have finished, and it looks like a rendering fault,
not a choreography one. Phase three exists only for that, and
`tests/lib/theme-glitch.test.ts` pins it along with the approach to it.

The vocabulary is borrowed, not invented: `GRID = 3` from
`ImageParticleGateway` / `seamPixelize` / the gateway grain, rank stagger
0.4 from `SEAM_RANK_STAGGER`, the `1 − t²` ease-out from the seam field,
gold `176,139,66` and dawn `236,227,214` from the retired
`CorridorSeamPixelField`. The flip order is SHUFFLED — a monotonic order
reads as a wipe, which is the one thing a glitch must not look like.

### 4. Plates warm on INTENT, never on idle

Both plates must be decoded before a flip: the outgoing one has to be
drawable synchronously, and one of the two is never in the DOM (dark does
not fetch the light background; light does not fetch the lazy `display:
none` img).

⚠ **An idle prefetch would hand back exactly the saving ADR-058 Update 2
bought** — every visitor paying 435 kB for the plate they are not looking
at, to serve the minority who toggle. It shipped that way for one round of
measurement, and the network panel is what caught it.

So the controller warms on `pointerenter` / `focusin` / `pointerdown` on
`.theme-toggle` — hovering the switch is the intent signal, and it buys
enough lead on any desktop connection. Touch has no hover, so the first
toggle there usually falls back to the hard cut; after it, both plates are
in the HTTP cache and every toggle plays. Reaching for the switch by class
is deliberate: it lives in a sibling leaf, and threading a ref would mean
`LandingPage` holding state for both.

### 5. Skip conditions

Reduced motion (one-shot `matchMedia`, the LandingPage precedent), hidden
document, and `scrollY >= innerHeight` — past the curtain `useLandingScroll`
sets the hero `visibility: hidden`, so glitching it is pure cost.

A re-toggle mid-run **stops** rather than restarting. Snapshotting the
canvas as the new outgoing plate would compound mosaic on mosaic, and the
CSS underneath is already correct — so tearing down is both simpler and
more honest.

## The traps

- **`.hero__bg` is inside the `[data-parallax]` translate channel.** The
  canvas is a child of it, so it rides the same drift as the plates it
  covers. Adding a transform here desyncs it from them (landing.css warns
  against a second transform channel on the same element).
- **Insert BEFORE `.hero__video__overlay`.** The scrim gradients must stay
  above the effect exactly as they sit above the plates.
- **`Image()` gets no `<picture>` negotiation.** A script-created image for
  the dark plate must fall back to the WebP itself, or the glitch silently
  skips for precisely the users whose hero is the fallback.
- **DPR capped at 2.** Two full-bleed plates at DPR 3 is ~50 MB of canvas
  for a 640 ms effect — the same cap the retired seam field used.
- **`-0` is not `0`.** A negative tear at zero gain produces `-0`, which
  draws identically but fails `Object.is(x, 0)` and reverses `1/x`. The
  kernel normalises it so the rest state stays canonical.

## Verifying

`npx vitest run tests/lib/theme-glitch.test.ts` is the guard on the end
state. Live: toggle both directions at 1440×900 on `/` and
`/claude-workshop`, sampling in the same task as the click (the canvas must
already be there), then confirm it is gone by ~900 ms. With reduced motion
on, no canvas should ever appear.

⚠ The hero must be ON SCREEN — the effect deliberately skips past the
curtain, so a test that scrolls first will see nothing and look broken.

## Rollback

`THEME_TOGGLE = false` unmounts it with the switch. Deleting
`<HeroThemeGlitch />` from `LandingPage` alone is also safe and total: the
CSS swap is independent, and the result is the hard cut.
