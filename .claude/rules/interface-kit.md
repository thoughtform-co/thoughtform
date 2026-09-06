# Rule: the interface kit

The design grid and the proof panel recomposed on it, plus the armada ship that
grades a wave of them. Look-dev only — nothing on the landing changes and there
is no flag.

**Paths:** `app/(internal)/test/interface-kit/**` · `lib/interface-kit/**` ·
`scripts/capture-interface-kit.mjs` ·
`.claude/skills/thoughtform-design/eval/{armada,control,waves}/**`

**Read first**

- [ADR-091](../../sentinel/decisions/091-interface-kit.md) — the measurement, the
  eight rules, what the wave found, and the three defects the gates missed.
- [`docs/design/interface-kit/ANALYSIS.md`](../../docs/design/interface-kit/ANALYSIS.md)
  — the numbers, and the two corrections they made to this pass's own plan.
- [`docs/design/interface-kit/README.md`](../../docs/design/interface-kit/README.md)
  — the knobs, the directions, the eight rulings the owner is being asked, the traps.

## Contracts

- **`lib/interface-kit/directions.json` is THE registry, and it has two readers.**
  The page imports it; `scripts/capture-interface-kit.mjs` reads it with
  `readFileSync` and asserts that the ship's `armada.toml` `[types]` still mirror
  it, printing the block to paste on drift. A type without a direction grades a
  still nobody shot; a direction without a type shoots a still nobody grades.
- ⚠ **TYPE IDS ARE LETTERS ONLY.** The armada's filename grammar takes letters
  before the first dash, so `K1` falls to its unknown-shape branch — lane empty,
  draw 0 — and every tool downstream reads a different file than the capture
  wrote, silently. Wave 01 shot `KA…KJ`; since ADR-092 stage 1 the registry is
  `KA`, `KH`, `KI`, `KL` (seven knobs absorbed into production), asserted on every run.
- ⚠ **THE FIRST VALUE OF EVERY KNOB IS PRODUCTION UNTOUCHED.** That is what makes
  `KA` a control rather than a preference, and it is why the capture can assert
  `KA`'s zone boxes against the shipped panel's. A new knob whose default changes
  the render has broken the control.
- **The panel bridge restates a production rule ONLY where a literal blocks a
  token.** Tokens first; every restatement in `interface-kit.css` names the
  literal it is reaching past. `casefile.css` is not edited by this lab.
- ⚠ **`.ik-proof-stage` IS `position: relative`, NEVER `absolute; inset: 0`.** An
  absolutely positioned child resolves against the containing block's PADDING
  box, so an absolute stage inside `.ik-stationbox` hands `.fl-case` a containing
  block starting at zero and the panel sits one whole `--hud-content-inset` too
  far outboard — 145px, laid out correctly, painting cleanly. The capture's seat
  gate is what catches it, and it asks the LAYOUT LAW rather than comparing two
  siblings: the old parity gate passed the whole time because both stills were
  wrong the same way.
- ⚠ **A CUSTOM PROPERTY IS A STRING UNTIL SOMETHING LAYS IT OUT.**
  `--instrument-inset` is a `calc()`; `getPropertyValue` hands back the
  expression and `parseFloat` returns NaN. Resolve through a probe element or the
  check agrees with itself at one viewport tier and disagrees at another.
- **Only the CONTROL can fail the capture.** A direction failing a gate is the
  finding. The gates are the type floor, the two-face rule, zero radius,
  `--ik-t0` equal to `--fl-t0`, and the seat.
- ⚠ **`--ik-t0` MIRRORS `--fl-t0`'s FORMULA BY HAND** and the capture asserts they
  resolve to the same pixel on every cell. A ladder that has drifted from the
  surface it documents is worse than no ladder, and the drift would be one pixel.
- **Two places a rule stopped, and what ADR-092 did about each — neither was
  fixed in the lab.** The map's labels are placed against `MONO_ADVANCE`
  (0.6 + .08), which is why the site's base rung landed at `.08em` rather than
  the kit's `.06`: the map's main rung joins the base with no projection change,
  and the rungs that stay the map's own (`.02` label, `.05` band, `.04` chip —
  each load-bearing for a fit guard) are named constants, decided on stills
  (ADR-092 §4C, stage 1b). And the cartridge fills that were one token for the
  configured AND the open state are two now — `--pda-sel` (the latch, the record
  the reader has open) beside `--pda-hot` (the transient hover / pinned / rail),
  with the estate drawn in `--pda-line` dawn; `hot` is a prop and never a hue.
- **The wave's pixels are gitignored; the six CONTROL stills are committed.** They
  are deterministic renders of a URL, so the record is the asset — but a baseline
  that can move is not a baseline.

## The ship

`.claude/skills/thoughtform-design/eval/armada` — an armada engagement scaffolded
by the harness's own `new_engagement.py`, callsign `osprey`. No harness change
was needed; every tool runs unchanged.

- ⚠ **`qa.py`'s BUILT-IN PREAMBLE CALLS IMAGE 2 AN IDENTITY REFERENCE WHOSE
  DEVIATIONS ARE FAULTS** — correct for a generated photograph, wrong here, where
  image 2 is the shipped design and the candidate is an argument with it. The
  rubric's `## Grading rules` overrides it verbatim, and it is the first thing to
  check if a run starts scoring every direction down for not being the control.
- **The subjects' `identity` IS the control still.** That is the whole join: it
  makes the gallery pair every candidate with the shipped panel at its own
  viewport and theme.
- ⚠ **`doctor.py` LOOKS FOR THE HEADING `## What every frame shares` VERBATIM** in
  `generation.md`, with a fenced block under it. "Still" reads better on this ship
  and silently fails the preflight.
- **The candidates are DETERMINISTIC**, which the harness is not used to: two
  captures produce the same pixels, so every point of verdict spread is the
  grader's. That makes the unstable list a direct read on which checks are badly
  written — 31 of 60 at rubric 0.1.
- **Record in the same session:** `evals/waves/<wave>.md`,
  `skill/references/eval-log.md`, and one cross-reference line in the site's own
  `eval/EVAL_LOG.md`.

## Figma

`UI Exploration` (`2382:2`) of the Brand Codex — the exploration layer, per the
codex map's own "write to the Brand System page only" rule. Node ids are recorded
in
[`figma-codex-map.md`](../skills/thoughtform-design/references/figma-codex-map.md);
update that doc FIRST when they move.

- ⚠ **`Thoughtform/HUD` NOW HAS TWO MODES.** It was dark-only while the site has
  shipped a light theme since ADR-058. Every alpha is re-derived, never inherited.
- ⚠ **PP NEUE MONTREAL IS NOT AVAILABLE TO THIS FIGMA ACCOUNT.** The three Sans
  styles are built on Inter and say so in their descriptions. Sizes and tracking
  are bound, so re-pointing the family is the whole fix when it is installed.
- ⚠ **THE PAGE CARRIES ITS OWN GROUND.** Figma's canvas is white and a collection
  resolves to its FIRST mode, so dark ink — near-white — paints invisibly.

## Verifying

```bash
node scripts/capture-interface-kit.mjs --wave <name>
```

then, from the ship directory, `doctor` → `qa --runs 3` → `make_contact_sheet` →
`pick` → `make_review_gallery`. Full recipe in the lab README.

**Stage 1 comes first**, and costs no model call:

```bash
node scripts/design-eval/mechanical.mjs --url "/test/interface-kit?k=KJ&theme=dark" --theme dark --scope ".fl-case"
```

⚠ **SCOPE TO `.fl-case`, NOT `.ik`** — the lab mounts the real HUD frame, so
`.ik` measures the rail and its instruments and reports 29 contrast failures
that belong to production chrome this pass does not touch. ⚠ **AND RUN IT IN
DARK**: the panel's only existing contrast walk is the LIGHT one from ADR-063
U2, which is how five labels at 3.19–3.41:1 in dark went unrecorded until
2026-09-05 (ANALYSIS.md, defect 9). Scoped and in dark, the control and the
composite are identical but for the active row's 18px gold halo, which
`material=flat` removes — the one rule in this kit with a mechanical proof as
well as a grade.
