# Reference 02 — The Left & Right Rails (HUD chrome)

> Self-contained spec for reproducing the landing page's side rails in a mock, and the rules a
> new section must follow around them. Source of truth: `components/landing/v7/landing.css`
> (NOT the prototype HTML's inline styles — those are stale) + ADR-031. Extracted 2026-07-18.

The rails are **global fixed chrome**, not per-section furniture. A new section never draws its own
rails — it inherits them, keeps its content inside the rail-aware inset, and may optionally add
(a) one entry to the left-rail journey manifest and (b) one right-rail "register" of its sub-items.

---

## 1. Frame geometry (the numbers that define the whole HUD)

| Token                 | Value                                                | Resolved @1280 / @1440 / @1920 |
| --------------------- | ---------------------------------------------------- | ------------------------------ |
| `--hud-margin`        | `clamp(16px, min(2.8125vw, 5vmin), 54px)`            | 36px / 40.5px / 54px           |
| `--hud-rail-width`    | `clamp(48px, 4.27vw, 82px)`                          | 54.7px / 61.5px / 82px         |
| `--hud-content-inset` | `calc(margin + rail-width + clamp(24px, 3vw, 56px))` | **129px / 145px / 192px**      |
| `--hud-rail-line`     | `rgba(235, 227, 214, 0.55)`                          | rail hairline + ticks color    |
| `--hud-corner-zone`   | `clamp(28px, 4.17vmin, 45px)`                        | corner bracket zone            |

- Wrapper: full-viewport fixed layer (`position: fixed; inset: 0`), z-index 50, pointer-events pass-through.
- Left rail at `left: var(--hud-margin)`, right rail at `right: var(--hud-margin)`, each `width: var(--hud-rail-width)`.
- Rails start below the top corner zone and stop above the bottom one, so **the rail's 50% mark = the viewport midline** (registers anchor there).
- **`--hud-content-inset` is the sacred left/right padding for ALL section content** — nothing editorial ever sits between the rail and the content column.

## 2. Anatomy of a rail

Both rails share:

1. **Guide track** — a vertical hairline, `2px` wide, full rail height, color `rgba(235,227,214,0.55)`. Sits at the rail's inner edge (guide inset `0px`: left rail's track at its left edge, right rail's at its right edge).
2. **13-tick ladder** — ticks at every 8.333% of rail height (0%…100%). Each tick is `2px` tall, extending **outward** from the track: minor ticks `7px` long, major ticks `21px`. Majors sit at 33.33% and 66.67%.
3. **Bearing labels** (LEFT rail only) — the majors carry numerals "2" and "5": PT Mono, `9px`, `rgba(235,227,214,0.5)`, letter-spacing `0.1em`, placed 10px inward of the track.

### Left rail extras — the journey diamond

- A **12×12px gold rhombus** (`#caa554`, diamond clip) riding the track, its center on the 2px hairline. Bloom: `box-shadow 0 0 14px rgba(202,165,84,0.6)` (hover: 20px @ 0.85 + brightness 1.2).
- Its vertical position marks where you are in the page journey (one detent per section, proportional to real scroll distance). Moves in a single 350ms `cubic-bezier(0.16,1,0.3,1)` glide.
- On hover/focus it reveals a **title chip** 18px inward of the track: PT Mono `11px`, uppercase, letter-spacing `0.1em`, gold `#caa554` — the section's name (e.g. "SERVICES").

### Right rail extras — the register (per-section sub-item index)

A "register" lists a section's sub-items on the rail, rows hung off the viewport midline
(`top: calc(50% ± n × 30px)`, pitch token `--rail-register-pitch: 30px`). Recipe:

- Container: PT Mono `11px`, uppercase, letter-spacing `0.16em`, base color `rgba(235,227,214,0.5)`, pointer-events none.
- **Heading** above the rows (e.g. `THE ARC · 03`, `SOURCE BUS · 04`): `9.5px`, letter-spacing `0.2em`, one line, placed 12px inward of the track, at `calc(50% − n·pitch − 26px)`.
- **Row** = marker + index + name, laid out `flex-direction: row-reverse` so the marker sits ON the track and the text reads inward: gap `7px`, height `18px`.
  - Marker: 8×8px box with a 45°-rotated `1px currentColor` outline diamond inside (passive tick — markers never change shape when active).
  - Index: `01`/`02`… in `9px`, `rgba(202,165,84,0.6)`.
  - Name: right-aligned, min-width ~7–9.5ch, row color `rgba(202,165,84,0.7)`.
  - **Active signature = gold underline on the name**: color snaps to `#caa554` and the name gets `text-decoration: underline` (thickness 1px, underline-offset 5px). Never bolding, never marker swaps.
- Marker x: the row's right edge at `calc(track-inset − 3px)` so the 8px marker centers on the 2px hairline.

## 3. Responsive law (rails are desktop instruments)

| Condition                | Behavior                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| ≤1100px wide             | Bearing numerals + left diamond hide; right-rail registers hide                                                        |
| ≤759px tall              | Registers hide (short-viewport gate)                                                                                   |
| `prefers-reduced-motion` | Registers hide; diamond/title transitions removed                                                                      |
| ≤960px wide              | **Entire rails removed.** `--hud-content-inset` collapses to `clamp(24px, 6vw, 40px)`; nav is carried by the hamburger |

Registers mount only at `(min-width: 1101px) and (min-height: 760px)`.

## 4. Drawing rails in a Claude Design mock (desktop frame)

For a 1440×900 artboard: rail hairlines at `x = 40.5px` (left) and `x = 1399.5px` (right, i.e. 40.5
from the right edge), 2px wide, `rgba(235,227,214,0.55)`, running from ~y 120 to ~y 830 (below/above
the corner zones). 13 ticks per rail (7px minor / 21px major, 2px tall) pointing outward; "2" and
"5" numerals on the left majors; the gold diamond somewhere on the left track; content column
starting at `x = 145px` and ending at `x = 1295px`. Corner brackets live in the `--hud-corner-zone`
at each corner (see Reference 01). That's the complete frame a new section must sit inside.

## 5. Rules when adding a NEW section (build handoff)

1. The section keeps all content inside `--hud-content-inset` padding; the rails stay untouched.
2. Add one manifest entry (id, station number label, hover name) to `lib/rail-manifest/entries.ts` in scroll order — the left diamond then handles it automatically. Drift tests pin the order (`tests/lib/rail-manifest.test.ts`).
3. A right-rail register is optional; if used, follow the §2 register recipe exactly (rows off mid-rail at 30px pitch, gold-underline active state, ≥1101×760 gate). Note: the services `SOURCE BUS` register is currently retired; the live register is the Arc's `THE ARC · 03`.
4. Never remove the 13-tick ladder; never attach a scroll-scrubbed writer to the diamond (its position is a pure function of the active-section index); never render React into the manifest root.
