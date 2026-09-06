# Eval log

Append, never rewrite. One entry per wave, written in the same session as the
wave. A wave that changed nothing is still an entry, and what was ruled out is
the loudest part.

Each entry, in this order: **Setup** (slots, draws, lanes, rubric version,
wall clock), **The numbers** (verdict counts, most-failed checks, slots with a
usable draw by eye), **The finding** (one paragraph: what this wave taught,
stated so a later round cannot mistake it), **What changed because of it**
(files and versions), **Ruled out**. The numbers include what the wave cost
and the unit ratio it establishes (a motion take against so many stills, a
repair round against a fraction of a wave), because the next routing decision
is made on that ratio and never on a total.

---

## Wave 1 — calibration, (date)

**Setup.**

**The numbers.**

|                                             |     |
| ------------------------------------------- | --- |
| Draws                                       |     |
| PASS                                        |     |
| PASS_WITH_NOTES                             |     |
| RETRY                                       |     |
| FAIL                                        |     |
| Slots with at least one usable draw, by eye |     |
| Cost, and the ratio it sets                 |     |

Most-failed checks:

**The finding.**

**What changed because of it.**

**Ruled out.**

---

## Wave 1 — the interface kit, ten directions, 2026-09-05

**Setup.** 60 candidates: 10 directions x 3 viewports (1280x720, 1440x800,
1920x1247) x 2 themes, each a Playwright still of `/test/interface-kit` at a
knob set, plus 6 control stills from `mount=shipped` serving as the subjects'
identity references. Lane `kit` (chromium), rubric 0.1, grader
`gemini-flash-latest`, `--runs 3 --workers 6`, 372s wall clock. Full record:
`evals/waves/2026-09-05-kit-01.md`.

**The numbers.**

|                      |                  |
| -------------------- | ---------------- |
| Draws                | 60 (+6 controls) |
| PASS                 | 46               |
| PASS_WITH_NOTES      | 3                |
| RETRY                | 6                |
| FAIL                 | 5                |
| Unstable across runs | 31 of 60         |

Most-failed checks: A2 x6, A1 x5, B2 x3.

Clean 6/6: KC (tracking), KD (weight), KE (case). Flagged hardest: KH and KI,
the two station directions, both on A2.

**Cost and the ratio it establishes.** 180 graded calls plus 180 stranger reads
for 60 candidates at 3 runs; 372s of wall clock against roughly 9 minutes for
the capture itself. So a re-grade is CHEAPER than a re-shoot here, which is the
reverse of an image ship and the reason the deterministic-candidate note below
matters: re-running the grader is the cheap way to measure the grader.

**The finding.** The rubric FAILS ITS OWN BASELINE on A1 — the shipped panel,
recomposed byte-for-byte in its boxes, is graded down for spending the accent
too many times to mean anything. That is the measurement the lab was built on,
reached independently by a grader never shown the number. Against it, A2 is
written wrong: five of six non-A1 failures are "a structural line is drawn in
the accent" on the two directions whose whole proposal is to mark a selected
station with an accent LINE rather than a fill. A selection marker is a mark,
not structure; the rubric knows that in prose and A2's wording does not.
And the stranger's read never once said instrument — sixty naive reads, every
one a variant of _dashboard_, on the control as much as on the composite.

**What changed because of it.** Nothing in the rubric, deliberately: a check
edited before the wave that paid for it is a check nobody can trace. A2's repair
is the first row of 0.2. Three things changed in the capture, all found by
LOOKING rather than by a gate: the panel sat 145px off its seat (an absolutely
positioned stage resolves against the PADDING box, and the KA-versus-control
parity gate passed throughout because both stills were wrong the same way); the
replacement gate was itself wrong at 1920 only, because `--instrument-inset` is
a `calc()` and `parseFloat` on the token returns NaN; and `grid=ruled` was
striping invented rules through the brief, which the grader named on its first
pass.

**Ruled out.** Forcing a tracking rung onto the map (its labels are placed
against `MONO_ADVANCE`, so CSS would move glyphs the projection solved for);
keeping gold on the selected cartridge under `accent=budget` (one token strokes
both states, 0.07 against 0.18 of fill — the honest fix is a second token in
`pda.css`, which is production work); grading F1/F2 in the harness rather than
off the contact sheet.

---

## Wave 2 — two levers, against a control that moved, 2026-09-06

**Shot, not graded.** Thirty stills, gates clean, no `qa` run: the thing to look
at is the control, and four directions may not need a grader at all.

|                      |                  |
| -------------------- | ---------------- |
| Draws                | 24 (+6 controls) |
| PASS                 | —                |
| PASS_WITH_NOTES      | —                |
| RETRY                | —                |
| FAIL                 | —                |
| Unstable across runs | not run          |

**What it is.** ADR-092 stage 1 promoted seven of the kit's nine knobs into
production — `grid`, `line`, `track`, `weight`, `case`, `accent`, `material` —
so seven directions and the `KJ` composite were deleted from the registry and
from `armada.toml`. What remains is `KA` (control), `KH` and `KI` (how a station
marks selection) and `KL` (the lip in dawn).

**The finding, before a grader sees it.** Wave 1's control read 200 gold objects,
30 bold text nodes and 11 tracking rungs, and the grader failed it. `mount=shipped`
now mounts the composite, so wave 2's control reads **9 / 0 / 8** — and the six
committed control stills moved in the same commit. A baseline that did not move
here would mean stage 1 had not landed.

⚠ **THE PROBE COUNTS THE WHOLE PANEL AND THE GATE COUNTS THE CONTENT CSS.** The
capture's probe reads 8 tracking rungs (it includes the map's SVG lettering, which
keeps three rungs of its own by ruling); `mechanical.mjs --scope .fl-case --exclude
.fl-pda` reads 4, with 50 % on the `.08em` base. Two scopes, two true numbers.

**Ruled out.** Grading before the owner reads the contact sheet — wave 1's real
finding was that 31 of 60 verdicts were unstable at rubric 0.1 on DETERMINISTIC
candidates, so another run at 0.1 buys noise; A2's repair is still the first row
of 0.2. Full record: [`evals/waves/2026-09-06-kit-02.md`](../../evals/waves/2026-09-06-kit-02.md).
