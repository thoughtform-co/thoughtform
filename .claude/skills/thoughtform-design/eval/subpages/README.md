# Subpages - the sheet, graded

The eval pipeline for the site's subpages (ADR-114): a wave of Playwright
stills of the sheet's routes at a direction, a theme and a viewport, graded
against a rubric distilled from the references the owner named, and put in
front of him as a gallery. Built on Armada: the harness is shared, the judgment
is this ship's. Callsign `turnstone`.

| Read this                        | For                                                               |
| -------------------------------- | ----------------------------------------------------------------- |
| `CLAUDE.md`                      | How to work here: the three traps, the loop, what is different.   |
| `MEMORY.md`                      | What this ship decided, learned and ruled out. Read it first.     |
| `DRIVE.md`                       | Where the pixels live, and the reference decode.                  |
| `armada.toml`                    | The structure: themes, pages, directions, viewports.              |
| `brief/BRIEF.md`                 | What was asked, distilled.                                        |
| `brief/VOCABULARY.md`            | The owner's words, decoded.                                       |
| `skill/SKILL.md`                 | The encoded workflow.                                             |
| `skill/references/rubric.md`     | The instrument. Checks live here, not in code.                    |
| `skill/references/generation.md` | How a still is made: the capture, the shared block, the settings. |
| `skill/references/eval-log.md`   | What each wave cost and taught.                                   |

## The maker lives in the site repo

```
node scripts/capture-subpages.mjs --register                                   # once: the two register strips
node scripts/capture-subpages.mjs --control --wave wave-00-calibration --port-old 3004 --headed
node scripts/capture-subpages.mjs --fixture --wave wave-00-calibration
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB                    # a direction, all six pages
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB --setting laptop
```

## The tools that run here

```
tools/doctor.py               preflight: config, prose, rubric, identities, keys by name
tools/qa.py                   grades against rubric.md, parsed at runtime; three runs, majority
tools/make_contact_sheet.py   judge the set before the frame (--sort slot)
tools/make_review_gallery.py  the page the owner ticks
tools/ledger.py               the grader's rows, then the owner's ticks (tick --handback)
tools/calibrate.py            per check: does it agree with the person?
tools/harvest.py              what this ship learned, packaged for the fleet, nouns scrubbed
```

`wave.py`, `generate.py`, `explore.py` and `crop.py` are never run: nothing
here is drawn.
