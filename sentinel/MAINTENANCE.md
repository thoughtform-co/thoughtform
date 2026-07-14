# Maintenance — recurrence engine

> **When to open this:** at the start of any non-trivial change, and at the **end** of any conversation that modified code.  
> It connects **bugs** and **new features** to the same durable surfaces: `sentinel/`, `.claude/rules/`, `.claude/skills/`, and [LANGUAGE.md](../LANGUAGE.md).

---

## Cycle A: post-incident capture checklist

Run after **any** code change, before merge/push. If **any** question is _yes_, do the _then_ line before the work is “done”.

| #   | Question                                                                                                                 | If yes, then…                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | Did the fix take **more than two iterations**?                                                                           | Open or extend an ADR in `sentinel/decisions/`.                                                      |
| 2   | Did we **revert** a previous fix or go in circles?                                                                       | Open an ADR; link the prior attempt and what failed.                                                 |
| 3   | Did we discover a **class of bug** (sticky + fixed overlay, scale-edge drift, stale `onEnter`, fast-scroll scrub, etc.)? | Add a **pattern** to [BEST-PRACTICES.md](BEST-PRACTICES.md) with a short title and “why it matters.” |
| 4   | Must **two or more files** change together for the fix to hold?                                                          | Add or extend a **path-scoped** rule in `.claude/rules/` and mirror in `.cursor/rules/*.mdc`.        |
| 5   | Would a **runtime check** (Playwright, manual scroll script, console assert) have caught it earlier?                     | Add steps to the relevant `SKILL.md` debugging recipe, or to this repo’s test notes.                 |
| 6   | Does the fix **change an architectural assumption** (auth, scroll, layers, public API of a feature)?                     | Update or create an **ADR**; don’t only patch code.                                                  |

“Non-trivial” is the OR of the above — not a vibe check.

---

## Cycle B: new-feature scaffolding (before you build)

Use when adding **new surface area** (section, dashboard, public API, major hook), not for one-liners.

1. **Scan** `sentinel/decisions/`, `.claude/rules/`, and `.claude/skills/` for **prior art** in the same domain. Cite it in the ADR you open next.
2. **Open** `sentinel/decisions/NNN-short-name.md` with **Status: Proposed**. Document the **shape**, **alternatives rejected**, and **links** to related ADRs (e.g. 008/010 for anything touching landing v7 + brandmark).
3. **Build.** If a **recurring workflow** appears (debug steps, checklists, compositing invariants), add a `.claude/skills/<topic>/SKILL.md`.
4. **Wire paths:** add `.claude/rules/<area>.md` and `.cursor/rules/<area>.mdc` with `paths` / `globs` and pointers back to the ADR + skill.
5. When shipped: set ADR to **Accepted**; keep rules/skills in sync with reality.

If the feature would **contradict** an existing ADR (e.g. compositing, auth), the contradiction must be **resolved in the ADR** before merge — not as a drive-by.

---

## When to NOT capture

Skip Sentinel updates for **trivial** work so the ledger stays signal-rich:

- Typos, copy-only, comments-only
- Dependency bumps with no API migration
- Generated files (e.g. committed migration outputs) where the _intent_ is already in a prior ADR
- Formatting-only rewrites with no behavior change

If unsure, use **one** of the questions in [Cycle A](#cycle-a-post-incident-capture-checklist) as the bar: a single _yes_ means capture.

---

## Ledger

Chronological record of repo-wide maintenance passes (distinct from the Cycle
A/B capture rules above). Newest first.

### 2026-07-14 — Phase 0 (cleanup plan kickoff)

- **Worktrees pruned:** 6 in-repo + 1 external git worktree removed (~2.6 GB
  freed); 3 merged branches deleted.
- **Guardrail added:** env-gated `NEXT_DIST_DIR` in `next.config.mjs` so
  verification/analyze builds can target `.next-verify` without clobbering a
  running dev server's `.next`. `.next-verify` / `.next-build` added to
  `.gitignore`; matching generated-type globs added to `tsconfig.json` so an
  alternate-distDir build does not auto-rewrite tsconfig. Default behavior is
  byte-identical when the env var is unset; nothing product-visible changed.
- **Baselines captured** in [`baselines/2026-07-14-phase0/`](baselines/2026-07-14-phase0/):
  bundle (landing First Load JS 449.8 kB gzip; three.js core 166.5 kB gzip),
  ESLint (0 errors / 470 warnings), react-doctor 0.7.7 (true post-prune score
  **30/100**, up from the worktree-polluted 13), Playwright smokes (87 pass /
  13 fail / 32 skip), Lighthouse (desktop 99 / mobile 73; mobile LCP 8.2 s).
- **Known-red baseline widened after warm-server verification:** the corridor
  suite reproduces the identical 13 failures against a freshly started,
  pre-warmed dev server, so the reds are not a cold-server artifact. The
  known-red set is the Services-hologram cluster (`:176`/`:203`/`:233` — stale
  tests asserting markup retired by the ADR-029/030/033 Services reworks) plus
  a deterministic iphone-14-only red at `:102`. See
  [`baselines/2026-07-14-phase0/playwright-smokes.md`](baselines/2026-07-14-phase0/playwright-smokes.md).
- Commits: `cca26d7` (guardrail), `489a842` (baselines), and this ledger entry.

---

## Quick links

- Patterns: [BEST-PRACTICES.md](BEST-PRACTICES.md)
- Decisions: [decisions/README.md](decisions/README.md)
- Vocabulary: [LANGUAGE.md](../LANGUAGE.md)
- Root project memory: [CLAUDE.md](../CLAUDE.md)
