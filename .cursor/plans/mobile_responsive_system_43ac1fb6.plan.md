---
name: Mobile responsive system
overview: Create an evergreen, token-driven responsive system (optimized for large phones like iPhone Pro Max) and retrofit key UI (HUD + NavigationCockpit) to consume it for consistent scaling of text and frames.
todos:
  - id: add-responsive-tokens
    content: Add safe-area + fluid typography + frame sizing tokens in app/styles/variables.css, including a ≤480px refinement layer.
    status: completed
  - id: hud-safe-area
    content: Update app/styles/hud.css to use safe-area-derived paddings and ensure rails/corners/compass are well-positioned on large phones.
    status: completed
    dependencies:
      - add-responsive-tokens
  - id: components-typography
    content: Update app/styles/components.css to use the new typography scale (buttons/labels/terminal defaults) while keeping touch targets ≥44px.
    status: completed
    dependencies:
      - add-responsive-tokens
  - id: navcockpit-retrofit
    content: Refactor app/styles/navigation.css (and minimal TSX if required) so bridge/manifesto frames and key text sizes consume shared tokens and scale smoothly on large phones.
    status: completed
    dependencies:
      - add-responsive-tokens
      - components-typography
  - id: viewport-fit-cover
    content: "Add Next.js viewport metadata (viewportFit: cover) in app/layout.tsx so iOS safe-area insets work correctly."
    status: completed
    dependencies:
      - add-responsive-tokens
  - id: responsive-qa
    content: Validate iPhone Pro Max portrait behavior (layout, readability, spacing consistency) and iterate on token values if needed.
    status: completed
    dependencies:
      - hud-safe-area
      - components-typography
      - navcockpit-retrofit
      - viewport-fit-cover
---

# Mobile-first responsive system (evergreen)

## Goals

- Make the site **mobile-friendly on large phones (≈428–480px width)** with consistent, “evergreen” scaling (text + frames + HUD).
- Replace one-off pixel tweaks with a **small set of shared responsive tokens** (CSS variables) + a few stable breakpoints.
- Ensure layouts respect **iOS dynamic viewport** (dvh/svh) and **safe areas** (notch/home indicator).

## Strategy

- **Tokenize**: Add responsive CSS variables for typography + spacing + frame sizing in [`app/styles/variables.css`](app/styles/variables.css).
- **Safe-area aware HUD**: Update [`app/styles/hud.css`](app/styles/hud.css) to use derived safe-area paddings (so corners/rails/compass don’t collide with iPhone UI).
- **Component consistency**: Update [`app/styles/components.css`](app/styles/components.css) to use the shared typography scale (buttons, labels, terminal frame defaults).
- **NavigationCockpit retrofit**: Update [`app/styles/navigation.css`](app/styles/navigation.css) (and only minimal TSX where needed) to consume the same tokens for frame widths, padding, and text sizing.

## Breakpoints (small set)

- **Default**: desktop/tablet landscape.
- **≤ 900px**: compact HUD behavior (already present).
- **≤ 768px**: tablet portrait + mobile baseline.
- **≤ 480px**: phone-focused refinements (primary target: iPhone Pro Max class at ~430px).

## Implementation steps

- Add safe-area variables and derived paddings:
- `--safe-top/left/right/bottom: env(safe-area-inset-*, 0px)`
- `--hud-pad-top/left/right/bottom: max(var(--hud-padding), var(--safe-*)))`
- Add a fluid typography scale:
- e.g. `--type-data-sm`, `--type-data-md`, `--type-body`, `--type-display` using `clamp(...)` tuned for 430–480 widths.
- Add frame sizing tokens:
- e.g. `--frame-max-w`, `--frame-pad-x`, `--frame-pad-y`, `--frame-radius` (if needed), using `min()/max()/clamp()`.
- Wire tokens into HUD:
- Replace uses of `var(--hud-padding)` in positioning with `var(--hud-pad-*)`.
- Ensure rails/corners maintain consistent inset on iPhone.
- Wire tokens into shared components:
- Use typography tokens for `.btn`, nav labels, terminal labels.
- Ensure touch targets remain ≥44px.
- Retrofit NavigationCockpit:
- Replace hardcoded mobile widths/paddings with shared frame tokens.
- Normalize the mobile manifesto/bridge frame sizing and typography (consistent with the system, not bespoke).
- Prefer `clamp()` for hero/tagline sizing so it scales smoothly between 430→480.
- Add iOS viewport support in Next.js layout:
- Export `viewport` from [`app/layout.tsx`](app/layout.tsx) with `viewportFit: "cover"` so safe-area insets are meaningful.

## Validation

- Verify in browser emulation for **iPhone 14/15 Pro Max portrait** (≈430×932) and a second large-phone width near 480px.
- Confirm:
- No HUD overlap with top/bottom browser UI.
- Frames feel centered and proportionate.
