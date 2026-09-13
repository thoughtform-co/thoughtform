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

## Update 6 — the player takes the still's RECT, not just its size (2026-09-10)

Owner, on the film card: the player _"moves to the left side while it should
stay centered like the thumbnail"_.

U4 shipped the 4:5 cut playing in its frame and claimed the swap was
"pixel-for-pixel". It was — in **size**. `.tl-field--films` centred its content
with `justify-content: center`, which centres the **track**, and the field's one
column was `auto`, sized from whichever child contributed the widest
max-content:

|                 | resolved track                                                 | field inner | `.tl-film` |
| --------------- | -------------------------------------------------------------- | ----------- | ---------- |
| still @1280×720 | **326.2px** — the CAPTION's max-content                        | 528.8       | 250.2      |
| live @1280×720  | **528.9px** — full; a `<video>`'s intrinsic width saturates it | 528.8       | 250.2      |

So under the still the track was roughly the picture's own width and centring it
centred the picture; under the player the track filled the box, `justify-content`
had nothing left to centre, and `.tl-film` — which carries a definite `width` —
fell to `justify-items`' start, flush against the left padding edge. Measured
**121–141px** of jump at 1280×720 / 1440×800 / 1728×1080 / 1920×1080, at an
identical size.

⚠ **THE STILL WAS NEVER CENTRED EITHER**, which is the tell that the mechanism
was structural rather than a `<video>` quirk: where the caption is the widest
child, the track is the caption's, so the picture sat **38px** left of centre at
1280×720 and 8.6px at 1440×800. Nobody saw it because nothing jumped.

**The fix is one declaration each way**: `grid-template-columns: minmax(0, 1fr)`
makes the track the box — so `.tl-film`'s `min(100%, …)` re-clamps against the
same number in both states — and `justify-items: center` centres the ITEM rather
than the track. Widths come out byte-identical to what shipped (250.2 / 309.1 /
518.7 / 518.7); only the origin moves.

⚠ **THE GENERAL FORM: a grid that centres content-sized tracks centres whatever
the content happens to be.** Any box whose child swaps element type — a poster
for a player, an `<img>` for a `<video>`, a drawing for a capture — wants a
definite track. An `auto` one makes the layout a function of the content's
intrinsic sizing, which is exactly the thing the swap changes.

### The guard measured a silhouette

`expect(inline.box).toEqual(filmBox)` read `{ w, h }` and nothing else, so a
frame that kept its size while changing its origin satisfied it completely. That
is **ADR-069 U1's finding one surface later** — `pda-flight` compared two rects
as silhouettes and missed an interior that had changed underneath. A rect has
four numbers and a guard that drops two of them is not a weaker version of the
check, it is a different check.

It compares the full rect now, plus a centring assertion — because equality
alone still cannot catch the case both states are wrong in the same way, which
is precisely what the 38px still was.

⚠ **AND IT IS MEASURED RELATIVE TO THE FIELD, NEVER THE VIEWPORT.**
`locator.click()` runs a `scrollIntoViewIfNeeded` before it clicks, so the two
reads either side of it are not taken at the same scroll offset — the first cut
of the tightened guard reported **181px of pure `y` drift** on a frame that had
not moved inside its panel at all, and the failure looked like a second defect.
U4 already recorded that trap for a scroll baseline; it applies to a rect read
just as much. The claim is about where the player sits IN ITS BOX, so that is
the frame to measure in.

⚠ **The film field has no other rung** — one rule governs it at every viewport,
so there was no responsive branch to check and no rung where the old behaviour
was correct.

## Update 7 — the proposal is one instrument with a picker (2026-09-11)

Owner, with the Aether repo open: _"we had our headless configuration there …
I really like the composition there so can you dig into that."_ And, on the
same day, the hierarchy this route's proposal has to sit inside: **the Arc is
the approach; the proposition is what the team ends up with — self-sufficient,
transferable, adoption and automation one flywheel — and the intelligence
configuration is one specific workstream, a component of it.**

### What the composition is

The old Aether landing's `#headless` panel (unmounted since the operator
homepage; `loop_aether/components/landing/surfaces.tsx` + the `.headless*`
block of `landing.css`): ONE instrument. Left, the layer as a card of four rows
— Rules · how the team decides / Examples · what good looks like / Sources /
Loops — that DIM unless the picked surface reads them. Right, a rule "pick
one", four selectable tiles, and a readout that swaps with the pick. Its
argument was made by the hand: pick a surface and the contract is visible in
one diagram. That is the property the owner named, and it is the property the
§7 drawing did not have — five stacked bands that could only be read, never
asked.

### What changed

`#proposition`'s drawing is redrawn on that grammar, adapted to this route's
register (light-locked, dawn/gold ramp, zero type literals) and to the
proposition's hierarchy:

- **The LAYER stays left, "owned by Trinny London"**, its four rows carrying
  their record: brand rules and the line where AI stops · what good looks like
  from their own work · the catalogue and the customer's voice · the checks
  that catch it before the founder does.
- **The tiles are the TEAMS on the layer** — Studio · Creative ops · Finance,
  the three of §7's people plates that are teams (the founder's sense-check and
  the customer's voice moved into the rows they belong to). Picking one lights
  only the rows it reads: **transfer made visible without a digit**, the same
  layer lit three ways.
- **The readout is the picked team's intelligence configuration**, in the
  registry's five questions — who owns it · what runs it · the bar · what it
  can reach · where it runs. §7's surfaces band (Claude · Monday · Figma ·
  Shopify · Slack) is not deleted, it moved: each is now the answer to "where
  it runs" for the team that runs there.
- **The flywheel is the seam**: two arrows between the halves, ADOPTION
  pointing at the layer with §7's own note ("the team learns on its own work
  and writes down what good looks like"), AUTOMATION pointing back at the work
  ("the layer runs inside the tools they already use, and hands the time
  back"). §7's `Adoption ↓` / `Automation ↑` labels, turned to point at the
  things they connect.
- **Three bands, three kickers, one reveal mark** — the smoke's structural
  pins hold unchanged, because the structure IS three regions on one plate.

### The mechanics

- ⚠ **THE RECORD LIVES ON THE TILES AS `data-*`** (`data-layers`,
  `data-owner`, `data-runs`, `data-bar`, `data-reach`, `data-where`). The
  parse guard's walk (no Arc word, no digit, no "self-sufficient") strips tags
  but keeps attribute text out — so the tiles' attributes are ALSO asserted
  directly: every `data-layers` id is one of the four rows, every tile carries
  all five answers, the readout has exactly the six slots. A value the pick
  can letter is a value the guard has read.
- **`usePropPick`** (`app/(marketing)/trinny-london/proposition/usePropPick.ts`,
  called from `TrinnyPortals` beside `useTurnScroll`) is ONE delegated
  `click`/`keydown` listener on `[data-tl-config]`. Never a listener per tile:
  the body is `dangerouslySetInnerHTML`, and per-node listeners die the way
  nested roots do. Arrow keys walk the `role="tab"` tiles; Enter and Space are
  the button's own.
- ⚠ **THE RESTING STATE IS AUTHORED.** The first tile is
  `aria-selected="true"` and every row is `is-on` in the markup, so the
  drawing reads whole with no JS, under reduced motion, and in the parse test
  — the hook adds the pick and nothing else. `data-tl-reveal` stays on the
  instrument's root, count three.
- **Gold is the built thing and nothing else.** The lit rows, the picked tile
  and the readout's top rule take `--gold-line` / `rgba(--gold-rgb, …)`; the
  plate, the unlit rows and the resting tiles are dawn. `type-material-tokens`
  stays at `{A:0, B:0, C:0}` — every tracking is a `--track-*` role token,
  every weight `--weight-text`, every uppercase run is PT Mono.
- **Below 960px the instrument stacks**: layer, then the seam as a row of the
  two words with their notes (the arrow runs have no axis once the bands
  stack, so they drop), then the tiles one per row and the readout with its
  keys over its values.

### Guards

`trinny-london-parse.test.ts` gains the tile/row/slot pins above.
`trinny-london-smoke.spec.ts` picks the third tile in the lit state and asserts
from BOTH ends: the picked tile selected and the first un-selected, the Examples
row dimmed and the Rules row lit, the readout's name and its "where it runs"
equal to the tile's own attribute — then picks the first again so the stills
read the resting record.

### Where the composition came from, and where else it went

The same instrument is the owner's proposition one-pager (a design canvas,
2026-09-11) and slide 8 of the Suri proposal (`suri-proposal-v15.html`, in
place of the Arc orbit). On the deck it is drawn DARK, as the Aether panel
was; here it is drawn in the route's light register, because a dark slab
over the coral wash is the paint-over-the-record this route rejected twice
(ADR-095 U1, U5).

### Left open

- The head's copy still says "Headless and built from first principles";
  the strategy doctrine has demoted headless to a footnote. Owner's word,
  owner's call.
- Finance's configuration is a PROPOSAL of their record, not a reading of it
  (no brief exists in the Trinny folder to check it against). The Studio and
  Creative ops answers are drawn from §7's own plates and surfaces.
- The slack that pooled at the floor (U5) pools more: the instrument is
  shorter than the five bands were.

## Update 8 — the card fills its housing (2026-09-11)

Owner, on card 03 at his own viewport: _"I'm really liking the clean nature of
our proof cards … I feel like there's a lot of unused white space. Maybe look
at the references to see whether we can actually make more use of the white
space. Maybe we need to add some visual elements because right now it's a bit
sparse. I don't want to add too much text either."_ Then the type: _"the
smaller text below, like '97% of meetings involve AI,' and the text below it …
can both be a bit larger. Maybe the title … can also be increased."_ And the
field: _"the right panel … there's also a lot of unused space, and the elements
are too close to the center border and the right border. I would leave a bit
more room and maybe we can redesign them a bit so they fill in a bit more of
the real estate, just subtly."_

### What was measured before the change (1920×1247)

- The record column was a flex stack seated at the top and it stopped 40 %
  of the way down: **~330px of plate under the claims with nothing framing
  it**. The claim carried no size of its own — it inherited the row's
  `clamp(14px, 1vw, 16px)` and was told apart from its sentence by INK alone.
  Title 20–26, lede 16–19, sentence 12–13.5, glyph 14px.
- The tools field centred a landscape drawing (1.62, U1's lock) in a portrait
  864×928 bay with **`padding: 2px`** — the bay's frame touched the divider
  and the card's edge — under a centred pill bar reserved at **46px while
  measuring ~27**, with ~140px of unframed plate above and below the pair.
- **No guard pinned a type size on the card.** `fontSize` appeared in zero
  assertions of the smoke; the only pin on the sheet counts tracking and
  weight literals. That is how it shipped one rung small.

### Read against the Panels references

The owner pointed at `_01_GENERAL REFERENCES\Panels` — the twelve Vilimovský
Cyberpunk sheets, the amber PRX map, the HUD kit. Read for what they do with
a region rather than for their chrome (`docs/design/hud-panel-lab/README.md`
distils the six principles), two of them are this card's defect stated the
other way round: **air inside a drawn box is room, air under a list is a
hole**; and **the centrepiece sits in a bay with head and foot micro-labels,
seated in an apparatus rather than floated in a space**. The house already
had the answer to four claims in a tall box one surface over — the RED LINE
sheet's `1fr` bands (ADR-084) — and the answer to a drawing over a bar on the
homepage's own tools plate, where the watch bar is FUSED to the bay's bottom
edge (ADR-068).

### Decision

1. **One type ladder on the card**, declared on `.tl-card` (ADR-085's own
   discipline — one root, one ratio): `--tl-copy` is the lede's size
   (`clamp(16px, 1.15vw, 19px)`, unchanged), `--tl-ratio` 1.2, `--tl-sub`
   one step under, `--tl-display` three steps over (`clamp(24px, 1.7vw, 32px)`
   ≈ copy × 1.2³ at both ends). **The claim is the lede's PEER by size and
   outranks it by WEIGHT** — `--weight-lit`, the ceiling — which is ADR-088's
   law one surface over (the ordering a ladder guarantees is the one inside
   its own face): claim and sentence rank by size, claim and lede by weight.
   The sentence takes `--tl-sub` and `--tl-ink-2`. The glyph goes to the next
   lattice rungs — 21px, 28px on the 940h rung where the sentence shows
   (integer 7-cell multiples; `ProofGlyph.tsx`'s rule). Chrome stays 11px
   PT Mono and is not on the ladder.
2. **The record column is one grid and the register fills it.**
   `title · lede · register`, the register on `minmax(0, 1fr)`, its four
   claims on `grid-auto-rows: minmax(0, 1fr)` — equal RULED BANDS to the
   column's floor, each centring its claim and sentence (`align-content`,
   with `align-items: start` kept so the mark hangs off the claim's line).
   A `--tl-rule` seam above the first band, `--tl-rule-soft` between bands
   (.10 → .12; it was declared and read by nothing), and the last band's
   rule at the seam weight because it is the column's floor line.
3. **The field is inset off both edges, on every card** — `--tl-field-px`
   (16–28px) as `padding-inline` on `.tl-card__field`, so the rail's
   stations and the bay's box land on the same two verticals; the leading
   station loses the 6px margin that put it inboard of the box under it.
   **And every field ends on the record's floor**: `.tl-field` is inset
   `--tl-field-gap` above and `--tl-card-py` below, where `--tl-card-py` is
   the record's own vertical padding. Three cards ran their console to the
   card's edge with the register's last rule 40px above it — two floors.
4. **The tools bay is an APPARATUS.** `.tl-field--tools` is one hairline box
   (`--tl-rule`) from under the rail to that floor, three rows: a HEAD
   micro-label (`IN SERVICE {year}` — `ProjectCase.year`, the record the
   homepage's bay letters on its FEED line; left slot only, ADR-064 U1), the
   drawing centred in a `1fr` row with `--tl-bay-pad` (14–28px) off the
   walls, and the watch bar FUSED as the box's FOOT — full width, a
   `--tl-rule-soft` rule above it, cue and label leading, the duration at
   the far end, `--tl-watch-h` 30px because that is what the row is.
   `--tl-wire-h` subtracts every one of those terms from `100cqh`. ⚠ U3's
   "never `1fr auto`" guarded a bar that belonged UNDER its drawing from
   landing on the bay's floor; the bar IS the foot now, so the middle row is
   `1fr` by design and the drawing centres in it with `align-self`.
5. **The aspect lock stays at 1.62 on a landscape bay and eases to 1.5 on a
   portrait one** (`@container (max-aspect-ratio: 1)`). ⚠ **A bigger bay
   does not buy a bigger drawing**: `.fl-wire__lbl` caps at 10px, vesper's
   dock at 58px, mímir's rail at 190px, and the chrome pips are all
   `min(…, Npx)` — only vesper's `61cqh` tile grows. So the BOX is the
   answer to the field's void and the aspect is a bonus, taken only where the
   bay is height-slack.

### Not done, on purpose

- **No capability row under the drawing.** The four `capabilities[].title`s
  are engineering nouns (`Headless REST + MCP`, `Monday → Figma sync`) that
  need their sentences on a pitch card, and that is the text the owner
  declined. The record is unchanged: no new field, no new copy.
- **No datum rail down the glyph column** — the owner deleted datum rails
  twice (hud-panel-lab).
- No shared-sheet edit: `console.css`, `casefile.css`, `ProofGlyph.tsx` are
  untouched (the glyph's size was CSS-driven already).

### Measured after

At 1920×1247 (the owner's shape): title 32 on two lines, lede 19, claim 19 at
500, sentence 15.8, mark 28; four bands of **149.5px**; the register's last
rule at the record's content floor to the pixel; rail and bay **24px** off
the divider and off the card's edge; the tools box 808×834 with the drawing
767×511 (1.5) inside it and the bar's bottom on the box's bottom (1px); the
register's floor and the box's floor on ONE line on every card, the film
595×770 and the six ads inside that floor. At 1280×720 / 1440×800: title
24 / 24.5, lede and claim 16 / 16.6, the sentence sr-only, mark 21, bands
**44 / 60px**, inset 16 / 18px, the drawing height-bound at 1.62 (416×257 /
537×331), every rail handle on one line. ⚠ The first cut's `2vw` inset
truncated `BRIEFING AGENT` at both laptop shapes — the ADR-089 U3 headroom
warning, arriving from the inset's side — so the token's slope is `1.25vw`
and the stations gave back 2px of padding a side.

### Guards

`trinny-london-smoke.spec.ts`'s reader gains `ladder` and `housing`, and the
proof test pins, on every card: title ≥ 24px, **claim size equal to lede
size** (an equality, not a floor — the day one moves without the other the
rank is by accident again), claim weight 500, mark ∈ {21, 28}, and rail
inset ≥ 15px both sides; on the tools card: the box exists, its head letters
`In service {year}`, the drawing clears the box's left wall by ≥ 12px, the
bar's bottom and both ends equal the box's (≤ 1.5px), and the register's
last rule equals the box's bottom (≤ 2px). `type-material-tokens` stays at
`{A:0, B:0, C:0}`.

### Left open

- The bands' air at the owner's viewport — ~40px above and below each
  claim's ink in a 149px band. The RED LINE runs ~150px bands on the arc and
  reads; whether this column does is his eye.
- The 1.5 aspect on a portrait bay is judged on the stills of all four
  drawings; if one pools, the rung goes back to 1.62 and the box stays.

## Update 9 — the offer follows the configuration, on this page (2026-09-13)

Owner: _"The Trinny London page and its contents are all perfect, so don't
touch it. … if you go to one of the bottom sections, the Trinny London
configuration, that's where the proposal actually starts."_ Asked whether the
proposal's remaining beats should live on an arc the page hands off to
(recommended) or be appended here, he chose **appended**.

### What was built

`#offer`, a new `.station` between `#proposition` and `#contact`, whose only
child is a slot — `[data-tl-offer-root]`. `TrinnyPortals` mounts
`offer/TrinnyOffer.tsx` into it through the SAME nested-root lifecycle as the
proof stack, and that component renders the arcs' own `ArcListGroups` and
`ArcCards` inside an `.arc-root` over `offer/offerSections.ts`: the phases as
plates, the loop, needs and keeps, the fee as a ledger, the people, the next
steps, the appendix (ADR-098 U2's drawings). The pitch route imports
`arcs.css` for it — audited: its only out-of-scope selectors are `#rollout`,
`html[data-arc-entry]` and the theme-lock switch rule this route already
carries.

⚠ **"Appended" did not mean a second hand-written copy.** The alternative —
authoring seven beats as HTML in the fork with their own CSS — is the third
copy of one page ADR-098 argued against, and a fix to the plates would have
had to be made twice. One renderer, two hosts: `/arcs/suri-proposal` and this
page draw the offer from the same components, which is what the owner's "as
close to the HTML as possible" needed to be true on both.

### What moved with it

- **The kill edge.** `#offer` is the first OPAQUE station below the corridor
  now (the `.station` base paints the ground, every arc beat paints its own
  void), so `data-corridor-kill` moved from `#contact` to it — an attribute
  move and nothing else, because the cover rule (§9 of the route sheet) and
  `useCorridorExitScroll` both key on the attribute. Measured on the seam:
  nothing of the ghost mark prints below `#offer`'s top; above it, the
  proposition's own floor slack (426px at 1920×1247, U5's open item) is what
  the reader crosses.
- **The journey clock.** `offer` joins `TRINNY_JOURNEY_ORDER`; the Proposal
  mark takes `range: ["proposition", "offer"]`, the Arc mark's device, so it
  stays gold from the configuration to the appendix. ⚠ The SECTOR readout
  counts the offer as a row of its own (05/06) — `sectorRows` is derived per
  station and a range is a fact about the mark, not the rail. The nav drawer
  gains `04 · The offer`.
- **`TrinnyOffer` is NOT `ArcSectionRenderer`** — that dispatch statically
  imports every kind, the dossier console and the holo program's three.js
  mount among them; a page-local switch over the two kinds the offer uses
  keeps `three` off this route's graph. And NOT `ArcShell`: the HUD chrome,
  the lock, the hero boot and the scroll writer are all already here. What is
  copied is the reveal opt-in, class and observer together.
- **The copy law follows the beats.** `PROPOSAL_COPY_BANS` lives in
  `lib/arcs/copyLaw.ts` now; `tests/lib/trinny-offer.test.ts` walks the offer
  with it and fails on any Suri noun that survived the swap.

### Measured

At 1920×1247, headed: stops 01–20 unchanged; `21-offer-phases` at y 22999 and
`22-offer-pricing` at y 26712 with `station=offer`, `gold=proposition`,
`sector=05/06`; `13-contact` at y 31414. The plates' foot is a dark band on
parchment (the light re-derivation reaching through `.arc-root`), pinned in
the smoke from the computed colours.

### Left open

- The copy is Suri's, noun-swapped (Suri → Trinny London; Kate, Mark, Nick →
  the studio lead, the founder) — the owner's own placeholder, to be rewritten.
- The parchment between the configuration's kickers and the phases head is
  two known terms: U5's floor slack and the arc beat's top padding. Owner's
  eye, as U5 already said.
