# Thoughtform.co - Project Context

## Sentinel — patterns and decisions

Read [sentinel/BEST-PRACTICES.md](sentinel/BEST-PRACTICES.md) and the **ADR** relevant to your task before non-trivial changes. Full index: [`sentinel/decisions/`](sentinel/decisions/).

- **The per-surface digest:** [`sentinel/DIGEST.md`](sentinel/DIGEST.md) — the load-bearing ADR entries for each surface (corridor, services, proof, musings, rail, arcs, Trinny, hero, phone) and the older design-system patterns, moved out of this file on 2026-10-12. Open it on demand and read only the entry for the surface you touch.
- **Path-scoped rules:** [`.claude/rules/`](.claude/rules/) — every file declares `paths:` and loads only when you work on a file it governs.

When path-scoped rules in [`.claude/rules/`](.claude/rules/) match your files, follow them. Don’t import the whole `sentinel/` tree into prompts — use ADRs, rules, and skills on demand to save context.

## New design starts from the brief

House rulings (the ADRs, the digest, the path-scoped rules) bind the surfaces they were made for. They are not a style to carry into new work. When a section, page or diagram is being designed anew:

- Build it in a self-contained lab under `app/(internal)/test/<name>/` that imports nothing from the arcs, the landing or the lattice: its own tokens, its own type, its own drawing.
- Start from the owner's brief and the reference images, not from the repo's existing components or this digest.
- One object first, then the words. One direction at a time, judged by eye on stills at the owner's viewport. Measurement comes after, as a check, never as the target.
- Port into the live surface only after the owner picks, and only then let the surface's rules apply.

(Ruled 2026-10-12, after the X-Bionic offering: the session that drew it well never loaded the house rules; the ones that drew flowcharts started with ~430 KB of them.)

## Working on this codebase

- **Before non-trivial work:** open [sentinel/MAINTENANCE.md](sentinel/MAINTENANCE.md) — use **Cycle A** for bugfix follow-up, **Cycle B** for new feature surface.
- **At the end of a session that changed code:** run the **post-incident checklist** in [sentinel/MAINTENANCE.md](sentinel/MAINTENANCE.md); if a row triggers, update ADR / BEST-PRACTICES / rule / skill before pushing. A capture goes into its ADR or a path-scoped rule, never into this file: `CLAUDE.md` is an index with a 10 KB ceiling (`tests/lib/context-budget.test.ts`).
- **Vocabulary:** [LANGUAGE.md](LANGUAGE.md) — use terms like _Module, Seam, Station, Actor_ consistently.
- ⚠ **ONE SECTION, ONE RECORD, EVERY SURFACE (owner, 2026-10-02).** When a section gains new content — a film on an era, a proof card, a frame in a worked example — every page that shows that section shows it too. The standing records and the hoisting rule: [`sentinel/DIGEST.md`](sentinel/DIGEST.md) §Working on this codebase.

**Hooks & CI:** [lint-staged](package.json) runs ESLint + Prettier on staged `*.{ts,tsx}` (and Prettier on `*.{json,css,md}`). CI is [`.github/workflows/verify.yml`](.github/workflows/verify.yml): `npm run verify` (lint + typecheck + unit tests) and a production build, plus Playwright corridor smokes and react-doctor (new-issues-only on PRs). Optional: [`.cursor/hooks.json`](.cursor/hooks.json) + [`scripts/sentinel-pre-edit-hint.mjs`](scripts/sentinel-pre-edit-hint.mjs) inject a one-line Sentinel hint on matched writes.

---

This is the Thoughtform.co website, a Next.js application with a sophisticated particle system and HUD-based navigation.

## Tech Stack

- **Framework**: Next.js 16 (App Router; `proxy.ts` is the Next 16 rename of `middleware.ts`, and route params are Promises)
- **UI**: React 19, Tailwind CSS
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

## Development Commands

```bash
npm run dev      # Start development server (localhost:3003)
npm run build    # Production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

### Naming a page — give the FULL URL, never the path

Per the global rule, any reply that points at a page on this site prints the
whole thing, on its own line: `http://localhost:3003/test/voidwalker-holo-gallery`.
A route group is invisible in the URL, so the mapping is mechanical:

| file                                   | URL                                   |
| -------------------------------------- | ------------------------------------- |
| `app/(internal)/test/<name>/page.tsx`  | `http://localhost:3003/test/<name>`   |
| `app/(marketing)/page.tsx`             | `http://localhost:3003/`              |
| `app/(marketing)/arcs/[slug]/page.tsx` | `http://localhost:3003/arcs/<slug>`   |
| the same file, on a CLIENT slug        | `http://localhost:3003/arcs/<client>` |
| `app/(admin)/<tool>/page.tsx`          | `http://localhost:3003/<tool>`        |

⚠ **3003 is the default, not a guarantee** — `scripts/dev-server.mjs` honours a
harness-assigned `PORT` and `.claude/launch.json` sets `autoPort`, precisely so
a second session in this tree gets a free port. Read the port off the running
server (`preview_start` / `preview_list`, or curl the candidate) before quoting
a URL; the other session's server is usually the one to attach to.
⚠ `(internal)` routes are proxy-blocked in production, so a `/test/*` page has
**no** thoughtform.co URL to offer alongside the local one.

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
- Follow existing code patterns when changing a shipped surface; a new composition starts from the brief ("New design starts from the brief", below)
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
