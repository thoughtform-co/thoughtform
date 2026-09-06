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

| Check         | Assertion                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `radius`      | every element's computed `border-radius` is `0px`                                                                                                                                                                                  |
| `fonts`       | every rendered `font-family` resolves to PT Mono or PP Neue Montreal                                                                                                                                                               |
| `shadow`      | no `box-shadow` outside the sanctioned list                                                                                                                                                                                        |
| `palette`     | every colour is a value present in the parsed token set                                                                                                                                                                            |
| `gradient`    | no CSS gradient whose stops fall in the purple/blue hue band                                                                                                                                                                       |
| `contrast`    | text ≥ 4.5:1, line work ≥ 3:1, composited before measuring                                                                                                                                                                         |
| `weight`      | no text node's computed `font-weight` exceeds 500 (ADR-092's ceiling; mono has no 500 and renders 400)                                                                                                                             |
| `tracking`    | every computed `letter-spacing` on HTML text is one of the four `--track-*` role rungs or 0; the rung count and the top rung's share are PRINTED (ADR-091's two numbers as a standing readout); SVG lettering is noted, not failed |
| `case`        | no PP Neue Montreal text is uppercased by CSS — case ranks only if the sans does not shout                                                                                                                                         |
| `text-shadow` | none in the accent; a void-family shadow over imagery is a legibility scrim and is noted                                                                                                                                           |
| `accent`      | the accent paints no STRUCTURE — a border or outline on a stateless container, divider, frame or list item; every other accent-painted object is a MARK and is counted against the scope's budget (`--budget`)                     |

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

**Flags that are read wrong most often — state the boundary, do not widen it:**

- **`circular-indicator` means a CIRCLE, and a DIAMOND is the correct answer.** A 45°
  square is this system's marker; flagging one is inverting the law it enforces. Only raise
  this for an actual arc, ellipse, `border-radius: 50%`, or a composition built on concentric
  circles. Measured: the judge flagged a diamond wave-front here three runs running, which is
  why the boundary is written down rather than left to the flag's name.
- **`decorative-texture` means a mark with no informational job.** A generative field whose
  density, count or extent encodes something is a RECORD, not decoration — the map's physics
  fields and the card emblems are the standing examples.
- **`gold-overspend` is about COUNT, not area.** One large gold figure is disciplined; three
  small gold things competing is not.

---

## Thresholds — PER SURFACE

⚠ **A gate that cannot be passed is not a strict gate, it is a broken one.** A baked 840×1360
card face has no shell chrome and must not be judged on it; a full page is not judged on
face-lab constraints. `—` means ungated: the judge still returns the score and it still lands
in the log, it just does not fail the run.

| Surface       | grammar | hierarchy | density | gold | instrument | booleans enforced        | red_flags |
| ------------- | ------- | --------- | ------- | ---- | ---------- | ------------------------ | --------- |
| `page`        | ≥ 7     | ≥ 7       | ≥ 7     | ≥ 8  | ≥ 7        | corner                   | []        |
| `panel`       | ≥ 7     | ≥ 7       | ≥ 7     | ≥ 8  | ≥ 7        | corner                   | []        |
| `card-face`   | ≥ 7     | ≥ 8       | ≥ 7     | ≥ 8  | ≥ 6        | corner, registers, field | []        |
| `diagram`     | ≥ 7     | ≥ 7       | ≥ 6     | ≥ 8  | ≥ 8        | corner                   | []        |
| `exploration` | ≥ 5     | ≥ 5       | —       | ≥ 7  | —          | corner                   | []        |

⚠ **`three_registers_ok` and `field_bleeds` are CARD rules, enforced on `card-face` alone.**
They come from the card reference set, where a claim/field/chrome stack and a bleeding visual
are what make a card a card. A panel of pure type has no field to bleed; a diagram has no
three registers. Enforcing them there is precisely the unpassable gate this section opens by
banning — and it was caught that way: the harness's own LAWFUL fixture failed `field_bleeds`
on `panel` while being, by construction, correct. The judge still SCORES both on every
surface and they still land in the log; they just do not fail a surface whose job never
included them.

`corner_law_ok` is enforced everywhere, because every object has corners.

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
