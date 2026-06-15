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
            ├── section#missing-layer     position: relative; z-index: 2; bg: var(--void); 100svh
            ├── section#intelligence-layer position: relative; z-index: 2; bg: var(--void); 100svh
            ├── section.station           …
            └── …
```

Two layers paint **continuously** behind the scrolling flow:

1. **`.gateway`** (`position: fixed; z-index: 0`) paints a warm gold + green radial glow on top of void across the entire viewport at all times. It is the ambient "atmosphere" behind the site.
2. **`.hero`** (`position: relative; z-index: 4`) is the **departing curtain** — it scrolls straight up and off the first viewport, and `useLandingScroll` sets `visibility: hidden` once it has fully cleared (`heroCover >= 1`). While present its video keeps painting and stays opaque (gateway shield).

### In-band hero seam - ToyFight curtain reveal (ADR-022 v8)

[ADR-022 v8](../../../sentinel/decisions/022-hero-corridor-flip-transition.md) is a **curtain reveal** faithful to [toyfight.co](https://toyfight.co/): the **hero is the moving layer** that scrolls straight up and off the viewport, **uncovering the corridor's parked `ThoughtformCompassGate` frame which is held frozen behind it**. The corridor IS the revealed second section — no proxy, no copy. `.hero__video` stays fully opaque (gateway shield, ADR-008 Rule 3) and scrolls off as one rigid card (no scale, no fade).

This replaces v7 (a held hero with the corridor rising to _cover_ it) — the user's words: "the second section scrolls over the hero section, whereas in the reference we have the hero section scrolling upwards and then revealing the second section." v7 had the wrong layer moving; v8 inverts it. (And it replaces v6's proxy sweep, which painted a duplicate second section that vanished at the boundary.)

```
z:0   .gateway              (fixed gold radial — shielded throughout)
z:4   #hero (relative)      (the departing curtain — scrolls straight up & off)
z:3   .home-corridor-host   (the revealed second section)
        └ .home-v2-stage         (820svh; NEVER transformed → useDepthScroll rect intact)
          └ .home-v2-stage__sticky  (counter-translated during entry → frozen at viewport top)
```

`useLandingScroll` computes `defTop` (the corridor mount's viewport top, = `100vh − scrollY` until the stage reaches the top), writes `--corridor-pin = max(0, defTop)` (px), and sets `html[data-corridor-entry]` while `defTop > 0.5`. `home-v2.css` applies `transform: translateY(calc(var(--corridor-pin) * -1px))` to `.home-v2-stage__sticky` **only** under that flag, cancelling the cell's natural rise so the parked frame sits frozen at viewport top while the hero lifts off it. The sticky cell's children (canvas + copy + brandmark) are positioned by `useWorldDomTracker` in viewport-projected coords relative to that cell, so freezing the cell at viewport `(0,0)` lands them at their correct final positions. At `scrollY >= 100vh` the flag clears, the transform reverts to `none`, and the cell's native sticky pin + the flythrough take over seamlessly.

**Critical invariants for anyone editing this:**

- **The hero moves; the corridor is frozen.** Never make the hero a held/covered backplate with the corridor rising over it (v7), and never paint a proxy/copy of the second section (v6).
- **Only the sticky CELL is transformed — never `.home-v2-stage`.** `useDepthScroll` reads the stage's rect for ALL corridor timing; transforming the stage (or the host, or any wrapper containing it) desyncs `progress` / `paintProgress` / `epilogueProgress` / `dockProgress`. The pin lives on `.home-v2-stage__sticky` (inside the stage), so the stage rect is untouched.
- **The entry transform is gated to `html[data-corridor-entry]`.** It MUST be `none` outside the first-viewport band — especially during the ADR-021 docked exit, where `.home-v2-stage__canvas` becomes `position: fixed`; a transformed ancestor would capture it and bring back the hard horizontal seam line. Verified `canvasPos: fixed` + sticky `transform: none` across the dock window.
- **`--corridor-pin` is RAW px (`max(0, defTop)`), not eased** — it must exactly cancel the cell's linear rise, or the "frozen" frame drifts.
- **Hero video stays opaque, never scaled/faded** (ADR-008 Rule 3, gateway shield). The hero scrolls off as one rigid card; `.hero` is `position: relative; z-index: 4` (above the corridor's z:3 so it paints over the frozen frame until it clears).
- **Superseded artifacts not to reintroduce:** the v7 held-hero `--hero-cover` parallax (`translateY -10vh` + `.hero__content` fade); the v6 cover-plane sweep + gate-matched proxy (`HeroHandoffCover`, `.hero-handoff-*`, `data-hero-handoff`, `--deck-clear`, `<html>` `--hero-cover` mirror); the flip / depth-window / beveled-window stacks (v2-v5); the `.home-corridor-host::before/::after` "edge chrome".

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

## Rule 5 — `position: sticky` can silently fail to engage; do not rely on it without a runtime check

CSS `position: sticky` sometimes never engages even when the parent box looks tall enough. The known case on this landing page is `.approach__phase[data-phase="build"]` inside `.approach__copy` (a flex column whose height is built from intrinsic content + `padding-bottom: 100vh` rather than an explicit `height`). Verified in Chrome by setting `.approach__copy { height: <px> !important }` at runtime — sticky engages immediately. Without that, the build phase scrolls past its `top: clamp(116px, 18vh, 168px)` value with no engagement at all; only the JS pin in `useLandingScroll` keeps it visible.

This means: when a Practice → Quote-style "frozen under-layer + opaque cover" pattern depends on sticky pinning, **do not assume sticky works**. Either:

1. Verify with a Playwright sample at scroll positions where natural sticky should be engaged (`buildPhase.getBoundingClientRect().top` should equal the resolved sticky-`top` for many scroll positions in a row), and
2. Gate any JS pin compensation on `naturalTop < stickyTop && coverProgress < 1` (a self-relative condition that works whether sticky engages or not), instead of gating it on the cover window alone (`quoteTop <= vh * 1.15`). The latter leaves a ~1-viewport gap where the element scrolls offscreen and then teleports back into view as the cover gate flips.
3. Apply the compensation synchronously in the `scroll` event before heavier requestAnimationFrame work. If the pinned writes wait for rAF, the element can spend one paint tick in its natural scrolled position (~one wheel delta behind) and visibly stutter even though static samples taken after rAF look correct.

The current implementation in [`useLandingScroll.ts`](../../../components/landing/v7/hooks/useLandingScroll.ts) follows this pattern for both the build phase and the orbit stage. The orbit stage's sticky does engage naturally inside `.approach__chamber` (a CSS grid), but it can still release a few scroll ticks before the Quote cover is visibly on top, so it uses the same natural-top gate to avoid a visible one-frame slip.

**Regression history — do not repeat:**

- After the Quote cover handoff was rebuilt with hero parity (`c03eab0`), `f1496bd`, `7b49336`), the BUILD title still teleported into view ~1 viewport before the cover started rising, because sticky never engaged on the build phase and the JS pin was gated on `quoteTop <= vh * 1.15`. Fix: changed the build pin gate to `buildNaturalTop < buildStickyTop && practiceCover < 1` so the pin engages exactly where natural sticky would have. See `useLandingScroll.ts` — search for "Build phase compensation".

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
  - [ ] If sticky inside a flex/grid container, did I verify at runtime that it actually engages (Rule 5)? `getBoundingClientRect().top` should equal the resolved sticky-`top` value across a sustained range of scroll positions — not just briefly cross past it.
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

## Section-scoped R3F mounts (intelligence layer, ADR-012 v2)

`#intelligence-layer` mounts a section-scoped R3F canvas via `IntelligenceLayerPortal` into `[data-ilayer-stack-root]`. This is **not** the global `BrandmarkParticleCanvas` (which is `position: fixed; z-index: 23` and lives at the page root); it is a per-section canvas inside `.ilayer__inner`.

Rules that hold for any future section-scoped canvas:

- The mount slot must sit inside the section's opaque `.station` (or equivalent) wrapper, **not** as a full-bleed `position: fixed` overlay.
- The canvas itself is `position: absolute; inset: 0; pointer-events: none` so it never blocks scroll and never carries a structural background.
- Reveal motion stays on the section's inner column (`.ilayer__inner[data-m="instrument"]`); the canvas inherits that fade via DOM ancestry, no `[data-m]` on the canvas slot itself.
- A static SVG fallback in the same grid cell handles `prefers-reduced-motion: reduce`, viewport ≤ 767px, and WebGL-fail. The portal writes `data-ilayer-mode="r3f" | "static"` on the stack wrapper to swap them.
- **ADR-013:** the R3F scene paints rings + sub-orbits + halo dots + flow arcs only. The brandmark cloud itself is painted by the GLOBAL `BrandmarkParticleCanvas` (z:23) throughout the section. The R3F parent group reads `rotationY` and `ringsActive` + `ringProgress` from the journey store; ring/decoration scale uses `splitEmerge` (geometric, never opacity).

## Section-scoped sticky pairs (general guidance)

The v7 page's hero → corridor seam is a **curtain reveal** ([ADR-022 v8](../../../sentinel/decisions/022-hero-corridor-flip-transition.md)): the hero (`.hero`, `position: relative; z-index: 4`) is the MOVING layer — it scrolls straight up and off the first viewport, uncovering the corridor (`.home-corridor-host` at `z:3`, the home-v2 corridor mount inserted by `lib/v7-parse.ts`) which is held FROZEN behind it (`.home-v2-stage__sticky` counter-translated by `--corridor-pin` while `html[data-corridor-entry]` is set). The hero is ABOVE the corridor (z:4 > z:3) so it paints over the frozen frame until it has lifted clear — see "In-band hero seam" above. This inverts the earlier v7 attempt (a held hero with the corridor rising to cover it — the user rejected "the second section scrolls over the hero") and the v6 proxy sweep (a duplicate second section that vanished at the boundary). The corridor's `.home-v2-stage` is never transformed (only the sticky cell inside it), so `useDepthScroll` timing is untouched, and the entry transform is gated so it is `none` during the docked exit. The previous `.brand-handoff-stage` (ADR-012 v5d) that pinned `#missing-layer` + `#intelligence-layer` was retired in v6 — both sections now flow as ordinary stacked stations and the brandmark choreography handles the miss → substrate transit over the natural scroll distance. **Do not reintroduce a sticky-cover wrapper around those two sections** without an ADR; the cover slide reads as parallax / discrete UI gesture rather than as continuous scroll narrative, which fights the editorial intent.

If a future feature genuinely needs another sticky pair inside `.stations`, the rules below still apply (they're the same rules that govern the hero → first-station cover):

- Both members keep their existing `var(--void)` background. The cover slide only reads as a clean swap because both layers are opaque (Rule 1). Never strip the shield from a sticky member to "show" the layer underneath — use crossfade transit on contained content instead.
- The wrapper carries no `[data-m]`, no transform, no opacity transition (Rule 2). It is a layout-only positioning container.
- The cover uses z-order to win the stack: lower member at `z:2`, upper member at `z:3` (or higher). The standard `.station:not(.hero)` rule pins everything else at `z:2`.
- Suppress the inherited `.station { border-bottom: 1px dashed ... }` hairline on the sticky members; while pinned the border would track the viewport edge instead of the natural section break.
- Choreography hooks reading section centres for sticky members must special-case them: use the WRAPPER's `offsetTop + N * vh` boundaries instead of `getBoundingClientRect()` of the sticky element (which moves with scroll). The retired `handleStageHandoff` in `useSigilChoreography.ts` is the historical reference; the `practice.top` special case for the orbit's sticky parent is the live one.

## Related ADRs and references

- `sentinel/decisions/008-landing-v7-background-layers.md` — architectural record of the paint stack and the two fixes that landed from this rule set.
- `sentinel/decisions/012-intelligence-layer-artifact.md` — section structure (partially superseded by ADR-013 for the R3F painter model).
- `sentinel/decisions/013-brandmark-journey-refactor.md` — single continuous transform + one painter model; replaces the multi-painter HARD SWAP fabric. The brandmark CSS gate fabric (~280 LOC of `data-brand-svg-dock` / `data-brand-particle-backdrop` blocks) was retired here; only the SVG-fallback `data-brand-on-*="parked"` rules and a single `[data-brandmark-mode="particle"]` hide gate remain.
- `components/landing/v7/hooks/useLandingScroll.ts` — owns the sticky-hero visibility transition (`heroCover >= 1 → visibility: hidden`).
- `components/landing/v7/hooks/useRevealMotion.ts` — IntersectionObserver that adds `.is-in` to `[data-m]` elements.
- `components/landing/v7/landing.css` — the `v17 — CELESTIAL CONNECTORS` block and the `Reveal decoupling` override are the canonical examples of applying these rules.
