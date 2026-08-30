# Design eval log

Append-only. One line per run, newest at the bottom. Rejected candidates are logged too —
the point of this file is that the reasoning survives a rejection.

Format:

```
date · surface · candidate · MECH pass|fail(flags) · grammar/hierarchy/density/gold/instrument · red_flags · PROMOTED|REJECTED · note
```

Rubric: `../rubric.md` (the one source; the judge reads it at runtime).

---

<!-- runs below -->
