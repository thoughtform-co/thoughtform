# ADR-085: Proof design pass — the ledger + hero, one modular scale, and the studio's two pictures

**Date:** 2026-08-28 (U1 same day; U2 2026-08-29)
**Status:** Accepted — **but reading 01's LEDGER + HERO is REVERSED in U2**
(the 4×5 cartridge grid is the live drawing again, owner 2026-08-29). The
type ladder, the studio's pictures, the directory air and the light
`--pda-amb` all stand. `MAP_BACKPLANE` was flipped OFF in U1 — the carrier
is the live reading 03; the Backplane drawing remains on disk unreferenced.
**Surfaces:** `components/landing/home-v2/services/casefile/**`,
`components/landing/home-v2/services/casefile/map/pda/**`, `lib/cases/**`,
`app/layout.tsx` (U2)
**Supersedes:** ~~ADR-069 U1 on reading 01's cartridge grid~~ — **withdrawn
in U2.** ADR-069 U1 stands again in full: reading 01 is the grid of twenty
cartridges and the flight's source is the CLICKED card's own slot. Pass
ONE's Backplane direction was reversed in U1 — the carrier's ADR-070
U34/U36 shape is the live drawing again.
**Related:** ADR-056, ADR-058, ADR-063 U2, ADR-064, ADR-065, ADR-066, ADR-067,
ADR-068, ADR-070, ADR-071, ADR-083, ADR-048 (`--fl-copy` factor law)

## Context

Three complaints landed on the same day (owner, 2026-08-28):

1. **The proof section could breathe more.** "The spacing above the directory,
   I think it can be a bit more." The tall-desktop `--fl-directory-gap` was
   pinned at 7 pixels — a value chosen when the register box was fighting for
   its own four rows to fit; it read as no gap at all.

2. **The chrome type ran through five flat rungs with no ladder.** 8.5 · 9 ·
   9.5 · 10 · 10.5 · 11.5 · 12–15, each declared independently as a literal
   font-size. The smallest three were floor-only and never grew with the
   viewport, so at 1920 the register's supporting sentences (13px) outranked
   the tab strip's client identity (12px). The PDA's list fallback was on
   `--font-mono` (IBM Plex Mono) instead of the surface's `--fl-mono` (PT
   Mono) — a third-family LEAK that ADR-067 had already flagged in comments
   but not fixed on this surface.

3. **The map's reading 01 was too clustered.** Twenty small cartridges in a
   4×5 grid lettered at ~5–8px effective at 1280×720, which ADR-063
   §Outstanding had recorded as the standing density defect after multiple
   elastic-crop passes could not reach it (the type is a ratio of the drawing
   to the crop; there was no lever left).

4. **The map's reading 03 read like a pie chart.** The dodecagonal carrier
   was a beautiful drawing but a radial one, and reading 02 is a rectilinear
   PCB. The two readings answered the same question in different languages,
   which is what made reading 03 "feel completely out of place beside the
   two settled readings."

5. **The mobile ADR-083 instrument shipped functional but flat.** The seat
   was a borderless block, the mode switch and case rail used ad-hoc font
   sizes, and the current-stop indicator carried a diamond only below.

## Decision

Five surgical changes, one visible per complaint.

### 1. The left column breathes at the tall rung

`--fl-directory-gap` lifts from `clamp(7, 0.9svh, 11)` → `clamp(8, 1.1svh,
16)` at the compact rung and from a pinned 7px → **18px** at the tall rung
(`min-width: 1200px and min-height: 1070px`). `--fl-proof-top-gap` follows
in step (compact `clamp(10, 1.4svh, 16)`, tall **14px**). To fund the extra
air the register's own upper ceiling drops 300 → **282px** on the tall rung
and 144 → **132px** on the compact rung — the closed height budget between
the seam and t11 stays honest. At 1920×1080 the directory band still keeps
137px over its 144px floor; at 1280×720 the register+gaps budget is
neutral-or-better (measured 102 → 99.5px used, directory band 168 → 170px).

### 2. One type ladder for the chrome

Three tokens on `.fl-case`, biased up so the 8.5-house floor never
approaches the earlier ~7px effective minimum:

```css
--fl-chrome-sm: clamp(10px, 0.75vw, 11px); /* designations, ordinals, archive tags */
--fl-chrome-md: clamp(11px, 0.85vw, 12px); /* directory / panel heads, small labels */
--fl-chrome-lg: clamp(13px, 1.05vw, 15px); /* client identity on the tab strip */
```

The row identity, meta and register claim keep the `--lc` ladder above —
that ladder is CONTENT and this one is CHROME; they intentionally do not
merge. ⚠ **REVERSED BY [ADR-088](088-casefile-left-column-ladder-and-rhythm.md)
(2026-09-02): the split is by FACE, not by content-vs-chrome.** The row, the
claim and the meta are all MONO and ride this scale now; only the sentence and
the brief stay on the sans ladder. Content-vs-chrome put two mono-caps runs a
ratio step apart in one narrow column, which is what the owner read as
"disconnected". Every hard-coded chrome font-size on the tab strip, the directory
head, and the shared `.fl-desig` swaps to the appropriate token.

⚠ **THE `--font-mono` LEAK IS FIXED WHERE IT WAS LIVE.** `.fl-pda__svg
text` (which every SVG label across all three readings inherits) and the
PDA list fallback both switch to `var(--fl-mono, monospace)`. The 12
legacy `.fl-imap__*` occurrences stay untouched — that city map does not
render on the landing, so the leak is invisible there.

### 3. Reading 01 becomes a LEDGER + HERO

The 4×5 grid is replaced with a landscape composition: a LEDGER on the
left (20 workstream rows grouped by district) and a HERO on the right
(the shared `Cartridge` glyph at `HERO_K = 1.85`). The hero is the
persistent object's home on this reading now — the same cartridge that
flies into the seat, at a slightly greater scale so the flight reads as
a settling dock (`dk ≈ CORE_K / HERO_K ≈ 0.919`, measured).

The reader hovers a row to preview it in the hero; the click opens
configuration. The flight originates from the hero's rect (invariant of
which row was clicked), so the reading-02 seat card slides IN from a
predictable position rather than from twenty different grid slots.

⚠ **`gridRect(i, layout)` STAYS AS A COMPAT ALIAS** for `heroRect(layout)`
— every `i` resolves to the same rect, so the existing per-slot
iteration in `pda-flight.test.ts` and `pda-card.test.ts` remains green
by construction. New code prefers `heroRect(layout)`.

⚠ **`HERO_K` IS EXPORTED** and pinned in `pda-card.test.ts` — the
silhouette rule (both homes are `CARD_BOX × k`, one uniform `dk` carries
the object) still walks the two homes, and the "cartridge flies in
smaller" assertion inverts to "the flight is bounded in either
direction" (the hero is larger than the seat, so the flight shrinks).

⚠ **`WORK_FIT.maxH` REACHES 900** so portrait fields can extend the
crop's height into margin around the fixed block. At 1280×1440 the
dead-panel measure comes in at ~299px against `wasStatic × 0.55 = 377` —
inside the elastic contract's tolerance.

### 4. Reading 03 becomes the BACKPLANE (behind `MAP_BACKPLANE`)

A new production component `ViewBackplane` (`PdaBackplane.tsx`) renders
five substrate BAYS around the selected work's central card, in the same
R4 handoff module positions reading 02 uses. Ribbons connect the card
to bays the selected work `taps`; untapped bays stay dim with a dashed
ribbon. Each bay letters its shape name, count, and up to three
representative skills with a green accent on the flagship (per
`CaseSkillEntry.flagship`).

The claim is continuity with reading 02: same card, same silhouette,
same crop width, same ribbon language. Reading 03 becomes the supply
side of the same machine.

⚠ **BEHIND A FLAG** (`MAP_BACKPLANE`, `unifiedServicesInstrument.ts`).
The carrier stays on disk with its ADR-071 skill-chip morph intact. When
the flag is on:

- The map's reading 03 renders `ViewBackplane` at `BACKPLANE_VIEWBOX`.
- The 2↔3 skill-chip morph reduces to bloom entry (`skillRectFor(3,
...)` returns null) — the ADR-071 arc-morph has no home on the
  Backplane. Wiring a proper bay-plate landing is a straightforward
  `pdaFlight` call once the direction is approved; see the file's
  header comment for the follow-up shape.
- The services-ring smoke's carrier-specific arc-and-cell contrast walk
  gates on `drawn.arcTexts > 0` — it runs on the carrier path and
  skips cleanly on the Backplane path.

### 5. Mobile polish (ADR-083 IA is untouched)

Corner brackets at TR + BL on every mobile seat (`.fl-brief`,
`.fl-proof-register`, `.fl-panel`) — 12-unit gold L-hairlines that
register the seat as an INSTRUMENT without closing it as a full frame
(ADR-065's bracket-not-frame law). Hover states on the mode switch and
case rail buttons. A small hairline TICK above the current case-rail
stop (paired with the existing diamond below) brackets the current
position from both ends.

⚠ **NO ADDED HEIGHT.** An earlier pass added `border-top: 1px` +
`border-bottom: 1px` to the seat and a `font-weight: 700` lift to the
active rail stop; the combination pushed the 320×568 `.fl-case` height
0.45px over the smoke's `whole Proof instrument` assertion. The
borders are deleted (the corner brackets alone carry the framing), the
weight lift is dropped (gold color + tick + diamond carry the current
stop at three registers), and mobile head/meta fonts stay at their
pre-pass literal sizes (10 / 9.5px) because the `--fl-chrome-*` tokens
scale UP with viewport and would grow the case at short-tall phones.

## Consequences

- **Reading 01's type doubles in effective size** (~7px → ~13.5px at
  1280×720 dark on the hero title, `EVERYDAY TIER` at 5.26:1 in light).
  Twenty cartridges become twenty rows + one hero — the estate stays
  visible at a glance, but the SELECTION reads at reading size and the
  visual density drops accordingly.
- **The Backplane is behind a flag.** The carrier is not deleted; the
  ADR-071 skill morph is not rewired; the substrate-lab-fit guard on the
  carrier still runs. Flipping the flag off restores the prior surface
  byte-identical. Once the owner approves the direction on a review
  session:
  - Wire the ADR-071 morph to a bay-plate rectangle (rect-to-rect,
    `pdaFlight` handles it natively; needs a `skillRectFor(3, id)` that
    resolves to the bay/plate for the given skill).
  - Delete the carrier and its lab entry (`VariantCarrier` re-exports
    production, so the lab entry goes with it) and the substrate-lab-fit
    carrier probes.
  - Remove the `MAP_BACKPLANE ? … : …` branches in `PdaConsole` and the
    `drawn.arcTexts > 0` gate in the services-ring smoke.
- **Chrome consistency is tokenised.** Any future chrome edit moves the
  token, not the site. The 12 legacy `.fl-imap__*` `--font-mono`
  occurrences are known technical debt on the stale city map; they do
  not render on the landing and will go with `MapSurface` when its
  content model is fully migrated.
- **The mobile polish is minimal by design.** The ADR-083 IA is
  correct; this pass only sharpens its visual quality. It does not
  change the seat's mode switch, the case-rail stop count, or the
  invariant seat height that ADR-083's verification matrix pins.
- **Two pre-existing smoke failures remain on main, unrelated to this
  pass:** the `ambient hold survives the pinned #about stage` test
  (unrelated to the map — about-stage/voidwalker subsystem), and the
  `light: the map console's palette carries its contrast` test's
  reading-02 CREATIVE LEAD label at 2.16:1 (uses `--pda-grn-ink`, a
  pre-existing carrier concern this pass did not touch). Both were
  failing on `main` before this pass; both are reported to the owner
  for a separate decision.

## Update 1 — pass two: one modular scale, the Rolodex, back to the carrier (2026-08-28 U2)

Owner, same day, after living with pass one: "the sizes and font
consistency… what is the relation? Right now, it feels a bit
discombobulated." Plus four surgical asks — more air between directory
rows, a stacked Rolodex behind the hero, restore the pie chart on
reading 03, and land the studio's two policy pictures on THE LINE.

### What changed

1. **One modular scale for the CSS.** `.fl-case` now declares one root
   and one ratio; every chrome role is a named step:

   ```css
   --fl-ratio: 1.2;
   --fl-t0: clamp(11px, min(0.86vw, 1.11svh), 12px);
   --fl-chrome-sm: max(10px, calc(var(--fl-t0) / var(--fl-ratio)));
   --fl-chrome-md: var(--fl-t0);
   --fl-chrome-lg: calc(var(--fl-t0) * var(--fl-ratio));
   --fl-display: clamp(18px, 1.66vw, 24px);
   ```

   The clamp is solved to preserve the shipped `chrome-md` values at
   both reference viewports (11px @1280, 12px @1920). ⚠ `--lc` IS DELETED
   (ADR-088) — there is ONE content ladder now, `--fl-copy`, and the
   register's sentence derives from it by the ratio; the three MONO roles
   `--lc` used to carry ride the chrome steps above. `--lc` and
   `--fl-copy` sit on the scale as content step 0 and step +1 by intent
   — they are solved against measured wrap thresholds and cannot be
   re-derived (ADR-048's factor on `--band-copy` for the brief). The
   SVG map consoles keep their own ladder — their authored integers are
   multiplied by `meet` at render, so they physically cannot share px
   rungs with CSS (documented boundary).

   ⚠ **`--sh` IS RETIRED.** The fourth ladder scoped to `.fl-plate--sheets`
   produced `.fl-cmp__name` at 33.7px @1920 — bigger than the project
   title's 24px. Two independent display clamps on one surface let the
   sheet's category NAME outrank the project NAME. `.fl-cmp__name` now
   rides `--fl-display` (the same clamp `.fl-brief__title` uses) and
   the sheet's chrome/prose take the surface tokens directly. The
   height-elasticity `--sh` bought back on tall panels is spent by the
   IMAGE the LINE sheet now carries in its middle row (see §4).

   ⚠ **EIGHT FLAT ORPHANS MAPPED ONTO THE LADDER.** `.fl-brief__class`
   (9.5px → `chrome-sm`, the "GENERATIVE PRODUCTION · ATL / CTV ·
   SHIPPED" label the owner named), `.fl-filmmeta__label` (10.5 →
   `chrome-md`), `.fl-filmmeta__spec` (9.5 → `chrome-sm`), the three
   `.fl-filmprod__*` rungs (all → chrome-md/sm), `.fl-cap__t`
   (12 flat → `max(12, chrome-md)` floor preserved), and `.fl-bay__top`
   (9 → `max(8.5, chrome-sm)`). `.fl-wire__lbl` stays on `cqw` — the
   wireframes have their own container-query scaling and the token
   would break their proportional composition — but its floor lifts
   8.6 → 8.5 to match the house floor.

   ⚠ **FALLBACKS ON EVERY VAR IN THE COMPARE COLUMN.** `SheetsPlate` has
   TWO homes — `.fl-case` (declares all tokens) and `.arc-sheets` on
   the portfolio arc (declares `--fl-copy` only). Every `var(--fl-*)` in
   the compare CSS carries a fallback matching the token's clamp on
   `.fl-case`, so the arc gets one coherent scale for free without
   having to re-declare the tokens in `arcs.css`.

2. **Directory air, honestly funded.** `.fl-row` min-height 24→26 and
   padding 3-7 → 4-8 (+4px per row at 1280×720). `--fl-directory-gap`
   floor lifts 8→12. Funded by dropping `--fl-proof-h` 72-132 → 70-128
   (compact rung; the tall rung was already re-cut in pass one). Traced
   at 1280×720: register+gaps 99.5 → 98px, directory band 170 → 172px,
   directory content need 156px → 14px of honest slack. First cut was
   too generous (min-height 28, padding 5) and overflowed the band by
   7px — measured, then trimmed.

3. **Reading 01: ledger inward and up, hero toward centre, and the
   Rolodex.** `LEDGER_X` 16→34 (18 units inboard), `LEDGER_Y0` 60→48
   (12 units up toward the header rule at y=42), `LEDGER_H` 560→572
   (bottom stays at y=620). `HERO_X` 438.4→400 (right-anchored flush
   → 54 units off the ledger's right edge, 38 units of crop right for
   the ghost stack). Derived type floors on the ledger row lift 7.5→8.5
   (code), 9→10 (title), 7→8 (lane).

   **The Rolodex** is two static ghost SILHOUETTES rendered as SIBLINGS
   before the hero group, offset (+8,+6) and (+16,+12) behind it with
   the housing chamfer at `HERO_K`. They are `<path>` elements, never
   `Cartridge` instances — a production glyph carries three declared
   strings, and a reading that mounts one inherits invisible labels.
   They fade in with the reading and stay put on preview change.

   The hero itself takes a new `fl-pda-roll` entry animation on every
   MOUNT — translate `translateX(-4px) rotate(-3deg) scale(0.96)` to
   rest, 450ms ease-out. A `key={heroKey}` on the hero group causes
   remount on `previewId` change, restarting the animation on every
   hover/selection change. During a flight or bloom, `heroKey` pins
   to a stable string so the docked group is not disturbed mid-flight
   — dock is a VIEW-change animation, roll is a same-view content
   swap, and they never co-occur. Both `fl-pda-roll` and
   `.fl-pda-rolodex` are added to the `prefers-reduced-motion` reset.

4. **Reading 03: `MAP_BACKPLANE = false`.** The compound carrier
   (ADR-070 U33) with its ADR-071 skill-chip morph is the live drawing
   again — owner: "restore the old pie chart. I think that was the
   clearest one." `PdaBackplane.tsx` remains on disk unreferenced,
   pending a decision on whether to delete or keep for future
   comparison. The smoke's `arcTexts > 0` gate goes back to
   unconditional carrier assertions.

5. **The studio's two pictures land on THE LINE.** `image9.png`
   (444×484, AI SUITABLE / Illustrative) and `image10.png` (444×444,
   REAL PHOTOGRAPHY / Representative) extracted from slide 9 of
   `ai-in-studio-final.pptx`, converted to WebP q82 via ffmpeg, shipped
   as `public/arcs/studio-line/{illustrative,representative}.webp`.
   `CaseCompareColumn` gains an optional `image?: CaseImage` field.
   `SheetsPlate` renders each column's image in a middle wrapper
   (`.fl-cmp__middle`) — a 1:1 box with `object-fit: cover` — above
   the read block. Both columns carry an image (a table pretending to
   be a comparison would be a compare sheet with an image on ONE side).
   Deck-resolution ceiling: 444px native in a ~280px column is ~1.6× DPR.

6. **Light-theme `--pda-amb` re-derived.** ADR-063 U2's audit table
   promised 3:1 line work in light, but `--pda-amb` was declared as a
   LITERAL `rgba(var(--gold-rgb), 0.78)` — the flip left it at 1.49:1
   against parchment. This block was surfaced when the ledger's text
   moved off `--pda-txt3` onto `--pda-txt2` in pass one (which fixed
   view 1's text worst-ratio; view 1 then failed at the line-token
   probe instead). `html[data-theme="light"] .fl-pda { --pda-amb:
rgba(138, 107, 32, 0.88); }` routes the map's amber through the same
   line-work step `--con-dim` already takes. Verified at 3.02:1.

### Result

- **Unit tests:** 1202/1202 pass. Lint clean, typecheck clean.
- **Services-ring smoke (desktop):** 10 pass, 2 pre-existing failures
  (the `#about` ambient hold and reading-02 `CREATIVE LEAD` light
  contrast — both reported in pass one, both still on main).
- **Services-ring smoke (mobile/tablet):** 3 pass (proof-casefile
  holds, plate accordion untouched, phones retune bounded).
- **Arc portfolio smoke:** 13 pass (one transient Turbopack timeout
  cleared on retry).

The four ladders are one now. The category NAME on the LINE sheet is
21.25 → 24px (matches the project title) instead of 22.4 → 33.7px
(bigger than the project title). The ledger row grows 4px taller at
the binding preset, with 3px more between rows and 4px more above the
directory. The Rolodex prints two silhouettes behind the hero and the
hero rotates in from a slight lean on every hover. Reading 03 is the
pie chart again. THE LINE sheet's two columns letter their claims
under the two pictures they came from.

⚠ **`--sh` retirement note:** the height-elastic story `--sh`
carried is legitimately gone. Tall desktops (1920×1247+) that were
using the svh axis to lift `.fl-cmp__name` past 20px will now see the
name capped at the surface's display size. The tradeoff is one visible
tier fewer of type on the surface; the IMAGES fill the slack.

---

## Update 2 — the grid comes back, and the hub speaks (2026-08-29, owner)

Two rulings on the map, one day after the pass shipped.

### 1. Reading 01 is the cartridge grid again — and the supersede is withdrawn

> _"For the intelligence map, I want to go back to the previous version of
> the work tab, where we have all the different work streams together."_

The LEDGER + HERO answered a real defect — twenty cartridges letter at
~5–7px effective at 1280×720, the density gap ADR-063 §Outstanding has
carried for weeks — and it answered it by **showing nineteen fewer
cartridges**. Twenty rows of legible text beside one large card is a
different claim from the one this reading makes: the work tab's subject is
the ESTATE, and an estate you read one card at a time is a list with a
preview pane. The grid says _this is how much there is_ in the only way a
drawing can, which is by drawing all of it.

Restored verbatim from `2ffa2038^`: `PdaViews.tsx` (4×5, crop 780×792,
elasticity into the gutters capped 56/62, cartridges at k = 1),
`PdaConsole`'s view-1 branch, and the two test files' pins. Deleted:
`HERO_K`, `heroRect`, the `gridRect` compat alias, `totalWorks`,
`.fl-pda-roll` + `@keyframes flPdaRoll`, `.fl-pda-rolodex`.

⚠ **NO FLAG.** ADR-070 U35's ruling on the SECTION/carrier pair applies —
a flag is a comparison lever, and once the owner has read both live the
losing drawing and its guards go. Git history is the archive.

⚠ **THE FLIGHT'S DIRECTION ASSERTION CAME BACK WITH IT.** `pda-flight`'s
_"the core grows into the field, so the cartridge flies in SMALLER"_ had
been widened to `0.3 < dk < 3` because `HERO_K = 1.85` inverted the
direction against the seat's `CORE_K = 1.7`. **A bound that admits either
direction cannot catch the sign error it was written for** — it is
`dk < 1` again.

⚠ **AND THE ALIAS IS WHY NOTHING FAILED.** `gridRect(_i, layout)` returned
`heroRect(layout)` for every `i`, so `pda-flight`'s eleven per-slot loops
walked twenty slots that were all the same rect and stayed green — a suite
that had stopped asking its own question while reporting that it passed.
The same shape as ADR-069 U1's finding (a per-object guard cannot see a
defect that lives in the relationship), one level down: **a compatibility
alias keeps the call sites compiling and quietly empties what they test.**

### 2. The hub letters in IBM Plex Sans

> _"In the substrate tab at the center, it feels like a mono type, but we
> need something else… the IBM Sans that we use."_

The carrier's three centre readouts — the resting brief, a pinned
substrate's `meaning`, a pinned Skill's card — are the one place this
drawing writes PROSE rather than labels. ADR-085 pass one had just fixed
the `--font-mono` leak that put ~200 SVG labels in IBM Plex Mono, which
made the whole map one mono for the first time and made the hub's sentence
look like a label. `.fl-pda-hub-copy` on `Aperture`'s group takes IBM Plex
Sans; **everything else on all three readings stays PT Mono.**

⚠ **IBM PLEX SANS WAS ALREADY LOADED ON EVERY ROUTE AND USED NOWHERE.**
`app/layout.tsx` has instantiated it since the retired design system;
`--font-ibm-plex` was referenced by no rule in the app. So the owner's
"the IBM Sans that we use" named a font the site downloads and never
draws — this pass gives it its one consumer, and cuts the weights to the
hub's own two: **400 and 700**, replacing 300/400/500. The hub's pinned
titles have always asked for `fontWeight={700}`, which that instance did
not load — they were synthesised, and every advance measured off them
would have been a fiction.

⚠ **THE FIT ARITHMETIC IS A SEPARATE MODEL NOW, MEASURED.**
`adv(fs, track) = fs × (0.6 + track)` is PT Mono's fixed cell and is exact
for every other label here; against a proportional face it is a guard
measuring a model of the drawing rather than the drawing — ADR-070 U34's
own finding. `hubAdv()` carries IBM Plex Sans's worst-case advances,
measured in the browser that renders them (`document.fonts.ready`, real
`getComputedTextLength`) over the drawing's ACTUAL copy: the brief and all
five `meaning`s wrapped at their budgets, every shape name, and the
record's longest Skill `short`s.

⚠ **THE TWO RUNGS MOVE IN OPPOSITE DIRECTIONS, which is why one constant
would not do:**

| rung                  | mono model | Plex measured      | worst string               |
| --------------------- | ---------- | ------------------ | -------------------------- |
| body 13 / .02em / 400 | 0.62 em    | **0.5385** (−13 %) | "What good means when the" |
| caps 17 / .04em / 700 | 0.64 em    | **0.7154** (+12 %) | "JUDGMENT"                 |
| meta 12 / .08em / 400 | 0.68 em    | 0.5682 (−16 %)     | "People · Encoded"         |

Plex's lowercase prose is narrower than the mono cell, so every body
budget gains slack for free — while its BOLD CAPS are wider, so the pinned
title is the one string that got tighter, and it is exactly the string the
`wall > 16` guard measures. **A single averaged constant would have hidden
that under the body's surplus.** Stored as `HUB_ADV_BODY` 0.53 /
`HUB_ADV_CAPS` 0.69 (tracking removed, headroom over the measurements).

⚠ **THE BUDGETS DID NOT MOVE, DELIBERATELY.** `BRIEF_PER` 30 could go to
34 on the narrower face. It stays: the extra characters buy nothing, the
shorter measure sits further inside the chamfered chord, and re-wrapping
settled copy to fill a new budget is how a line count changes under a
guard that only checks the words all survived. The slack is banked.

Measured clearances after the change — `carrierBriefFits` **43.3** against
its `> 24`, the five shapes **43.6 – 52.9**, `carrierPinnedFits` **55.2**
against its `> 16` (worst "VSME Reporting"). The wider caps are absorbed
because the block's HEIGHT dominates `boxClearance` at the 30° normal.

⚠ **AND THE SVG'S FAMILIES ARE PINNED FOR THE FIRST TIME.** The smoke's
type sweep skips SVG by design (`the map's SVG is its own pass`), which is
how this surface shipped a wrong face twice — the Plex Mono leak, and the
missing 700. `readPda` now returns `hubFonts` and `labelFonts` and the
reading-03 gate asserts **both**: the hub matches `/IBM Plex Sans/`, every
other label matches `/PT Mono/`. Asserting only the hub would let the mono
half rot exactly as it did before.

### Result

`npx vitest run` on the five affected suites: **382 pass**. Typecheck
clean. Captured headed at 1920×1247 in both themes: reading 01 draws all
twenty cartridges with the three person-led streams dashed and unlit; the
hub's brief sets in a proportional sans inside a ring of mono cell labels,
in dark and in light.
