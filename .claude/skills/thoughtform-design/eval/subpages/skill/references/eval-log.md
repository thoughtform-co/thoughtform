# Eval log

Append-only. One dated entry per wave: what it cost, what it found, what was
ruled out, and the standing conclusion. A log written afterwards is a
reconstruction; write it in the session that ran the wave.

## 2026-09-20 — the ship is built; nothing graded yet

- Rubric 0.1 written from the reference decode (`DRIVE.md`), the house's laws
  and the owner's three sentences, before any verdict exists. Every check is a
  prediction. Reporting only.
- The negative anchors name what today's `/arcs` should fail (C1, B1, B2, A5,
  C6) and what it should still pass (A1, A3, A6, D2). Wave 00 tests the rubric
  against them; a check that does not fail the pole it names is rewritten as
  0.1.1 before wave 01.
- The candidates are deterministic. Every verdict that moves across three runs
  is the grader's, and the unstable list is the first thing to read.

## 2026-09-20 — wave 00: the register, the negative pole and the fixtures are shot

- **The register strips are written** from six live first screens at
  1440 × 900 (`--register`), readings in `references/register/readings/`:
  Lighthouse 9 rules / 13 radii, Tensorlake 42 / 9, Prime Intellect 30 / 0,
  Hermeus 16 / 0, stripe.dev 34 / 16, Kindled from the local reference file.
  ⚠ Two of the six references carry rounded corners on their first screen:
  the strip proves the RULED grammar and not the corner law, and the rubric's
  grading rules say so.
- **The negative pole is shot** from the pre-change tree on port 3004, lane
  `sa`, into `skill/assets/negative/`: the overview five screens and the Loop
  client page two at 1920 × 1247 (three at 1280 × 720), both themes; 30
  stills. ⚠ The first shoot timed out on every cell: the capture waited for
  every in-view reveal to land, and a reveal in the viewport's last tenth
  never does (the observer's −10 % margin). The wait uses 0.88 now.
- **The fixture panels are shot** as lanes `lawful` / `broken`, both themes.
- **`doctor.py` is clear**: 2 subjects, 6 types, 2 settings, 29 checks
  (26 per frame, 3 set level), every lane a render lane, the grader's key
  present by name. Four warnings, all expected before a first grade.
- **The mechanical gate found the sheet's first defect before any grade
  did:** on `/home-sessions` the readout label, the tick label and the
  step's date at 0.4 alpha painted 3.19:1 on the void, and the 0.5 rung
  4.41:1, against the 4.5:1 floor. Dim TEXT moved to a 0.58 rung
  (`--sh-ink-dim`, 0.64 in light) and the 0.5 rung to 0.54; 0.4 is line
  work only. Also found: the frame inside `.sh-root` (the rail telemetry at
  0.11em and 2.2:1, the chapter row, the footer) has to be excluded from the
  gate, and the gate's whole-page accent count is not the rubric's per-still
  twelve.

## 2026-09-20 — wave 00 graded: the rubric fails the pole, and where it was wrong it was the frame

- 18 stills, 3 runs, 110 seconds, `gemini-flash-latest`. 17 FAIL, 1 PASS
  (the lawful fixture). Unstable: 2 of 18. Full read in
  `evals/waves/wave-00-calibration.md`.
- The pole failed everything it was predicted to fail (C1 B1 B2 A5 C6).
  Of the four it was predicted to pass, only A3 passed. **D2** was a wrong
  prediction (the old hero's title is uppercase sans). **A6** failed on the
  HUD frame's round navigation button, which every still on this site
  carries — the rubric had no sentence excluding the frame. **A1** failed on
  bold uppercase mono card titles read as a label in the wrong face.
- **Rubric 0.1.1:** the grading rules say the frame is never graded; A6 names
  the button; A1's fails-when says what to look at (paragraphs first, then
  small uppercase labels, then a third face); the anchor rows move D2 to
  "should fail" and add the cards still. No severity moved.
- Ruled out: grading the laptop folder of the pole (it says nothing the
  owner's viewport does not, and would double-count the ledger).

## 2026-09-20 — wave 01: four directions, one CSS state, graded on 0.1.2

- 4 × 64 stills at 1920 × 1247 (both themes, one per section) and the house
  direction at 1280 × 720, all in one shoot after the flashcard's head was
  fixed. Mechanical: zero findings on every real page in both themes; the
  kit's whole-page accent count is over the 24 budget by design. Graded three
  times each on `gemini-flash-latest`, ~7 minutes a direction.
- Keepable on the 42 real-page stills: SB 21 · SC 22 · SD 27 · SE 23.
  Unstable: 22–25 of 64 per direction — on identical pixels, which is the
  rubric's wording.
- What the grader is still wrong about on purpose (pending 0.1.3): the lit
  timeline node's gold box (A2/E3, SB/SC/SD fail it and SE's rail passes), a
  one-card pile (E4), a flashcard's figure with no FIG bar (C5), a console
  still driven past its own head band (C2).
- What the grader is right about and only the owner can settle: the pile's
  card does not reach the band's rule (B1/B2 on every console still).
- Full read, per still: `evals/waves/wave-01.md`. Galleries:
  `delivery/review-wave-01-{sb,sc,sd,se}.html`. No handback yet.

## Standing conclusions

- A page's first mechanical run is worth more than its first grade: the
  grader has not seen a still yet and the gate has already moved a token.
- On deterministic stills the unstable list is the rubric's to-do list. A
  third of the verdicts moved across three runs in every direction; rewrite
  those checks in what a grader can see before adding a single new one.
- A wave is one CSS state. A fix found mid-wave re-shoots every direction.
- A check that names something the FRAME carries fails every still on the
  site. The frame is the datum; say so in the grading rules before the first
  wave, not after.
