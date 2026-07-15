# Thoughtform.co - Project Context

## Sentinel — patterns and decisions

Read [sentinel/BEST-PRACTICES.md](sentinel/BEST-PRACTICES.md) and the **ADR** relevant to your task before non-trivial changes. Full index: [`sentinel/decisions/`](sentinel/decisions/) (ADR-001 … ADR-042). Load-bearing entries for the current surface:

- **Home-v2 depth corridor:** [ADR-018](sentinel/decisions/018-home-v2-depth-corridor.md) — the dominant landing surface (scroll-driven WebGL corridor)
- **Arc cases (Build park):** [ADR-033](sentinel/decisions/033-arc-cases-orbit.md) → [ADR-042](sentinel/decisions/042-arc-cases-cue.md) — cases orbit, terrace, terminal, card, sigil, cue
- **Rail manifest:** [ADR-031](sentinel/decisions/031-rail-manifest.md)
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
  (internal)/           # Dev-only routes: /test/* (middleware-blocked in prod)
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
legacy/                 # Archived code (excluded from TypeScript build)
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

## Conventions

- Use TypeScript strictly
- Follow existing code patterns
- Mobile-first responsive design
- CSS variables for theming (--gold, --dawn, etc.)
- Scroll-driven animations with progress values 0-1

### Imports and barrels

- **Feature barrels** (`components/hud/index.ts`, `components/gateway/index.ts`, `lib/celestial/index.ts`) are kept current and are the preferred import path for that feature's public API.
- **Root barrel** (`components/index.ts`) is a historical compatibility layer documenting legacy moves per ADR-004. Do not add new exports there; import from feature barrels directly.
- Prefer `@/components/feature` or `@/lib/module` over deep path imports when a barrel exists.

### Supabase migrations

- New migration files must use the `YYYYMMDD_descriptive_name.sql` naming convention (e.g. `20260421_celestial_connectors.sql`).
- Older files without date prefixes (`add_presets_to_particle_config.sql`, etc.) are legacy; do not rename them as they are already in the remote migration history.

### Route groups

- `(marketing)` — public-facing pages (the landing page).
- `(admin)` — tools gated by `AdminGate` + `useAuth` (admin login, astrogation, orrery).
- `(internal)` — dev-only routes (`/test/*`) blocked by `middleware.ts` in production.
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
