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

### Update 6 — the rolodex is curated to the three brand pillars (2026-07-13, same day)

Update 5 marked the three pillars in a full ten-row rolodex; the owner
went further: **"the rolodex only needs to show ARC SERVICES PRODUCTS —
hide hero, thesis, continuum."** The rail becomes a fixed three-item
brand-pillar instrument, not a journey list — a quick read of the most
important elements (it deliberately overlaps the hamburger nav, which
still carries full navigation).

**Curated, not gutted.** `MANIFEST_ENTRIES` is UNCHANGED — the full
ten-entry journey still drives `resolveActiveIdx` (corridor phases,
seam-gap rule) and click targets. Only what the rail _renders_ is
reduced, via `RAIL_ROWS = MANIFEST_ENTRIES.filter(e => e.glyph ===
"stack")` (Arc / Services / Products) in `lib/rail-manifest/entries.ts`.
`buildRailManifestHtml` iterates `RAIL_ROWS`; the drift-guard for the
journey order stays green because the journey model didn't move.

**Per-pillar state (still a pure function of the full active index).**
Each row derives its state from its OWN journey index vs the resolved
active index: `upcoming` (ahead) / `active` (you're in it) / `seated`
(passed) — the ADR-030 loadout math, now on the rolodex rows. The reel
slides so the active / last-reached pillar sits at the anchor
(`--rail-manifest-idx = clamp(#reached − 1, 0, 2)`), parking on the last
pillar once you're past them. Numbers and the scramble morph are dropped
(names only); the glyph flash + gold-on-active carry the activation
beat. Distance dimming is replaced by **state dimming** (upcoming 0.5 /
seated 0.8 / active 1 + gold) so all three stay readable — there is no
7-row falloff with only three rows. Still hidden on the hero
(`data-dormant`), still parse-injected + mutate-in-place.

**Label:** the `#tools` section displays as **"Products"** in the rolodex
(owner wording) — `MANIFEST_ENTRIES` `tools.name = "Products"`; the id /
`targetId` / `data-station` stay `tools` (scroll target + tests
untouched). The top-nav and section header still read "Tools"; aligning
them site-wide is a separate call, flagged to the owner.

**Guardrail:** "restore the full-journey rolodex" is now a deliberate
reversal, not a default — the rail is the three pillars. The 13-tick
ladder still always stays (Update 2). Verified live: rolodex renders
exactly arc/services/products; states + reel focus correct at
services (idx 1), tools (idx 2), and past-pillars (parked idx 2);
11px; full suite green.

### Update 7 — rail uniformity: rolodex from the Arc, Nav/Encode/Build to the right rail (2026-07-13, same day)

Two owner tweaks to make all three pillars read the same way — **left
rolodex = pillar name, right rail = that pillar's sub-items**:

1. **Rolodex appears only from the Arc.** The dormancy gate widened from
   `activeIdx === 0` (hero) to `activeIdx < ARC_IDX` (`RailManifest.tsx`)
   — the window stays hidden through the hero AND the thesis, and the
   three-pillar rolodex fades in only once the journey reaches the first
   pillar (the Arc). Nothing else changed; still a pure function of the
   resolved index.

2. **The Arc's phases move to the right rail.** `CorridorProgressRail`
   (`components/landing/home-v2/`) — the Navigate → Encode → Build
   flywheel — was a fixed **top-centre** breadcrumb that grew a
   horizontal trail. It is now a **right-rail register** styled to match
   the Services (`SOURCE BUS · 04`) and Products (`TOOL UNITS · 04`)
   registers: three vertical rows seated on the rail guide at the
   register's row datums (33.3 / 41.7 / 50%), right-aligned with diamond
   markers, header **`THE ARC · 03`**. The current stage is gold with a
   filled marker; it is a pure read of the corridor's `paintProgress`
   (unchanged clock — no new scroll writer), fades in as Navigate lands
   (so it does not show during the thesis) and leaves on the epilogue
   `BUILD_OUT` band as before. It now matches the register's capability
   gate (hidden ≤1100px / ≤759px height). So during the Arc the right
   rail carries Nav/Encode/Build exactly as it carries the service/tool
   sub-items during Services/Products.

**Guardrail:** the top-centre flywheel breadcrumb is retired — do not
reinstate it; the Arc's sub-items live on the right rail like the other
two pillars. Verified: right-rail geometry (rows' marker edge aligns
with the right rail track), hidden-on-hero, and active-stage gold +
filled marker (forced-state check). The live corridor-scroll fade/track
could not be driven in the preview pane (GSAP scroll-driver + WebGL
resist synthetic scroll); the paintProgress read is a direct port of the
prior working breadcrumb.

### Update 8 — terminal rolodex + one rail grid (2026-07-13, same day)

Owner redirect: the two rails felt asymmetrical (different vertical
bands, wildly different row pitch) and the left rolodex read as an icon
menu rather than a terminal. Three coordinated moves:

1. **Left rolodex → terminal list.** The folded-card-ring glyph is
   **retired** (removed from `buildRailManifestHtml` — rows are now bare
   name buttons; `buildStackGlyphSvg` deleted). The active pillar is
   marked by a **filled terminal selection bar**: `.rail-manifest__name`
   gets an inverse-video block (`background: var(--gold)`, `color:
var(--void)`) with a 2px caret tick (`::before`, void on the fill)
   and a gold bloom — the retro-console "highlighted track" read. Every
   row's name carries the same fixed padding so activation only
   recolours the block (no layout shift). The stepped `steps()` confirm
   flash moved from the glyph to the bar; `MANIFEST_ENTRIES[].glyph`
   stays in the data model (it still tags the three pillars) but no
   longer renders. Font bumped **11px → 13px** (the left list is the
   primary index and the bar wants weight; the two rails are now a
   deliberate pair, not twins — left larger is intentional).

2. **One shared rail grid.** New tokens in `variables.css`:
   `--rail-row-pitch: 24px` (the rolodex row unit, `--rail-manifest-row-h`
   now references it) and `--rail-register-pitch: 30px` (the right-rail
   register row spacing). The registers no longer use the airy
   33.3/41.7/50(/58.3)% viewport gauge.

3. **Both registers centre on mid-rail (50%).** `CorridorProgressRail`
   (3 rows) and `ToolsRailRegister` (4 rows) now position via
   `calc(50% ± n·var(--rail-register-pitch))`, so each register is a
   tight block centred on the viewport midline — the same line the
   rolodex centres its active pillar on. Verified live on the Arc: the
   rolodex active row (Services, idx 1) sits at cy 637 and the Arc
   register's middle row (Encode) at cy 635 — a 2px delta, i.e. the two
   rails share one centre line; Navigate/Encode/Build span a 30px-pitch
   block (was ~60–90px). Headings track the new top row.

**Guardrails:** the glyph is retired — do not reinstate a per-row icon;
the active mark is the CSS terminal bar. The registers are centred on
50% at `--rail-register-pitch`, NOT the old percentage gauge — keep the
Arc and Services/Products registers on the SAME token (uniformity). The
rolodex is 13px (larger than the 11px register on purpose). The
Services/Products register (`ToolsRailRegister`) could not be driven
live in the preview pane (GSAP scroll-driver + WebGL resist synthetic
scroll, rAF-throttled) — its geometry is the analogous centred-pitch
port of the Arc register and shares the token; glance at the
Services/Products section to confirm the readout still sits well beside
its copy.

**Update 8 follow-up (same day).** Two owner refinements after first
look: (a) the left bar's caret tick (`.rail-manifest__name::before`) is
**removed** — the owner wanted no vertical line beside the titles, so the
left rail is now purely section titles + the fill (the fill alone is the
mark; the rolodex carries no per-row marker). The bar also gains a 16px
inset from the rail guide (`padding-left: calc(guide + 16px)`) so it
floats clear of the hairline. (b) The right-rail registers' active
signature changes from a **filled diamond** to an **underline** under the
name (`text-decoration` gold, 5px offset), across BOTH the Arc register
and the Services/Products `ToolsRailRegister` — uniform. The diamond
markers stay as passive outline ticks (they gold with the row via
`currentColor` but are never filled). So the two rails now read as a
deliberate pair with distinct active signatures: **left = full-frame
fill, right = underline**. The far-left 13-tick rail ladder is unchanged
(still load-bearing; Update 2).

## Update 9 (2026-07-16) — the left rail becomes a single detent diamond

**Owner redirect.** The three-pillar terminal rolodex (ARC / SERVICES /
ABOUT titles) is replaced by **one small gold diamond** that snaps to a
vertical detent per journey entry and reveals the section's title on
hover / focus. This **reverses the display decisions of Updates 3, 6, 7,
8** (the rolodex reel, the 3-pillar roster, the terminal selection bar,
the no-per-row-marker rule). What it does NOT touch: the journey model
(`MANIFEST_ENTRIES`), `resolveActiveIdx`, `clickToNavigate`, the
parse-injected skeleton + null-render controller pattern, the byte-exact
`<nav>` shell, and the **13-tick ladder (Update 2, still load-bearing)**.

### Decision

1. **One diamond over the WHOLE journey, not a 3-pillar reel.** The
   diamond tracks every `MANIFEST_ENTRIES` entry plus any future
   interstitial slides — it is data-driven off that array, so
   adding/removing a section reshuffles the spacing automatically. It is
   **visible from the hero** (owner choice; hero is title-less, so the
   "no rail title on hero" canon holds — only the marker shows).
   **Same-day owner refinement: the corridor is represented at BEAT
   granularity** — the journey is hero → thesis → **Navigate → Encode →
   Build** → services → about → continuum → practice → contact (10
   entries; the single "arc" entry is retired). The Arc's three moves are
   corridor-kind entries sharing the mount with `scrollFraction`s at
   their parks (paintProgress × EPILOGUE_START 620/820: 0.40→0.30,
   0.636→0.48, 0.923→0.70), so the diamond follows the corridor's
   structure — "the most important beats, not just section to section."
   To resolve the active beat, the `data-corridor-phase` attribute
   (single writer: the `CorridorStationHeaders` RAF) now publishes
   `thesis | navigate | encode | build` at hand-offs `0.2 / 0.48 / 0.78`
   in paintProgress — MIRRORING `CorridorProgressRail`'s STAGES band
   starts (keep the two in lockstep), so the left diamond and the
   right-rail register always agree on the active beat. `ARC_IDX` is
   replaced by `LAST_CORRIDOR_IDX` (the Build beat) for the seam-gap
   rule 3 and the scroll-wake regime.

2. **Position = a scroll-proportional detent, but still a pure function
   of the active index.** Each entry's detent is its real scroll offset
   normalized 0..1 (`detentTable.ts`, reusing the click-nav offset recipe
   `scrollTargetForEntry` in `clickToNavigate.ts`), so the long 820svh
   WebGL corridor occupies a proportionally tall slice and short stations
   cluster. The detent TABLE is recomputed only on mount / resize /
   `ResizeObserver` (late WebGL + Services-card layout) — **never per
   scroll frame**. The controller writes `--rail-diamond-top` on the
   active-index change; scroll only re-resolves WHICH index is active (the
   geometric seam-gap rule 3), never geometry. The 350ms `top` glide is
   the one allowed tween (Update 3 canon), gated behind `data-ready`; the
   diamond is hidden until then so a mid-page reload appears at its detent
   instead of sliding from hero. Reduced motion jumps (no glide).

3. **Hover / focus reveals the title, if any.** The active entry's title
   is written into a hidden `.rail-manifest__title` chip; a pure-CSS
   `:hover`/`:focus-visible` reveal is gated on `data-has-title`. Title
   eligibility is `manifestTitle(entry)` (`entries.ts`) — `null` for
   `hideActiveName` (hero) or a blank `name` (future interstitials), so
   those reveal nothing. The diamond is a real `<button>` (keyboard focus;
   a click re-centers the active section).

### Scope / files

`lib/rail-manifest/entries.ts` (new `manifestTitle`; beat-granularity
journey; `RAIL_ROWS` / `RAIL_ROW_INDICES` / `glyph` REMOVED — nothing
rendered them), `lib/rail-manifest/clickToNavigate.ts` (extract
`scrollTargetForEntry`), `lib/rail-manifest/detentTable.ts` (new),
`lib/rail-manifest/resolveActiveIdx.ts` (`ARC_IDX` →
`LAST_CORRIDOR_IDX`), `lib/v7-parse/railManifest.ts` (diamond + title
skeleton), `components/landing/v7/RailManifest.tsx` (controller
rewrite), `components/landing/home-v2/CorridorStationHeaders.tsx`
(`data-corridor-phase` publishes beat granularity at the
`CORRIDOR_BEAT_ENTER` hand-offs), `components/landing/v7/landing.css`
(12px diamond centred on the 2px track, bloom on an un-clipped `::after`
— a `box-shadow` on the clip-path'd `::before` would be cropped by its
own clip, gate parity, reduced-motion),
`tests/lib/{rail-manifest,v7-parse,detentTable}.test.ts` (drift pins
moved in lockstep). The `.claude`/`.cursor` `landing-v7` rule docs' rail
sections are updated to describe the diamond.

**Guardrails (updated):** the rail DISPLAYS one detent diamond over the
full journey — do NOT re-add the rolodex reel, the 3-pillar roster, the
terminal selection bar, or per-row buttons. Position stays a pure
function of the active index into the layout-computed detent table — do
NOT scroll-scrub the diamond or add a per-frame scroll writer (recompute
the table on layout only). Keep `resolveActiveIdx` + `clickToNavigate`
shared; keep the byte-exact `<nav>` shell (change `buildRailManifestHtml`

- the drift-guard tests in lockstep); never `createRoot` into
  `[data-rail-manifest-root]`; the 13-tick ladder always stays (Update 2).

### Update 11 — the SOURCE BUS register retires with the services masthead (2026-07-16)

**ADR-044** introduces the `#services` section masthead (title left /
intro paragraph right in the upper band) and, by owner decision, retires
the right rail's "SOURCE BUS · 04" register during services — the
masthead paragraph is the services right-side text now. This deliberately
amends the Updates 7-8 uniformity contract ("each pillar: name left,
sub-items right"): during services the right rail is empty. The Arc's
`CorridorProgressRail` register is unchanged. `ServicesRailRegister.tsx`

- its CSS + the `[data-tools-rail-root]` shell stay on disk for rollback
  — see ADR-044 for the reconciliation notes.

### Update 12 — a terminal-tree section menu returns to the left (2026-07-18)

**Owner decision, chosen from the `/test/section-menu-lab` exploration
(five routes over the parked Navigate frame; the "terminal tree" won).**
The section + subsection overview returns to the LEFT as a detached
**terminal-tree menu** (`components/landing/home-v2/CorridorSectionMenu.tsx`),
near the rail but not on it. This **deliberately reverses the Update 3/6/7/8/9
display decisions**: the left is no longer "one detent diamond", and the
Arc's subsections no longer live on the right rail.

**What it is.** A fixed, desktop-only `<nav>` mounted page-level in
`LandingPage` (a self-contained leaf — local state, so it never
re-renders LandingPage; nested-root-safe). It shows the full 8-station
journey (`hero · thesis · THE ARC · services · about · continuum ·
practice · contact`, positional numbering) folded from
`MANIFEST_ENTRIES`; the three corridor beats become THE ARC's
subsections, which UNFOLD only while the reader is inside the corridor
(`▾`, the active beat lit + a blinking cursor). The active section is an
inverse-video gold block; every OTHER section RECEDES (smaller 9px vs the
active 10.5px, tighter tracking, `dawn` α .34) so the active context
dominates. Rows are real `<button>`s (`aria-current`), clickable via
`scrollToManifestEntry`.

**Visibility — section-contextual (owner refinement, 2026-07-18).** The
menu is a section-contextual overlay: it fades in ONLY inside a section
that carries subsections — **the Arc** (corridor Navigate/Encode/Build)
AND **#services** (the four service verbs) — and fades out everywhere else
(hero/thesis, about, continuum, practice, contact). The gate is pure CSS
off the `<html>` bus: `[data-corridor-engaged="true"]` AND
`[data-corridor-phase]` ∈ {navigate, encode, build}, OR
`[data-active-station="services"]`. `data-services-ambient` is deliberately
NOT used — it survives into #about/#continuum (ADR-049) and would leak the
menu there. The component keeps rendering + tracking so content is correct
the instant it shows; buttons take clicks only while shown. (Supersedes the
initial "always shown" persistent model, then the "Arc-only" first cut.)

**Services subsections (2026-07-18).** #services carries the four service
verbs (`ADVISORY · EMBEDDED · KEYNOTE · WORKSHOP`, `SERVICES` /
`serviceData.ts` — the retired SOURCE BUS register's data). The tree folds
them onto the `services` node the same way the corridor beats fold onto THE
ARC. The active verb tracks the card ring exactly via
`activeServiceForProgress(servicesRingProgressRef.current.progress)` — the
same source the old `ServicesRailRegister` used — polled on scroll while in
#services (the active service changes on scroll, not via any attribute), so
the menu's scroll listener stays alive through #services as well as the
corridor seam. Service subs all scroll to `#services` (the ring has no
distinct per-service scroll target); Arc beats scroll to their own park.

**No new scroll writer (ADR-002).** State is a pure read of the SAME
single-writer `<html>` bus the diamond uses — `resolveActiveIdx` +
`ACTIVE_IDX_ATTRIBUTES`, woken by a MutationObserver + the hero/corridor
seam-gap scroll listener. It RENDERS its own DOM (unlike the
mutate-in-place `RailManifestController`).

**What it replaces.**

- The right-rail Arc register `CorridorProgressRail` ("THE ARC · 03") is
  RETIRED — unmounted from `HomeCorridor`; the component stays on disk for
  rollback (like `ServicesRailRegister`, Update 11 / ADR-044). During the
  Arc the right rail is now empty; the left menu carries the beats.
- The left detent diamond hides on desktop (`≥1101×760`) ONLY where the
  menu takes over — inside the Arc OR #services. EVERYWHERE ELSE (and below
  the gate) the diamond is the journey indicator again, so the desktop is
  never without a marker. Its hide is scoped to the SAME `<html>` condition
  as the menu-show and fades (opacity, not display) so it hands off to/from
  the menu smoothly. `RailManifestController` is untouched; the 13-tick
  ladder always stays.
  (Owner refinement 2026-07-18 — the initial Update 12 hid the diamond on
  all desktop, which left no marker outside the Arc once the menu became
  Arc-only.)

**Kept.** The 13-tick ladder + hairline (Update 2, always). The
parse-injected `<nav data-rail-manifest-root>` skeleton, `MANIFEST_ENTRIES`,
and every drift-guard test — all unchanged (the menu folds the same data;
`tests/lib/{rail-manifest,v7-parse}.test.ts` stay green). The
`resolveActiveIdx` + `scrollToManifestEntry` shared helpers.

**Files:** `CorridorSectionMenu.tsx` (new), `home-v2.css` (menu styles +
recede hierarchy, replacing the `.home-v2-progress-rail` block's role),
`landing.css` (desktop diamond hide), `LandingPage.tsx` (mount),
`HomeCorridor.tsx` (register unmount). The `landing-v7` rule's "single
detent diamond" + "rail uniformity" sections are updated to point here.

**Guardrails.** The recede hierarchy is the point — never flatten
non-active rows back to the active size (the "clear hierarchy" owner ask).
Keep the button reset from setting `font`/`color` (it out-specifies the
row rules and collapses the hierarchy — the bug fixed on landing). Subs
render ONLY while inside the Arc. If the register or the desktop diamond
is ever wanted back, both are one line away (remount / drop the gate).

### Update 13 — hug the rail, larger type, no ASCII tree chrome (2026-07-19)

**Owner refinement.** Three tweaks to the Update 12 menu, all
presentation-only (no new signal, no scroll writer — still a pure read of
`activeTopId`):

- **Closer to the rail.** The detach gap dropped from
  `clamp(34px, 3.2vw, 56px)` to `clamp(16px, 1.7vw, 28px)` past the
  `--hud-margin` — it read as floating off into the corridor. Still clears
  the rail guide + bearing labels.
- **Larger type.** The scale went up ~2px across (non-active row 9→11px,
  active row 10.5→12.5px, head 8→9px, disc 8→9px, subrow 9.5→11px). The
  recede size gap (active vs non-active) is preserved — the hierarchy
  guardrail above still holds.
- **A literal 3D rolodex — TRIED then REVERTED same day (owner ask).** The
  Update-12 recede was briefly a shallow 3D wheel (`rolodexStyle(offset)` →
  `--row-rot`/`--row-depth`/`--row-dim` on a `perspective: 620px` `__list`,
  per-row `translateZ`+`rotateX`+graded opacity keyed to distance from the
  active row). The owner asked to remove it: the menu is back to the flat
  Update-12 recede (active inverse-video block + non-active smaller/dim, all
  co-planar). `rolodexStyle`, `activeDisplayIdx`, the `--row-*` props, the
  `__list` perspective + `__item` transform, and the reduced-motion flatten
  are all gone. The closer position + larger type + no-tree-chrome below
  survive.
- **No ASCII tree chrome (owner ask).** The `TF://JOURNEY — 08 STN` head and
  the `├─`/`└─` row connectors + `│  ├─` sub-pipes are REMOVED — the wheel
  itself now carries the hierarchy. The `__head`, `__branch`, `__pipe`
  elements + rules are gone; subsection nesting is a `14px` left indent on
  `__subs`. The disclosure caret (`▾`/`▸`), the active inverse-video block,
  the `·NN VERB`/beat numbering, and the blinking sub-cursor (`█`) stay — the
  menu reads as a clean indented list, not a boxed-drawing tree.

**Files:** `CorridorSectionMenu.tsx` (head/branch/pipe spans removed; the
rolodex `rolodexStyle`/`activeDisplayIdx`/per-`<li>` style was added then
removed same day), `home-v2.css` (menu `left`, type sizes; `__head`/
`__branch`/`__pipe` rules removed, `__subs` indent; the rolodex `__list`
perspective + `__item` transform + reduced-motion flatten were added then
removed same day).

### Update 14 — re-split: LEFT sections / RIGHT subsections (2026-07-19)

**Owner ask — reintroduce the U7/U8 split the U12 tree had merged.** The
single left terminal-tree (sections + inline subsections) splits back into
two mirrored panels: the **LEFT** rail carries the SECTIONS (the full
8-station list, active = inverse-video gold block, rest receded — Update 13
recede, no rolodex), the **RIGHT** rail carries the ACTIVE section's
SUBSECTIONS as a RIGHT-aligned register — THE ARC's Navigate/Encode/Build, or
the four #services verbs — headed by the section name, each `NAME NN` (index
on the rail side, so the numbers line up as a clean right column), the active
sub lit gold (no cursor). e.g. `LEFT: THE ARC · RIGHT: NAVIGATE 01 /
ENCODE 02 / BUILD 03`. A `▸` on the two sections-with-detail hints "detail on
the right". (Owner iterated the right panel: right-align → left-align →
right-align with `NAME NN` order; and dropped the blinking cursor.)

**One component, not the old two registers.** Unlike the U7/U8 design (which
paired the RailManifest left rolodex with the separate paintProgress-driven
`CorridorProgressRail` right register), this is ONE component —
`CorridorSectionMenu` renders both panels off its single existing tracker
(`resolveActiveIdx` for the active section; `servicesRingProgressRef` /
`activeServiceForProgress` for the active #services verb, already wired since
U12). So Services gets the right-panel subs for free, and there is no second
scroll reader / clock. The retired `CorridorProgressRail` stays on disk
(unmounted) as before; it is NOT revived.

**CSS:** the `.home-v2-section-menu` block generalizes — a shared base
(fixed, mono, gated) with `.home-v2-section-menu` (left) and the new
`.home-v2-section-submenu` (anchored on the right rail, `text-align: right` /
`justify-content: flex-end`, rows `NAME NN`). The `blink` keyframe +
`__cursor` are removed with the dropped cursor.
Both share the SAME `<html>`-bus visibility gate (Arc phases + #services) via
`:is(.home-v2-section-menu, .home-v2-section-submenu)`, the same media/
reduced-motion guards, and the `blink`/`unfold` keyframes. The inline
`__subs`/`__subrow`/`__subname`/`__cursor` left rules are removed; the right
panel owns `__head`/`__list`/`__row`/`__num`/`__name`/`__cursor`.

**Verified live** (dev, fresh `.next`): both panels fade in together only in
the Arc and #services; LEFT active = THE ARC / SERVICES, RIGHT = the matching
subs with the active one lit (ADVISORY tracked the front card). Typecheck +
lint clean. **Turbopack note:** rapid HMR during this edit left the browser
console showing stale `lastIdx`/`rolodexStyle` ReferenceErrors from
superseded chunks (the ADR-049 U6 rev b signature) — the component rendered
correctly throughout; the served chunk's only `lastIdx` is an unrelated
bundled module (`computeBaseTransform`), and a `.next` wipe + restart proved
the build clean. Recognize this signature before diagnosing "missing" code.

**Files:** `CorridorSectionMenu.tsx` (render splits into `<nav
.home-v2-section-menu>` + `<nav .home-v2-section-submenu>`; `expandedNode`
feeds the right panel), `home-v2.css` (shared base + left/right panel
blocks).

### Update 15 — both panels become REELS on a fixed centre line (2026-07-19)

**Owner ask.** "It should not be the yellow highlight that moves but the
section titles moving to the positioning of the highlight as you scroll
through — keep the yellow highlight in a fixed position and have the
corresponding subsection horizontally aligned with it." Also: the right panel
no longer needs the section-name header above the subs.

**Decision — a fixed centre line, two reels.** Both panels are pinned at
`top: 50%` (the block-centering `translateY(-50%)` is dropped) and each LIST
translates so its ACTIVE row's centre lands exactly on that line:
`translateY(calc(-1 * (var(--active-row) + 0.5) * var(--menu-row-h)))` on the
left (`--active-row` = the active section's tree index) and the same on the
right with `--active-sub` (the active subsection's index). Rows are fixed
`--menu-row-h` (22px) slats so the stride math is exact. Result: the gold
highlight stays put at viewport centre while the section titles REEL to it,
and the active section (left) and its active subsection (right) share ONE
horizontal line — probed live at 1504-wide: THE ARC / NAVIGATE 01 both at
y = 635 = viewport centre; scrolling Navigate → Encode reels the right so
ENCODE 02 takes the centre while THE ARC holds; #services: SERVICES /
ADVISORY 01 both centred. The reel offsets are React custom props
(`--active-row` / `--active-sub`) on each `<nav>`; a `transform` transition
slides the reel (within-section it only moves on the right as the beat
changes — the left section change happens while the menu is faded out between
Arc and #services, so it never visibly jumps). The right `__head` (section
name) is removed; the `unfold` keyframe retires (the reel is the motion).
Reduced-motion drops the reel transition (jump, no slide).

**Files:** `CorridorSectionMenu.tsx` (`--active-row`/`--active-sub` on the
navs; `__head` removed), `home-v2.css` (centre-line base + `--menu-row-h`
slats + per-list reel transforms; `__head`/`unfold` removed).

### Update 16 — the HUD chrome powers on at section 2 (2026-07-19, owner)

**Owner idea:** "the left and right rail only appears when you scroll in the
second section, and the brandmark in a diagram is moving to the center — that
is a moment when I want our left and right rail and also the corners to
appear."

**Decision (rev a — TRUE LAYERING, not an opacity fade).** The first cut used
an opacity gate (chrome invisible-but-present on the hero, faded in via CSS
transition). The owner's actual ask is physical: **the HUD lives BEHIND the
hero curtain**, so the ADR-022 scroll-up curtain reveal UNCOVERS the real HUD
along with section 2, the same way it uncovers the parked compass diagram —
not a timed fade layered on top.

Implementation: `.hud`'s base `z-index` drops from `50` to `3` — BELOW the
hero (`z 4`) and level with the corridor host stack (`z 3`, but earlier in
DOM so the corridor host still paints over it while both are 3). The hero's
opaque background fully covers the HUD through the whole hero life. The
instant the ADR-022 curtain hands off — `data-corridor-entry` clears (the
existing single-writer signal, `useLandingScroll`, no new writer, ADR-002) —
a second rule RAISES `.hud` back to `z-index: 50`, so it resumes painting
above every later opaque station (`#services` z5 → `#contact` z7):

```
html:not([data-corridor-entry])[data-corridor-engaged="true"][data-corridor-phase] .hud,
html:not([data-corridor-entry])[data-active-station]:not([data-active-station="hero"]) .hud,
html:has(.home-v2-stage[data-fallback="true"]) .hud { z-index: 50; }
```

The three arms mirror the original gate (corridor beats, every later station,
the corridor-incapable fallback which keeps the HUD always-on-top since no
curtain choreography exists there). The flip is a hard z-index swap, not a
transition — nothing overlaps the HUD at the exact handoff frame either way,
so there is no visible pop. This supersedes the rev-0 opacity fade in full
(`.hud__corner`/`.hud__rail` no longer carry their own opacity/transition —
the whole `.hud` node moves as one layer). The load-time `cornerDraw`
one-shot stays retired (deleted in rev 0; still correct — the curtain reveal
is the corners' entrance now).

**Also this pass — the journey menu starts at THE ARC.** `CorridorSectionMenu`
no longer lists HERO or THESIS (owner: "the left nav items should not show
hero and thesis"). `MENU_HIDDEN_IDS = {hero, thesis}` filters them out of
`JOURNEY_TREE`; `resolveActiveIdx`/`MANIFEST_ENTRIES` are untouched (the menu
is CSS-hidden anyway while the reader is in either section — the section-
contextual gate from Update 12 — so this only trims the ROSTER, not the
active-tracking). The now-dead `hideActiveName` field (it only ever applied
to the hero row) is removed from the tree type + render.

**Supersedes:** the Update 9 note "the diamond is visible from the hero" —
the diamond (a rail child) now lives behind the hero curtain like the rest of
the chrome; its behavior PAST the hero is unchanged. The Update 2 "13-tick
ladder always stays" doctrine is amended, not broken: the ladder still exists
in the DOM at every beat and is UNCOVERED everywhere except the hero.

**Verified live** (dev, 1945×1269, fresh navigation): hero = the hero's own
`hero__bg` paints at the corner test-points (`z 3` HUD is covered), `data-
corridor-entry="1"`; mid-curtain scroll — still covered, entry still set;
section 2 — the corridor host paints at the corner spot, `.hud` measures
`z-index: 50`, `data-corridor-entry` is absent, and the left rail's own
track element wins `elementsFromPoint` at its exact x/y (the rail is really
on top, not just the z-index number); scrolled back to the hero — `z-index`
drops to `3` and `hero__bg` covers the corner again, symmetric. Left menu at
every beat reads `THE ARC · SERVICES · ABOUT · CONTINUUM · PRACTICE ·
CONTACT` — no HERO/THESIS row at any scroll position. Typecheck + lint
clean.

**Files:** `landing.css` (`.hud` base z 3, the raise-on-handoff rule replacing
the opacity gate; `cornerDraw` stays deleted), `CorridorSectionMenu.tsx`
(`MENU_HIDDEN_IDS` filter; `hideActiveName` removed from `TreeNode` + render).
