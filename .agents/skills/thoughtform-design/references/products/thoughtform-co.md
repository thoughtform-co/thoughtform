# Appendix: Thoughtform.co (`01_thoughtform`)

Marketing / editorial site. **The canonical live implementation of the `web-format-patterns.md` web shell** — read that doc first for universal web rules. This appendix covers what is v5-specific and flags drift to resolve.

## Repo + source of truth

- **Repo root:** `C:\Users\buyss\Manifold Delta\Artifacts\01_thoughtform\` (worktrees under `.claude/worktrees/`).
- **Tokens / globals:** `app/styles/variables.css` — all colour, typography, spacing, HUD layout, motion tokens.
- **HUD frame component:** `components/hud/HUDFrame.tsx` — renders rails, ticks, scroll chevron, corner brackets, bottom bar. Currently drives tick labels from an inline `tickLabels` record (indices 0/5/10/15/20 → "0"/"2"/"5"/"7"/"10").
- **HUD styles:** `app/styles/hud.css` — `.hud-rail`, `.tick`, `.tick-major`, `.tick-minor`, `.scale-indicator`, corner/bar rules.
- **Navigation cockpit:** `components/hud/NavigationCockpitV2/index.tsx` — orchestrates scroll-driven animations across all sections, owns the `scrollProgress` source of truth.
- **Navigation bar:** `components/hud/NavigationBar.tsx` — desktop navbar + mobile section indicator + sigil button.
- **Particle canvas:** `components/hud/ParticleCanvasV2.tsx` — dynamic-imported, client-only, sits between the HUD layer (z-100 fixed chrome) and the scrollable content sections.
- **Section registry:** `components/hud/HUDFrame.tsx` lines 15–51 (`sectionData`) — sector/vector/signal metadata per section.
- **Focus overlay system:** `sentinel/decisions/006-focus-overlay-system.md` — ADR defining required CSS vars, animations (`assetFocusIn`, `modalFocusIn`), box-shadow stack, and size variants.
- **Figma Codex:** file `XO8yGN90SfxiG1hmYPGYXn`, slide reference frame `1802:5717`. See `figma-codex-map.md` for node IDs.

## Section map (current v5)

Reading order (top → bottom of the scroll):

| sectionId    | Sector (metadata) | Vector (metadata) | Signal | Landmark | Nav label    |
| ------------ | ----------------- | ----------------- | ------ | -------- | ------------ |
| `hero`       | Origin            | Entry             | 61     | 1        | 01 HOME      |
| `definition` | Interface         | Discovery         | 68     | 2        | 02 INTERFACE |
| `manifesto`  | Manifesto         | Creative          | 74     | 3        | 03 MANIFESTO |
| `services`   | Services          | Strategic         | 88     | 4        | 04 SERVICES  |
| `contact`    | Contact           | Destination       | 95     | 5        | 05 CONTACT   |

These are content semantics — the skill does not prescribe changing them. When adding a new section, add a new entry and keep landmark indices sequential.

## How v5 realizes the universal web shell

| Universal rule (`web-format-patterns.md`)   | v5 implementation                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----- | ------------------------- |
| Canvas = viewport, `clamp()` padding        | `--hud-padding: clamp(32px, 4vw, 64px)` in `variables.css`                                             |
| Safe-area inset handling                    | `--hud-pad-*: max(var(--hud-padding), env(safe-area-inset-*, 0px))`                                    |
| 21-pos depth-gauge ticks                    | `tickCount = 20` in `HUDFrame.tsx`; labels `"0"/"2"/"5"/"7"/"10"` on indices 0/5/10/15/20              |
| Scroll chevron `top: scrollProgress * 100%` | `<div className="scale-indicator" style={{ top: ${scrollProgress * 100}% }} />` at ~`HUDFrame.tsx:161` |
| Rail widths (60 → 32 → 28)                  | `--rail-width: 60px` default; `32px` ≤768; `28px` ≤480                                                 |
| Corner brackets (2px → 1.5px)               | `.hud-corner` stylesheet rules in `hud.css`                                                            |
| Section markers on right rail               | Landmark numerals in right rail container                                                              |
| Responsive breakpoints                      | Standard `@media (max-width: 900px                                                                     | 768px | 480px)`blocks in`hud.css` |

v5's realization is the **canonical reference implementation** for the universal web shell. When the universal doc says "21-pos depth gauge with labels 0/2/5/7/10," it is describing v5. If this appendix and `web-format-patterns.md` disagree, `web-format-patterns.md` wins.

## Drift flags (known issues the skill prescribes fixing)

These are places where the v5 codebase currently deviates from the canonical. Resolve in v5 code as separate implementation tasks.

### 1. Typography: IBM Plex Mono → PT Mono

**Drift:** v5 uses IBM Plex Mono as its monospace stack (`--font-data: var(--font-ibm-plex-mono), "IBM Plex Mono", monospace`). The brand canonical is **PT Mono** (see Layer 1 typography in SKILL.md, and `typography-system.md`).

**Migration path:**

1. Replace the font-face declaration / import in the Next.js layout (`app/layout.tsx` or equivalent) to load PT Mono.
2. Update `--font-data` or rename to `--font-pt-mono` in `variables.css`.
3. Grep for hard-coded `"IBM Plex Mono"` references in component styles and swap.
4. Regression-test the HUD tick labels, eyebrows, and headings — PT Mono has slightly different metrics.

Schedule as a dedicated pass; affects every text element.

### 2. Brandmark placement: top-center navbar → bottom-left only

**Drift (pending Step 11):** v5 currently renders the Thoughtform sigil/wordmark in the navbar (`.navbar-logo` on desktop, `.mobile-sigil` on mobile). The canonical (per `web-format-patterns.md` §5 and `format-adaptation-matrix.md` §2) is **bottom-left only** — navbar holds nav links only.

**Migration path:**

1. Add a fixed-positioned `.hud-brandmark-anchor` element in `HUDFrame.tsx`, positioned `bottom: var(--hud-pad-bottom); left: var(--hud-pad-left);`.
2. Render the wordmark or brandmark inside at 40px reference size, clamping on responsive.
3. Remove the logo slot from `NavigationBar.tsx` (`.navbar-logo` and `.mobile-sigil`).
4. Remove associated CSS rules in `_navbar.css`.
5. In-hero and in-definition wordmark appearances are **content**, not shell — do not remove those.

Resolved as part of Step 11 of the current skill-expansion task.

### 3. Add any future drifts here as they are discovered

Follow the pattern: describe the drift in one paragraph, give the file paths, outline the migration path in numbered steps, note whether it's scheduled or deferred.

## Things that are v5-product-specific (not drift)

These are intentional v5 features that expand beyond the universal web shell. They are product-specific overlays, not deviations.

- **Particle canvas** via `ParticleCanvasV2` + the `ParticleConfigProvider` context. Live-tunable via `/admin`. Config persisted in Supabase `particle_config`.
- **NavigationCockpitV2** — the v5-specific scroll orchestrator. Owns the single `scrollProgress` source of truth and threads it to the HUD + particles + section-level scroll transforms.
- **Editorial hero + section compositions** — large in-content wordmarks, definition frames, manifesto/services typography treatments. These are section design, not shell chrome.
- **Admin panel** at `/admin` for editing particle config, pages, sections, elements. Not part of the brand shell; lives in a separate auth'd context.
- **Supabase-backed content** — `pages`, `sections`, `elements`, `design_log` tables for editable site content. The skill doesn't prescribe this; it's a v5 platform choice.

## Build / dev

```bash
npm run dev      # localhost:3003 — dev server
npm run build    # production build
npm run lint     # ESLint
npm run format   # Prettier
```

When verifying HUD chrome changes, run `npm run dev` and check at desktop (>1100px), tablet (~900px), mobile (~480px) breakpoints.

## Conventions (inherited from `CLAUDE.md`)

- TypeScript strictly.
- Follow existing code patterns.
- Mobile-first responsive design.
- CSS variables for theming (`--gold`, `--dawn`, etc.).
- Scroll-driven animations with progress values `[0, 1]`.
- Follow `sentinel/decisions/006-focus-overlay-system.md` for any modal or focus overlay.

## Related skill docs

- `../web-format-patterns.md` — universal web rules (canonical; v5 is a reference implementation).
- `../mobile-format-patterns.md` §1 — responsive mobile web rules.
- `../hud-frame-implementation.md` §3b — the tick-variant family definition.
- `../format-adaptation-matrix.md` — first-stop router for any format decision.
- `../../CLAUDE.md` (repo root) — v5-specific project context and conventions.
