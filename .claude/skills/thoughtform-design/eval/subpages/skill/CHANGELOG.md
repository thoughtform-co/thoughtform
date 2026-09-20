# Changelog

Dated entries: how the work changed, not what was edited.

## 2026-09-20

- The ship is scaffolded from the harness's `new_engagement.py` (0.8.3),
  callsign `turnstone`, and the three imagery-template documents are replaced
  with the sheet's: subjects are themes with register strips for identity,
  types are pages with the route in `shot`, lanes are directions, draws are
  sections, settings are viewports.
- Rubric 0.1, reporting only, with the negative pole as its first anchors.
- `scripts/capture-subpages.mjs` in the site repo is the maker: it asserts the
  mirror, runs the mechanical gate per cell, waits on `data-sh-ready`, shoots
  one still per section, and writes the manifest in the ship's grammar.
- Wave 00 graded (18 stills, 3 runs): the rubric fails the negative pole on
  every check it named; rubric 0.1.1 excludes the HUD frame (A6 had failed on
  its round navigation button on every still) and rewrites A1.
- Wave 01's first read (the house direction, 64 stills, 28 unstable) found one
  page defect — the flashcard's kicker ran into its title — and two rubric
  defects: the flashcards' folder lip read as a gold outline (A2 now excepts it
  beside the console's) and the close graded as a section (excluded). Rubric
  0.1.2. The sheet's fix meant one consistent re-shoot of all four directions;
  the capture's manifest write became idempotent (a re-shot file replaces its
  row) and its theme read stopped gating every dark cell on a null attribute.
- The owner's first ruling, off the wave-01 gallery's first screen: the two
  full-height rules at the band's edges go on every page — the frame's rails
  are the page's only verticals. The `rules` knob and direction SC are deleted
  with their guards, B1 is rewritten, the first negative anchor of the sheet
  itself is on record, and wave 02 re-shoots SB, SD and SE at the new state.
- Wave 02 re-shot SB, SD and SE at the post-ruling state and every direction
  graded WORSE: keepable on the real pages 17 / 17 / 18 against wave 01's
  21 / 27 / 23, with the editorial direction losing the most. B1 is the
  wave's most-failed check, and the measurement says the grader is right
  about what it sees - the band caps at 1200px while the rails travel, so a
  seam stops 38px short of the rail at 1280 and 224px at the owner's 1920.
  Taking the verticals away took the terminations of every horizontal with
  them, and took the stacked head's grounding rule (SD's C2 5 -> 11). Three
  answers written down, none taken: it is his read. U1's B1 rewrite becomes
  rubric 0.1.3 with its own ledger rows, because two texts under one version
  would have been averaged by calibrate.py; pending renumbers to 0.1.4.
