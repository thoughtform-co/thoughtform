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
