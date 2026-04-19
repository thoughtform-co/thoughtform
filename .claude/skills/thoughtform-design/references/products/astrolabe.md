# Appendix: Astrolabe (`02_astrolabe.thoughtform`)

Slides, Template Forge, and app shell share the HUD language but **intensity differs**: presentations use full or minimalistic HUD modes; **viewport shell** (`NavigationGrid`) is corners + rails — no default bottom-left compass unless specified.

## Source of truth

- **Figma:** Brand Codex Brand System page (`1767:3744`), variable collection `Thoughtform/HUD`.
- **Global styles / HUD classes:** `app/globals.css` (e.g. `.tf-hud-*`).
- **Rail geometry, ticks, footer insets:** `lib/navigation/rail-contract.ts` (`HUD_TICK_MARKS`, `slideGuideInsetPx`, `slideFooterLeftX`, `slideFooterBaselineY`, `frameLabels` behavior).
- **Implementation reference:** `ForgeHUDOverlay.tsx`, `NavigationGrid.tsx`.
- **Design patterns:** `.claude/skills/frontend-design/DESIGN_PATTERNS.md` (when present).

## Modes

- **Full HUD** — Fluid rail aside, guide hairline, L-corners with clean vertex, Figma-derived tick rhythm; optional diamond indicator + readouts.
- **Minimalistic** — Corner motifs only (vectors `vector-1`…`vector-6` or `brackets`), no rails.

See `references/hud-frame-implementation.md` and `references/presentation-patterns.md` for cross-cutting rules.
