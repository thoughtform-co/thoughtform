---
name: thoughtform-design
description: Thoughtform.co-specific design overrides. Canonical skill lives at ~/.cursor/skills/thoughtform-design/. Delegates to the global evergreen skill for all universal rules (tokens, shape law, HUD grammar, format archetypes). Use when building or reviewing Thoughtform.co UI, CSS, layouts, or components.
---

# Thoughtform.co Design Overrides

The canonical Thoughtform design skill is installed globally at `~/.cursor/skills/thoughtform-design/SKILL.md`. This project-level file provides only the Thoughtform.co-specific delta.

## Key references (global skill)

- **Product appendix:** `references/products/thoughtform-co.md` — repo-specific file paths and conventions
- **Responsive HUD:** `references/web-hud-adaptation.md` — breakpoint ladder, fluid tokens, brandmark handoff, connector compositing
- **Fixed-canvas shell:** `references/cross-format-shell.md` — for any slide/deck/proposal work in this repo

## CSS source of truth

- `components/landing/v7/landing.css` — HUD geometry, breakpoints, connector and CTA patterns
- `components/landing/v7/hooks/useSigilChoreography.ts` — brandmark handoff choreography
- `public/prototypes/v7/landing-v7-motion.html` — HTML prototype parsed at build time

## Thoughtform.co-specific rules

- Dev server runs on **port 3003** exclusively
- The v7 landing uses a **21-position depth gauge** (not the deck's 13-pos bearing grid)
- Hero titles use PT Mono Bold uppercase; the brand wordmark is inline SVG (not a font)
- The page is a layered composite: fixed gateway glow (z:0), sticky hero (z:1), opaque shield sections (z:2) inside `.stations` (z:10). Full-bleed elements at z>=2 must declare `background: var(--void)`.
