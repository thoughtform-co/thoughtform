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
