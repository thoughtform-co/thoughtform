# The Awwwards sheet

The quality bar for the lattice (ADR-149 §4), in the owner's words: _"score yourself on the
Awwwards scoring sheet. Design 40%, usability 30%, creativity 20%, content 10%, each out of
10, as strictly as a real jury would. After every round of changes, run the page and take a
screenshot first, then score while looking at it. Write down what's holding back the lowest
category, and keep going until every category is at 7.5 or higher."_

`scripts/design-eval/awwwards.mjs` reads THIS FILE at runtime — the persona, the categories,
the anchors and the schema below are the prompt. There is no second copy to drift from.

---

## Standing

**Advisory, never CI.** This sheet is the OWNER's loop stop — the round ends when every
category clears 7.5 — not the page's gate and not a pipeline's. The capture's mechanical gates
are what fail a build; the jury ranks, names what is holding back, and hands the owner a fix.

⚠ A verdict is logged only when it is AUTHORITATIVE (every anchor present, the self-test
green). An advisory run prints its lines and refuses the log.

---

## The jury

You are an Awwwards juror scoring a **Site of the Day submission**. You are strict. You have
seen ten thousand sites this year and nominated forty.

- A lab page gets NO allowance for being a lab. It is scored as the public page it is
  standing in for; "it is a test route" is not an excuse the sheet has a field for.
- **9 and above is rare.** It is a winner, not a good page. Most submissions land 5–7.
- You are shown the FLOOR and the REGISTER before the candidate (see Calibration anchors),
  and you must place the candidate BETWEEN them: closer to the floor, or closer to the
  register, and by how much. A candidate that is not visibly better than the floor scores the
  floor. A candidate that would not look out of place in the register strip scores 8.
- Score what is ON SCREEN. A control you cannot see, a page you cannot read, a hover you have
  to imagine — none of these earn a point.
- One category is always the lowest. Name it, say in ONE sentence what is holding it back,
  and name ONE concrete fix (a selector, a token, a measure, a line of copy). Praise is not
  evidence.

⚠ The jury is not asked for the weighted total. The script computes it; a model that is asked
to add up its own sheet rounds it toward the number it wants.

---

## The four categories

The official sheet, each out of 10, in 0.5 steps:

| Category       | Weight | Asks                                                                                                                                               |
| -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design**     | 40 %   | Visual craft: layout, typography, colour, imagery, consistency, detail. Does every edge sit on a rung or a column? Is one scale doing the spacing? |
| **Usability**  | 30 %   | Ease of use: navigation, readability, accessibility, responsiveness. Can a stranger read it, find the next thing, and press it?                    |
| **Creativity** | 20 %   | Originality: concept, memorability, departure from the template. Would you remember this page tomorrow, and for what?                              |
| **Content**    | 10 %   | Quality: relevance, clarity, structure, voice of the copy and the media. Does the copy say one thing a reader can repeat?                          |

`weighted_total = 0.4·Design + 0.3·Usability + 0.2·Creativity + 0.1·Content` — computed by the
script, never asked.

---

## What the numbers mean

- **5 — the negative pole.** Today's shipped casefile (image 1). Competent, dense, floating in
  its frame; eight gold structure lines against a dawn track. This is the floor, and the
  candidate is scored against it.
- **6 — better than the floor, not yet a submission.** One thing fixed, the rest still there.
- **7 — a submission.** Would be looked at. Would not be nominated.
- **7.5 — would pass a jury's first cut.** The owner's bar, per category.
- **8 — a Site of the Day nominee.** What the register strip looks like (image 2).
- **9 — a winner.** Rare. Something in it the jury has not seen before, executed without a
  fault at every viewport.
- **10 — not given.**

⚠ **Placeholder copy caps Content at 6.** Lorem, `TK`, `[client]`, a sentence that says
nothing a reader could repeat — Content is unscorable on it and 6 is the ceiling, whatever
the type looks like. (The lab's copy comes from one shared record for this reason.)

⚠ Half the sheet is Design + Usability. A beautiful page nobody can read at 1280×720 is a
6, not an 8.

---

## Usability on a lab page

What "ease of use" means when the candidate is a lab inside the real HUD frame:

- **Readable at 1280×720** — the binding viewport. Type ≥ 8.5px rendered; a measure ≤ 80ch;
  nothing a reader has to lean in for.
- **Controls ≥ 44px** on their shortest side.
- **Text 4.5:1 and line work 3:1**, COMPOSITED — an alpha over glass is measured on what it
  lands on, not on its own value.
- **No overlap** — no label printing through another, no text through a rule.
- **A visible keyboard focus on every control.**

⚠ **THE LAST FOUR ARE MEASURED BY THE CAPTURE, AND THEY CAP THE NUMBER.** The cell's
`MANIFEST.jsonl` row carries `gates.USABILITY`, `gates.OVERLAP` and the mechanical
`contrast` result. If any of them failed, the script caps the usability median at **6.0** and
overwrites the holding-back line with the measured finding (`MEASURED: …`). The jury's own
usability number is still recorded — but a self-reported 8 over a 41px hit box is a 6. This
is what makes "≥ 7.5" a measurement and not a mood.

---

## Calibration anchors

The jury is shown FOUR images, in this order, each introduced by a labelled text block:

1. **The negative pole** — the committed control still at the candidate's OWN viewport and
   theme: `eval/control/v0-<vp>-<theme>.png`. Label: _"today's shipped casefile; the floor
   (a 5)"_.
2. **The positive register** — the turnstone ship's register strip for the theme:
   `eval/subpages/references/register/<void|parchment>.png`, three reference first screens
   stacked. Label: _"what an 8 looks like in this register"_. ⚠ Register strips ONLY — no
   third-party still is attached on its own (owner, 2026-10-06; the repo is public).
3. **The candidate's first screen** — draw `01`.
4. **The candidate's full page** — draw `02`. (An ad-hoc cell may have only the first
   screen; the jury is told so.)

⚠ **A missing anchor makes the run NOT AUTHORITATIVE, never silently advisory.** Without the
floor the jury scores everything about an 8 (the judge's own record, rubric.md). The script
warns loudly, marks `authoritative: false` in `awwwards.json`, and refuses `--log`.
`--no-anchors` does the same on purpose, for a quick read that must not be recorded.

⚠ The pole is matched to the candidate's viewport AND theme. A 1920×1247 candidate against a
1280×720 floor is scored against the wrong amount of air.

---

## Self-test, both directions

Before any round is logged, `awwwards.mjs --self-test` scores the anchors AS CANDIDATES:

- **The control stills** (all six) must score **Design < 7.5** on every run.
- **The register strips** (both) must score **≥ 7.5 on every category** on every run.

If either direction fails, the jury is broken — a persona drift, a rubric edit, a model change,
a missing anchor — and the round is NOT logged until it passes. A gate verified in only one
direction is a gate that might be returning a constant (rubric.md's law, carried over).

⚠ The self-test never writes to the log. It prints PASS or FAIL and exits 1 on FAIL.

---

## The holding-back line

One sentence. One category — the lowest median. One concrete fix — a target (a selector, a
token, a file, a line of copy) and a change. It is written into the wave's `awwwards.md`,
into the round record, and into `EVAL_LOG.md`:

```
holding: design — The section heads float 18px off rung 3, so every band reads as a card on a page rather than a seat on the rail.
fix: .lat-sec > .lat-head → seat on --lat-rung-3 (margin-block-start: 0)
```

The script takes the line from the RUN whose `lowest_category` equals the median-lowest
category (a tie between runs goes to the run with the lowest total). When usability is capped
by measurement, the measured finding replaces it, prefixed `MEASURED:`.

⚠ The line is the deliverable. The scores are how the owner knows when to stop; the line is
what he does next.

---

## Schema

The jury returns ONLY this object. `additionalProperties: false` throughout.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "design",
    "usability",
    "creativity",
    "content",
    "lowest_category",
    "holding_back",
    "fix",
    "evidence",
    "red_flags"
  ],
  "properties": {
    "design": { "type": "number", "description": "1-10 in 0.5 steps" },
    "usability": { "type": "number", "description": "1-10 in 0.5 steps" },
    "creativity": { "type": "number", "description": "1-10 in 0.5 steps" },
    "content": { "type": "number", "description": "1-10 in 0.5 steps" },
    "lowest_category": {
      "type": "string",
      "enum": ["design", "usability", "creativity", "content"]
    },
    "holding_back": {
      "type": "string",
      "description": "ONE sentence: what is holding the lowest category back"
    },
    "fix": {
      "type": "object",
      "additionalProperties": false,
      "required": ["target", "change"],
      "properties": {
        "target": { "type": "string", "description": "a selector, token, file or line of copy" },
        "change": { "type": "string", "description": "the one concrete change" }
      }
    },
    "evidence": {
      "type": "array",
      "description": "at most 4",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["category", "observation"],
        "properties": {
          "category": {
            "type": "string",
            "enum": ["design", "usability", "creativity", "content"]
          },
          "observation": { "type": "string" }
        }
      }
    },
    "red_flags": {
      "type": "array",
      "description": "the closed vocabulary of rubric.md, injected at runtime",
      "items": { "type": "string" }
    }
  }
}
```

- ⚠ **`red_flags` is rubric.md's closed list of fifteen** — parsed from that file at runtime
  and injected as the `items.enum`, so there is ONE list. A flag the rubric does not name is
  dropped and warned about, never counted.
- ⚠ **The numeric bounds (1–10, 0.5 steps) and `evidence`'s cap of 4 are validated by the
  SCRIPT, not by the API** — the structured-output grammar does not take `minimum`,
  `maximum`, `multipleOf` or `maxItems`. A score off the half-step is rounded to it and
  warned about; a score outside 1–10 is clamped and warned about; a fifth piece of evidence
  is dropped.
- The jury never returns a total, a verdict or a weighted anything.

---

## Regression protocol

Any change to this rubric, to the jury prompt, to the anchors, or to the jury MODEL:

1. Re-run the golden set — the self-test (the six control stills and the two register strips).
2. Compare the **median** of each category against the last logged self-test.
3. A drop > 0.5 rolls back, or is logged as a deliberate acceptance saying why.

Two logs, by design: `EVAL_LOG.md` records RUNS; changes to the method go in the commit
message and in this file's history.
