# ADR-088: The left column's type splits by face, and its slack is split too

- **Status:** **Proposed** pending the owner's live read. Both halves are
  shipped, measured and guarded; what is open is taste, not fit.
- **Date:** 2026-09-02
- **Owner call:** _"the typography, especially the font sizes … feels a bit
  disconnected, and also the spacing, especially in the left panel the spacing
  between the directory and the other elements feels too connected. I think the
  directory used to be a lot smaller, but I feel it's too big. I just feel like
  it's not really balanced."_
- **Surfaces:** `components/landing/home-v2/services/casefile/casefile.css`,
  `.../casefile/ServicesCasefile.tsx`, `.../casefile/map/pda/pda.css`,
  `tests/visual/services-ring-smoke.spec.ts`,
  `scripts/capture-casefile-rows.mjs`,
  `app/(internal)/test/hud-panel-lab/**`
- **Supersedes:** ADR-084 U1 on `--lc`, which is deleted · ADR-067 U3 on the
  directory row's RANK (its size rule and its leading rule both stand) ·
  ADR-085 U1 on "the two content ladders sit on the scale by intent" — there
  is one content ladder now
- **Builds on:** [ADR-085](085-proof-design-pass.md) (the modular chrome
  scale this extends to the content roles) ·
  [ADR-084](084-casefile-panel-fills-its-housing.md) (the register box, the
  claim/sentence leading and alpha) ·
  [ADR-067](067-casefile-type-and-clutter.md) (two families by role; the
  directory's own clamp) · [ADR-070 U14](070-configuration-is-a-switchboard.md)
  (split the slack, do not pool it — the law the rhythm half enforces) ·
  [ADR-087](087-proof-client-stack.md) (the frame law the new wrapper obeys)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

Measured on the live surface before the change, with computed styles:

| role                           | 1280×720 | 1440×800 | 1920×1080 | 1920×1247 (owner) |
| ------------------------------ | -------- | -------- | --------- | ----------------- |
| tab name (mono 700 caps)       | 13.2     | 13.2     | 14.4      | 14.4              |
| brief body (sans)              | 13.5     | 14.9     | 16.2      | 16.2              |
| register claim (mono 700 caps) | 11.5     | 11.5     | 13.34     | **15.4**          |
| register sentence (sans)       | sr-only  | sr-only  | 14.04     | **16.2**          |
| directory row (mono 700 caps)  | 13.06    | 14       | 14.32     | **16.5**          |
| row meta (mono)                | 10.24    | 11.5     | 11.5      | 12.16             |

| seam / band                   | 1280×720 | 1440×800 | 1920×1080 | 1920×1247 |
| ----------------------------- | -------- | -------- | --------- | --------- |
| brief box → register          | 18       | 20       | 26        | 28        |
| register → directory          | 12       | 12.5     | 18        | 18        |
| register row pitch            | 19       | 21       | 61.5      | 68.6      |
| empty band under the last row | 2        | 8        | 27        | **137**   |

Three causes, all mechanical.

**1. One token drove four roles across two faces.** `--lc`
(`clamp(11.5px, min(0.95vw, 1.3svh), 16.5px)`, ADR-084 U1) fed the claim at
×0.95, the sentence at ×1, the row at ×1.02 and the meta at ×0.75. Because its
`svh` term grows with height, the ranking between those four FLIPPED with the
viewport: at 1920×1080 the sans sentence (14.04) outranked the mono claim
(13.34) that it explains, and at the owner's window four roles sat inside 1.1px
with the directory row — bold mono caps, the loudest face on the surface — the
largest text after the title.

⚠ **The ordering a ladder guarantees is the one inside its own face.** One
token across two faces cannot hold a ranking, because 13.34px of bold mono caps
reads louder than 14.04px of 0.78-alpha sans. The arithmetic ordering and the
optical ordering ran opposite ways at a reference viewport, and no guard could
have seen it: every size was inside its clamp and nothing clipped.

ADR-085 U1 had already put the CHROME roles on a modular scale and had
deliberately left the content roles off it, because they were "solved against
measured wrap thresholds". That reasoning holds for `--fl-copy`. It did not
hold for `--lc`, which was solved against ONE of its four consumers (the
sentence's 14.1px wrap point) and then applied to three others by multiplier.

**2. The directory's row grew four times in four weeks.** The owner's memory is
correct: `9.5px` flat (2026-07-28) → `10.5` → `11.5` → `clamp(13px, 1.02vw, 14px)`
(2026-08-24, ADR-067 U3) → `max(13px, min(1.02vw, 14px), --lc × 1.02)`
(2026-08-28, ADR-084), with `min-height` and padding raised twice on top. The
last step added the `--lc` arm, which is what carried it to 16.5px at 1247 —
above the size ADR-067 U3 was written for.

**3. The slack pooled under the directory.** The brief, the register and the
directory were three absolutes hung off the tick ladder, each top-anchored, so
every viewport taller than the design's own put its whole surplus in one place:
the band under the last row. The seam ABOVE the directory stayed pinned at 18px
— the tightest joint in the column was the one separating its two objects,
which is why the directory read as a fifth register row. That is ADR-070 U14's
own finding in a new place, and ADR-067 U3 left it open verbatim as "a
composition question rather than a type one".

## Decision

### 1. Two ladders, one ratio, by FACE

`--lc` is deleted. The four roles split by face, both ladders at
`--fl-ratio` 1.2:

| role              | face | was                                    | is                                    | @1280 | @1920 |
| ----------------- | ---- | -------------------------------------- | ------------------------------------- | ----- | ----- |
| register claim    | mono | `max(11.5, --lc × .95)`                | `--fl-chrome-lg`                      | 13.2  | 14.4  |
| directory row     | mono | `max(13, min(1.02vw,14), --lc × 1.02)` | `--fl-chrome-lg`                      | 13.2  | 14.4  |
| row meta          | mono | `max(min(.8vw,11.5), --lc × .75)`      | `--fl-chrome-md`                      | 11    | 12    |
| register sentence | sans | `--lc`                                 | `max(11.5px, --fl-copy / --fl-ratio)` | 11.5  | 13.5  |

The column now letters six sizes at 1920 — 10 · 12 · 13.5 · 14.4 · 16.2 · 24 —
each carrying exactly one role.

⚠ **The claim and the row are PEERS, and that re-reads ADR-067 U3 rather than
overturning it.** That rule put the row "one step ABOVE the register's claims"
for a stated reason: _the identity of a project may not read smaller than a
sentence about it._ The sentence is SANS and now sits a full ratio step below
both, so the reason is satisfied without the mono step. Two mono-caps runs a
ratio apart in one narrow column is what read as assembled from parts, and
`/test/casefile-type-lab`'s harmonised branch made this argument first
(`casefile-type-lab.css`: _"the register and the directory finally letter at
one size — they are peers, and reading them as peers is what stops the left
column looking assembled from parts"_). What survives from U3 unchanged: the
row's 13px floor, its `line-height: 1.15`, its `.05em` tracking, and the head's
.42 alpha.

⚠ **1440×800 and 1920×800 take the row 14 → 13.2**, because `--fl-t0`'s `svh`
term is under its 11px floor below 991px of height, so `--fl-chrome-lg` is flat
at 13.2 there. Named because a laptop is a reference viewport; it is the
direction the complaint asked for.

⚠ **The sentence's floor is 11.5, not 12.** Wrap is size ÷ column width and the
tall rung opens at 1200px where the column is narrowest (~296px): the 95-char
worst case measures ~1.85 lines at 11.5 and ~1.93 at 12, and the second number
is one copy edit from a third line under a clamp that truncates silently
(ADR-066). 11.5 is where `--lc` floored, so that corner is byte-identical —
verified at 1200×1120: two lines, no truncation.

⚠ **The compact rung pays for the claim out of the ITEM'S PADDING, not the
band.** At 13.2 the claim's line box is 15.58px and now exceeds the 14px mark
beside it, so the mark stops setting the row's height. Four rows at `2px 0`
would measure 83.3px in a 76.32px box — a 7px overflow the column cannot fund
(the brief has ~0 slack, the directory 2px, and the two seam floors are the
owner's own air). At `1px 0` a row is 18.58px and the four plus the closing
hairline are 75.3px: the first time this register fits with real slack instead
of on the smoke's ≤1px tolerance, which is what 77.0-in-76.32 had been passing
on. The tall rung keeps `4px 0`; it has ~60px of slack.

⚠ **One consumer lived outside this column.** `map/pda/pda.css`'s
`.fl-pda__list-row` read `var(--lc, 12px)` — and a stale `var()` fails
SILENTLY, falling to its fallback rather than erroring. It takes
`--fl-chrome-md`, which is the same label rank the directory's head and meta
letter at and floors at 11px on a phone, so that row is byte-identical. Not
chrome-lg: that is the identity rank and would have grown those rows 11 → 13.2
on the one path whose height pin has 0.45px of slack.

### 2. The column is one grid, and the index sits on tick 11

`.fl-left` spans `--fl-body-top` to `--fl-split-end` (tick 11):

```
brief (auto) | seam A (1fr) | register (auto) | seam B (2fr) | directory (auto)
```

so the last directory row sits ON tick 11 by construction and the surplus goes
to the seams instead of the floor.

⚠ **The split is 1:2 because the GROUPING is 2:1.** The brief and the register
are one group — an engagement's claim, then the four proofs of it — and the
directory is the column's other object, an index of the rest of the file. The
larger gap separates the two groups; the smaller separates a thesis from its
own evidence.

⚠ **`--fl-proof-top-gap` and `--fl-directory-gap` became FLOORS**, and seam A's
floor is `--fl-brief-clear + --fl-proof-top-gap`: the air a reader sees above
the register has always been the sum of the brief's own bottom trim and that
token, so a floor stated as one of them would have tightened the seam by 8px at
the binding viewport. `--fl-brief-clear` is hoisted out of `.fl-brief`'s height
for that reason.

Measured, dark and light:

| viewport  | seam A | seam B | last row vs t11 | was A / B / hole |
| --------- | ------ | ------ | --------------- | ---------------- |
| 1280×720  | 18.1   | 13.5   | 0.00            | 18.1 / 12 / 2    |
| 1440×800  | 20.0   | 20.9   | 0.00            | 20 / 12.8 / 8    |
| 1920×1080 | 25.9   | 38.8   | 0.00            | 25.9 / 18 / 27   |
| 1920×1247 | 58.8   | 117.6  | 0.00            | 27.7 / 18 / 137  |

At 1280×720 the column's leftover is ~32px against floors summing 30, so both
tracks sit on their floors and the binding layout is what shipped.

⚠ **`.fl-left` IS HOUSING.** No `data-fl-panel`, no `data-fl-client-panel`:
ADR-087's frame law says the frame does not crossfade with the record inside
it, and mechanically `[data-fl-panel]` takes `will-change: transform` under
`[data-proof-live]`, which makes an element a containing block for absolutely
positioned descendants.

⚠ **No `overflow: hidden` on the wrapper**, for two reasons. The zones strike
in from `--fl-dx: -48px` and a clipping wrapper on the column's own left edge
would crop that arrival; and it is the better failure mode — a client with more
rows than tick 11 affords now overruns LOUDLY, where the old fixed-height
`.fl-dir` clipped its last row in silence.

⚠ **Every zone declares its `grid-row`.** Auto-placement fills rows 1, 2 and 3:
the three zones would stack against each other and both seam tracks would sit
empty below them.

⚠ **The phone/PRM path resets both.** `.fl-left { display: contents }` hands
the zones back to `.fl-case`'s own grid, which is what ADR-083's source-order
seal and the `data-mobile-view` rules select against, and
`grid-row: auto` goes with it — the desktop values would seat the brief in the
phone's first row, on top of the tabs.

### 3. The directory's head gets half a chrome step over its list

Tall rung only (6px at 1920). The head carried `padding-bottom: 5px` and the
list no margin at all, so the line that says these ARE the other projects sat
on the rows it labels — the tightest joint in a column whose whole complaint
was that everything read as connected.

⚠ **It is declared AFTER the base rule, not inside the tall-rung block up at
the register.** Placed there it loses to `.fl-dir__list`'s own `margin: 0` on
source order at equal specificity and does nothing at all — measured at 0px on
both tall viewports on the first cut, with every other number correct.

## The guard

`services-ring-smoke.spec.ts`'s geometry block gains ADR-088's law at all six
reference viewports:

- **`seatOnT11` pinned from BOTH sides** (±1.5px). Over-running tick 11 is a
  clip; falling short of it is the pooled hole this pass removed, and a
  one-sided bound would only ever have caught the first.
- **Both seam floors**, keyed on the 1070h rung.
- **The 1:2 ratio, bounded both ways**, above 1070h only. Below it both tracks
  sit on their floors and seam A is legitimately the larger (18.1 against 13.5
  at 1280×720), so asserting the ordering there would fail the layout this pass
  deliberately preserves.

⚠ **`summaryGap < 80` is DELETED, not retuned.** It measured from the brief's
PARAGRAPH to the register, so it read a different number on every directory
row, and its literal was written for a column that pooled its surplus at the
bottom. Under the split the seam legitimately reaches ~82px at 2560×1330 — the
bound would have failed a layout doing exactly what it was asked to. What it
defended (dead space must not reopen above the register) is now the
`gapA ≤ gapB` ordering plus the seating law, asserted at every viewport rather
than only the tall ones.

⚠ **The mark-ladder bound gained a 0.5px epsilon, and the reason is worth
keeping.** A mark declared at exactly 21px measured **21.000015258789062**
(21 + 2⁻¹⁶) on one run sampled mid-strike, failed an exact `> 21`, and passed
twice more at the same nominal progress with the same code. The register is a
`[data-fl-panel]` riding `translate3d(...)`, so a descendant's rect comes back
through a float matrix: **an exact bound against a transformed rect is a flake
generator.** Half a pixel is far below the 7-unit lattice step the rule
actually polices (14 against 21).

`scripts/capture-casefile-rows.mjs` prints the two seams, the directory's
height and the t11 delta beside the type it was traded against.

## Rejected

⚠ **Shrinking `--fl-proof-h` above 1800px wide, to widen the seams further.**
The plan for this pass carried it, on the argument that at 1920×1080 seam B
(38.8px) is smaller than the register's row pitch (61.5px) and therefore
violates "an inter-group gap must exceed the intra-group pitch". Built, then
dropped on measurement and on looking:

- **The comparison is wrong.** The register's rows are separated by HAIRLINES,
  not by whitespace — five of them for four bands. A drawn rule is a stronger
  separator than any gap, so comparing a whitespace seam to a ruled track's
  pitch compares two different quantities. On the capture the register reads as
  one bounded object and the directory as another.
- **It moves the number the wrong way.** Shrinking the register enlarges the
  surplus the seams divide: at 1920×1247 the pair would go 59/118 → ~83/167.
  The pass was asked for balance, and that is less of it.
- **It spends evidence height on a rule of thumb.** The register box is where
  the four claims and their sentences live, and ADR-084 solved its floor
  against them.

## Left open

- **The seams grow without bound with viewport height** — 59/118 at 1920×1247,
  ~82/164 at 2560×1330. It is the honest shape of "split the slack" and it
  reads as composition rather than as a hole, but a very tall window makes the
  column three blocks with large voids between them. If the owner reads it that
  way, the lever is to cap what the seams absorb and give the remainder to the
  register's box, whose ceiling (282px) was set by a directory that now takes
  only what it needs.
- **The tab name shares `--fl-chrome-lg` with the claim and the row.** Three
  identity roles on one step is defensible (client identity, proof identity,
  project identity) and the tab has drawn no complaint. If the client name
  should outrank, the step is `--fl-t0 × --fl-ratio²` (15.8 / 17.3).
- ADR-085 U1's own open items are untouched.

## Verifying

```bash
npx vitest run tests/lib/theme-css-sweep.test.ts tests/lib/cases-registry.test.ts
npx playwright test tests/visual/services-ring-smoke.spec.ts
node scripts/capture-casefile-rows.mjs --vp 1920x1247 --theme dark --rows 0,1,2,3 --stage
```

⚠ The photo-resolution case (`embedded/workshop.webp`) fails on the mobile
projects when the run is parallel and the dev server is shared — it reports
status `0` (the fetch threw), while all four assets serve 200 with real bytes
to `curl`. Environmental; confirm with a curl before blaming a change.
