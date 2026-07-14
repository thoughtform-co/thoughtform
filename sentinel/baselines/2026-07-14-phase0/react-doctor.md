# react-doctor baseline — 2026-07-14 (Phase 0)

`npx react-doctor@0.7.7 . --json` (schemaVersion 3, scope `full`).

> **True post-worktree-prune score.** The prior audit reported **13 / 100**,
> polluted because in-repo git worktrees made react-doctor count the same
> findings 6–7×. With the worktrees pruned, the honest score is **30 / 100**.

> **Cache + build-output gotcha.** react-doctor caches results in
> `node_modules/.cache/react-doctor` and `%TEMP%/react-doctor-cache-<user>`,
> and — because `.next-verify` is a non-standard name — it will scan a
> verification build's output if one is present. To reproduce the clean score,
> delete `.next-verify` and clear both caches before running.

## Scores

| Project               | Score                     | Files analyzed |
| --------------------- | ------------------------- | -------------- |
| `thoughtform-website` | **30 / 100 ("Critical")** | 806            |
| `@thoughtform/ui`     | 76 / 100 ("Needs work")   | 32             |

## `thoughtform-website` findings

- **Total: 1238** — 121 errors + 1117 warnings, across 257 files, 74 rules.

### Top rules (all severities)

| Count | Rule                               | Severity |
| ----- | ---------------------------------- | -------- |
| 248   | `button-has-type`                  | warning  |
| 143   | `control-has-associated-label`     | warning  |
| 69    | `no-impure-state-updater`          | error    |
| 64    | `no-giant-component`               | warning  |
| 55    | `no-inline-exhaustive-style`       | warning  |
| 46    | `no-static-element-interactions`   | warning  |
| 44    | `label-has-associated-control`     | warning  |
| 43    | `dangerous-html-sink`              | warning  |
| 39    | `prefer-module-scope-static-value` | warning  |
| 37    | `click-events-have-key-events`     | warning  |
| 37    | `no-array-index-as-key`            | warning  |

### Error-severity findings (121 total)

| Count | Rule                                                 | Tier |
| ----- | ---------------------------------------------------- | ---- |
| 69    | `no-impure-state-updater`                            | P3   |
| 18    | `no-ref-current-in-render`                           | P3   |
| 10    | `effect-needs-cleanup`                               | P1   |
| 6     | `no-layout-property-animation`                       | P3   |
| 6     | `supabase-rls-policy-risk`                           | P1   |
| 3     | `no-prop-callback-in-render`                         | P3   |
| 3     | `no-hydration-branch-on-browser-global`              | P3   |
| 2     | `no-unguarded-browser-global-in-render-or-hook-init` | P3   |
| 2     | `supabase-table-missing-rls`                         | P3   |
| 1     | `supabase-client-owned-authz-field`                  | P1   |
| 1     | `no-eval`                                            | P0   |

Highest-priority security-flavoured rules present: `no-eval` (P0, ×1),
`dangerous-html-sink` (P1, ×43 warn), `supabase-rls-policy-risk` (P1, ×6),
`insecure-crypto-risk` (P1), `supabase-client-owned-authz-field` (P1, ×1).
These deserve a look independent of the cosmetic a11y bulk.

### Findings by top-level directory

| Findings | Directory     | In product scope?                          |
| -------- | ------------- | ------------------------------------------ |
| 490      | `components/` | yes                                        |
| 405      | `app/`        | yes                                        |
| 286      | `legacy/`     | **no** — archived, excluded from TS/ESLint |
| 23       | `registry/`   | **no** — generated, ESLint-ignored         |
| 18       | `lib/`        | yes                                        |
| 8        | `supabase/`   | partial                                    |
| 4        | `packages/`   | yes (`@thoughtform/ui`)                    |

**Caveat:** react-doctor scans the whole tracked tree; it has no per-path
ignore that mirrors ESLint's. **309 of 1234 findings (25%) live in `legacy/` +
`registry/`** — dead/generated code the product's own ESLint/TS already
excludes. A product-source-only scan would score materially higher than 30.
Kept in the headline number for reproducibility (`react-doctor .` scans them).
