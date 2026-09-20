---
name: subpages-sheet-eval
description: >
  Grades the site's subpages - /home-sessions, /arcs, /arcs/<client>, /musings,
  /musings/<slug> and the /test/subpage-kit specimen sheet - as stills of a
  live route at a direction, a theme and a viewport, against a rubric distilled
  from the references the owner named (Lighthouse, Hermeus, Tensorlake, Prime
  Intellect, stripe.dev, Kindled) and the house's own laws. Owns the capture's
  grammar, the register strips, the rubric and its verdict ladder, the wave
  loop and the review gallery. Use when asked to shoot a wave of the sheet,
  grade a direction, compare two knob sets, build the gallery for the owner, or
  read back his ticks. Triggers on the sheet, subpages, the sheet's knobs (head,
  ordinal, rules, card, timeline), the directions SA..SE, turnstone, wave,
  rubric. When asked how to shoot, give the capture command immediately.
---

# Subpages - the sheet, graded

This is one engagement's judgment, encoded. The method it runs on is the
`armada` skill; the machinery is `tools/`. Everything below is this ship's,
earned wave by wave.

## Serve the capture first

When someone asks how to shoot a direction, paste it and stop:

```bash
# in the SITE repo, against the dev server on 3003
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB --port 3003
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB --setting laptop --port 3003
```

No preamble, no analysis. Improving happens after a wave has been graded and
ticked, not in the moment someone needs a still.

## The look, in one paragraph

A subpage is a ruled sheet: content-height sections on a twelve-column band
whose own rules the page draws, inside the site's HUD frame. The head is a
split, never a centred hero. Every section opens on a kicker, an ordinal and a
hairline, and consecutive sections differ. Cells share edges; nothing floats;
zero radius, no shadow, one line weight in one hue at three alphas. Two faces
by role, nothing bold, sentence-case sans. Gold is spent on at most twelve
things a reader can name. Where a page lists a client, a sticky terminal panel
holds a five-row readout beside a pile of portrait flashcards.

## Nothing here is drawn

Every candidate is a Playwright still, reproducible to the pixel from its URL.
`wave.py`, `generate.py`, `explore.py` and `crop.py` are never run; `qa.py`,
`make_contact_sheet.py`, `pick.py`, `make_review_gallery.py`, `ledger.py`,
`calibrate.py` and `harvest.py` are. Image 2 on every grade is the REGISTER of
the still's theme - three reference first screens - and the rubric's grading
rules override the harness preamble that would call it an identity.

## Rules, and the failure each one is here for

- **Draws are sections.** `_01` is the first screen, `_0n` is section n at
  the pin. `best` and `pick.py` therefore compare sections of one page and mean
  nothing; read the gallery per still.
- **The mirror is asserted, never trusted.** The registry the page draws from
  (`lib/sheet/directions.json`) and this ship's lanes and types can drift; the
  capture and `tests/lib/sheet-directions.test.ts` refuse on a mismatch.
- **Wait on what the page computed.** `data-sh-ready` carries the loaded-face
  count, the section count and the live rail height. The substrate lab lost a
  round gating on a value the script had set itself.
- **The theme rides `?theme=`.** `colorScheme` emulation changes nothing here.
- **Mechanical before the model.** `mechanical.mjs --scope ".sh-root"
--budget 12` runs on every cell first; exit 2 refuses the cell's stills,
  exit 1 is recorded and never blocks.
- **The negative pole is shot once.** Today's old `/arcs` from a worktree at
  the pre-change commit, byte-identical into `skill/assets/negative/`. An anchor
  that can move is not an anchor.
- **A wave without `ledger.py tick --handback` never happened.** Cormorant
  graded 217 stills and read back zero ticks; every check there is still
  unlabelled.
- **Deterministic candidates make the unstable list a read on the rubric.**
  Every verdict that moved across three runs is the grader arguing with itself;
  rewrite that check in what a grader can see.

## The loop

```bash
python tools/doctor.py                                      # preflight; read the check count
python tools/qa.py --batch evals/waves/<wave> --runs 3      # grade, advisory
python tools/make_contact_sheet.py evals/waves/<wave> --sort slot
python tools/make_review_gallery.py evals/waves/<wave>     # the human gate
python tools/ledger.py wave evals/waves/<wave>
# the owner ticks in delivery/review-<wave>.html -> verdicts-<date>.json, then THE SAME DAY:
python tools/ledger.py tick --handback evals/waves/<wave>/verdicts-<date>.json
python tools/calibrate.py
```

Then write the record in the same session: `evals/waves/<wave>.md`,
`references/eval-log.md`, `../brief/VOCABULARY.md`, `CHANGELOG.md`, and one
line in the site's `eval/EVAL_LOG.md`.

## Files

| File                              | Holds                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- |
| `../armada.toml`                  | Subjects (themes), types (pages), lanes (directions), settings (viewports) |
| `references/generation.md`        | The capture, the attach order, the shared block, the settings              |
| `references/image-types.md`       | The types, the difference table, the lanes                                 |
| `references/subjects.md`          | Each theme's register strip: what it proves and what it does not           |
| `references/rubric.md`            | The instrument. Checks live here, parsed at runtime                        |
| `references/eval-log.md`          | Append-only. What each wave cost and taught                                |
| `references/approved-register.md` | What the owner approved, and what each still proves                        |
| `../brief/VOCABULARY.md`          | The owner's words, decoded                                                 |
| `../DRIVE.md`                     | The reference decode, per site, dated                                      |
| `../tools/`                       | The Armada harness. Machinery, no judgment                                 |
