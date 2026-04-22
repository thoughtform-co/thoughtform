# ADR-009: Repo Structure Conventions and Deferral of Further Reorg

**Date:** 2026-04  
**Status:** Active

---

## Context

After the route-group restructure (`(marketing)`, `(admin)`, `(internal)`) and the extraction of `gateway/`, `particles/`, and `landing/v7/` from the monolithic `hud/` folder, the repo structure is in a coherent state but still mid-transition. Several areas touch active production paths (V7 landing pipeline, celestial connectors, middleware routing).

A repo structure audit confirmed the layout is broadly healthy for a Next.js 14 app with Supabase, Storybook, Playwright, and a workspace package. The main structural tension is the V7 prototype pipeline spanning `lib/v7-parse.ts`, `public/prototypes/v7/`, and `components/landing/v7/` — a coupling that works but is non-obvious.

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
