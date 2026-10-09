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


## Update 1 (2026-10-09, owner): the page as one argument, read top to bottom

The owner's brief of 9 October, on the whole page: it read as a run of unrelated sections ("The
team today, and configured" and "One plugin, in the Claude you run" felt random, the second a
regression from the vision), the other brands' cases looked chaotic, the titles read as slogans,
and the screen was not used to its height. The order he asked for: who I am, my approach, the
proof, then what X-Bionic actually gets. Not a copy of the vision's console ("every section looks
the same" is the gripe), but consistent and modular.

1. **One argument in three parts.** About, then my approach (the vision, then how adoption and
   automation connect), then proof from Loop, proof from two other brands, and the offer (the
   engine, the two weeks, who takes part, the fee), then the close. Three chapter bands carry it,
   each with an `index` of its beats: three to five rows, Linear's mono-numbered columns, each a
   link down its own part (registry-guarded: the link lands after the band and before the next
   chapter).
2. **One template for every client job: `kind: "job"`**, the thirty-second enumerated exception
   (`ArcJob`; its classes are `.arc-case__*` because `.arc-job__*` is the breakdown's, its
   attributes `data-job-*`). One job a screen, in the leverage's console: a strip (`JOB 0N`, the
   job's name, and the bucket as the one lit object, with the glyph the vision's 2×2 gives it),
   Tensorlake's sandwich under it (the spec: the ask, what Claude did, the gate, a person by role
   with the person's green diamond; the figure on the dot ground with corner ticks and "Fig. 0N":
   a silent loop, a kept and a sent-back still, or a ledger; three measured cells), and a readout
   foot (the client, where it ran, the date). Four jobs, one per bucket and two per client
   (Samako: strategy and review; Suri: production and ops), so the vision's four disciplines, the
   jobs' buckets and the engine's four workstreams (ADR-154 U4) are one vocabulary drawn three
   times. The media are sized from their frame, a size container, never from their own pixels.
3. **The switch and the board leave this page.** The worked switch hid three of four cases behind
   a bar; `today` set the team as it runs against a column with nothing to show. The `board`,
   `breakdown` and `circuit` kinds stay for the pages that draw them.
4. **Plain titles and less text.** "A creative engine for X-Bionic.", "How adoption and
   automation connect.", "The two weeks.", "Who takes part.", "The fee."; the vision's note says
   what my approach adds; the About is two paragraphs, a page override of the homepage's record.
5. **Every number as filed**, read 9 October from the client repositories and the briefing
   skill's handover. Two planned figures had no filing and were dropped: a with-and-without result
   for the briefing skill, and the blind read's fixture, which the record still lists as open. The
   reviewer's 14 of 15 on Samako's wave 11 is filed since 8 October, so ADR-152 §3's "the record
   never totals it" is superseded.
6. **The screen used to its height**: the page takes `rhythm: "fill"` (ADR-128 U3), and the job
   opts in to the remainder.

⚠ **A did-line is one line (≤ 44).** At two-line wraps the spec column ran the jobs 40 to 63px past
the fold at 1470 × 830. Measured headless after the cut: each job 830 tall at 1470 × 830, its
figure 490, its content ending at 780; at 1440 × 790 the content ends at 760; no horizontal scroll
at 375 wide, where the job reads as one column and its cells stack.
