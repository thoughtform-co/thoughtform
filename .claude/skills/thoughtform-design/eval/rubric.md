# Design eval rubric

The one source. `scripts/design-eval/judge.mjs` reads THIS FILE at runtime and injects the
schema below into the judge prompt — so editing this file changes the gate, and there is no
second copy to drift from it.

Adapted from the `voidwalker-avatar` eval architecture, whose hard-won rules are carried
over verbatim in spirit: thresholds are per-surface, an unpassable gate is a broken gate,
the red-flag vocabulary is CLOSED, calibration anchors are mandatory, and the human gate is
last.

---

## Two stages, and the order matters

**Stage 1 — MECHANICAL** (`scripts/design-eval/mechanical.mjs`, Playwright).
Computed-style assertions that need no judgment. **A mechanical failure short-circuits the
run** — do not spend a vision judge on a page that fails `grep`.

| Check      | Assertion                                                            |
| ---------- | -------------------------------------------------------------------- |
| `radius`   | every element's computed `border-radius` is `0px`                    |
| `fonts`    | every rendered `font-family` resolves to PT Mono or PP Neue Montreal |
| `shadow`   | no `box-shadow` outside the sanctioned list                          |
| `palette`  | every colour is a value present in the parsed token set              |
| `gradient` | no CSS gradient whose stops fall in the purple/blue hue band         |
| `contrast` | text ≥ 4.5:1, line work ≥ 3:1, composited before measuring           |

⚠ **Composite alphas before measuring contrast.** `rgba(ink, .38)` on two different grounds
is two different ratios, and the raw value is neither.

**Stage 2 — JUDGED** (`scripts/design-eval/judge.mjs`). Screenshots to a vision model at
`temperature: 0` with the schema below.

---

## Verdict schema

One JSON object per frame:

```json
{
  "grammar_fit": 1,
  "hierarchy": 1,
  "density_discipline": 1,
  "gold_discipline": 1,
  "instrument_register": 1,
  "corner_law_ok": true,
  "three_registers_ok": true,
  "field_bleeds": true,
  "red_flags": []
}
```

**Scores, 1–10:**

| Key                   | Asks                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `grammar_fit`         | Do the marks belong to the 12 navigation primitives, used for their stated jobs?           |
| `hierarchy`           | Is there one clear first read? Can you name the claim from across the room?                |
| `density_discipline`  | Is the air distributed, or pooled into a hole? Is anything crowded to fit?                 |
| `gold_discipline`     | Is gold spent ONCE, on wayfinding? (Gold on a title instead of the signal = low.)          |
| `instrument_register` | Research station, not carnival. Does it read as an instrument rather than a poster of one? |

**Booleans:** `corner_law_ok` (one grammar per object, lawful diagonal, square children),
`three_registers_ok` (claim/field/chrome, no fourth), `field_bleeds` (the visual reaches an
edge rather than floating inset).

**`red_flags` — CLOSED vocabulary. The judge may return only these strings:**

`rounded-corners` · `purple-blue-gradient` · `cool-tinted-ground` · `background-fill-active` ·
`gold-overspend` · `third-font` · `wrong-diagonal` · `box-shadow-depth` · `circular-indicator` ·
`green-as-nav` · `decorative-texture` · `italic-emphasis` · `mono-carries-claim` ·
`fourth-register` · `full-width-cta-pair`

⚠ A closed vocabulary is the point. An open one produces a different phrasing of the same
defect every run, which cannot be counted, compared, or regressed against.

---

## Thresholds — PER SURFACE

⚠ **A gate that cannot be passed is not a strict gate, it is a broken one.** A baked 840×1360
card face has no shell chrome and must not be judged on it; a full page is not judged on
face-lab constraints. `—` means ungated: the judge still returns the score and it still lands
in the log, it just does not fail the run.

| Surface       | grammar | hierarchy | density | gold | instrument | booleans           | red_flags |
| ------------- | ------- | --------- | ------- | ---- | ---------- | ------------------ | --------- |
| `page`        | ≥ 7     | ≥ 7       | ≥ 7     | ≥ 8  | ≥ 7        | all true           | []        |
| `panel`       | ≥ 7     | ≥ 7       | ≥ 7     | ≥ 8  | ≥ 7        | all true           | []        |
| `card-face`   | ≥ 7     | ≥ 8       | ≥ 7     | ≥ 8  | ≥ 6        | all true           | []        |
| `diagram`     | ≥ 7     | ≥ 7       | ≥ 6     | ≥ 8  | ≥ 8        | corner + registers | []        |
| `exploration` | ≥ 5     | ≥ 5       | —       | ≥ 7  | —          | corner only        | []        |

`gold_discipline` is the strictest line everywhere, and deliberately: it is the rule most
often broken by accident and the one that most quickly stops the accent meaning anything.

`exploration` is loose because a lab variant is being COMPARED, not shipped. Promoting one to
production re-runs it at its real surface tier.

---

## Calibration anchors — mandatory

The judge is shown, alongside every candidate, screenshots of shipped and sanctioned
surfaces, labelled as such:

- `anchors/landing-hero.png`
- `anchors/casefile-console.png`
- `anchors/card-face-shipped.png`

⚠ **A missing anchor does not fail the run — it silently turns the judge into a critic with
no ground truth, which scores everything about an 8.** The harness must WARN LOUDLY and
refuse to record a verdict as authoritative when an anchor file is absent. This exact failure
(a filename pattern that matched nothing, and nothing said so) is on the record in the
voidwalker log.

---

## The log

`eval/EVAL_LOG.md`, append-only, one line per run:

```
date · surface · candidate · MECH pass|fail(flags) · grammar/hierarchy/density/gold/instrument · red_flags · PROMOTED|REJECTED · note
```

**Rejected candidates are logged too.** The whole point of the log is that the reasoning
survives — a rejection nobody recorded gets re-proposed in three months.

---

## Regression protocol

Any change to this rubric, to the judge prompt, to the anchors, or to the judge MODEL:

1. Re-run the fixed golden set.
2. Compare the **median** of each score against the last logged baseline.
3. A drop > 0.5 means roll back, or log a deliberate acceptance saying why.

Two logs, by design: `EVAL_LOG.md` records RUNS; changes to the method go in the commit
message and in this file's history.

---

## Self-test, both directions

The harness ships a deliberately broken fixture (rounded corners + a purple gradient + Inter)
and the sanctioned anchors. **The fixture must FAIL with the correctly named flags, and the
anchors must PASS.** A gate verified in only one direction is a gate that might be returning
a constant.

---

## Standing

**Advisory, never CI-blocking.** Auto-QA runs before the owner looks, so his attention goes
to a candidate that has already cleared the mechanical floor. **The human gate is last and it
is the real one** — this rubric ranks and catches, it does not decide.
