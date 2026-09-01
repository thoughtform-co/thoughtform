# Landscape-mobile evidence pass (2026-09-01)

What the live landing does TODAY on a rotated phone — the zero-code half of the
landscape-tier exploration (approved as exploration only; no production
implementation this pass). Twenty stills, two shapes, ten scroll stops each,
captured against localhost with real incremental scrolls.

- `844x390_*` — iPhone 14 landscape
- `932x430_*` — iPhone 14 Pro Max landscape

## What the stills show

1. **The corridor takes the DESKTOP path and it does not survive 390px of
   height.** Both landscape widths sit in the 761–960 dead band: above the
   corridor's 760 mobile-composition gate, below the 960 gate everything else
   uses. `_018`/`_030` show the two-column desktop copy composition
   overprinting itself — the Arc title through the WORK column, the support
   paragraph through the sphere and the CRAFT label. This is the collision the
   tier predicate exists to catch.
2. **The proof casefile takes the MOBILE path (≤960) and mostly reads.**
   `_042`/`_055` show the ADR-083 instrument with the 2026-09-01 type ladder;
   the composition holds, but the bounded seat (52svh of a 390px viewport
   ≈ 203px) is below its own 236px short-phone floor's assumptions — the seat
   is the surface that would gain most from a landscape column split.
3. **Voidwalker lands in its 701–1100 complete-fallback band** (`_080`) — the
   serial document, not the one-screen instrument, at reading depth authored
   for portrait.

## The tier, if built (from the approved exploration)

- Predicate: `(orientation: landscape) and (pointer: coarse) and (max-height: 500px)`
  — pointer-coarse excludes short desktop windows; max-height ~500 catches
  phones without catching landscape tablets. Every JS gate pairs with the SAME
  CSS query (the console-unwrap "three gates, one pair" law).
- Surfaces that gain most, in order: the voidwalker era stage (the ≥1101 datum
  grammar at reduced density is already a landscape composition), the casefile
  seat (rail + modes as a left column, ~16:9 seat beside it), the corridor
  captions (flank the gate instead of stacking over it).
- Next step when picked up: an image-model mockup slate (3 surfaces × 2–3
  compositions at 844×390, `generate-era-stage-mockups.mjs` pattern), judged in
  a gallery; a lab route only for whichever direction survives.

Capture script: one-off, session scratchpad (`capture-landscape.mjs`) — not
promoted into `scripts/` because the tier decision may not happen; re-creating
it is ~60 lines.
