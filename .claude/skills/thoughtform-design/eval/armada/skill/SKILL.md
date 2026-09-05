---
name: interface-kit-visuals
description: >
  Makes and grades Interface kit - the design grid, graded imagery at scale, generated against the real
  subjects with accuracy as a hard gate. Owns the client's own image types,
  the reference discipline, the rubric and its verdict ladder, the wave loop
  and the review gallery. Use when asked for a interface-kit visual, a product shot,
  a banner, an ad still, a wave, a contact sheet, a review page, a prompt for a
  subject, or when a draw comes back with the subject wrong. Triggers on
  interface-kit, the subject names in armada.toml, image types, accuracy, packshot,
  wave, rubric. When asked for a prompt, give the field-proven block
  immediately rather than analysing first.
---

# Interface kit - the design grid, graded

This is one engagement's judgment, encoded. The method it runs on is the
`armada` skill; the machinery is `tools/`. Everything below is this client's,
earned wave by wave, and none of it transfers to another client.

## Serve the prompt first

When someone asks for the prompt for a slot, paste it and stop:

```bash
python tools/wave.py --wave <wave> --print-prompt <TYPE>-<subject>
```

No preamble, no analysis, no offer to improve it. Improving happens after a
wave has been graded and verdicted, not in the moment someone needs a prompt.

## The look, in one paragraph

_(Write it so a stranger could hold it in their head. If it takes a page, the
look is not settled yet and this skill is being written too early.)_

The non-negotiables: **one light source and no fill.** **Grounds in slate,
plaster and pine.** **The only lettering in the frame is the subject's own.**
**Photoreal, never a render.** **Nothing from the brand's refused list.**

## Accuracy is the deliverable

Every subject exists, was photographed, and can be checked against its
photograph. A generated frame that invents a part, doubles a part, moves a
mark or changes a colour is worthless however beautiful it is. So the
identity reference is attached first on every draw, the rubric's A block
grades against it, and the one rule underneath everything is: **the identity
reference is the truth, and a difference between the candidate and the
reference is a fault in the candidate.**

## The image types

The client's own questions, from `armada.toml [types.*]` and
`references/image-types.md`. Not a taxonomy of ours.

## Rules, and the failure each one is here for

_(Every rule names the batch of rejected work that earned it. A rule with its
provenance survives a maintainer who was not there; a rule without one gets
deleted by the next person who finds it inconvenient. None yet — the first
graded wave writes the first one.)_

- **Never chain identity.** The identity reference is always the source
  file, never a previous draw.
- **Two or three references, never more.** Past three the model averages the
  stack.
- **Count the parts before judging the picture.** State counts as numbers.
- **Do it in code if code can do it.** A crop, a mirror, a grade, a
  background swap.
- **Judge the set, never the frame.** The contact sheet comes before anyone
  sees a candidate.
- **A grader verdict is advisory.** A fail means look harder. A check that
  fails a frame the client approved is a defect in the instrument.
- **Never show a client a grey box.** Every slot gets its best frame; a frame
  whose defect is still there goes up with the defect named underneath.
- **Never trust a single grade.** Three runs, majority per check.

## Model router

Dated snapshot in `armada.toml [models.lanes]`. Capability is the rule; the
ids drift. **Switch model on any per-slot defect that survives two draws.**

## The loop

```bash
python tools/wave.py --wave <wave> --n 2               # draw
python tools/make_contact_sheet.py "<wave dir>"        # judge the set
python tools/qa.py --batch "<wave dir>"                # grade, advisory, 3 runs
python tools/pick.py "<wave dir>"                      # best per slot, never from a tie
python tools/make_review_gallery.py "<wave dir>"       # the human gate
python tools/crop.py "<picked dir>"                    # placements, in code
```

Then write the record in the same session: `references/eval-log.md`,
`../prompts/LOG.md`, `CHANGELOG.md`.

## When a frame comes out wrong

1. **Count first.** Most accuracy failures are arithmetic, not aesthetics.
2. **Ask what the zero-generation fix is.** A crop, a different pick, a
   different reference.
3. **Narrow the reference instead of adding words.**
4. **Lock only the failing axis**, and record the defect that motivated the
   lock, so a later round can retire it safely. The most frequent root cause
   of a bad frame is your own previous lock.
5. **Switch model** if it survives two draws.

## Files

| File                              | Holds                                                                  |
| --------------------------------- | ---------------------------------------------------------------------- |
| `../armada.toml`                  | Subjects, types, settings, models, paths                               |
| `references/generation.md`        | Attach order, the shared block, settings, repair clauses, the skeleton |
| `references/image-types.md`       | The types, the difference table, the proof register                    |
| `references/subjects.md`          | Each subject as an object: anatomy, CMF, which file is truth           |
| `references/rubric.md`            | The instrument. Checks live here, parsed at runtime                    |
| `references/eval-log.md`          | Append-only. What each wave cost and taught                            |
| `references/approved-register.md` | What the client approved, and what each item proves                    |
| `../brief/VOCABULARY.md`          | The client's words, decoded                                            |
| `../tools/`                       | The Armada harness. Machinery, no judgment                             |
