# Generation

How a candidate is actually made.

⚠ **NOTHING ON THIS SHIP IS DRAWN BY A MODEL.** Every candidate is a Playwright
screenshot of a live interface at a knob set, a viewport and a theme — a
deterministic render, reproducible to the pixel from its URL. So this file
describes a CAPTURE where the template describes a prompt, and the harness's
generation half (`wave.py`, `generate.py`, `explore.py`, `crop.py`) is never
run. What is run is the half that judges.

The one thing that does not change: the shared block below is still the thing
every candidate in a wave holds in common, and **anything in it that is not true
of every still is a bug**. It is read by a person, and by `doctor.py`, which
checks that its swap paragraph is where `armada.toml` says.

## The maker

```
node scripts/capture-interface-kit.mjs --wave <name>
```

in the SITE repo, against a dev server. It reads
`lib/interface-kit/directions.json` — the same registry the page reads — asserts
that `armada.toml`'s `[types]` still mirror it, and writes one still per cell
plus a `MANIFEST.jsonl` per type folder in this ship's own filename grammar.

⚠ **THE MIRROR ASSERTION IS THE SHIP'S ONE REAL RISK.** Two files describe the
directions: the registry the page draws from, and the `[types]` this rubric
grades. They are kept in step deliberately rather than shared across repos,
which means they CAN drift — so the capture refuses to run on a mismatch and
prints the block to paste. A type without a direction grades a still nobody
shot; a direction without a type shoots a still nobody grades.

## Attach order is binding

1. **The control still** — `control/v0-<viewport>-<theme>.png`, the shipped
   panel at the candidate's own viewport and theme, resolved by the subject's
   `identity`. It goes second, and it is **never a previous candidate**.
2. Nothing else. There is no detail view and no look anchor: the candidate is a
   render of a real surface, not a likeness of a physical object, and a third
   image would be a third opinion about a thing that has no opinion.

⚠ **AND THE CONTROL IS A BASELINE, NOT A TRUTH.** See the rubric's
`## Grading rules`, which overrides the harness's built-in preamble on exactly
this point. A difference from the control is the candidate's argument.

## What every frame shares

⚠ The heading is the harness's, not this ship's. `doctor.py` looks for exactly
this string and for a fenced block under it; "still" would have read better here
and would have silently failed the preflight. A shared vocabulary that only
half-matches is worse than one that does not match at all.

This block is identical for every candidate in a wave. It is the only thing the
set holds in common.

```
THE SUBJECT is the proof casefile — one client's engagement drawn as an
interactive panel — inside the site's own HUD frame, on the frame's rails, with
the corner readout naming the section. It is a live render, not a mockup.

THE COMPOSITION is fixed across the wave: a client name on a head rule, a record
column of brief, proof claims and a file directory, a column split, and a field
on the right carrying one instrument at a time. No direction moves a box; the
directions move line weight, tracking, weight, case, accent spend and material.

THE ROW is the first one, the intelligence map, unless the still says otherwise.
Every direction is shot on the same row, because a comparison across two rows is
a comparison of two records.

LIGHT AND GROUND. The dark theme is ink on a near-black ground with a dawn ink
ramp; the light theme is the same drawing on parchment with every alpha
re-derived, never inherited. Both are shot for every direction, because a rule
that only holds in one of them is not a rule.

REFUSALS. Nothing is retouched, cropped or composited after the shot. What the
still shows is what the URL renders.
```

## Settings

`--theme` is carried by the SUBJECT on this ship, not by a setting: a light
still and a dark still of one direction are two candidates a reader compares,
not one candidate in two lights. The fence below exists because the harness
requires one, and it names what the default actually is.

**default**

```
LIGHT AND GROUND. The theme named by the subject, rendered by the site's own
theme channel — never by an emulated colour scheme, which this site does not
read.
```

## Repair clauses

None yet. On this ship a repair is not a sentence appended to a prompt; it is a
knob value, and it already has a name in the registry. If a graded wave shows
that a direction fails for a reason no knob expresses, the repair is a NEW KNOB
in `lib/interface-kit/directions.json` — which is a change to the page, with its
own still, and never a note here.

## The difference table

`armada.toml`'s `[types]` carry `camera` / `position` / `shape`: the knob string,
the axis being moved, and what the still should show. **If two types share all
three, one of them is wrong** — the same audit the harness runs on an image
engagement, and it is exactly the right question here: two directions with the
same three answers are one direction shot twice.

## Formats

One shape per still, and no cuts. A viewport is one of the two variables, so
cropping one into another would produce a picture of a composition nothing
renders.
