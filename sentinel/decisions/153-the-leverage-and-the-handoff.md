# ADR-153: The leverage and the handoff, two beats a board reads in ten seconds

- **Status:** Proposed (2026-10-08, owner). Built on the X-Bionic proposal; flips to Accepted once
  the owner has read it live, and only then do other pages move off `configuration` / `horizon`.
- **Surface:** `components/arcs/ArcLeverage.tsx`, `components/arcs/ArcHandoff.tsx`,
  `components/arcs/leverage.css` (new); the `leverage` and `handoff` kinds in `lib/arcs/types.ts`,
  their cases in `ArcSectionRenderer`, their designations in `chrome.tsx`, `leverage.css` imported on
  both arc routes; `lib/arcs/content/x-bionic-proposal.ts` (the `vision` and `adoption` beats);
  `sheet-config-fit` (X-Bionic leaves the configuration list).
- **Related:** [ADR-152](152-the-x-bionic-proposal.md), [ADR-149](149-the-lattice.md) (the tokens),
  [ADR-151](151-the-setup-guides.md) (the panel grammar this copies).

## The call

The owner, 2026-10-08, on the X-Bionic page's configuration and horizon: "super confusing. I don't
know what people should be looking at. This is for a board of directors." The references: Hex's
Tensorlake sections (one wide cell beside a 2×2, each cell a drawing, a mono label and two lines)
and two Cyberpunk panels (one object in focus, its siblings quiet; a lot of black around few
panels).

## The diagnosis

The configuration put about twenty-five strings on screen at once: a four-row layer column, two
seam notes, five tiles, a five-row readout and three kickers. The horizon added an owner panel,
three spans, two tracks and three gates. Nothing was in focus, so nothing was read.

## The decision

**1. One idea per beat, one lit thing per beat.** The leverage says where the advantage is: three
plates, two the company shares with everyone (dimmed), one only it can write (lit), and one
sentence under them; beside it, the four disciplines as a 2×2, a glyph, a label and a line each.
The handoff says how it gets written: three panels, adopt, write it down, automate, the middle
one lit; then where the team's time goes, today and configured, two bars that letter no figure
and say "Illustrative".

**2. Air is the material.** Hairline frames, no shadows, cell padding from the lattice roles, the
`--space` ladder and the `--type` ladder only, breakpoints on the ladder. Mono for labels, sans for
sentences, gold on the lit thing and nowhere else.

**3. New kinds, not a re-skin.** `configuration` and `horizon` stay as they are on the pages that
use them; this page proves the new pair first.

## Amendment, same day: an instrument, not a slide

The owner, on the first cut: "too simple … it doesn't really feel like a modern, cool interface, nor
like it comes from a retro-futuristic, clean design." The information architecture stays (one idea
per beat, one lit thing); the housing changes, read against Mobbin (Overmind's three cards with one
filled and its siblings faded; Linear's and Beside's mono index over a sans title; Retool's thin
labelled bars) and the Hex and Cyberpunk references:

- The leverage is ONE console in the arcs' own chamfered plate (`.arc-plate`, no new polygon): a
  head strip (`SYS · Intelligence configuration`, a pulsing status), a readout foot (models shared,
  Claude installed, layer owned). The stack is three isometric slabs on a dashed spine, the owned
  one gold and hatched, the shared one dashed. The 2×2 sits on a dot ground with data glyphs (a
  brief's lines, a bar-code, a stepped run, a check).
- The handoff's three steps are chamfered plates with a head strip and a timing readout, joined by
  chevron runs; the hinge takes `.arc-plate__head`'s gold band and its siblings fade back. The time
  is a plate of bar-code tracks, gold stripes where the time goes to ideas.

## Amendment, 2026-10-09: the rest of the X-Bionic page

The owner: "now do the rest of the x-bionic page". The audit found the slide grammar in three
places and walls of text in two:

- **The chapter band.** A fourth interstitial variant, `chapter`, with a `chapter: { n, of }`
  part ruler: a band the height of its content, set left under the ruler, never a screen. The
  page's three interstitials take it, their copy cut to one line and one sentence. Pandora's
  callouts are untouched.
- **The terms.** `kind: "terms"` (the thirty-first enumerated exception) merges the fee and what
  we measure into the leverage's own console: the day rate as the one large readout, the shape of
  the engagement as mono rows, what we measure as the 2×2 on four new glyphs (`ratio`, `spread`,
  `clock`, `meter`), a readout foot. No total is lettered. The page opens and closes on one
  instrument.
- **Copy cut.** The phases and who takes part keep each item's name and readout and lose its
  paragraph; the repeated `X-Bionic` chip under a column already titled "From X-Bionic" goes.
- "What plugs in" moves to ADR-154's instrument (its U2).

## Amendment, 2026-10-09: one screen on a MacBook Air

The owner: "make sure all the elements fit within the viewport … this is for my MacBook Air".
Measured at 1470 × 830 by content bottom (the section's own bottom padding may sit below the
fold), the leverage ran 1178px, the terms 1164px and the handoff 956px. The fix is the frontend
one, not a crop: one fluid unit, `--lv-v: clamp(8px, 1.6svh, 24px)`, drives every block padding
and gap; the glyphs take a height (`clamp(32px, 5.5svh, 64px)`), never the column's width; the
index rides a cell's corner; the fixed `min-height`s go. Every beat is whole at 1440 × 790,
1470 × 800, 1470 × 830 and 1710 × 980, with no horizontal scroll and no text of these beats under
10px (`--type-xs` raised to `--type-sm`).

