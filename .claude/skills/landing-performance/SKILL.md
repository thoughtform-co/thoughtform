---
name: landing-performance
description: >
  Load-order, code-split, and payload doctrine for the thoughtform.co
  landing route. The WebGL corridor stack (three/fiber/drei) is NOT in the
  landing's First Load JS and Supabase is NOT on the anonymous path — both
  are async, gated seams that are one careless static import away from
  regressing. Read this BEFORE adding an import to a landing DOM component,
  editing the corridor mount / auth init / parse pipeline, adding a
  `public/` asset or font, or touching the perf budget. Activates on edits
  to `components/landing/v7/hooks/useCorridorMount.tsx`,
  `components/landing/v7/BrandmarkSystem.tsx`,
  `components/landing/v7/intelligence-layer/journeyScalars.ts`,
  `components/landing/home-v2/services/hologram/ringCtaBox.ts`,
  `components/auth/AuthProvider.tsx`, `lib/auth/authBridge.ts`,
  `lib/v7-parse/**`, `app/layout.tsx`, `app/(marketing)/page.tsx`,
  `.vercelignore`, `next.config.mjs`, `public/fonts/**`,
  `public/project-cards/**`, `components/landing/v7/tools-cards/toolCardData.ts`,
  `app/(admin)/astrogation/page.tsx`, or any change that could move weight
  into First Load JS, the served document, or the deploy.
---

# Landing performance — load-order & payload doctrine

The thoughtform.co landing is a **layered composite whose heavy machinery loads
LATE, on purpose.** The WebGL corridor (three core + `@react-three/fiber` +
drei + `DepthGatewayScene`, ~270 kB gzip) and `@supabase/supabase-js` (~34 kB
gzip) are **async, gated chunks — not part of First Load JS.** First Load JS is
**~72.8 kB gzip** (down from 449.8 at origin). Every one of the seams below
holds by _the absence of a static import_; a single wrong `import` re-inflates
the bundle silently, with no test or type error to stop you. This skill is the
do-not-regress contract.

For _compositing / stacking_ rules (opaque shields, `.gateway`, `.hero`,
`data-m` reveals) see **`landing-v7-compositing`**. For the brandmark's
scroll journey and painters see **`brandmark-choreography`** and
**`brandmark-particle`**. This skill is only about **weight and load order.**

---

## 1. The loading architecture, as it now IS

Load order for an anonymous first visit to `/`:

1. **Served document (~111 kB).** `app/(marketing)/page.tsx` renders the parsed
   v7 prototype HTML via `dangerouslySetInnerHTML`. The prototype's ~107
   design-annotation comment blocks (~22 kB, shipped TWICE — SSR HTML + RSC
   flight payload) are stripped at the **TAIL of the parse pipeline** in
   `lib/v7-parse/parseBody.ts` (`bodyHtml.replace(/<!--[\s\S]*?-->/g, "")`,
   the last transform before CSS scoping). **The source file
   `public/prototypes/v7/landing-v7-motion.html` is NOT edited** — its markup
   is pinned byte-exact by the parse regexes and the `v7-parse` drift-guard
   tests. Never "clean up" the annotations in the source; the strip is a
   ship-time transform so the standalone prototype keeps its annotations.
2. **Preloaded woff2 bake faces.** `app/layout.tsx` `<link rel="preload">`s
   `PTMono-Regular`, `PTMono-Bold`, `PPNeueMontreal-Book` — the three faces the
   canvas bake paths draw with (see invariant 5).
3. **Hero key visual.** `/images/Gateway_v1b.webp` (2880×1620). Explicit
   `width`/`height` + `fetchpriority="high"` live in the prototype markup, and
   `app/(marketing)/page.tsx` emits a page-level
   `<link rel="preload" as="image" href="/images/Gateway_v1b.webp" fetchPriority="high">`
   so the fetch starts with the document, not after the innerHTML commit.
4. **Hydration** on the ~72.8 kB gzip First Load JS (no three, no supabase).
5. **Async three/WebGL chunk.** Fetched right after hydration. On **≤960 px**
   viewports the import is **deferred** by `corridorImportGate()` in
   `useCorridorMount.tsx` to the first `scroll` / `pointerdown` / `keydown`, or
   `requestIdleCallback` with a **2.5 s cap** — whichever first. Desktop
   resolves immediately. Only chunk _arrival_ shifts; the mount machinery is
   untouched.
6. **Corridor mount** (ADR-018 nested-root machinery — MutationObserver,
   `pageshow` bfcache re-mount, deferred teardown, `hasContent` recovery guard).
7. **Corridor-entry prefetch** of the project-card webps
   (`prefetchCaseCardImages`, called at corridor mount in `HomeCorridor.tsx`) so
   the first Arc-cases bake isn't a cold four-image burst.

### The four code-split seams (each holds by an absent static import)

| Seam                        | File                                                         | Mechanism                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HomeCorridor**            | `components/landing/v7/hooks/useCorridorMount.tsx`           | `React.lazy` + `<Suspense fallback={null}>` inside the hook's nested `createRoot`. The **synchronous `.home-corridor-host` wrapper** keeps the ADR-018 `hasContent` recovery guard satisfied while the chunk is in flight (no MutationObserver remount churn).                                                                                          |
| **BrandmarkParticleCanvas** | `components/landing/v7/BrandmarkSystem.tsx`                  | `next/dynamic` with `ssr:false`. The vector actor + dock glyphs ARE the mark; this canvas is only atmosphere grain + transit exhaust, so a late chunk is visually benign (its error boundary already treats `null` as an acceptable fallback).                                                                                                          |
| **journey scalars**         | `components/landing/v7/intelligence-layer/journeyScalars.ts` | Three-free module holding the journey-handoff scalars (`smoothstep`, `lerp`, `clamp01`, `SUBSTRATE_PHASE`, `splitEnvelope`, `vectorRingOpacity`, `splitRotation`). `intelligenceLayerGeom.ts` re-exports them so scene-side consumers keep their import path; `lib/brandmark/journey.ts` imports from HERE. Bodies are byte-identical to the originals. |
| **ring CTA box**            | `components/landing/home-v2/services/hologram/ringCtaBox.ts` | Three-free module holding the bake dims (`BAKE_W`/`BAKE_H`) and `RING_CARD_CTA_BOX`. `ServicesRingHitAreas` (landing DOM) imports the box from here, NOT from `ServicesCardRing` (which pulls three/fiber/drei).                                                                                                                                        |

### Supabase lazy-init (the anonymous path fetches zero supabase)

`AuthProvider` (`components/auth/AuthProvider.tsx`) initializes the Supabase
client via **dynamic import only** when ONE of:

- a persisted **`sb-<ref>-auth-token`** key exists in `localStorage`, OR
- the URL carries **auth params** (magic-link / OAuth return), OR
- the same-tab **`authBridge`** sign-in signal fires (`onAuthSessionStarted`).

Anonymous visitors resolve `user = null` immediately and **fetch zero supabase
chunks and make zero `supabase.co` calls.** `lib/auth/authBridge.ts` is a
dependency-free signal: the password sign-in path (`lib/auth.ts`) calls
`notifyAuthSessionStarted()` because it has no reload, so `AuthProvider` would
otherwise miss the fresh session. `UserStatus` (`components/auth/UserStatus.tsx`)
defers its `signOut` import to click time.

---

## 2. Hard invariants — the do-not-regress list

Each line ends with the failure mode it prevents. None of these are enforced by
the type-checker or a test; they are enforced by _you not writing the import._

1. **No static import from the three/fiber/drei module graph into any landing
   DOM component.** _Failure mode:_ the entire WebGL stack lands back in First
   Load JS. **Cautionary tale:** a single layout constant, `RING_CARD_CTA_BOX`,
   once dragged the whole graph in — `ServicesRingHitAreas` (a DOM hit-area
   layer) imported it from `ServicesCardRing`, and that one edge re-inflated the
   bundle. That is why `ringCtaBox.ts` exists.
2. **`journeyScalars.ts` and `ringCtaBox.ts` stay three-free.** No `import
three`, no import that transitively reaches three. _Failure mode:_ the seam
   they hold open (1 & 4 above) silently closes.
3. **`@supabase/supabase-js` is never statically imported on the anonymous
   path.** New sign-in flows MUST signal through `authBridge`
   (`notifyAuthSessionStarted()`), not import the client into a root-graph
   component. _Failure mode:_ ~34 kB gzip returns to every route's First Load
   JS and anonymous visitors resume making `getSession()` calls.
4. **New lab-only `public/` assets get a `.vercelignore` entry.** Current
   excludes: `public/images/gateway-hero.png`, `public/env`, `public/showcase`,
   `public/images/services/Vince-4.jpg`. **Two deliberate KEEPS — do not add
   them:** `public/videos/` (ships on the PUBLIC `/claude-workshop` route) and
   `public/images/gateway/` (serves the admin-reachable `/orrery` orrery lab).
   _Failure mode:_ multi-MB dev-lab assets bloat the deploy; or a keep gets
   ignored and a public/admin route 404s its media. Verify the referencing
   route before ignoring anything (grep `app/ components/ lib/ prototypes`).
5. **Fonts are woff2-only, and any new canvas-bake-path face must be
   preloaded.** The bake faces are `PTMono-Regular`, `PTMono-Bold`,
   `PPNeueMontreal-Book`, preloaded in `app/layout.tsx`. `waitForCardFonts()`
   (`arc-cases/caseCardBake.ts` and `services/hologram/ServicesCardRing.tsx`)
   races `document.fonts` against a **1500 ms timeout**; if a bake face is not
   preloaded, the timeout wins and the card **bakes permanently with fallback
   fonts.** _Failure mode:_ a wrong-typeface card that no reload fixes.
6. **project-cards convention: ~1000 px-wide webp q82.** They draw into a
   ~470 px-tall contain-fit band on the fixed 840×1360 bake canvas (`BAKE_W`/
   `BAKE_H` in `ringCtaBox.ts`; the cases bake in `arc-cases/caseCardBake.ts`) —
   source resolution past ~1000 px is wasted (the gold LUT + dot veil dominate).
   Dims live in `components/landing/v7/tools-cards/toolCardData.ts` and must
   match the asset. _Failure mode:_ multi-MB PNGs (the four were 3.07 MB) for no
   visible gain.
7. **`BYPASS_AUTH` stays `NODE_ENV`-gated — never hardcoded.**
   `app/(admin)/astrogation/page.tsx`:
   `const BYPASS_AUTH = process.env.NODE_ENV === "development";`
   (compile-time inlined). _Failure mode:_ a hardcoded `true` ships an open
   admin tool to production.

---

## 3. Budgets & the measurement ritual

- **First Load JS: ~72.8 kB gzip** for `/`. Any increase needs justification in
  the commit / an ADR — treat it as a review-blocking regression by default.
- **Served document: ~111 kB.**
- **Measure with:** `NEXT_DIST_DIR=.next-verify npm run analyze`. **NEVER build
  into `.next` while a dev server is running** — that is exactly why the
  `NEXT_DIST_DIR` guardrail exists (`next.config.mjs`:
  `distDir: process.env.NEXT_DIST_DIR || ".next"`). Read the result from
  `.next-verify/analyze/client.html` (`window.chartData`).
- **Reconstructing First Load JS:** Next 16's `next build` no longer prints the
  `Size / First Load JS` columns. The authoritative number is the sum of every
  client chunk flagged `isInitialByEntrypoint` for the route's entrypoint (see
  the baseline's method note). Give both gzip and minified — Next historically
  reported one without saying which.
- **Compare against** `sentinel/baselines/2026-07-14-phase0/` (`bundle.md` for
  chunk tables, `README.md` for headline numbers and reproduction commands).

---

## 4. Verification doctrine

Full gate for a landing-perf change (docs-only work can run the quick gate:
typecheck + eslint):

- `npm run typecheck` (`tsc --noEmit`) — clean.
- `npm run lint` (`eslint .`) — **0 errors** (warnings are a known, tracked
  count, ~327; do not add new ones casually).
- `npm run test:run` (vitest) — **242 unit tests** green.
- `npm run build` (`next build --webpack`) — production build succeeds.
- Playwright smokes: **corridor 36/36** (`tests/visual/landing-corridor-smoke.spec.ts`)
  plus `services-ring-smoke` and `arc-cases-card-smoke` green
  (`gateway-motion-smoke` self-skips without `gateway:prep`). Run across the 4
  viewport projects (`iphone-14-pro-max`, `iphone-14`, `tablet`, `desktop`).

**The `--workers=2` gotcha.** A single-project smoke run puts ~6 concurrent
WebGL corridors on one GPU and starves the arming flows (context loss →
false reds). Bound the workers (`--workers=2`) for single-project /
arc-cases runs.

**react-doctor gotchas** (`npx react-doctor@0.7.7 . --json`):

- Clear caches first: `node_modules/.cache/react-doctor` **and**
  `%TEMP%/react-doctor-cache-*`.
- It **scans build output if present** — because `.next-verify` is a
  non-standard dir name, delete `.next-verify` before running or the score is
  polluted by generated code. (Product score is ~30/100; a product-source-only
  scan is materially higher — ~25% of findings live in excluded
  `legacy/`+`registry/`.)

**The eyeball ritual.** Scroll the FULL corridor at multiple depths, including
**an early-load frame** (~700 ms) to confirm the hero composes with no brandmark
flash and the deferred WebGL chunk arrives cleanly. Automated smokes assert DOM
contracts; they do not see the composite.

---

## 5. Security posture

- **`/astrogation` is `NODE_ENV`-gated** (invariant 7). On a production build a
  sessionless `/astrogation` redirects to the `/admin` Credential Terminal with
  zero tool nodes mounted; dev keeps the bypass branch. Server-side, API
  mutations still enforce the admin allowlist via `lib/auth-server.ts`
  (`isAuthorized()`) — client gates are not security (see `.claude/rules/auth.md`,
  ADR-003).
- **RLS trust boundary (ADR-037).** Public `SELECT` policies on landing content
  are **intentional** (the page renders from them anonymously — keep them). But
  most admin-owned write policies are `to authenticated ... (true)` — i.e. _any_
  Supabase account, not the single allowlisted admin. This is safe **only if
  dashboard signups are disabled.** The fix is staged, NOT applied:
  `supabase/migrations/DRAFT-20260714_tighten_admin_write_policies.sql` swaps
  every class-A `(true)` write for an `is_admin()` JWT-email check. Two owner
  actions remain: **(1)** confirm Supabase Auth signups are disabled, and
  **(2)** fill the `__ADMIN_EMAIL__` placeholder and strip the `DRAFT-` prefix
  (a guard header `RAISE`s if applied unfilled). Prefer the per-user
  `auth.uid() = user_id` pattern (`foundry_documents`/`foundry_templates`) for
  new tables.

---

## 6. Known open levers / deferred map

- **Mobile LCP (~7.9 s) is the top open lever.** The LCP element is the hero
  **paragraph** at ~93% render-delay: the `[data-m]` reveal only adds `.is-in`
  after hydration, so LCP ≈ hydration time. A **CSS-only first-viewport reveal**
  (fire the first fold without waiting on hydration) is THE remaining move —
  ADR-scale, and it touches the reveal choreography, so coordinate with
  `landing-v7-compositing` (the `data-m` opacity/transform contract).
- **Hero re-encode is staged, awaiting Vince.** `Gateway_v1b.webp` ships at
  835 kB. Candidates in `assets-staging/hero-candidates/` (gitignored): **AVIF
  q50 = 346 kB, AVIF q45 = 190 kB, 2048 px webp = 143 kB.** (A webp re-encode at
  native size barely helps — the film-grain texture defeats it.) The asset was
  deliberately NOT swapped in the sweep.
- **Deferred Phase 4:** GPU-capability probe, FPS-adaptive quality governor,
  tablet 760–1280 px GPU profile fix, rAF consolidation.
- **Deferred Phase 5:** math-util consolidation, hooks-warning burndown,
  react-doctor in CI scoped to _new_ issues only.
- **Deletion candidates:** `NavigationCockpitV2` (confirmed internal-only),
  legacy `ThreeBackground` (carries the archived `new Function()` no-eval P0;
  build-excluded), and the `lib/queries.ts` legacy page-editor tables
  (`pages`/`sections`/`elements`/`design_log` — nothing imports them; ADR-037
  flags dropping over tightening).

---

## 7. Provenance

This architecture was produced by the **2026-07-14 landing health sweep**
(phases 0–3). Headline results:

| Metric                 | Before → After                          |
| ---------------------- | --------------------------------------- |
| Landing First Load JS  | **449.8 → 72.8 kB gzip (−84%)**         |
| Case-card screenshots  | 3.07 MB → 133 kB (−96%)                 |
| Brand fonts            | 789 → 321 kB (woff2, −59%)              |
| Served document        | 133.5 → 111.0 kB (−17%)                 |
| Vercel deploy          | −~33 MB                                 |
| Corridor smokes        | fully green **36/36**                   |
| ESLint warnings        | 470 → 327 (0 errors throughout)         |
| `/astrogation` in prod | open bypass → walled (`NODE_ENV`-gated) |

Full record: `sentinel/baselines/2026-07-14-phase0/` (the before-picture +
reproduction commands), the `sentinel/MAINTENANCE.md` ledger entries (Phases
0, 1, 2, 3, 3b), and **ADR-037** (RLS trust boundary). Commit ranges:
Phase 0 `cca26d7..f7fb13a`, Phase 1 `a2ae117..d9cfcd7`, Phase 2
`c06fef1..9efe9f8`, Phase 3 (+3b) `98e48cf..b3ce165`. The four code-split
seams are `98e48cf` / `da410e8` / `b3c5681` / `3443801`; Supabase off the
anonymous path is `566cc02`.
