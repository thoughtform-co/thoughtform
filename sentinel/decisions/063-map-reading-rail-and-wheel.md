# ADR-063: The map's reading rail is horizontal, and it owns the wheel

- **Status:** Accepted
- **Date:** 2026-08-06
- **Owner call:** yes (both halves)
- **Supersedes:** ADR-062's depth rail placement. ADR-062's drawing is
  itself superseded in production by the PDA console (shipped 0965318
  without an ADR — see §5).
- **Surface:** `components/landing/home-v2/services/casefile/map/pda/**`
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

The Intelligence Map is the casefile's lead row and its right panel is a
held instrument — a console with an orbit ring behind it, a chamfered
frame, a gold badge in its head, and three readings: **01 THE WORK**,
**02 THE CONFIGURATION**, **03 THE SUBSTRATE**.

Two owner asks, 2026-08-06:

1. The three readings were selected from a rail running vertically down
   the console's left edge, names set in `writing-mode: vertical-rl`. Make
   them horizontal, across the top of the panel.
2. In the casefile's browse band, scroll selects the **directory row**.
   While the pointer is over the map, scroll should select the **reading**
   instead.

## Decision

### 1. The rail is horizontal, seated on the console's top edge

Three equal stations across the full console width, directly under the
head, each carrying its diamond, its ordinal and its name on one line. The
hairline under the rail is the spine, and a **single lit segment travels
along it** to the reading it opened, keyed off `data-view` in CSS.

It is still not a web tab strip. The vocabulary is unchanged — diamond
stations, ordinals, mono caps, a hairline spine — and the moving marker
points down into the field rather than sitting under a selected tab.

### 2. The console owns the wheel, and releases at its ends

A native, non-passive `wheel` listener on the plate. React registers
`wheel` as passive on its root container, so an `onWheel` prop cannot
`preventDefault` — the page would scroll anyway and the reading would
change on top of it.

The decision is `map/pda/pdaWheel.ts`: pure, no DOM, unit-pinned in
`tests/lib/pda-wheel.test.ts` (16 cases). The console keeps its state in a
ref and does exactly two things with the result — `preventDefault()` when
`capture`, change the reading when `next`.

**THE RELEASE IS THE WHOLE SAFETY ARGUMENT.** At the last reading in the
direction of travel the wheel is handed straight back: no capture, no
`preventDefault`, the corridor keeps moving. `#services` is scroll-pinned
across a 3.2-viewport dwell, so a console that kept the wheel would be a
trap on the whole document, not just on itself. Every other constant here
is comfort; that one is the contract, and the smoke asserts it in both
directions at three viewports.

Two gates, both **re-read per event** because both change under a
long-lived listener:

- `SERVICES_SCROLL_OWNED_MEDIA` — the tier in which scroll owns this beat
  at all. Below it the casefile is static flow content with no browse
  channel, and swallowing a wheel event there would break ordinary page
  scrolling over ordinary DOM. The constant moved to
  `unifiedServicesInstrument.ts` so this and `ServicesCasefile`'s row
  scrollspy answer the same question from one string.
- `data-proof-settled` on the stage — while the arrival ladder is still
  travelling the reader is scrolling _into_ the beat, and an instrument
  that grabbed the wheel there would stop them at its threshold.

One step per gesture, not per event: a trackpad fling is hundreds of
events at 1–3px, so a step opens a 470ms lockout (just under the 620ms
scan sweep) during which the wheel stays captured but changes nothing.
Threshold 90px; a reversal or a 180ms pause empties the accumulator.

### 3. What this reverses, and how far

The 2026-07-15 pass **retired a wheel-snap hijack on this same stage** so
that scrubbing over the card ring read as continuous scroll
(`ServicesStage.tsx`). That ruling stands for the ring, and the smoke's
"wheel over the instrument scrolls natively and rotates the ring" case
still passes unchanged. This is narrower by construction: a bounded
instrument with three states that hands the wheel back at both ends.

## Consequences

### The rail's height is the drawing's height, and the drawing is already small

> ⚠ **Superseded by Update 1 on every number below.** The head was deleted to
> pay for the rail, the readings now crop their own viewBoxes and the type was
> re-derived, so the "after" column here is a snapshot of the first cut, not
> of what ships. The _reasoning_ — height is the binding dimension — is what
> carried into U1 and still holds.

The field **binds on HEIGHT at every desktop viewport**. The three
drawings are authored `780×850` **portrait** into a landscape field
(`541×357` at 1280×720), and `preserveAspectRatio="xMidYMid meet"` scales
by the minimum ratio — so ~200px of width letterboxes while every pixel of
height scales the type.

Measured at 1280×720: the rail costs 27px of field height, the meet scale
goes **0.4197 → 0.3892 (−7.3 %)**, and the ~53px of width it returns was
already surplus. That trade is accepted as the price of the owner's ask.

⚠ **The drawing's rendered type is far below the surface's own floor, and
this predates the change.** Measured across all three readings:

| viewport  | before      | after       | chrome floor |
| --------- | ----------- | ----------- | ------------ |
| 1280×720  | 3.15–5.66px | 2.92–5.25px | 8.5px        |
| 1440×800  | —           | 3.33–5.99px | 8.5px        |
| 1920×1080 | —           | 4.76–8.56px | 8.5px        |

No existing guard catches it: the smoke asserts glyph **containment** and
the rail labels' **DOM** font size, neither of which is rendered SVG type
size. **The headroom is in the drawing's ASPECT, not in this strip** — an
authoring space near 1.5:1 would roughly double the meet scale and cost no
height at all. That is a re-authoring job on three drawings and is left
open deliberately rather than folded into this change.

### The active label is ink, not gold — a theme decision

`--pda-hot` (#f0c86a) is the dark end of the gold ramp. ADR-058's flip
turns the console's ground to parchment (#e4dac9) and leaves gold literal,
so gold-as-**text** measures ~1.1:1 there — the active station was
invisible in light mode, as are the foot title and much of the drawing
(pre-existing, and out of scope here).

The active station's label is therefore `--pda-txt` (dawn at 92 %, which
flips to ink) and the lit signal is carried by the **marks**, which is
what gold is for on this surface: the diamond fills, the wash lifts, the
spine segment travels. One rule, correct in both themes, and no
`[data-theme]` override to keep in step. Inactive labels moved
`--pda-txt3` → `--pda-txt2`: the rail is a primary affordance now, not a
column of vertical chrome.

### Verification

- `tests/lib/pda-wheel.test.ts` — 16 cases on the reducer, release first.
- `tests/visual/services-ring-smoke.spec.ts` — the rail is horizontal,
  above the drawing, spans the console, no station name ellipsises, labels
  ≥7.9px; the wheel walks 1→2→3 with the page and the directory row held,
  and releases past the last reading. At 1280×720, 1440×800 and 2017×1269.
- Full suite: `npm run verify` (564 unit tests) + the 12-case desktop
  smoke.
- Both themes shot at 1280/1440/1920 and read by eye.

## Update 1 — the console pays for its own legibility (2026-08-06, owner)

The rail shipped and the owner read the panel back: the drawing's type is too
small, the console repeats itself, and the repetition is where the space is.
Three asks, and they turn out to be one change — **everything removed is
height, and height is the only currency the drawing spends.**

### What was removed, and why it was redundant

| removed                    | already said by                                  |
| -------------------------- | ------------------------------------------------ |
| `◆ INTELLIGENCE MAP` badge | the left column's masthead, `INTELLIGENCE MAP.`  |
| `LOOP EARPLUGS`            | the client tab, the directory path, the casefile |
| `SNAP 08·2026`             | nothing — see the note below                     |
| foot title `01 · THE WORK` | the lit tab two rows up, `01 WORK`               |

⚠ **The snapshot date now appears nowhere on the panel.** It was the one piece
of the head that was not redundant. Removing it was the instruction and it is
carried out; if provenance should stay, the foot row has horizontal room for a
right-aligned mark at no height cost.

The reading's title is not lost for assistive tech — `foot.title` moved to the
drawing's `aria-label`. It is simply not printed twice.

### Where the height went

At 1280×720, measured. The head was 38px + 1px border; the foot's title and
its gap were ~16px. Of that ~55px, the rail took 6 (26px → 32px, which is what
lifted the tabs from 8.55px to the type law's 10px floor) and **the drawing took
the rest**.

### Type, sized from measured slack rather than by eye

The owner asked to grow the type "without making it too big", so every size
below is derived from its box against its longest live string, at PT Mono's
advance plus that label's own tracking, and written down at the site:

- `CART_TYPE` (pdaGlyphs) — the cartridge. Title 9.5 → **11.5**, code
  8.5 → **11**, lane 7.5 → **10**. ⚠ The title's measure is NOT the metadata
  rows': it is anchored to the left wall alone (157 units) while the metadata
  rows are PAIRS pinned to opposite walls sharing 151 between them.
- `T` (PdaViews) — 02's chrome and 03's plate metadata, 26–88 % of measure.
- `Module`'s label derives from its own height (`h * 0.19`). 03's shape
  modules are the ceiling there: "Stakeholder" fills 89 % of the 87 units
  between the divider and the module wall.

### And the crops, which cost nothing at all

`xMidYMid meet` scales by the MINIMUM of the two box ratios, and the field is
landscape while the authoring space is portrait — so the drawing has always
been HEIGHT-bound, and every authored unit of empty vertical margin was a
direct tax on rendered type. Measured against each reading's live `getBBox()`,
the waste was 82 units on 01, **288 on 02** (a third of its box) and 132 on 03.
`VIEW_BOX` crops each reading to what it draws. No authored coordinate moves.

⚠ 02's content runs to x=797, **seventeen units past** the 780 authoring
width, so its crop is 800 wide. A 780 crop clips its right-hand modules and
nothing on screen says so.

### Result, at the binding viewport

| reading | before (ADR-063) | after       | at 1920     |
| ------- | ---------------- | ----------- | ----------- |
| 01      | 3.14–3.97px      | 4.49–5.16px | 7.52–8.65px |
| 02      | 3.35–5.64px      | 6.07–9.91px | 10.2–16.6px |
| 03      | 3.14–4.18px      | 4.46–5.45px | 7.21–8.82px |
| tabs    | 8.55px           | 10.7px      | 11.5px      |
| foot    | 10px             | 12.2px      | 13.5px      |

The chrome now meets the type law (tabs ≥10px, prose ≥12px). **The drawings do
not, and 01 and 03 cannot from here** — see Outstanding.

### The measurement that caught what nothing else did

Growing the type produced two real collisions that every existing guard stayed
green through, because they all asked whether a label was inside the CROP and
none asked whether two labels were inside EACH OTHER:

- a cartridge title at 12 wrapped to a second line, and the two lines
  overlapped by 1.6–1.9 units — and at 1440 the second line ran into the lane
  rail. Fixed by sizing the title so nothing wraps (11.5), not by re-spacing:
  a wrapped two-line title at ~5px is worse than one line at ~5px.
- 02's `DECIDES ALONE` printed through its value. A line box is taller than
  its font size, so v18's 13-unit pitch that worked at 8 is a collision at 10.
  Now 18.

Both are now asserted: `readPda` compares every pair of glyph boxes, at three
viewports × three readings, and the smoke also holds a floor under RENDERED
type (4.3px) rather than under the authored unit.

## Outstanding — 01 and 03 need a density decision, not a tuning one

The arithmetic, so the next person does not re-derive it:

Reading 01 shows 20 cartridges 4-across in a 594×355 field. For a 19-character
title to letter at the surface's 8.5px floor, its cartridge must be ~136px
wide; four of those fit (544 ≤ 594), but the cartridge's own proportions make
it ~108px tall, and **five rows of that is 540px against 355px of field**. The
grid is roughly 1.5× too tall for the box it is in. No crop, viewBox or font
constant closes a 1.5× gap — every one of those levers is now spent.

So the remaining options are all design calls, and they are the owner's:

1. **Flatten the cartridge** — drop the vent hatching and the gauge row so a
   cartridge is a compact record rather than a card. Cheapest in pixels,
   changes the drawing's character most.
2. **Show fewer at once** — 12–15 cartridges with the rest reachable, instead
   of 20 at a glance. Preserves the object, loses "the estate at a glance",
   which is the reading's whole argument.
3. **Give the panel more height** — the casefile's left column sets it today.
4. **Accept ~5px at 1280×720** as a small-laptop degradation, given 01 reaches
   7.5–8.7px at 1920 where the panel is 840×596.

Reading 03 is the same story with a different wall: its shape modules are
already at 89 % of their measure, so its type is capped by the module box.

## Update 2 — gold gets the second token ADR-058 asked for (2026-08-06, owner)

Owner, on the light-mode console: "is there a way of making the yellow a bit
more legible in a brand system best practices kinda way". Measured, the yellow
was the visible half of a whole-palette failure.

### What the audit found

Against the console's parchment ground (#e4dac9), in light:

| token                                | measured | target |
| ------------------------------------ | -------- | ------ |
| `--pda-hot` as text                  | 1.15:1   | 4.5:1  |
| `--pda-amb` as text                  | 1.49:1   | 4.5:1  |
| `--pda-dim` as line                  | 1.24:1   | 3:1    |
| `--pda-hair2` as line                | 1.13:1   | 3:1    |
| `--pda-grn` as text                  | 2.16:1   | 4.5:1  |
| `--pda-grnh` as mark                 | 1.04:1   | 3:1    |
| `--pda-txt3` (80 of 97 labels on 01) | 2.38:1   | 4.5:1  |

The drawing was on screen and unreadable, and **no guard on this surface
looked at colour at all** — the smoke measured glyph geometry and the unit
test measured arithmetic.

### Why it is not a tweak

Two different defects wearing the same symptom:

1. **The literal hues.** Gold and green were chosen to glow on near-black. A
   saturated yellow is inherently HIGH-LUMINANCE — that is the hue, not a
   choice — so on parchment it has almost nowhere to go. No amount of nudging
   #f0c86a makes it carry 4.5:1 on #e4dac9 while still being yellow.
2. **The alphas, which invert their own meaning.** `rgba(ink, .38)` recedes
   toward BLACK in dark and toward PARCHMENT in light. The same number, the
   opposite result: quiet becomes invisible.

### The decision: hue is the brand, lightness is the role

ADR-058 measured a re-darkened `--gold` and rejected it for good reasons — it
fixes text and breaks fills (ink on gold 8.2:1 → 4.7:1), reads olive-drab at
display size, and desynced the DOM from the WebGL golds. It also wrote down
the alternative in as many words: _"If it needs solving, the fix is a SECOND
token for gold-as-text, NOT re-darkening this one."_ This is that token, as a
small ramp:

| role | token            | dark    | light   | target |
| ---- | ---------------- | ------- | ------- | ------ |
| MARK | `--gold`         | #caa554 | #caa554 | —      |
| LINE | `--gold-line`    | #caa554 | #8a6b20 | 3:1    |
| INK  | `--gold-ink`     | #caa554 | #6e5216 | 4.5:1  |
| INK+ | `--gold-ink-lit` | #f0c86a | #5c4411 | 4.5:1  |

All three are byte-equal to shipped values in dark, so **adopting them on a
dark surface is a no-op** — and they are opt-in, so adding them changed
nothing until a surface consumed them. Light steps are measured against
`--surface-1` (#ddd2c0), the darkest light ground and therefore the worst case
for dark type.

⚠ **THE EMPHASIS DIRECTION INVERTS WITH THE GROUND.** On the dark side `-lit`
is BRIGHTER than `--gold-ink`; on parchment it is DARKER. That is not an
inconsistency — "more contrast against this ground" is the invariant, and
which direction that lies in belongs to the ground, not to the brand.

### What the console adopted

`--pda-hot` now reads `var(--gold-ink-lit)` directly, so the lit signal takes
the ramp's lit step in both modes with no override to maintain. The usual
argument for leaving a gold FILL luminous — the ink printed on it carries the
contrast — **does not apply here, because U1 deleted the badge and nothing on
this console prints ink on gold any more.** Its gold marks stand alone, so
they carry their own.

The rest is a per-theme block in theme.css beside ADR-058's others: line work
to the `--gold-line` steps, green to `--atreides-light` (the light green the
token system already carried), and the neutral alphas re-derived for a ground
they now recede INTO — lifted UNEQUALLY so the drawing keeps its hierarchy.

### Result

Every glyph on all three readings clears 4.5:1 (lowest 4.79), and the line
work clears 3:1 (3.02 / 3.61). Only the two decorative frame hairlines sit
below the component target, deliberately and documented. Dark is unchanged:
the lit gold still resolves to `rgb(240, 200, 106)`.

One deliberate dark-side change: `WHO OWNS IT` was reaching for `--pda-amb` —
a LINE token — to paint text, which is the exact confusion the split fixes. It
now takes `--pda-ink` and goes 5.58:1 → 8.8:1.

**Guarded** by a new light-theme smoke case that composites every alpha before
measuring, walks all three readings, and asserts 4.5:1 on glyphs and 3:1 on
line work.

⚠ **Still open, and now measured:** `--pda-txt3` is 2.93:1 in DARK — the same
80 labels. It is left alone because that hierarchy is what the owner has been
reviewing and approving on the dark surface; lifting the alpha to ~0.52 would
put it at ~4.6:1. Owner's call. The other sites ADR-058 named as gold-as-text
regressions (`4 ITEMS`, `IN BUILD`, `ON RECORD`, the contact email) are still
on `--gold` at 1.8:1 — the ramp now exists for them, but adopting it there is
a sweep with its own verification pass, not part of this change.

## Notes

### 5. ADR-062 is stale on the drawing

Commit 0965318 replaced ADR-062's isometric city with this PDA console in
the casefile's right panel and shipped **without an ADR**. ADR-062's
placement, evidence semantics and confidentiality envelope still bind;
its atom, its three sheets, its crops and its EXPAND overlay describe
`map/MapSurface.tsx`, which is still on disk and still passes its
projection test, but is **not what the landing renders**. Writing that
supersession up properly is an open follow-up — this ADR only claims the
rail and the wheel.
