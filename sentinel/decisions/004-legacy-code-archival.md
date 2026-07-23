# ADR-004: Legacy Code Archival

**Date:** 2024-12  
**Status:** Accepted

---

## Context

During development, we iterated significantly on:

- Navigation cockpit (V1 → V2)
- Particle canvas (original → V2 with 3D)
- Editor components (experimental features)
- State management (various approaches)

This left unused code in the codebase:

- `components/hud/NavigationCockpit.tsx` (replaced by V2)
- `components/hud/ParticleCanvas.tsx` (replaced by V2)
- `components/editor/**` (experimental)
- `components/sections/**` (unused)
- `components/canvas/**` (superseded)
- `store/**` (unused Zustand stores)

Issues:

1. **Confusion** - Which component is the "real" one?
2. **Bundle bloat** - Unused code still analyzed by bundler
3. **Type errors** - Legacy code may reference old APIs
4. **Maintenance** - Updates might accidentally touch dead code

---

## Decision

### 1. Create `legacy/` directory

Move unused code to a dedicated folder at project root:

```
legacy/
├── hud/
│   ├── NavigationCockpit.tsx
│   └── ParticleCanvas.tsx
├── editor/
├── sections/
├── canvas/
└── store/
```

### 2. Exclude from TypeScript compilation

Update `tsconfig.json`:

```json
{
  "exclude": ["node_modules", "legacy"]
}
```

### 3. Keep in version control

Legacy code remains in git history and in `legacy/` folder for reference. It's not deleted because:

- May contain useful patterns to reference
- Documents evolution of the codebase
- Can be restored if needed

---

## Alternatives Considered

### Alternative 1: Delete legacy code entirely

- **Pros:** Clean codebase, no confusion
- **Cons:** Lose reference implementations, harder to recover

### Alternative 2: Keep in place with `@deprecated` comments

- **Pros:** No file moves
- **Cons:** Still analyzed by bundler, still causes confusion

### Alternative 3: Separate git branch for archive

- **Pros:** Completely clean main branch
- **Cons:** Hard to reference, easy to forget exists

---

## Consequences

### Positive

- **Clear active code** - Everything in `components/` is production code
- **Faster builds** - TypeScript ignores `legacy/`
- **Easy reference** - Old patterns accessible without git archaeology
- **No accidental usage** - Imports from `legacy/` require explicit path

### Negative

- **Folder maintenance** - Need to remember to move deprecated code
- **Disk space** - Legacy code still in repo

### Neutral

- Developers should know `legacy/` exists for reference

---

## Implementation

```bash
# Structure after archival
legacy/
├── hud/
│   ├── NavigationCockpit.tsx    # Original cockpit
│   └── ParticleCanvas.tsx       # Original 2D canvas
├── editor/                       # Experimental editor
├── sections/                     # Unused section components
├── canvas/                       # Old canvas approaches
└── store/                        # Unused Zustand stores
```

---

## When to Archive

Move code to `legacy/` when:

- A V2 replacement is stable in production
- Code hasn't been imported for 30+ days
- Feature was experimental and abandoned

Do NOT archive:

- Code that might be reactivated soon
- Utilities still imported elsewhere
- Components with active feature flags

---

## Update 1 — the `legacy/` tree is DELETED; git history is the archive (2026-07-23, owner)

**Why:** the archive had done its job. `legacy/` had grown to 130 files / 1.4 MB
with **zero imports** from `app/`, `components/`, `lib/`, `tests/`, `scripts/`,
`stories/`, or `packages/` — verified by an exhaustive sweep for `from "…legacy"`,
`require()`, dynamic `import()`, and the `@/legacy` alias. It was already fenced
out of every pipeline (`tsconfig.json` exclude, `eslint.config.mjs` ignore,
`vitest.config.ts` exclude), so it shipped nothing and typechecked nothing — it
only inflated the working tree and made the repo read as twice as complex as it
is. The owner's repo-structure review called it: the archive folder was the single
biggest contributor to apparent clutter.

**Decision:** delete the tree outright. Git history is the archive — recovering any
file is `git log --diff-filter=D -- legacy/<path>` then `git show <sha>^:<path>`.
This is the same rationale already applied to the 2026-07 Phase 5 cleanup of
`NavigationCockpitV2` / `/archive/current-home` ("git history is the archive",
CLAUDE.md).

**Scope of the removal:**

- `legacy/**` (130 files) — deleted.
- The archive's own governance is retired: `.claude/rules/legacy.md` and
  `.cursor/rules/legacy.mdc` deleted; the `legacy/` branch of
  `scripts/sentinel-pre-edit-hint.mjs` removed.
- Dead exclusions cleared now that the path cannot exist: `tsconfig.json`
  (`exclude`), `eslint.config.mjs` (ignores), `vitest.config.ts` (exclude).
- Tree diagrams + the root-barrel note updated in `CLAUDE.md`, `AGENTS.md`,
  `README.md`, and the `components/index.ts` header comment (which now records
  WHAT was archived and how to recover it, rather than pointing at a live path).

**What still stands from the original ADR:** the *archival criteria* below (stable
V2 replacement / 30+ days unimported / abandoned experiment) remain the test for
retiring code. What changes is the destination — retired code is now **deleted in
a titled commit**, not moved to `legacy/`. Do not recreate a `legacy/` directory;
if a future retirement needs a staging area, open a new ADR for it.

**Verification:** `npm run verify` (lint + typecheck + unit tests) and a production
build both pass with the tree removed; no import, alias, or config reference to
`legacy/` survives outside historical ADR prose.
