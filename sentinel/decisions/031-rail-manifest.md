# ADR-031: Rail Manifest — the left rail becomes a module backplane

**Date:** 2026-07-12
**Status:** Accepted
**Scope:** `lib/rail-manifest/**`, `lib/v7-parse/railManifest.ts`,
`components/landing/v7/RailManifest.tsx`,
`components/landing/v7/landing.css` (left-rail block),
`public/prototypes/v7/landing-v7-motion.html` (left-rail shell),
`app/(internal)/test/rail-manifest-lab/**`,
`tests/lib/rail-manifest.test.ts`.
Supersedes the ADR-030 Update 1 rail station label and its Update 3
corridor mapping (`RailStationLabel.tsx`, deleted).

## Context

The original request (owner, 2026-07-12): when scrolling from Services
into Tools, the service cards should "collapse in a small layered icon
… like a module that's plugged in the interface." During design review
the owner enlarged it: the Arcs should also be "plugged in", it belongs
on the **left** rail, and the rail should show **previous and upcoming
sections, with only the active one highlighted** — without visual
clutter ("don't wanna clutter our interface" — the binding constraint).

Prior art this builds on / replaces:

- **ADR-030 Update 1** made the rails load-bearing interface and added
  `RailStationLabel` — a single active-station identity docked mid-left-rail.
  The manifest is that idea completed: the whole journey, not one label.
- **ADR-030 Updates 1–3** tried and **retired** a viewport-crossing FLIP
  (`ServicesExitPills`, deleted in `2f9e673`): verb chips flying from
  card rects to the rail read as detached ornament. That rejection is
  load-bearing here — the manifest never flies anything across the
  viewport. The collapse↔seat connection is **shared timing** (the same
  `data-active-station` flip the header type-on and register handover
  key off) plus a register-line confirmation.
- **ADR-021/018**: the production page strips the authored definition/
  missing-layer/intelligence-layer/approach/buildQuote stations and
  relocates services + tools after the corridor mount — so the authored
  `data-screen-label` numbering ("08 Services", "08A Tools", then "05
  Continuum") is **non-monotonic in production order**. A single label
  hides this; a visible ladder would expose it.
- Aesthetic canon (owner references, 2026-07-12): Cyberpunk 2077
  hardware-module monitors, ATC radar rails, phosphor CRT terminals,
  Departure Mono HUD — modules seated in a rack, sockets, one powered
  slot.

## Decision

The left HUD rail's decorative tick ladder and the single station label
are replaced by a **station manifest**: one slot per journey entry
(hero → thesis → arc → services → tools → continuum → practice → build
→ about → contact — production order, both corridor phases included),
each slot a small marker on the rail hairline.

1. **Entry states are a pure function of scroll position.**
   `upcoming` (hollow socket, faint) / `seated` (filled module) /
   `active` (gold; the only entry that materializes its number + name,
   scramble-decoded — exactly the retired label's behavior). Derived
   from one integer `activeIdx` resolved from the existing single-writer
   attributes (`data-active-station`, `data-corridor-engaged`,
   `data-corridor-phase`); reverse scroll reconstructs by construction.

2. **Markers-only numbering.** Sockets and seated modules show NO index
   numbers — only the active entry shows its authored number ("08
   Services"), so the non-monotonic production numbering is never
   visible as a sequence, station corner chrome stays consistent, and
   the rail carries less ink than the 13-tick ladder it replaces.
   Hover may ghost a name in (scramble-in, low opacity).

3. **The services→tools crossing is the hero moment.** The four R3F
   ring cards fold out on the existing scroll-owned exit envelope
   (`exitProgressForRunway` / `exitEnvelope`, untouched); when
   `data-active-station` flips to `tools` — the SAME flip driving the
   tools header type-on and the right-rail register handover
   (`HANDOVER_FADE_S = 0.26`) — a layered-stack glyph (4 offset planes)
   seats into the services slot with a quantized `steps()` snap, gold
   flash, and a short register-line confirm. One clock, three consumers.

4. **Quantized terminal snap, never smooth tweening.** Seat garnish is
   a forward-only, time-boxed `data-just-seated` attribute (~700 ms)
   driving CSS `steps(3)` animation; the state flip itself is instant.
   No FLIP, no viewport-crossing motion (see rejected alternative).

5. **Parse-time skeleton + null-rendering controller.** The manifest
   markup is injected at parse time (`lib/v7-parse/railManifest.ts`,
   the `hudTicks.ts` twin) into an authored
   `<nav id="railManifest" data-rail-manifest-root>` shell, so the rail
   paints on first load with no client reflow. The client
   `RailManifestController` is a **null-rendering component that
   mutates the injected DOM** (the `useLandingScroll` →
   `#depthIndicator` precedent) — **never `createRoot` into
   `[data-rail-manifest-root]`** (it would clobber the server skeleton).
   Event-driven: one MutationObserver on `<html>` + a scroll listener
   active only in the hero/corridor regime; rAF alive only while a
   scramble/garnish runs.

6. **The manifest is navigation, not decoration.** Real
   `<nav aria-label="Page manifest">` with `<button>` entries (full
   `aria-label`s since visible text is marker-only; `aria-current` on
   the active entry). Click smooth-scrolls to the station (corridor
   entries target a tuned fraction of the mount runway). It exists
   wherever the rails exist (>960px) — NOT behind the tools register's
   1101×760 enhanced gate — because it replaces structural chrome;
   only motion degrades under `prefers-reduced-motion`.

7. **Canonical journey data lives in `lib/rail-manifest/entries.ts`**,
   explicitly curated (corridor phases have no station element), with a
   vitest drift-guard asserting the entry order matches the parsed
   production DOM order from `app/(marketing)/page.tsx`'s options.

### Alternatives rejected

- **Viewport-crossing FLIP of cards/pills to the rail** — already tried
  and retired (ADR-030 Updates 1–3); reads as detached ornament and
  fights the instrument metaphor.
- **Docking the services module at the top of the right rail** (the
  original sketch) — the right rail is the section-local register
  (SOURCE BUS / TOOL UNITS); a page-level artifact there muddles the
  division of labor (left = journey, right = section).
- **Sequential renumbering (01–09)** — would desync the manifest from
  visible station corner chrome ("08 SERVICES") or force a site-wide
  renumber; markers-only sidesteps it with less ink.
- **Mirroring authored numbers on every slot** — exposes the
  non-monotonic 01/02/03/08/08A/05… sequence as an apparent bug.

## Consequences

### Positive

- The rail becomes functional navigation with _less_ visual matter than
  the decorative ladder it replaces (10 markers vs 13 ticks + 2 bearing
  labels + 1 floating label).
- Journey state (where you are, what you've passed, what's ahead) is
  legible at a glance — previously invisible.
- The services collapse gains a diegetic payoff (module seats into the
  backplane) without new cross-viewport motion machinery.
- One clock (`data-active-station`) now drives header, register, and
  manifest — no new scroll writers.

### Negative

- ~~The left-rail tick ladder (Brand Codex 13-position contract) no
  longer renders on the home page.~~ **Reversed by Update 2** — the
  ladder was removed in the first ship and the owner immediately
  rejected that ("ALERT ALERT"): the ladder is load-bearing rail
  identity, not clutter. It is fully restored; the manifest seats ON
  its grid. Only the two "2"/"5" depth-gauge bearing numerals are
  suppressed on the home rail (they collide with the services/build
  slot rows and belonged to the retired depth diamond); the workshop
  rail keeps them.
- `RailStationLabel.tsx` is deleted; anything external that keyed off
  `.hud__rail__station` breaks (verified: no other production consumer).
- The prototype HTML's left-rail shell must stay byte-exact for the
  parse-regex to fire (pinned by unit test).

## Updates

### Update 1 — lab decision + production ship (2026-07-12)

The look-dev lab (`app/(internal)/test/rail-manifest-lab/`, three
variants) ran same-day; the owner picked **V2 "Bracketed slots"** —
register brackets `[ · ]` as backplane bays, a seated module as the
chip in its bay. Confirm treatment shipped as the **marker
double-blink** (quieter than the `+SEATED` microline; the lab keeps
both for future comparison). Hover ghost-names shipped ON. The
services glyph paints only while **seated** (in `#services` the cards
are deployed as the ring; the module docks when you cross into
`#tools`) — a deliberate delta from the lab, which painted it for
active too.

Verified live: parse-time skeleton on first paint; corridor
Thesis→Arc resolution; the seam-gap geometric rule; the services
module seating on the `data-active-station → "tools"` flip; reverse
travel unseating (glyph clears); manifest click-nav both directions
(tools ↓ and services ↑, exact landings); `/claude-workshop`
untouched (13-tick ladder, no manifest); unit drift-guard green.

**Lab-learned pattern (Strict Mode + one-shot rAF loops):** a scramble
rAF loop whose handle lives in a persistent `useRef` dies permanently
after a Strict Mode remount if the cleanup cancels the frame without
resetting the ref to 0 — `kick()` sees the stale handle and never
restarts. Fixed in the lab; the production controller is immune by
construction (its loop state is effect-local).

### Update 2 — the tick ladder is restored (2026-07-12, same day)

The first ship removed the left rail's 13-position tick ladder on the
"net less ink" argument. The owner rejected this on sight: **the
ladder is load-bearing rail identity and must never be removed.** The
`#leftTicks` shell is back in the prototype, `injectStaticHudChildren`
fills it as before, and the manifest now COEXISTS with the ladder —
its ten slots seat on tick positions 1–10 with the bracket marker over
each tick's inner end, which is already the accepted composite on the
right rail (register diamonds over tick positions). One yield: the
left ladder's "2"/"5" bearing numerals sit at exactly the
services/build slot rows (33.33% / 66.67%) and are suppressed via
`.hud__rail--l:has(.rail-manifest) .hud__rail__label` — they were
readouts for the retired depth diamond; the workshop rail (no
manifest) keeps them. Anti-clutter accounting corrected: the manifest
is additive ink on the ladder, justified by being functional
navigation, not by replacing anything.

**Guardrail for future passes: "replace the ladder" is a rejected
alternative.** Any redesign of the left rail keeps all 13 ticks.

### Update 3 — rolodex reel replaces the bracket bays (2026-07-12, same day)

The owner rejected the shipped bracket-bay visual on sight ("super
ugly"): ten slots pinned to fixed tick rows meant the active text
**teleported down the ladder** on every section change — powered off
one row, scramble-decoded onto another. The redirect: "a minimalistic
overview of the different sections … like a rolodex … the text section
overview should have a fixed position."

**What survives untouched:** the manifest's architecture — decisions 1
(states as a pure function of `activeIdx`), 5 (parse skeleton +
null-rendering controller, byte-exact shell), 6 (real nav semantics +
click-to-scroll), 7 (`entries.ts` under drift-guard) — plus the
resolver (corridor phases, seam-gap rule), the wake model, and the
13-tick ladder (Update 2 reaffirmed: all 13 ticks stay).

**The visual model is replaced** by a fixed-anchor rolodex:

- A masked **7-row window** (`7 × 22px`, gradient mask fading both
  edges) anchors at 50% of the rail. Inside it a **flow-stacked reel**
  holds all ten rows; the controller writes one unitless custom
  property (`--rail-manifest-idx`) and CSS derives
  `translateY(-(idx + 0.5) · rowH)` — the active row's center always
  lands on the window's center line.
- **Every row shows its name** (baked at parse time for first paint),
  dimmed by distance from active (`data-dist` 1→0.55, 2→0.32, 3→0.22;
  dist 4 is off-window and `visibility: hidden`, so it can't take
  focus). The active row is gold at full opacity.
- **The tween exception (decision 4 narrowed):** the reel transform is
  a continuous **350ms `--ease-out` detent glide** — an owner-approved
  exception to "never smooth tweening." Position remains a pure
  function of `activeIdx` (never scroll-scrubbed), motion stays inside
  the rail (the FLIP rejection stands), and CSS transition retargeting
  makes fast travel read as one redirected glide instead of a queued
  chain. Quantized `steps()` remains the canon for confirm garnish
  (the glyph flash).
- **Numbering canon preserved via the active-prefix morph:** each row
  is a single name span; the controller morphs `SERVICES` ↔
  `08 SERVICES` through the scramble kernel (which restarts from the
  currently displayed text), so the authored number rides only the
  active row and the non-monotonic …03/08/08A/05… sequence is still
  never visible as a column. The separate label span is gone.
- **Hero dormancy:** `data-dormant` (activeIdx 0) hides the window —
  the hero canon of "no rail title" now hides the whole instrument
  until the journey starts; it fades in entering Thesis.
- **`data-ready` gate:** the controller syncs the first detent, flushes
  layout (`void nav.offsetWidth`), THEN enables transitions — a
  mid-page reload fades in already positioned, never sliding up from
  hero. First paint / reload also skips the scramble (silent
  reconstruction, the shipped garnish philosophy).
- **Update 2's numeral yield reversed:** rows no longer sit on tick
  positions, so the `:has()` suppression is deleted and the "2"/"5"
  bearing numerals return to the home rail. Clearance is verified down
  to 720-class viewport heights (~90px from rail-center vs a 77px
  window half-extent, with the mask transparent at the edge) — if the
  window ever grows past 7 rows, re-suppress instead.
- **Retired:** bracket marker bays, the seat-cascade garnish
  (`data-just-seated` timers, 950ms/90ms stagger, seat/blink
  keyframes), and the hover ghost machinery (names are always visible;
  hover is a pure-CSS opacity bump). The services stack glyph moves
  **inline after the name**, still seated-only — its 320ms `steps(2)`
  gold flash now retriggers on the `display` flip with zero JS timers.
- **Responsive:** below 1100px the manifest hides entirely (there is
  no markers-only tier without marker bays); the tick ladder keeps the
  rail identity and HudNav carries navigation. The ≤960px rail hide is
  unchanged.

The look-dev lab (`rail-manifest-lab`) still shows the three marker
variants from Update 1 — kept as history; it does not model the
rolodex.
