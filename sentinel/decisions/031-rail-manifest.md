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

### Update 4 — the resource loadout (2026-07-13)

The Context noted the owner wanted the Arcs "plugged in" too, not just
Services; the shipped rolodex only ever seated the Services stack glyph
inline, seated-only, and it scrolls out of the 7-row window. The owner
reopened this: a **persistent, decorative "loadout"** of the three core
resources — **Arc, Services, Tools** — visible from the hero (faded,
empty sockets), each module **seating** as its section is reached, over
a **charge gauge that fills like a fuel meter**, click-to-navigate,
"subtle, must not clutter." The owner's own tension — left rail =
journey rolodex, right rail = section register, so neither is the home
for an accumulating loadout — is resolved by a **third micro-instrument
at the FOOT of the left rail** (owner-chosen placement, this session;
the bottom-right corner panel was the considered alternative). This
honours the original "modules belong on the left rail" ruling and the
right-rail-docking rejection.

**What it is:** a parse-injected `<nav id="railLoadout"
data-rail-loadout-root>` shell (twin of the manifest — byte-exact,
pinned by `tests/lib/rail-loadout.test.ts`) holding three
`.rail-loadout__socket` buttons + a `.rail-loadout__gauge`. The client
`RailLoadoutController` (`components/landing/v7/RailLoadout.tsx`) is a
**null-render component that mutates the injected DOM** — never
`createRoot`. It is a **fourth consumer of the single resolved active
index**, so it introduces no new scroll writer and no store.

**Architecture reuse (the load-bearing part):** the seam-gap resolver
was extracted verbatim from `RailManifestController` into
`lib/rail-manifest/resolveActiveIdx.ts` (+ `ACTIVE_IDX_ATTRIBUTES`,
`ARC_IDX`) and the click-to-scroll into
`lib/rail-manifest/clickToNavigate.ts` — both the rolodex and the
loadout now import them, so the subtle corridor/seam resolution can't
drift between two copies. The stack glyph became
`buildStackGlyphSvg(prefix)` in `lib/v7-parse/railManifest.ts` (the
`"rail-manifest"` output is byte-identical; the loadout uses
`"rail-loadout"` for independent styling). Shared state math lives in
`lib/rail-manifest/loadout.ts` (`LOADOUT_RESOURCES`, `loadoutState`,
`chargeForActiveIdx`) — the three resource ids are read directly there,
**NOT** via a `glyph` flag on `entries.ts`, so the manifest drift-guard
(`glyph === "stack"` pinned to `["services"]`) stays green.

**Behaviour (pure function of the resolved index `a`):** resource at
manifest index `e` → `upcoming` (`a<e`) / `active` (`a===e`) / `seated`
(`a>e`); charge = count of resources with `a>=e` (0..3), written as one
`--loadout-charge` property the CSS gauge derives its width from
(quantized to thirds). `data-dormant` (hero) fades the instrument;
`data-ready` gates the transitions after a first-sync reflow flush.
Confirm garnish is the ADR-031 `steps()` flash scoped to `active`
(power-on beat, retriggers on reverse re-arrival); the gauge's 350ms
detent glide is the same owner-approved tween narrowing as the reel. No
FLIP. All 13 ticks stay (Update 2 guardrail honoured — the loadout adds
ink on the rail grid, removes nothing; footprint ~180×39px at the rail
foot, clear of the rolodex window and the 66.67% bearing numeral).

**Responsive:** persists **glyphs-only** in the 960–1100 band (the
rolodex hides there, but the loadout is iconographic); stands down with
`.hud__rail` at ≤960. PRM snaps states, no gauge glide, no flash.

Verified live (dev server): parse-time skeleton faded on hero (charge
0, three upcoming sockets); Services → charge 2, Arc seated / Services
active / Tools upcoming, gauge fill exactly 2/3; Tools → charge 3, gauge
full, Tools active; Contact → all seated, charge 3; click-nav both
branches (Services `scrollIntoView`, Arc corridor-fraction scroll to
~`mount.offsetTop + 0.35·runway`); the 960–1100 glyphs-only + ≤960
stand-down tiers; full unit suite green (219 tests), incl. the manifest
drift-guard and `v7-parse` body parse.

### Update 5 — the loadout bay is retired; the glyph moves onto the rolodex pillars (2026-07-13, same day)

The owner rejected the foot-of-rail loadout bay on sight: seen next to
the rolodex it read as **double work** — a second instrument restating
what the rolodex already says. The redirect: keep the rolodex, drop the
separate bay, but **use the module icons** to mark the "most important
elements of the brand" — **Arc, Services, Tools** — inline on their
rolodex rows; and **enlarge the rolodex type**, since the left rail
should not read smaller than the right-rail register.

**Retired (Update 4 reversed):** the entire `RailLoadout` instrument —
`components/landing/v7/RailLoadout.tsx`, `lib/v7-parse/railLoadout.ts`,
`lib/rail-manifest/loadout.ts`, `tests/lib/rail-loadout.test.ts`, the
`#railLoadout` prototype shell + its `injectStaticHudChildren` replace,
the `LandingPage` mount, the `.rail-loadout` CSS block, and the charge
gauge. No separate bay, no `--loadout-charge`, no fuel meter.

**What ships instead:** the layered-stack module glyph now rides the
**three brand-pillar rows** of the rolodex. `glyph: "stack"` is set on
the `arc`, `services`, AND `tools` entries in `lib/rail-manifest/entries.ts`
(was services-only); the parse builder already renders the glyph for any
`glyph:"stack"` row, so all three now carry it. The `.rail-manifest__glyph`
is **always shown** (it only exists on those three rows) — a departure
from Update 3's seated-only Services glyph — with the fill a pure
function of row state: back planes take the row's `currentColor` (so the
mark dims/golds WITH the row), the front plane is **hollow (transparent)
while `upcoming`** and **lights gold once reached** (`active` or
`seated`). The `steps()` power-on flash re-scopes to `[data-state="active"]`
(fires as a pillar becomes the active row, retriggers on reverse
re-arrival). The drift-guard `glyph === "stack"` list is updated to
`["arc","services","tools"]`.

**Type:** `.rail-manifest__entry` font-size 9px → **11px**, matching the
right-rail register so the two rails read at one weight (owner). Row
height stays 22px (11px clears it; the 7×22 window geometry and its
720-class clearance are unchanged).

**Kept from Update 4 (the clean part):** the shared
`lib/rail-manifest/resolveActiveIdx.ts` and `clickToNavigate.ts`
extractions and `buildStackGlyphSvg(prefix)` — still used by
`RailManifestController`, so the refactor stands even though the second
consumer is gone.

**This makes "a separate loadout instrument next to the rolodex" a
rejected alternative** (double work); the brand-pillar markers live ON
the rolodex, not beside it. Verified live: loadout DOM gone, rolodex at
11px, glyphs on arc/services/tools only, front-plane fill tracking state
(Arc seated + Services active → gold front; Tools upcoming → hollow);
full suite green (209 tests).
