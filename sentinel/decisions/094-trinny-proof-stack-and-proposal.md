# ADR-094: /trinny-london — the proof as a card stack, the interstitial, the proposal

**Date:** 2026-09-09
**Status:** Proposed — shipped and guarded, pending the owner's live read
**Surfaces:** `app/(marketing)/trinny-london/**` (`TrinnyPortals.tsx`, `proof/**`, `journey.ts`, `trinny-london.css`), `public/prototypes/v7/landing-trinny-london.html`, `public/trinny-london/*.webp`, `lib/cases/types.ts` + `content/loop-earplugs.ts` (`CaseTrack.card`), `components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx`, `components/landing/home-v2/hooks/useCorridorExitScroll.ts`, `components/landing/v7/rail-instruments/{journeyOrder,useJourneyMarks,sectionGlyphs}.tsx`
**Related:** ADR-093 (the route), ADR-053 (the variant recipe), ADR-030 (the stack mechanic, and the §6 seam bug), ADR-021 (the corridor exit and its no-wall-clock rule), ADR-056 / ADR-089 (the casefile this replaces on ONE route), ADR-059 (the journey marks), ADR-092 (the type tokens the sheet is pinned to), ADR-065 (corners), ADR-077 / ADR-058 (light re-derives)

## Context

ADR-093 put the site's own frame around a client pitch and mounted the proof
casefile unchanged. The owner's read of it, after the client call: the
casefile is a terminal-and-game-UI instrument and on a pitch page it is the
resting point, so it has to read at a glance — clean cards, one per Loop
project, stacking as the reader scrolls; a title, one paragraph and four
bullets on the left; the directory gone. After the proof, nothing of the
offer: the page turns to the client — an interstitial in their colour with
their products, then the proposition, kept apart from the Arc (the Arc is
the approach; this is the offer). Four decisions were taken with him
(cards first and the detail tier only after his read; the accent is the
Naked Ambition coral; a new short lede per project in the record; the
proposal is a drawing of their configuration, not claim cards).

Three things about the landing made this more than a component swap, and
each is a mechanism the site did not have.

## Decision

### 1 · `#services` keeps its id and mounts the route's own slot

`useCorridorExitScroll` resolves `#services` BY ID and returns without it —
the epilogue's dissipate, the dock and the ambient hold would all vanish,
and the "then we land on the proof" handoff is the part of the page the
owner likes. So the station stays, and the fork swaps its inner
`[data-services-root]` for `[data-tl-proof-root]`. `ServicesPortal`
returns before `createRoot` without its slot, which is what keeps the
casefile, the masthead, the plate cluster and the ring hit-areas off this
page with no flag and no shared edit. `home-v2.css`'s exit-band rules keep
the station transparent over the live ambient bed; without the attribute it
paints opaque — fail-safe by default.

⚠ **THE WEBGL CARD RING STILL MOUNTED AND FLEW IN.** `CorridorArmillary`
mounts `ServicesCardRing` on a flag and a media query with no DOM presence
check, and the ring's entrance is `smoothedDissipate × proofRelease` where
`proofRelease` RESTS AT 1 — so with no stage writer the four cards replayed
their fly-in and parked at full opacity behind the transparent station,
visible in every gap the stack left. The route stamps
`data-services-ring="off"` on `<html>` in a LAYOUT effect and the armillary
reads it ONCE at mount (a route property, not scroll state). ⚠ Never gate
on `[data-services-root]` presence instead — the card-face labs mount the
ring without it — and ⚠ never write `proofRelease = 0` from a route:
`useJourneyMarks` and `useActiveSection` read `< 0.75` as "the casefile
owns services".

### 2 · A route-local nested root, a sibling of `LandingPage`

`TrinnyPortals` renders after the `.tl-root` wrapper (passive effects run
post-order, so the parsed body exists on both a full load and a client-side
entry), finds the slot in `document`, and mirrors `ServicesPortal`'s root
lifecycle verbatim. The stack is `lazy()`-imported: the landing's import
doctrine walks this route's static graph, and the stack pulls the casefile's
plates in. `LandingPage` is untouched.

### 3 · The stack is ADR-030's mechanic with this route's skin

`useStackedCardsScroll` reads each `[data-pc-slot]`'s COMPUTED position and
`top`, so CSS owns the geometry and the inert path; it writes
`--pc-enter` / `--pc-cover` / `data-pc-state`. The `.pcl-*` console-plate
skin is not imported — `trinny-london.css` re-authors the sticky recipe
under `.tl-stack` / `.tl-slot` / `.tl-card` (the slot is positioning only;
the recession `scale(1 − 0.02·cover)` and a dawn wash live on the card; no
shadow — the card reference set's own "what not to take").

- ⚠ **THE FIRST PIN CLEARS THE FRAME.** At `--pc-top-base: 16px` the first
  card's head strip sat under the top-left journey row (six marks, ~y45 at
  every viewport). 64px clears the corner zone; every later card's head is a
  peek lower and was always clear.
- ⚠ **THE INERT RUNG IS ROUTE-OWNED.** ADR-030's own rung is `max-height:
759px`, which would make 1280×720 — the reference laptop — a static list.
  This route gates at 680h so it still stacks there (card ≈ 510px), and at
  ≤960w / PRM the four cards are in flow with a gap.
- **The head strip IS the peek band**: kicker + name in 52px, so the pile
  indexes itself — what the directory was for.

### 4 · The card is three registers, by reference

CLAIM `track.project` · FIELD the record's own visual via `track.visual` ·
CHROME one mono kicker. The paragraph is a NEW record field,
`CaseTrack.card.lede` (≤180, pinned beside the brief's ceiling and walked by
the same envelope scan): the brief is the casefile's 420-character
paragraph and a card that reused it carried three sentences where it has
room for one and a half. The bullets are the register's four
`blocks[].title` with their `ProofGlyph` as the mark — sans, not mono; mono
never carries the claim. Order is the route's (`proofOrder.ts`: studio ·
films · tools · map — creative first, the tools around it, the layer last),
content is `CASES`'s.

The field, per kind — the six ads whole at 4:5 (natural colour, ADR-056 U5),
the two posters, the four AUTHORED wireframes (the drawn record, ADR-068
U3), the PDA console. Two of them follow the FIELD's aspect through a
container query, because the owner's 1920×1247 gives the field a PORTRAIT
box while 1280×720 gives it a landscape one: the wireframes are authored for
landscape bays (W/H 2.3–2.9) and squeezed to 345×450 cells in a 2×2 at the
tall shape — mímir's three panels printed through each other — so a
portrait field stacks them 1×4 (690×235); the posters likewise stack. The
ads count their rows the same way (two rows where the aspect affords them,
one where it does not). ⚠ `.fl-con__console` and `.fl-imap__svg` rest at
opacity 0 without an ancestor `data-proof-settled`; the field host declares
it statically (the arcs' recipe). ⚠ `PdaConsole` owns the wheel while the
pointer is on it; inside a sticky stack that freezes the page whenever the
cursor rests on card four, so the map field carries a transparent layer
above the console — the events reach nothing that calls `preventDefault`.

### 5 · The ambient's kill edge is declared, not hardcoded

`useCorridorExitScroll` resolved the station the ambient fades against from
hardcoded ids (`#voidwalker ?? #practice ?? #contact`); on this page both
former are absent, so the canvas survived to `#contact` and the new opaque
interstitial would have HARD-CUT it at its own top (ADR-030 §6, a fifth
time). Additive: `[data-corridor-kill]` is consulted first, the chain is the
fallback, production stamps nothing. ⚠ **THE COVER SIDE IS KEYED ON THE
SAME ATTRIBUTE** (`html[data-corridor-exit] .tl-root [data-corridor-kill]`,
the `#voidwalker` form — relative, z 6, `content-visibility: visible`,
keeps its own ground), so JS and CSS cannot name different stations. The
interstitial declares its own opaque ground at id specificity; the ambient
fades over its approach band while the fourth card is pinned.

### 6 · The journey clock learns a roster-only station

`TRINNY_JOURNEY_ORDER` is `hero · about · thesis · navigate · encode · build
· services · proposition · contact`. The Proof mark keeps the `services` id
— the manifest row is the only way a mark lights through `resolveActiveIdx`
— and draws the `proof` glyph through a new `MarkSpec.glyph` (the
`JourneyMark` field already existed for the arcs). `proposition` is a
station the manifest does not know; `resolveActiveIdx` mapped it to index 0
— the hero — so the HOME mark would have lit over the proposal with nothing
throwing. `rosterDirectId` answers such an id straight off
`data-active-station` (only on a roster, never while the corridor is
engaged, and never for a manifest station id, whose path carries the beat
granularity and the proof/services split); `journeyPosition` /
`journeySector` take it as an optional fourth argument, every
three-argument caller byte-identical. Both `#trinny` and `#proposition`
publish `proposition`, so the Proposal mark lights from the interstitial
on. The `splitServices` helper keeps a roster with no `proof` row on
`services` rather than lighting nothing while the offer's clock happens to
read "held".

### 7 · The interstitial and the proposal are static HTML in the fork

The interstitial: opaque, one viewport, parchment graded into
`--tl-brand-rgb` (240,104,80 — sampled from the Naked Ambition tube, a
route-local token, never a `--gold` re-derivation), the four product
cutouts from the `shearwater` engagement's harvest as alpha WebPs in
`public/trinny-london/` (⚠ CSP is `img-src 'self'`; ⚠ the Good
Housekeeping roundel is a composited overlay and was cropped off), each on
`data-parallax` at its own speed — ⚠ never a keyframe: ADR-021 bans
wall-clock motion on the landing. The proposal: title-left /
paragraph-right head over a coral rule, then THEIR configuration plotted —
the people, the encoded layer (gold: the one thing that gets built), the
surfaces they already run — with 1px DIV connectors (the wireframe law),
adoption reading down and automation up, three mono kickers. No Arc
labels, no digit, no "self-sufficient" (the parse guard walks the text).

## Alternatives rejected

- **Removing `#services` and adding a `#proof` station.** The exit hook
  returns without `#services`; the dissipate the owner likes goes with it.
- **A prop on `ServicesStage` selecting the proof.** A shared seam for a
  one-route decision, threaded through a component whose runway is a shared
  stylesheet (`--svc-proof-runway`); the slot swap costs nothing shared.
- **Gating the ring on `[data-services-root]` presence.** The labs mount it
  without that markup.
- **A pure-CSS stack (`animation-timeline: view()`).** The cover channel for
  card i is the ENTRANCE of card i+1, a sticky element's own `view()` stalls
  at the pin, and it publishes no state the smoke can assert.
- **Reusing the brief as the card's paragraph.** Three sentences in a box
  for one and a half; the owner's complaint was the amount of text.
- **Claim cards for the proposal.** A second card grid competing with the
  proof's; the drawing plots a record instead.

## Consequences

- `/` and `/claude-workshop` are unchanged where it counts: every shared
  edit is an `?? existing` fallback or a mount-time attribute read that
  production never stamps; the HUD pixel snapshots pass without
  `--update-snapshots`.
- `.claude/rules/landing-v7.md`'s "do not remount tools-cards" now names the
  retired STATION and exempts the mechanic.
- `mobile-section-seams.spec.ts` is `/`-only; the trinny stations are not
  in its `STATION_IDS` — phones are covered by the capture script.
- The detail tier (a click opens the full plate in a dialog) is the next
  step after the owner's read; the cards carry no CTA until then. ⚠
  `.claude/rules/proof.md` names a `useDialogShell` that was never extracted
  — `MediaLightbox` + `useWalkthrough` are the implementation.

## Three things found by looking, every gate green

1. The ring behind the stack (§1) — the plan as first written shipped it;
   the design review caught it before the still did.
2. The first card's head under the journey marks at every viewport.
3. The tool drawings printing through each other at the owner's viewport —
   invisible at 1280×720 and 1440×900, both landscape fields.

## Update 1 — the head is chrome, the field shows one thing, and the arrival settles (2026-09-10)

Three owner notes on the live page, all on this beat.

### 1 · The cards arrived too fast

> _"the card with the different projects at Loop appears too quickly into view.
> It should be a bit delayed, and it should appear a bit slower, like a smooth
> animation."_

**There was no arrival at all.** `useStackedCardsScroll` writes one eased
channel and the only thing on this route reading it was `.tl-card__record`'s
opacity, taken RAW — so the paragraph was half-lit while the card was half-way
up the viewport, and the plate itself was opaque from its first pixel and
stopped dead on its pin. Nothing in the sheet carried a `transition`.

**Three levers, all CSS. The hook is not touched** — it is shared with
`/test/project-cards`, and `data-pc-state` (the smoke's ladder) is computed
from the raw `enter`, which still reaches 1 exactly at the pin.

- ⚠ **THE PINNED DWELL IS DERIVED, NOT GUESSED.** A slot's ENTRY runway is
  `vh − pinTop`, geometry the hook reads and no margin can lengthen; the
  pin-to-pin distance is `cardH + margin − peek`. Substituting `--pc-card-h`,
  the scroll for which a card is pinned and the next has NOT started rising
  comes out as **`margin − n·peek − bottom-safe`** — **the viewport height
  cancels exactly**, so one expression buys the same dwell at 720 and at 1247.
  That term was **negative at every viewport** before this (−88px at the
  owner's): card _i+1_ began rising before card _i_ had seated, so no card was
  ever simply THERE. `--pc-dwell: 18svh`, and the margin is written as the sum
  it actually is.
- **A delayed, twice-eased channel.** `--pc-enter` is already smoothstepped in
  the hook, so windowing it again is an S on an S: the motion starts late and
  its rate of change decays to zero BEFORE the pin. That is the "slower" half —
  the card SETTLES into its seat instead of travelling at scroll speed and
  stopping on it.
- **The plate lags and catches up.** A sticky card's rise is 1:1 with the page
  by construction; it cannot be slowed, only made to TRAIL. It sits `--pc-rise`
  low early and closes that on the eased channel. ⚠ `translate` is a separate
  property from `transform`, so the rise and the ADR-094 recession compose
  without one clobbering the other.
- **Plate → record → field, overlapping.** Pulled apart far enough to read as
  an order, close enough that the field is never a lit plate with an empty half
  in it — which is what a fully separated ladder looked like on the still.

### 2 · The head is chrome; the name is in the record

> _"Loop Earplugs should be in the top-left corner, and the [project] should
> actually be inside the left frame, so below it."_

The strip leads with `LOOP EARPLUGS · {phase}` and closes with the tab row; the
project's name moves into `.tl-card__record` above the paragraph, where it can
wrap (the `nowrap` + ellipsis went with the 52px flex bar that forced them).

⚠ **NAMED COST, TAKEN KNOWINGLY.** This ADR's own text calls the head "THE PEEK
BAND … so the pile indexes itself", and with the name gone a covered card's
sliver reads the same on all four. The three cards carrying tabs keep a
distinguishing mark; the ads card does not. Put the name back in the head's
right slot on that card alone if it ever reads badly — do not put it back on
all four.

⚠ `trinny-proof-order.test.ts`'s `project.length` cap was 20 **because the title
was `nowrap` in that bar**. Its reason moved with the name; it is a copy budget
for a two-line display name now, measured against `.tl-card__title`'s own
`max-width`.

### 3 · One rail, three cards — and the gradient he named

> _"you've crammed both the videos and all the tools into the entire right
> panel, but that's overwhelming … I would actually like to reintroduce those
> tabs … I wouldn't use a gradient. I would just integrate it nicely into the
> header bar … very subtle, minimalistic tabs."_

The ATL card printed BOTH films and the tooling card ALL FOUR wireframes into
one panel. They switch on `ConsoleRail` now — **the house rail, which was
already on this page** (the map's console renders it), fully controlled and
already a `role="tablist"` with roving tabindex. Stations are DERIVED
(`proof/proofTabs.ts`, pure): a film's handle is its label before the middle
dot, a tool's is `ProjectCase.tab`. The ads card keeps its six shots — a
contact sheet is one object however many pictures are in it.

⚠ **THE GRADIENT AND THE NOTCH HE NAMED ARE THE PRE-ADR-089 RAIL, AND THERE ARE
FOUR OF THEM.** ADR-089 U3/U4's box-and-fill grammar — flat, square, bordered,
the open one filled, no spine — is **entirely `.fl-case`-scoped in
`casefile.css`**, and the smoke deliberately asserts this route has no
`.fl-case`. So the map's rail here has been rendering `console.css`'s original:
the dormant station's recessed ramp, the lit station's second ramp, the
console's gold glow hung off its top edge (directly behind the rail), and its
scanline. ADR-089 U1 deleted the last two for the same reason. All four are
re-pointed at this route's tokens now, `.tl-root`-scoped — editing
`console.css` instead would land on `/`, `/arcs/*` and two labs, where the
markup is byte-pinned.

⚠ **CONTENT-WIDTH STATIONS, NOT EQUAL THIRDS.** `flex: 1 1 0` is right for a
rail spanning a console's top edge; in a header bar with ~1180px of free space
at 1440, four stations at 295px each is a divided bar rather than tabs.

### The map's rail moves up, and becomes pressable

`PdaConsole` gains **one additive optional prop, `railHost`**: given an element
it portals its rail there instead of seating it on the console. Identity when
absent — every production call site — which is the byte-identity proof, gated
by `services-ring-smoke`.

⚠ **`view` STAYS ITS OWN STATE.** The flight that carries the selected work
between readings is keyed on the TRANSITION (`go`, `viewTick`, `entry`,
`PDA_FLIGHT_GUARD_MS`); lifting the value to a prop would fork that machine
across two owners. The portal moves the DOM and nothing else.

⚠ **AND IT IS WHAT MAKES THOSE READINGS SELECTABLE HERE AT ALL.**
`.tl-field--map::after` covers the whole console with a transparent layer,
because `PdaConsole` captures the wheel while the pointer is on it and that
would freeze a pinned stack — so the rail has been decorative on this route
since ADR-094 shipped. In the head it is above that layer, and the wheel guard
is untouched.

### What the stills caught, every gate green

- **The wireframe bay had to be locked LANDSCAPE.** Given the whole field
  (693×926 at the owner's viewport, W/H 0.75) babylon pooled its four
  transcript rows at the top of a 700px table and heimdall's player became an
  empty column. The 1×4 stack this replaces was accidentally right about one
  thing — each cell was 690×235 — and `--tl-wire-ar: 1.62` keeps that while
  giving one drawing all four cells' area. 1.62 is a floor with headroom:
  ADR-068 U7's `cqw` cap binds below W/H 1.12.
- ⚠ **`place-content: center` COLLAPSED THE BAY TO ZERO WIDTH.** `.fl-wire` is
  absolutely inset and contributes no content size, so a shrink-to-fit track is
  0 and the bay's `min(100%, …)` resolved to 0. The column stays `1fr`.
- ⚠ **AND `margin-inline: auto` DID IT AGAIN ON THE PHONE.**
  `justify-self: stretch` does not apply to a grid item with auto inline
  margins — they absorb the free space and the box falls back to shrink-to-fit.
  Measured 0×502. Both are the same defect in two dressings: **a wrapper whose
  only child is absolutely positioned has no width of its own to fall back
  on.**
- **The phone gives the rail its own row.** `console.css`'s ≤980 unwrap rung
  puts every station at `flex: 1 1 45%` with a wrapping label, which inside a
  head strip stacked two boxes down the right edge and broke `DJ NEIGHBOUR`
  over two lines. A full-width row under the client line is ADR-083's own IA,
  and it keeps the 44px touch floor.

### And the harness had to converge

⚠ **A SOLVED `y` GOES STALE UNDER THE SCROLL, on the stack as well as the
turn.** The dwell made the pile ~700px taller, and the smoke's single
pre-measured `slots[3].top − pin + 40` stopped reaching card 4 — it reported
`incoming` while the still showed it seated. `seatSlot` re-solves, and it
converges on **`data-pc-state`, the hook's own published value**, not on the
rect: a geometry check can be satisfied on one pass and stale on the next while
the lazy chunks are still decoding. Same law as ADR-095's `rollToP`, one beat
earlier.

⚠ **AND THIS SURFACE HAD NO MARKUP GUARD AT ALL** — `tl-card` appeared in zero
test files, so the head could be recomposed and the fields rebuilt with every
gate green. The smoke now reads what the ruling is about: the client leads the
strip, the name is in the record, every station computes `background-image:
none` AND `clip-path: none` (both halves, pinned from both ends), the field
renders exactly one film / one drawing, and a click swaps it.

## Verifying

```bash
npx vitest run tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx tests/lib/trinny-proof-order.test.ts tests/lib/cases-registry.test.ts tests/lib/rail-instrument-marks.test.ts tests/lib/section-label.test.ts tests/lib/landing-import-doctrine.test.ts tests/lib/type-material-tokens.test.ts tests/lib/theme-lock.test.tsx
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop        # UNCHANGED
npx playwright test tests/visual/landing-corridor-smoke.spec.ts tests/visual/services-ring-smoke.spec.ts --project=desktop
node scripts/capture-trinny-london.mjs --vp 1920x1247        # headed — LOOK at the stills
node scripts/capture-trinny-london.mjs --vp 1280x720
```

## Left open

- The detail tier, after the owner's read.
- The structural orbits (`orbitExitGetter` rests at 1) still draw behind the
  stack; judged acceptable on the stills — gate them under the same
  attribute if gold hairlines ever show between cards.
- The nav-corner readout resolves the proposal to "THE ARC" (the route hides
  it; bars only), and the sub-1101×760 rail diamond would jump to the hero
  detent there.
- The proposal runs past one viewport at 1280×720 (head + drawing +
  kickers); fine at the owner's shape.
