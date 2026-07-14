# ESLint baseline — 2026-07-14 (Phase 0)

`npx eslint .` (flat config, `eslint.config.mjs`). Exit code **0**.

- **Errors: 0**
- **Warnings: 470**
- Files with findings: 139

The `react-hooks/*` strict rules (React Compiler / `eslint-plugin-react-hooks`
7.x, arrived via `eslint-config-next` 16) are intentionally softened to `warn`
in `eslint.config.mjs`; per-ADR triage is the plan, not a sweep. That is why
the count is high but errors are zero.

## Per-rule breakdown

| Count | Rule                                      |
| ----- | ----------------------------------------- |
| 131   | `react-hooks/immutability`                |
| 130   | `@typescript-eslint/no-unused-vars`       |
| 72    | `react-hooks/purity`                      |
| 52    | `react-hooks/set-state-in-effect`         |
| 46    | `react-hooks/refs`                        |
| 17    | `react-hooks/exhaustive-deps`             |
| 13    | `react-hooks/preserve-manual-memoization` |
| 9     | `@next/next/no-img-element`               |

`react-hooks/*` rules account for **331** of the 470 warnings (70%);
`@typescript-eslint/no-unused-vars` is the single largest non-hooks rule at 130.

Scope excludes (from `eslint.config.mjs`): `**/.next/**`, `node_modules`,
`dist`, `out`, `build`, `legacy/**`, `registry/**`, `public/prototypes/**`,
`.claude/**`, `.cursor/**`, and other tooling/generated paths.
