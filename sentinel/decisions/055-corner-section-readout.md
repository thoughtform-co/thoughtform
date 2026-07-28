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

---

## Update 1 — one type ramp for the corner (2026-07-28, owner)

Owner: _"harmonize the font size of the nav bar items; in the hero it's
very big and then when it collapses it's much smaller."_

The two states were sized independently, and only one of them was fluid:

|               | before                                | after                                                               |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| hero links    | `clamp(16px, 0.85rem + 0.78vw, 30px)` | `var(--nav-link-size)` = `clamp(15px, 0.7rem + 0.44vw, 22px)`       |
| readout name  | fixed `12.5px`                        | `var(--nav-readout-size)` = `clamp(11.5px, 0.53rem + 0.32vw, 16px)` |
| readout index | fixed `9px`                           | `max(8.5px, 0.66em)`                                                |

Because the links scaled and the readout did not, **the mismatch widened
with the viewport**: 1.28× at 640px but 2.4× at 1920px, where the collapse
stopped reading as one control changing form and started reading as a swap
between two different objects.

Both rungs are now `--nav-*` custom properties on `.hud__nav`, so the pair
holds a **perfect fourth (~1.33)** at every width — measured 1.34 across
the fluid range, 1.30 at the floor, 1.38 at the ceiling. The links came
down and the readout came up, per the owner's "middle ground": at 1938px
that is 30 → 19.7 and 12.5 → 14.7.

Details worth keeping:

- The readout sizes from `.hud__nav__sector`, and its index and gap are
  **em-based** (`0.66em`, `0.62em`) — an internally proportional cluster
  rather than three unrelated pixel values.
- The index carries a `max(8.5px, …)` floor. Pure proportional scaling put
  it at 7.6px on phones, below the legibility limit for tracked mono caps.
- The drawer rows (`.hud__nav a`, 11px) were left alone: they already sit
  roughly one further step down, so the corner reads as three rungs of one
  scale. They flatten against the readout below ~900px (1.05×), which is
  acceptable — the drawer only exists while open, and both are compact
  chrome at that size.
- The Brand Codex "Hero Omega" ~30px nav scale is superseded here. It was
  competing with the hero headline and left the collapsed state nowhere
  to land.

---

## Update 2 — subsections return, as a path (2026-07-28, owner)

Owner: _"Can't we style subsections like this — `navigate // THE ARC`"._

The base decision dropped subsections ("for now", in the instruction that
prompted it). They return here in a form the reels could not offer: a
**path**, not a register. One line, two ranks.

```
navigate // THE ARC        03/06  ABOUT
```

**Why this earns its place where the reel did not.** The Arc is ~8
viewports of scrolling during which the readout said `THE ARC` and
nothing else — the longest stretch on the site, and the one place the
corner went dead. The beat makes it live exactly there. Services gets the
same treatment (the four verbs, `advisory // SERVICES` …), so both
multi-beat sections read the same way.

### One slot, two contents

The subsection takes the DETAIL slot the position index occupies —
`navigate //` where a section has a beat, `03/06` where it does not. They
share **one element** on purpose: the swap is then a plain decode between
two strings, so nothing can flicker between two forms mid-transition, and
the `//` decodes away with the word that earned it. `readoutDetail()`
composes it; the `//` is carried IN the string rather than as its own
styled node, for the same reason.

Both slots ride one jobs array and one rAF, so the subsection and the
section resolve on the same beat instead of racing.

### Type — `ENCODE // THE ARC`

**All caps, `max(8.5px, 0.75em)`, `--track-widest`, `--dawn-40`.** Both
ranks in caps, so the corner speaks in one instrument register; hierarchy
rests on SIZE and INK.

That size is not a free choice — it is the corner's own perfect-fourth
ramp, one rung below the name exactly as the name sits below the hero
links. The ladder now reads 22 → 16 → 12 at the ceiling (links → name →
detail), with the drawer rows just under it, and the ratios hold at every
width (1.34 / 1.33 measured).

Two passes got here, and both are worth keeping on record because they
are the same lesson from opposite sides:

1. **Shipped lowercase at `0.7em`** — inheriting the numeric index's
   step-down. Owner: "too small". A lowercase word shows ~30% less
   visible height than caps at equal nominal size (PT Mono x-height
   ~0.53em against a ~0.7em cap-height), so it measured a third smaller
   but READ as nearly half. Fine for `03/06`, a coordinate you glance at;
   wrong for `NAVIGATE`, a word you read.
2. **Corrected to `0.85em`, then the case changed.** That value existed
   only to compensate for lowercase optics. With both ranks in caps the
   nominal ratio IS the optical one, so holding 0.85em would have left
   the two nearly the same size — hence the drop to the ramp's 0.75em.

Tracking moved with the case: `--track-wide` while lowercase (wide
tracking mushes lowercase letterforms), back to `--track-widest` in caps,
which is the house's small-mono chrome grammar — the rails and survey
designations read the same way.

⚠ **`text-transform: uppercase` is DECLARED on the slot, not inherited.**
`.hud__nav` sets it, but the trigger `<button>` sits between them and UA
stylesheets give form controls their own `text-transform: none`, which
breaks the chain. Removing the lowercase override therefore did NOT yield
caps — it yielded the raw lowercase state string. (The section name is
immune: `sectionLabel` uppercases it in JS. The sub deliberately stays
lowercase in state so the accessible name reads as words, and is cased in
CSS.)

### Where the subs come from

- **The Arc:** free. `resolveActiveIdx` already resolves
  `data-corridor-phase` into its own manifest entry, so the beat is that
  entry's `corridorPhase` — no second attribute read, and `thesis` falls
  out as "no sub" on its own (it is a phase, not a beat — the retired
  menu drew the same line).
- **Services:** the ring's front card, via
  `activeServiceForProgress(servicesRingProgressRef…)`. That value moves
  on SCROLL with no attribute mutation, so the hook's scroll listener
  gate widens to `idx <= LAST_CORRIDOR_IDX || idx === SERVICES_IDX` —
  the retired menu's `watch` expression exactly. Both modules are
  three-free on purpose, so this cannot drag the WebGL stack into the
  landing's First Load JS. Print `verb`, never `id`: they deliberately do
  not match (`serviceData.ts`).
- **`#proof`** was considered and left out. Its beats need a rect scan
  and would re-create the beat register ADR-054's rule now forbids.

Still no new scroll writer. The accessible name carries the sub too
(`current section: THE ARC, navigate`).

**Verified** on the live corridor, settled at each beat: `navigate //
THE ARC` → `encode //` → `build //` → `advisory // SERVICES` →
`embedded //` → `keynote //` → `workshop //` → `03/06 ABOUT` →
`04/06 PROOF` → `05/06 PRACTICE` → `06/06 CONTACT`. 365 unit tests green;
typecheck, lint and a production build clean.
