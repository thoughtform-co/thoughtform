---
name: thoughtform-design
description: Thoughtform.co-specific design overrides. Canonical skill lives at ~/.cursor/skills/thoughtform-design/. Delegates to the global evergreen skill for all universal rules (tokens, shape law, HUD grammar, format archetypes). Use when building or reviewing Thoughtform.co UI, CSS, layouts, or components.
---

# Thoughtform.co Design Overrides

The canonical Thoughtform design skill is installed globally at `~/.cursor/skills/thoughtform-design/SKILL.md`. This project-level file provides only the Thoughtform.co-specific delta.

## Reaching for inspiration — query, don't ask

Before improvising a treatment or asking Vince to upload screenshots, query the compiled reference
pool via the `substrate-vault` MCP server: `vault_search { query: "…", rack: "design" }` (add
`lane: "groundtruth"` for his own product interfaces). Notes carry layout, patterns mapped to the
navigation grammar, a style-facet enum line, what to adopt and what to avoid; `vault_read` gives the
`original:` Drive path when the pixels themselves are the answer. Full contract in the global skill.
**These are distillations, not swatches** — colors come back as roles projected onto tokens, never
as hex to lift.

## Key references (global skill)

- **Product appendix:** `references/products/thoughtform-co.md` — repo-specific file paths and conventions
- **Responsive HUD:** `references/web-hud-adaptation.md` — breakpoint ladder, fluid tokens, brandmark handoff, connector compositing
- **Fixed-canvas shell:** `references/cross-format-shell.md` — for any slide/deck/proposal work in this repo

## Depth corridor (home-v2)

- **Corridor grammar:** `references/depth-corridor-grammar.md` — the home-v2 3D depth-corridor invariants: the `paintProgress` timeline law, mirror-camera world-space anchoring, aspect-aware FOV, device tiers, the two-moment mobile composition, and the engagement-gated render-loop contract. Read before editing anything under `components/landing/home-v2/`.

## CSS source of truth

- `components/landing/v7/landing.css` — HUD geometry, breakpoints, connector and CTA patterns
- `components/landing/v7/hooks/useSigilChoreography.ts` — brandmark scroll choreography (drives `BrandmarkActor`)
- `components/landing/v7/BrandmarkActor.tsx` — single persistent HUD / sigil / practice brandmark overlay
- `public/prototypes/v7/landing-v7-motion.html` — HTML prototype parsed at build time

## The corner law (ADR-065) — SUPERSEDES the global skill's one-line shape law

The global skill says only _"corner brackets/chamfers for frames"_, which names
the vocabulary and answers none of _which_, _where_ or _how deep_. The full rule
is [ADR-065](../../../sentinel/decisions/065-corner-law.md), summarised in
[DESIGN.md](../../../DESIGN.md#the-corner-law-adr-065):

- **Chamfer** = a machined housing · **Notch** (one corner) = oriented or
  connected · **Bracket** (additive L) = framed but not a device.
- One grammar per object. **The diagonal is TR + BL** — TL+BR only as the
  mirrored back of a flipped object.
- Depth ladder: seed `16px` · plate `26px` · chrome `0`.
- **The children of a chamfered box are square** — variation is hierarchy, not
  a second decorative style.
- Asymmetry is earned: a single notch points at what the object connects to, or
  marks the edge the mechanism does not use.

⚠ The global `references/identity-system.md` has not been updated; treat this
file as the source until it is.

## Thoughtform.co-specific rules

- Dev server runs on **port 3003** exclusively
- The v7 landing uses a **21-position depth gauge** (not the deck's 13-pos bearing grid)
- Hero titles use PT Mono Bold uppercase; the brand wordmark is inline SVG (not a font)
- The page is a layered composite: fixed gateway glow (z:0), sticky hero (z:1), opaque shield sections (z:2) inside `.stations` (z:10). Full-bleed elements at z>=2 must declare `background: var(--void)`.
