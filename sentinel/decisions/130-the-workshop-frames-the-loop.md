# ADR-130: The workshop frames the loop before it shows it, and four kinds draw the frame

- **Status:** Proposed (2026-09-27, owner). Built, guarded and captured the day
  before the room (Plopsa workshop III, Monday 28 September 2026). Flips to
  Accepted once the owner has read the page live.
- **Surface:** `/arcs/plopsa-workshop` — `lib/arcs/content/plopsa-workshop.ts`
  (re-cut, thirteen beats); `lib/arcs/types.ts` (the `readout` layout, the
  `stages` · `curve` · `horizon` · `questions` kinds, `ArcStage`,
  `ArcHorizonGate`, `ArcQuestion`); `components/arcs/{ArcStages,ArcCurve,
ArcHorizon,ArcQuestions}.tsx`, `components/arcs/framing/*Layout.ts` (pure
  geometry), the `ArcReadout` branch of `ArcListGroups.tsx`, `ArcSectionRenderer`,
  `KIND_DESIG`; one block in `arcs.css` ("THE WORKSHOP'S FRAMING") and its light
  wells; `tests/lib/arcs-registry.test.ts` (the framing pins),
  `tests/lib/arc-terminal-markup.test.tsx` (the arc joins the walk),
  `tests/lib/sheet-config-fit.test.ts` (Plopsa leaves the configuration list).
- **Supersedes:** on this page only, the `configuration` picker beat (ADR-098)
  and the `krea-of-setup` beat. Nothing house-wide.
- **Related:** [ADR-052](052-client-arcs.md) (the enumerated exceptions to
  "content-only": seven before this, eleven after it),
  [ADR-078 U1](078-portfolio-proof-page.md) (draw the record, not the metaphor —
  see the workshop clause below), [ADR-100](100-the-configuration-is-a-board-in-two-states.md)
  (gold is the built thing, green is the human), [ADR-106](106-the-outcomes-are-one-dial-read-three-ways.md)
  (grammar from another repo is copied, never imported; a filled node is a
  person's hand), [ADR-076](076-portfolio-flows-and-the-architecture-beat.md)
  (the curtain holds the first beat), Moira's ADR-050 ("the second session is
  the arc", `loop-moira/docs/decisions/050-…`).

## The ask

The owner, 2026-09-27, on the Plopsa workshop page: it is "missing a bit of
context". The second and third beats (three recap cards, a quote) should fold
into "two super clean panels: this is what we covered and this is what we'll
do", not "simple boring-ass frames that look like a glorified PowerPoint". Then
the framing from Loop's Moira workshop (`from-prompt-to-agent`), because "they
are actually the same workshop" and he wants it harmonised and "first really
brought into the Thoughtform brand world": a prompt, a tool, an agent, each
running longer without you; intelligence as a resource and the curve (the more
capable the model, the longer the task); the question whether a workflow is for
a person or an agent; the horizon (without context and evals an agent cannot
know what good is, and review grows with the volume); one piece of work with six
questions around it, re-laid as the model · the context · the evaluations on the
left and the data · the interface · the owner on the right; and "this is where
you have the most leverage". The Moira caption about "the studio's own line of
work" is dropped. Plopsa's own examples throughout.

## Decision

1. **The page opens on the frame.** Thirteen beats: the two panels
   (`vandaag`), the stages, the curve, the question (an interstitial, no new
   code), the horizon, the six questions, the rules as the leverage beat
   (existing plates, re-headed), then the template, the loop, Live, the hands-on
   hour, IT and the close. Five chapters: Vandaag · Drie manieren · De
   configuratie · De template · Live.
2. **The two panels are a LAYOUT, not a kind** (`list-groups` `layout:
"readout"`). Two of the house's notched plates, the gap as the divider (no
   vertical rule), each the plate's own head band, then READOUT ROWS — the key
   framed and filled, the value framed on the shared edge and set right (the
   /arcs dossier's Starfield row, owner 2026-09-21) — and the foot seated at the
   floor. The right plate's rows are in-page links, so it is the day's index
   (the tool index's grammar, ADR-079), never a description of it. No prose
   inside a panel: the head's sub carries the sentence. That is the answer to
   "glorified PowerPoint": what a slide does is a title over bullets in a box;
   this is a dated record beside the page's own navigation, in the machined
   material every other plate beat on the surface uses.
3. **Four new kinds, ADR-052's eighth to eleventh enumerated exceptions**, each
   one leaf, server-only, no state, no listener, no script, `data-<kind>-*` only,
   every colour an alias of the ADR-077 ramp, and no `transform` on any SVG node:
   - `stages` — three R4 housings (the corner pair, a head band ruled at its
     floor, a rule that stops at the cut) on a graticule over the dot matrix;
     width is how long each runs without you, height how much of the work it
     holds; the agent's is the one gold object; beside it, three rows in the
     plates' head-band material, the lit one filled and the other two ring-only
     (ADR-089 U4). The owner chose this over re-skinning Moira's isometric
     plinth floor.
   - `curve` — the program board's step ladder (ADR-078 U1) on a dated axis: a
     riser every seven months (METR's doubling), seven treads, the seat at NOW
     the one gold mark, a dashed reference at the length of the work the room is
     there to hand over. No vendors, prices or lanes: those were Loop's.
   - `horizon` — Moira's two tracks, copied by hand (`geometry.ts` §horizon),
     with the dial's law for every mark: a FILLED node is a person's hand, an
     OPEN one the model. Nine filled nodes above, two open gates below, one gold
     run.
   - `questions` — Moira's board on house material: the work at the centre on the
     plate's top-right notch (a single notch means connected), six plates on the
     lawful TR + BL pair, eight-wire ribbons (R4). Gold is what the team writes
     (the context, the evaluations), green is the human (the owner). **Not a
     third mode of `board`**: `arc-board-fit` pins that kind's two-state tuple on
     every registered board, and a third mode would branch every assertion in it.
     The plates are DOM (the answers wrap, SVG text cannot); the SVG carries only
     the ribbons, which end at a plate's edge, never under it (a plate is 0.55
     alpha in dark).
4. **The workshop clause on ADR-078 U1.** "A drawing plots something that
   happened; if all it knows is an argument, the argument is better as a
   sentence" stays the law for proposals and portfolios. A WORKSHOP teaches a
   frame before it shows the work, so a framing figure may draw an argument,
   provided it names its source or its own record in its words: the stages name
   Plopsa's own three steps (July, the tool, the loop), the curve carries its
   source and "een beeld van die vaststelling, geen meting per model", the
   horizon's note says the three gates are the loop's real ones. A figure that
   can say neither is still a sentence.
5. **The six-question board replaces the configuration picker on this page.**
   Two configuration instruments on one page is the house's said-twice defect.
   Consequence, recorded and not fixed tomorrow: `lib/sheet/arcs.ts`
   `arcConfiguration()` reads only `configuration`, so the owner's `/arcs`
   dossier draws no configuration chips for Plopsa until a
   `configurationFromQuestions` reader lands (the `STACK` regexes already match
   the answers' `Claude` and model words).
6. **The Krea question folds into one tip** on the IT beat (owner's pick): keep
   Krea as a tab if they like; the difference is where the judgment lands and
   the price per call on their own key.

## How it is budgeted (the traps it met)

- **Every beat pays for its instrument out of its own air, never the format's.**
  `data-arc-format="workshop"` is shared with the Claude workshop and the Suri
  kickoff; a format selector would retune two pages nobody measured.
- **The first beat is seated on `--arc-stage-pad`, not `--arc-sec-pad`**: the
  curtain holds its band fixed and the flow box must be the same box (ADR-076).
  The readout tightens the STAGE token on its own section, so both read it and
  the beat stays exactly one viewport (`data-arc-tall` off).
- **A centred beat moves its head by half the height it loses.** At 1280×720 a
  full head margin seated five eyebrows through the client mark's hairline
  (y ≈ 44px, `.arc-hud-client::after`) in exactly the frame the handout shoots.
  The framing heads take `clamp(28px, 18vh − 100px, 112px)` (the house's 112 by
  1247h) and each figure is capped in `svh`; measured, every framing head sits
  at ≥ 104px at 720 and every framing beat is exactly one viewport at
  1280×720, 1440×800, 1920×1080 and 1920×1247.
- **`arc-stage` is a banned substring in reveal markup** (the terminal grammar's
  class); the stages figure's classes are `arc-floor*` for that reason.
- **A module's cut is R4's (≤14px), not the plate rung**: at 26px the BL chamfer
  bites the answer's last line (ADR-098 U5: a cut is free only where nothing is
  set against it).
- **Labels scale with the viewport above their laptop floors**, so 1280×720
  renders as measured and the owner's 1920×1247 does not read as a laptop drawing
  blown up.

## Guards

`arcs-registry` ("the workshop's framing kinds hold their records"): the
readout's two plates, a foot on each, a key on every row, no prose, every link
in-page and resolving; the stages' one lit stage and it is the last, label
budgets; the curve's four consecutive years and its note; the horizon's gate
order `check, retry, ask`, sorted inside the run, six to ten checks; the board's
six unique questions, the lit pair adjacent on the left, one owner, answers ≤ 60,
the work's image on disk; and NO DIGIT on any instrument's lettering (the curve's
years excepted). `arc-terminal-markup` walks the whole arc in both motions.

## Left open

- The `/arcs` dossier reader for `questions` (Decision 5).
- The owner's live read, at the room's own screen.
- Loop's copy of the same workshop is still Moira's; harmonising it onto these
  kinds is the next step he named, not this one.

---

## Update 1 — the frame goes into three dimensions, and the mark shares the wordmark's vertical (2026-09-27, owner)

The owner read the page live, hours after ADR-130 shipped, and gave four notes:

> "in the hero section can you move the plopsa logo so its vertically aligned
> with the thoughtform wordmark, when you move into the next section, the plopsa
> logo should move to its top left corner … the second section … should be a bit
> more visual, a bit more creative then just those glorified powerpoint panels
> … the third and fourth section are inspired by the evals v2 workshop from
> moira but our interpretation looks boring af; i want isometric, 3D
> visualizations, but true to the retrofuturistic interfaces / holograms from
> our thoughtform brandworld … please use your taste; use our diagram and
> particle system to update the thoughtform-design skill etc"

with six reference boards: 1980s vector and CAD displays (an exploded MEP
floorplan, the CERN L3 event display), a Tron grid plane carrying wireframe
machines, an orange isometric terrain relief, a magenta orbit HUD. Asked which
of the three Moira-derived beats he meant, he confirmed **`de-horizon` too**;
asked where exactly the mark should rest, he said **"top left just a bit more
inwards so it's vertically aligned with the thoughtform wordmark"**.

**This reverses Decision 3's own ruling**, recorded the same morning: that the
Moira workshop's isometric plinth floor was set aside for the house's flat
register. It is reversed on his word, and only for these beats.

### 1 — one projection, and it is a cabinet oblique

`components/arcs/framing/iso.ts` is new, pure, zero-import, and every framing
drawing reads it. **`ISO_BASIS_CABINET`** — `a` straight right, `b` back at 30°
foreshortened to 0.5, `z` straight up.

⚠ **NOT THE MAP'S 2:1, AND THE REASON IS ARITHMETIC RATHER THAN TASTE.** Under
2:1 a depth of `d` costs `0.5·d` of HEIGHT, and every beat here is capped in
`svh` so the section stays one viewport at 1280×720 (`data-arc-tall` off): the
horizon's time axis is 7.4 units wide and would have spent a third of a 440-unit
crop on depth alone. Cabinet costs a quarter of that, and it keeps a TRUE
HORIZONTAL for time and a TRUE VERTICAL for work — which is what lets a years or
minutes scale stay a readable baseline on the near edge.
**`ISO_BASIS_2TO1` is kept, byte-equal to `mapProjection.iso()`**, for a compact
object that can pay for it, and `arc-iso.test.ts` pins the copy against the
original's own formula so it cannot drift.
⚠ **COPIED, NEVER IMPORTED** (ADR-106's law; the map's `iso()` is two lines):
`@/components/landing/home-v2/...` would drag the casefile's module graph onto
an arc route.
⚠ **ONE BASIS FOR ALL FOUR DRAWINGS.** Mixing projections is what broke the map
prototype (ADR-062); a drawing whose basis differs from its neighbour's reads as
a rendering fault, not as a second point of view.

### 2 — no label ever sits on an axonometric face

`.claude/rules/proof.md` §The BOARD archetype records what isometric costs on
this surface: the Intelligence Map city printed its district plaques **through
their own plates 10–13 times per sheet, at every viewport, in both themes, with
every containment guard green** — a label on a 30° face has no baseline, its
seat depends on the whole scene, and depth eats the width it needs. Closed by
construction, three ways:

1. **The SVG letters nothing.** Every string is a DOM span seated on the
   `--ax` / `--at` fractions the layout emits (the dial's idiom, ADR-106), with a
   one-elbow leader from the span to the thing it names.
2. **`labelCollisions` is a build gate.** Each layout exports `…Labels()`, the
   renderer seats spans from exactly that list, and `tests/lib/arc-iso.test.ts`
   walks every pair of boxes on all four drawings. ⚠ It carries a NEGATIVE case
   too — two labels at one seat must fail it — because a guard that has never
   failed is a guard nobody has checked, which is precisely how the city's
   containment walk stayed green.
3. **Paint order is depth order.** SVG has no z-buffer, so `isoDepth` sorts and
   the last thing drawn is the thing in front.

⚠ **AND THE LIVE PIXEL WALK IS THE OTHER HALF.** The unit arithmetic uses an
honest estimate of the rendered type, since the spans' `font-size` is a
`clamp()`; the capture measures real `getBoundingClientRect`s at four viewports.
Neither is sufficient: the arithmetic cannot see a CSS change, and the capture
cannot tell you which constant to move.

### 3 — the corner law on a projected face

A chamfer on an axonometric plate is a cut on **the SCREEN's diagonal, not the
world's**. Under this basis screen x rises with BOTH `a` and `b` while screen y
falls with `b`, so the top face's screen top-right corner is `(a+w, b+d)` and
its screen bottom-left is `(a, b)` — the pair the reader sees on ADR-065's
lawful diagonal. Cutting the world's `(+a,−b)` / `(−a,+b)` pair instead puts the
chamfers on the drawing's left and right extremes: the unlawful diagonal wearing
world coordinates. Pinned from both ends in `arc-iso.test.ts` (the two cut
corners present as pairs, the two sharp ones present as single vertices).

### 4 — the three instruments

Records and types are **byte-identical**; only the geometry, the markup and the
CSS moved. `ArcSectionRenderer` and `KIND_DESIG` do not change.

- **`drie-manieren`** — a ruled datum, the time axis on its near edge, a true
  vertical for work, three wireframe prisms whose footprint is how long each
  runs without you and whose height is how much of the work it holds. Hidden
  edges dashed; the agent's prism is the one gold object; a tag hangs off each
  prism's own top-left corner on a short leader.
  ⚠ **THE CROP IS 460 TALL, NOT 540.** The stage is width-bound, so the crop's
  height is pure letterbox: the ink runs 368 units and a 540 crop spent its whole
  surplus as a band of void ABOVE the drawing. Trimming a crop does not shrink a
  width-bound drawing; it deletes the empty band. The column's share went
  1.25fr → 1.45fr, which is the only lever that DOES make it bigger.
- **`de-curve`** — METR's ladder extruded into a stepped relief along a dated
  floor: the crest is the draw-on run, the far profile and the cross-ties are
  static, the footprint's hidden edges dashed, a dashed reference plane cuts
  through at the length of work this room hands over, and NOW is the one gold
  seat at the crest's end.
  ⚠ **THE TIME AXIS IS STRETCHED AGAINST THE WORK AXIS** (`YEAR_A`), stated
  once: seven doublings are three years wide and three units tall, and at one
  scale on a 2.5:1 crop the relief is a stub in the left third. The years' own
  spacing stays uniform, so it is still a dated axis and nothing about the
  reading changes.
- **`de-horizon`** — two lanes over one datum. Far and above, the operated
  tool's short runs with a filled node after each; near and on the plane, the
  agent's one gold run passing through three wireframe GATE FRAMES that stand on
  the floor with dashed drops, the retry's loop drawn IN THE PLANE (a bezier
  under the rail lifts off the datum, which on an axonometric reads as a fault).
  ⚠ **THE LANES ARE SEPARATED IN HEIGHT AS WELL AS DEPTH**, and nothing is
  encoded by the lift: the gates stand about a unit above the agent's rail, so
  two lanes on one plane put the gate labels through the far lane's own row.
  ⚠ **`operated.check` LETTERS ONCE**, at the last check. Eight repetitions of
  three words along an isometric lane is the plaque defect in a new place; the
  eight filled nodes already say how often, and the phone list carries the
  sentence.
  ⚠ **THE RUN STARTS INBOARD OF THE FLOOR'S EDGE** (`RUN.a0` 0.9): each lane's
  name is set from its right edge, ending where the lane begins, and the agent's
  lane is the near one — least offset by depth — so a run starting on the datum's
  own edge hung its label off the crop.

### 5 — `vandaag` gets the template, exploded

The two panels keep their records; between them sits **one campaign template
lifted into its layers** — five wireframe chamfered plates on four dashed
verticals over a ruled datum, the CAD exploded-assembly reference, each named
off to the right on a single straight leader. The base plate — what the setup
draws — is the drawing's one gold object; the top layer is the free zone, drawn
DASHED, because a safety margin is a rule the artwork obeys rather than ink the
setup paints.

⚠ **`exploded` IS A FIELD ON THE `readout` LAYOUT, NOT A LAYOUT AND NOT A KIND.**
Decision 2 ruled the panels a layout; the registry guard branches on
`layout === "readout"`; a kind would touch `KIND_DESIG`, the renderer switch and
the markup walk to say nothing new. `ArcStackLayer` is `{ id, label ≤16, note?
≤40, dashed? }`, top of the stack first, three to five, at most one dashed, all
digit-free (the PSD's filename carries a year and a format — it lives in a code
comment).

⚠ **EVERY CHILD OF THE THREE-COLUMN GRID DECLARES ITS ROW.** Auto-placement is
SPARSE: once the index plate is placed in column 3 the cursor has passed column
2, so a figure that named only its column was pushed onto a second row — the beat
measured 1021px against a 720px viewport, `data-arc-tall` came on and the curtain
disarmed itself, **with nothing failing**. The drawing is last in the DOM (the
reading order is the record, the day, then the figure between them) and column 2
by declaration.

⚠ **THE LABELS SIZE THE DRAWING, NOT THE OTHER WAY ROUND.** A 33-character note
at the rendered type needs ~165px, so the label column is 162 of 360 crop units
and the plates get the rest. Sizing the plates first and squeezing the words
after is how the city's plaques happened.

⚠ **THE CROSS-KEY WAS BUILT AND DELETED.** An `ArcListItem.layer` let a row in
the day's index name a layer, lighting that label gold and giving the row a
stub. It went the same hour: **gold buys one thing per drawing**, and a second
gold rung for "a row points here" breaks that law to say something the room will
never see from the back of the lab. The lawful alternative — a drawn wire
between the row and its plate — needs both boxes' measured y, i.e. a client
script the server-only readout leaf may not carry; recorded, not taken.

### 6 — the client's mark has two seats

At rest it shares the Thoughtform wordmark's own LEFT EDGE
(`--hud-content-inset`, the very token `.hud__brand` rests on); it docks to the
corner (`--hud-margin`, where it has always sat) as the wordmark collapses. A
purely horizontal glide on the wordmark's own 0.4s `left` transition; the mark
stays on the top row throughout, so Decision 6's head clamp is untouched.

⚠ **KEYED ON `.arc-root:not(:has(.hud__brand.is-collapsed))`, NOT ON
`data-arc-scrolled`.** `HudNav` writes the class at 0.5vh; `useArcScroll` stamps
the attribute at 1vh. The two marks must move on ONE frame — a 0.5vh gap is half
a viewport of the mark sitting inboard with the wordmark already docked. No new
scroll writer (ADR-002): the condition is the DOM the existing one already
writes. ⚠ Scoped to `min-width: 961px`, where the wordmark paints at all.
Measured: 192/192 at 1920×1247, 144.7/144.7 at 1440×800, 129/129 at 1280×720,
corner-only at 900×700, and both return on the way back.
Guarded by `tests/lib/arc-hud-client-seats.test.ts`, which also re-asserts that
`arcs.css` declares no rule on `.hud__brand` itself.

### The line ladder, and the draw-on law

One ladder for all four drawings, on `.arc-floor, .arc-curve, .arc-hz, .arc-xp`,
quietest first: the datum's grid · a hidden edge · a tie or a leader · a face's
silhouette · the run. Every colour aliases a rung the ADR-077 light foot already
re-derives; only `--arc-iso-gold-hidden` is an alpha of its own (a `color-mix`,
the dial's own device).

⚠ **THE DATUM IS THE `--arc-rule` RUNG, NOT `--arc-rule-dash`.** A dashed line
already loses half its ink to the gaps; at .10 the plane a machine stands on
measured as nothing on the still, and the drawing read as boxes floating in void
— the reference's opposite.
⚠ **STATIC LINE WORK TAKES `vector-effect`, A DRAW-ON RUN MAY NOT** (ADR-106):
under `non-scaling-stroke` the browser ignores `pathLength` and the draw breaks
into partial arcs.
⚠ **A DASHED RUN CANNOT DRAW ON** — its own dash array IS the transition's
channel — so the free zone's plate is excluded IN THE SELECTOR, not by a later
override: the two rules tie on specificity and the draw-on block is declared
last.
⚠ **TWO PER-DRAWING `__grat` RULES WERE SHADOWING THE SHARED ONE** and silently
undoing the lift, because they were declared later against the quieter rung.
They are deleted; the ladder owns the class.

### Guards

`tests/lib/arc-iso.test.ts` (25 cases): the 2:1 copy against `mapProjection`'s
own formula; the cabinet basis on unit vectors; a unit cube's three hidden edges
all meeting the far-bottom vertex and its nine visible ones; the plate's cut
corners pinned from both ends; the relief's monotone crest, its riser count and
its end; determinism of the dust; and, for all four drawings, every drawn point
inside the crop, every label seated in `[0,1]`, no pair overlapping, plus the
negative case. `arcs-registry` gains the `exploded` branch.
`arc-hud-client-seats` is new. `arc-terminal-markup` passes untouched.

### Measured

Every framing beat is exactly one viewport — `scrollHeight === innerHeight`,
`data-arc-tall` absent — at 1280×720, 1440×800, 1920×1080 and 1920×1247, dark
and light, with zero live label overlaps and no label outside its stage.
`scripts/pdf-arc.mjs` prints no `(tall: …)` on any of the four.

### Left open

- **The WebGL lift.** A three.js field behind these drawings would go through
  ADR-080's one dynamic seam — an `ArcIsoMount` mirroring `ArcHoloProgramMount`
  with a `data-iso` tri-state — and `arcs-import-doctrine.test.ts` would need
  its one-dynamic-reach pin amended to two files. Not taken: SSR, the headless
  handout and determinism all argue for pure SVG, and the room is tomorrow.
- **The light theme's plate faces read SOLID where dark reads WIREFRAME**
  (`--arc-plate` is opaque on parchment by ADR-077's own ruling). It reads as a
  CAD print rather than a hologram, which is arguably right for the printed
  handout; the owner's live read decides.
- `scripts/pdf-arc.mjs` needs PyMuPDF to assemble; the stills render and the
  per-beat `tall` report is what this pass used. Pre-existing.

## Update 2 (2026-09-27, owner) — the four framing beats go live, and the page is written again

> "I looked at the output, and I'm not satisfied. It feels very flat and not
> what I want. If I look at the Moira, the V2 evals workshop, that looks much
> cleaner. Also, you didn't use any of our particle systems, none of the
> 3D/3GS visualizations. I really want you to go back to the drawing board and
> redo it properly this time … Also, we have a Thoughtform TOV skill that does
> tone of voice. Even though it's English, we can also do Dutch, so really make
> text as functional as possible. Everything needs to connect, but I don't want
> it to be like AI slop as it is now, even in Dutch."

U1 shipped a cabinet-oblique SVG at one hairline weight, no faces, no glow and
no motion beyond a draw-on, in about 40 % of each beat. Measured against the
six reference boards he had sent — an exploded MEP floorplan, the CERN L3 event
display, a Tron grid plane, an orange terrain relief, a magenta orbit HUD —
every one of them has luminous strokes, a floor that recedes, translucent
faces, several weights in one drawing and dust. **It was a two-dimensional
chart wearing a three-dimensional costume.** And the repo already owned the
thing he meant by "our 3D": ADR-080's WebGL instrument, with its dust shader,
bloom, orbit controls and DOM labels tracking projected anchors — sanctioned on
an arc, and left on the shelf.

⚠ **THE "EVALS V2 WORKSHOP" COULD NOT BE RE-READ.** `github.com/tensalir/moira`
now answers 404 and the local checkout holds no workshop surface at all — its
`lib/holo/**` is a spend-configurator's object. What was available is that
module, and it is worth more than the deck would have been: four numeric
disciplines, adopted here verbatim. One size-encoded quantity per drawing.
Decorative strokes at a third of structural opacity. Few long dashes rather
than many short ones. And a label solver that **drops** a block by priority
rather than letting two print through. Its fifth rule was already ours:
nothing is drawn that has no number behind it.

### Decision 1 — the SVG becomes the fallback it was always meant to be

Each framing beat mounts a canvas on ADR-080's tri-state. `data-holo` absent is
the server render; `"static"` is reduced motion, ≤900px, no WebGL or a dead
canvas; only `"live"` hides the figure, written from the scene's FIRST
COMMITTED FRAME. **The printed handout goes out on the fallback by design** —
`scripts/pdf-arc.mjs` is headless, so it shoots the drawing U1 shipped, which
is why that drawing was not touched. Verified: GL off and PRM both render
`data-holo="static"` with every path present and `data-arc-tall` absent.

### Decision 2 — one shell, four scenes, and the drawing is DATA

`components/holo-stage/` is `HoloProgramCanvas` generalised. A scene is a
`HoloStageSpec` — world-space polylines, translucent faces, seeded motes and
label anchors — built by three-free functions from the record; `HoloStageScene`
is the only component that knows how to paint one. ADR-080's own scene is a
component per object, and its record says twice what that cost: the lab and the
page drifted into two compositions with every guard green. **Four beats cannot
afford four of those.** Palette, dust shader, post stack, life constants, orbit
damping and the fit law are IMPORTED from `holo-program`, not copied.

### Decision 3 — the live pose reproduces the static basis

⚠ **THE FALLBACK AND THE HOLOGRAM ARE ONE DRAWING, AND THE CAMERA IS WHAT
MAKES THAT TRUE.** `framing/iso.ts` draws these beats in a cabinet oblique;
at azimuth 30° and elevation 24° a perspective camera projects

    a → ( 0.866, −0.203)     b → ( 0.500, +0.352)     z → ( 0, +0.914)

against cabinet's (1, 0) · (0.433, 0.25) · (0, 1). ⚠ **NOT the same angle, and
the first cut of the guard claimed it was**: cabinet's depth runs at a screen
ratio of 1.73 and this camera's at 1.42, so the live depth is a little steeper.
Both read as the same object from the same corner; asserting an identity that
is not there would have made the guard a fiction. `b` maps to three's **−z**,
because +z comes toward the camera at this azimuth and mapping depth onto it
would draw the record back to front with nothing failing.

### Decision 4 — a per-canvas anchor channel, and the doctrine test grows a second leaf

`holoAnchorsRef` is a module singleton, correct while one canvas publishes.
This page mounts FOUR: they would overwrite one another every frame and the
labels of whichever rendered last would land on all of them — silently, since
every write is valid and every read returns something. `createAnchorChannel()`
is passed to the canvas and to the label layer.

`arcs-import-doctrine.test.ts` now pins the dynamic reaches to
`["ArcHoloProgramMount.tsx", "ArcHoloStageMount.tsx"]` — and **closes the hole
ADR-080 U3 left open**: the old `HOLO_FREE` branch was an `else if … continue`
with no assertion, so a static import of `HoloProgramScene` inside
`components/arcs/**` would have passed CI and dragged three into First Load JS.
Every three-full module under either folder now fails statically. Proved by
adding such an import, watching the test fail by name, and removing it.

### What was measured, and what it corrected

- ⚠ **THE SHARED BLEED ERASED THE BEAT'S OWN RECORD.** `.arc-holo[data-live]`
  negates the instrument margin, because the trajectory is ONE full-width
  object with its chrome floating on it. Three of these beats are a drawing
  BESIDE its record, and the canvas paints an opaque ground — so the bleed did
  not overlap the readout's two plates, it blanked 150px of each. The four
  beats reset `inset: 0`.
- ⚠ **THE OBVIOUS FIX FOR "TOO SMALL" PUT THE HEAD UNDER THE NAV.** ADR-080
  U3's remainder — band one viewport less its padding, figure the `1fr` row —
  cannot trip `data-arc-tall` at any size and is the right answer there. Built
  here and REJECTED: the beat is `align-content: center`, so a band that fills
  leaves centring no slack and the head lands on the section's padding.
  Measured at 1920×1080 the head went from y 207 to y **43** and its origin
  mark overhung to y **8**, through the HUD row and across the client mark's
  hairline — the exact defect U1's head clamp exists to prevent, arriving from
  the other side. **The slack is the budget**: `clamp(320px, 50svh, 700px)`
  seats the head at 128 and still hands the object 540px against 478.
- ⚠ **THE SOLVER AND THE STYLESHEET SIZED DIFFERENT BOXES.** The declutter
  separates blocks `m.blockW` wide; the sheet capped them at a literal, so at
  1194px of canvas it pushed 98px apart while the text ran to 200 — `retry`
  printing through `ask` with the lane reporting clean. The width is WRITTEN
  from the solver's own metric now. Mirroring the clamp in CSS is the other way
  round, and a second place for one number to be wrong.
- ⚠ **AND THE DROP PASS MEASURED A MODEL OF THE LABEL RATHER THAN THE LABEL** —
  this estate's fourth time (ADR-070 U34, ADR-069 U1, ADR-080 U3). `blockH` is
  one nominal block; a gate's label wraps to three lines and stands half again
  as tall, so a model-based walk reported a clean board while two sentences
  overlapped. It reads `getBoundingClientRect()` on the placed elements now.
- ⚠ **THE GATES OUTRANKED THE PEOPLE ONLY AFTER THE FIRST SHOOT.** All three
  gate labels dropped while "Jij zet het doel" kept its slot: a drop rule is
  only as good as its order.
- ⚠ **THE LANE'S NAME AND THE PERSON AT ITS START WERE ONE POINT.** Both were
  the rail's first vertex, so they projected to one pixel and the declutter had
  nothing to separate. The name steps forward in depth.
- ⚠ **AN ANCHOR OUTSIDE THE BOUNDS IS A LEADER THE LENS NEVER PROMISED TO
  KEEP ON SCREEN**, and three were — found by the new unit guard on its first
  run. `specBounds` takes the anchors.
- ⚠ **THE EIGHT HAND-OFFS ARE DRAWN, NOT ONLY LETTERED.** Only the last one
  letters (a repeated plaque is the map city's defect in a new place), so
  without a mark per check the far lane read as one dashed line and the
  repetition — which IS that lane's argument — was simply absent.
- ⚠ **THE RETRY LOOP SAT INSIDE THE GATE IT RETURNS THROUGH.** Run in the
  rail's own horizontal plane it was invisible at every pose in the band;
  lifted, it reads as the step back it is.
- ⚠ **A TAG LEANING OFF A FACE'S CENTRE LANDS ON THE VOLUME IT NAMES**, because
  a prism here is as tall as the label is far. The stage tags lean off the top
  face's FAR edge, so the stand-off is up AND right, clear of the object.
- ⚠ **LIGHT IS TESTED THROUGH THE SWITCH, NEVER THE ATTRIBUTE** (ADR-093). The
  first light shoot stamped `data-theme` and produced a black plate on
  parchment with invisible labels — a defect in the harness, not the page: the
  GL painters read the STORE. Through the toggle, light is an ink drawing on
  parchment, flush with the ground.

### Decision 5 — the page is written again, whole

Every string on all thirteen beats went through `thoughtform-tov`: translate,
then voice, then a fidelity repair against the sources. The diagnosis was
structural, not lexical. **Eight of thirteen titles shared one shape** — `A, B`
— with ten replacement contrasts ("Niet kijken maar doen", "De grader
adviseert, hij beslist niet"), triads throughout, five colon-titles, and five
aphorisms the page had coined for itself ("Informatie is geen uitnodiging",
"elke regel is één check"). Titles are NAMES now, in his forms: a plain claim,
a fronted "waar/hoe/waarom", a real question kept as one.

⚠ **TWO CLAIMS OVERSTATED THE RECORD AND BOTH ARE CORRECTED.** The page said
"Achtentwintig checks, in gewoon Nederlands" **twice** — there are exactly 28
checks and the rubric is written in **English** ("**It is this place, built as
in image 1.**"); it reads "elk één zin" now, which is true. And both Live cards
claimed "Pass, drie keer" for frames that sit in `qa_results.json`'s `unstable`
array: the three runs DISAGREED and the verdict came by `quorum: 2`. They read
"Pass, twee van drie runs". **A number on a client's page is a thing they can
check**, and these two were on the cards the room looks at hardest.

⚠ **THE DISPLAY-TITLE GUARD LEARNED DUTCH.** ADR-078 U1's regexes are English
and walk the PORTFOLIO alone, which is how eight counting pairs shipped. The
new case walks the Dutch arcs by slug — a `lang` field the record does not
carry would make the guard's reach depend on the copy it guards — and compares
on a DE-ACCENTED skeleton. ⚠ **The first cut missed its own worst case**:
Dutch capitalises the numeral "Eén", whose first character is a plain `E` that
no case-fold of `é` reaches, so "Eén stuk werk, zes vragen eromheen." passed.
**A guard written against one spelling of its own keyword reports green on the
string it was written for.** Calibrated both ways: six old shapes caught,
thirteen new titles and his own question clean. ⚠ `een` is in the PAIR set and
out of the OPENER set — de-accented it is both the numeral and the article, so
it reads as a count only when a second numeral answers it across the comma.

### Guards

`tests/lib/holo-stage-geom.test.ts` (24 cases): the pose against the cabinet
basis, the azimuth band never crossing the axis, finite world, one gold donor
per spec, every anchor inside its own bounds and leaning on a different point,
a lens inside `[FIT_FOV_MIN, FIT_FOV_MAX]` at the four reference shapes, a
wider canvas never needing a longer lens, a mark per hand-off with the gates in
the record's order, the exploded stack built base-first with the base gold and
the guide dashed, determinism per seed, and the channel not being a singleton.
`arcs-import-doctrine` and `arcs-registry` as above; `arc-iso`,
`arc-terminal-markup` and `arc-terminal-smoke` pass untouched.

### Measured

All four beats `data-holo="live"`, `data-arc-tall` absent, zero horizontal
overflow and **zero label collisions** at 1280×720, 1440×800, 1920×1080 and
1920×1247. With GL disabled and under reduced motion all four fall back to the
SVG with every path present. `npm run verify` green (2392 tests, 145 files);
`arc-terminal-smoke` 10 passed. ⚠ Two failures in `subpages-smoke` and
`arcs-instrument-smoke` are PRE-EXISTING and confirmed unchanged.

### Left open

- **The eighth hand-off's label drops at 1280×720 and 1440×800.** Ten blocks on
  a 1016×360 canvas do not fit, and it is the lowest-priority string on the
  beat: the eight drawn diamonds carry the repetition and the note spells the
  three gates out. Named rather than hidden.
- **A label may still overlap the translucent volume it names** on the smallest
  prism, where the block is wider than the box. The register's law is about
  lettering baked ONTO a face; a DOM block with a halo over a wireframe is what
  the trajectory beat does too. The owner's live read decides.
- **`scripts/pdf-arc.mjs` still needs PyMuPDF** to assemble, and it shoots the
  fallback by design. Pre-existing.
- **The Moira deck itself.** If the repo comes back, its `evals v2` framing is
  worth re-reading against these four beats.

## Update 3 (2026-09-28) — the `/arcs` dossier reads the six-question board

Closes Decision 5's consequence and the first item under **Left open**: the
owner's overview drew no configuration for Plopsa once its picker became the
board. `lib/sheet/configuration.ts` gains `configurationFromQuestions`, and
`arcConfiguration()` (`lib/sheet/arcs.ts`) takes a `configuration` section or,
failing one, a `questions` section.

- **One row, because the board has one piece of work at its centre**: the
  work's `name`, no note. ⚠ The work's `line` is a SENTENCE where a proposal's
  note is a phrase, and the die letters a note on one unwrapped line — it ran
  4px past the narrow crop and 74px out of the die on the wide one. Measured by
  `sheet-config-fit`, not guessed.
- **The links are what the six ANSWERS name**, through `lib/arcs/stack.ts`'s
  matchers, each used by the one row. All six are read, not the three whose ids
  happen to say `model` / `data` / `interface`: ids are authored per page, and
  a reader keyed on them goes blind the day Loop's copy spells one in English.
- ⚠ **The image-generation matcher learned the models' names** (`Nano Banana`,
  `GPT Image`): the model answer names the models, not the class, so without
  them the board drew Claude alone. The chip still letters the class, as the
  vocabulary requires. No other page's reading moved (every pin `toEqual`).
- **Plopsa's dossier now reads** `Een campagnefamilie` · Claude × 1 · Image
  generation × 1, pinned; before ADR-130 it read three workstreams off the
  picker (Creative, Campagne, Web as the ghost).
- **Guards**: `sheet-config-fit` puts Plopsa back on the list of boards and
  derives the list from BOTH kinds, and a new case fails any arc carrying a
  picker AND a board (the said-twice defect, now a test); `sheet-arcs`
  recomputes "configured" over both kinds. The board fits all four crops.
- Verified on `/arcs#arc=plopsa-workshop` at 1920×1247 and 1280×720, dark and
  light.

## Update 4 (2026-09-28, owner) - one stage, seen from its front corner, three readings

The owner read U2 live at 04:30 on the day of the room and rejected it: the
stages beat's drawing was cut off on the side; the three drawings were "all
different and not the type of isometric view I want"; in ours "the vanishing
point is on the right side", where the Moira workshop he held them against
draws every figure with none; dragging did not help anyone read them; and the
`vandaag` panels had too many blocks and an ugly stack between them.

**The cause of the cut was arithmetic.** U2's perspective lens needed 43.8
degrees for the stages spec and was clamped to the trajectory's 34 without
ever checking the projected extremes, while the figure capped at ~677px wide
and kept growing in height: the agent block ran 85px past the canvas at
1920x1247 with every guard green, because "solves a lens inside the band"
cannot fail against a solver that clamps into that band.

Decisions:

1. **One parallel projection for the fallback and the hologram.** Moira's
   own: both floor edges at 22 degrees from the front corner, the floor a
   rhombus centred on the stage (`ISO_BASIS_STAGE`, `framing/iso.ts`). The
   WebGL camera is an ORTHOGRAPHIC camera at azimuth 45 degrees and elevation
   asin(tan 22) that projects exactly that basis; U2's "close, not identical"
   caveat is gone, and `holo-stage-geom` pins the identity point for point.
2. **The canvas frames the SVG's own crop.** The frustum is the viewBox
   (`stageFrustum`), the canvas is mounted INSIDE the stage box, and live mode
   hides only the SVG's geometry: the DOM words, leaders and horizon nodes are
   the fallback's own, fixed, in both modes. `ArcHoloLabels` and its drop pass
   are no longer mounted on these beats. Nothing can be cut off: the crops
   are DERIVED from every point a drawing uses (`framing/floor.ts`
   `frameAround`), and a new guard walks every spec point into its crop.
3. **No drag, no breathing.** The pose is fixed; the hologram lives by its
   draw-on, flicker, twinkle and dust. Faces are OPAQUE and shaded top
   lightest (the first live shoot's translucent faces read as X-ray), and the
   SVG fallback is filled the same way, drawn farthest first.
4. **One stage, three readings, built on each other.** All three stand on the
   same floor module with one time edge (minutes at the front corner, half a
   day at the right tip): the three blocks at Moira's positions and heights
   (02), the staircase of the models, a riser every seven months with the
   frontier tread gold and the heights read off a post (03), and the two lanes
   marked on the floor, gates as open and filled nodes (05). U2's gate frames,
   posts, ribs and tower are gone.
5. **`vandaag` says the ask and the answer.** Three rows (30 July, Filip's
   mail of 22 September, Bert's templates of 25 September) and four links;
   the exploded stack, `ArcExploded`, `explodedLayout`, `explodedSpec` and the
   `exploded` field are deleted.
6. The curve and horizon figures are capped at 38svh so their heads clear the
   client mark at 1280x720; the gate sentences are measured against the stage
   (`9cqi`, a container on the stage), not the viewport.

Measured: live and reduced-motion, dark and light, at 1280x720, 1440x800,
1920x1080 and 1920x1247 - every framing beat one viewport, zero word overlaps
(rotated words tested as rectangles), zero horizontal overflow, every head
clear of the client mark. `npm run verify` green.

Left open: the owner's live read at the room's screen; ghost blocks on the
curve's treads (built into the plan, not taken); the stages head clears the
mark by 11px at 1280x720, where the ADR asked for 104px of seat.

## Update 5 (2026-09-28, owner) - the curve and the horizon are the Moira workshop's own figures

The owner read U4 live and rejected two of its three drawings: the curve
"is like blocks but it doesn't show the models", and for both it and the
horizon he named the source outright - the "From prompt to agent" workshop
in `loop-moira` (`/workshops/from-prompt-to-agent`): "use that graph and
copy the functionalities". And no "plaat" anywhere in the Dutch: it is not
a Flemish word for an image.

### Decision 1 - the curve is Moira's frontier chart, ported whole

`ArcCurve` is `Curve.tsx` copied by hand (ADR-106: copied, never
imported): two vendors on one curve, the three lanes and their models as
points on its front edge with a list price under every name, a warm strip
of floor for the step change, and the second dial (effort) as the same
curve drawn again behind it, a surface. `ArcCurveSteps` is her
`CurveSteps`: the figure drops to its front edge the first time it is 60 %
on screen, and two buttons bring in the prices and the surface; the server
render, no-JS, reduced motion and paper get the whole figure. The geometry
is `framing/curveSurface.ts` (her `depth.ts` + `curve.ts`). The record
changed shape to carry it: `lanes` (fast · everyday · frontier, each with
models and prices), `others` (the other vendor's points), `prices`,
`effort`, `axes`, `key`; the staircase fields, `curveLayout.ts` and the
hologram scene are deleted.

⚠ THE COLOURS ARE THE HOUSE'S: Claude and its lanes gold, the frontier
the one filled chip and dot among outlines (ADR-089 U4), the other vendor
dawn, the step a gold wash. Moira's lane hues do not travel; green is the
human here.

### Decision 2 - the horizon is Moira's two tracks, ported whole

`ArcHorizon` is `Horizon.tsx` copied by hand: a person after every step on
the tool's track; one long gold run between two people on the agent's,
with its three gates, the retry loop and the person it stops to ask. The
people are green (the house's human). The record is unchanged, so the
Pandora proposal's horizon takes the same figure. `horizonLayout.ts` and
the hologram scene are deleted; the live stage (U4) now serves the stages
beat alone.

### Decision 3 - on a short frame the curve's caption goes beside it

Under the stage at the stage's width, the key and the two notes ran to
five lines at 1280x720, the stage fell to 532px (Moira's own is about 630
there) and the head rode up through the client mark. Below 960px of
height the caption is a column beside the stage (64 % / the rest), the
buttons sit at the top of that column and the intelligence word takes the
stage's bottom-right corner. Measured: stage 650x354 at 1280x720, 733x399
at 1440x800, 881x480 at 1920x1080, 1187x647 at 1920x1247; head eyebrow at
71 / 73 / 100 / 91; zero word-on-word collisions at all four in both
themes; every beat exactly one viewport.

The horizon's check labels take `--track-label` (.08em, Moira's own):
at the eyebrow rung the eight "jij kijkt na" ran together at 1280x720.

Left open: the owner's read on the room's screen. `arc-marks` is red on
the Pandora arc from 79bea85c (its `close` lost its menu label); not this
pass.
