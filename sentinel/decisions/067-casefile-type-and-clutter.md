# ADR-067: One type ladder, blocks that read, tabs that are tabs

- **Status:** Accepted
- **Date:** 2026-08-06
- **Owner call:** yes
- **Surface:** `components/landing/home-v2/services/casefile/**`, `lib/cases/**`
- **Builds on:** [ADR-066](066-casefile-one-rail-one-foot.md) (the rail and the
  foot this re-types), [ADR-065](065-corner-law.md) (the corner law the tab
  plates take their chamfer from), [ADR-056](056-services-proof-casefile.md)
  (the register's three-tier tile, superseded here)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

ADR-066 unified the rail and moved context to the foot. Living with it, the
owner: _"This is too cluttered, and the fonts are inconsistent."_ Every
complaint turned out to be a measurable defect rather than a preference.

## Decision 1 — two families, and each does its own job

**Measured live before touching anything.** The casefile was rendering
**three** font families:

| element                                            | family            | why        |
| -------------------------------------------------- | ----------------- | ---------- |
| `.fl-brief__body`, `.fl-con__foot p`               | PP Neue Montreal  | correct    |
| `.fl-cap__t`, the register, the directory          | PT Mono           | correct    |
| **`.fl-con__stn > b`, `.fl-cap__d`, `.fl-cmp__*`** | **IBM Plex Mono** | **a leak** |

⚠ **`--font-mono` is IBM Plex Mono** (`app/styles/variables.css`), not the
casefile's `--fl-mono` (PT Mono). The console arrived from the v18 PDA port
carrying `font-family: var(--font-mono)` on `.fl-con`, so every descendant
that declared no family of its own inherited a third face — including
`.fl-cap__d`, which is four lines of body prose sitting directly above a sans
foot. That is the "fonts are inconsistent", and it is the same class of bug as
ADR-066's `--font-sans`, which was declared nowhere at all.

Two fixes, both one line: the console points at PT Mono, and every element
whose content is a **sentence** declares PP Neue Montreal explicitly rather
than inheriting. The type law was already right — _PT Mono owns instrument
chrome, PP Neue Montreal owns titles and prose_ — it just was not being
followed by anything that forgot to say so.

**Sizes now come from one token.** `.fl-con__foot p` reads `--fl-copy`, which
is what `.fl-brief__body` reads (owner: _"the copy in the right panel at the
bottom should have the same font size as the paragraph on the left panel"_).
It was a second scale that happened to land 1.2px short. `.fl-cap__t` goes
11px → 12px, the type law's floor for readable compact copy.

⚠ **The guard is per-ROLE, not per-family.** A sentence set in mono passes any
"no third family" count. The smoke asserts both: no foreign face anywhere, AND
four named prose selectors resolve to sans.

## Decision 2 — the register is four claims

The tile was three tiers — display figure, label, sentence — twelve strings in
a 203px box. Two things were wrong with it and only one was the crowding.

**The figure could never be one thing.** Across four rows its sixteen values
carried **nine grammars**:

| #   | Map             | Studio                   | ATL                         | Tools                  |
| --- | --------------- | ------------------------ | --------------------------- | ---------------------- |
| 1   | `27` count      | `97%` percentage         | `2 × 30 SEC` count×duration | `MULTI-MODEL` word     |
| 2   | `47` count      | `3/3` ratio              | `6 DISCIPLINES` count+noun  | `MONDAY → FIGMA` arrow |
| 3   | `19/24` ratio   | `2–3×` multiplier        | `YOUTUBE + CTV` channels    | `3 SIGNALS` count+noun |
| 4   | `WITHIN` status | `SELF-SUFFICIENT` status | `2 + 2` arithmetic          | `4 STEPS` count+noun   |

Owner: _"we shouldn't use percentages or numbers because we can only do that
if every single project has a percentage or number, but we don't."_ Row one's
`27` and `47` also restated the directory row's own `27 → 47` two boxes away —
_"we have 27, and then we have, within that, feels very confusing."_

So `CaseBlock` loses `value`. **The tile is a claim, then its evidence**, and
all sixteen records were rewritten to one grammar. The counts are not lost:
a row's headline number is on its directory `meta`, where a count belongs, and
the rest read inside the sentences.

### Three defects the figure was hiding

- ⚠ **`data-wide` changed the type size INSIDE a row.** Values over 12
  characters dropped to a smaller clamp, so `SELF-SUFFICIENT` set at 11.8px
  beside `97%` at 14.4px — on four of sixteen tiles. Its mobile reset was also
  missing, so on a phone those four sat at the 10.5px floor against a 16px
  sibling. The whole ramp is gone.
- ⚠ **The label was 9.5px and clipping 5–9px on every row** at laptop heights,
  silently, below the 10px control floor.
- ⚠ **`.fl-rule--brief` was pinned to raw `--fl-t6`** while the register hangs
  off `--fl-left-seam`; above 1200×931 the seam is pulled up, so the register
  floated below its own rule exactly where there was most room to notice.

### ⚠ Below 931h the tile is the claim alone, and that is arithmetic

Measured at 1280×720: the register box is **86px**, a tile 43px — and a claim
(2 lines, 29px) plus its sentence (3 lines, 48px) plus padding needs **91px a
tile, 182px for the grid**. The box cannot grow into it either: from the
register's top to the foot there are 242px and the directory needs ~110 for
four rows and a head. It is 55px short at best.

So the content reduces — but **what remains is the point**. The old rung hid
this same sentence and left a display figure over a clipping 9.5px label; the
tile now keeps a 12px claim carrying its own figure (`97% of briefings involve
AI`), which is exactly why the figure tier could go. The sentence stays in the
accessibility tree at every viewport and returns visually above 931h.

⚠ **`title` is pinned at ≤27 characters, and 27 is measured.** At 1920×1080
the half-column is ~234px and the claim sets at 13px mono with .045em tracking
— ~8.4px an advance, so 28 characters wrap. A wrapped claim steals a line from
its own sentence: the map row's third tile did exactly that and clipped its
description by 14px while the other fifteen fit.

### The lifecycle guard moved rather than lapsing

The tools row's claims carried a `· live` suffix, which `.claude/rules/proof.md`
itself names as the thing to avoid — a **second status registry**, hand-kept in
step with `PROJECT_CASES`, where the lifecycle actually lives. Dropping it is
what makes that rule true rather than merely asserted. The guard now checks
`PROJECT_CASES[].status` directly and forbids a proof claim from restating it.

## Decision 3 — the stations are chamfered plates

Owner: _"look at more retro terminal interfaces where it has a bit of a notch,
but where you also have different tabs. Right now, it just feels very
traditional."_

Each station is a plate whose **top-right corner is cut** — the corner law's
diagonal at the **chrome rung**, because a tab is a plate on the machine, not
a housing. Precedent existed twice already: the handoff dock cuts both top
corners, and the directory's own folder glyph cuts its leading one.

- **Active** — filled, and **welded to the console**: an `::after` covers the
  rail's bottom border so the plate and the body become one surface. That is
  the retro read — the open drawer of the machine, not a highlighted cell.
- **Inactive** — recessed ground, quiet ink, the rail's hairline running
  beneath, broken by the active plate.
- ⚠ **The lit spine moved to the TOP of the plate.** It used to underline the
  active station at `bottom: -1px` — the exact pixel the weld now occupies, so
  the two would have fought and the lit rule would have re-drawn the seam the
  weld exists to remove. On top it is the lit edge of the open drawer, its
  travel is unchanged, and an `inset` clip stops it at the plate's chamfer
  while its width stays a full station pitch so `translateX(--rail-i × 100%)`
  still lands exactly.

## Decision 4 — the "two diagonal lines" were the orbit ring

Owner: _"on the right panel, you have these two diagonal lines coming out of
it. They feel like they're coming out of the tabs, but they are not."_

⚠ **The first reading — that they were the console's chamfers — was wrong, and
fixing that would have fixed nothing.** A `clip-path` **cuts** a border, it
never strokes one; a chamfered corner is a _gap_ in the frame, not a line.

They are `ConsoleFrame`'s orbit ellipses. With `preserveAspectRatio="none"`
they map linearly onto `.fl-con`, so ellipse 1 (`rx 410 ry 600`) resolved to a
**302.8px screen radius against a 265px half-box** — it overshot the top by
37.9px, got cropped, re-entered at the top edge and was swallowed again by the
opaque console 7.3px below. What survived was **two 14px stubs at 30.8°**, and
at four stations they landed on the tab dividers: one straddling x=154, the
other 2.8px off x=447. Hence "coming out of the tabs".

**The bound is arithmetic and viewport-independent.** Screen `RY = ry·H/1050`
against a half-box of `H/2`, so staying inside vertically is `ry < 525` at
**any** height; `RX = rx·W/840` against `W/2 − gap`, so `rx ≥ 420` always exits
sideways. An arc may leave this box sideways — reading as a ring passing behind
the device — and never through the top or bottom. Ellipse 1 becomes
`rx 470 ry 500`; ellipse 2 already satisfied both, which is why only one pair
ever appeared.

## Consequences

- Three orphaned CSS families deleted — `.fl-readouts*`, `.fl-ctx*`,
  `.fl-source` — confirmed to have no renderer anywhere in the repo. ⚠ The
  `context` and `source` DATA stays: the registry test pins both non-empty.
- `MÍMIR · INVENT · PERFORMANCE · 2025` is off the tools foot (owner). The
  codename now survives only as the lightbox's label.
- **1920×1080 joins the smoke's reference viewports.** It was a gap between
  1440 and 2017 and it is the WORST case: `.fl-brief` hangs off the `--fl-t6`
  seam, which is not monotonic in viewport height — 199px at 1280×720, 221px
  at 1440×800, but only **202px** at 1920×1080 while `--band-copy` is at its
  18px ceiling. The Studio brief had been clipping 19px there in both themes;
  its copy is trimmed and the viewport is now asserted.

### Verification

- 575 unit tests; `cases-registry.test.ts` re-pointed at the claim for all
  three content guards it used to read `value` for, plus a new lifecycle guard.
- The 12-case desktop smoke, now over **four** reference viewports, with three
  new assertions folded into the four-row walk: **no foreign face and prose in
  sans**, **four claims that never clip and never fall below 10px**, and **no
  orbit arc that crops through the console's edge**.
- A walk of 4 rows × 3 viewports × 2 themes (36 states, the sheets row per
  sheet): zero clipping, zero truncation of live copy, zero stray arcs, and no
  family outside the house pair anywhere in the DOM.

### Left open

⚠ **The Intelligence Map's SVG still renders in `--font-mono`** — IBM Plex
Mono — while `MONO_ADVANCE` is documented as _"0.68 em — PT Mono's advance"_
and every label placement is computed from it. Either the constant or the font
is wrong. Deliberately deferred (owner): changing the drawing's face moves
every measured label on all three readings and needs its own re-measurement
pass, and the DOM fix above was the visible half of the complaint.

## Update 1 — the underline returns, the notch flips left (2026-08-08, owner)

Owner: _"the notch on the tabs of the right panel should only be on the left
side, not on the right side. The underline should be at the bottom of the tab,
not at the top."_ Two of Decision 3's rulings reverse; the plate model itself
stands.

- **The station's cut is TOP-LEFT now, not top-right.** The 08-06 cut took
  ADR-065's diagonal; the day after, ADR-068 U1 put the console itself on the
  owner's TL+BR override — which left the plates and their housing cut in
  opposite directions. The flip makes them agree, and the directory's folder
  glyph already cuts its leading corner. Mechanically it is the mirrored
  `polygon()`; the seam between plates now starts below the notch for free,
  because the owning station's own clip-path clips its seam pseudo-element's
  top `--stn-ch`.
- **The lit spine underlines the active plate again** (`bottom: -1px`, on the
  rail's border row) — and **the weld is deleted with it**. Decision 3 moved
  the spine to the top because the weld `::after` and a lit rule would have
  fought for that pixel; the owner's underline resolves the conflict the other
  way, by deletion. The active plate now reads as the selected key over a lit
  sill rather than a surface merged with the body. The spine's chamfer clip
  (`inset(0 var(--stn-ch) 0 0)`) went with the move: the bottom edge is
  square, so there is nothing to stop short of.
- **Verification:** measured live at 1440×800 on the four-station tools rail
  and the three-station map rail, dark and light — cut resolves TL
  (`polygon(9.67px 0 …)`), spine bottom flush with the rail's border box,
  active `::after` computes `none`, and the underline travels with a station
  click. The smoke's rail assertions (one spine per rail, label = function
  alone, diamond visible at `data-n="4"`) never pinned the spine's edge or the
  cut's corner, so they hold unchanged.

## Update 2 — the cut is the leading plate's alone (2026-08-12, owner)

Owner: _"fix the notch in the top left corner of the configuration and
substrate tabs; ONLY the work tab should have that."_

Decision 3 stated the cut over **each** station, and Update 1 flipped its
direction without revisiting that scope. Both were half right, and the
arithmetic says which half.

⚠ **WORK's notch does not exist.** The console's TL chamfer removes every
point where `x + y < --con-ch`; a station's removes `x + y < --stn-ch + 2`.
With `--con-ch` at 15.9 / 17.9 / 22px against `--stn-ch` at 8.6 / 9.6 / 11px
(1280×720 / 1440×800 / 1920×1080), the leading plate's cut is **subsumed by
≥ 8px at every rung of both clamps** — it paints nothing. What the owner reads
as WORK's notch is the housing's own, and the rule that produced it was
delivering exactly one visible thing: a 9–11px diagonal on each of the other
plates, 185–581px along the rail, where no edge explains it.

So the scope follows the geometry: **`clip-path` moves to
`.fl-con__stn:first-of-type`, and every trailing plate is square.** The
leading plate keeps the cut it shares with the housing. ADR-065 Update 3
records the corresponding clause in the law; nothing about the plate model,
the recessed ground, the lit spine or the diamond changes.

- ⚠ **THE SEAM'S SHOULDER IS DECLARED NOW.** Update 1 got it for free — a
  clip-path clips pseudo-elements, so the owning station's cut trimmed the top
  `--stn-ch` of its own `::before` divider. Square plates end that, so
  `.fl-con__stn + .fl-con__stn::before` carries `top: var(--stn-ch)`
  explicitly. Identical pixels; the read it protects (a row of seated keys,
  not a divided bar) was never the notch's doing.
- **This reaches every rail**, not just the map's three readings: the tools'
  four, the films' two, the Studio sheets' three, and both labs. One strip,
  one grammar (ADR-066) — a per-plate exception in shared chrome is the thing
  that rule exists to prevent.
- ⚠ **AND IT IS PINNED NOW, IN BOTH DIRECTIONS.** Update 1 closed by noting
  the smoke _"never pinned … the cut's corner, so they hold unchanged"_ — which
  is why a universal cut could ship, flip direction, and go unremarked for four
  days. The rail sweep asserts the leading plate keeps a polygon, every
  trailing plate computes `none`, and the seam's top inset is non-zero. A
  one-sided assertion would not have caught this: the defect was extra notches,
  not a missing one.
- Below 980px / under `prefers-reduced-motion` the console drops its own
  `clip-path` while the stations never did — a pre-existing artifact, now
  narrowed to the single leading plate rather than every wrapped one. Named,
  not chased.

## Update 3 — the directory joins the ladder it was measured against (2026-08-24, owner)

Owner, on the live casefile: the directory rows are _"a bit too small, which
makes it difficult for people to understand, like, hey, these are other
projects."_ The complaint is about the LOWER-LEFT band, and the measurement
says it is a hierarchy defect rather than a size preference.

**Every neighbour in that column is a width-keyed clamp, and the directory was
a flat pixel value.** Measured across the reference viewports: the brief's
body runs 13.5 → 16.2px and the register's claims and sentences
`clamp(11.5px, 0.92vw, 13px)` → 11.78 → 13px, while the rows sat at a flat
11.5px and the head and meta at a flat 9.5px. So the wider the viewport, the
smaller the navigation read RELATIVE to the copy explaining it — and at 1920 a
register SENTENCE (13px) outranked the project identity it supports, on the
one interactive layer in the column.

⚠ **THE RANK IS SUPERSEDED BY
[ADR-088](088-casefile-left-column-ladder-and-rhythm.md) (2026-09-02); THE
REASON BELOW IS WHAT SUPERSEDED IT.** The row and the claim are PEERS on one
mono step now — the sentence they both outrank is SANS and sits a full ratio
step under both, so "an identity may not read smaller than a sentence about it"
is satisfied without the extra mono rung. Two mono-caps runs a ratio apart in
one narrow column is what the owner later read as "not balanced", and by then
ADR-084's `--lc` arm had carried the row to 16.5px at his own viewport. The
SIZE rule below (a width-keyed clamp, never a flat literal), the `1.15`
leading, the `.05em` tracking and the head's `.42` alpha all stand.

The rows are on the siblings' own clamp now, one step ABOVE the claims because
the identity of a project may not read smaller than a sentence about it:
**rows `clamp(13px, 1.02vw, 14px)`, the meta datum `clamp(10.2px, 0.8vw,
11.5px)`, the head `clamp(10px, 0.8vw, 11.5px)`** with its alpha lifted
.30 → .42 (alpha up is more contrast on BOTH grounds — `--dawn-rgb` is the ink
either side of the flip). The head is the line that says these ARE the other
projects; at 9.5px and .30 it was a whisper.

⚠ **THE SIZE IS PAID FOR OUT OF THE LEADING, NEVER OUT OF THE BAND.** At
1280×720 the directory has **4px of slack in a 123px band** and clips silently
(`overflow: hidden`), so there was nowhere for bigger type to go — until the
rows stopped carrying paragraph leading they never needed. `line-height: 1.15`
on a single-line uppercase row with no descender to clear buys ~2.2px a row
against PT Mono's `normal` (~1.32), which is more than the growth costs.
Measured after: row heights are **byte-identical at every reference viewport**
(24 / 26 / 31 / 31px — each still governed by its own `min-height` clamp), the
content height moves 118 → 116 / 122 → 125 / 144 → 146, and 1280×720 ends with
MORE slack than it started with. The rhythm never moves; the type grows into
the pitch that was already there.

⚠ **The tracking takes a step off with the size** (0.06 → 0.05em): letterfit is
optically sized, and it is also what keeps the longest pairing
(`03_AI-FLUENCY-STUDIO/` beside `500 ADS/MO`) clear of the meta column at
1280 — measured 12px of gap on every row at every viewport, zero overflow.

⚠ **`.fl-dir__head`'s own rule AND its scoped `.fl-desig` override both carry
the size.** The shared `.fl-desig` (9.5px / .22em) is the panel path's chrome
and is NOT touched; changing only one of the two leaves the head's label at
9.5px beside an 11.5px count.

The type law's floor in `.claude/rules/proof.md` said directory rows "start at
11px" and its note recorded a 10.5px row that had already been bumped to 11.5
— both are restated against the shipped clamps now. Verified: the ADR-056 U11
box-clipping sweep, the ADR-063 U2 light-palette walk and the CSS sweep all
pass; stills at 1280×720, 1920×1247 (the owner's shape) and 1440×800 light in
`docs/design/casefile-directory/`.

**Left open:** at the owner's 1920×1247 the four rows leave **142px of empty
band** below them before the `--fl-t11` split — the directory group sits high
over a hole (ADR-070 U14's pattern, one surface over). Pre-existing, untouched
by this pass, and a composition question rather than a type one.
