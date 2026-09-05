# Working in this repo

Interface kit - the design grid, graded. An Armada engagement: all of the project's judgment and code, none
of its pixels. The skill in `skill/` is the settled part of what good looks
like here; the harness in `tools/` is shared machinery and carries no
judgment of its own.

## The one rule that matters

**Recipe in Git, pixels in Drive.** Never commit generated output. Sources,
generation waves and review galleries live at the path in `DRIVE.md`.
`.gitignore` excludes images by default and opts three homes back in:
`references/`, `skill/assets/`, and the text record inside `evals/waves/`.
Before adding any image, ask: _does this change how the work is made, or does
it just show what it looked like?_ Only the first belongs here.

## Three files are the engagement

| File                             | Holds                                                     | Edited by                            |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------ |
| `armada.toml`                    | Structure: subjects, image types, settings, models, paths | anyone, when the brief changes       |
| `skill/references/generation.md` | Prose: the shared block, settings, repair clauses         | after a graded wave, never before    |
| `skill/references/rubric.md`     | Judgment: the checks, the ladder, the anchors             | when the client says something twice |

The tools read all three at runtime and keep no copy. **Never edit `tools/` to
change what the work looks like.** If a script and one of those files
disagree, the file is right and the script has a bug.

## Never

- Commit `.env`, `.env.txt` or any credential. **Never print a credential
  value.** Report a key by name and, if proof is needed, its length.
- Attach a previous draw as the identity reference. Output as the next input
  drifts the subject across a set.
- Re-encode a reference or an anchor. They are inputs to a validated pipeline;
  a resize changes what the model produces months later with no error to warn
  you.
- Delete a reject. Losers move to `superseded/` with the reason. The
  highest-value entry in either log is something tried and rejected.
- Port another client's checks, anchors, thresholds or router entries. The
  machinery is shared; the judgment is this client's and has to be earned
  here.
- Let a grade decide. `tools/qa.py` is advisory until the rubric says
  otherwise, and the rubric only says so after roughly thirty verdicted draws.
- Put anything slot-specific in the shared block. A paragraph there outranks
  every slot line beneath it.

## The loop

1. **Draw** — `python tools/wave.py --wave <name> --n 2`. Manifest line per draw, beside the output.
2. **Sheet** — `python tools/make_contact_sheet.py "<wave dir>"`. Judge the set before the frame.
3. **Grade** — `python tools/qa.py --batch "<wave dir>"`. Three runs, majority, advisory.
4. **Pick** — `python tools/pick.py "<wave dir>"`. Never from a tie.
5. **Gallery** — `python tools/make_review_gallery.py "<wave dir>"`. Never hand over loose files.
6. **Log** — `evals/waves/<wave>.md`, `prompts/LOG.md`, `skill/references/eval-log.md`, in the same session. A log written afterwards is a reconstruction.
7. **Report home** — `python tools/harvest.py` at a wave's close or at handover, then `--sweep .`. Scrubbed by default, named `harvest/<date>-<callsign>.md`; what the toml cannot know goes in `harvest/scrub.txt`. Lessons travel; this client's words do not.

Then the client's verdicts go into `brief/VOCABULARY.md` verbatim and dated.
What they say twice becomes a check.

## Filenames are structure

`<TYPE>-<subject>__<lane>_<nn>.png`, with `__r2` between slot and lane for a
repair draw. The sheet, the picker and the grader parse type, subject, repair
and draw out of the name; a wave that shares one prefix collapses into one
tile.

## Commits

`type(scope): what was learned`, not what was edited. When a wave grades worse
than the one before, the commit says so. A record that only holds wins cannot
be used to make decisions.
