# wave-02 — the three surviving directions at the new state, graded on 0.1.3

**2026-09-20.** The owner's first ruling took the two full-height rules off
every page (ADR-114 U1), so the sheet is a different CSS state and wave 01's
stills describe a page that no longer exists. This wave re-shoots the three
directions that survived — the `rules` knob and direction SC went with the
ruling — at one CSS state: 1920 × 1247 in both themes, one still per section,
64 stills per direction (42 on the five real pages, 22 on the kit), plus the
house direction again at 1280 × 720. Rubric **0.1.3**, three runs per still,
majority per check, `gemini-flash-latest`.

| folder              | direction    | knobs moved               | stills | mechanical (per type)        |
| ------------------- | ------------ | ------------------------- | ------ | ---------------------------- |
| `wave-02-sb`        | SB house     | none                      | 64     | 0 on the five pages, 1 on SK |
| `wave-02-sd`        | SD editorial | `head=stack ordinal=off`  | 64     | same                         |
| `wave-02-se`        | SE grid      | `card=grid timeline=rail` | 64     | same                         |
| `wave-02-sb-laptop` | SB house     | none, at 1280 × 720       | 64     | same; not graded             |

The gate is clean on every real page in both themes. The kit's exit 1 is its
whole-page accent count against a 24 budget, which is the kit lettering every
state at once; it is by construction and unchanged from wave 01.

## The headline: it grades worse, and the ruling is why

| direction    | PASS | PASS_WITH_NOTES | RETRY | FAIL | keepable | was (wave 01) | unstable (of 64) |
| ------------ | ---- | --------------- | ----- | ---- | -------- | ------------- | ---------------- |
| SB house     | 14   | 3               | 19    | 6    | 17 / 42  | 21 / 42       | 22               |
| SD editorial | 16   | 1               | 19    | 6    | 17 / 42  | **27 / 42**   | 21               |
| SE grid      | 15   | 3               | 21    | 3    | 18 / 42  | 23 / 42       | 27               |

Every direction lost ground, and the editorial direction — wave 01's clear
winner — lost the most, from 27 keepable to 17. Most-failed on the 42
real-page stills:

- **SB** B1 13 · B2 13 · C5 11 · E4 10 · A2 6 · C6 6
- **SD** B1 17 · B2 11 · C2 11 · C5 8 · E4 7 · D1 6
- **SE** B2 14 · E4 13 · B1 11 · C5 10 · C6 6 · A2 3

B1 is the most-failed check of the wave, and the grader's own words for it are
the same sentence over and over: _"rules terminate abruptly in open
whitespace"_, _"horizontal rule terminates mid-page without a bounding
vertical seam"_, _"panels float across air gaps without shared seam seating"_.

## What the grader is actually looking at, measured

It is not imagining it. With the two verticals gone, nothing terminates a
seam, and at the owner's own viewport the gap is large — because the editorial
band caps at 1200px while the rails keep travelling outward with the window:

| viewport    | seam runs      | rails' inner edges | gap at each end |
| ----------- | -------------- | ------------------ | --------------- |
| 1280 × 720  | 129 → 1151     | 90.6 / 1189.4      | **38px**        |
| 1440 × 800  | 144.7 → 1295.3 | 101.5 / 1338.5     | **43px**        |
| 1920 × 1247 | 360 → 1560     | 136 / 1784         | **224px**       |

So at a laptop the seam all but meets the rail and the page reads as ruled; at
1920 × 1247 — the shape every still in this wave was shot at, and the owner's
own window — each seam stops 224px short of the rail at both ends and floats in
a dark margin. Before U1 the two hairlines at the band's edges were what those
seams landed on.

**This is a question for the owner, and it comes straight out of his own
sentence.** He said the rails are already there; the sheet took that as "draw
no verticals", and the result is that its horizontals no longer reach the
verticals he named. Three answers, none of them taken here:

1. **Leave it.** The seam is the band's width; the rails are the frame's, and
   the two are not meant to meet.
2. **Run the seams out to the rails.** Every horizontal then terminates on the
   frame's own vertical, which is the literal reading of "we already have our
   rails". One width change on the seam; nothing else moves.
3. **Bound the overrun.** Let a seam reach past the band toward the rail by a
   capped amount, so it reads as connected at 1920 without going full bleed.

Nothing is changed in the sheet for this wave: a wave is one CSS state, and he
has to read the state that was shot.

## The second reading: the stacked head leaned on the left rule

SD's C2 went 5 → 11 on the real pages, and every one of them is a `split` —
the page's own masthead. With `head=stack` the kicker sits alone in the first
four columns with the title opposite; the left-hand vertical used to run past
it. With that gone the grader reads _"the top section kicker lacks an underline
rule"_ and fails the head band. Looked at directly, the observation holds: in
`AR-void__sd_01.png` the kicker floats in an otherwise empty quarter of the
page, while every ordinary section head below it still carries its hairline.

The house direction does not lose C2 the same way, because its title sits
immediately under its kicker and the pair reads as one block. **The editorial
direction was the one depending on the verticals**, which is worth knowing
before any of it is promoted.

## What carried over unchanged from wave 01

Three clusters are the rubric describing the design on purpose, all already
written into the pending block (now 0.1.4) and none of them touched by the
ruling:

- **E4 and C5 on a single flashcard** (SE 13 and 10). Every real console holds
  one card, so nothing peeks behind the front one, and the card's duotone
  figure carries no `[ FIG. n ]` bar because it is a card, not a figure.
- **A2 and E3 on the sessions timeline** (SB and SD; SE passes). The lit node's
  gold box reads as selection by colour. SE's rail lights its node with a
  diamond and ink alone and passes the same stills — still the cleanest evidence
  for that ruling.
- **B1/B2 on every console still.** The fixed-ratio flashcard cannot reach the
  band's edge, so panel and pile read as floating with a gutter between them.
  Unchanged by U1 and still the owner's call.

## Set level, by eye off the contact sheets

F1 holds: the ladders are lawful in code and the figures still change side.
F2 holds: the six pages read as one instrument in both themes and light
re-derives. F3 holds and is now simpler with SC gone — SD differs from SB only
in its head and its ordinals, SE only in its timeline and its card grid.

## Per still, the five real pages

`file` · section · SB · SD · SE

```
AC-parchment  01 split      RETRY B1,B2,E4,C5      RETRY B1,C2            RETRY B1,B2,E4,C5
AC-parchment  02 console    RETRY B1,B2,E4,C5,C6   RETRY B1,B2,C5,C6      RETRY B1,B2,E4,C5
AC-void       01 split      FAIL  A2,B1,B2,E4,C5   RETRY B1,C2            RETRY B1,B2,E4,C5
AC-void       02 console    RETRY B1,B2,B3,E4,C5   FAIL  A2,B1,B2,C2,E4   RETRY B1,B2
AR-parchment  01 split      RETRY B1,D1,C5         RETRY B1,C2,D5,E4,C5   RETRY B1,B2,E4,C5
AR-parchment  02 console    RETRY B1,B2,E4,C5      RETRY B1,B2,E4,C5      RETRY B1,B2,E4,C5
AR-parchment  03 cells      PASS                   PASS                   RETRY D5
AR-void       01 split      RETRY B1,B2,C5         RETRY B1,C2,D5,E4      RETRY B1,B2,E1,E4,C5
AR-void       02 console    RETRY B1,B2,C5         RETRY B1,B2,C5         RETRY B1,B2,E4
AR-void       03 cells      PASS_ C6               PASS                   RETRY D5,C6
HS-parchment  01 split      FAIL  A2,E3            FAIL  A6,B1,C2,D1      RETRY C3
HS-parchment  02 timeline   FAIL  A2,E3,C6         FAIL  A2,D1,E3         FAIL  A2,E3
HS-parchment  03 steps      PASS                   FAIL  A2,D1            PASS
HS-parchment  04 cells      PASS_ C6               PASS                   RETRY D1,C6
HS-parchment  05 row        PASS                   RETRY B1,B2,C6         PASS_ C6
HS-void       01 split      FAIL  A2,B3,D1         FAIL  A2,B1,B2,C2,E3   PASS
HS-void       02 timeline   FAIL  A2,B2,D1,E3      FAIL  A2,B2,E3         FAIL  A2,E3,C6
HS-void       03 steps      FAIL  A2,C3            RETRY D1               PASS
HS-void       04 cells      RETRY B1               PASS                   PASS_ C6
HS-void       05 row        RETRY B2,C6            RETRY B1,B2,C6         RETRY D1,C6
MP-parchment  01 split      RETRY B1,C2            RETRY B1,C2,D1         RETRY B1,B2,C2
MP-parchment  02 prose      RETRY B1,D1            RETRY B1,D1            RETRY B1,D1
MP-parchment  03 figure     RETRY E4               RETRY E4               RETRY B2,E4
MP-void       01 split      RETRY C2               RETRY B1,C2            PASS
MP-void       02 prose      RETRY B1,D1            PASS                   PASS
MP-void       03 figure     RETRY B2,E4,C5         PASS                   RETRY B2,E4,C5
MU-parchment  01 split      RETRY E4               RETRY B2,E4            RETRY B2,E4
MU-parchment  02 figure     RETRY B2,E4,C5         RETRY B2,C5            RETRY B2,E4,C5
MU-parchment  03 table      PASS_ C5               RETRY B1               FAIL  A2,C5
MU-void       01 split      RETRY B1,B2,C2,E4      RETRY B1,B2,C2,E4,C5   RETRY B1,B2,C2,E4
MU-void       02 figure     RETRY B2               RETRY C2               RETRY E4
MU-void       03 table      PASS                   PASS_ C5               PASS_ C5
every close   PASS in every direction (excluded since 0.1.2)
```

## The version split, and why it is its own number

U1 rewrote B1 in the same hour it changed the page, and both waves would
otherwise have carried `0.1.2` while being graded on two different texts —
`calibrate.py` filters by version, so it would have averaged two different
checks. U1's rewrite is **0.1.3**, wave 02's grades and its 192 ledger rows
carry it, and the pending block renumbers to **0.1.4**. Wave 01 stays on 0.1.2,
which is the text that produced it.

## Ruled out

- **Fixing the seam before he reads this.** The measurement is the finding and
  the answer is his; changing the sheet now would also mean a fourth shoot of
  three directions to keep the wave one CSS state.
- **Applying the pending 0.1.4 items.** Still gated on a first handback. Three
  of the four would raise every direction's score without anything on the page
  changing, which is exactly what an uncalibrated rubric may not do.
- **Grading the laptop folder.** Mechanically clean; grading it would add 64
  more unstable verdicts to a rubric nobody has ticked. It is worth looking at
  by eye for the seam question, though — at 1280 the seam nearly meets the rail.

## Standing conclusion

The sheet still passes its own laws — the gate reports zero findings on every
real page in both themes, and the variety law holds in code. What the wave
says is narrower and more useful than a score: **taking the verticals away cost
the page its terminations, and it cost the editorial direction its head band.**
Whether that matters is the owner's read, and the three galleries are where he
makes it. No direction is promoted; until `ledger.py tick --handback` has read
a handback, this wave has not happened.

## Record

- `qa_results.json` and `qa_summary.json` in each of the three wave folders;
  +192 ledger rows on rubric 0.1.3.
- Contact sheet per wave, plus `_contact-sheet-vs-sd.png` and
  `_contact-sheet-vs-se.png` in `wave-02-sb/`.
- Galleries: `delivery/review-wave-02-{sb,sd,se}.html`.
- `skill/references/eval-log.md`, `skill/references/rubric.md` (0.1.3),
  `skill/CHANGELOG.md`, `MEMORY.md`, ADR-114.
- Handback: none yet.
