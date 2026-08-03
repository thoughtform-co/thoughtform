# ADR-009: Repo Structure Conventions and Deferral of Further Reorg

**Date:** 2026-04  
**Status:** Active

---

## Context

After the route-group restructure (`(marketing)`, `(admin)`, `(internal)`) and the extraction of `gateway/`, `particles/`, and `landing/v7/` from the monolithic `hud/` folder, the repo structure is in a coherent state but still mid-transition. Several areas touch active production paths (V7 landing pipeline, celestial connectors, middleware routing).

A repo structure audit confirmed the layout is broadly healthy for a Next.js 14 app with Supabase, Storybook, Playwright, and a workspace package. The main structural tension is the V7 prototype pipeline spanning `lib/v7-parse.ts`, `public/prototypes/v7/`, and `components/landing/v7/` â€” a coupling that works but is non-obvious.

---

## Decision

1. **No further broad folder moves** until the current route-group and V7 transition is committed, stable, and deployed.
2. **Documentation-first cleanup**: the canonical repo map lives in `README.md`, conventions in `CLAUDE.md`, and architectural decisions in `sentinel/decisions/`.
3. **Conventions for new work** (not retroactive renames):
   - Feature barrels are the preferred import path; the root `components/index.ts` is historical only.
   - New Supabase migrations use `YYYYMMDD_descriptive_name.sql` naming.
   - New public pages go in `(marketing)`, admin tools in `(admin)`, dev routes in `(internal)`.
4. **Deferred until later** (only when motivated by a real problem):
   - Moving or restructuring `public/prototypes/v7/` out of `public/`.
   - Merging or deleting parallel V7 entry points (`LandingV7.tsx`, `prototypeRuntime.ts`).
   - Splitting `(admin)` into multiple route groups.
   - Renaming `legacy/` contents or extracting reusable pieces.

---

## Consequences

### Positive

- Zero risk of breaking production routing, middleware, or the V7 landing pipeline.
- New contributors and agents can understand the repo from `README.md` and `CLAUDE.md` without archaeology.
- Conventions prevent future drift without requiring a big-bang cleanup.

### Negative

- Some historical inconsistencies remain (un-dated migration filenames, partially stale barrels, dual V7 entry paths).
- The V7 prototype coupling (`public/` as source, not just asset serving) stays undocumented beyond comments and this ADR.

---

## References

- Repo map: `README.md` (Architecture section)
- Conventions: `CLAUDE.md` (Conventions section)
- V7 swap history: `docs/V7_SWAP_CHECKLIST.md`
- Legacy archival: `sentinel/decisions/004-legacy-code-archival.md`
- V7 compositing: `sentinel/decisions/008-landing-v7-background-layers.md`

---

## Update 1 â€” documentation consolidates to two homes; `legacy/` is deleted (2026-07-23, owner)

**Why:** an owner review of the repo root asked whether the top-level files should
be reorganised. The audit found the root itself is NOT the problem â€” of 27 tracked
root files, ~20 are pinned there by tooling (Next.js resolves `next.config.mjs`,
`proxy.ts`, `instrumentation.ts`, `tsconfig.json`, `postcss.config.mjs` from
the root only; npm/Vercel/ESLint/Prettier likewise; `CLAUDE.md`, `AGENTS.md`,
`.cursorrules` must sit at root for the agent tooling to load them). Moving those
would break the build or force config-path indirection for no gain.

The real problems were one level down:

1. **Documentation lived in six places** â€” root (7 `.md`), `docs/`, `design/`,
   `plans/`, `sentinel/`, `.linear-issues/` â€” which is what actually made the tree
   read as chaotic.
2. **`legacy/` was 130 files / 1.4 MB of provably dead code** (see ADR-004
   Update 1, which owns that deletion).

**Decision â€” documentation has exactly TWO homes:**

- **`sentinel/`** â€” the decision system. ADRs, `BEST-PRACTICES.md`,
  `MAINTENANCE.md`, `research/`, `baselines/`. Unchanged; this is the tree CLAUDE.md
  points at and it keeps its meaning. Do NOT put mockups or scratch plans here.
- **`docs/`** â€” everything else, absorbing the strays:
  - `design/` â†’ `docs/design/` (mockups, brand explorations, inspiration; ~31 MB)
  - `plans/` â†’ `docs/plans/`
  - `.linear-issues/` â†’ `docs/issues/` (also un-hides it â€” a dotfile directory read
    as tooling config when it is really project documentation)

This takes six documentation locations to two. The four movable root markdowns
(`DESIGN.md`, `LANGUAGE.md`, `ROADMAP.md`, `SECURITY-SUPPLY-CHAIN.md`) were
deliberately LEFT at root this pass â€” the owner scoped the change to directory
consolidation, and root markdown is a discoverability surface.

**Knock-on fixes:** `eslint.config.mjs` (`.linear-issues/**` â†’ `docs/**` as the
non-source ignore), the ADR-018 plan link, the `thoughtform-design` skill's atlas
reference in both `.claude/` and `.agents/` (which pointed at an already-stale
`design/mockups/â€¦` path), and the `docs/issues/README.md` self-references.

**Bonus â€” deploy payload.** `.vercelignore` was carefully excluding ~33 MB of
`public/` assets for build perf (2026-07-14 pass) while `design/` (~31 MB) and
`sentinel/` (~10 MB) uploaded on every single deploy. Consolidation made this a
two-line fix: `docs` + `sentinel` are now excluded. Verified first that no
build-time code reads either path â€” nothing in `app/`, `lib/`, `components/`,
`scripts/`, or `next.config.mjs` does.

**This supersedes Decision Â§1's "no further broad folder moves"** â€” that deferral
was explicitly conditioned on "only when motivated by a real problem", and the
six-way doc sprawl was one. Â§3's conventions for new work are unchanged. The
`legacy/` clause of Â§4 is resolved by deletion rather than renaming (ADR-004 U1).

**Still deliberately deferred** (unchanged from Â§4, and reaffirmed): moving
`public/prototypes/v7/` out of `public/`, merging the parallel V7 entry points, and
splitting `(admin)`. **Explicitly rejected this pass: a `src/` migration** â€” it
would invalidate path references across ~50 ADRs, every glob in `.claude/rules/`,
every skill trigger path, and the parse-pipeline docs, for zero functional gain;
`app/ components/ lib/ public/ types/ tests/` is already the standard Next.js shape.

**Verification:** typecheck clean, lint 0 errors (308 pre-existing warnings,
unchanged count), 350/350 unit tests, production build succeeds.
