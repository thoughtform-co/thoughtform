---
name: Astrogation Refactor
overview: Refactor the Astrogation route to be easier to maintain and safer to evolve by modularizing the huge page, hardening state/focus logic, deduplicating CSS, and doing targeted performance wins—while keeping behavior stable (minor visual diffs OK).
todos:
  - id: baseline-checklist
    content: Create a short baseline behavior checklist for Astrogation (focus, selection, presets) to validate after each refactor phase.
    status: completed
  - id: extract-components
    content: Extract major inline components from `app/astrogation/page.tsx` into `app/astrogation/_components/*` (mechanical move only, no behavior changes).
    status: completed
    dependencies:
      - baseline-checklist
  - id: state-reducer
    content: Introduce `app/astrogation/_state/astrogationReducer.ts` and migrate selection/tab/focus into a typed reducer; keep behavior identical.
    status: in_progress
    dependencies:
      - extract-components
  - id: presets-hook
    content: Move presets CRUD + toast wiring into `app/astrogation/_hooks/usePresets.ts` to isolate side effects and simplify views.
    status: pending
    dependencies:
      - state-reducer
  - id: css-dedupe-vars
    content: Refactor `app/astrogation/astrogation.css` to use focus-related CSS vars and consolidate shared asset-grid styles; remove remaining duplicate selectors.
    status: pending
    dependencies:
      - extract-components
  - id: perf-pass
    content: Apply safe performance improvements (memoization, stable callbacks, optional `DynamicSVG` caching) and verify no interaction regressions.
    status: pending
    dependencies:
      - state-reducer
      - css-dedupe-vars
---

# Astrogation robustness refactor

### Goals (based on your priorities)

- **Modularize** the 2.5k-line `page.tsx` so it’s easier to reason about and extend.
- **Harden the state model** (selection/tab/focus/presets) to reduce “stale state” bugs.
- **Clean up CSS architecture** to prevent drift/duplication and make global behaviors (focus/blur/glass) consistent.
- **Targeted performance wins** (fewer unnecessary re-renders, lighter work per render).

### Non-goals (for safety)

- No feature additions.
- No intentional behavior changes.
- Visual changes only if they’re incidental to deduplication/consistency (per your “behavior-perfect” tolerance).

### Safety strategy (don’t break anything)

- **Baseline checklist** before refactor (manual, quick):
- Selecting categories/components updates preview.
- Vectors + Word Marks: click item → focused overlay appears; click backdrop → closes.
- Global focus mode: background UI blurs/dims; center preview stays interactive.
- Presets: load/save/delete works.
- Work in **small, mechanical commits**: extract code first (no logic change), then state refactor, then CSS cleanup, then perf.

### Proposed structure (route-local, scalable)

- Keep the route entry in [`app/astrogation/page.tsx`](app/astrogation/page.tsx) as a thin orchestrator.
- Add route-local modules:
- `app/astrogation/_components/`
  - `AstrogationShell.tsx` (layout + rails/nav/footer)
  - `CatalogPanel.tsx`
  - `CenterPanel.tsx` (tabs)
  - `VaultView.tsx`, `FoundryView.tsx`
  - `SpecPanel.tsx`, `DialsPanel.tsx`
  - `previews/ComponentPreview.tsx`
  - `previews/VectorsPreview.tsx`, `previews/WordmarksPreview.tsx`
  - `DynamicSVG.tsx`, `ThoughtformLogo.tsx`
- `app/astrogation/_state/astrogationReducer.ts`
- `app/astrogation/_hooks/usePresets.ts`

> Note: Any extracted TSX/hook files that use React hooks will include `"use client"`.

### State model hardening

- Replace scattered `useState` + cross-coupled effects with a **typed reducer**:
- `AstrogationState`: category, selectedComponentId, activeTab, focus (global + element-level), componentProps, style, presets, toast.
- Actions like: `selectComponent`, `setTab`, `setFocus`, `setElementFocus`, `setProps`, `loadPresets`, `presetSaved`, `presetDeleted`, `toastShown`.
- Keep side effects (fetch/save/delete presets) inside `usePresets()` to isolate network + error handling.
- Make focus explicit (reduces edge cases):

```mermaid
flowchart TD
  userClick[UserClick] --> focusDecision{FocusType}
  focusDecision -->|singleComponent| globalFocus[SetGlobalFocus_true]
  focusDecision -->|assetItem| elementFocus[SetElementFocus_id]
  elementFocus --> globalFocus
  globalFocus --> uiState[Astrogation_has-focus]
  uiState --> blurUI[BlurDimBackgroundUI]
  userClick -->|backdropClick| clearFocus[ClearFocus]
  clearFocus --> uiState
```

### CSS refactor (robust + scalable)

- Keep [`app/astrogation/astrogation.css`](app/astrogation/astrogation.css) but **dedupe + parameterize**:
- Introduce page-scoped CSS vars on `.astrogation` for focus system:
  - `--focus-overlay-bg`, `--focus-overlay-blur`, `--focus-bg-opacity`, `--focus-bg-blur`
- Consolidate shared “asset grid” patterns across vectors/wordmarks:
  - Shared rules for `__grid`, `__focused-content`, `__focused-overlay`, `__backdrop`, and `--has-focus`.
- Audit and remove any remaining duplicate selectors (this is what caused the Word Mark focus mismatch recently).

### Performance wins (safe, low-risk)

- Make static data lists (vectors/wordmarks definitions) **module constants** (not recreated on each render).
- Wrap heavier leaf components with `React.memo` where prop stability is clear.
- Use `useMemo`/`useCallback` to stabilize props passed deep into the tree.
- Optional (if profiling shows benefit): add a small in-memory cache in `DynamicSVG` for fetched SVG text keyed by `src`.

### Validation

- Run TypeScript + lint checks.
