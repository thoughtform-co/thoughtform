# ADR-134: The course is one track

- **Status:** Proposed (2026-09-29, owner). The `syllabus` track shipped first
  (`f414b2ea`); U1 (same day) adds the Tom on the Moon breakdown and the `path`
  kind. Moves to Accepted once the owner has read the whole page live.
- **Surface:** `components/arcs/ArcSyllabus.tsx`,
  `components/arcs/syllabus/syllabusLayout.ts`, `components/arcs/course.css`
  (a route sheet, after `arcs.css`), `lib/arcs/types.ts`,
  `ArcSectionRenderer`, `chrome.tsx` (`KIND_DESIG`),
  `lib/arcs/content/ai-storytelling.ts`, `tests/lib/arcs-registry.test.ts`;
  U1: `components/arcs/ArcPath.tsx`, `public/arcs/ai-storytelling/*.webp`,
  `scripts/arcs/prep-ai-storytelling-assets.mjs`.
- **Supersedes:** [ADR-132](132-the-ai-storytelling-course.md) on the page's
  SHAPE (one `anatomy` section per week). Its content decisions stand: one
  project all term, two subjects to choose from, a gate on every class, motion
  last.

## Context

The owner read the first cut of the course page on 2026-09-29: _"the ugliest
page I've ever seen in my life. It is just section after section with the same
fucking structure … the same glorified PowerPoint structure."_ Nine `anatomy`
sections in a row, each the same four rows, and not one picture. What he asked
for is a clean visual overview of the classes, laid out the way his own note
lays them out ("AI Storytelling Course", Wispr Flow, 2026-09-29), so a student
sees in one look what to expect, then a breakdown of how Tom on the Moon was
approached, because the assignment is building a brand world and that is one.

## Decision

**A course is ONE instrument, and the week detail is what it shows when a
station is picked.** The `syllabus` kind, ADR-052's fourteenth enumerated
exception:

- **The track.** The two ways in as the fork it starts from (yourself, or a
  product from the future), one station per class under hairline brackets for
  the phases of the house arc, a gate tick after every station, and what is
  launched as the track's end.
- **A station** is its numeral (the renderer's, never authored), a name of at
  most 16 characters, and a hairline frame in the SHAPE of what the class makes
  (`ArcSyllabusGlyph`: setup · board · wall · offer · poster · site · film ·
  launch). A shape, never a picture: the track is the course, not the work.
- **The sheet** under the track belongs to the open station and carries the
  four practical rows once: Objective · You make · The gate · The tool, plus an
  optional link to the worked example on the same page. The gate's key takes
  the soft gold wash; the open station is the drawing's one gold object.
- **Behaviour** is the bench's (ADR-128 B2): a client island whose first render
  is class one open, state only in callbacks, a roving tablist with arrow keys,
  Home and End. Every sheet is in the DOM, so print carries all of them.
- **Layout without measuring.** The tablist is `display: contents` and every
  station a subgrid item of the track's own grid, so the rail runs through the
  plates' centres at every width. The ends' brackets meet the rail by
  arithmetic: equal rows make the first and last chip centres a formula.
- **The phone** re-flows the track into a three-by-three of classes with the
  ends as rows above and below; the brackets and the rail go.

**The spread is the owner's note, with his one ruling on it:** what AI is ·
your world · the world skill (photographing yourself into the world rides this
class) · the offer · the poster · the website (one class) · the launch film ·
the second film · launch. Navigate is one and two, Encode three and four, Build
five to eight, Launch nine.

**The sheet is a route sheet** (`course.css`), not a block in `arcs.css`: two
sessions write `arcs.css` at once more often than not, and the kind's classes
(`.arc-syl*`) match nothing on any other arc.

## Consequences

- The registry pins that each phase is one consecutive run in the phases'
  order (a split phase would bracket the classes between), two ways in, one to
  three things launched, names at most 16 characters, a known glyph, all four
  rows present, and every example link landing on a section of the same page.
- Measured: one screen at 1280×720 and at 1920×1247, in both themes, no
  horizontal overflow at 390×844.

## U1 (2026-09-29, owner): the worked example

The first push carried the track alone, stopped there for a still the owner
never asked for, and he read the page as one section: _"Where are the use cases
from Tom on the Moon? Where are all those visuals?"_ The breakdown he asked for
in the first brief follows the track now, five beats, each a different kind of
picture and every one out of the ship's own record (`Arcs_Tom On The Moon`):

- **How the world was found**, the `path` kind (ADR-052's fifteenth exception):
  dated stages left to right, each a set of the frames it produced, on one
  horizontal rail with the last stage's node and frame the one gold thing. Four
  directions (31 August, the first frame of each board) · ten worlds (1 to 4
  September, the same walk in each) · one planet, two regions (15 September) ·
  the anchor, with the client's own line under it. ⚠ A SET is cut to one 3:2
  cell and a single frame keeps its own aspect; a stage's `weight` is its share
  of the row, so the row can climb toward the frame it ends on.
- **The world as a skill**, on the `bench`: the anchor (ships), a vista whose
  moon came back as a shaded ball (back with a note, the client's _knikker_)
  and a frame that drew our own Moon's seas in mint (does not ship), against
  four checks read off the rubric; the cases on file are the Uluru and bunker
  failures the eval log records.
- **At scale**, on `media`: a wall of 108 of wave 23's 114 delivered frames,
  twelve by nine so it ends on a full row, built by the prep script from the
  ship's `_keepers.json`.
- **From a feeling to an offer**, `cards` in two columns: Tom on the Moon beside
  Thoughtform, both frames cut to 16:9 and capped by the height the head leaves.
- **The client's verdict**, an `interstitial` quote, Dutch as said, English
  under it.

Classes two to four link to their beat from the sheet. The frames are
converted by `scripts/arcs/prep-ai-storytelling-assets.mjs`, which reads the
ship and its Drive folder and never writes them (1.9 MB in 21 files).

⚠ The frames are the client's; the owner asked for them on the page.
