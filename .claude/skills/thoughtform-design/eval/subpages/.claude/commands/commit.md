---
description: Check the session for a breakthrough, write the record, then commit
---

Commit the work in this repo, with the record written first. `$ARGUMENTS` is
a scope hint, if any.

## First, what happened

Read `git status` and `git diff`, and read this session back. Ask whether one
of four events happened:

1. **A verdict.** Someone said the work was good, or not. Quote them verbatim
   in the file the pointer names (a vocabulary file, a review log, the wave
   log), and write one `[verdict]` line in `MEMORY.md` pointing at it.
2. **A breakthrough.** A thing worked and a skill, rule, rubric or reference
   changed because of it. One `[breakthrough]` line in `MEMORY.md`, pointing
   at the change.
3. **A defect closed for good**, or **something ruled out**. One untagged line
   under `## Learned` or `## Ruled out`, with the reason and a pointer.
4. **A result worse than before.** It goes in the commit subject, and in the
   eval log where one exists. A record that only holds wins cannot be used to
   make decisions.

If none happened, say "nothing for the record" and move on. Never invent one:
an empty record is true, a padded one is not.

## Then, the record

- The `MEMORY.md` line is one line in the grammar
  (`- YYYY-MM-DD [tag] text -> pointer`), about 160 characters at most. If the
  file is near 120 lines, compress first: merge and shorten, remove arguments,
  keep every ruling and every pointer.
- A `CHANGELOG.md` entry (`skill/CHANGELOG.md` on a ship) only when how the
  work is made changed.
- Where `tools/memory.py` is aboard, run `python tools/memory.py --check` and
  fix what it names. Where `tools/ledger.py` is aboard, run
  `python tools/ledger.py --check`: it exits 4 when a row carries one of this
  repo's own nouns, and that is a defect in whatever wrote the row.

## Then, the commit

`git commit -m "type(scope): what was learned"`. One line. What was learned,
not what was edited. A body only when it carries evidence. Never a file list,
never a summary of the diff, never a flourish. Stage what belongs; never
`git add -A` from outside the repo root.
