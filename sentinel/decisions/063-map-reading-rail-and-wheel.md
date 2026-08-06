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
