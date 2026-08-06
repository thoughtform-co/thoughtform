# ADR-064: The casefile's plates share one console frame

- **Status:** Accepted
- **Date:** 2026-08-06
- **Owner call:** yes
- **Surface:** `components/landing/home-v2/services/casefile/console/**`, and
  the four evidence plates
- **Builds on:** [ADR-063](063-map-reading-rail-and-wheel.md) (the console the
  frame is lifted from), [ADR-056](056-services-proof-casefile.md) (the
  casefile, U5's natural-colour ruling, U9's tools redesign),
  [ADR-058](058-light-mode-theme.md) (the gold-as-text regression this
  finishes paying off)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

ADR-063 gave the Intelligence Map a held-instrument console. That made the
casefile's right panel incoherent: one row was an instrument and the other
three were boxes.

| row                     | kind               | before                                            |
| ----------------------- | ------------------ | ------------------------------------------------- |
| `01_INTELLIGENCE-MAP/`  | `intelligence-map` | orbit ring, chamfered bezel, scanlines            |
| `02_AI-FLUENCY-STUDIO/` | `stills`           | 3 ad tiles, **no chrome at all**, doubled padding |
| `03_AI-ABOVE-THE-LINE/` | `films`            | 2-tab rail + poster, own glass surface            |
| `04_SOFTWARE-FOR-FEW/`  | `tools`            | 4-tab rail + 50/50 grid, shot to the box edge     |

Owner, 2026-08-06: make the console the standard and apply it to the other
three — and _"add a filter like in services so everything feels uniform"_.

## Decision 1 — the filter is answered by NOT filtering

Re-examined and **upheld**: ADR-056 U5's natural-colour ruling stands
unamended, confirmed with the owner before any code moved.

The line the codebase draws is **chrome vs evidence**, not photo vs
screenshot:

- **Instrument imagery** — service plates, arc cards, the card-face bakes, the
  about portrait — takes the house treatment (ADR-050 Addendum 2).
- **Evidence imagery** — the casefile's stills, films and tool captures —
  renders in natural colour, always. The stills are Loop's actual ads; the
  films are their actual commercials.

The reasoning is worth keeping because it is not aesthetic. The tools duotone
was a **normalizing** move: `grayscale(1)` collapses arbitrary screenshot UI
colour to luminance, then `sepia` re-tints that neutral into the gold family
so heterogeneous captures agree with each other and with the bar beneath them.
Applied to authored photography it does the opposite — it destroys intended
colour rather than unifying accidental colour. (It is also no longer live
anywhere: `.fl-shot__img` carries no filter, only dead CSS and a lab route do.)

**So the uniformity has to come from the frame** — which is the rest of this
ADR. The gold lives in the chrome; the evidence keeps its own colour. The
smoke now asserts no `filter` reaches any `.fl-plate img`, on any row.

## Decision 2 — one frame, four plates, each keeping its interior

`ConsoleFrame` (`casefile/console/**`) is ADR-063's chrome lifted out
unchanged: orbit ring, chamfered outer bezel, chamfered opaque console with
its scanline, a body well, and an optional foot. The map adopted it first, and
**every measurement came back byte-identical** — console 596.5×447.9, field
594.5×355.5, meet 0.4489 / 0.6067 / 0.4951, type 4.49–5.16 / 6.07–9.91 /
4.46–5.45 at 1280×720. That identity is the proof the extraction was a move
and not a redesign.

**The frame is a BEZEL THE CONTENT BLEEDS INTO, never a letterbox.** ADR-056
U9 ruled the tools shot _"is architecture — it BLEEDS to the viz box edges"_,
because a letterboxed `contain` read as _"plastered on"_. That still holds;
the edge it bleeds to is now the **console's inner edge**. Measured: the shot
still reaches the right wall (1px = the border) and the rail's underside at
every viewport. This reinterpretation is recorded here rather than taken as a
drive-by, per MAINTENANCE.

**Each plate keeps its own interior.** The rails are deliberately NOT unified:
the tools rail's two-line `01 · MÍMIR` over `BRIEFING AGENT` is an ADR-056 U9
owner ruling (_"a visitor cannot be expected to know the codenames"_) and the
console rail is one line. `rail` and `foot` are slots rendered as **direct
flex children** of the console, because the map's rail is
`flex: 0 0 clamp(32px, 7%, 44px)` — a percentage of the console's block size
that any intermediate auto-height wrapper would resolve to nothing.

**The foot stays optional.** ADR-056's _"the right panel has no generic foot"_
binds. The map prints a sentence that changes with the reading; the other
three print nothing, which also costs them no height.

⚠ **Below 980px the console UNWRAPS, it does not hide.** Hiding it would take
the plate's CONTENT with it — three of the four have no substitute and render
straight into the slot. Only the map hides its own console, because it has the
stream index to put there. Verified at 900×900 and 430×932: every plate's body
survives; the map's list replaces its console.

⚠ **`clip-path` on the console makes it the containing block for `fixed`
descendants.** `MediaLightbox` already portals to `document.body` — that is
now load-bearing for three plates instead of one.

## Decision 3 — the light-contrast sweep the frame forced

Putting the plates on the map's parchment ground turned ADR-058's _accepted_
cost into a visible defect. Measured on `--con-void` (#e4dac9):

| site                 | before        | after           |
| -------------------- | ------------- | --------------- |
| `.fl-tooltab__code`  | 1.25 / 1.55:1 | ink 0.62 / 4.90 |
| `.fl-filmtab__ord`   | 1.45 / 1.68:1 | ink 0.62 / 4.90 |
| `.fl-toolid__kicker` | 1.68:1        | 4.90:1          |
| `.fl-shot__bar`      | 1.83:1        | 4.90:1          |

A tab ordinal at 1.25:1 sitting beside a map that ADR-063 U2 had just fixed to
4.79:1 is the same instrument reading two different ways. The ADR-063 U2 ramp
is the fix, applied to these two plates only — **not a sitewide sweep**; the
other sites ADR-058 named still stand.

⚠ **The dim states go to INK, not to a dimmer gold.** `rgba(gold, .45)` on
parchment cannot reach 4.5:1 at _any_ alpha — the hue is too light to spend.
An inactive tab is quiet because it is ink at low strength, the same move the
map's `--pda-txt3` makes. A 2026-08-04 block had already hit this ceiling and
written it down — _"gold tops out near 3.2:1 here even at full"_ — and settled
for α 0.72. That ceiling was `--gold`'s, not gold's; `--gold-ink` is the same
hue at the lightness the role needs. That block is now updated in place.

Three raw v18 golds that bypassed the ramp also moved onto per-theme
properties (`--pda-spine-glow`, `--pda-mark-glow`, `--pda-sweep`). ⚠ **The
glows go OUT in light, they do not darken** — a halo is additive, so on
parchment it is a pale smudge around a dark bronze mark rather than a lit one.

## Consequences

- `.fl-plate--stills` is `padding: 0` like films and tools. It was the one
  plate carrying `.fl-plate`'s base padding **and** its own; the frame's gap
  is the outer inset now, so the ads are not inset three times over.
- The `pointer-events` opt-in list changes shape: `.fl-con` subsumes the old
  per-plate `.fl-pda` / `.fl-imap` islands rather than adding three more.
- `pda.css` keeps only the map's own vocabulary. Anyone looking for
  `--pda-ch` or `.fl-pda__console` wants `--con-ch` and `.fl-con__console`.

### Verification

- 574 unit tests; the 12-case desktop smoke, including every ADR-063 case
  with no number moving.
- The four-row clipping walk now also asserts **the frame is present and
  correctly inset on every row**, and that **no `filter` reaches any plate
  image**.
- The ADR-063 U2 light-contrast case extended from the map row to **all
  four**, compositing every alpha before measuring.
- Walked 4 rows × 3 viewports × 2 themes: zero overflow everywhere, consoles
  identical per viewport, tools bleed intact.
- The ADR-056 U9 tools ladder re-measured at 1440×930 / 800 / 760, 1280×720
  and 1360×800 — zero overflow at every rung.
- Mobile unwrap verified at 900×900 and 430×932.

### Left open

The stills row now reads as three portrait tiles centred in a tall console
with real air above and below. That is ADR-056 U5's own choice
(_"`justify-content: center` lets the row breathe rather than stretching three
portraits across a landscape box"_) and the frame did not cause it — but the
frame makes it legible as a decision rather than as an accident, and it is
worth an owner look now that the box has edges.
