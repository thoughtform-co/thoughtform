# wave-03-calibration — the instrument's checks against the page they replace

**2026-09-21.** The owner's brief turns the Arcs overview into his private
INSTRUMENT (`brief/VOCABULARY.md`, 2026-09-21): a full-screen grid timeline with
the projects plotted on it, then a second screen with the arcs listed per client
"like quests" and a card for the one clicked. Rubric 0.2.0 wrote the two blocks
that judge it — **M** the monitor, **L** the log — before a single instrument
still existed, so every one of their eight rows is a prediction. This wave tests
those predictions against a page whose answer is known: the sheet overview they
replace.

| folder                       | what                                                                | stills |
| ---------------------------- | ------------------------------------------------------------------- | ------ |
| `wave-03-calibration`        | pole SF at 1920 × 1247, both themes · the two fixtures, both themes | 6 + 4  |
| `wave-03-calibration-laptop` | pole SF at 1280 × 720, both themes                                  | 6      |

- **Pole SF is not shot.** It is `wave-02-sb`'s Arcs overview stills 1–3 (the
  split head, the first client console, the house formats), promoted
  byte-identical by `capture-subpages.mjs --promote-pole SF` (sha256 checked on
  every copy) into `skill/assets/negative/` and into both folders here, from
  commit `7124f146`. An anchor that can move is not an anchor, and re-shooting
  the pole would have measured today's dev server rather than the page he saw.
- **Image 3 is attached on every AR still**: the monitor strip
  (`arcs-monitor.jpg`, reference 4) on still 1, the log strip (`arcs-log.jpg`,
  references 1–3) on stills 2 and 3. Both are composed LOCALLY under the ship's
  ignored `references/register/_shots/`; they are third-party game and concept
  art and the repository is public.
- Graded on `gemini-flash-latest`, three runs, majority per check.

## What 0.2.0 said

| Still (1920 × 1247)           | Verdict | Failed                         |
| ----------------------------- | ------- | ------------------------------ |
| AR-void\_\_sf_01              | FAIL    | **A2** B1 B2 M1 M2 M3 M4 (3/3) |
| AR-parchment\_\_sf_01         | RETRY   | M1 M2 M3 M4                    |
| AR-void\_\_sf_02              | RETRY   | B2 L1 L2 L3 L4                 |
| AR-parchment\_\_sf_02         | RETRY   | B1 B2 L1 L2 L3 L4              |
| AR-{void,parchment}\_\_sf_03  | RETRY   | L1 L2 L3 L4                    |
| SK-{void,parchment}\_\_broken | FAIL    | A1 A2 A3 A4 A5 A6              |
| SK-void\_\_lawful             | PASS    | —                              |
| SK-parchment\_\_lawful        | FAIL    | A4                             |

At 1280 × 720 the same shape, with two block-A failures on the pole: A1 on
`AR-parchment__sf_01` (split, 1 of 3 passed it) and A2 on `AR-void__sf_02`
(split, 1 of 3).

## Read against the predictions

- **Every M row failed still 1 and every L row failed stills 2 and 3**, in
  both themes, at both viewports, unanimously — not one of the eight split
  across three runs on any of the twelve pole stills. The reasons the grader
  gives are the stated ones: _"a document sheet with a split head and floating
  card panels"_, _"floating console cards rather than the connected log and
  dossier"_, _"lacks log rows and dossier housing"_.
- **L3 on the console still** was left unpredicted, because a console IS a
  bounded housing. It failed, 3/3 everywhere, and the grader's reading is L3's
  own: the housing is there, but nothing is seated beside it, and a panel that
  floats beside a pile is exactly what the dossier is written against.
- **The stranger's read sorts the pole where the rubric's table puts a
  finding.** Twelve of twelve read as a document — "creative agency portfolio
  page", "service offerings catalogue", "design studio client archive" — and
  none as an operations console, a mission log or a game menu. The prompt did
  not change in 0.2.0, so this is the old question landing on the new answer.
- **B1 and B2 keep failing on the pole as in wave 02** (the seats and the
  seams, splitting as they did there). That is the ruling's cost on the sheet,
  already recorded, and not this wave's to re-read.
- **Predicted to pass block A, and did not: A2 on `AR-void__sf_01`, three runs
  out of three** — where wave 02 had passed A2 on the identical pixels. That is
  the one outcome of this wave the rubric has to answer for.

## The wording defect, and 0.2.1

0.2.0 added a grading-rule bullet that began **"Gold on an AR or AK still
is …"** and then listed the instrument's gold: the strip's kicker, the lit
diamond, the NOW cursor, the filled row, the picked box, the button, the
dossier's designation and lip. Read literally it is a complete list, and it
REPLACES A2's own, which names the console's lip and the flashcards' — so the
pole's gold-lipped console read as unsanctioned gold on the first still that
carries one. Nothing about the pixels changed between wave 02 and today; the
sentence did.

**0.2.1** makes the bullet additive and scopes it: on a still that shows the
monitor or the log, gold MAY ALSO be those objects; a still of the overview
that shows neither is judged on A2's own list. One bullet, its own version
(`calibrate.py` buckets by it), and the 0.2.0 grades kept beside it as
`qa_results.rubric-0.2.0.json` in both folders — the fleet's sidecar name, which
the ledger reads as a rubric-drift series.

## What 0.2.1 says

| Still (1920 × 1247)          | Verdict  | Failed            |
| ---------------------------- | -------- | ----------------- |
| AR-void\_\_sf_01             | RETRY    | M1 M2 M3 M4       |
| AR-parchment\_\_sf_01        | RETRY    | B1 M1 M2 M3 M4    |
| AR-void\_\_sf_02             | RETRY    | B1 B2 L1 L2 L3 L4 |
| AR-parchment\_\_sf_02        | RETRY    | L1 L2 L3 L4       |
| AR-{void,parchment}\_\_sf_03 | RETRY    | L1 L2 L3 L4       |
| the fixtures                 | as 0.2.0 | —                 |

82 seconds, unstable 0 of 10. At 1280 × 720 (56 seconds): the same M and L
failures, unanimous; block A passes by majority on all six, and two stills stay
unstable on ONE run each — A1 on `AR-parchment__sf_01` and A2 on
`AR-void__sf_02`.

- **The A1 run is looking at something real.** At 1280 × 720 the frame's fixed
  THOUGHTFORM wordmark (bottom-left) prints straight over the console's lede,
  and one run of three read the overprint as a third face. That is the sheet's
  collision, not a wording fault, and it is a constraint the instrument is
  designed around: the monitor is exactly as tall as the rails (y 89 → 630 at
  720h) and so ends above the wordmark, and the dossier sticks at the rails'
  extent for the same reason. The instrument's smoke is to assert that no
  instrument text sits under the frame's at rest — written with the page, not
  yet run.
- **The A2 run is the old one**: the console's gold lip, still read as
  structure by one run in three. 0.2.1 moved it from three of three on the
  default still to one of three on this one; the second rung of the fix, if it
  is needed, is the owner's tick rather than a third wording.

## The lawful fixture on parchment is not lawful

`SK-parchment__lawful_01` fails A4 three runs out of three, and **the grader is
right**. `/test/design-eval-fixture?theme=light .fixture-good` paints its panel
on the VOID ground — the fixture's own copy says "full-strength ink on the void
ground" — so under the parchment subject it is a dark panel on a light page. It
failed identically in wave 00, whose record lists only the void row and says the
fixture "passes clean". It has never been a lawful parchment specimen. Two
honest answers, neither taken here: the fixture re-derives on the light theme,
or the ship stops shooting it on parchment.

## Ruled out

- **Re-shooting the pole.** Promoted, never re-shot (the ship's own rule).
- **A third wording for A2 before a tick exists.** One run in three on one
  laptop still is the grader's noise until the owner has said which way it
  should fall.
- **Changing M or L.** They did their job on the only page they can be tested
  against today; the fakes they are written to catch (evenly spaced marks, two
  fills, a floating dossier) are exercised on the instrument kit's fixtures,
  shot with the first instrument wave.

## Standing conclusion

The eight new checks fail the page they replace for the reasons they were
written, at both viewports, in both themes, with zero disagreement between
runs. Where the rubric failed the pole on a check it should have passed, the
cause was one bullet's grammar — a list that read as complete — and it is fixed
in 0.2.1 without touching a check. Wave 03 grades on 0.2.1.

## Record

- `qa_results.json` (0.2.1) and `qa_results.rubric-0.2.0.json` in both folders;
  ledger rows from `ledger.py wave` on both.
- `skill/references/rubric.md` (repair history 0.2.0 and 0.2.1),
  `skill/references/eval-log.md`, `brief/VOCABULARY.md` (the brief, verbatim).
- Handback: none. Like wave 00, this wave is read against predictions, not
  against the owner; it is finished when the first instrument wave's gallery is
  ticked and `calibrate.py` has both to read.
