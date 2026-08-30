# Web HUD Adaptation (Scroll-Driven Surfaces)

Companion to `cross-format-shell.md` (which covers fixed canvases). This document
covers the fluid, scroll-driven variant of the Thoughtform HUD as implemented on
Thoughtform.co's v7 landing page.

> ⚠ **Overlaps `web-format-patterns.md`, and the split is deliberate.** Both
> files describe the web surface and both mention the 21-position depth gauge
> and the bottom-left brandmark. **`web-format-patterns.md` OWNS those two** —
> it carries the canonical tick values, the labels and the sizing rules, and is
> the file to read (and to edit) for either. This file owns what that one does
> not: the fluid token stack, the breakpoint ladder, the asymmetric chrome, the
> brandmark handoff choreography, the connector compositing rule and the CTA
> funnel. Where the two ever disagree on the gauge or the mark, that file wins.

**Freedom tier: MEDIUM.** Token formulas and breakpoint thresholds are LOW (exact);
compositing patterns and choreography timing are MEDIUM (adapt per page).

**Live CSS source of truth:** `components/landing/v7/landing.css` in the
`01_thoughtform` repo. When values in this doc and the CSS differ, the CSS wins.

---

## 1. Fluid token stack (LOW freedom)

The scroll-driven shell replaces the fixed `shortEdge * 0.05` margin with fluid
`clamp()` tokens that adapt to the viewport continuously:

```css
--hud-margin: clamp(16px, min(2.8125vw, 5vmin), 54px);
--hud-rail-width: clamp(48px, 4.27vw, 82px);
--hud-corner-zone: clamp(28px, 4.17vmin, 45px);
--hud-rail-top: clamp(32px, min(2.604vw, 4.63vmin), 50px);
--hud-rail-bottom: clamp(32px, min(2.604vw, 4.63vmin), 50px);
--hud-rail-guide-inset: clamp(5px, 0.47vw, 9px);
```

### Derived: content inset

The primary layout token for clearing the fixed HUD chrome:

```css
--hud-content-inset: calc(var(--hud-margin) + var(--hud-rail-width) + clamp(24px, 3vw, 56px));
```

All content containers (`.stations`, `.station:not(.hero)`, `.foot`,
`.celestial-connector`) use `--hud-content-inset` for horizontal padding so
body copy, cards, and connector SVGs align with the rail inner edge.

At the <=960px breakpoint (rails hidden), `--hud-content-inset` is overridden
to `clamp(24px, 6vw, 40px)` so the layout degrades gracefully.

---

## 2. Breakpoint ladder (MEDIUM freedom)

| Breakpoint   | What changes                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **>1100px**  | Full HUD: rails with labels, 21-pos depth gauge ticks, 3 corners, brandmark, hamburger nav                                  |
| **<=1100px** | Rail tick labels hidden (`.hud__rail__label { display: none }`); rails and geometry remain                                  |
| **<=960px**  | Rails hidden; brandmark hidden; `--hud-content-inset` overridden; content padding fixed at 32px; nav station numbers hidden |
| **<=700px**  | Celestial connector mobile overrides (`--connector-track-width: 100%`; padding shrinks to 16px)                             |
| **<=640px**  | Title type scale reduction (hero/section headings); hero layout reflows to centered/stacked                                 |

---

## 3. Asymmetric chrome (LOW freedom)

The scroll-driven HUD does NOT use four symmetric corners. The composition is:

| Position         | Element                                     | Notes                                                                                             |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Top-left**     | L-bracket corner (`.hud__corner--tl`)       | Standard `--dawn-30` border                                                                       |
| **Bottom-left**  | L-bracket corner (`.hud__corner--bl`)       | Retires via `.hud--brandmark-active` when the brandmark docks (border transitions to transparent) |
| **Bottom-right** | L-bracket corner (`.hud__corner--br`)       | Standard                                                                                          |
| **Top-right**    | Hamburger nav + section links (`.hud__nav`) | NOT a corner bracket — this is the navigation entry point                                         |

The **top-right chapter zone** and **bottom-right pagination zone** from the
deck shell (see `hud-frame-implementation.md` §14) are omitted on scroll
surfaces. Their information is conveyed by URL and active-section indicators.

---

## 4. Tick variant: 21-position depth gauge (LOW freedom)

Scroll surfaces use a **21-position depth gauge** (20 intervals) instead of
the deck's 13-position bearing grid. The depth gauge maps scroll progress to
a vertical scale with major ticks at every 5th position and numeric labels
(0, 2, 5, 7, 10) at those majors. A gold diamond (`.hud__depth`) scrubs along
the left rail guide line in sync with scroll position.

---

## 5. Brandmark handoff choreography (MEDIUM freedom)

The Thoughtform sigil (`.sigil__mark`) animates into the HUD brandmark anchor
(`#hudBrandmark`) via a scroll-scrubbed GSAP timeline tied to `#continuum`:

| Phase                 | Progress                    | What happens                                                                            |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| **Entrance**          | `#definition` top 85% → 35% | Sigil orbits, halo, mark, caption, tri-columns fade/scale in                            |
| **Handoff start**     | `#continuum` top 80%        | Travel clone created; rect-based interpolation begins                                   |
| **Corner retirement** | p >= 0.82                   | `.hud--brandmark-active` toggles on `.hud`; BL corner borders transition to transparent |
| **Dock**              | p >= 0.995                  | `#hudBrandmark` gets `.is-visible`; travel clone hides                                  |
| **Reverse**           | `onLeaveBack`               | Full reset: travel clone hidden, sigil restored, corner borders restored                |

**Reduced motion:** sigil elements snap visible; brandmark gets `.is-visible`
and `.hud--brandmark-active` immediately. No scroll animation.

**Implementation:** `components/landing/v7/hooks/useSigilChoreography.ts`.

---

## 6. Celestial connector compositing (MEDIUM freedom)

Celestial connectors are full-bleed transit diagrams between content sections.
They reuse the HUD bracket/label grammar but live in the document flow.

### Layout pattern

```css
.celestial-connector {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  background: var(--void); /* opaque shield — see compositing rule */
  padding: clamp(12px, 1.5vw, 20px) var(--hud-content-inset);
}
```

### Compositing rule (LOW freedom)

Connectors MUST have `background: var(--void)` and `opacity: 1` on the wrapper.
The page stacks a `position: fixed` gateway glow (z:0), a `position: sticky`
hero video (z:1), and opaque shield sections (z:2) inside `.stations` (z:10).
A transparent connector would bleed the gateway gold gradient and the hero
video through.

### Track width

SVG line art and labels use a scoped track width instead of stretching to 100vw:

```css
--connector-track-width: min(100%, clamp(560px, 68vw, 960px));
```

Labels and mini-bracket corners position themselves relative to the track center
via `calc(50% - (var(--connector-track-width) / 2) + offset)`.

At <=700px, `--connector-track-width` resets to `100%` and labels use fixed
pixel offsets.

---

## 7. CTA funnel pattern (MEDIUM freedom)

The practice CTA below the Keynotes/Workshops/Strategy cards uses a frameless
variant (`.practice-cta--funnel`) that strips the inherited terminal border and
all four corner brackets:

```css
.practice-cta--funnel {
  border: none;
  overflow: visible;
}
.practice-cta--funnel::before,
.practice-cta--funnel::after,
.practice-cta--funnel > .br,
.practice-cta--funnel > .bl {
  display: none;
}
```

SVG funnel lines originate from the three card center-x positions (at 1/6,
1/2, 5/6 of the viewBox width) and converge to a single gold dot at the
center bottom. The SVG uses `preserveAspectRatio="none"` and is absolutely
positioned to extend upward into the gap between the card grid and the CTA copy.

At <=960px, the funnel SVG is hidden (the card grid collapses to a single column
and the visual funnel metaphor no longer reads).

---

## Relationship to other references

| Reference                     | Covers                                                                       | Coexists with this doc                                                 |
| ----------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `cross-format-shell.md`       | Fixed-canvas scaling (`shortEdge * 0.05`, `min(w,h)/1080`, 13-pos tick grid) | Yes — decks and slides use that doc; scroll surfaces use this one      |
| `hud-frame-implementation.md` | Canonical 1920x1080 anatomy + §14 website mode                               | Yes — §14 is the design rationale; this doc is the implementation spec |
| `products/thoughtform-co.md`  | Repo-specific file paths and conventions                                     | Yes — points here for the responsive HUD spec                          |
