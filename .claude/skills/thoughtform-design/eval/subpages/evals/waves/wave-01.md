# wave-01 — four directions of the sheet, graded on rubric 0.1.2

**2026-09-20.** One consistent shoot of the sheet at one CSS state: the four
drawable directions at 1920 × 1247 in both themes, one still per section — 64
stills per direction (42 on the five real pages, 22 on the kit) — plus the house
direction at 1280 × 720 (64 stills, mechanically gated, not graded). Rubric
0.1.2, three runs per still, majority per check, `gemini-flash-latest`.
Galleries in `delivery/review-wave-01-<k>.html`; contact sheets beside each
wave, with one comparison sheet per direction in `wave-01-sb/`.

| folder              | direction    | knobs moved               | stills | mechanical (per type)        |
| ------------------- | ------------ | ------------------------- | ------ | ---------------------------- |
| `wave-01-sb`        | SB house     | none                      | 64     | 0 on the five pages, 1 on SK |
| `wave-01-sc`        | SC seams     | `rules=seams`             | 64     | same                         |
| `wave-01-sd`        | SD editorial | `head=stack ordinal=off`  | 64     | same                         |
| `wave-01-se`        | SE grid      | `card=grid timeline=rail` | 64     | same                         |
| `wave-01-sb-laptop` | SB house     | none, at 1280 × 720       | 64     | same; not graded             |

The kit's mechanical exit 1 is its whole-page accent count (40 on eleven
sections, against a 24 budget), which is the kit lettering every state; the
per-still count in view is under twelve on every real-page still (max 11 on a
split) and reaches 13–14 only on the kit's cells, timeline and steps.

## What the grader said

Verdicts on the 42 real-page stills (PASS and PASS_WITH_NOTES are keepable;
RETRY is one critical; FAIL is a gate):

| direction    | PASS | PASS_WITH_NOTES | RETRY | FAIL | keepable | unstable (of 64) |
| ------------ | ---- | --------------- | ----- | ---- | -------- | ---------------- |
| SB house     | 17   | 4               | 16    | 5    | 21 / 42  | 25               |
| SC seams     | 19   | 3               | 15    | 5    | 22 / 42  | 23               |
| SD editorial | 24   | 3               | 9     | 6    | 27 / 42  | 22               |
| SE grid      | 21   | 2               | 19    | 0    | 23 / 42  | 24               |

Most-failed checks per direction: SB B1 13 · B2 12 · C5 12 · A2 9 · E4 9;
SC B1 13 · B2 10 · A2 9 · C5 9; SD A2 9 · C5 8 · C2 8 · B1 6; SE E4 16 ·
B2 12 · C5 11 · B1 9.

⚠ **A third of every direction's verdicts moved across the three runs** on
stills that are identical to the pixel. That spread is the grader arguing with
the rubric's wording, not with the page, and it is the first thing 0.1.3 has
to close: the unstable lists are in each wave's `qa_results.json`.

## Read against the page

Five clusters, in the order they matter:

1. **B1 and B2 on every console still, in every direction.** "A panel or a
   cell edge floats with no rule behind it" and "two cells are separated by
   air". The console's panel is seated on the band's left rule; the flashcard
   is a fixed-ratio object (420 : 680) in the right eight columns and cannot
   reach the band's right rule, so the grader reads it as unseated on every
   console still (AC 01/02, AR 02, in all four directions). **This is the
   instrument-versus-sheet tension the owner set up, and it is his call**:
   seat the pile's column on a rule of its own, let the card span, or exempt a
   pile from B1. Not a wording fix.
2. **A2 and E3 on the sessions page's split and timeline (SB, SC, SD).** The
   lit node's box carries a gold outline BY DESIGN, with a filled diamond; A2's
   prose reads it as "a box outline drawn in gold" and E3 as selection by
   colour alone. **SE passes the same stills**, because on the rail the lit
   item is a diamond and ink with no box. Two readings: the rubric should name
   the lit node's box (pending 0.1.3), or the gold box is a heavier signal than
   the house wants and the axis should light its node the way the rail does.
   The owner's call; both are recorded.
3. **E4 and C5 on a single flashcard.** Every real console holds one card
   today, so "the front card whole and the ones behind it peeking" has nothing
   to peek, and the card's duotone figure carries no FIG bar, which C5 asks
   of a FIGURE. SE's E4 count (16) is this: `card=grid` on a one-card console
   is the same picture. Pending 0.1.3 says a single card is not a pile and a
   flashcard's figure is not a framed figure.
4. **C2 on a driven console (SK 02 in SB, SC).** A still driven to the pile's
   second card has scrolled its own head band out of the frame. Pending 0.1.3.
5. **D1, C6 and D5, sporadic and unstable.** The display face at its 500
   ceiling read as bold on some runs; the split's surplus under the title read
   as pooled slack on some; a cell's caption read as a claim. None survived
   three runs consistently.

**Set level, by eye off the contact sheets (F1–F3):** F1 holds by
construction (the ladders are lawful in code and the figures change side on
the sessions page); F2 holds — the six pages read as one instrument in both
themes, and the light stills re-derive (the parchment sessions page is the
same drawing at the same weights); F3 holds — SC differs from SB only by the
two long rules, SD only by the head and the ordinals, SE only by the timeline
and (on the kit's four-card console) the grid.

## What the directions look like

- **SB house** — the title left, the paragraphs and a readout right, two
  full-height rules, ordinals, the pile, the axis. The reference composition.
- **SC seams** — the same sheet with the two long rules erased. The sections
  read as bands; the head still sits on the seam. Slightly airier, slightly
  less machined.
- **SD editorial** — the kicker alone on the left, the title with its
  paragraphs and readout stacked on the right at the copy measure, no
  ordinals. The grader's best real-page score (27 of 42 keepable), mostly
  because its first screens carry less of the timeline into the split still;
  the owner's read decides whether the stacked head loses the wayfinding.
- **SE grid** — the sessions on a vertical date rail (the phone's own
  layout) and the cards in a static grid, visible only on the kit's four-card
  console. Zero gates failed on the real pages, because the rail's lit item
  carries no gold box.

## Per still, the five real pages

`file` · section · SB · SC · SD · SE (verdict and the checks that failed)

```
AC-parchment  01 split      RETRY B1,C5,E4     RETRY B1,C5,E4     RETRY E4           RETRY B1,B2,E4
AC-parchment  02 console    RETRY B1,B2,E4     RETRY B1,B2,C5     FAIL A2,B3,C5      RETRY B1,B2,E4
AC-void       01 split      RETRY B1,B2,E4     RETRY B1           RETRY B1,B2,C2,E4  RETRY B1,B2,E4
AC-void       02 console    RETRY B1,B2,E4     FAIL A2,B1,B2      RETRY B1,B2,D1     RETRY B1,B2,E4
AR-parchment  01 split      PASS_ C5           RETRY B1           PASS_ C5           PASS_ C5
AR-parchment  02 console    RETRY B1,B2,E4     RETRY B1,B2,E4     PASS_ C5           RETRY B2,C5,E4
AR-parchment  03 cells      RETRY B1           PASS_ C6           PASS               RETRY D5,E4
AR-void       01 split      RETRY B1,C5,E4     PASS_ C5           RETRY B1,B2,C2,D1  RETRY B2,C5,E4
AR-void       02 console    RETRY B1,B2,E4     RETRY B1,B2,E4     RETRY B1,B2,C2,C5  RETRY B1,B2,E4
AR-void       03 cells      PASS               PASS               PASS               RETRY D5
HS-parchment  01 split      FAIL A2,C2,D1,E3   FAIL A2            FAIL A6            PASS
HS-parchment  02 timeline   FAIL A2,B2,E3      FAIL A2,C6,E3      FAIL A2,E3         PASS
HS-parchment  03 steps      FAIL A2,C3         PASS               PASS               PASS
HS-parchment  04 cells      PASS_ C6           PASS_ C6           PASS               RETRY D1
HS-parchment  05 row        PASS               RETRY B1           PASS               RETRY B1
HS-void       01 split      FAIL A2,E3         FAIL A2,E3         FAIL A2,B2,C2,E3   RETRY E3
HS-void       02 timeline   FAIL A2,B2         FAIL A2,B1,B2      FAIL A2            PASS_ C6
HS-void       03 steps      PASS               PASS               FAIL A2            PASS
HS-void       04 cells      RETRY D1           RETRY B1,C6,D1     PASS               PASS
HS-void       05 row        PASS_ C6           PASS               PASS               PASS
MP-parchment  01 split      PASS               PASS               PASS               PASS
MP-parchment  02 prose      RETRY B1           RETRY D1           PASS               RETRY D1
MP-parchment  03 figure     RETRY B1           RETRY B1,B2,E4     PASS               RETRY E4
MP-void       01 split      PASS               PASS               RETRY C2           PASS
MP-void       02 prose      RETRY B1           RETRY B1           RETRY B1,D1        RETRY B1,B2,D1
MP-void       03 figure     RETRY B2,C5,E4     RETRY B2,C5,E4     PASS               RETRY B2,C5,E4
MU-parchment  01 split      PASS               PASS               RETRY E4           RETRY E4
MU-parchment  02 figure     RETRY B2           RETRY B2,C5        PASS               PASS
MU-parchment  03 table      RETRY B1           PASS               PASS               RETRY C5,E3
MU-void       01 split      RETRY B2,E4        RETRY C2,E4        RETRY E4           RETRY E4
MU-void       02 figure     PASS               RETRY B2,C2        PASS               PASS
MU-void       03 table      PASS_ C5           PASS               PASS_ C5           PASS
every close   PASS in every direction (excluded by 0.1.2)
```

## Ruled out

- Re-grading the first house shoot: it was shot before the flashcard head was
  fixed and the rubric excluded the close, so its grades describe a page that
  no longer exists. Its 128 ledger rows carry rubric `0.1` and are filtered
  out of any calibration by version.
- Grading the laptop folder now: the mechanical gate passed it on every real
  page (`minPx` 10.5 against the 8.5 floor); a grade would add 64 unstable
  verdicts to a rubric that has not yet been ticked once.
- Fixing B1 on the pile before the owner has seen it: the tension is the
  brief's own ("Lighthouse … but also the retrofuturistic references").

## Standing conclusion

The sheet passes its own laws (mechanical, zero findings on every real page in
both themes; the variety law in code) and the grader's rubric, at 0.1.2, is
still describing three things the design does on purpose — the flashcard's
lip, the lit node's gold box, a one-card pile — as faults. Two of those are
wording (pending 0.1.3); one is a question for the owner. No direction is
promoted: the ticks decide, and until `ledger.py tick --handback` has read
them, this wave has not happened.

## After the record: the first ruling

The owner's first read of this wave's gallery (the house direction's arcs
overview, first screen) ruled the two full-height rules at the band's edges
out on every page: "we already have our rails". Applied the same hour as
ADR-114 U1; the `rules` knob and direction SC are deleted, so SC's 64 stills
and grades here are the record of a direction that no longer exists, and the
SB/SD/SE stills show a state he has rejected. Wave 02 re-shoots the three
remaining directions at the new state on rubric 0.1.2 with B1 rewritten.

## Record

- `qa_results.json` and `qa_summary.json` (per still, from the gallery) in
  every wave folder; ledger rows +128 per direction on rubric 0.1.2 in
  `evals/ledger.jsonl`.
- `skill/references/eval-log.md`, `skill/references/rubric.md` (0.1.2 and
  the pending 0.1.3), `skill/CHANGELOG.md`, `MEMORY.md`.
- Handback: none yet — the galleries are built and unread.
