# Morph rubric — what a transition clip is graded on by eye

Read by `clipgrade.py --judge` at runtime (rows in Armada's shape:
`| ID | Check | Fails when | Severity |`, so `armada/tools/config.load_checks`
reads this table unchanged if the lane ever moves into the harness). The
deterministic half (flash, cut, dissolve, relight) is `clipgrade.py`'s and is
NOT repeated here: this is what code cannot see.

Calibration status: **uncalibrated, reporting only.** Calibrate it on wave
v1's six fal clips against `evals.md` before a verdict gates anything.

Judge: `gemini-flash-latest`, temperature 0, three runs, majority per check
(quorum 2 of 3, a tie fails, `cannot_tell` fails and is recorded apart).

## Checks

| ID  | Check                                                                 | Fails when                                                                                                                                                                     | Severity |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| M1  | The strip reads as ONE subject throughout: one person, never two      | two figures at once, a ghosted or superimposed second figure, a figure that splits, or a frame showing a stranger who is neither end's person                                  | gate     |
| M2  | The change is continuous and rides the motion                         | two neighbouring strip frames differ by a jump the body's movement does not explain (a costume or rendering swaps while the body is still), or a frame belongs to neither side | gate     |
| M3  | The middle frames are the same person as the ends: face, beard, build | a different face, beard shape or build appears in the middle third, or the face goes blank                                                                                     | critical |
| M4  | Solid forms in real space, not a dissolve                             | translucency, a double exposure, see-through limbs, or the middle reads as two images crossfaded                                                                               | critical |
| M5  | The two ends are the reference frames given as images 2 and 3         | either end is re-rendered: relit, restyled, recoloured, reposed or reframed against its reference (skipped when no references are given)                                       | critical |
| M6  | The light holds                                                       | the figure dims, flashes, goes silver, cream or grey, or the backdrop changes colour                                                                                           | advisory |

## Grading rules

Image 1 is a contact strip of the clip: thirteen frames left to right in time,
with a row of head crops under them, each labelled with its frame number.
Images 2 and 3, when present, are the frames the clip is meant to START and
END on. You are grading a TRANSITION in which one figure becomes another; a
change of costume, style or setting between the ends is the point, not a
fault. Judge only what each check asks. Answer `cannot_tell` only when the
strip genuinely does not show enough to decide.

## Scoring

Any gate failed: FAIL. Otherwise any critical failed: RETRY. Otherwise PASS.
Advisory checks are reported and never change the verdict.
