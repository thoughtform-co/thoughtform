# Generation

How a candidate is actually made.

⚠ **NOTHING ON THIS SHIP IS DRAWN BY A MODEL.** Every candidate is a Playwright
screenshot of a live route at a direction (a knob set), a theme and a viewport:
a deterministic render, reproducible to the pixel from its URL. So this file
describes a CAPTURE where the template describes a prompt, and the harness's
generation half (`wave.py`, `generate.py`, `explore.py`, `crop.py`) is never
run. What is run is the half that judges.

The one thing that does not change: the shared block below is still what every
candidate in a wave holds in common, and **anything in it that is not true of
every still is a bug**. It is read by a person, and by `doctor.py`, which checks
that its swap paragraph is where `armada.toml` says.

## The maker

```
node scripts/capture-subpages.mjs --wave <name> --k <ID> [--setting laptop] [--types HS,AR]
```

in the SITE repo, against a dev server. It reads `lib/sheet/directions.json`,
the same registry the pages read, asserts that this ship's lanes and types still
mirror it, runs the mechanical gate on every cell first, and writes one still
per SECTION plus a `MANIFEST.jsonl` per type folder in this ship's own filename
grammar.

⚠ **THE MIRROR ASSERTION IS THE SHIP'S ONE REAL RISK.** Two files describe the
directions: the registry the page draws from, and the lanes and types this
rubric grades. They are kept in step deliberately rather than shared across
repos, which means they CAN drift, so the capture refuses to run on a mismatch
and prints what to paste. A lane without a direction grades a still nobody
shot; a direction without a lane shoots a still nobody grades.

⚠ **THE WAIT IS ON A VALUE THE PAGE COMPUTED, NEVER ONE THE SCRIPT SET.**
`SheetShell` writes `data-sh-ready` on `.sh-root` only after the three faces
have loaded, two frames have painted and the rail has a height. The stamp's
tail carries the section count and the live rail height; a gate that waits on a
number the script provided is not a gate.

⚠ **THE THEME COMES FROM `?theme=`, NEVER `colorScheme`.** The site's theme is a
pre-paint attribute written by its own store; emulating a colour scheme changes
nothing and every light still would be a dark one.

## Attach order is binding

1. **The register strip** of the candidate's theme,
   `references/register/<subject>.png`, resolved by the subject's `identity`.
   It goes second, and it is **never a previous candidate** and never a page of
   this site.
2. Nothing else. There is no detail view and no look anchor: the candidate is a
   render of a real route, and a third image would be a third opinion about a
   thing that has no opinion.

⚠ **AND THE REGISTER IS A GRAMMAR, NOT A TRUTH.** See the rubric's
`## Grading rules`, which overrides the harness's built-in preamble on exactly
this point. What the strip proves is how those sites rule, seat, head and label
a page; it proves nothing about this page's ground, layout or copy.

## What every frame shares

⚠ The heading is the harness's, not this ship's. `doctor.py` looks for exactly
this string and for a fenced block under it; "still" would have read better and
would have silently failed the preflight.

This block is identical for every candidate in a wave. It is the only thing the
set holds in common.

```
SHEET. The subject is one subpage of the practice's site drawn as a ruled
sheet: a document of content-height sections on a twelve-column band, inside
the site's own HUD frame, on its rails, with the corner readout naming the
section. It is a live render, not a mockup. The frame's two rails are the
page's only verticals; the page divides itself with a seam between sections;
cells share edges; nothing floats on a ground; there is no shadow and no
radius anywhere.

HEAD. The page opens on a split, never a centred hero and never a hero image:
a name kicker and a display title in sentence case on one side, the
paragraphs opposite, a readout or a station row under them. Every section
after it opens on a head band: a mono kicker, an ordinal per the knob, one
hairline.

ARRANGEMENTS. Each section is exactly one arrangement from a vocabulary of
ten: split, row, cells, console, timeline, steps, table, figure, prose,
close. Consecutive sections differ; no kind appears more than twice; the
page ends on the close, which is the site's footer.

CONSOLE. Where a page lists a client, the console is a sticky terminal panel
in the left four columns (a head bar with the name and a designation, a
readout column of five facts derived from the registry, the lede) beside
portrait flashcards in the right eight (kicker and title at the top, a
duotone figure in the middle, the paragraph at the bottom) that stack on
scroll, or sit in a static grid per the knob.

CHROME AND ACCENT. Two faces by role: PT Mono for chrome, PP Neue Montreal
for titles and prose, nothing above the 500 weight, uppercase on the mono
only. One line weight for structure in the dawn ink at three alphas. Gold is
spent, never sprayed: the lit timeline node, the picked station, the open
step's mark, the CTA outline, kicker ink, the tree glyph, the console's lip.
At most twelve gold objects in any still.

LIGHT. The dark theme is dawn ink on the void; the light theme is the same
drawing on parchment with every alpha re-derived, never inherited. Both are
shot for every direction, because a rule that only holds in one of them is
not a rule.

VIEWPORT. The owner's own window, 1920 by 1247, the frame every reference
was read at and the one he reads the site at.

REFUSALS. Nothing is retouched, cropped or composited after the shot. What
the still shows is what the URL renders. No motion is paused mid-flight: the
capture waits for every reveal and every animation to finish before it
shoots.
```

## Settings

A setting is a VIEWPORT here. `--setting laptop` swaps the paragraph below and
writes into a `-laptop` wave folder; nothing else moves, which is what makes a
comparison between the two mean something.

**default**

```
VIEWPORT. The owner's own window, 1920 by 1247, the frame every reference
was read at and the one he reads the site at.
```

**laptop**

```
VIEWPORT. The binding laptop frame, 1280 by 720: the shape every clip and
every overrun on this site has ever shown up at first, where a console's card
is a third narrower and the head band's air is spent.
```

## Repair clauses

None. On this ship a repair is not a sentence appended to a prompt; it is a
change to the page's source, with its own still. If a graded wave shows that a
direction fails for a reason no knob expresses, the repair is a NEW KNOB in
`lib/sheet/directions.json`, which is a change to the page, never a note here.

## The difference table

`armada.toml`'s `[types]` carry `camera` / `position` / `shape`: the page's
ladder, what its first screen holds, and its own instrument. **If two types
share all three, one of them is wrong** — the same audit the harness runs on an
image engagement, and the right question here: two pages with one difference
table are one page shot twice.

## Formats

One shape per still, and no cuts. A viewport is one of the variables, so
cropping one into another would produce a picture of a composition nothing
renders.

## Draws are sections

Draw `_01` is the first screen, which by the composition law is the split.
Draw `_0n` is section `n` with its head band at the pin. A rubric row may
therefore scope itself to a section, and the section's name and arrangement
are written into `meta.subject_noun`, the one meta `qa.py` prints. `best` and
`pick.py` compare sections of one page, which is meaningless on this ship;
the gallery is read per still, not per slot.
