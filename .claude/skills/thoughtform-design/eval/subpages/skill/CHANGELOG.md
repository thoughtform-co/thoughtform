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
