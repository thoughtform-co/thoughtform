# Harvest - turnstone - 2026-09-20

Harness 0.8.3. Rubric 0.1.2, reporting only. Waves run: 2.
Since: the beginning.

What this ship learned about how the work is made, for the home port.
Lessons travel; client words do not. A lesson that arrives from two
ships becomes a law in SKILL.md; one that arrives once is a note in
the owning reference. Nothing below has been promoted yet.

## Breakthroughs

- 2026-09-20 [verdict] the owner's brief, three sentences that became the variety law, the console and the negative pole -> brief/VOCABULARY.md
- 2026-09-20 [breakthrough] wave 00 graded: the rubric fails the negative pole on every check it named; the three wrong pass-predictions were the frame's round button (A6), bold mono card titles read as the wrong face (A1) and a title that really shouts (D2); rubric 0.1.1 excludes the frame and rewrites A1 -> evals/waves/wave-00-calibration.md

## Changes to how the work is made

### 2026-09-20 (skill/CHANGELOG.md)

- The ship is scaffolded from the harness's `new_engagement.py` (0.8.3),
  callsign `turnstone`, and the three imagery-template documents are replaced
  with the sheet's: subjects are themes with register strips for identity,
  types are pages with the route in `shot`, lanes are directions, draws are
  sections, settings are viewports.
- Rubric 0.1, reporting only, with the negative pole as its first anchors.
- `scripts/capture-<engagement>.mjs` in the site repo is the maker: it asserts the
  mirror, runs the mechanical gate per cell, waits on `data-sh-ready`, shoots
  one still per section, and writes the manifest in the ship's grammar.
- Wave 00 graded (18 stills, 3 runs): the rubric fails the negative pole on
  every check it named; rubric 0.1.1 excludes the HUD frame (A6 had failed on
  its round navigation button on every still) and rewrites A1.
- Wave 01's first read (the house direction, 64 stills, 28 unstable) found one
  page defect — the flashcard's kicker ran into its title — and two rubric
  defects: the flashcards' folder lip read as a gold outline (A2 now excepts it
  beside the console's) and the close graded as a section (excluded). Rubric
  0.1.2. The sheet's fix meant one consistent re-shoot of all four directions;
  the capture's manifest write became idempotent (a re-shot file replaces its
  row) and its theme read stopped gating every dark cell on a null attribute.

## Rubric repairs (checks that were wrong about what they were for)

- **0.1, 2026-09-20, before wave 00.** First skeleton. Every check is a prediction. The negative anchors below name what today's `/arcs` should fail and what it should still pass; a check that does not fail the pole it names is rewritten as 0.1.1 before wave 01.
- **0.1.1, 2026-09-20, after wave 00 (18 stills, 3 runs, 2 unstable).** The pole failed everything it was predicted to fail. Three of the four checks it was predicted to PASS failed too, and only one of those was the rubric's error: **D2** was a wrong prediction (the old hero's display title IS uppercase sans; the anchor row is corrected). **A6** failed on the HUD frame's round navigation button at the bottom-left, which every still on this site carries, so the grading rules now say the frame is never graded and A6 names the button. **A1** failed on the old cards' bold uppercase mono titles read as "a label in the sans face"; its fails-when now names what to look at. No check moved its severity.
- **0.1.2, 2026-09-20, after the first read of wave 01 (the house direction, 64 stills, 28 unstable).** Two more things the instrument was wrong about and one it was right about. **A2** failed every console still on "a card outline drawn in gold": the flashcard's lip is the proof card's own folder device (ADR-097), the one gold outline the house draws on a card, so A2's exception names it beside the console's. **The close** — the last still of every page — is the site's shared footer, judged in its own record (ADR-105) and carrying a kept-dark plate by design; it failed A4, B1, C1, C2 and C5 as if it were a section, so the grading rules now exclude it. And the grader was RIGHT about the flashcard's head: the kicker ran into the title on one line, which is a page defect and is fixed in the sheet, not here.
- **Pending 0.1.3 — written down, not applied, so wave 01's grades stay on the text that produced them.** (1) **A2 / E3 on the timeline:** the lit node's box carries a gold outline BY DESIGN (the one lit thing on the axis, with its filled diamond); A2's prose reads it as a gold box outline and E3 as selection by colour alone. Name the lit node's box as the third gold outline the sheet draws. (2) **C2 on a driven console:** a still of a pile driven to its second card has scrolled its own head band out of the frame; C2 passes on it. (3) **C5 / E4 on a flashcard:** the card's figure is not a framed figure and carries no FIG bar; a single card is not a pile. (4) **B1 on the pile:** a fixed-ratio card cannot span to the band's rule, and the grader fails it as unseated on every console still — a real question for the owner (seat the pile's column on a rule, or exempt piles), not a wording fix.

## Ruled out

### From the memory file

- 2026-09-20 `dark` / `light` as subject keys: config.nouns() scrubs subject keys from every harvest note -> armada.toml
- 2026-09-20 `best` per slot as a decision: draws are sections of one page and pick.py compares them -> skill/references/generation.md
- 2026-09-20 [breakthrough] wave 00 graded: the rubric fails the negative pole on every check it named; the three wrong pass-predictions were the frame's round button (A6), bold mono card titles read as the wrong face (A1) and a title that really shouts (D2); rubric 0.1.1 excludes the frame and rewrites A1 -> evals/waves/wave-00-calibration.md
- 2026-09-20 the mechanical gate found the sheet's first defect before any grade: dim text at 0.4 alpha painted 3.19:1; dim text sits on a 0.58 rung now -> skill/references/eval-log.md
- 2026-09-20 wave 01 graded on 0.1.2: keepable on the real pages SB 21 / SC 22 / SD 27 / SE 23 of 42; a third of every direction's verdicts unstable on identical pixels, which is the rubric's wording -> evals/waves/wave-01.md
- 2026-09-20 the flashcard's head ran the kicker into the title; fixed in the sheet and the whole wave re-shot, because a wave is one CSS state -> evals/waves/wave-01.md
- 2026-09-20 the grader is told what it may not grade: the HUD frame (0.1.1), the close and the folder lip (0.1.2) -> skill/references/rubric.md
- 2026-09-20 grading the laptop folder before a first handback: 64 more unstable verdicts on an unticked rubric -> evals/waves/wave-01.md
- 2026-09-20 fixing B1 on the pile before the owner has seen it: the instrument-versus-sheet tension is the brief's own -> evals/waves/wave-01.md

## The findings (eval logs)

### 2026-09-20 — the ship is built; nothing graded yet (skill/references/eval-log.md)

- Rubric 0.1 written from the reference decode (`DRIVE.md`), the house's laws
  and the owner's three sentences, before any verdict exists. Every check is a
  prediction. Reporting only.
- The negative anchors name what today's `/arcs` should fail (C1, B1, B2, A5,
  C6) and what it should still pass (A1, A3, A6, D2). Wave 00 tests the rubric
  against them; a check that does not fail the pole it names is rewritten as
  0.1.1 before wave 01.
- The candidates are deterministic. Every verdict that moves across three runs
  is the grader's, and the unstable list is the first thing to read.

### 2026-09-20 — wave 00: the register, the negative pole and the fixtures are shot (skill/references/eval-log.md)

- **The register strips are written** from six live first screens at
  1440 × 900 (`--register`), readings in `references/register/readings/`:
  Lighthouse 9 rules / 13 radii, Tensorlake 42 / 9, Prime Intellect 30 / 0,
  Hermeus 16 / 0, stripe.dev 34 / 16, Kindled from the local reference file.
  ⚠ Two of the six references carry rounded corners on their first screen:
  the strip proves the RULED grammar and not the corner law, and the rubric's
  grading rules say so.
- **The negative pole is shot** from the pre-change tree on port 3004, lane
  `sa`, into `skill/assets/negative/`: the overview five screens and the <redacted>
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
  step's date at 0.4 alpha painted 3.19:1 on the <subject>, and the 0.5 rung
  4.41:1, against the 4.5:1 floor. Dim TEXT moved to a 0.58 rung
  (`--sh-ink-dim`, 0.64 in light) and the 0.5 rung to 0.54; 0.4 is line
  work only. Also found: the frame inside `.sh-root` (the rail telemetry at
  0.11em and 2.2:1, the chapter row, the footer) has to be excluded from the
  gate, and the gate's whole-page accent count is not the rubric's per-still
  twelve.

### 2026-09-20 — wave 00 graded: the rubric fails the pole, and where it was wrong it was the frame (skill/references/eval-log.md)

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

### 2026-09-20 — wave 01: four directions, one CSS state, graded on 0.1.2 (skill/references/eval-log.md)

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

### Standing conclusions (skill/references/eval-log.md)

- A page's first mechanical run is worth more than its first grade: the
  grader has not seen a still yet and the gate has already moved a token.
- On deterministic stills the unstable list is the rubric's to-do list. A
  third of the verdicts moved across three runs in every direction; rewrite
  those checks in what a grader can see before adding a single new one.
- A wave is one CSS state. A fix found mid-wave re-shoots every direction.
- A check that names something the FRAME carries fails every still on the
  site. The frame is the datum; say so in the grading rules before the first
  wave, not after.

## Sections this ship named

None named in [harvest].sections.

## Waves

wave-00-calibration, wave-01

## De-clienting

Replaced 3 hits: <engagement> x1, <redacted> x1, <subject> x1.
A scrub knows only the nouns armada.toml names and the phrases in
harvest/scrub.txt. Read the note once more for quotes, people,
places and product details before it is merged; anything found
here is removed and the ship's scrub list gains the word.
