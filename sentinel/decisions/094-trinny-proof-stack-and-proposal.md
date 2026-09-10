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

## Update 2 — the arc carries the stack, and the tabs move into the field (2026-09-10)

Owner: _"I was always struggling with, okay, how do I connect the ATLs with
the AI Studio self-sufficiency and the AI tools I've built with the AI
adoption? I think I found it working on another client. It's actually: we push
the frontiers of AI creative · we made the creative team self-sufficient with
AI · we built tools to enhance the processes · we expanded to the rest of the
company. I think that is a very clear arc."_ Plus three notes on the card: the
left panel should carry the homepage's own extra record and sit nearer the
top, the tabs should _"live inside the right panel instead of the header …
feel like the full frame of the right panel"_, and the ATL films should use
the vertical cuts.

### The arc goes in the RECORD, not on the route

`CaseTrack.arc` — `{ step, title }`, optional and additive. The four beats are
the engagement's own sequence, written verbatim in the Suri deck the owner had
just used them in (_first we made film without a crew · then the studio made
its own ads · then the studio wrote its own software · then thirteen more
teams ran it_). The route owns nothing but the sequence, as before; the claim
belongs to the record so the homepage casefile and the portfolio arc can adopt
it without a second copy to keep in step.

⚠ **IT IS NOT A RENAME.** `project` and `file` name the same thing as each
other and are ≤20 characters (the registry's normalise-and-compare guard);
`arc.title` is a SECOND, longer register in the first person plural — a claim
about what the project was FOR, where `project` is a filename made readable.

⚠ **AND IT REVERSES THE FIRST TWO CARDS.** `atl-films` leads now: the frontier
work is what earned the studio the right to run AI itself, and a stack opening
on the studio had the consequence before the cause. The casefile's directory
order is untouched — a directory is an index, this is a narrative.

⚠ **THE SEQUENCE AND THE STEPS CAN DISAGREE WITH NOTHING FAILING**, because
the head prints `arc.step` from the record while the pile is ordered by
`TRINNY_PROOF_ORDER`. A re-order in one place alone letters `03 · 01 · 02`
down a scroll with four correct cards and every other gate green;
`trinny-proof-order.test.ts` asserts the two agree.

### The arc is also what PAYS for moving the tabs

U1 recorded the cost of emptying the head: it is **the peek band**, the sliver
a covered card still shows, and with the tabs gone as well it would read
`LOOP EARPLUGS · BUILD` on all four — the pile stops indexing itself. The arc
line is a better answer than the quiet project name U1 offered as the
fallback: scrolled, the four slivers read the whole argument the owner was
missing, so the pile indexes itself by the CLAIM rather than by a name the
record column already carries one line down.

### The rail, in the field

`ConsoleRail` moves onto the right panel's own top edge and goes **back to
`flex: 1 1 0`** — its native grammar, which U1 had to override for a good
reason that no longer holds (four stations at 295px each across a ~1180px
header bar is a divided bar; across a ~700px panel they are its frame).

⚠ **THE SIZE CONTAINER MOVES DOWN A LEVEL, to `.tl-card__bay`.** The ads count
their rows off `100cqh`, the film derives its width from it and the wireframe's
whole bay is `(100cqh − 4px) × 1.62`; left on the field, all three would be
sized against a box that now includes ~34px of chrome they cannot draw in.

⚠ **AND IT SOLVES THE MAP'S PORTAL rather than re-opening it.** The
transparent layer that stops `PdaConsole`'s wheel capture freezing the pinned
stack is on `.tl-field--map`, INSIDE the bay — so a rail seated above the bay
is outside its box by construction, where in the head it had to be lifted over
it.

### The left column reads the record it already had

`CaseBlock` has always been `{ glyph, title, desc }` and this card printed only
the title. The sentence is rendered now, on ADR-088's own SENTENCE rung, and
the column is seated at the top rather than centred — centring was right while
it held a name, a paragraph and four short claims, roughly a third of the box;
a block that nearly fills its box and is centred reads as one that failed to.

⚠ **THE SENTENCES NEED A HEIGHT RUNG (940h), and it is arithmetic.** Four
95-character sentences are ~170px of ink on top of a name, a lede and four
claims, against a record column that is ~424px at 1280×720. Below the rung
they are sr-only — the casefile's own 1070h precedent, for the same reason.
⚠ `align-items: start` on the claim, never `center`: grid synthesizes a
replaced element's baseline from its bottom edge, so a centred glyph sits
mid-paragraph once the sentence is two lines.

### The films go vertical

`CaseFilm.portrait` — the film's own 4:5 social resize, one frame, optional
and additive. The field is 693×926 at the owner's viewport and a 16:9 poster in
it is a stamp with a third of the box empty either side.

⚠ **4:5 IS THE ONLY ASPECT BOTH FILMS WERE RESIZED TO**, which is what makes it
the one shape a rail can switch between without the frame changing size. Their
durations differ (Smug Owl's 4:5 is the full 30 seconds, DJ Neighbour's a
7-second cutdown), which is why this is a STILL and not a second `src`.

⚠ **IT CARRIES ITS OWN `meta`.** `CaseFilm.meta` reads "16:9 master · 30 sec";
printed under a 4:5 still it names the wrong shape for the picture directly
above it — a caption contradicting its own frame, which is worse than none.
⚠ And the caption's row WRAPS while each half does not: a 4:5 frame in a SHORT
field is 281px wide at 1280×720 where the poster it replaced was 500, and the
two runs met and broke mid-phrase.

⚠ **`LOOP_ATL_FILMS` IS HELD BY REFERENCE** by the homepage casefile, the
portfolio arc and this card (`toBe`-pinned), so a field only one renderer reads
changes nothing for the other two. Both suites pass untouched.

### Guards

`cases-registry.test.ts` gains the arc (all-or-none per casefile, steps unique
and consecutive from "01", title ≤44 measured against the head's slot, never
equal to `project`, no digits but the step, inside the envelope scan) and the
portrait (repo-rooted src, alt, dimensions REQUIRED and asserting 4:5 — the
renderer derives the frame's aspect from the CLASS, so a still whose real shape
disagrees letterboxes inside a box solved for 4:5). ⚠ The smoke's `cardShape`
reader now looks for the rail in the FIELD: reading it from the head is how it
would report four railless cards and stay green on a rail that had silently
stopped rendering.

## Update 3 — the arc IS the title, the studio switches, and the video plays (2026-09-10)

Three corrections and additions from the owner, same day, on top of U2.

### The arc replaces the name, it does not sit beside it

_"Maybe I misspoke or you misunderstood, but the lines that I said, 'We push
the frontiers of AI creative,' should replace the title 'AI Above-the-Line'."_

U2 put the beat in the head and kept the project as the display heading. The
claim is what the card is called. So `.tl-card__title` letters `arc.title`,
and the project's own name goes UP into the head as chrome — `01 · AI
ABOVE-THE-LINE` beside the client.

⚠ **THE NAME GOES TO THE HEAD RATHER THAN AWAY, and that is the peek band
again.** U1 recorded it, U2 answered it with the arc, and this move would
have re-opened it: a head carrying only `LOOP EARPLUGS · BUILD` reads the
same on all four. Chrome names the FILE, the display makes the CLAIM. Nothing
is said twice and the pile still indexes itself — and the ≤20-character rule
on `project` is what makes it fit a 52px `nowrap` strip where the 44-character
claim sometimes did not.

### The studio gets the sheets it always had

_"For the Creative Team Self-Sufficient AI Fluency Studio, we also should
have tabs, just like on the homepage, where we have our guidelines on where
not to use AI, governance and the red line. You can repurpose the elements
from there."_

The record already held all three — THE ADS, THE LINE (the imagery policy,
two columns and a PRINCIPLE) and THE RED LINE (four ranked risk bands and the
POSITION that says UGC is off the table) — and this card was reaching past two
of them to render the ad wall alone. That is the "it's not just the ads" the
casefile itself was told on 2026-08-06, on this same row.

⚠ **THE FIELD MOUNTS `SheetsPlate` WHOLE, NOT ITS BODIES, AND THE REASON IS
TOKENS.** The first cut extracted a `SheetContent` (body + verdict) on the
`ToolField`-out-of-`ToolGallery` precedent — and it was wrong here.
`.fl-cmp` and `.fl-caps--sheet` read `--con-hair`, `--con-hair2`,
`--fl-chrome-sm/md/lg`, `--fl-display`, `--fl-ink-dim` and `--fl-plate-px`,
which are declared on `.fl-case` and `.fl-con` — **and RE-DERIVED for light
on those same selectors** (`theme.css`: `--fl-ink-dim` .4 → .62,
`--con-hair` gold → `rgba(138,107,32,.5)`). This route has neither class, and
it is LIGHT-LOCKED, so a route-local copy of the dark values would have
rendered dark-tuned line work on parchment — ADR-058's own trap, in a new
place. The plate brings its console, and the console brings both themes.

⚠ **ITS RAIL PORTALS INSTEAD (`railHost`), the seam U1 built for the map and
this is its second consumer.** One additive prop; omitted, the render is
byte-identical, which the casefile and the portfolio arc rely on and their
smokes assert. And the state stays with the plate for `PdaConsole`'s reason:
the plate is what knows which sheet is open, so `proofTabs` returns `null` for
this kind rather than publishing a second switch for one piece of state.

⚠ **THE SIX ADS HAD TO BE RESTORED, and the condition is the BAY's shape.**
`casefile.css` hides shots 4–6 by default and puts them back under `.fl-case`
at a viewport rung — a class scope, chosen there because `.fl-con` is
`container-type: inline-size` and `@container` cannot ask about height. With
no `.fl-case` this route fell through to the default and showed three of six.
Here the bay IS a size container, so the honest test is available: two rows
fit when the bay is portrait-ish, which is the owner's 1920×1247 and not
1280×720. Same ruling, measured directly instead of by proxy.

### The video plays, and none of it is new

_"We should have a video walkthrough of all these software … I also shared
that Google Drive link with the actual videos. That's what I want you to add
to the Software for Few and then above the line."_

Both already exist in the repo: `ProjectCase.walkthrough` is the four
screen-recorded tool walkthroughs the homepage plays, and `CaseFilm.src` the
two 16:9 ATL masters. The Drive folder holds the films' resizes, which U2
already used for the 4:5 stills.

⚠ **TWO OBJECTS, TWO AFFORDANCES, and that is the homepage's own split.** A
film's control is its own FRAME — a `<button>` with a play cue over the still,
which is exactly what `.fl-film` is on the films plate. A drawing gets a
LABELLED bar, because a control over a wireframe has to say what it opens;
the tools plate fuses one to its bay for the same reason. One affordance per
object either way: the drawing itself is not clickable.

⚠ **`MediaLightbox` PORTALS TO `document.body`, AND HERE THAT IS MANDATORY
RATHER THAN TIDY.** This card lives in a `position: sticky` slot inside a
clipped stack, and a clipped or transformed ancestor becomes the containing
block even for `fixed` (ADR-056 U8). The scroll lock comes with it, which is
also why nothing needs to close the player on scroll: the page cannot move
while it is open.

⚠ **THE STILL IS THE 4:5 SOCIAL CUT AND THE PLAYER IS THE MASTER.** The box is
tall, the lightbox is not.

### Two things the layout got wrong first, both found by looking

- **`justify-items: center` on the tools field** would have collapsed the
  drawing to zero — `.fl-wire`'s only child is absolutely inset, so it
  contributes no content size and its `min(100%, …)` resolves against
  nothing. Fifth occurrence of that trap on this route; the column stays
  `1fr` and the BAR centres itself.
- **`grid-template-rows: 1fr auto`** put the watch bar on the bay's floor,
  ~300px adrift from its drawing: a `1fr` row absorbs every spare pixel, so
  `align-content` has nothing left to distribute. Both rows are `auto` and
  the pair centres as one group.
- ⚠ And **the watch bar comes out of the height the drawing solves against**.
  The bay is the size container, so `100cqh` is the whole bay — bar included
  — and left uncorrected a landscape drawing overflows by exactly the bar.

### Guards

The smoke pins the ruling from BOTH ends — the claim is the heading AND the
name is in the head — because a regression that swapped them back satisfies
either half alone. It reads the rail from the card's own SLOT rather than
anywhere in the field, which is what proves the studio's portal landed rather
than the plate quietly keeping its rail in its own console. And it opens the
walkthrough, asserting the four properties that make it work: it portals to
`body`, its src is the record's, the page cannot scroll under it, and Escape
closes it — a control that renders and does nothing is the defect.

⚠ **AND SEATING CARD 3 NEEDED A REWIND.** `seatSlot` returns early on
`covered`, which was harmless while the tabs lived in the head — a covered
card still shows its peek band, so its controls were reachable. With the rail
and the bar in the FIELD they are under the card above. A converging re-seat
did not work either: `rect.top + scrollY` on a `sticky` element that is
already pinned gives the PINNED position, so `doc − pin` converges on wherever
it already is (measured: 12532 → 12765, `covered` eight passes running).
`seatSlot` is sound only walking DOWN the pile, so the test rewinds to the
stack's top and walks.

## Update 4 — the notch, the ordinal alone, and the cut plays in its frame (2026-09-10)

Four notes from the owner on the finished cards.

### `THE LINE` becomes `GOVERNANCE`

_"The line here should be governance."_ One label, in the record, so all three
surfaces that hold `LOOP_STUDIO_SHEETS` by reference move together. The sheet's
`id` stays `line` — it is a DOM id, and churning it would move `data-sheet` and
two smokes' selectors for nothing.

⚠ It is also a correction the surface was asking for: the tab said "the line"
while the band under it says **THE PRINCIPLE** and the sheet beside it is
**THE RED LINE** — two lines, one of which was not the line.

### The cards are chamfered housings

_"All the cards in the proof section should have a notch, like on the homepage,
in the bottom-left and top-right corners."_ That is ADR-065's CANONICAL
diagonal, and the law's own reading of what a chamfer means: a machined
housing, which is exactly what a card holding an instrument is.

⚠ **A CLIP CUTS A BORDER, IT NEVER STROKES ONE** (ADR-089). A bordered box
under this clip has no line on either diagonal — six edges outlined and two
not. The rule is a CLIPPED RING instead: one polygon carrying the outer
contour and the inner one with `evenodd` making the middle a hole, which is
the services plate's gold lip in a second place. ⚠ And the inner leg is **not**
`ch − 1px`: insetting a 45° cut by `d` on both axes shortens its leg by
`d(2 − √2)` ≈ 0.586d.

⚠ **RULE 4 CAME WITH IT, AND IT CAUGHT A LIVE MISMATCH.** The smoke's new
"children are square" assertion failed immediately on `.fl-con__console`,
which carries `console.css`'s **TL + BR** cut — ADR-065 U2's enumerated
exception, which ADR-089 RETIRED on the casefile when the console became a
cell inside a chamfered housing. That whole pass is `.fl-case`-scoped, so this
route still had it: a console leaning one way inside a card leaning the other,
one box inside the other. Giving the card its notch is what made it visible.
The console is square here now — the same ruling, for the same reason, one
surface later.

⚠ It also makes the card a containing block for `fixed` descendants, which is
survivable only because `MediaLightbox` portals to `document.body`. A dialog
written inline here would be trapped in the card.

### The head keeps the ordinal and loses the name

_"That subtitle — whatever, Intelligence Map, Software for Few — in the
top-right corner, you can remove that."_

U3 put the project's name there as the peek band's distinguishing mark. The
STEP keeps that job on its own: `01 … 04` differs per card and is an INDEX
rather than a second title, so the pile still reads as a sequence when the
slivers stack. The project's name now letters nowhere on the card — the claim
is the heading and the rail names the parts, which is what the arc was for.

### The 4:5 cut plays in its own frame

_"We have the 4:5 showcases from the Google Drive folder. Add them to Supabase,
whatever, because right now, when you click on the video thumbnail, it shows
the full-screen video. I don't want that."_

⚠ **NOT SUPABASE, AND NOT BY PREFERENCE.** CSP is `media-src 'self' blob:
data:`, so a bucket URL is blocked outright. Both cuts are transcoded from the
studio's masters (11 Mbps) to `public/videos/` at **6.8 MB and 1.2 MB** —
lighter than the 16:9 masters already sitting beside them.

`CaseFilm.portrait` becomes `{ poster, src, meta }` — the same pair `CaseFilm`
itself carries, one aspect down. A click swaps the `<button>` for a `<video>`
**in the same box**: the cut is 4:5 and so is the frame, so the swap is
pixel-for-pixel and nothing reflows under the pointer.

⚠ **STILL NO `<video>` UNTIL A CLICK** (ADR-056 U5) — a mounted element costs
a layer and this card sits four deep in a sticky stack. `autoPlay` is safe
precisely because the mount IS the click.

⚠ **THE PLAY STATE IS KEYED ON THE FILM'S OWN `src`, NOT A BOOLEAN.** A
boolean would carry "playing" across a station switch and mount the next film
already running — a second film starting that nobody asked for.

⚠ **THE LIGHTBOX SURVIVES WHERE IT EARNS ITS KEEP.** The tools keep theirs
because a screen recording of a UI is unreadable at card scale, and a film
with no 4:5 cut would keep its 16:9 master there for the same reason. What was
wrong was the mismatch, not the mechanism: a cut authored FOR a small vertical
frame, taking over the whole page.

### Guards

The head is pinned as TWO DIGITS, so a name creeping back beside the ordinal
fails. The chamfer is pinned from both ends — the card cut, its console and
its field square. And the player is asserted to mount, to be the self-hosted
4:5 cut, to raise NO lightbox, to take the still's exact box, and to give the
next film its still back on a station switch.

⚠ **TWO HARNESS TRAPS, both of which blamed the page for the harness.**
`locator.click()` scrolls its target into view first, so a scroll baseline
taken before the click is a reading from a different position — the lock check
now measures with the player already open. And `page.mouse.wheel` dispatches
where the POINTER is, wherever the last click left it; a wheel outside the
dialog is not testing the dialog.

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

## Update 5 — the proposal's head sits on the homepage's datum (2026-09-10)

Owner:

> The Trinny London configuration section — the text, or the placement of the
> H1, the heading 1, and the paragraph — because if I look at the homepage it's
> a bit higher placed.

### The head was seated by the drawing under it

`.tl-prop__stage` centred its whole record — head PLUS the configuration drawing
— in the pinned frame, so the head's position was set by half the drawing's
height rather than by any decision about where a masthead goes. Measured at
1920×1247:

```
proposal head   top 306   frac 0.241
homepage masthead title    frac 0.107   (.services-masthead__title, same frame)
```

More than twice as far down, and nothing on the head's own box said so — the
record was correctly centred, which is exactly why no gate had an opinion.

`align-content: start` plus a datum-derived `padding-block-start:
clamp(48px, 10.7svh, 148px)`. The head starts at the homepage's datum and the
drawing takes what is left. Measured after, at all three reference viewports:

```
1280×720    head frac 0.107   record 77..671 of 720    bottom air  49
1440×900    head frac 0.107   record 96..699 of 900    bottom air 201
1920×1247   head frac 0.107   record 133..790 of 1247  bottom air 457
```

⚠ **`start` IS ALSO THE SAFER OVERFLOW, AND THAT IS NOT INCIDENTAL.** `center`
spills a too-tall record equally through the top and the bottom, so
`scrollHeight === clientHeight` and every clip gate reports zero — this repo's
own recorded trap, named on the sheets plate and again on the casefile. Seated at
the top a record can only overrun downward, where it is visible.

⚠ **THE SLACK POOLS AT THE FLOOR NOW, AND THAT IS AN OPEN QUESTION.** 457px at
the owner's viewport — a third of the frame — sits under the drawing. The house
rule is _split the slack, don't pool it_ (ADR-069, ADR-070 U14), and the obvious
application is a `1fr` row with the drawing centred in what the head leaves. It
was NOT taken: the owner asked for the head, the arithmetic puts ~185px between
the head's coral rule and the drawing if the slack is split, and _a rule is part
of what it rules_ (U5's own finding, one element up). Both readings need his eye,
not a guess. Raised rather than resolved.

### Guarded

`tests/visual/trinny-london-smoke.spec.ts` — "the proposal seats its head on the
homepage's datum": head frac inside 0.06–0.15 with the stage asserted PINNED
(`data-tl-prop` > 0.3) first, plus the record's bottom inside the frame.
Negative-tested — restoring `center` fails it.

⚠ **ROLL TWICE INTO THE PINNED BAND.** The first long roll from the top is
clamped while the corridor inflates the document, and a reading taken there is of
an UNPINNED station: it reports a head frac of 4.1 and reads as a catastrophic
failure rather than as a harness miss. Cost two measurement passes in this one.
