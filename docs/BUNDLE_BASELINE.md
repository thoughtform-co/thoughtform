# Bundle Baseline - December 2024

> Performance tracking for Thoughtform Scaling & Performance Refactor

## Build Output (Next.js 14.2.18)

### BEFORE Refactor

| Route                 | Size    | First Load JS |
| --------------------- | ------- | ------------- |
| `/` (Landing)         | 252 B   | **468 kB**    |
| `/admin`              | 6.04 kB | 139 kB        |
| `/orrery`             | 4.12 kB | 137 kB        |
| `/test`               | 205 B   | 465 kB        |
| `/test/cards`         | 3.13 kB | 361 kB        |
| `/test/gateway`       | 9.91 kB | 323 kB        |
| `/test/three-gateway` | 5.88 kB | 335 kB        |

### AFTER Refactor

| Route                 | Size    | First Load JS | Change      |
| --------------------- | ------- | ------------- | ----------- |
| `/` (Landing)         | 252 B   | **467 kB**    | -1 kB       |
| `/admin`              | 7.83 kB | 139 kB        | —           |
| `/orrery`             | 4.11 kB | 137 kB        | —           |
| `/test`               | 192 B   | **240 kB**    | **-225 kB** |
| `/test/cards`         | 3.87 kB | **143 kB**    | **-218 kB** |
| `/test/gateway`       | 6.77 kB | **107 kB**    | **-216 kB** |
| `/test/three-gateway` | 8.19 kB | 334 kB        | -1 kB       |

### Shared Chunks

| Chunk                  | Size        |
| ---------------------- | ----------- |
| `chunks/117-*.js`      | 31.6 kB     |
| `chunks/fd9d1056-*.js` | 53.6 kB     |
| Other shared           | 2.18 kB     |
| **Total Shared**       | **87.4 kB** |

## Key Improvements

1. **Dead Code Archival (ADR-004)**
   - Moved `components/sections/`, `components/editor/`, `components/canvas/`, and `store/` to `legacy/`
   - **225+ kB reduction** on test pages that previously imported unused code

2. **Dynamic Imports for WebGL**
   - `ParticleCanvasV2`, `ThreeGateway`, `LogoGlowEffect` now lazy-loaded
   - Improves initial render time (Total Blocking Time)
   - WebGL chunks load after hydration

3. **Font Optimization**
   - Removed render-blocking CDN import for Iosevka
   - PP Mondwest now loaded via `next/font/local`
   - IBM Plex Mono used as fallback for terminal aesthetic

4. **CSS Modularization**
   - NavigationBar `styled-jsx` migrated to global CSS
   - Created `app/styles/navigation/` module structure
   - Better DevTools debugging with named classes

5. **Mobile Viewport Hardening**
   - Added `100dvh` dynamic viewport units throughout
   - Proper safe-area handling verified

## Tooling Added

- `@next/bundle-analyzer` - Run `npm run analyze` to visualize chunks
- `@playwright/test` - Run `npm run test:visual` for visual regression tests

---

_Last updated: December 2024_
