# wave-00-calibration — the rubric against what is already known

**2026-09-20.** 18 stills at 1920 × 1247 (a second folder, `-laptop`, holds 16
at 1280 × 720 and is not graded): the negative pole — today's OLD `/arcs` and
`/arcs/loop`, shot once from a worktree at the pre-change commit on port 3004,
lane `sa`, both themes — and the site's two fixture panels as lanes `lawful` and
`broken`. Rubric 0.1, three runs, majority per check, `gemini-flash-latest`,
110 seconds.

## What it was for

Not a decision about any page. A wave whose answers are already known, so the
INSTRUMENT can be read: does each check fail the pole it was written to fail,
and pass what the pole still does right?

## What came back

| Still                   | Verdict | Failed                                                         |
| ----------------------- | ------- | -------------------------------------------------------------- |
| AR-void\_\_sa_01        | FAIL    | A1 A6 B1 B2 B3 C1 C2 D1 D2 D4 E3 C6 (parchment); void similar  |
| AR-void\_\_sa_02 … \_05 | FAIL    | A6 B1 B2 C2 D1 D5 E4 C5 C6, with A2 on the gold-outlined cards |
| AC-void\_\_sa_01        | FAIL    | A1 A6 B1 B3 C1 C2 D2 C6                                        |
| SK-void\_\_lawful_01    | PASS    | —                                                              |
| SK-void\_\_broken_01    | FAIL    | A1 A3 A4 A5 A6                                                 |

Most-failed: A6 15 · B1 14 · C2 14 · C6 13 · B2 12 · D1 10 · D5 10 · E4 10.
Unstable across runs: 2 of 18 (`AC-parchment__sa_02`, `AR-parchment__sa_04`).

## Read against the predictions

- **Predicted to fail, and failed:** C1 (the centred hero), B1 and B2 (no
  page rules; a gutter grid of posters), A5 (the cards' scrims and glow), C6
  (the hero over a void). The rubric sees what the owner saw.
- **Predicted to pass, and failed — three of four:**
  - **D2** — the prediction was wrong. The old hero's display title is
    UPPERCASE sans ("THE BRIEFING, AS A PLACE."); it shouts. The anchor rows
    now list D2 under "should fail".
  - **A6** — the grader failed the still on a circular mark, and there is one
    on every still this site can produce: the HUD frame's round navigation
    button at the bottom-left. The rubric had no sentence saying the frame is
    not graded. It has one now (0.1.1), and A6 names the button.
  - **A1** — the old cards letter their titles in BOLD UPPERCASE MONO
    ("PERFECT TED · THE PROPOSAL") over a sans lede; the grader read that as a
    label in the wrong face. The fails-when is rewritten in what a grader can
    see: paragraphs first, then small uppercase labels, then a third face.
- **Predicted to pass, and passed:** A3 (no hue outside the tiers).
- **The fixtures:** `lawful` passes clean; `broken` fails A1 A3 A4 A5 A6 —
  the four predicted plus A4 (its ground is a purple gradient, which is not
  the theme's).
- **F1–F3** are set-level and graded by eye off the contact sheet, not by the
  harness.

## Ruled out

- Grading the laptop folder: the pole at 1280 × 720 says nothing the
  1920 × 1247 stills do not, and its ledger rows would double-count the same
  defects.

## Standing conclusion

The rubric fails the negative pole for the reasons the owner gave, and where
it failed the pole for a reason he did not give, two of the three were the
rubric's fault and are fixed in 0.1.1 (the frame; A1's wording) and one was a
wrong prediction (D2). No check moved its severity. Wave 01 is graded on
0.1.1; the two unstable stills are the first thing to re-read once the owner
has ticked anything.

## Record

- `qa_results.json` beside this file; ledger rows `+36` in `evals/ledger.jsonl`.
- `skill/references/eval-log.md`, `skill/references/rubric.md` (repair
  history), `brief/VOCABULARY.md` unchanged (no owner verdict yet).
- Handback: none — the owner has not seen a gallery. **This wave is not
  finished until `ledger.py tick --handback` has read his ticks.**
