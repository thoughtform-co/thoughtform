# ADR-084: The casefile's right panel fills its housing, and the console lets the corridor through

- **Status:** Accepted
- **Date:** 2026-08-28
- **Owner call:** yes
- **Surface:** `components/landing/home-v2/services/casefile/**`, `lib/cases/**`
- **Builds on:** [ADR-064](064-casefile-console-frame.md) (the shared console),
  [ADR-066](066-casefile-one-rail-one-foot.md) (the sheets row),
  [ADR-067](067-casefile-type-and-clutter.md) (the type ladder this retunes),
  [ADR-068](068-casefile-glyphed-index-and-tool-dossier.md) (U4's
  content-fills-the-housing law, applied here to two more plates),
  [ADR-078](078-portfolio-proof-page.md) (the by-reference share with
  `/arcs/portfolio`)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

The owner, on the Studio (`03_AI-FLUENCY-STUDIO/`) and ATL
(`04_AI-ABOVE-THE-LINE/`) rows:

> the right panel feels too sparse … I'm kind of wondering what to add to the
> right panel for both. I didn't want to add stuff for the sake of it, but it
> feels a bit disconnected from the rest.

Plus two smaller asks: the sentence under each proof-register claim should read
larger, and the console should be _slightly transparent, just to give it that
retro-futuristic UI feel_.

### ⚠ The sparseness is a VIEWPORT defect first, and this surface keeps shipping it

Every plate here was composed against a **landscape** console field — 611×390 at
1280×720, 688×444 at 1440×800. The owner works in a tall window, where the field
measures **850×927, portrait**. Measured mechanisms, all of them width-bound:

- `.fl-stills` is `repeat(3, minmax(0, 1fr))` with `aspect-ratio: 4/5` tiles.
  Three across the field's ~793px makes each ~254×317 **whatever the console's
  height** — ~595px of the field is unreachable by any height lever.
- `.fl-plate--films` caps `--fl-film-h` at 470px and `.fl-filmframe` converts
  that to a max-width through 16/9. At 850px of field the frame is width-bound
  at 802×484, with ~550px of stage under it.

This is ADR-070 U12 / U14 / U32's finding in two new places: **a guard that
measures a drawing against its own crop cannot see it letterboxing the panel.**

⚠ **And `.fl-stills`' own comment said the opposite** — _"Tiles fit by HEIGHT"_
— which is false and sent two readings of the complaint hunting for a height
lever that does not exist. Corrected in this pass; the comment was the artefact
that would have made the next reader re-derive the wrong mechanism.

## Decision 1 — the ads are six, and the second row is height-gated

`STUDIO_SHOTS` grows to six: the three performance cuts already shipping, plus
three from the studio deck's own _what AI looks like in production_ board
(Gifting 2025, Loop Quiet, Loop Experience). The only lever that reaches a
width-bound grid's surplus is more content in it.

⚠ **SIX TILES ARE TWO ROWS, AND TWO ROWS DO NOT FIT A SHORT CONSOLE.** 317 × 2
plus the gap is ~666px against the 444px field at 1440×800. The second row is
gated on `(min-width: 1200px) and (min-height: 1070px)` — the rung the proof
register already uses — so 1280×720, 1440×800 and 1920×800 are byte-identical to
what shipped.

⚠ **THE GATE IS SCOPED TO `.fl-case`, AND A MEDIA QUERY CANNOT REPLACE THE
SCOPE.** `SheetsPlate` has a second home on the portfolio arc, where
`.arc-sheets` is `max-width: calc(h * 1.7)` — **landscape by construction**, the
opposite shape from this console, with a ~1100×600 field at 1920×1080. There is
no viewport where a 3×2 grid fits that box. And `.fl-con` is
`container-type: inline-size`, so `@container` can ask about width but never
height — a viewport-height rung fires on the arc at a tall viewport and puts six
tiles into a landscape box. Hence the class scope. This is a **fit** divergence,
not a content one: the array is still one record, which is what ADR-078's `toBe`
guard protects.

⚠ **ONE ASSET IS A CROP, AND IT IS THE ONLY ONE ON THIS SURFACE.**
`experience-concerts.jpg` comes from a 1440×2560 story-format cut, windowed to
rows 380–2180 against the subject so the ear, the earplug and the lockup keep
air beneath them. Owner's call as the art director who signed the ad off; the
alternative — letterboxing one tile among five that fill — reads as a rendering
fault. The standing "shown WHOLE, never cropped" rule is otherwise intact.

## Decision 2 — the films row shows how it was made

A `CaseFilmProduction` block seats at the field's floor under the meta bar: the
deck's four-stage chain (**Prompt · Image · Analyse · Animate**, with the tool at
each) over the five departments the films were crewed with.

⚠ **THE CREW HALF IS SUPERSEDED BY U1 BELOW — it was deleted the same day.**
Everything on it here is the record of why it was built and why the roles never
carried names; the two paragraphs marked THE CREW IS THE POINT and ROLES, NEVER
NAMES describe an object that no longer renders. The CHAIN is untouched.

⚠ **IT BELONGS TO THE ROW, NOT TO A FILM.** Both films came off one pipeline
with one crew, so hanging it on `CaseFilm` would print the same record twice with
a rail switch pretending it changed something.

⚠ **THE CREW IS THE POINT, and it is the one thing the panel never showed.** The
left column claims the films used _"the same creative team and quality bar as
Loop's live-action work"_; five departments a live-action spot books is that
claim as a record rather than an assertion.

⚠ **ROLES, NEVER NAMES.** The envelope allows first names for client staff, but
an ATL crew is mostly third-party agency and post people whose names are not ours
to publish — and the claim needs the _departments_ anyway. Guarded: a capitalised
word mid-role fails the registry test.

⚠ **MODEL NAMES ARE IN SCOPE ON THIS ROW** (owner, 2026-08-28). Claude, Nano
Banana, Seedream 4, VEO 3 and Seedance letter here. The Intelligence Map's
stricter envelope is unchanged and does not reach this plate.

⚠ **SEATED, NOT CENTRED, AND THE RESIDUAL IS THE NUMBER TO CHECK.**
`flex: 0 0 auto` under a `flex: 1 1 auto` stage: the block takes its height off
the top of the residual and the frame keeps symmetric air (137/137 at the owner's
shape, 179/179 at 2560×1330). If the stage still reads hollow the lever is more
record in the block — never a stretched frame, which breaks the 16:9 and crops
the poster.

⚠ **IT IS NOT PASSED BY THE PORTFOLIO ARC**, deliberately: `.arc-films` is
landscape and a 16:9 frame already fills it, so there is no hole and a block
would squeeze the film. `ArcStudioFilms` mounts `FilmsPlate` with `films` alone,
so the arc is unchanged by construction — the prop is optional for that reason.

⚠ **BUT IT RETURNS IN THE FLOW RUNG.** Below 980px and under reduced motion at
any width the casefile is static flow with no ceiling, so hiding the block there
would cost the record and buy nothing. Phones and reduced-motion visitors get the
same answer to _how were these made_ as everyone else; the chain halves to two
columns because four stages across a 390px phone is ~90px each and
`Nano Banana · Seedream 4` needs more.

## Decision 3 — the console is slightly transparent, via a NEW token

`.fl-case .fl-con` overrides `--con-ground` to `rgba(var(--void-deep-rgb), 0.86)`.
The corridor's parked brandmark and its gold orbit curves pass behind this panel,
and an opaque ground threw all of it away.

⚠ **IT OVERRIDES `--con-ground`, NEVER `--con-void`, AND THE FIRST CUT GOT THIS
WRONG.** `--con-void` is the OPAQUE BED four other things sit on: the station
diamond (`.fl-con__stn > i`), the lit station's fill
(`.fl-con__stn[data-on]`), the capability plates' inner ground
(`.fl-detail__in`, whose own note records that a translucent inner floods the
plate with the edge colour) and **`--pda-void`, the map's entire drawing floor**.
Softening that token makes the panel look right while every instrument inside it
quietly loses its floor. `--con-ground` is new, defaults to `--con-void`, and is
painted by `.fl-con__console` alone.

⚠ **NO GUARD WOULD HAVE CAUGHT EITHER HALF.** The light-theme walk reads
`.fl-con__console`'s `backgroundColor` and takes luminance from the raw RGB, so
an alpha here moves not one ratio it reports — it measures the panel as though it
were still opaque. **The contrast cost of this value is checked by eye,
composited, in both themes**, and 0.86 is where that was done. Lowering it is a
measurement, not a nudge.

⚠ **THE BLUR IS GATED ON `data-proof-settled`**, like everything else here that
samples its backdrop: ADR-056 measured +2.4–3.7 ms/frame and >33 ms frames going
3 % → 13–16 % when a backdrop blur runs during the arrival. The per-frame
snapshot is the cost, not the radius.

**Scoped to `.fl-case`**: the arcs mount this console over a flat page ground with
no corridor behind it, where transparency buys nothing and costs contrast. One
`rgba()` serves both themes — `--void-deep-rgb` flips to parchment in theme.css —
and the unwrap gate still zeroes the background, so mobile and PRM are untouched.

## Decision 4 — the register's claim and sentence grow, paid out of the leading

`clamp(11.5px, 0.92vw, 13px)` / 1.25 → `clamp(11.5px, 0.72vw, 13.5px)` / 1.18 on
the claim; `clamp(11.5px, 0.9vw, 13px)` / 1.4 / α .6 →
`clamp(11.5px, 0.73vw, 14px)` / 1.3 / **α .74** on the sentence.

⚠ **BOTH ALREADY RENDERED AT 13px** above 1445px wide. The claim only _looked_
bigger because it is bold mono caps against a 0.6-alpha sans — so a fair share of
"too small" was contrast, and alpha is free.

⚠ **THE SIZE IS PAID OUT OF THE LEADING, NEVER OUT OF THE BAND.** The register is
259.6px of a 264px floor at 1920×1080, so ~4px is the entire budget and a naive
bump overflows a reference viewport by construction. 13.5 × 1.18 = 15.93 against
13 × 1.25 = 16.25: the type gets bigger while the row gets **shorter**. A
single-line uppercase mono row never needed paragraph leading — the same finding
`.fl-row` already runs at 1.15.

⚠ **THE CEILING RISES, THE FLOOR DOES NOT, AND THE SLOPE IS WHY.** Wrap is size ÷
_column width_, and this rung opens at 1200px where the column is narrowest and
the clamp already sits on its floor. Raising the floor spends type exactly where
there is no width to pay for it. At 0.72/0.73vw the ceilings land near 1875/1918,
so **1200×1120 is byte-identical to what shipped**.

⚠ **AND THE 95-CHARACTER BUDGET'S RECORDED ARITHMETIC IS STALE.** The CSS
asserted the sentence _"wraps to exactly two"_ at 1920×1080. Measured against an
unclamped clone, all four descriptions render on **one** line at 14px in the
497px column at 1920×1080, 1920×1247, 2017×1269 and 2560×1330, and on two at the
1200px corner — never three. No copy budget moved.

## Verification

A new harness, `scripts/capture-casefile-rows.mjs`, because nothing measured
these two rows against the panel — which is exactly how the defect survived.
Headed, real scrolls, rows selected by CLICK (which pins the scroll to that row's
browse-band centre). It reports plate/field/console boxes, tile count and size,
register box + rendered sizes, per-description **line count against an unclamped
clone** (a `-webkit-box` clips rather than overflows, so the clamped box cannot
report its own truncation) and the film's frame, air and block height.

Swept: 4 rows × 8 viewports (1280×720, 1440×800, 1920×800, 1920×1080, 1200×1120,
1920×1247, 2017×1269, 2560×1330) in dark, plus 3 rows × 3 viewports in light.
**Zero overflow, zero clipped descriptions, no page errors** in all 41.

`npm run verify` (1202 unit tests), `arc-portfolio-smoke` (22 passed) and the
casefile's own clipping / phone / reduced-motion cases all pass.

⚠ **Two `services-ring-smoke` failures are PRE-EXISTING and were confirmed by
stashing this change and re-running**: the Voidwalker masthead reads
`The Azeroth teacher` where the test expects `The Intelligence Architect`
(ADR-082 territory), and the map console's light walk fails on `W-040` at
2.38:1 — the `--pda-txt3` weakness ADR-063 U2 already records as open, now
biting in light as well as dark.

## Update 1 — the sheets fill, the crew goes, and the index gets its size (2026-08-28, owner)

Same day, on the shipped cut:

> for THE LINE, let's remove the crewed as live action … the line and the red
> line tabs, we're not optimally using space. Everything is so spread out …
> "In paid social, AI is the default process" font size is too fucking small.
> Please increase the font size, but proportionately, make sure that all the
> other font sizes follow our grid system's typography best practices.

### The crew row is deleted

Decision 2's five departments came off the day they landed. Job titles with
nobody attached read as filler, and this surface has removed a console head, a
foot and a designator for less. **The chain stays** — it is a record a reader
can check against the drawing. The left column keeps the craft claim in prose,
where it always was.

### ⚠ ONE SCALE PER BODY, AND IT IS `min(vw, svh)`

`--fl-copy` is `vw`-only, so **1920×800 and 1920×1247 resolve it identically**
(16.2px) while the field is 530px tall in one and 927px in the other. The sheets
were sized against the short one and read as captions floating in a tall box on
every desktop above it. Two new tokens, each the smaller of what its axes
afford, so neither can overflow:

- `--sh` on `.fl-plate--sheets` = `clamp(12px, min(1.35vw, 2.15svh), 25px)` —
  every size in both sheet bodies derives from it by ratio.
- `--lc` on `.fl-case` = `clamp(11.5px, min(0.95vw, 1.3svh), 16.5px)` — the
  register claim, its sentence, the directory row and its meta.
  ⚠ **SUPERSEDED AND DELETED by [ADR-088](088-casefile-left-column-ladder-and-rhythm.md)
  (2026-09-02).** One token across FOUR roles and TWO faces cannot hold a
  ranking: its `svh` term made the order flip with viewport height, so at
  1920×1080 the sans sentence (14.04) outranked the mono claim (13.34) it
  explains. The roles split by face now — mono on the chrome scale, the
  sentence at `--fl-copy / --fl-ratio`. The measurement below is still the
  reason the SENTENCE cannot simply grow; it was never a reason for the other
  three.

⚠ **THE COEFFICIENTS ARE SOLVED, NOT PICKED.** `--lc` resolves to **14.04px at
1920×1080** — where it already was, and just under the **14.1px at which the
longest description wraps**, measured as 459px of a 462px column at 14px, i.e.
99.3 % of the line. Above that viewport the height term takes over: 16.2px at
1920×1247, two lines, which the taller box affords. 1200×1120 and 1440×800 hit
the floor exactly as before.

⚠ **AND THE BOX IS THE REAL WALL, NOT THE WIDTH.** `--fl-proof-h` is a fixed
264px at 1920×1080 with four `1fr` rows, so ~14px is the ceiling there _whether
the sentence takes one line or two_ — the arithmetic comes out the same both
ways. It cannot be bought back by growing the register either: the directory
below needs ~144px and 291.6px was already measured clipping it by 11. So the
reference viewport keeps what it had and the owner's shape gets the size; that
is the honest split, not a compromise to paper over.

### ⚠ `space-between` MADE IT WORSE, AND THAT IS THE FINDING

THE LINE's first cut distributed all four blocks evenly. It put ~200px between
each and turned a column into four disconnected fragments — the verdict floated
away from its own definition, the definition from its examples. **Even
distribution only improves a column that has enough content to distribute.**

The column is a grid with **three anchors** instead: the category at the head,
what it means centred in the body (`.fl-cmp__read` wraps the claim and the
description so they cannot drift apart), what it looks like in production at the
floor. The middle row takes the slack, so the surplus lands where the eye
already rests.

### ⚠ THE RED LINE IS FOUR BANDS, BECAUSE A 2×2 CANNOT FILL A TALL PANEL

Four risk statements are ~90px of ink against an 880px field; `align-content:
center` left ~350px of void above and below, and no type size closes a gap that
large. `grid-auto-rows: 1fr` on a single column divides the height between four
bands **whatever the height is**, each centring its own content — the surplus
becomes the bands' own air instead of one hole. The claim sits on a left rail
with its evidence beside it, which is `.fl-proof-register__list`'s own grammar
one scale up.

⚠ **It suits both homes for free.** The portfolio arc mounts this plate in a
LANDSCAPE box (~1100×600) where the bands are ~150px each. `1fr` rows need no
per-shape tuning, which the 2×2 did.

### Verified

The eight-viewport sweep re-run across **all four rows in both themes** — zero
overflow, zero clipped descriptions, no page errors. `npm run verify` (1202),
`arc-portfolio-smoke` (22 passed, the sheet markup change included), and the
casefile clipping / phone / reduced-motion cases all green. A second harness,
`scripts/measure-casefile-type.mjs`, reports the size at which each string runs
out of column — that is the number this update is built on, and it is the one
the previous pass assumed.

## Left open

- ~~**THE LINE still carries two moderate gaps**~~ — **TAKEN UP IN U1**
  (2026-08-29). The seated verdict bands this bullet named are the answer the
  owner asked for, on all three sheets rather than two. See Update 1 below.
- **A fourth `THE PROCESS` sheet** — the deck's brief → generation → copy →
  design chain with the AI/human split — was offered and not taken. It is the
  one addition that would make the Studio panel a _drawn_ instrument like the map
  and tools panels rather than three text-and-image layouts.
- **The film's residual air grows with the viewport** (137/137 at 1920×1247,
  179/179 at 2560×1330) because the frame is width-bound at 802px. Only more
  record in the seated block reaches it.
- **`--pda-txt3` now fails the light walk**, not merely the dark reading. It is
  an owner call on the ramp's ink rung, not a fix this pass should make silently.

---

## Update 1 — one template, three sheets, and the surface says UGC (2026-08-29, owner)

> _"The most discombobulated project is the AI Fluency Studio. We have the
> visuals, we have the line, and then we have the red line. Each of them
> looks completely different… I think we need some sort of templates where
> maybe at the bottom we have some information. In the presentation I
> shared, it's clear about user-generated content (UGC), but it's not
> clear here."_

Two complaints, one cause. The three sheets shared a `ConsoleRail` and
nothing else: a bare grid of images, a bespoke three-anchor two-column
comparison, and a borrowed four-band list. Three documents behind one rail.

### The template is a verdict band

Every sheet now ends on its own designation and one sentence —
`CaseSheet.verdict: { kicker, copy }`, rendered as `.fl-verdict`. That is
**the source deck's own grammar**: slides 3, 9 and 10 of
`ai-in-studio-final.pptx` each close on a single bottom band under its
designation (`PRINCIPLE`, `POSITION`) carrying the sentence the slide
exists to deliver. The body is the evidence; the band is what the evidence
means.

⚠ **IT IS NOT THE CONSOLE FOOT, AND THE DISTINCTION IS THE WHOLE
ARGUMENT.** ADR-068 U2's ruling stands — no plate prints a `foot`, and the
smoke still fails on any `.fl-con__foot`. That slot is ROW-level chrome
saying the same thing under whatever the rail is showing. This is SHEET
content: it switches with the rail, and it rides the films row's own
production-block seat (`flex: 0 0 auto` sibling inside `.fl-con__field`,
the body keeping `flex: 1 1 auto`).

⚠ **ALWAYS ON, where `.fl-filmprod` is gated at `(min-width: 1200px) and
(min-height: 1070px)`.** That block is supplementary record about a row;
this is each sheet's punchline. A sheet whose verdict hides at 1280×720 is
a sheet that stopped making its argument at the binding viewport.

⚠ **REQUIRED BY THE REGISTRY, OPTIONAL IN THE TYPE** — so the template
cannot erode one sheet at a time. Budgets: kicker ≤16, copy ≤160 (two
lines at the narrowest field the band renders in).

### THE RED LINE says what it is about

The four risks named "a person recommending the brand" and "creators", and
a reader who did not already know the subject had to infer it from four
angles: **the sheet argued the case without ever stating the charge.** Its
band opens on slide 10's own title — `AI-generated UGC is off the table.`
— and closes on its POSITION. And `CaseFact.tag` brings the deck's risk
categories back over each claim (BRAND · REPUTATION · FINANCIAL ·
PARTNERSHIP RISK), which is what turns four sentences into one ranked
argument: the reader takes the axis before the claim.

⚠ **ALL-OR-NONE, registry-enforced.** A tag on some bands emphasises
those, and the sheet's argument is that the four risks are of equal rank.
⚠ **Placed at grid row 1 / column 1 explicitly** — a third auto-placed
child would break the claim↔evidence baseline pairing the band is built
on; absent, the auto row collapses to zero and an untagged facts sheet
renders byte-identically.

### The figure is sized from its height now, and it shrinks

⚠ **THE BAND BROKE THE LINE AT 1280×720 THE DAY IT SHIPPED.** The
`.fl-cmp__figure` is that column's squeeze absorber — it sits in the
middle `1fr` row while every sibling is `auto` — but every term sizing it
was a WIDTH (`min(100%, clamp(180px, 22vw, 320px))`), so it absorbed
nothing when the band took ~83px off the row's HEIGHT. Measured: the
middle wanted **301px in a 259.6px row**, and the 41px it could not give
back came out as a spill through the column's head and its exemplars.

⚠ **AND EVERY GUARD STAYED GREEN.** `.fl-cmp__middle` was
`align-self: center`, so content taller than its row overflows
**symmetrically** — and a symmetric overflow reports
`scrollHeight === clientHeight`. `capture-casefile-rows` printed `OK` on
the frame it had just broken. `.claude/rules/proof.md` names this exact
failure mode one plate over ("the centred column's SYMMETRIC overflow,
which reports zero") and it still caught nobody. **It was found by looking
at the station.**

The fix is structural, not a coefficient: `.fl-cmp__middle` stretches to
its row (so the row is a definite box) and the figure is
`flex: 0 1 auto; min-height: 0` with its size on `height`, so the layout
does the arithmetic — the figure takes what the read block leaves, at
every height, and the clamp becomes a CEILING for tall viewports rather
than a size.

⚠ **A FIXED `svh` CAP WAS THE FIRST FIX AND IT IS THE WRONG SHAPE.** The
overflow depends on the row's height AND the description's wrap, so one
coefficient lands at 720h and misses at 800h — it was measured doing
exactly that. Measured after: middle content 248.1 in a 259.6 row at
1280×720 (7.9px clear of the exemplars), 283.9 in 296.7 at 1440×800
(8.8px clear), and at the owner's 1247h the figure sits at its 320 ceiling
unshrunk — **byte-identical to what shipped**.

### The guards that were missing

- **The landing's clip sweep read each row on its DEFAULT station only**,
  so THE LINE and THE RED LINE were never measured on the landing at all.
  It now walks every station of a sheets row and asserts the column's head
  is not clipped above its own box and the middle does not print through
  the exemplars — the two halves of a symmetric spill, which no overflow
  number can express.
- **`.fl-verdict` presence** on the sheets row, and `.fl-verdict__p` joins
  the prose-selector pin list (its kicker inherits `--fl-mono` and is
  covered by the family sweep).
- **The arc gained a question rather than losing one.** The band takes
  64–83px of that console, so `fillH` was expected to fall through its 0.7
  pin — measured, it does not (0.774 at 1280×720 → 0.83 at 1920×1247,
  because that box is landscape and the tiles are one row), **so the pin
  stays where it was rather than being "retuned" to a number the change
  did not require.** What is new is the UNION — the tiles' top to the
  band's bottom, everything under the rail — which is the honest form of
  "the panel fills its housing" now that two things fill it (measured
  0.922–0.939 against a 0.85 floor). Plus the band on every station and
  the four tags rendering.

### Result

`cases-registry` 38 pass with the new pins and the envelope scan over the
new copy. `arc-portfolio-smoke` 22 pass. `services-ring-smoke`: the clip
sweep passes including the new station walk; the one failure is the
PRE-EXISTING ambient-hold case, confirmed identical with the change
stashed. Captured at 1280×720 / 1440×800 / 1920×1247 in both themes,
every station.

### Still open

- **A fourth `THE PROCESS` sheet** — unchanged from above, and now cheaper:
  a new sheet inherits the template rather than inventing a layout.
- **THE LINE's remaining air** is smaller but not gone at tall viewports,
  where the figure sits at its ceiling and the band is a fixed cost.
