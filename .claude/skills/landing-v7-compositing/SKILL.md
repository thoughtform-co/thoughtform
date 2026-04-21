---
name: landing-v7-compositing
description: Compositing and stacking rules for the v7 landing page (`components/landing/v7/**`). Prevents regressions where full-bleed sections or connectors accidentally reveal the fixed `.gateway` gold radial gradient or the sticky `.hero` video through a transparent or fading background. Activates on any edit to `components/landing/v7/`, `landing.css`, connectors, stations, reveal animations (`data-m`), `background: transparent`, `opacity:` keyframes, `z-index`, `position: sticky`, `position: fixed`, or scroll transitions on the landing page.
---

# Landing v7 — Compositing & Stacking Rules

The v7 landing page is a **layered composite**, not a flat document. Several elements are `position: fixed` or `position: sticky` and paint continuously behind the scrolling content. Any new element added to the scroll flow must explicitly opt in to being an **opaque shield** or an **intentional see-through**. The default visual language is opaque void — the atmospheric tint behind it is structural, not decorative surface.

Two production bugs have shipped from violating this; both are cited below. This skill exists to make sure the next one doesn't.

---

## The paint stack (read this first)

From bottom to top, in paint order, what is drawn on a user's screen when they look at the v7 landing page:

```
html
└── body                                  background: rgb(10, 9, 8)   /* --void */
    └── div.theme-instrument
        ├── div.gateway                   position: fixed; inset: 0; z-index: 0
        │                                 background: warm gold radial + green radial + --void
        │   ├── div.gateway__stage        transform/opacity driven by --depth
        │   └── div.gateway__grain        radial dither, mix-blend-mode: overlay
        └── main.stations                 position: relative; z-index: 10  (stacking context)
            ├── section.hero              position: sticky; top: 0; z-index: 1
            │   └── div.hero__video       absolute; inset: 0; holds the video element
            ├── section.station           position: relative; z-index: 2; background: var(--void)
            ├── div.celestial-connector   position: relative; z-index: 2; background: var(--void)
            ├── section.station           …
            └── …
```

Two layers paint **continuously** behind the scrolling flow:

1. **`.gateway`** (`position: fixed; z-index: 0`) paints a warm gold + green radial glow on top of void across the entire viewport at all times. It is the ambient "atmosphere" behind the site.
2. **`.hero`** (`position: sticky; top: 0; z-index: 1`) stays pinned to the viewport until `useLandingScroll` sets `visibility: hidden` at `heroCover >= 1` (`components/landing/v7/hooks/useLandingScroll.ts:66`). While pinned, its video keeps painting.

Every section/divider/connector that sits inside `.stations` and is intended to read as dark void **must** paint an opaque `var(--void)` fill on top of those two layers. That is the only thing making the rest of the page look like a solid dark page.

---

## Rule 1 — Full-bleed elements at `z-index ≥ 2` must have an opaque background

If you add a `<section>`, connector, divider, rail, or any block that sits inside `.stations` and spans the viewport width (`width: 100vw` with the `margin-left: calc(50% - 50vw)` bleed trick), it **must** declare an opaque background:

```css
.my-new-divider {
  position: relative;
  z-index: 2;
  background: var(--void); /* opaque shield — required */
  width: 100vw;
  margin-left: calc(50% - 50vw);
}
```

Never set `background: transparent` on such an element unless you have explicitly decided you want the gold gateway glow AND/OR the hero video to show through at that scroll position. If you do want that, say so in a CSS comment right above the declaration, because otherwise the next reader will assume it's a mistake and "fix" it back to opaque.

**Regression history — do not repeat:**

- Commit `c9c745b` set `.celestial-connector { background: transparent; z-index: 2; }`. Stations kept `var(--void)`; connectors did not. Result: the warm `.gateway` radial showed as "dark yellow" through every connector band, and the sticky hero video showed through connectors visible before `heroCover >= 1`. Reverted: connectors restored to `background: var(--void)` — see `landing.css` under the `v17 — CELESTIAL CONNECTORS` block.

---

## Rule 2 — Never apply `opacity` reveals to the element that carries the structural background

CSS `opacity` composites the **entire element layer**, including its background. An opaque `var(--void)` fill drawn at `opacity: 0.5` is drawn at half alpha, so the `.gateway` glow behind it is visible at half strength. The user experiences this as a "dark yellow → black" flash as the reveal transitions from `opacity: 0` to `1`.

The v7 reveal system uses `data-m="..."` attributes whose hidden state starts at `opacity: 0` and transitions to `1` on `.is-in` (set by the IntersectionObserver in `useRevealMotion`). See `landing.css` around `[data-m]` and `[data-m="instrument"]`.

**Do not put `data-m` on a wrapper whose background is shielding the gateway or hero.** Put it on the inner content instead (the diagram, the title, the text column). If you cannot change the markup (e.g. the attribute is already in a prototype HTML template), neutralize the wrapper's reveal and re-target the motion to a child:

```css
/* Wrapper stays fully painted so its --void background never lets the
   fixed .gateway gradient bleed through during the 880ms reveal. */
.my-connector[data-m="instrument"],
.my-connector[data-m="instrument"].is-in {
  opacity: 1;
  transform: none;
  filter: none;
  clip-path: none;
}

/* Move the reveal motion to the inner visual, which has no structural
   background of its own. */
.my-connector .my-connector__diagram {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
  filter: blur(2px);
  transition-property: opacity, transform, filter;
  transition-duration: var(--m-dur-slow);
  transition-timing-function: var(--m-ease-long);
}
.my-connector.is-in .my-connector__diagram {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: none;
}
```

**Regression history — do not repeat:**

- After Rule 1 was restored, connectors still flashed gold → black for ~880ms because `data-m="instrument"` on the wrapper transitioned its opacity from `0` to `1`. Fix: decoupled the reveal from the wrapper and re-targeted it to `.celestial-connector__diagram`. See the `Reveal decoupling` comment block in `landing.css`.

---

## Rule 3 — Transform and scale reveals also expose lateral gold strips on full-bleed wrappers

`transform: scale(0.97)` applied to a 100vw element makes it ~97% wide for the duration of the transition, exposing ~1.5% gold strips on each side. `transform: translateX(...)` on a full-bleed block will expose one vertical gold strip. Same for negative margins animated into place.

When you neutralize an opacity reveal on a full-bleed wrapper per Rule 2, **also neutralize `transform`, `filter`, and `clip-path`** on the wrapper. The example in Rule 2 already does this — use it as a template.

---

## Rule 4 — Sticky / fixed additions must be declared on the paint-stack diagram

If you introduce a new `position: fixed` or `position: sticky` layer on the landing page (e.g. a new atmospheric overlay, a floating HUD rail, a new background canvas), update the paint-stack diagram at the top of this skill in the same PR. Future authors need to see it there to reason about shielding correctly.

---

## Pre-merge checklist for any `components/landing/v7/**` or `landing.css` change

Run through every item before opening the PR:

- [ ] Did I add or modify any element that sits inside `.stations` and spans `100vw`?
  - [ ] If yes, does it declare `background: var(--void)` (or another opaque fill)?
  - [ ] If it is intentionally transparent, did I add a CSS comment explaining why?
- [ ] Did I add, change, or touch any `data-m="..."` attribute, or any reveal transition involving `opacity`, `transform: scale`, `transform: translateX`, or `clip-path`?
  - [ ] Is the reveal applied to **inner content**, not to a wrapper carrying a structural `var(--void)` background?
  - [ ] If the reveal must stay on a shielding wrapper (e.g. legacy markup), did I add the Rule 2 neutralization override on the wrapper and re-target the motion to a child?
- [ ] Did I add a `position: fixed` or `position: sticky` layer?
  - [ ] Did I update the paint-stack diagram in this skill?
  - [ ] Did I confirm its z-index relative to `.hero` (z:1), `.station:not(.hero)` / `.celestial-connector` (z:2), and `.stations` (z:10)?
- [ ] Manual scroll test from hero through every section and connector, at `prefers-reduced-motion: no-preference`:
  - [ ] No warm tint appears in any section during or after scroll.
  - [ ] No hero video silhouette appears through any later section.
  - [ ] Reveals feel smooth with no color flicker at the section's edges or sides.

---

## Debugging recipe (when something looks wrong at runtime)

Paste this into a temporary `useEffect` in `components/landing/v7/LandingPage.tsx` to capture computed styles as elements scroll in. It answers "what is actually painting at this pixel?" instead of guessing from CSS source.

```tsx
useEffect(() => {
  const root = rootRef.current;
  if (!root) return;
  const els = Array.from(root.querySelectorAll<HTMLElement>(".celestial-connector, .station"));
  const snap = (label: string, el: HTMLElement) => {
    const cs = getComputedStyle(el);
    // eslint-disable-next-line no-console
    console.log(label, {
      cls: el.className,
      opacity: cs.opacity,
      bg: cs.backgroundColor,
      z: cs.zIndex,
      pos: cs.position,
      rectTop: Math.round(el.getBoundingClientRect().top),
    });
    const r = el.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2);
    const cy = Math.round(r.top + r.height / 2);
    // eslint-disable-next-line no-console
    console.log(
      "  stack@center",
      document
        .elementsFromPoint(cx, cy)
        .slice(0, 6)
        .map((e) => ({
          tag: e.tagName,
          cls: (e as HTMLElement).className?.toString?.().slice(0, 60) ?? "",
          z: getComputedStyle(e).zIndex,
          bg: getComputedStyle(e).backgroundColor,
        }))
    );
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) snap("in", entry.target as HTMLElement);
    },
    { threshold: 0.01 }
  );
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}, []);
```

What to look for:

- `backgroundColor` reads `rgba(0, 0, 0, 0)` on a full-bleed section → it's missing Rule 1.
- `opacity` tweens from `0` to `1` on a section whose `backgroundColor` is opaque → it's violating Rule 2.
- `elementsFromPoint` at the section's center shows `gateway` or `gateway__grain` as a near-top hit → the section above them isn't shielding; fix Rule 1.

Remove the `useEffect` before committing.

---

## Related ADRs and references

- `sentinel/decisions/008-landing-v7-background-layers.md` — architectural record of the paint stack and the two fixes that landed from this rule set.
- `components/landing/v7/hooks/useLandingScroll.ts` — owns the sticky-hero visibility transition (`heroCover >= 1 → visibility: hidden`).
- `components/landing/v7/hooks/useRevealMotion.ts` — IntersectionObserver that adds `.is-in` to `[data-m]` elements.
- `components/landing/v7/landing.css` — the `v17 — CELESTIAL CONNECTORS` block and the `Reveal decoupling` override are the canonical examples of applying these rules.
