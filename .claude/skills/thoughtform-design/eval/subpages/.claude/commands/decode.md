---
description: Read a wave's comments into failure modes, vocabulary rows and checks
---

Read what the person said about a wave and turn it into something the
instrument can use. Propose; write nothing until you are told to.

**The wave:** `$ARGUMENTS`

If that is empty, take the newest `verdicts-*.json` beside a wave folder whose
comments have no `decode` rows in `evals/ledger.jsonl` yet.

## What you are doing, and why it is not summarising

Verdict comments name symptoms, not causes. The same defect arrives under
different names on different days, and the same word means different defects
in different weeks. So the job is not to tidy the comments up: it is to find
what the rejected frames **share**, name that once, and check whether the
instrument can already see it.

The client's verdicts are consistent. Their words are approximations. That
asymmetry is the whole reason this file exists.

## Read

- The handback: `verdicts-*.json` beside the wave. The comments verbatim.
- `brief/VOCABULARY.md` — the decoder as it stands. What has already been
  named, and under which of their words.
- `skill/references/rubric.md` — every check, its id, and what it fails on.
- The frames themselves, beside the reference, through the review page. **Check
  the note against the frame before executing it.** A note describing something
  that is not in the picture is a note about a different frame, or about a
  memory.
- `evals/ledger.jsonl` — which comments have already been decoded.

## Then, per commented frame

Put the rejected frames side by side before touching a single one. The shared
geometry is the finding; the individual comment is the symptom.

For each, give:

1. **What they said**, verbatim, with who said it and the date.
2. **What the defect actually is**, in the language of a cause and never of an
   appearance. State the fixture, not the falloff. State what makes the
   boundary, not the statistic that follows from it.
3. **Which check it is.** One of three answers:
   - an existing check id — the instrument can see this and did or did not;
   - **a new failure mode**, with a short slug, when no check names it. This is
     the valuable one: a class of defect with no check fails invisibly for as
     many rounds as you have.
   - **not a defect** — a taste the client is entitled to that the rubric has
     no business grading. Say so and propose nothing.
4. **The fix that worked**, once one has. Empty until it has; a decoder row
   with an invented fix is worse than a missing one.

## What you propose, in three places

- **A `brief/VOCABULARY.md` row** per comment: what they said · what the defect
  actually was · the fix that worked. Their words verbatim, dated.
- **A `ledger.py decode` call** per comment, so the label reaches the
  calibration:

  ```bash
  python tools/ledger.py decode "<file>" --tag <check id or new slug>
  ```

- **A rubric check**, only where the same defect has arrived **twice**. What
  they say twice becomes a check; what they say once stays a note in the
  vocabulary file. A rubric that grows on every comment stops discriminating.

Where a new check is proposed, write it in the rubric's own four-column shape
and say which wave paid for it, so the repair history can carry the scar.

## After thirty comments

Once the vocabulary file holds about thirty decoded comments, do the second
pass: cluster them. Read every row's middle column, propose five to eight
groups that the defects actually fall into, and name each group in the client's
own language. Those groups are the blocks the rubric should have, and they are
usually not the blocks it does have.

Do this **after** the rows exist and never before. A taxonomy proposed from the
brief is a prediction; one proposed from thirty real rejections is a reading.

## When you are told to apply it

Write the vocabulary rows, run the `decode` calls, then:

```bash
python tools/calibrate.py
```

and read what moved. A check that now fails a frame the client approved is a
defect in the instrument: fix the check, record it in the rubric's repair
history with the wave and the date, and keep the frames.
