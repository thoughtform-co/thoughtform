# ADR-134: The course is one track

- **Status:** Proposed (2026-09-29, owner). The `syllabus` kind is shipped on
  `/arcs/ai-storytelling`; it moves to Accepted once the owner has read it live.
  The Tom on the Moon breakdown that follows it on the page is the next step
  and is not built yet.
- **Surface:** `components/arcs/ArcSyllabus.tsx`,
  `components/arcs/syllabus/syllabusLayout.ts`, `components/arcs/course.css`
  (a route sheet, after `arcs.css`), `lib/arcs/types.ts`,
  `ArcSectionRenderer`, `chrome.tsx` (`KIND_DESIG`),
  `lib/arcs/content/ai-storytelling.ts`, `tests/lib/arcs-registry.test.ts`.
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

## Next

- **The Tom on the Moon breakdown**, each section a different kind of picture
  from the ship's own record (`Arcs_Tom On The Moon`): how the world was found
  (four directions, ten worlds, two regions, the anchor frame), the world as a
  skill on the `bench` (the anchor, a frame that drew our own Moon, a frame
  that came back as an Earth bunker), a wave's contact sheet, and the world
  beside its offer. A `path` kind was drafted for the first of these and held
  back until it is built and measured.
- ⚠ The Tom on the Moon frames are the client's. The owner confirms they are
  cleared for a public page before they ship.
