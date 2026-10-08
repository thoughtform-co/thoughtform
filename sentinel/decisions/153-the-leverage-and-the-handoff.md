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
