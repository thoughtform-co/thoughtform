# The HUD panel lab

**`http://localhost:3003/test/hud-panel-lab`**

Seven directions, two surfaces, one question: **do the evidence panels belong to
the frame, or are they sitting in front of it?** Six came from the owner's
references; the seventh, `06 · Listing`, was derived from a random seed on the
owner's own instruction — see [`seed-listing.md`](seed-listing.md).

The owner's read (2026-09-02, pre-launch): on both surfaces the elements "just
seem to be floating. They don't really feel integrated as part of a HUD or
interface … If you look at all the references I shared, it just feels more
balanced and integrated."

Nothing on the landing has changed. There is no flag — a winner is promoted
with its own ADR and the losers are deleted with their guards (ADR-070 U35).

---

## What the references actually do

⚠ **The 30 images the owner means are the one part of the reference pool the
design skill never saw.** Every `original:` path in the corpus's 53 notes
points at the flat root of `_01_GENERAL REFERENCES`, plus `LP\` and
`Marathon\`. Not one points into **`Panels\`** or **`Character\`** — which is
where the Vilimovský Cyberpunk 2077 kit, the amber terminal instruments and
the character screens live. So "the skill was trained on these" is false for
exactly the set this pass is about, and these distillations stand in until the
surveyor is run over those two folders.

Read across all 30, six things separate them from our two surfaces:

1. **A datum and a terminus.** Every reference hangs from a header strip (the
   tablet's `RIPPERDOC SURGICAL SOFTWARE V2 | FIR SK 5.0 MFS | FLAIR TRS 5mmP`;
   the amber instruments' thick rule over `GALACTIC POSITION · ACTIVE · 2B`)
   and sits on a foot row (a barcode strip, a row of indicator chips). Content
   is bounded above and below by chrome that belongs to the device.
2. **Seams, not gutters.** Adjacent regions share drawn edges and cells touch.
   Alignment is drawn where regions meet, never as a long line through empty
   space — which is also why the owner deleted our datum rails twice.
3. **A line-weight ladder.** Thick datum / 1px edges / faint interior rules.
   Ours is one weight: every rule on the casefile is 1px of **gold** at
   .12–.24 while the frame beside it runs 2px of **dawn** at .55. A hue swap
   and a 4× alpha gap between a panel and the thing it is meant to belong to
   is itself the "not part of the HUD" signal.
4. **Corner labels.** A field with micro-labels in its corners reads as an
   instrument; a field with bare corners reads as a picture.
5. **The centrepiece has a bay.** The figure or the evidence sits in a column
   with head and foot micro-labels (`FN 17 HEAD`, `MODEL LINE 12.12AA`),
   seated in an apparatus rather than floated in a space.
6. **One material.** Today the proof surface is a boxed translucent console
   beside bare text-on-void; the era stage is bare text around a glowing
   figure.

**What NOT to take**, per the corpus's own rulings and this house's: the red
or teal as a primary accent, the CRT curvature and decorative scanlines, the
bloom, the placeholder-data density, and any leader line from a label to a
body part (ADR-082 U19: it claims a relationship the record does not have).

---

## The directions

Each is one thesis, applied identically to both surfaces so the owner is
choosing a **site-level grammar** rather than two panel fixes.

| id   | name           | what it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | trade-off                                                                                                                                                                               |
| ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v0` | **Shipped**    | Production, mounted, byte-identical. The control.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Paints **8 gold structure lines**; the number is in the capture's table                                                                                                                 |
| `v1` | **Tuned**      | The null hypothesis: it is a LINE problem. Structure goes to dawn at the frame's own two weights, the column seam becomes solid, the reticle pair is completed, the era mast becomes a header row. Nothing moves house.                                                                                                                                                                                                                                                                                                   | May prove insufficient — which is a real answer                                                                                                                                         |
| `v2` | **Housing**    | One chamfered slab (TR+BL) across the band, header bar fused to its top edge, seams inside, foot bar. The console drops its own chamfer and becomes a cell.                                                                                                                                                                                                                                                                                                                                                               | Heaviest; retires ADR-065 U2; costs 92px of band width on proof                                                                                                                         |
| `v3` | **Grid**       | No box, no fill. A top rule on tick 1, a solid column seam, cell seams that stop at it, a head row on every cell.                                                                                                                                                                                                                                                                                                                                                                                                         | Risks reading as a spreadsheet if the heads are uniform                                                                                                                                 |
| `v4` | **Instrument** | A 2px datum bar in the rail's own material, a header row under it, the field boxed and corner-labelled, the record as boxed readout cells.                                                                                                                                                                                                                                                                                                                                                                                | Introduces a horizontal 2px rung; a horizontal rail was rejected once (ADR-082 U9)                                                                                                      |
| `v5` | **Tether**     | No enclosure. The rail's ticks continue as 21px datum stubs, each head rule runs out to the band edge and terminates on one, the centrepiece sits in a bracket-cornered bay carrying its own identity in its corners.                                                                                                                                                                                                                                                                                                     | Stubs occupy 21px of the gutter ADR-082 U9 left empty                                                                                                                                   |
| `v6` | **Listing**    | Seed-derived. The panel is SOFTWARE drawn on the frame's screen: a square double-line ring (the DOS ═ ║) on proof, line-only and 32px clear of the rail's readouts; a double column seam; record rows as a listing (key 6/16); phosphor `#FFA` as the one lit rung with a blinking block cursor. On eras: no ring, the mast re-set as a listing header row on SCOPE's edge, three double rules, FACTS as a 6/16 table, a TR+BL reticle pair on the bay, the active chip's mark as the cursor, zero new lettered elements. | Leaves the gold family for the lit rung in dark; square corners against the promoted chamfer; 60px of content width at 1280 for the clearance; the blink is wall-clock motion (ADR-021) |

**Knobs** (orthogonal to the direction):

| param    | values            | asks                                                                                                                                                                                                                         |
| -------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?mat=`  | `line` · `glass`  | Does an enclosure need the console's own ground, or is line work enough? Defaults to `glass` on `v2` only.                                                                                                                   |
| `?foot=` | `none` · `rule`   | Draws the band rule the owner deleted twice, **band-inset** rather than full-bleed, so the amendment can be looked at. Off by default.                                                                                       |
| `?ink=`  | `house` · `oxide` | Provenance meta (the foot's log code, the era press meta and head tags) in the seed's second hue, oxide `#dA9` — a third hue asked as a knob so it can be refused without refusing the direction. Off by default; `v6` only. |

Other parameters: `?s=proof|eras`, `?v=v0…v6`, `?theme=dark|light`,
`?era=<id>`, `?row=<track id>`, `?in=0…1` (scrubs the casefile's arrival
ladder), `?console=0` (removes the lab console for a still).

---

## 06 · Listing — the seed

The owner's read on the first six (2026-09-03): the references may have been
shoehorning the work. The procedure he set instead — generate a random
string, derive the direction from it, then build it well — produced `v6`.
The seed and its measured analysis are in [`seed-listing.md`](seed-listing.md);
the short form:

| the string gives                                              | the rule                                                                                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 128 = 8 × 16, a hex dump's shape                              | The form is a LISTING: key 6/16 · value 10/16 rows (production's own 37.5 % split); powers-of-two spacing                                                   |
| doubled letters `FF` `pp` `BB` at Fibonacci gaps (34, 21 ≈ φ) | The DOUBLE RULE — two 1px dawn .55 lines, 2px gap — as the one emphatic line; three per surface; single .28 seams; .12 rows; square corners (no chamfer)    |
| the strobogrammatic `6996` between two `8`s                   | Marks as a 180°-rotated TR + BL pair (the corner law's lawful diagonal); the head and the terminus are one line                                             |
| absent `G Z h 0`                                              | No Ground (line-only — what lets one grammar cross to the transparent era stage), no Z-stack, no hidden clipping, no zero (nothing empty; the cursor stays) |
| 61 upper / 51 lower = 1.196                                   | The house's 1.2 scale and faces stay; ≤ 16 lettered chrome elements per surface, all real readings                                                          |
| hex triplets `#FFA` and `#dA9`                                | PHOSPHOR as the lit rung (dark; light takes `--gold-ink-lit`); OXIDE behind `?ink=`; teal and magenta declined                                              |
| `I` × 7, no zero                                              | A block cursor, 700 ms lit / 700 ms dark (6996 → 0.6996 s), steady under reduced motion, last on the arrival ladder                                         |

Its thesis is the promoted housing's opposite: ADR-089 reads the casefile as
the machined DEVICE the screen is set into (chamfer, gold lip, glass); the
listing reads it as the SOFTWARE drawn on that screen (square box-drawing,
dawn, no ground). Both are coherent; the owner picks.

What it costs, stated: the proof ring stands 32px inside the band on both
sides so its line pair never runs under SECTOR (the promoted housing runs
band-exact because a tint under a readout is a sub-2 % shift; a line pair is
not a tint — SECTOR's rect starts 28px inside the band edge at 1280×720, so
24px of clearance would draw straight through it), which takes 60px of content
width at 1280×720. The first place that bit: the ATL row's classification
line (327px natural) wraps in the 317px column there and overflowed the
tick-bound brief by 10px on the first capture. Paid where the house says to
pay it — the brief's three top margins to 8 · 2 · 4 and a hair of leading at
the compact rung, never the type. And the cursor is the lab's first wall-clock
motion.

Found while shooting it, and fixed in the kit for every direction: the
directory seam had been resolving its `37.5 %` against the record column since
it became a grid item (ADR-088), drawing a 119px stub where the register seam
draws 367px. The `v2`/`v3` stills on disk predate the fix.

---

## What the lab measured

Everything below was found by the capture's gates or by looking at a still,
not by reading the code.

- **The control paints 8 gold structure lines; every direction paints 0.**
  That is the defect stated as a number. ⚠ That reading is history since
  ADR-089: `v0` on proof mounts the promoted housing now and its `gold`
  column reads 0, and the era control's four head rules were always dawn —
  so the column is 0 on every cell of the 165 and the eight exist only in
  the stills that predate the promotion. And ADR-089's
  `.fl-case`-scoped rules reach the hand compositions too (the console's
  ground is transparent and the record insets by 18px on `v1`–`v5`, neither
  of which those directions asked for) — pre-existing drift, recorded here so
  it is not blamed on the next direction. `v6` restores the console's 0.86
  explicitly and says so.
- **A padded gradient shell needs an opaque body, and a transparent housing is
  not one.** The services plate gets away with `padding: 1px` + a gradient
  behind an inset body because that body is 72–58% opaque and hides it. At
  0.42 the shell read straight through and lit the whole panel warm-grey
  (`30,25,17` against the void's `10,9,8`). The giveaway was that `?mat=line`,
  which paints no ground at all, produced the SAME lightening — so the ground
  was never the cause. The lip is a clipped RING now: the outer chamfered
  contour clockwise, the inner one counter-clockwise, which nonzero winding
  renders as a hole. Interior measures `10,9,8` on `line` and `7,7,5` on
  `glass`, which is the wash doing exactly what it says.
- **A `clip-path` cuts a border, it never strokes one.** That is why the
  earlier flat-border housing had no line at all on its two diagonals — the cut
  removed it. The ring is what puts the chamfer's own edge back, and it is the
  reason the services plate uses two filled layers rather than a border.
- **The services card's radial bloom does not survive the change of shape.**
  It is written as `radial-gradient(130% 70% at 84% -8%, …)` — percentages of a
  420×680 card, about 550px, a corner catching light. The same fractions on an
  1150×600 housing are 1495px wide and light the whole top-right quadrant. A
  corner catch has a physical size, so it is stated as one.
- **`brightness(1.08)` belongs to the card's OPEN state, not to a housing.**
  Its seed body is `blur(12px)` alone; the lift is tuned for a small card over
  a bright WebGL bed, and over a whole band of void it turns the ground grey —
  on the era stage it put the hologram on a card instead of in the dark.
- **A housing's terminus is its own open bottom.** With the glass in, the era
  foot row sat below the reel, outside the enclosure it was meant to close. A
  direction that draws a housing prints no foot row there; the chips are the
  terminus, which is what the open bottom already declares.
- **A band-width housing cannot clear the right rail's telemetry.** SECTOR
  reaches x 1129 at 1280×720 against a band edge of 1150.9. On the proof
  surface the whole direction moves in by 28px a side to clear it, which is
  the housing's real cost. On the era stage the housing is **line-only
  instead**, because that station is transparent by law — a slab with a ground
  there is a black pane sliding over `#about`.
- **The era stage's foot can never be a rule at the rail's last tick.** That
  tick lands 16px inside the chip frames at 1280×720, 6.5px inside at
  1440×900, and exactly on the band's twice-deleted `border-top` at the
  owner's 1920×1247. Era housings are open-bottomed; the chips are the
  terminus.
- **A header row buys ~20px and a foot row spends it.** The mast stacks an
  11px kicker over a 42px title; a row is the taller of the two. `v4`'s 2px
  datum then overspent it by 6px until its air came down to 4px and the foot
  band to 22px. Chrome first, rhythm second, never the type.
- **The era title cannot seat at the bay's width.** Its clamp is locked
  byte-for-byte to the About name's footprint, and "The campaign commander" at
  38.4px needs ~420px against a 230px figure column — so `v5` centres the
  title on the bay's axis at its own measure. Found on `expanse` alone, which
  is why the gate walk visits all five eras.
- **Two labels overlapping is the check containment never makes**, and it bit
  twice: the header's centre slot printed through the client's name, and the
  field's corner labels printed through `WORK / CONFIGURATION / SUBSTRATE`.
  Both were caught by LOOKING at the first still of a direction, with every
  geometry gate green.
- **The register and the directory have ~4px of slack**, so neither may grow a
  head row at the binding viewport; the brief's head sits in the air that
  already exists above `--fl-body-top`, and the register's appears only above
  1070h where `--fl-proof-top-gap` is 14–18px of nothing.

### And two traps in the lab's own machinery

- **`will-change: transform` on a ladder wrapper makes it a containing block.**
  Chrome wrapped in a `[data-fl-panel]` div resolved `bottom` against a
  zero-height box and landed 800px off screen. Every piece carries its own
  ladder seat now, exactly as `.fl-split` and `.fl-ret` do, and everything in
  the sheet is positioned from the TOP.
- **A guard that resolves a token on the wrong element measures nothing.**
  `--vwd-pad-x` is declared on `.vwd`, not `:root`, so the probe's throwaway
  element resolved it to 0, the era band came back as the whole viewport, and
  every wide-ink test passed because nothing can be wider than everything.

---

## Verifying

```bash
node scripts/capture-hud-panel-lab.mjs
```

Two surfaces × seven directions × {1280×720, 1440×800, 1920×1080, 1920×1247} ×
{dark, light}, with the per-era and per-row gate walks at the binding
viewport, plus one `?ink=oxide` still per surface for `v6` at the binding
viewport in each theme — 165 cells. Needs the dev server; `--port`, `--s`, `--v`, `--vp`, `--theme` and
`--headed` narrow it. Stills and `report.json` land beside this file and are
gitignored — they regenerate.

Gates: no panel clips (measured from the INK, because `scrollHeight` reports
zero both when content fits and when a centred box spills equally both ways);
every seat and the figure inside the frame; nothing wider than the station's
own band paints; no painted line enters a rail box and no lab ground sits
under a telemetry readout; every datum stub on a real tick; structure in dawn;
production chrome ≥8.5px and lab chrome ≥10px; no ordinal; zero page errors;
the figure on its alpha branch.

⚠ **The subjects are read off the page, never hardcoded.** Three of four track
ids were guessed wrong on the first run, the parser fell back to row one, and
four "different" rows shot the same still with every gate green.

---

## ⚠ The record column moved under this lab (ADR-088, 2026-09-02)

Production's three left-column zones are grid items in a new `.fl-left`
wrapper now, not three absolutes hung off the tick ladder: the directory's last
row is seated on tick 11 and the surplus splits 1:2 between the two seams. Two
consequences for the stills already in this folder and for anything shot next.

- **The `proof_v*` captures here predate it.** They show the pre-ADR-088 column
  — a 137px void under the directory at 1920×1247 and an 18px seam above it —
  so read them for the direction's CHROME, never for its rhythm. Re-shoot
  before judging any direction on vertical balance.
- **The register's cell-head and the directory seam are grid items too.** Both
  were seated on `--fl-left-seam + --fl-proof-top-gap [+ --fl-proof-h …]`,
  which named the register's top only while the zones were top-anchored
  absolutes; there is no expression on `.fl-case` that reaches either line now.
  The head rides seam track A (`align-self: end`), the seam rides track B
  (centred). The register seam stays where it was — tick 6 is a rung of the
  ladder, and that placement was a deliberate ruling.
- **Ruling 7 is unaffected but its neighbour moved**: the line ledger still
  measures the register's and directory's gold hairlines, and those are
  untouched. What changed is where the boxes SIT, not what they paint.

## ⚠ v2 IS PROMOTED ON PROOF (ADR-089, 2026-09-02)

The owner read `v0` against `v2` at 1920×1247 and took the housing **for the
proof casefile only**. The era stage keeps `v0` and the rulings below still
stand for it.

What that settles, and what it does not:

- **Ruling 1 — answered.** The console loses its chamfer; ADR-065 U2 is
  retired and the rail's leading station is square with it.
- **Ruling 2 — answered.** A housing supersedes "the console is the one framed
  object"; the slab is that object now.
- **Ruling 3 — answered.** The top-right reticle is back, on the argument that
  a diagonal PAIR registers a composition without closing it.
- **Ruling 10 — answered with a SCOPE, as asked.** A console is a screen you
  look into; a housing is the machined device it is set into, and the services
  card is the other object of that kind. The DAWN-edge rule keeps its subject.
- **Ruling 12 — answered.** The lip's stops are tokens; light takes
  `--gold-line`.
- **Rulings 4, 5, 6, 9, 11 — still open, and they are the ERA stage's.** 4, 9
  and 11 each block `v2` there independently of the owner's hold.
- **New, from the promotion:** ADR-065 U5's premise moved — the capability
  plates' notch answered to the console, which is square now. Recorded in
  ADR-089 §Left open.

⚠ Three defects in this lab's own `v2` were found only when it met production,
and all three are still here: the brief's cell head is clipped away by
`.fl-brief`'s `overflow: hidden` and has never painted; the fused header's
`1fr auto 1fr` template lands its single child a third of the way across; and
it prints `state` twice while its foot repeats two labels already on screen.
Production fixed all three — read the lab for the DIRECTION, not for the
detail.

## Rulings the lab needs before anything is promoted

1. **ADR-065 U2** — may the casefile console lose its TL+BR chamfer inside a
   TR+BL housing (`v2`)? That exception is the owner's own mockup, and
   retiring it cascades to the rail's leading station notch, the capability
   plates' seat notch and the smoke's two-ended corner guard.
2. **The 2026-08-07 "one framed object" ruling** (`casefile.css`) — does a
   housing, a grid or boxed cells supersede it, or is the console still the
   only frame on that surface?
3. **The deleted chrome** — the top-right reticle went in commit `e3b33867`
   with the route diagram and the three dotted rules. `v1`–`v5` draw it again.
   May it come back?
4. **"These long horizontal lines … remove those" (ADR-082 U21)** — was that
   about full-plate lines through the tick ladder, or about any long line? The
   answer decides whether `v2`, `v3` and `v4` are possible on the era stage at
   all, and it is the wording the committed >700px test would need.
5. **The era stage's foot** — leave the reel band's top edge undrawn
   (default), or accept `?foot=rule`?
6. **The gutter** — is a 21px tick terminating a head rule "something else in
   the gutter" (ADR-082 U9), or is it the rule's own end?
7. **Structure in dawn, sitewide** — the register's and directory's gold
   hairlines are pre-existing and sit against `console.css`'s own ruling.
8. **`--fl-tabs-h` derived as `rail-h / 12`** so the tab strip's baseline IS
   tick 1. It is 44px today and lands 1.07px off the tick at 1280×720, 6.0px
   at 1440×800. `v5`'s stub sits on the TICK and shows the gap.
9. **The identity's seat on the era stage** — a header row or the bay's head.
   It moves where the About name lands in the handoff.
10. **The gold lip against `console.css`'s "the panel's own edge is DAWN, not
    gold".** The services card's own edge IS gold, so the house has two
    precedents pointing opposite ways; the difference is that a console is a
    SCREEN you look into and a card is a machined SLAB you look at. `v2` takes
    the card's lip on the device the screen is set into. If it promotes, that
    ruling needs a SCOPE rather than an exception.
11. **The era stage's glass, which this lab cannot judge.** That station is
    transparent by law — the corridor's ambient survives through it and it
    overlaps `#about` by −120svh — and the question is what the corridor looks
    like THROUGH the glass. The lab has void behind it, so it can only show
    that the glass is a tint (a 3-unit darkening) rather than a pane. Worth one
    look on the real page before promotion.
12. **The lip's contrast in light.** Gold at .34 on parchment is well under the
    3:1 line-work rung; it reads in the stills but it is quieter than in dark.
    The named fix is ADR-063 U2's ramp — `--gold-line` for the lip's stops in
    light — not a bigger alpha on `--gold`.
13. **Software or hardware (`v6`).** Is the casefile the machined DEVICE the
    screen is set into (ADR-089's chamfered, gold-lipped housing) or the
    SOFTWARE drawn on that screen (the listing's square box-drawing in dawn)?
    One reading per surface — and the same reading on both, since the point of
    this lab is a site-level grammar.
14. **May the lit rung leave the gold family in dark?** Phosphor `#FFA` is a
    lightness step past `--gold-ink-lit` with a slight hue drift toward the
    green. ADR-063 U2 says hue is the brand and lightness the role; this is
    the first lit rung that is light rather than paint. Light keeps the ramp.
15. **The era title on SCOPE's edge** — ruling 9's seat, decided the listing's
    way: the identity is the first row of the record, left-anchored, with the
    year on its baseline at the far column. It moves where the About name
    lands in the handoff (the target's box is its ink now, `nowrap`).
16. **The blink.** ADR-021 admits no wall-clock motion on `#services`; the
    cursor is the lab's first. Bounded (three blinks, then steady), clocked
    (blink on arrival and on a row change), or refused — the lab draws the
    seed's perpetual blink and holds it steady under reduced motion.
17. **Oxide as a third hue** on provenance meta, or the house's dawn .52.
18. **The ring's telemetry clearance** — 32px a side (60px of content at 1280) so the line pair never runs under SECTOR, against the promoted
    housing's band-exact edge under a tint.

## Out of scope

Mobile (≤960px): both surfaces have their own IA under ADR-083 and the
viewport table starts at 1280. A phone pass follows the desktop pick.
