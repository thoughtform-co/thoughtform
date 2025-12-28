---
name: thoughtform-scaling-perf-refactor
overview: A comprehensive refactor to improve performance (bundle splitting, font optimization), codebase scalability (decomposing the 2,100-line cockpit), and long-term maintainability (dead code archival, testing, mobile hardening) while maintaining 100% visual parity.
todos:
  - id: baseline-refactor
    content: Capture Phase 0 baseline (screenshots, Lighthouse, next-build sizes).
    status: completed
  - id: bundle-analyzer
    content: Integrate @next/bundle-analyzer and document current chunk breakdown.
    status: completed
    dependencies:
      - baseline-refactor
  - id: css-modularization
    content: Modularize navigation.css and migrate NavigationBar styled-jsx to global CSS.
    status: completed
    dependencies:
      - baseline-refactor
  - id: font-optimization
    content: Implement next/font/local for PP Mondwest and Iosevka.
    status: completed
    dependencies:
      - baseline-refactor
  - id: perf-dynamic-imports
    content: Convert heavy WebGL components (ParticleCanvasV2, ThreeGateway) to dynamic imports with prefetching.
    status: completed
    dependencies:
      - baseline-refactor
  - id: dead-code-archival
    content: Move unused components (sections/, editor/, canvas/, store/) to legacy/ per ADR-004.
    status: completed
    dependencies:
      - baseline-refactor
  - id: code-despaghetti-cockpit
    content: Decompose NavigationCockpitV2/index.tsx by extracting Bridge Frame and Manifesto logic into sub-components/hooks.
    status: completed
    dependencies:
      - css-modularization
  - id: mobile-viewport-hardening
    content: Audit and upgrade mobile viewport handling (dvh units, orientation changes, safe-area).
    status: completed
    dependencies:
      - css-modularization
  - id: hygiene-disposal-types
    content: Audit and implement Three.js resource disposal in all WebGL components.
    status: completed
    dependencies:
      - perf-dynamic-imports
  - id: visual-regression-tests
    content: Set up Playwright visual regression tests for key viewports and scroll positions.
    status: completed
    dependencies:
      - code-despaghetti-cockpit
---

# Thoughtform Scaling & Performance Refactor Plan

## 1. Architectural Strategy: "Orchestrator & Modules"

Instead of one massive file managing everything, we will shift toward an Orchestrator pattern.

- **The Orchestrator:** `NavigationCockpitV2/index.tsx` should only handle high-level scroll state and coordination.
- **The Modules:** Logic for the Bridge Frame, Manifesto, and Services will be moved into dedicated components or hooks.

---

## Phase 1 — Performance: Bundle & Asset Optimization

**Goal:** Reduce initial JS parse time and improve font reliability.

### 1A) Code-Splitting WebGL & Heavy Modules

- **Dynamic Imports:** Use `next/dynamic` with `ssr: false` for `ParticleCanvasV2`, `ThreeGateway`, and `LogoGlowEffect`.
- **Prefetch Strategy:** Trigger prefetching of these chunks in a `useEffect` after initial hydration to ensure they appear almost immediately, without blocking the first paint.

### 1B) Local Font Optimization

- **`next/font/local`:** Replace the `app/layout.tsx` inline `@font-face` (PP Mondwest) and the `globals.css` `@import` (Iosevka) with `next/font`.
- **Token Alignment:** Ensure these fonts map correctly to your existing CSS variables (`--font-display`, `--font-body`).

---

## Phase 2 — CSS Architecture: Modularization

**Goal:** Clean up the monolithic `navigation.css` and remove "magic" inline styles.

### 2A) Navigation.css Split

- Divide the 2,350-line [`app/styles/navigation.css`](app/styles/navigation.css) into ordered sub-files (e.g., `hero.css`, `manifesto.css`, `services.css`) to prevent cascade "spaghetti."
- **styled-jsx Migration:** Move the large CSS block in `NavigationBar.tsx` into the global modular system to centralize navbar styling.

### 2B) CSS Variable Injection

- **Logic → Token:** Move complex inline style calculations (like those for `bridge-frame`) into CSS variables. React will only update the variable values (0–1 progress), while the CSS file handles the actual transforms/opacities. This reduces React re-renders and makes styling easier to debug in DevTools.

---

## Phase 3 — Code Scalability: De-Spaghetti the Cockpit

**Goal:** Break down the 2,100-line `NavigationCockpitV2/index.tsx` into maintainable pieces.

### 3A) Logic Extraction (Hooks & Utils)

- **Math Utilities:** Move standalone helpers like `easeInOutCubic` and `lerp` into `lib/utils.ts` or a local `math.ts`.
- **Style Orchestration:** Move the massive `bridgeFrameStyles` `useMemo` block into a custom hook (e.g., `useBridgeFrameStyles.ts`).

### 3B) Component Decomposition

- **Section Extraction:** Create dedicated components for the "manifesto background shapes" and the "hero wordmark container" logic.
- **Unified Transitions:** Ensure all sub-components use the standardized `scrollProgress` from `useLenis` rather than calculating their own offsets locally where possible.

---

## Phase 4 — Dead Code Archival

**Goal:** Clean up the codebase per Sentinel ADR-004.

### 4A) Identify Unused Components

Scan for components that are not imported anywhere in active code:

- `components/sections/` — Likely superseded by the cockpit's fixed sections.
- `components/editor/` — Experimental editor tooling.
- `components/canvas/` — Older canvas approaches replaced by `ParticleCanvasV2`.
- `store/` — Unused Zustand stores.
- `components/hud/NavigationCockpitV2/styles.ts` — Exported but never imported.

### 4B) Archive to `legacy/`

Move identified dead code into `legacy/` (already excluded from `tsconfig.json`). This keeps reference implementations available without polluting the active codebase or confusing developers.---

## Phase 5 — Mobile Viewport Hardening

**Goal:** Make mobile layout bulletproof across devices and orientations.

### 5A) Dynamic Viewport Units (`dvh`)

- Audit `100vh` usages in CSS variables and components.
- Replace with `100dvh` (dynamic viewport height) where appropriate — especially for the Hero section and fixed frames — to handle mobile browser chrome appearance/disappearance.

### 5B) Orientation & Resize Handling

- Ensure the cockpit and HUD gracefully handle landscape orientation on phones (currently optimized for portrait).
- Add a debounced `resize` listener in `NavigationCockpitV2` to recalculate critical dimensions (e.g., `manifestoTargetHeightPxRef`) on orientation change.

### 5C) Safe-Area Consistency

- Audit that `env(safe-area-inset-*)` is applied consistently across all fixed elements (HUD corners, rails, navigation bar, mobile sigil).

---

## Phase 6 — Build Tooling & Observability

**Goal:** Make performance regressions visible before they ship.

### 6A) Bundle Analyzer Integration

- Install `@next/bundle-analyzer`.
- Add an `analyze` script to `package.json`:
  ```json
    "analyze": "ANALYZE=true next build"
  ```

- Document the current baseline chunk sizes in `CLAUDE.md` or a dedicated `docs/BUNDLE_BASELINE.md`.

### 6B) CI Integration (Optional)

- Consider adding a Lighthouse CI or bundle-size check to your CI pipeline to catch regressions automatically.

---

## Phase 7 — Visual Regression Testing

**Goal:** Prevent accidental UI breakage during refactors.

### 7A) Playwright Setup

- Install Playwright (`npm i -D @playwright/test`).
- Create a `tests/visual/` folder with snapshot tests for:
- 4 key viewports: 430x932 (iPhone Pro Max), 390x844 (iPhone 14), 768x1024 (tablet), 1440x900 (desktop).
- 6 key scroll positions: Hero (0%), Interface (10%), Manifesto start (20%), Manifesto mid (40%), Services (60%), Contact (95%).

### 7B) Baseline Capture

- Run Playwright once to generate baseline `.png` snapshots.
- Commit these to the repo (or store in CI artifact storage).

### 7C) Regression Workflow

- Add a `test:visual` script that compares current renders against baselines.
- Any diff triggers a failure, prompting manual review before merge.

---

## Phase 8 — Best Practices & Hygiene

**Goal:** Ensure long-term robustness.

### 8A) Resource Disposal

- Audit Three.js components (`ThreeGateway`, `LogoGlowEffect`, `SigilCanvas`) to ensure all geometries and materials are disposed of on unmount, preventing mobile GPU crashes (per Sentinel BEST-PRACTICES.md).

### 8B) Strict Typing

- Define a shared `Progress` type (alias for `number` restricted to 0–1) and ensure all transition props use it to improve dev-time safety.
- Consider using branded types or Zod for runtime validation of config objects from Supabase.

---

## Verification & Safety

- **Visual Parity Check:** Compare against Phase 0 baseline screenshots.
- **Interaction Audit:** Verify all scroll thresholds (0.15, 0.35, 0.5, etc.) still trigger transitions at the exact same scroll depths.
- **Build Analysis:** Confirm the "initial JS" size in `next build` has decreased compared to baseline.