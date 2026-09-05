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
2026-08-30 · exploration · v3-emblem r1 (circles) · MECH n/a · 6/6/5/7/5 · circular-indicator · REJECTED · judge right: marks were ctx.arc. Grammar is rect-only pixel art; redrawn as squares + diamond signals
2026-08-30 · exploration · v3-emblem r2 (square marks) · MECH n/a · 6/6/5/7/5 · circular-indicator · REJECTED · judge right again, different target: the keynote FIGURE was concentric CIRCLES. Rebuilt on the L1 norm — concentric diamonds
2026-08-30 · exploration · v3-emblem r3 (diamond fronts) · MECH n/a · 7/7/6/7/7 · circular-indicator · OVERRULED · judge WRONG: it flagged the diamond wave-front, and a diamond is the sanctioned replacement for a circle. Boundary now written into the rubric's flag notes; scores rose 6/6/5→7/7/6 once it was
2026-08-30 · exploration · v3-emblem r4 (marks 3.9→4.7) · MECH n/a · not re-judged · — · PROMOTED TO LAB · judge's residual "dots read circular" was true of the READ though false of the code: a 3.9 half-size renders ~3.7 device px and a rect stops resolving its corners. Sized so squareness is visible, not merely real
2026-09-05 · exploration · interface-kit wave 01 (10 directions x 6 shapes) · MECH n/a · armada rubric 0.1, PASS 46 / PWN 3 / RETRY 6 / FAIL 5, 31 of 60 unstable · A2+A1+B2 · AWAITING OWNER · graded on the armada ship at `armada/`, not by judge.mjs: the candidates are live-surface stills and the control is the baseline, not identity truth. A1 fails the CONTROL, which is the finding. Full record: `armada/evals/waves/2026-09-05-kit-01.md`
