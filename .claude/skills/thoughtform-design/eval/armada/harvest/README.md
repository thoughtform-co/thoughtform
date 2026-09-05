# Harvest

What this engagement learned about how the work is made, packaged for the
home port. `python tools/harvest.py` writes one note per run here, named by
this ship's callsign and nothing else:

```
harvest/<date>-<callsign>.md
```

The callsign is in `armada.toml` under `[engagement].callsign`: one word, a
person's choice, never derived from the client's name. The note, its branch,
its pull request and its stamp at the home port are all called that. The
engagement's `name` and `title` never appear in any of them — they are scrub
phrases, not labels.

## The scrub is the default

`harvest.py` collects the changelog entries, the rubric repairs, the ruled-out
list and the eval log's findings since the last harvest — `[harvest]` in
`armada.toml` says which files those are — and **replaces this client's nouns
before it writes anything**. The engagement's name and title become
`<engagement>`, every subject key and noun becomes `<subject>`, and every
phrase in `harvest/scrub.txt` becomes `<redacted>`. The note reports how many
hits it replaced, per placeholder, and never which words they were.

`--no-scrub` prints the verbatim text to the screen for a person de-clienting
by hand and writes no file. **The unscrubbed copy never leaves the ship.**

## `scrub.txt` — what the toml cannot know

One phrase per line; `#` starts a comment. A scrub knows only the nouns
`armada.toml` names, and most of what must not travel is not in there:

```
# people, spelled as the record spells them
Ilse Marchand
# places and rooms
the north studio
# products and sub-brands the toml has no subject block for
the winter range
# other clients whose names came up in a review
# wave names written in the client's own language
```

Every phrase is matched case-insensitively, whole-word for a single token, and
replaced with `<redacted>`. When the home port finds something in a note that
should not have travelled, the fix is two moves: remove it there, and add the
word here so the next note cannot carry it.

## Before it goes home

```bash
python tools/harvest.py                 # writes harvest/<date>-<callsign>.md
python tools/harvest.py --sweep .       # 0 hits, or it names the files
```

The sweep is the last gate: it greps a directory for this ship's nouns, prints
`path: count` and exits 4 on any hit, and never prints the word it found.

Then the rule at the home port is the method's own: a lesson that arrives from
two ships becomes a law; one that arrives once is a note.

`.last` holds the date of the last harvest so the next run is incremental.
