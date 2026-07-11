# ADR-008: Landing v7 Background Layers & Reveal Decoupling

**Date:** 2026-04  
**Status:** Accepted

---

## Context

The v7 landing page (`components/landing/v7/`) is a layered composite, not a flat document. Two elements paint continuously behind the scrolling flow and are invisible to a reader of the CSS source who isn't looking for them:

1. **`.gateway`** — `position: fixed; inset: 0; z-index: 0`, with `body.theme-instrument .gateway` layering a warm gold radial (`rgba(202, 165, 84, 0.08)`), a green radial (`rgba(91, 122, 78, 0.04)`), and `var(--void)` as its background. Paints on every pixel of the viewport at all times.
2. **`.hero`** — `position: sticky; top: 0; z-index: 1`, containing a video that keeps painting until `useLandingScroll` sets `visibility: hidden` at `heroCover >= 1` (`useLandingScroll.ts:66`).

Every section, divider, and connector that sits inside `.stations` and is intended to read as plain dark void is actually an **opaque shield** over those two layers. Stations correctly declare `background: var(--void); z-index: 2;` at `landing.css:713`. Connectors originally did the same.

Two regressions have shipped by treating this compositing as accidental rather than structural:

### Regression 1 — transparent connectors (`c9c745b`)

The commit set `.celestial-connector { background: transparent; z-index: 2; }`, with the rationale that the `useLayoutEffect` in `useLandingScroll` already prevents the first-paint hero flash that the opaque background was originally added for. That reasoning missed the two always-painting background layers above. Result: the gateway's warm radial showed as "dark yellow" through every connector band, and the pinned hero video showed through connectors visible before `heroCover >= 1`.

### Regression 2 — opacity-fade reveal on the shielding wrapper

After Regression 1 was reverted, connectors still flashed gold → black for ~880ms as they entered the viewport. `.celestial-connector` carries `data-m="instrument"` in the prototype HTML. `[data-m]` declares `opacity: 0` as the hidden state and transitions to `1` over `var(--m-dur-slow) = 880ms` when `.is-in` is applied by `useRevealMotion`'s IntersectionObserver. CSS `opacity` composites the entire element layer, so an opaque `var(--void)` wrapper drawn at `opacity: 0.6` draws the void at 60% alpha and lets the gateway gold show through at 40%. Runtime evidence captured opacity sampling at `{0, 50, 300, 600, 1000} ms` after `.is-in`: `0, 0, ~0.85, ~0.98, 1` — the visible fade matched the warm-to-dark transition users reported exactly.

---

## Decision

### 1. The paint stack is canonical structure

The following ordering is load-bearing and must not be changed without an ADR update:

| Layer | Element                                                 | Position | z-index                | Paints                                                                                                      |
| ----- | ------------------------------------------------------- | -------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| 0     | `body`                                                  | static   | —                      | `rgb(10, 9, 8)` (`--void`)                                                                                  |
| 1     | `.gateway`                                              | fixed    | 0                      | gold + green radials + `--void`                                                                             |
| 1a    | `.gateway__grain`                                       | absolute | auto                   | radial dither, `mix-blend-mode: overlay`                                                                    |
| 2     | `.stations`                                             | relative | 10                     | (transparent; creates stacking context)                                                                     |
| 3     | `.hero`                                                 | sticky   | 1                      | video + overlay; goes `visibility: hidden` at `heroCover ≥ 1`                                               |
| 4     | `.station:not(.hero)`                                   | relative | 2                      | `var(--void)` — opaque shield                                                                               |
| 4     | `.celestial-connector`                                  | relative | 2                      | `var(--void)` — opaque shield                                                                               |
| 4a    | `.home-v2-stage__canvas` during `data-corridor-docked`  | fixed    | 2 inside corridor host | live R3F sphere/ambient backdrop; its painters retire on their own opacity channels                         |
| 4b    | `#tools` during `data-corridor-exit` + `#tools::before` | relative | 6; internal 0          | intentional transparent lead-in; the pseudo shield reaches opaque before the ambient canvas retires         |
| 5     | `#tools .tools__head` on the enhanced capability        | fixed    | 12 inside `.stations`  | rail-to-rail text/datum only; no structural background, so its opacity/clip reveal cannot unshield the page |
| 6     | `.hud` including `[data-tools-rail-root]`               | fixed    | 50                     | persistent rails/nav; right-rail register paints inside this existing HUD stacking context                  |

Any new `position: fixed` or `position: sticky` layer on the landing page must be added to this table in the same PR.

`#tools` is the explicit intentional-see-through exception. During the
Services handover its station background is transparent while its absolute
`::before` shield fades from transparent to opaque via `--tools-bg-in`. The
fixed `.tools__head` carries no fill and may reveal with opacity/clip safely;
never move that reveal to `#tools` itself or fade the pseudo shield. The
right-rail register is not a new page overlay: it is nested inside the
existing fixed `.hud` at z50.

### 2. Rule: full-bleed elements inside `.stations` at `z ≥ 2` must be opaque

`background: var(--void)` (or another opaque fill) is the default. Transparent is allowed only with an inline CSS comment explaining why the author intentionally wants the gateway glow and/or hero video to show through at that scroll position.

### 3. Rule: reveals must not fade the wrapper that carries the structural background

`opacity` transitions on a shielding wrapper fade the wrapper's background too, which briefly un-shields the gateway and hero. The reveal motion goes on the **inner content** of the wrapper (the diagram, the text column, the title). If the `data-m` attribute cannot be moved off the wrapper, neutralize the wrapper's reveal state and re-target the motion to a child element:

```css
.celestial-connector[data-m="instrument"],
.celestial-connector[data-m="instrument"].is-in {
  opacity: 1;
  transform: none;
  filter: none;
  clip-path: none;
}
.celestial-connector .celestial-connector__diagram {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
  filter: blur(2px);
  transition-property: opacity, transform, filter;
  transition-duration: var(--m-dur-slow);
  transition-timing-function: var(--m-ease-long);
}
.celestial-connector.is-in .celestial-connector__diagram {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: none;
}
```

### 4. Rule: `transform: scale()` and lateral `translate` on full-bleed wrappers expose lateral gold strips

A 100vw wrapper drawn at `scale(0.97)` is ~1.5% short on each side — the gateway radial paints that strip. When neutralizing a reveal per Rule 3, also neutralize `transform`, `filter`, and `clip-path` on the wrapper, not just `opacity`.

### 5. Agent skill

The rule set and pre-merge checklist is encoded in `.claude/skills/landing-v7-compositing/SKILL.md` so an agent editing anything in `components/landing/v7/**` is prompted with the compositing rules before making the change.

---

## Consequences

- Adding a new full-bleed connector or section is slightly more verbose: `background: var(--void)` must be declared explicitly and reveals must be decoupled when the wrapper shields the atmosphere.
- The landing page can confidently introduce new `position: fixed` atmospheric layers (e.g. a future particle field, a theme overlay) without silently regressing every existing section — the paint stack table makes new layers visible, and Rule 2 guarantees shielding.
- Authors writing new reveal motions have an explicit pattern for "reveal the content without un-shielding the background" (Rule 3 template above).

---

## References

- Regression 1 commit: `c9c745b` (`fix(landing): make celestial connectors transparent so diagrams float on the shared void canvas`) — reverted by restoring `background: var(--void)` in `landing.css` under the `v17 — CELESTIAL CONNECTORS` block.
- Regression 2 fix: `Reveal decoupling` override added in `landing.css` immediately after the `.station--from-connector` rule.
- Paint-stack layers: `landing.css` — search for `.gateway`, `.hero`, `.station:not(.hero)`, `.celestial-connector`.
- Reveal motion system: `components/landing/v7/hooks/useRevealMotion.ts`, `[data-m]` rules at `landing.css:3128+`.
- Sticky-hero visibility transition: `components/landing/v7/hooks/useLandingScroll.ts:66`.
- Agent skill with pre-merge checklist and runtime debugging recipe: `.claude/skills/landing-v7-compositing/SKILL.md`.
