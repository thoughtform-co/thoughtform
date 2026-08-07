# Thoughtform.co - Project Context

## Sentinel — patterns and decisions

Read [sentinel/BEST-PRACTICES.md](sentinel/BEST-PRACTICES.md) and the **ADR** relevant to your task before non-trivial changes. Full index: [`sentinel/decisions/`](sentinel/decisions/) (ADR-001 … ADR-051). Load-bearing entries for the current surface:

- **Home-v2 depth corridor:** [ADR-018](sentinel/decisions/018-home-v2-depth-corridor.md) — the dominant landing surface (scroll-driven WebGL corridor)
- **Arc cases (Build park):** [ADR-033](sentinel/decisions/033-arc-cases-orbit.md) → [ADR-042](sentinel/decisions/042-arc-cases-cue.md) — cases orbit, terrace, terminal, card, sigil, cue
- **Services card ring (the conversion beat):** [ADR-029](sentinel/decisions/029-services-card-ring.md) (the ring; the card is ONE object) → [ADR-050](sentinel/decisions/050-services-card-face.md) (tight face + the in-canvas drawer, live behind `SERVICES_CARD_DRAWER`). Five files move in lockstep — see [`.claude/rules/services-ring.md`](.claude/rules/services-ring.md)
- **Services exit + about:** [ADR-047](sentinel/decisions/047-about-deck-flip-stage.md) (the deck-flip stage — cards stack, flip to portrait, ambient survives past #about), [ADR-045](sentinel/decisions/045-about-emerge-rail-parity.md) (the mobile/fallback about surface; ADR-046's dock is superseded)
- **Proof / client cases (the evidence beat):** [ADR-056](sentinel/decisions/056-services-proof-casefile.md) — the Loop casefile is an interactive viewport (client tabs + terminal directory + swapping evidence panel) at the TOP of `#services`, over the parked brandmark; the card ring waits behind it via a runway split that leaves every ring constant byte-identical. ⚠ **there is NO `#proof` station** — ADR-054's station, `lib/v7-parse/proofStation.ts` and `ProofRevealController` are deleted, and `#practice` inherited the ambient-cover role. [ADR-054](sentinel/decisions/054-proof-station-client-cases.md) survives only for the content model (`lib/cases/`, types-only + registry, the `lib/arcs` mirror) and the confidentiality envelope. Rules in [`.claude/rules/proof.md`](.claude/rules/proof.md); look-dev at `/test/field-log-lab`. "Case" ≠ "arc page" ≠ `arc-cases/` (LANGUAGE.md)
- **The casefile's right panel is ONE instrument:** [ADR-064](sentinel/decisions/064-casefile-console-frame.md) — all four evidence plates render inside the shared `ConsoleFrame` (`casefile/console/**`), so the panel changes what it displays rather than being four boxes in a slot. ⚠ The frame is a BEZEL THE CONTENT BLEEDS INTO, never a letterbox; below 980px the console UNWRAPS rather than hiding. → [ADR-066](sentinel/decisions/066-casefile-one-rail-one-foot.md) — **one rail, one foot, and a row that carries its own rule**: every plate switches on the shared `ConsoleRail` and **NO ORDINAL survives anywhere on the surface** (⚠ at four stations the diamond is hidden — 14px short, diamond costs 12.7, it is arithmetic); the FOOT is where context goes, so the tools plate is one column (capture → four facts → foot) and `--font-sans`, which is declared nowhere, was the "font feels different" bug; a row may carry SHEETS (the Studio row is ads · the line · the red line). ⚠ **The filter line is AUTHORED vs CAPTURED** (ADR-064 U2, owner) — the tool captures take the services duotone, the stills and films never do, and the smoke asserts BOTH halves
- **The glyphed index + the tool dossier + authored wireframes:** [ADR-068](sentinel/decisions/068-casefile-glyphed-index-and-tool-dossier.md) — the register is a NON-INTERACTIVE glyph+claim+sentence index on all four rows (sentence sr-only below 1070h; the rungs must TILE); the tools plate is header → route → bay → detail 2×2 → foot with SHORT rail handles (diamond back at data-n=4) and the full name as the header designation; the Software register speaks for the PROGRAM (left = program, right = tool); wireframes are AUTHORED evidence (no img, no duotone — per-tool filter split; vesper first, draw readout is a meter never a price); ⚠ glyph edits re-run the contact sheet; ⚠ the console unwrap gate pairs width WITH prefers-reduced-motion
- **The casefile's type ladder + the proof claims:** [ADR-067](sentinel/decisions/067-casefile-type-and-clutter.md) — **two families by ROLE** (PT Mono = chrome, PP Neue Montreal = prose); ⚠ `--font-mono` is IBM Plex Mono, NOT `--fl-mono`, so anything that inherits rather than declaring gets a third face. The proof register is **four CLAIMS** (`CaseBlock` is `{ title, desc }`, title ≤27 measured) — the display figure went because its sixteen values carried nine grammars. Stations are **chamfered plates welded to the console** and the lit spine moved to their TOP edge. ⚠ The "two diagonal lines" were the ORBIT RING cropping through the console's top edge (`ry < 525`, `rx ≥ 420`), never the chamfers — a `clip-path` cuts a border, it never strokes one. **1920×1080 is a reference viewport** and is the worst case for `.fl-brief`
- **The corner law:** [ADR-065](sentinel/decisions/065-corner-law.md) — chamfer = a machined housing · notch (one corner) = oriented or connected · bracket = framed but not a device. One grammar per object, **the diagonal is TR + BL** (TL+BR only as the mirrored back of a flipped object — the casefile console was the one exception and is corrected), depth ladder seed `16px` / plate `26px` / chrome `0`, and **the children of a chamfered box are square** — which is what stops the surface reading flat. Summary in [DESIGN.md](DESIGN.md#the-corner-law-adr-065)
- **The Intelligence Map (the casefile's lead row):** the live panel is the **PDA console** (`casefile/map/pda/**`) — a held instrument with three readings (01 THE WORK · 02 THE CONFIGURATION · 03 THE SUBSTRATE). [ADR-063](sentinel/decisions/063-map-reading-rail-and-wheel.md) — the reading rail is HORIZONTAL across the top, and the console OWNS THE WHEEL while the pointer is on it, **releasing at both ends** (the beat is scroll-pinned; a console that kept it would trap the page). ⚠ [ADR-062](sentinel/decisions/062-intelligence-map-city.md) is **stale on the drawing** — its isometric city (`map/MapSurface.tsx`) is still on disk and still tested but is NOT what the landing renders; its placement, evidence semantics and confidentiality envelope still bind. ⚠ author at **1280×720**. The console has NO head and NO foot title (U1: everything removed was height, and height is the only currency the drawing spends); every type size is derived from a measured box, each reading crops its own viewBox, and **label-on-label overlap is the check nothing else does**. Readings 01/03 still letter at ~4.5–5.5px against an 8.5px floor and no tuning lever remains — the gap is DENSITY (ADR-063 §Outstanding, owner call)
- **Rail manifest + the journey indicator:** [ADR-031](sentinel/decisions/031-rail-manifest.md) (the rail, the tick ladder, the detent data) → [ADR-055](sentinel/decisions/055-corner-section-readout.md) — the section readout lives in the TOP-RIGHT NAV CORNER and doubles as the drawer trigger; the left/right section menus are deleted and there are no subsections anywhere
- **Rail instruments + the four-corner scheme:** [ADR-059](sentinel/decisions/059-rail-instruments.md) — the journey (Home · Thesis · Arc · Proof · Services · About) TOP-LEFT, nav TOP-RIGHT, brand BOTTOM-LEFT, and Contact · session · theme switch on ONE LINE BOTTOM-RIGHT (U3 — the switch is the outboard ANCHOR; new icons go to its LEFT); plus the right rail's bearing/sector/local telemetry (the vertical section name is REMOVED — the nav corner already names it). Flags `RAIL_INSTRUMENTS` / `SETTINGS_CLUSTER`. ⚠ two clocks that throw nothing when confused — the Arc must stay a BEAT RANGE or it double-lights with Thesis (`tests/lib/rail-instrument-marks.test.ts` is the guard); `#practice` has no mark pending its removal; the bottom-right row's curtain clip is a COPY of `.hud__corner--br`'s. Look-dev at `/test/hud-instruments-lab`
- **Client arcs (/arcs):** [ADR-052](sentinel/decisions/052-client-arcs.md) — client deck pages (workshop/keynote) on the HUD slice; content model in `lib/arcs/`, rules in [`.claude/rules/arcs.md`](.claude/rules/arcs.md). "Arc page" ≠ "the Arc" (LANGUAGE.md). → [ADR-057](sentinel/decisions/057-arc-terminal-motion.md) — **terminal motion**, the pinned-beat grammar on the `-v2` cuts (masthead decodes in place, panels power on, the plane folds LIFO behind an iris); selected per arc by `ArcDef.motion`, so the v1 pages stay byte-identical
- **Workshop corridor variant (/claude-workshop):** [ADR-053](sentinel/decisions/053-workshop-corridor-variant.md) — the homepage variant with **About second** (hero → about → corridor → services → contact); parse options + prototype surgery + `.cw-root`-scoped CSS. ⚠ the about-stage portal slot must never exist in that prototype (it kills the services ring)
- **Hero key visual, per theme:** [ADR-058 Update 2](sentinel/decisions/058-light-mode-theme.md) — the hero is NO LONGER a dark artifact in light mode (§5 reversed): dark `Gateway_v1b.avif` in a `<picture>`, light `Gateway_v2-light.webp` as a CSS background, and the theme-picked preload is script-injected in `app/layout.tsx` (`lib/theme/heroPreload.ts`) because the preload scanner beats every script. ⚠ neither theme may fetch the other's plate — `loading="lazy"` + `display:none` is what enforces it, and you must measure it in a FRESH tab. → [ADR-060](sentinel/decisions/060-hero-theme-glitch.md) — the swap plays a **slice-tear + pixel-resolve glitch**: a canvas over an already-flipped hero, painted synchronously inside the store notify so there is no flash. Kernel `lib/key-visual/themeGlitch.ts` (the `done` frame MUST be the identity or the canvas removal pops); plates warm on toggle HOVER, never on idle
- **Corridor quality governor:** [ADR-038](sentinel/decisions/038-corridor-quality-governor.md) — GPU probe + FPS degradation
- **Landing v7 compositing:** [ADR-008](sentinel/decisions/008-landing-v7-background-layers.md)
- **Brandmark choreography / particles:** [ADR-010](sentinel/decisions/010-brandmark-choreography.md), [ADR-011](sentinel/decisions/011-brandmark-particle-artifact.md), [ADR-013](sentinel/decisions/013-brandmark-journey-refactor.md)
- **Scroll architecture:** [ADR-002](sentinel/decisions/002-scroll-animation-architecture.md)
- **Auth centralization / Supabase RLS:** [ADR-003](sentinel/decisions/003-auth-centralization.md), [ADR-037](sentinel/decisions/037-supabase-rls-trust-boundary.md)
- **Landing data caching:** [ADR-028](sentinel/decisions/028-landing-data-caching.md)
- **Focus overlay system:** [ADR-006](sentinel/decisions/006-focus-overlay-system.md)

When path-scoped rules in [`.claude/rules/`](.claude/rules/) match your files, follow them. Don’t import the whole `sentinel/` tree into prompts — use ADRs, rules, and skills on demand to save context.

## Working on this codebase

- **Before non-trivial work:** open [sentinel/MAINTENANCE.md](sentinel/MAINTENANCE.md) — use **Cycle A** for bugfix follow-up, **Cycle B** for new feature surface.
- **At the end of a session that changed code:** run the **post-incident checklist** in [sentinel/MAINTENANCE.md](sentinel/MAINTENANCE.md); if a row triggers, update ADR / BEST-PRACTICES / rule / skill before pushing.
- **Vocabulary:** [LANGUAGE.md](LANGUAGE.md) — use terms like _Module, Seam, Station, Actor_ consistently.

**Hooks & CI:** [lint-staged](package.json) runs ESLint + Prettier on staged `*.{ts,tsx}` (and Prettier on `*.{json,css,md}`). CI is [`.github/workflows/verify.yml`](.github/workflows/verify.yml): `npm run verify` (lint + typecheck + unit tests) and a production build, plus Playwright corridor smokes and react-doctor (new-issues-only on PRs). Optional: [`.cursor/hooks.json`](.cursor/hooks.json) + [`scripts/sentinel-pre-edit-hint.mjs`](scripts/sentinel-pre-edit-hint.mjs) inject a one-line Sentinel hint on matched writes.

---

This is the Thoughtform.co website, a Next.js application with a sophisticated particle system and HUD-based navigation.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **State**: Zustand
- **Animation**: Framer Motion, GSAP
- **3D**: Three.js, React Three Fiber, Drei
- **Database**: Supabase

## Project Structure

```
app/
  (marketing)/          # Public landing page (V7 prototype composite)
  (admin)/              # Gated tools: /admin, /astrogation, /orrery
  (internal)/           # Dev-only routes: /test/* (proxy-blocked in prod)
  api/                  # API routes (celestial, particles, survey, etc.)
components/
  landing/v7/           # V7 landing: LandingPage, CelestialConnector
  landing/home-v2/      # Depth corridor (DepthGatewayScene, services, arc-cases)
  hud/                  # Navigation chrome (NavigationBar, frames, status)
  gateway/              # ImageParticleGateway, ThreeGateway, KeyVisualPortal
  particles/            # ParticleCanvasV2, ThoughtformSigil, WordmarkMorph
  admin/                # Admin overlays (CelestialEditor, AdminGate)
  auth/                 # AuthProvider
  ui/                   # Shared UI primitives
lib/                    # Utilities, hooks, domain modules (celestial/, auth/, etc.)
supabase/               # Database schema and migrations
docs/                   # All non-decision documentation
  design/               # Mockups, brand explorations, inspiration
  plans/                # Work-in-progress plans
  issues/               # Issue tracker notes (was .linear-issues/)
sentinel/               # Decision records (ADRs), BEST-PRACTICES, MAINTENANCE
```

## Key Components

### Navigation System

- `NavigationBar.tsx` - Top navigation with mobile section indicator
- (The old `NavigationCockpitV2` scroll HUD and its `/archive/current-home`
  route were deleted in the 2026-07 Phase 5 cleanup — git history is the
  archive.)

### Particle System

- `components/particles/ParticleCanvasV2.tsx` - Main particle canvas
- Config stored in Supabase `particle_config` table
- Admin panel at `/admin` for live editing

### Landing Page (V7)

- `app/(marketing)/page.tsx` - Server component that fetches V7 content and celestial slot data
- `lib/v7-parse/` - Reads and parses `public/prototypes/v7/landing-v7-motion.html` at build time (entry `lib/v7-parse/index.ts`; body/CSS/section/rail parsers alongside)
- `components/landing/v7/LandingPage.tsx` - Client component: scroll, reveal, sigil choreography
- `components/landing/v7/CelestialConnector/` - Parametric celestial diagrams between sections

## Database

- Uses Supabase with Row Level Security (RLS)
- Key tables: `particle_config`, `service_sigils`, `celestial_designs`, `celestial_slots`, `survey_items`
- Schema in `supabase/schema.sql`, RLS policies in `supabase/auth-rls.sql`
- Migrations in `supabase/migrations/` (timestamp-prefixed)

## Development Commands

```bash
npm run dev      # Start development server (localhost:3003)
npm run build    # Production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

## Skills Available

Skills live in [`.claude/skills/`](.claude/skills/) and load on demand — don't pull them all into context. Current set:

- **context7** — fetch up-to-date, version-specific library docs. Trigger: "use context7", "get docs for [library]".
- **frontend-design** — front-end / component / responsive design decisions that hold the HUD aesthetic and avoid generic patterns.
- **landing-v7-compositing** — stacking / gateway / hero / shield rules for `components/landing/v7/**` (pairs with ADR-008).
- **landing-performance** — load-order, code-split, and payload doctrine for the landing route (keeps the WebGL corridor and Supabase off First Load JS).
- **brandmark-choreography** — the scroll-driven brandmark journey (continuous transform model, ADR-013).
- **brandmark-particle** — the brandmark particle painters (atmosphere / silhouette / substrate-sphere).
- **thoughtform-design** — Thoughtform-specific design overrides (tokens, shape law, HUD grammar).
- **theme-parity** — both-themes discipline (ADR-058): every new element ships styled AND verified in dark + light; DOM alpha lifts, WebGL palette pairs, per-theme assets, the verify recipe.

## Conventions

- Use TypeScript strictly
- Follow existing code patterns
- Mobile-first responsive design
- CSS variables for theming (--gold, --dawn, etc.)
- Scroll-driven animations with progress values 0-1

### Imports and barrels

- **Feature barrels** (`components/hud/index.ts`, `components/gateway/index.ts`, `lib/celestial/index.ts`) are kept current and are the preferred import path for that feature's public API.
- **Root barrel** (`components/index.ts`) is a historical compatibility layer recording the ADR-004 archival (the `legacy/` tree itself was deleted 2026-07-23 — git history is the archive). Do not add new exports there; import from feature barrels directly.
- Prefer `@/components/feature` or `@/lib/module` over deep path imports when a barrel exists.

### Supabase migrations

- New migration files must use the `YYYYMMDD_descriptive_name.sql` naming convention (e.g. `20260421_celestial_connectors.sql`).
- Older files without date prefixes (`add_presets_to_particle_config.sql`, etc.) are legacy; do not rename them as they are already in the remote migration history.

### Route groups

- `(marketing)` — public-facing pages (the landing page).
- `(admin)` — tools gated by `AdminGate` + `useAuth` (admin login, astrogation, orrery).
- `(internal)` — dev-only routes (`/test/*`) blocked by `proxy.ts` in production (the Next 16 rename of `middleware.ts`).
- New public pages go in `(marketing)`. New admin tools go in `(admin)` with `AdminGate`. New dev/test pages go in `(internal)`.

## Design System Patterns

### Focus Overlay System (ADR-006)

When building any modal, detail view, or focus overlay, use these patterns:

**Required CSS Variables** (defined in `.astrogation`):

```css
--focus-overlay-bg: rgba(10, 9, 8, 0.2);
--focus-overlay-blur: 12px;
--focus-overlay-border: rgba(235, 227, 214, 0.3);
--focus-backdrop-bg: rgba(10, 9, 8, 0.3);
```

**Required Animation** - Apply to the CONTENT element, not the backdrop:

- `assetFocusIn` - for absolutely positioned content (`top: 50%; left: 50%`)
- `modalFocusIn` - for flexbox-centered content (`display: flex; align-items: center`)

```css
animation: assetFocusIn 0.3s ease-out; /* or modalFocusIn */
```

**Required Box Shadow**:

```css
box-shadow:
  0 0 0 1px rgba(235, 227, 214, 0.05),
  0 0 60px rgba(202, 165, 84, 0.1),
  0 30px 80px rgba(0, 0, 0, 0.6);
```

**Required Structure**:

1. Fixed container with backdrop (uses `--focus-backdrop-bg`)
2. Centered overlay with animation (`assetFocusIn`)
3. Content frame with dashed border (`--focus-overlay-border`)
4. Label badge on top (if content has a title)

**Size variants** (small / medium / large): see `sentinel/decisions/006-focus-overlay-system.md`.

### Panel Layout

Both side panels use identical dimensions:

- Width: `340px`
- Margin-top: `40px`
- Height: `calc(100vh - var(--hud-padding, 32px) * 2 - 120px)`

### Grid Item Hover States

All clickable grid items should use:

- `transform: translateY(-2px)` on hover
- `border-color: var(--gold-30)` on hover
- `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4)` on hover

See `sentinel/decisions/006-focus-overlay-system.md` for full documentation.

### Landing v7 Compositing (ADR-008)

Stacking / gateway / hero / shield rules, checklists, and full regression history: [ADR-008](sentinel/decisions/008-landing-v7-background-layers.md) and `.claude/skills/landing-v7-compositing/SKILL.md` (and brandmark ADR-010 for the fixed mark).
