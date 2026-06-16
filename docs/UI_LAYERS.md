# UI Layers

The repo ships three different UI surfaces. They serve distinct
purposes and should not be conflated. Last updated 2026-06-16
(Homepage Refactor And Hardening Plan, Phase 4).

## Layer 1 — `components/` (in-app feature components)

**Where:** [`components/`](../components)

**What:** Application code. HUD chrome, landing page surfaces,
admin overlays, particle/gateway scenes, brand artifacts. These
components are owned by the app, depend on app-specific state
(Zustand stores, scroll hooks, Supabase contexts), and frequently
touch live DOM via `dangerouslySetInnerHTML` / refs.

**Use it when:** building or editing the marketing route, admin
tools, internal test pages, or any feature that lives behind an app
URL. Feature folders own their own barrels (`components/hud/`,
`components/gateway/`, `components/landing/v7/`, etc.).

**Public API surfaces:**

- `components/ui/` — small app-local primitives (CornerBracket,
  Tree, Typewriter). These are app-shaped, not design-system shaped
  — they assume Thoughtform's HUD context.
- Feature folders are imported via their own index barrels
  (`@/components/hud`, `@/components/gateway`, …). The historical
  root `components/index.ts` is a documented compatibility layer
  (ADR-004) — do NOT add new exports there.

## Layer 2 — `packages/ui` (`@thoughtform/ui` design system)

**Where:** [`packages/ui/`](../packages/ui)

**What:** A standalone npm-style workspace package with the
canonical Thoughtform brand tokens, atoms, molecules, and organisms
following atomic-design conventions. Surface-agnostic: no app
state, no scroll hooks, no Supabase. Ships its own theme tokens.

**Use it when:** authoring components meant to be reused **outside**
the marketing app — Astrolabe, Atlas, Sigil, Vesper, or any future
Thoughtform product. The headless brand system lives here.

**Import it as:** `import { ... } from "@thoughtform/ui"` (or a
sub-path like `@thoughtform/ui/atoms`). Path aliases configured in
[`tsconfig.json`](../tsconfig.json).

## Layer 3 — `registry/` (shadcn-style snippet registry)

**Where:** [`registry/`](../registry)

**What:** A shadcn-compatible component registry — recipes that
designers and external developers can copy/paste via the `shadcn`
CLI. Carries Storybook stories + small fixtures.

**Use it when:** publishing a snippet for outside consumption (the
"copy-paste this into your project" flow). Maintained by hand; the
registry is shipped as a separate Vercel surface.

**Build via:** `npm run registry:build`.

## Decision matrix

| Need                                                       | Layer                          |
| ---------------------------------------------------------- | ------------------------------ |
| New marketing/admin page                                   | `components/` (feature folder) |
| Brand primitive shared across 2+ Thoughtform products      | `packages/ui/`                 |
| Snippet for external/community consumption                 | `registry/`                    |
| Small in-app helper that doesn't earn a feature folder yet | `components/ui/`               |

If you find yourself debating between Layer 1 and Layer 2, the test
is: **does it depend on app state or app context?** If yes, it's
Layer 1; if no, it can graduate to Layer 2.

## Migration history

- 2026-06-16 — `components/hud/index.ts` retired its cross-feature
  re-exports of `ParticleCanvasV2`, `ThoughtformSigil`,
  `ParticleWordmarkMorph`, `ImageParticleGateway`, `ThreeGateway`,
  and `KeyVisualPortal`. Every active consumer already imports from
  the feature barrels directly; the re-exports were leftover compat
  shims with no live caller.
- 2026-04 (ADR-004) — root `components/index.ts` frozen as a
  compatibility layer. New exports go in feature barrels.

See also:

- ADR-004 — Legacy code archival
- ADR-009 — Repo structure conventions
