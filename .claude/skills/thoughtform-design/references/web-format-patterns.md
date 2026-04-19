# Web Format Patterns

**Freedom tier:** MEDIUM for patterns; LOW for the tick geometry and chevron behavior when the v5 implementation is canonical.

Canonical reference for **scroll-driven, viewport-as-canvas** Thoughtform surfaces. Thoughtform.co (v5) is the authoritative live implementation. If this doc and the v5 codebase disagree, the doc wins and v5 is drift to correct (see `products/thoughtform-co.md` for the current drift list).

Before reading this, confirm via `format-adaptation-matrix.md` that the format you are building is actually a web surface (responsive, scroll-driven, viewport-as-canvas). For static artifacts that happen to render in a browser (9:16 PDFs, fixed-canvas exports), read `mobile-format-patterns.md` §2 instead.

## 1. Canvas model

The **viewport is the canvas**. There is no fixed aspect ratio, no reference resolution, no `--tf-scale`. Dimensions come from the user's browser.

Key consequences:

- **Margins use `clamp()`**, not scale factor. Canonical token: `--hud-padding: clamp(32px, 4vw, 64px)`.
- **Safe-area insets are folded in** via `max(var(--hud-padding), env(safe-area-inset-*))`. Notched devices and browser chrome are first-class.
- **Rail width is fixed per breakpoint**, not scaled. 60px desktop / 32px mobile / 28px micro.
- **The 9×17 content grid still applies** inside the margin-inset box, but the cells are fluid (percent-based), not pixel-based.
- **No `transform: scale()` tricks.** If you find yourself scaling the shell, you are in specimen mode (slide reference), not web.

## 2. Tick variant — 21-position depth gauge (LOW freedom)

Rails on web render the **21-position depth gauge** variant. This is a first-class canonical, not a mobile-degraded version of the 13-pos bearing grid. See `hud-frame-implementation.md` §3b for the family definition.

### Rationale (why this variant, not bearing grid)

On slides, the rail is a **location gauge** — it tells you where this frame sits in a deck of fixed frames. 13 positions with bearing labels (letters or short tokens at 33.33% and 66.67%) make sense because the reader lands at a waypoint and reads it.

On web, the rail is a **descent gauge** — it tells the reader how far they have scrolled through a continuous document. The semantic is "depth into latent space," not "location at a waypoint." 21 positions with major ticks every 5 and numeric labels (depth indicators "0", "2", "5", "7", "10") make the descent readable at a glance. The chevron's `top` position tracks `scrollProgress` directly, so every pixel of scroll corresponds to a pixel of chevron movement on the rail.

### Canonical values (from v5)

```ts
const tickCount = 20; // 21 total ticks (indices 0–20)
const tickLabels: Record<number, string> = {
  0: "0",
  5: "2",
  10: "5",
  15: "7",
  20: "10",
};
```

```css
.tick {
  height: 1px;
  background: var(--gold-50);
}
.tick-major {
  width: 20px;
  background: var(--gold);
} /* every 5th */
.tick-minor {
  width: 10px;
  background: var(--gold-50);
}
```

Distributed via `justify-content: space-between` on the rail's tick container — the ticks land at exact 5% intervals (100 / 20 = 5).

### Tick labels

Labels sit outside the rail in mono 9px:

- **Left rail labels:** `left: 24px` (pushed into content area, away from viewport edge).
- **Right rail labels:** `right: 24px`.
- Colour: `var(--dawn-30)`.
- **Hide below 900px viewport width.** The numeric depth still reads from the density of majors; text would crowd.

## 3. Gold chevron — scroll-driven (LOW freedom)

The scroll chevron is the most load-bearing always-on anchor on web. It is the "you are here" indicator for a continuous descent.

### Geometry

- **Horizontal bar:** 2px tall, full rail width, colour `var(--gold)` (`#CAA554`).
- **Diamond marker:** 10×10px, rotated 45°, colour `var(--gold)`. Positioned `left: -5px; top: -4px` relative to the bar.
- The diamond sits slightly above and to the left of the bar so the combined shape reads as a chevron pointing inward to the rail.

### Movement contract

```tsx
<div className="scale-indicator" style={{ top: `${scrollProgress * 100}%` }} />
```

- `scrollProgress` is a normalised float `[0, 1]` computed as `currentScroll / totalScrollHeight`.
- Drive it from a single source of truth (one scroll listener, `requestAnimationFrame`-throttled).
- **Never use `setInterval`.** Scroll telemetry must be `rAF`-driven so it syncs with paint.
- Do **not** ease the chevron. It tracks scroll 1:1 — easing creates a lag that feels wrong for a depth gauge. Any smoothing belongs in the scroll listener, not in the chevron transform.

### Reference implementation

v5: `components/hud/HUDFrame.tsx` renders the scale indicator at lines ~161. The scroll progress is computed in the parent (`components/hud/NavigationCockpitV2/index.tsx`) and threaded through as a prop.

## 4. Omission rules on web

The web row of the format adaptation matrix has several `—` cells. Each has a rule:

- **No pagination.** Infinite scroll has no natural page index; the scroll chevron is the position indicator.
- **No client logo slot.** Thoughtform.co is our own marketing site; the slot is only for decks presented to clients.
- **No chapter label in the HUD.** The navbar carries section nav on desktop web; a chapter label would duplicate it. On mobile, the section indicator replaces the navbar entirely (see `mobile-format-patterns.md`).
- **No title-system heading icon on web pages.** The crosshair+diagonal chapter geometry is for title/chapter _slides_. Web sections use the HUD shell + section markers, not a chapter page.

If you find yourself wanting to add one of these back, check the matrix and the rationale in `format-adaptation-matrix.md` §3 — there is usually a better Thoughtform-native alternative.

## 5. Brandmark placement — bottom-left only (LOW freedom)

The Thoughtform brandmark lives **only in the bottom-left corner** on web surfaces. It is an always-on anchor per the cross-format rule.

### Position

- `bottom: var(--hud-pad-bottom); left: var(--hud-pad-left);`
- Same safe-area handling as the rails.
- Z-order: above content, below focus overlays.

### Sizing

- 40px reference; clamps on responsive with a minimum of 24px on micro viewports.
- Either the brandmark (gateway + compass icon) or the wordmark lockup can render — pick per visual balance, but whichever you pick stays consistent across breakpoints.

### No logo in the navbar

The navbar holds section nav links only. Adding a logo to the navbar creates two brandmark touchpoints on the page and diffuses the always-on anchor. One logo, bottom-left, always.

### In-content wordmarks are content, not shell

Hero sections and editorial-style section breaks can render large wordmarks or brandmarks as **content** — that's separate from the shell rule. Content wordmarks can be huge, animated, and are subject to section-level design. The bottom-left anchor is small, static, and always-on. They coexist; they are not the same element.

## 6. Responsive breakpoint table

| Viewport                | Padding                  | Rail width | Corner size | Tick labels | Coord readout | Instruction band   | Corner brackets |
| ----------------------- | ------------------------ | ---------- | ----------- | ----------- | ------------- | ------------------ | --------------- |
| **>1100px (desktop)**   | `clamp(32px, 4vw, 64px)` | 60px       | 40px        | visible     | optional      | visible            | 2px stroke      |
| **900–1100px (tablet)** | `clamp(32px, 4vw, 64px)` | 60px       | 40px        | hidden      | hidden        | visible            | 2px stroke      |
| **≤768px (mobile)**     | 8px                      | 32px       | 20px        | hidden      | hidden        | visible (centered) | 1.5px stroke    |
| **≤480px (micro)**      | 6px                      | 28px       | 18px        | hidden      | hidden        | visible or hidden  | may hide        |

Values are the v5 canonical. Adapt tokens if your product needs different breakpoints, but keep the stepping pattern (padding shrinks, rails narrow, labels hide, brackets reduce).

The **21-pos tick variant applies at every breakpoint**. Tick label visibility, width, and corner bracket stroke scale — the tick count does not.

## 7. Section markers (right rail)

Web shells have per-section indicators on the right rail: numbered dots (01, 02, 03…) that track scroll position across named sections. Active section = gold; past sections = dimmed dawn; future sections = hairline only.

This is a **web-specific primitive** (and app-shell). It does not appear on slides, proposals, or static artifacts.

- Dots align to the right rail's tick grid.
- Labels are mono 9–10px; hide below 768px, keep dots only.
- Active-state dot uses the gold token (`var(--gold)`); others use `var(--dawn-30)`.
- Dot geometry follows the shape law — diamond, not circle.

## 8. HUD coord readout (optional, desktop only)

A monospace telemetry string (e.g. `δ 0.34  θ 48°  ρ 0.12  ζ SCROLL`) can sit in the bottom chrome band on desktop web. It gives an instrument-grade texture without carrying real information — it is mood, not data.

- **Desktop only.** Hide at ≤900px.
- Colour `var(--dawn-30)`, mono 9–10px.
- Content: short glyphs followed by values. Values can be derived from scroll, section, or particle state. Deterministic is better than random; tie them to actual state where possible.
- **Never use as real UI.** If you need a real position readout, use the section indicator, not this.

## 9. Instruction text band

A short instruction line anchored somewhere in the bottom chrome band. On v5: `"Scroll to descend…"`.

- Web-only primitive. Slides use pagination and chapter labels; they don't need an instruction.
- Short. Under 40 characters.
- Mono, uppercase or small caps, `var(--dawn-50)` or `var(--dawn-30)`.
- Fades or hides once the user has scrolled (instructional, not permanent).
- On mobile, centre-align below the navbar area.

## 10. Focus overlay system (ADR-006 reference)

For any modal, detail view, or focus overlay on web, use the Thoughtform focus-overlay pattern (required CSS vars, `assetFocusIn` / `modalFocusIn` animations, dashed border frame, size variants, specific box-shadow stack).

**Do not invent your own modal style.** The full spec lives in `sentinel/decisions/006-focus-overlay-system.md` in the v5 repo — it carries the required tokens (`--focus-overlay-bg`, `--focus-overlay-blur`, `--focus-overlay-border`, `--focus-backdrop-bg`), animations, and three size variants (small 400×300, medium 600×400, large 900×700).

If you are building web outside v5 and ADR-006 is not available, port its contract rather than designing a new overlay system.

## 11. Delegation to `/frontend-design`

Everything above covers the **shell** — the HUD chrome, its anchors, its tokens, its rules. For decisions **inside the shell**, load `/frontend-design`:

- Component structure (card shapes, button states, input patterns).
- Responsive behavior of content grids and component stacks below the shell level.
- Touch targets (44×44px minimum) and pointer-state design.
- Component-level accessibility (focus indicators, ARIA, keyboard nav).
- Performance patterns (image formats, lazy loading, hydration).

The handoff is clean: `thoughtform-design` says "rails here, brandmark bottom-left, 21-pos depth gauge, scroll chevron driven by scrollProgress." `/frontend-design` says "the hero card uses a 1px dawn-08 border, hover state on 150ms with `cubic-bezier(0.16, 1, 0.3, 1)`, and stacks below 768px."

When the two skills conflict: brand rules win. Shape law, colour tiers, type stack, HUD presence, and always-on anchors are not negotiable. `/frontend-design` component choices must conform.

## 12. Quick-start checklist for a new web surface

1. Read `format-adaptation-matrix.md` § web row.
2. Apply the base shell: two rails (60px desktop), 21-pos depth-gauge ticks, scroll chevron on left rail, brandmark bottom-left.
3. Add the navbar (section links only — no logo).
4. Add the instruction band and optional coord readout in the bottom chrome.
5. Add section markers on the right rail, tied to your page sections.
6. Set responsive breakpoints per the table in §6.
7. Load `/frontend-design` for the content components inside the shell.
8. For modals/overlays, use ADR-006 (or port the contract).
