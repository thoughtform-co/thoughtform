# Working in this ship

Subpages - the sheet, graded. An Armada engagement (callsign `turnstone`)
holding all of the project's judgment and none of its pixels. The skill in
`skill/` is the settled part of what good looks like; the harness in `tools/`
is shared machinery and carries no judgment of its own.

## The three traps

1. **`qa.py`'s preamble calls image 2 an identity photograph** whose deviations
   are faults. Here image 2 is a REGISTER of three other sites; the rubric's
   `## Grading rules` override the preamble verbatim. If a run scores every
   still down for not looking like Lighthouse, this is why.
2. **The filename grammar takes letters before the first dash** and a section
   rides in the DRAW, never in a suffix. `S1` would fall to the unknown-shape
   branch with no error anywhere.
3. **The prose contract**: rubric rows are `| ID | check | fails when |
severity |` with no pipe in the prose; `generation.md` needs the heading
   `## What every frame shares` verbatim over one fence, a `**default**` and a
   `**laptop**` paragraph under `## Settings`, and the swap paragraph starting
   with `VIEWPORT.`. Run `python tools/doctor.py` after every edit and read the
   check count it prints.

## Three files are the engagement

| File                             | Holds                                         | Edited by                           |
| -------------------------------- | --------------------------------------------- | ----------------------------------- |
| `armada.toml`                    | Themes, pages, directions, viewports, paths   | anyone, when the brief changes      |
| `skill/references/generation.md` | The capture, the shared block, the settings   | after a graded wave, never before   |
| `skill/references/rubric.md`     | Judgment: the checks, the ladder, the anchors | when the owner says something twice |

The tools read all three at runtime and keep no copy. **Never edit `tools/` to
change what the work looks like.** If a script and one of those files disagree,
the file is right and the script has a bug.

## What is different on this ship

- **Nothing is drawn.** Candidates are Playwright stills from
  `scripts/capture-subpages.mjs` in the site repo. `wave.py`, `generate.py`,
  `explore.py`, `crop.py` are never run.
- **Subjects are themes** (`void`, `parchment`), **types are pages**, **lanes
  are directions**, **draws are sections**, **settings are viewports**.
- **`best` means nothing** when draws are sections. `pick.py` and the gallery's
  "best per slot" compare sections of one page; read the gallery per still.
- **The pixels live in the repo**, gitignored, because every still is
  regenerable from its URL. What is committed: the two register strips, the
  negative pole, the text record.
- **The mechanical gate runs first.** `mechanical.mjs --scope ".sh-root"
--budget 12` per cell; exit 2 refuses the cell, exit 1 is recorded.

## Never

- Commit `.env` or any credential. **Never print a credential value.** Report
  a key by name and, if proof is needed, its length. The grader's key is
  `GEMINI_API_KEY` from the canonical `.env` named in `armada.toml`.
- Re-shoot the negative pole into the anchors. It was shot once from the
  pre-change commit; an anchor that can move is not an anchor.
- Let a grade decide. `qa.py` is advisory until `calibrate.py` says a check
  is gate-ready, and that takes thirty ticked stills.
- Fix a page in the rubric. A repair is a change to the page's source with its
  own still, or a new knob in `lib/sheet/directions.json`.
- Put anything page-specific in the shared block.

## The loop

1. **Shoot** — `node scripts/capture-subpages.mjs --wave <name> --k <ID>` in the site repo.
2. **Sheet** — `python tools/make_contact_sheet.py evals/waves/<wave> --sort slot`.
3. **Grade** — `python tools/qa.py --batch evals/waves/<wave> --runs 3`. Advisory.
4. **Gallery** — `python tools/make_review_gallery.py evals/waves/<wave>`. Never hand over loose files.
5. **Ledger** — `python tools/ledger.py wave evals/waves/<wave>`.
6. **Handback** — the owner ticks; `python tools/ledger.py tick --handback <verdicts.json>`; `python tools/calibrate.py`. **A wave without this step never happened.**
7. **Log** — `evals/waves/<wave>.md`, `skill/references/eval-log.md`, `brief/VOCABULARY.md`, one line in the site's `eval/EVAL_LOG.md`, in the same session.
8. **Report home** — `python tools/harvest.py` at a wave's close.

## Filenames are structure

`<TYPE>-<subject>__<lane>_<nn>.png`: `HS-void__sb_03.png` is the Home sessions
page, dark theme, house direction, section three. The sheet, the picker and the
grader parse type, subject, lane and draw out of the name.

## Commits

`type(scope): what was learned`, not what was edited. When a wave grades worse
than the one before, the commit says so.
