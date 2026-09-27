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
