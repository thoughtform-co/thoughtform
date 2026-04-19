# Thoughtform Motion System

Easing, durations, and choreography. Motion is mechanical, instant, and tactical — no spring physics or bounce.

---

## Principles

- **Mechanical:** State changes feel like instrument feedback, not organic motion.
- **Instant:** User expects immediate response. Micro-interactions are short.
- **Tactical:** Motion supports wayfinding and feedback, not decoration.
- **No spring or bounce:** Avoid `cubic-bezier` springs and overshoot. No playful elasticity.

---

## Duration

| Token           | Value | Usage                                       |
| --------------- | ----- | ------------------------------------------- |
| duration-fast   | 80ms  | Hover, focus, toggle                        |
| duration-normal | 120ms | Panel open/close, tab switch                |
| duration-slow   | 150ms | Max for UI state changes (modals, overlays) |

**Rule:** Never exceed 150ms for UI state changes (hover, focus, open/close). Longer durations only for ambient or background animation (e.g. particles), and still restrained.

---

## Easing

| Token    | Value                           | Usage                                                      |
| -------- | ------------------------------- | ---------------------------------------------------------- |
| ease-out | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for UI transitions                                 |
| ease-in  | `cubic-bezier(0.5, 0, 0.75, 0)` | Rare; only when element is leaving and speed-up is desired |

**Rule:** Prefer ease-out for micro-interactions. Do not use ease-in-out for standard hover/focus — it softens the tactical feel.

---

## Properties to Animate

- **Preferred:** `color`, `border-color`, `background`, `background-color`, `opacity`.
- **Allowed:** `transform` for chevron rotation, icon flip, or slide (translate) when opening panels. Keep transforms simple (rotate, translateX/Y).
- **Avoid:** `transform: scale()` for UI feedback (use opacity or border/color change). No `filter` animation unless brand-approved (e.g. subtle blur on overlay).

---

## Choreography

- **Hover:** 80–120ms, ease-out. Change border/background/color only.
- **Focus:** Immediate or 80ms ring appearance. Visible focus ring (gold or dawn), 2px, offset.
- **Tab / nav switch:** 120ms content crossfade or instant swap. No sliding carousel unless required.
- **Modal / overlay:** 120–150ms opacity + optional slight translate (e.g. 4px). No scale.
- **Chevron / caret:** 80–120ms rotate 90deg, ease-out.

---

## CSS Variables (Suggested)

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 0.08s;
--duration-normal: 0.12s;
--duration-slow: 0.15s;
```

Use with `transition`:

```css
transition:
  color var(--duration-fast) var(--ease-out),
  border-color var(--duration-fast) var(--ease-out);
```

---

## What Never Appears

- Spring curves (e.g. overshoot)
- Bounce or elastic easing
- UI state transitions longer than 150ms
- `setInterval` for animation (use `requestAnimationFrame` if scripting motion)
