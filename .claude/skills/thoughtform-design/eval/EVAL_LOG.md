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

2026-08-30 · panel · fixture-bad · MECH fail(radius 2, fonts 3, shadow 1, gradient 1, contrast 1) · 2/3/2/1/1 · rounded-corners+purple-blue-gradient+cool-tinted-ground+background-fill-active+gold-overspend+third-font+circular-indicator · REJECTED · self-test baseline, must always fail
2026-08-30 · panel · fixture-good · MECH pass · 9/9/8/9/8 · no-flags · PROMOTED · self-test baseline, must always pass
