# Thoughtform.co

The Thoughtform website (Next.js 16, React 19, Three.js, Supabase): the
landing's scroll-driven corridor, the HUD frame around every page, the client
arcs and proposals under `/arcs`, the musings, and the dev-only labs under
`/test`.

## How context works in this repo (read once)

This file is an index. It stays short on purpose: everything in it loads into
every session, and a long list of past rulings loaded everywhere is what kept
pulling new work back into old patterns (2026-10-11).

- **Decisions** are ADRs in [`sentinel/decisions/`](sentinel/decisions/).
- **Per-surface rulings** (the corridor, the casefile, the services ring, the
  arcs, the era stage, the musings, the phone) are digested in
  [`sentinel/SURFACES.md`](sentinel/SURFACES.md). Read a surface's entry
  before changing that surface. Do not read it as a design system.
- **Path-scoped rules** in [`.claude/rules/`](.claude/rules/) load by
  themselves when you touch a file they cover. Every rule file carries
  `paths:` frontmatter; a rule without it loads into every session, so a new
  rule file must have it.
- **Skills** in [`.claude/skills/`](.claude/skills/) load on demand.

## New design work (owner, 2026-10-11)

A new section, visual or page starts from its **brief and its references**,
not from the house's existing components or rulings.

1. Build it in a **self-contained folder** (its own components, its own
   stylesheet) that imports nothing from the arcs, the landing or another lab.
   The brand reaches it through tokens only: ground `#0A0908`, text
   `#EBE3D6`, Tensor gold `#CAA554` as the one accent, PP Neue Montreal for
   text, PT Mono for small labels.
2. Draw **one main object** first and get it right; words come second, and
   fewer of them.
3. Show two or three directions as **stills at 1280×720 and 1470×830**,
   judged by eye. Measurement (type floors, fit, overlap) is a check after
   the eye, never the design method.
4. ADRs and `SURFACES.md` bind the surfaces they name. They do not bind a
   new composition until the owner picks it and it lands on a surface.

Worked example: `components/xb-proposal/` (the X-Bionic offer and layer,
rebuilt from `docs/plans/xb-offer-rebuild-handoff.md`).

## Working on this codebase

- **Before non-trivial work:** [sentinel/MAINTENANCE.md](sentinel/MAINTENANCE.md), Cycle A for a bugfix follow-up, Cycle B for a new surface. At the end of a session that changed code, run its post-incident checklist.
- **Vocabulary:** [LANGUAGE.md](LANGUAGE.md) (Module, Seam, Station, Actor).
- **One section, one record, every surface (owner, 2026-10-02).** Content that appears on several pages lives in one shared record and every page reads it by reference. Edit the record, never a page's copy, then grep the export and check every consumer. The standing records are listed in [`sentinel/SURFACES.md`](sentinel/SURFACES.md#one-section-one-record).
- **Hooks and CI:** lint-staged runs ESLint and Prettier on staged files. CI (`.github/workflows/verify.yml`) runs `npm run verify` (lint, typecheck, unit tests), a production build, Playwright smokes and react-doctor.
- **Code conventions:** TypeScript strictly; follow the existing CODE patterns; CSS variables for theming; scroll-driven animation takes a progress value 0 to 1. Feature barrels (`components/hud`, `components/gateway`, `lib/celestial`) are the import path; never add exports to the root `components/index.ts`.
- **Supabase migrations:** new files are `YYYYMMDD_descriptive_name.sql`; never rename the legacy undated ones.

## Structure

```
app/
  (marketing)/   public pages: the landing, /arcs, /musings
  (admin)/       gated tools (AdminGate): /admin, /astrogation, /orrery
  (internal)/    dev-only /test/* routes, blocked by proxy.ts in production
  api/
components/      landing/v7, landing/home-v2, hud, arcs, gateway, particles, ...
lib/             domain modules (arcs/, cases/, celestial/, auth/, ...)
supabase/        schema and migrations
docs/            design/, plans/, issues/
sentinel/        ADRs, SURFACES.md, BEST-PRACTICES, MAINTENANCE
```

`proxy.ts` is Next 16's rename of `middleware.ts`, and route params are
Promises.

## Commands and URLs

```bash
npm run dev      # dev server, default http://localhost:3003
npm run build
npm run lint
npm run verify
```

Give the full URL, never a path, with the port read off the running server
(two sessions often share this tree and `autoPort` moves the second one):

| file                                  | URL                                         |
| ------------------------------------- | ------------------------------------------- |
| `app/(internal)/test/<name>/page.tsx` | `http://localhost:3003/test/<name>`         |
| `app/(marketing)/page.tsx`            | `http://localhost:3003/`                    |
| an arc                                | `http://localhost:3003/arcs/<group>/<leaf>` |
| `app/(admin)/<tool>/page.tsx`         | `http://localhost:3003/<tool>`              |

`/test/*` is proxy-blocked in production, so it has no thoughtform.co URL.
