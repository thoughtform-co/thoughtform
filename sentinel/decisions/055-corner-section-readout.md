# ADR-055: The journey indicator moves into the nav corner

**Date:** 2026-07-28
**Status:** Accepted
**Scope:** `components/landing/v7/HudNav.tsx` (the readout + decode + drawer
a11y), `components/landing/v7/hooks/useActiveSection.ts` (new),
`lib/rail-manifest/sectionLabel.ts` (new), the `.hud__nav` block in
`components/landing/v7/landing.css`, and the retirement of
`components/landing/home-v2/CorridorSectionMenu.tsx` + its CSS +
`lib/home-v2/terminalReveal.ts`.

**Supersedes** ADR-031 Updates 12, 13, 14, 15, 17, 18, 19 and 21 — the
terminal-tree section menu and its whole refinement arc. Update 20 (the
desktop diamond hide) is KEPT, for a new reason (below). Update 2 ("the
13-tick ladder always stays") and Update 16 rev c (the hero-curtain clip)
are untouched.

## Context

The journey indicator lived along the page edges: section names in a reel
on the LEFT, the Arc's subsections mirrored on the RIGHT
(`CorridorSectionMenu`, ADR-031 U12–U21). Both were gated
`@media (max-width: 1100px), (max-height: 759px) { display: none }`.

Owner, 2026-07-28: _"it works if you have a wide screen. If you have a
MacBook Air, it's not really working out, let alone on mobile."_

The gate is the whole problem. Below it there was **no journey indicator
at all** — the reels are hidden, `[data-rail-manifest-root]` is hidden
≤1100px, and `.hud__rail` disappears ≤960px. The site told you where you
were exactly where there was room to spare, and went silent on the
viewports where orientation is hardest. Widening the reels was not the
fix: they are two vertical columns flanking an editorial band that is
already `--band-max` wide, so on a 1440×900 laptop they crowd the reading
column that matters.

## Decision

**The section title moves to the top-right corner, and it IS the nav
trigger.** Subsections are dropped entirely.

### 1. One control, two jobs

The corner already held the nav. Rather than add a readout beside it, the
readout became the button's face: the label names where you are, pressing
it opens where you can go. One `<button>`, so `aria-expanded` /
`aria-controls` / the accessible name stay on the element that actually
discloses something — a separate title element would have meant either a
second button for one disclosure, or a title that looks pressable and is
not.

This was also forced by a fact worth recording: **below 960px the corner
nav is the site's only navigation affordance.** Removing the hamburger
outright (the first reading of the instruction) would have left mobile
with no way to skip ahead at all.

### 2. The corner is the only slot that survives every viewport

`.hud-nav-overlay` is `position: fixed`, sits at `z 60` OUTSIDE `.hud`,
and carries no `clip-path` — the ADR-031 U16 hero curtain clips only
`.hud__rail`, `.hud__corner--tl` and `.hud__corner--br`. So the readout
needs no curtain choreography, and there is no viewport at which the
corner is empty.

### 3. Three states on the EXISTING 50vh threshold

| scroll    | ≥641px                          | ≤640px                          |
| --------- | ------------------------------- | ------------------------------- |
| hero      | inline links (unchanged)        | bars                            |
| past 50vh | **section readout** (= trigger) | **section readout** (= trigger) |

The hero keeps its inline links — they are a deliberate composition
element (ADR-043 aligned the hero IPA block's right edge to this overlay).
The morph that used to read _links → hamburger_ now reads _links → title_,
on the same `is-collapsed` class, the same threshold, and the same writer.

**`.bars` stay in the DOM** as the trigger wherever the readout is
suppressed: below 641px before the collapse (where the reader is still in
the hero and a section name would name a section they have not reached),
and on `/claude-workshop`.

### 4. The Arc reads as ONE section

Dropping subsections means the corridor's four phases — thesis, navigate,
encode, build — all resolve to `THE ARC`. Three reasons:

1. The owner's instruction was explicit: no Navigate/Encode/Build readout.
   A beat-granular corner readout is that readout under another name.
2. `CorridorStationHeaders` already paints NAVIGATE / ENCODE / BUILD as
   full-scale editorial titles on the canvas. A 12px corner echo of a
   90px word is redundant; the corner's complementary job is _where in
   the journey_, not _which beat_.
3. It makes the hero→corridor seam **provably** flicker-free.
   `resolveActiveIdx` crosses hero → thesis → navigate there, all three
   map to one string, and `queueScramble` no-ops when the incoming text
   equals the current — so no decode can fire on a seam the reader
   experiences as one continuous move. Unit-pinned in
   `tests/lib/section-label.test.ts`.

Hero maps to the Arc label too: the readout only appears past the
collapse, by which point the Arc is what the reader is entering. The
label is never empty, because it is also the trigger's visible name.

### 5. No new scroll writer

`useActiveSection` lifts the retired menu's wake recipe verbatim: a
`MutationObserver` on `<html>` filtered to `ACTIVE_IDX_ATTRIBUTES`, plus a
passive rAF-coalesced scroll listener gated on `idx <= LAST_CORRIDOR_IDX`
— needed only for `resolveActiveIdx`'s geometric seam-gap rule. The
writers stay `useLandingScroll` / `useDepthScroll` /
`CorridorStationHeaders` (ADR-002). The menu additionally watched inside
`#services` / `#proof` to track subsections; that half of the gate retired
with them.

State is keyed on the readout's ROW id, not the manifest index, so the
corridor's four beats settle as one state and the seam costs zero
re-renders.

### 6. The decode

`captionScramble`, driven by a local self-terminating rAF — the corridor
caption-card recipe (`CorridorStationHeaders` re-queues its kicker /
callsign / status the same way on every dominant-station change).

`terminalReveal.scrambleText` — the kernel the retired menu used — is
**not** usable here and is deleted with it: it captures `textContent` at
call time and force-writes it back on cleanup, which is safe only on
constant text. That is exactly the ADR-031 Update 21 bug ("the left menu
is missing About; Arc is shown twice"). `captionScramble` reads `from`
live off the element, splices any existing job for that node, no-ops when
unchanged, and resolves characters past the incoming length to `""` so a
longer label contracts cleanly.

**Invariant:** `.hud__nav__sector__name` is rendered by React with **zero
children** and written only imperatively. If it is ever given a child,
React's commit and the rAF fight over the same text node — and worse, the
decode silently stops firing, because React commits the new label before
the effect runs and `queueScramble` then sees `from === to`.

The accessible name lives in a separate React-rendered `.visually-hidden`
span, so assistive tech never reads a scrambled frame, and the button's
accessible name contains its visible label (WCAG 2.5.3 label-in-name).

### 7. A11y debts paid in passing

The drawer was `opacity: 0; pointer-events: none` only, so its three links
sat in the tab order behind a closed menu. It is now `inert` when closed,
focus returns to the trigger on Escape and on activating a link, and
`role="menu"` / `role="menuitem"` are dropped — this is a disclosure
revealing links, not an application menu, and that role promised
arrow-key roving focus that never existed.

## Consequences

- **The desktop rail diamond stays hidden** (ADR-031 U20), for a new
  reason. It was hidden _because the menu was the desktop indicator_;
  that rationale died with the menu, but the corner readout now serves
  every viewport, so restoring a second marker would duplicate it. On
  desktop the left rail reads as the 13-tick ladder alone; below the gate
  the diamond is still the rail's marker, controller untouched.
- **`/claude-workshop` keeps the bars.** The readout resolves from
  `MANIFEST_ENTRIES` (the production journey) and that route's station
  order differs — `data-active-station` reads "about" from its second
  section onward. It inherits the suppression the menu carried there for
  the identical reason; same button, same drawer, no claim about position.
- **`PROOF_SUBS` and its lockstep test retire** (ADR-054's deliberate
  duplicate of `caseBeatMenu`). With subsections gone there is no
  duplicate to keep honest. `caseBeatMenu` stays — the shape test is a
  registry data guard in its own right.
- **The dead ancestor is swept.** `useLandingScroll`'s `SECTORS` map and
  its `#hudSector` / `#hudProgress` / `#coordD` / `#coordT` writes, and
  `useDepthScroll`'s `sectorForBeat` write, are deleted: none of those
  elements exist in the parsed prototype (they live only inside its own
  inert `<script>`), so every one was a per-frame DOM query for nothing.
  `#depthIndicator` IS real markup and its write survives.
  `SECTOR_LABELS` in `corridorMap.ts` is now unconsumed but left in place
  as part of that declarative map.
- **The two labs** (`services-anchor-lab`, `services-card-face-lab`) lose
  the menu they mounted for ambient chrome parity. Neither measured it.
- **`/arcs` is untouched and is the open follow-up.** `ArcMenu` is a copy
  of this grammar with the same 1101×760 gate and therefore the same
  complaint; it is now the sole owner of the reel. Porting the corner
  readout there was deliberately left as a separate decision — deck pages
  may genuinely want a table of contents.
- **Bundle:** net negative. One MutationObserver + one gated scroll
  listener + one self-terminating rAF replace the menu's identical pair
  plus its `SERVICES` / `servicesRingProgressRef` imports and ~40
  always-mounted reel nodes. `captionScramble` was already in the
  landing's First Load JS (`LandingPage` uses it for the hero headline).

## Verified

Headless Playwright against the live dev server, 1512×900 / 390×844:

- Hero: readout blank and `opacity: 0`; bars shown ≤640px, hidden above.
- Past 50vh: `THE ARC`, and `.hud__brand.is-collapsed` still toggles —
  the ADR-043 wordmark dock survives (the highest-consequence silent
  regression in this change).
- The full journey reads `THE ARC → SERVICES → ABOUT → PROOF → PRACTICE →
CONTACT` with indices `01/06 … 06/06`.
- The decode fires per change, caught mid-flight:
  `LKM8SRC` → `SERA4LH9` → `SERVICE1` → `SERVICES`.
- `THE ARC` holds through the corridor INCLUDING its dissipate, flipping
  to `SERVICES` when the corridor disengages (~1.6k px into the services
  runway, ~200px after the masthead's own arrival — they read as one
  handover).
- Drawer: `aria-expanded` flips, `inert` toggles, Escape closes and
  returns focus to the trigger.
- Reduced motion: no scramble, text assigned directly.
- `/claude-workshop`: bars shown, readout suppressed, drawer unaffected.
- 364 unit tests green; typecheck and lint clean.
