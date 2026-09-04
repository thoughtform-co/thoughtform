# ADR-089: The casefile is one machined housing

- **Status:** **Accepted** for the proof casefile (shipped, guarded).
  ⚠ **NOT taken for the era stage** — see §Not promoted.
  ⚠ **Update 1 (2026-09-03) removes the foot bar, the header's string, the
  `+ Archive` marker and four leftovers in the right panel** — read it before
  citing anything below about the head, the foot or the console's paint.
  ⚠ **Update 2 (2026-09-03) makes the station keys FLAT — a whisper of a fill
  with the marks carrying the lit state, no gradient anywhere — and
  rationalises nine rules at three lengths into ONE extent and TWO weights.**
  It reverses ADR-067 U2's seam shoulder and retires `--fl-col-split` as a
  separate value. ⚠ Its own first cut (a SOLID gold plate) was rejected inside
  the hour — see the scale note.
- **Date:** 2026-09-02
- **Owner call:** the `v0` / `v2` comparison, read at 1920×1247 — _"you can
  integrate this into the homepage for the proof section"_, with the era stage
  explicitly held (_"I still need to think"_).
- **Surfaces:** `components/landing/home-v2/services/casefile/casefile.css`,
  `.../casefile/ServicesCasefile.tsx`, `components/landing/v7/theme.css`,
  `tests/visual/services-ring-smoke.spec.ts`
- **Supersedes:** **ADR-065 U2** (the console's TL+BR owner exception —
  retired; the chamfer moves up to the housing) · **ADR-067 U2** on WHICH
  station is notched (none are) · the 2026-08-07 _"the console became the one
  framed object"_ ruling, which passes to the slab
- **Builds on:** [ADR-065](065-corner-law.md) (rule 4 — the children of a
  chamfered box are square; the depth ladder's PLATE rung) ·
  [ADR-088](088-casefile-left-column-ladder-and-rhythm.md) (the record
  column's grid, which the seams and the register head ride) ·
  [ADR-087](087-proof-client-stack.md) (the frame law the housing obeys) ·
  [ADR-063 U2](063-map-reading-rail-and-wheel.md) (gold split by role — the
  lip's light step) · [ADR-086](086-services-card-carries-the-work.md) (the
  services plate, whose lip and glass this is)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)
- **Look-dev:** `/test/hud-panel-lab?s=proof&v=v2`

## Context

The complaint was that the evidence panels _"just seem to be floating … they
don't really feel integrated as part of a HUD or interface"_, and the lab
measured it as a number rather than a mood.

**The casefile painted eight gold structure lines** — the register's five
hairlines at gold .12/.24, the directory's row rule at gold .13 dotted, the
column split at dawn-alt .24 dotted — **against a frame whose own track is 2px
of dawn at .55.** A hue swap AND a four-times alpha gap between a panel and the
thing it is meant to belong to.

`console.css` had already ruled which way that goes, one object over:

> the panel's own edge is DAWN, not gold … It replaces `--con-hair2` on the
> console's border ONLY; the rail's dividers and the station seams keep the
> gold hairlines, because those are marks ON the machine rather than its
> outline.

The panel got that ruling in 2026-08-07. The surface around it never did.

## Decision

### 1. One slab across the instrument band

`.fl-hz` spans `--fl-rail-top` to the rail's last tick. `.fl-case` insets by
`--fl-hz-pad` (18px) and the housing negates that pad to reach the band edge,
so the record moves in and the device does not. The 18px is MARGIN — what keeps
the tab strip's ordinal off the lip — not clearance; the band-width objection
that once cost 28px a side went with the pane, since at a 0.42 ground under a
dawn readout the shift is under 2 %.

**Its material is the services plate's**, which is the other object in this
house that is a machined slab rather than a screen: a clipped gold lip over a
glass body, a scanline, a corner bloom.

⚠ **THE LIP IS A CLIPPED RING, AND THAT IS FORCED.** A `clip-path` CUTS a
border, it never strokes one — a chamfered box with `border: 1px` has no line
on either diagonal. So the gold is a filled contour with a hole in it: outer
path clockwise, inner counter-clockwise 1px in, non-zero winding making the
middle transparent. ⚠ The inner chamfer is **not** `ch − 1px`: a 45° cut offset
inward by `d` moves its diagonal by `d·√2`, so matching the two exactly leaves
the lip visibly thicker on the diagonals than on the straight runs. −0.6px is
the services plate's own correction.

⚠ **TWO OF THE PLATE'S VALUES DO NOT SURVIVE THE CHANGE OF SHAPE.** Its bloom
is `radial-gradient(130% 70% at 84% -8%)` — percentages of a 420×680 CARD, so
~550px, a corner catching light; the same fractions on a 1500px housing are
1495px and light the whole quadrant, so the bloom is stated in PIXELS. And
`brightness(1.08)` belongs to the plate's OPEN state, tuned for a small card
over a bright WebGL bed; over a band of void it turns the ground grey.

⚠ **THE LIP'S FOUR STOPS ARE TOKENS BECAUSE GOLD IS SPLIT BY ROLE**
(ADR-063 U2: hue is the brand, lightness is the role). `--gold` at .34 is line
work that all but vanishes on parchment, under the 3:1 rung it has to clear.
Light re-derives the stops from `--gold-line`, the ramp's own LINE step. Never
a bigger alpha on `--gold` — ADR-058 measured that and it takes the FILLS down
with it.

⚠ **THE GOLD LIP CONTRADICTS `console.css`'s "the panel's own edge is DAWN",
AND THE SCOPE IS THE RESOLUTION, NOT AN EXCEPTION.** A CONSOLE is a screen you
look into, and its outline must not compete with the drawing inside it. A
HOUSING is the machined device the screen is set into, and the services card —
the only other gold-edged object here — is exactly that kind of slab. The rule
keeps its subject; it never covered the device.

### 2. The console becomes a cell, and the chamfer moves up

⚠ **ADR-065 U2 IS RETIRED.** That exception put TL+BR on the console — the
law's one enumerated mirrored object — on the owner's own mockup. Inside a
housing, rule 4 applies: _the children of a chamfered box are square_, and two
chamfers of the same depth adjacent to each other is what a surface looks like
when it has been decorated rather than built. So the slab carries the canonical
**TR+BL** at the PLATE rung (26px) and the console carries nothing, along with
its own hairline and its own ground.

⚠ **THE RAIL'S LEADING STATION DROPS ITS NOTCH WITH IT, AND THAT FOLLOWS FROM
THE SAME CLAUSE THAT CREATED IT.** ADR-065 U3 licensed that cut _because the
housing's own chamfer fell on it_ — the console removed every point where
`x + y < --con-ch` (15.9–22px) against the plate's `x + y < --stn-ch + 2`
(10.6–13px), so the leading cut was subsumed by ~8px at every rung and what
read as WORK's notch was the housing's. With no chamfer above it there is
nothing to share: the cut would be a 6–11px diagonal with no edge behind it,
which is precisely the decorative asymmetry rule 5 forbids and exactly what
ADR-067 U2 removed from the trailing plates.

### 3. Its chrome, and what each piece is allowed to say

| piece                     | says               | why it is not somewhere else                             |
| ------------------------- | ------------------ | -------------------------------------------------------- |
| fused header (right slot) | `state`            | the housing's status band; the tab strip is its left run |
| brief cell head           | `Brief`            | the cell's name, in air that already exists              |
| register cell head        | `Proof · N claims` | tall rung only                                           |
| foot bar                  | `logCode`          | provenance, and the terminus of a machined device        |

⚠ **THE HEADER STOPS AT THE COLUMN SPLIT, AND THAT IS A COLLISION, NOT A
TASTE.** A band-wide row prints its right slot straight through WORK /
CONFIGURATION / SUBSTRATE — `ConsoleRail` occupies the same band on the right
and IS the field's header. Seen on the lab's first still and invisible to every
geometry gate, because two labels overlapping is the one thing containment
tests never ask about.

⚠ **THE FOOT IS NOT `.fl-con__foot`, AND THAT BAN STILL STANDS.** ADR-068 U2
forbids a CONSOLE foot: row chrome saying one thing under whatever the rail
shows. This is the HOUSING's terminus, outside `.fl-con` entirely — the same
distinction `.fl-verdict` already ships on.

⚠ **THE TOP-RIGHT RETICLE IS BACK, AND IT WAS AN OWNER DELETION.** Commit
`e3b33867` took it with the route diagram and the three dotted rules, because
the dotted chrome read as noise _once the console became the one framed
object_. The housing is that object now, and a diagonal PAIR is what registers
a composition without closing it into a box — this file's own stated reason for
marking one diagonal. Restoring only its partner would leave the surviving
cross reading as a leftover.

### 4. Three lab defects that do not survive contact with production

Each was found by LOOKING at a still, and each was green in the lab.

1. ⚠ **THE BRIEF'S CELL HEAD IS A SIBLING OF `.fl-brief`, NEVER ITS CHILD.**
   That box is height-boxed against the seam with `overflow: hidden`, so a head
   hung at `top: -17px` inside it is clipped away entirely — present in the
   DOM, measurable, painting nothing. **The lab draws it that way and it has
   never once painted.** It hangs off `.fl-left` instead, which starts at the
   same y and clips nothing.
2. ⚠ **THE FUSED HEADER IS FLEX, NOT A THREE-COLUMN GRID.** The lab's
   `1fr auto 1fr` template has three slots and this header fills ONE — a single
   child lands in column 1, so `justify-self: end` put the state a third of the
   way across, straight through `+ Archive`. Measured: x 437 against 430.
3. ⚠ **EACH PIECE SAYS ONE THING.** The lab prints `state` in the header AND in
   the brief's head, ~250px apart, and its foot repeats the classification line
   and the track count — both already on screen, under the brief's title and in
   the directory's own head. This surface has removed a console head, a foot
   and a designator for exactly that (ADR-063 U1, ADR-070 U8).

## The guards

Two changed, both because the clause they encoded lost its subject.

⚠ **THE RAIL'S CORNER GUARD ASSERTED THE OPPOSITE.** It required the leading
plate to keep a polygon and every trailing one to be square. It now asserts
**every station is square AND the console above them is**, with the housing's
own TR+BL signature pinned in its place. Still two-ended: a surface where BOTH
the console and the slab are square has lost the machined read entirely, and no
other assertion on the row would notice.

⚠ **THE LIGHT WALK WAS MEASURING AGAINST PURE BLACK.** It read
`.fl-con__console`'s own `backgroundColor` as its reference bed, which was only
ever right while the console painted an opaque ground. As a cell it paints
none, so that read returns `rgba(0, 0, 0, 0)` — and `parse` happily matches it
rather than bailing, so every label was composited over black. In light that
put the map's quietest ink at **1.06:1 on a page that reads fine**; the same
hole in reverse would pass an unreadable one. It composites up the tree to the
first opaque surface now, which is what an eye does.

`console.css` had already written down the general form of this bug — _"the
walk takes its luminance from the raw RGB, so an alpha here does not move a
single ratio it reports"_ — one alpha earlier.

⚠ **THE DAWN STRUCTURE IS SCOPED TO `.fl-case`.** This sheet is shared with the
arcs, which mount `ConsoleFrame` and the sheets plates at page scale and have
no housing to belong to. Unscoped, the structure change would follow them there
and the `toBe`-pinned arc markup would start describing a different surface.

## Not promoted

**The era stage keeps `v0`.** The owner held it, and three of the lab's own
rulings block it independently of that:

- **Ruling 4 — the long horizontal lines.** ADR-082 U21 deleted three 1653px
  hairlines on the owner's instruction, and its executable half is a committed
  sweep: _no element wider than 700px paints a border or a ground in
  `#voidwalker`_ (`about-voidwalker-handoff-boundaries.spec.ts`). A band-width
  housing trips it three ways at once — the lip is a background-image, the
  glass is a background-color, the header is a border. Whether U21 meant
  full-plate lines through the tick ladder or any long line is unanswered in
  all five places it is written down.
- **Ruling 9 — the identity's seat.** `v2` re-lays the mast into a header row,
  and both `era-title` and `dossier` are handoff targets pinned to 0.75px.
- **Ruling 11 — the glass.** That station is transparent BY LAW: the corridor's
  ambient survives through it and it overlaps `#about` by −120svh.
  `voidwalker-datum.css` records that an opaque root there already shipped once
  from this same lab-to-production path — _"a rule that was correct about the
  LAB's root silently becomes a claim about the STATION"_. `.claude/rules/voidwalker.md`
  states the gate as a precondition: **one look on the real page before any
  promotion.**

That look is now on record: `shots/era/1920x1247_dark_at25_loop.png`, captured
on the live corridor. The figure is a hologram lit against near-black with the
corridor's dust reading through it, and the four column heads carry the only
rules on the plate.

## Update 1 — the housing loses its chrome, and the console joins the slab (2026-09-03, owner)

Read live on the landing, a day after the promotion. The housing stands; four
things inside it come out, and every one of them is a piece this ADR ADDED or
left behind.

- **The foot bar is deleted.** _"At the bottom of that panel we have AI
  adoption marketing, we can remove that … there's also a divider, we also
  don't need that."_ ⚠ **The first half of that sentence describes the LAB,
  not production** — `v2`'s `FootRow` prints the classification line and the
  track count, which this ADR's own §Not promoted flagged as a defect the
  promotion fixed; production's foot has said `logCode` since day one. The
  DIVIDER is the half that was real on both, and it settles the rest: a
  machined slab already ends somewhere — its bottom lip is drawn at the rail's
  last tick — so a 26px band closing it 26px higher was closing a box that was
  closed. `logCode` returns to the state `stamp` and `state` are in: in the
  record, lettered nowhere. `--fl-hz-foot-h` and the `--fl-panel-end` override
  go with it, and the console takes the 26px back.
- **`state` comes off the head, and the head becomes a RULE.** This ADR put it
  in the fused header's right slot on the argument that _"the housing's top
  edge is a band that wanted the record's status"_. It did not: the band above
  the record is the client's name and nothing else. What survives is the line
  the name is underlined into — the tab's own gold segment sits on that exact
  row — which is the same two-part grammar the console's rail carries on the
  other side of the split. ⚠ The header's `1fr auto 1fr` → flex fix recorded
  above is now moot for content, but the width still stops at the column split
  for the same reason: `ConsoleRail` is the field's header and a band-wide
  rule would run under it.
- **`+ Archive` is deleted, and its ruling went with the IA it argued for.**
  ADR-087's _"the dim `+ Archive` is what marks it as a series"_ assumed a
  strip of TABS holding several clients. The owner's call is **a panel per
  client**: _"initially my idea was to use the top tabs to show different
  clients, but I actually want to make a panel per client"_. A ghost stop for
  a surface that will never open here is chrome promising navigation this
  instrument no longer offers. ⚠ ADR-087's client-stack machinery is
  UNTOUCHED and stays inert at one case — the segment table, the seam clocks
  and the runway lockstep are a mechanism, not a strip.
- **The right panel is four leftovers of the box this ADR deleted** (_"I'm not
  really sure about the gradient in there, it kind of breaks the flow … make
  sure that everything is nicely integrated"_). The pattern is the finding:
  taking a console's ground and its border does not take what those two
  implied.
  1. ⚠ **The top glow.** `.fl-con__console`'s background is TWO layers, and
     this ADR removed one: a `radial-gradient(128% 58% at 50% -8%)` of gold
     .05 went on modelling a top EDGE catching light — **575px of wash at the
     owner's viewport** — inside a slab that carries its own gold corner
     bloom. One object, one catch of light.
  2. ⚠ **The console's own scanline.** `.fl-hz__bd` rules the whole band at
     gold .025 on a 3px pitch and the console ruled itself again at dawn .014
     on the same pitch, so the right half of one slab carried twice the
     texture of the left, at two hues, phase-dependent.
  3. ⚠ **The rail's underline was the NINTH gold structure line**, and this
     ADR's sweep could not see it: the lab's ledger walks four selectors in
     the RECORD column and this one lives in `console.css`. It is the same
     object as the head band's rule — a track with one lit run travelling
     along it — so it takes the same dawn seam. The spine stays gold.
  4. ⚠ **The lit station was the one opaque object in a glass housing.** Its
     fill is a gold wash over `--con-void`, an opaque bed that made sense
     while the console had a ground; inside the slab every other surface is
     0.42 glass, so the selected key read as a hole cut through it. The wash
     alone lights it (.18 / .05), and the station keeps its three other marks.
     ⚠ **The TOKEN is not touched** — `--con-void` is the bed for the diamond,
     `.fl-detail__in` and the map's whole drawing floor.

Every rule is scoped to `.fl-case`, so the arcs — which mount `ConsoleFrame`
with no housing around it — are byte-identical, and the ≤960/PRM path restores
all four with the console's own frame.

## Update 2 — flat keys, and one divider system (2026-09-03, owner)

Read live an hour after U1: _"the tabs on the right, the gradient is
disgustingly ugly. And the vertical and horizontal dividers are also all over
the place"_, with the Vilimovský panel set attached — _"not exactly copy it,
but try to understand the logic"_.

### The keys go flat, and the grammar was already on the surface

Two vertical ramps were painting on the rail: the dormant plates at
`dawn .028 → transparent 62%` (console.css, authored as a recess against the
console's own **opaque** ground) and the lit one at `gold .18 → gold .05 78%`
(U1's own lift). ⚠ **Their stops disagreed**, so adjacent keys banded at
different heights and the flat remainder below each ramp was a different depth
per state — a stepped smear rather than a row of keys. And ADR-089 is what made
it legible: taking `--con-ground` left the recess wash floating on 0.42 glass.

**Across all four references there is not one gradient.** Every fill is flat and
an active key is a **solid accent block with the ink knocked out** — `PULSE
OXIMETRY`, `3M`, `LEVEL T2`, and the industrial-gold panel that is our palette
exactly. Depth is outline-versus-fill, never a ramp.

⚠ **AND A SOLID FILL IS THAT RULE READ WITHOUT ITS SCALE. It shipped for an
hour and came straight back out** (owner: _"it's too much fill"_). The first cut
took `.fl-row[data-on]`'s grammar literally — solid `--gold`, `--gold-contrast`
ink, knocked-out diamond — on the argument that the lit directory row already
speaks it. **In the references every solid accent is SMALL or THIN**: a ~30px
`3M` chip, a 20px-tall barcode strip, the industrial panel's 6px section bars.
Large regions there are outlined or bare, and gold never fills an AREA. A
station is **255 × 44px**, a third of the console and the first thing the eye
lands on; the lit row gets away with the same declaration because it is ONE line
among four, mid-column, at 26px. **One rule, an order of magnitude more area,
the opposite result.**

So the plate is a **whisper** and the MARKS carry the state — the rail already
has three: the diamond fills gold, the label goes to full strength, and the
spine (a 1px gold bar, the thin accent the references _do_ use at this size)
travels along the track beneath it. The fill's only job is to seat the key:
**flat `rgba(gold, 0.08)`** — flat because the ramp was the complaint, .08
because that is where the deleted gradient averaged, so it is the same weight of
light with the smear taken out. ⚠ **It is a dial and zero is legitimate**: at 0
the lit state is underline-only, which is the Starfield read the lab's `v1`
cites.

- ⚠ **The spine is what makes the whisper enough.** It sits on the rail's border
  ROW, one pixel below the plate (`bottom: -1px` resolves against the padding
  box, which excludes the border), and it is the only mark that says _which_
  key. Delete it and the fill has to come back up.
- ⚠ **`theme-css-sweep` READS PROSE.** It splits the sheet on `}`, so the
  comment quoting the banned `--gold` / `--void` pair verbatim failed the guard
  exactly as a declaration would. Recorded because the fix is to reword a
  COMMENT, which is not where anyone looks first.
- Not taken with the solid fill: the row's `font-weight: 700` (the `<b>`'s
  `font:` shorthand resets it, and bolding a four-station rail risks the
  ellipsis) and its outer glow (it would bleed into the neighbouring plate).

### One divider system

The record column was painting **nine rules at three lengths and two weights**,
and one length was a bug.

- ⚠ **`.fl-seam--directory` was 12.94 % of the band** — 168px against the 487px
  its own twin drew, a 2.9 : 1 mismatch between two instances of one object.
  ADR-088 made it a grid item of `.fl-left`, so its inherited `width: 37.5%`
  re-resolved against a 34.5 % column. ⚠ **The lab found this and the fix never
  came home**: `hud-panel-lab.css` has carried a `calc(100% * 37.5 / 34.5)`
  patch, with a comment naming production's tokens, since the v6 pass.
- **One extent.** `--fl-col-split` is now `var(--fl-col-l)` — the split IS the
  column's right edge, so all seven horizontals terminate on it. Measured after:
  one extent, two colours, at every viewport. ⚠ **Stated cost:** the gap between
  the head rule's end and the rail's underline doubles, 38 → 77px. They are one
  _grammar_ and never one line — 37.6px apart vertically — so the horizontal
  distance was never carrying the relationship.
- **Two weights, one law.** `--fl-hz-seam` .28 divides REGIONS (head band from
  record, record from field, key from key); `--fl-hz-rule` .12 rules WITHIN one.
  ⚠ **The `:first-child` override could not simply be deleted**: the base
  sheet's own `:first-child` (ADR-068, gold .24) is the same specificity and
  declared ~250 lines later, so it wins on source order — measured coming back
  gold on the live page after the deletion.
- ⚠ **A 2px doubled rule only the tall rung ever drew.** `.fl-cell--register`'s
  `align-self: end` seats its bottom edge ON the register's top edge with no row
  gap, so its `border-bottom` and the first item's `border-top` land in adjacent
  pixel rows. Halving both weights would have left it doubled; the label draws no
  rule of its own now.
- **The key-to-key seam** goes dawn and full-height: `--stn-ch` was the leading
  plate's notch shoulder, and inside the housing that notch is gone, so the inset
  was a 6–11px stub against a corner with no cut. ⚠ This **reverses ADR-067 U2's
  shoulder guard**; the smoke asserts the new state and the flat fill, because
  what says "seated keys" now is the fill rather than the inset.

Every rule is `.fl-case`-scoped — verified live on `/arcs/portfolio`, whose
console still carries its gradient, its border, its chamfer and its 11px
shoulder. The ≤960/PRM block restores all five, ⚠ **including `color`**: without
it that path gets `--gold-contrast` ink on the restored gold wash, near-black on
near-black, and nothing in the suite would catch it.

## Left open

- **The capability plates keep their BR notch, and their premise moved.**
  ADR-065 U5 gave a seated set _its housing's_ diagonal and named the console
  as that housing. The console is square now, so the enclosing chamfered
  housing is the slab (TR+BL) and the set is two levels inside it — past U1's
  _"one nesting level deep at most"_. Under U5 they should be BL; under U1 they
  should be square. Changing four notches is a visible design move nobody
  asked for, so they stay BR and the guard still pins them from both ends.
  **This needs a ruling.**
- **The lab still holds v0–v5.** ADR-070 U35 says a flag is a comparison lever
  and the losers go once the owner has read both live — but the era question is
  still open on the same six directions, so the lab and
  `hud-panel-lab-variants.test.ts` stay until it closes.
- **`substrate-lab-fit.test.ts`'s hard-coded `.fl-con__field` boxes** (602×493,
  678×548, 850×760) are stale by the header and foot's height — they do not
  fail, they simply stop describing the field. The live guard is the smoke's
  `minPx >= 4.3`, which passes.

## Verifying

```bash
npx playwright test tests/visual/services-ring-smoke.spec.ts --project=desktop
npx playwright test tests/visual/arc-portfolio-smoke.spec.ts --project=desktop
node scripts/capture-casefile-rows.mjs --vp 1920x1247 --theme dark --rows 0 --stage
```

⚠ The photo-resolution case fails on the mobile projects under a shared dev
server — status `0`, a thrown fetch, while all four assets serve 200 to `curl`.
Environmental. And the ring's drawer test is pose-variant: confirm a suspected
failure across runs before chasing it.
