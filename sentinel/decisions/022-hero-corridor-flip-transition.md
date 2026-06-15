# ADR-022: Hero → Corridor Reveal Transition

**Date:** 2026-06-15
**Status:** Active (v8 — ToyFight curtain reveal: hero lifts off a frozen corridor frame)
**Revisions:** v8 (2026-06-15) - **ToyFight curtain reveal**. v7 made the hero a held layer the corridor rose to meet; the user looked at [toyfight.co](https://toyfight.co/) again and clarified the inverse is wanted: the **hero** is the moving layer that scrolls **up and off**, uncovering a second section that sits **frozen** behind it. Browser-traced ToyFight: sections are normal-flow with **descending z-index** (hero `z:4`, intro `z:3`…); the hero scrolls off while section 2's inner wrapper is held dead-still at viewport top. v8 maps that onto our corridor: `.hero` becomes `position: relative; z-index: 4` (the departing curtain), and `useLandingScroll` toggles `html[data-corridor-entry]` over the first viewport so `.home-v2-stage__sticky` becomes a fixed viewport layer (`position: fixed; inset: 0`) while the hero lifts off it. The stage rect (read by `useDepthScroll`) is never transformed, and the fixed hold is gated to the entry band only (so the docked-exit `position: fixed` canvas is never captured). A small capped hero-only inertial transform may be applied for ToyFight-like smoothness; document scroll and corridor channels remain untouched. v1–v7 are preserved below as history.
**Scope:** Production home page (`/`) — the seam between the v7 hero (`section#hero`, the wormhole key-visual `<video>`) and the home-v2 depth corridor's parked Thoughtform start frame (`#home-corridor-mount` → `.home-corridor-host` → `HomeCorridor`). The transition the user experiences as they begin scrolling.
**Related:**
[ADR-008 — Landing v7 background layers](008-landing-v7-background-layers.md),
[ADR-018 — Home V2 Depth Corridor](018-home-v2-depth-corridor.md),
[ADR-021 — Corridor Exit Zoom-Dissipate](021-corridor-exit-zoom-dissipate.md),
[ADR-002 — Scroll Animation Architecture](002-scroll-animation-architecture.md).

---

## v8 (active) — ToyFight curtain reveal (2026-06-15)

### What this is

A faithful [toyfight.co](https://toyfight.co/) **curtain**: the hero is the TOP, MOVING layer and scrolls straight up and off the viewport over the first 100vh, **uncovering the corridor's parked Thoughtform frame which is held frozen behind it**. The corridor IS the revealed second section — there is no proxy and no copy, and the corridor's flythrough / scroll math / billions epilogue are untouched.

### Why v7 was wrong

v7 made the hero a held backplate and let the live corridor rise in normal flow to cover it. The user's reaction: "the second section scrolls over the hero section, whereas in the reference we have the hero section scrolling upwards and then revealing the second section." i.e. v7 had the wrong layer moving. v8 inverts it: the hero moves, the corridor is revealed.

### ToyFight mechanic (browser-traced at 1865×1156)

Sections are normal-flow `<section>`s with **descending z-index** (`HomeHeroSection z:4`, `HomeIntroSection z:3`, …) so earlier sections paint on top. At `scrollY=580`: the hero has `transform:none`, `top:-580` (scrolled straight up off the top); the intro section's inner `HomeIntroPinned` wrapper has `transform: translateY(-576px)` — a scroll-linked counter-translate holding section 2 frozen at viewport top while the hero lifts off it.

### Mechanic (ours)

```
Layer stack:
  z:0  .gateway              fixed gold radial (shielded throughout)
  z:4  #hero (relative)      the departing curtain — scrolls straight up & off
  z:3  .home-corridor-host   the revealed second section
       └ .home-v2-stage          (820svh; NEVER transformed → useDepthScroll intact)
         └ .home-v2-stage__sticky  fixed during entry to freeze at viewport top
```

| Phase  | scrollY | `#hero`                         | `.home-v2-stage__sticky`                                    | `data-corridor-entry` |
| ------ | ------- | ------------------------------- | ----------------------------------------------------------- | --------------------- |
| start  | 0       | rectTop 0 (covers viewport)     | `position:fixed; top:0` (frozen behind hero)                | `1`                   |
| mid    | ~0.5vh  | rectTop −0.5vh (lifting)        | fixed at rectTop 0 (still frozen, uncovered below)          | `1`                   |
| land   | 100vh   | off-screen, `visibility:hidden` | native sticky pins at rectTop 0 (seamless)                  | cleared               |
| beyond | >100vh  | hidden                          | native sticky pin / flythrough / docked exit — NO transform | cleared               |

`useLandingScroll` computes `defTop` = the corridor mount's viewport top (= `100vh − scrollY` until the stage reaches the top) and sets `html[data-corridor-entry]` while `defTop > 0.5`. CSS (`home-v2.css`) makes `.home-v2-stage__sticky` `position: fixed; inset: 0` ONLY under `html[data-corridor-entry="1"]`. Because the sticky cell's children (canvas + copy + brandmark) are positioned by `useWorldDomTracker` in viewport-projected coordinates relative to that cell, freezing the cell at viewport `(0,0)` lands them at their correct final positions — the frame reads "composed on arrival," not rising. The previous `--corridor-pin` counter-transform was retired because sticky + transform fought under real wheel/trackpad scroll and read as a bounce.

### Why it's corridor-safe

- **`useDepthScroll` reads `.home-v2-stage` (the track), which is never transformed** — only the sticky cell inside it is. All corridor timing (`progress` / `paintProgress` / `epilogueProgress` / `dockProgress`) is byte-identical.
- **The fixed hold is gated to the entry band.** Outside `[0, 100vh)` `data-corridor-entry` is absent → native sticky owns the cell. This is essential for the ADR-021 docked exit, where `.home-v2-stage__canvas` becomes `position: fixed`.
- **The hero occupies the same 100vh of flow** whether `sticky` or `relative`, so the corridor stage's document position (and thus its rect) is unchanged.

### Files

- [components/landing/v7/landing.css](../../components/landing/v7/landing.css) — `.hero` is now `position: relative; z-index: 4` (departing curtain); the v7 `--hero-cover` parallax/​fade block is removed (the hero just scrolls); `.hero__video` stays `opacity: 1` (gateway shield).
- [components/landing/v7/hooks/useLandingScroll.ts](../../components/landing/v7/hooks/useLandingScroll.ts) — toggles `html[data-corridor-entry]` over the first-viewport band; clears it on unmount; keeps the hero visibility cleanup and applies only a tiny capped hero-only inertial transform for ToyFight feel.
- [components/landing/home-v2/home-v2.css](../../components/landing/home-v2/home-v2.css) — `html[data-corridor-entry="1"] .home-v2-stage__sticky { position: fixed; inset: 0; }`, documented as gated to the entry band only.

No edits under `components/landing/home-v2/**` scene / store / `useDepthScroll` / `useWorldDomTracker`.

### v8 invariants

- **The hero is the mover; the corridor is frozen.** Never reintroduce a held/​covered hero or a corridor that rises over it (that was v7's mistake). Never paint a proxy/​copy of the second section (v6's mistake).
- **Never transform `.home-v2-stage`.** Transforming the stage shifts the rect `useDepthScroll` reads and desyncs every corridor channel.
- **The entry fixed hold is gated to `data-corridor-entry`.** It MUST be absent during the flythrough and especially the ADR-021 docked exit.
- **Hero video stays opaque, never scaled/faded** (ADR-008 Rule 3, gateway shield). The hero scrolls off as one rigid card.
- **No `--corridor-pin` counter-transform** — it was retired after real-scroll jitter; the fixed hold freezes the frame without a transform loop.

### Verification (Playwright/CDP, 1865×1156)

| scrollY    | `#hero` rectTop / vis | sticky transform / rectTop       | entry | observable                                                            |
| ---------- | --------------------- | -------------------------------- | ----- | --------------------------------------------------------------------- |
| 0          | 0 / visible (z:4)     | `translateY(-1156)` / 0          | 1     | hero full-bleed; frozen corridor behind                               |
| 578        | −578 / visible        | `translateY(-578)` / 0           | 1     | hero lifted halfway; frozen corridor (compass + copy) uncovered below |
| 1180       | −1180 / hidden        | `none` / 0 (native pin)          | —     | corridor owns screen; seamless handoff                                |
| 6500       | hidden                | `none` / 0                       | —     | flythrough unchanged                                                  |
| 9000       | hidden                | `none`                           | —     | billions epilogue unchanged                                           |
| 9800–10600 | hidden                | `none` (canvas `position:fixed`) | —     | docked zoom-dissipate intact                                          |

Reverse scroll to 0 restores the curtain (`entry=1`, sticky `translateY(-1156)`, hero visible). `npm run lint`: 0 errors.

---

## v7 (superseded) — Direct parallax reveal (2026-06-15)

### What this is

The hero → corridor seam is a single-layer reveal: the live `.home-corridor-host` (z:3) rises in normal flow over the sticky `#hero` (z:1) as the user scrolls and lands directly on the live armed parked frame (`ThoughtformCompassGate` painting at `paintProgress = 0`, with the projected brandmark centred). To give the seam a ToyFight-class parallax feel, the held hero drifts up slightly and its content gently fades; the hero video itself stays opaque throughout (ADR-008 Rule 3, gateway shield).

There is **no proxy plane**, **no `<html>` mirror**, **no band gate**, **no `data-hero-handoff` attribute**, **no `--deck-clear` hairline**, **no z-promotion of the hero**. Everything that v6.x called the "cover-plane swipe" is removed.

### Why v6.3 had to go

The user explicitly rejected the v6.3 cover-plane swipe + gate-matched proxy: the proxy painted a **duplicate first-read copy + a fake compass gate** in front of the live one, then `display: none`-d itself at `cover = 1` to expose the real corridor frame underneath. Even with the silhouette matched (concentric axis-aligned squares matching the live `ThoughtformCompassGate`), the user reads it as "a copy of the second section that suddenly disappears, then you see the actual one." That perceived duplication is the v6.x problem. No amount of silhouette tuning solves it — the architecture itself paints two stacked second sections.

The reduced-motion / ≤960px fallback, by contrast, already handled this cleanly: no proxy, no copy, the corridor host rises over the held hero and lands on the live parked frame. v7 promotes that fallback to the single path everyone gets, plus a small parallax garnish for motion-allowed users.

### Mechanic

```
Layer stack (no portalled deck, no z-promotion):

  z:0   .gateway              fixed gold radial (shielded by the hero)
  z:1   #hero (sticky)        held; drifts up slightly + .hero__content fades
  z:3   .home-corridor-host   rises in normal flow; lands on the parked frame
```

Channels:

| Channel        | Writer             | Curve                                        | Visual                                                                                                         |
| -------------- | ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--hero-cover` | `useLandingScroll` | smootherstep of `1 - defTop / vh` on `#hero` | Drives `.hero { translateY }` and `.hero__content { opacity }` via CSS.                                        |
| visibility     | `useLandingScroll` | `heroCover >= 1 ? "hidden" : ""`             | Belt-and-braces cleanup so the held hero never paints under later sections during scroll-back-into-band edges. |

CSS (the only motion the seam owns; gated by `prefers-reduced-motion: no-preference`, NO width gate):

```css
@media (prefers-reduced-motion: no-preference) {
  .hero {
    transform: translate3d(0, calc(var(--hero-cover, 0) * -10vh), 0);
    will-change: transform;
  }
  .hero__content {
    opacity: calc(1 - var(--hero-cover, 0) * 1.6);
    will-change: opacity;
  }
}
```

`.hero__video { opacity: 1 }` (no scale). The `[data-parallax]` rule still gives the inner video a tiny `translate` micro-drift; that composes with the outer `.hero` `transform` because they are independent CSS properties.

Reduced-motion users get nothing inside the media block — the hero stays static and the corridor host simply rises over it. Mobile/narrow viewports get the same parallax as desktop (no width gate; `-10vh` is safe everywhere because the corridor host always covers the hero from below).

### Files

- [components/landing/v7/HeroHandoffCover.tsx](../../components/landing/v7/HeroHandoffCover.tsx) — **DELETED**.
- [components/landing/v7/LandingPage.tsx](../../components/landing/v7/LandingPage.tsx) — `HeroHandoffCover` import + JSX mount removed; the inline `--hero-cover` style comment retuned to describe the v7 architecture (no more `<html>` mirror).
- [components/landing/v7/hooks/useLandingScroll.ts](../../components/landing/v7/hooks/useLandingScroll.ts) — `handoffCapable`, the `data-hero-handoff` band gate, and the `<html>` mirrors of `--hero-cover` / `data-hero-handoff` are removed. The eased `--hero-cover` is still written on `#hero` (drives the new parallax). Visibility cleanup simplified to `heroCover >= 1`.
- [components/landing/v7/landing.css](../../components/landing/v7/landing.css) — the entire `.hero-handoff-*` block + `html[data-hero-handoff]` / `.hero[data-hero-handoff]` rules are gone (~270 LOC). Both legacy `.hero__video { transform: scale(...) }` declarations are replaced with `opacity: 1` (no scale, gateway shield). New `@media (prefers-reduced-motion: no-preference)` block adds the `.hero` translateY drift + `.hero__content` opacity fade.

No edits under `components/landing/home-v2/**` — corridor / scene / store / hooks / parsed pipeline untouched.

### v7 invariants

- **No proxy plane, no duplicate copy.** The corridor IS the second section; there is exactly one. Reintroducing a portalled cover or any DOM that paints the Thoughtform copy / compass before the live corridor recreates the duplication beat that the user rejected.
- **No `data-hero-handoff` band gate, no `<html>` mirrors.** The hook writes `--hero-cover` on `#hero` only; the parallax CSS reads it from the same element. Adding back the `<html>` mirror or a band-gate attribute is a strong signal a future agent is about to reintroduce a separate cover layer.
- **Hero video stays opaque.** `.hero__video { opacity: 1 }`, no scale, ever (ADR-008 Rule 3 — scaling exposes the gateway at the edges; pulling opacity below 1 lets the gateway gradient bleed through). The inner `[data-parallax]` micro-drift on `.hero__video` is independent (CSS `translate`, not `transform`) and stays.
- **Hero motion = `.hero` `translateY` (≤ 10vh) + `.hero__content` `opacity` only.** Driven by `--hero-cover`, gated by `prefers-reduced-motion: no-preference`. Larger drift, scale, rotation, or perspective transforms would expose the gateway and reintroduce flat-poster / shrinking-card readings the previous iterations chased and rejected.
- **The corridor stays a black box.** The seam never transforms, reparents, clones, or reads geometry from `.home-corridor-host` / its scene / its scroll channels. The corridor's natural `armed` paint is the landing frame (ADR-018/021).
- **Reduced-motion = held hero.** The `@media (prefers-reduced-motion: no-preference)` gate ensures users with reduced-motion enabled see no parallax drift / no fade — only the corridor rising over the held hero. Do not lift the gate.

### Verification

- Scroll hero → corridor at any width: hero drifts up + content fades, the live corridor rises over it and lands on the parked compass / brandmark frame. **No duplicate copy, no plane, no flash, no shape swap.**
- Reverse scroll back to top retraces cleanly (every value is a pure function of `--hero-cover`, recomputed every rAF).
- `prefers-reduced-motion: reduce`: hero held static, corridor still covers it cleanly.
- Corridor flythrough + ADR-021 zoom-dissipate exit unchanged.
- `npm run lint` clean.

---

## v6.3 (superseded) — Cover-plane swipe with gate-matched proxy (2026-06-15)

### What this is

An Active Theory / Hashgraph-class **cover-plane swipe**: an opaque viewport plane (`.hero-handoff-cover` -> `.hero-handoff-plane`) carrying the Thoughtform first-read copy + a compass-gate diagram **clip-swipes upward** over the held hero, then hands the screen to the live home-v2 corridor at `cover = 1`. The clip edge is the reveal; opacity is not the transition owner during the swipe. This is the sweep the user validated in v6.0-v6.2.

### The jump, and its real cause

The user's only objection to the v6.0-v6.2 sweep was the **boundary jump**: at `cover = 1` the static proxy was replaced by the live corridor and the composition visibly changed. The cause was NOT "static proxy can never match R3F" in general — it was a specific, fixable shape mismatch: the proxy diagram was a single **rotated dashed diamond** (`transform: rotate(45deg)`), while the live `ThoughtformCompassGate` is **concentric AXIS-ALIGNED dashed squares** + a compass brandmark + NAVIGATE/ENCODE/BUILD labels. Diamond -> squares is the jump.

(An interim pass removed the proxy entirely — "direct corridor reveal", then an "edge chrome" line — to dodge the match problem. That **removed the sweep**, which the user explicitly wanted kept. Reverted.)

### The fix

Rebuild the proxy diagram to mirror the live gate:

- 4 concentric **axis-aligned** square loops (`.hero-handoff__ring--1..4`) at the live RING_RADII ratios [0.75, 0.63, 0.52, 0.39] -> 100 / 84 / 69 / 52%. Outer two dawn, inner two gold; the inner dotted dawn loop reads strongest, like the live gate.
- The canonical `BrandmarkGlyph` compass at ~50% of the outer ring (the live compass scale) + a faint bearing crosshair.
- NAVIGATE / ENCODE / BUILD labels positioned at the live gate's phase bearings (navigate upper-left, encode lower-left, build right).
- Diagram container tuned to the live gate's parked size + centre at 1920x1080 (outer ring ~480px, centre ~x1325/y542).

With the silhouette matched, the `cover -> 1` handoff is a soft settle (the proxy dissolves over a ~2% `--deck-clear` hairline into the live gate that has risen to its final parked position), not a shape swap.

Residual (acknowledged, minor): the live gate has a continuous breath spin (`rotation.z = elapsedTime * 0.012`) — ~0 at a fresh entry (so it matches the axis-aligned proxy), but it drifts if the page sits open for a long time before the user scrolls; and the live gate carries tiny phase sublabels the proxy omits. The hairline crossfade absorbs these. A pixel-perfect match is impossible because the gate is live R3F that rotates over time and rises during the band; this is as close as a static proxy gets while preserving the sweep.

The post-corridor "Make the layer useful." -> services seam is **NOT touched** (ADR-021 zoom-dissipate).

### Mechanic

```
SWIPE  cover 0 -> ~0.98 : .hero-handoff-plane clip-path inset((1-cover)*100% 0 0 0)
                          recedes 100% -> ~2% (fills bottom-up) + a small upward
                          settle. Hero HELD beneath (z:5, opacity 1, no zoom);
                          above the clip line the hero still shields the gateway.
                          Copy + concentric-square gate ride INSIDE the plane.
CLEAR  cover 0.98 -> 1  : hairline `--deck-clear` fades the plane as the live
                          corridor (risen to its final parked position) takes
                          over. Hero hidden at eased >= 0.98 so the fade reveals
                          the live corridor, never the held hero (the historical
                          "hero flash"). Matching gate silhouettes -> soft settle.
cover = 1              : band gate clears -> plane display:none, hero z:1 +
                          visibility:hidden; the live corridor owns the screen.
```

### Layer stack during the band (deck portalled into `main.stations`, within main's z:10)

```
z:0   .gateway                    fixed gold radial (shielded by the hero above the clip line)
z:1/5 #hero[data-hero-handoff]    held; promoted to z:5 during the band, opaque, no transform
z:3   .home-corridor-host         live corridor, armed at paintProgress 0 (the reveal target)
z:6   .hero-handoff-cover         the sweep plane (clip-swipe up), opacity = --deck-clear
        └── .hero-handoff-plane   opaque void + branded accents
              ├── .hero-handoff__copy      Thoughtform left copy
              └── .hero-handoff__diagram   concentric-square compass gate (matches the live one)
```

### Files

- [components/landing/v7/HeroHandoffCover.tsx](../../components/landing/v7/HeroHandoffCover.tsx) — the portalled sweep plane; diagram is concentric axis-aligned `.hero-handoff__ring--1..4` + `BrandmarkGlyph` + crosshair + labels.
- [components/landing/v7/landing.css](../../components/landing/v7/landing.css) — `@media (prefers-reduced-motion: no-preference) and (min-width: 961px)` block: `--deck-clear` clock + hero hold + `.hero[data-hero-handoff]` z:5; the `.hero-handoff-*` cover/plane/ring/brandmark/label rules.
- [components/landing/v7/hooks/useLandingScroll.ts](../../components/landing/v7/hooks/useLandingScroll.ts) — `handoffCapable` gate, eased `--hero-cover` mirrored onto `<html>`, `data-hero-handoff` band toggle, hero `visibility: hidden` at eased >= 0.98.
- [components/landing/v7/LandingPage.tsx](../../components/landing/v7/LandingPage.tsx) — mounts `<HeroHandoffCover>`.
- [components/landing/home-v2/home-v2.css](../../components/landing/home-v2/home-v2.css) — the interim `.home-corridor-host::before/::after` edge chrome was removed; the corridor host is back to plain.

No edits under `components/landing/home-v2/**` scene/store/hooks or `lib/v7-parse.ts`.

### v6.3 invariants

- **Keep the sweep.** The opaque clip-swipe plane is the validated beat; do not remove it in pursuit of a perfect handoff (that was the interim mistake).
- **Match the gate silhouette, not a diamond.** The proxy diagram must mirror the live `ThoughtformCompassGate` — concentric AXIS-ALIGNED squares + compass + phase labels. A rotated diamond (or any clearly different shape) reintroduces the jump.
- **Hairline `--deck-clear` only.** Fade the plane over ~2% at the very end; the hero `visibility: hidden` threshold (`eased >= 0.98`) must match the hairline start so the fade reveals the live corridor, not the held hero.
- **Hero held, never scaled down** (ADR-008 Rule 3); promoted to z:5 only during the band.
- **The corridor stays a black box** (ADR-018/021): the proxy mirrors its parked composition but never transforms/reparents it.
- **Reduced-motion / ≤960px**: plane `display: none`; hero on legacy `.hero__video` scale+fade; corridor rises over it.

### Verification (Playwright, 1920×1080)

| cover | plane clip-path | hero vis | deck opacity | observable                                                    |
| ----- | --------------- | -------- | ------------ | ------------------------------------------------------------- |
| 0.00  | inset(100% …)   | visible  | display:none | hero full-bleed                                               |
| 0.50  | inset(50% …)    | visible  | 1            | opaque plane swept to mid-viewport; proxy gate + copy rising  |
| 0.93  | inset(6.8% …)   | visible  | 1            | plane near-full; proxy compass gate (concentric squares) read |
| 0.98  | inset(2% …)     | hidden   | ~1 -> fading | hero hidden as the hairline begins                            |
| 0.999 | inset(~0% …)    | hidden   | ~0.04        | live corridor essentially shown; only a faint copy ghost      |
| 1.00  | display:none    | hidden   | display:none | live corridor owns the screen                                 |

Fresh-load comparison (proxy at cover ~0.97 vs live at cover 1.0): copy identical, compass brandmark aligned in size + position, rings axis-aligned and close. Mobile (800×1080) + reduced-motion: plane `display: none`; hero legacy scale+fade; corridor rises over it.

---

## v5 — KPR depth-window sweep (2026-06-15, superseded by v6)

### Why v4 wasn't enough

v4 shipped a literal two-faced 180deg DOM flip with a hollow rotating aperture shell sitting in front of a fixed Thoughtform proxy window. It was rigorous about safety boundaries (corridor untouched, facade-then-hairline-clear handoff) and Playwright-scrubbed clean. Live user feedback was that **it still read flat** — like a 2D slab rotating on the X-axis, not a "window into a layer behind it." Closer **live inspection of [kprverse.com](https://kprverse.com/)** at 1440x900 (Playwright `browser_evaluate`) confirmed the reference does NOT flip:

- KPR is a Nuxt page with native scroll, ~16400px tall, painting through one fixed full-screen WebGL `<canvas>` (no THREE namespace globals; bundled as a closure).
- The "card" is a **shaped beveled-corner window** (chamfered 45deg corners — silhouette confirmed across `y=500`, `y=950`, `y=1450`).
- Across the hero -> section-2 band, it **resizes / repositions / multiplies** beveled windows (one big hero window -> a small gallery + larger right-side window -> a full-bleed scene). It is a sweep/scale of shaped windows, not a flip.
- Inside each window, the texture **parallaxes slower than the frame** — comparing the portrait framing at `y=950` vs `y=1450` shows the character's face moves a smaller distance than the window's rounded corners do. **That texture lag is the depth signature** the user described as "rotates slower than the card."

v5 keeps v4's safety boundary (corridor stays a black box; facade hairline-crossfades to the live corridor) but pivots the visual model to KPR's: **enclose into a beveled window -> recede -> reveal a second beveled window -> hairline clear**, with **content parallax inside both windows** as the depth ingredient.

### Mechanics

```
Layer stack (portalled into main.stations, within main's z:10 envelope):
  z:3   .home-corridor-host         live corridor parked frame, armed/pinned
  z:4   .hero-flip-backdrop         radial void surround
  z:4   .hero-flip-enclosure        four void-black inset planes (belt-and-braces)
  z:5   .hero-flip-back-window      Thoughtform window (beveled, screen-facing)
  z:6   #hero[data-hero-flip="1"]   front window: live wormhole video (beveled)
```

Phase clocks (cover 0..1, all defined on `html[data-hero-flip="1"]`):

| Var           | Window       | Curve                            | Visual                                                                   |
| ------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------ |
| `--enclose`   | 0 -> 0.40    | `clamp(0, cover/0.40, 1)`        | Video insets, bevel grows 0 -> 32px, void surround closes in.            |
| `--recede`    | 0.30 -> 1    | `clamp(0, (cover-0.30)/0.70, 1)` | Hero window: translateZ -360px, translateX -2.8vw, rotateY 18deg, fades. |
| `--reveal`    | 0.34 -> 0.95 | `clamp(0, (cover-0.34)/0.61, 1)` | Back window: translateX 3vw -> 0, scale 0.90 -> 1.00, opacity 0 -> 1.    |
| `--back-fade` | ~0.994 -> 1  | hairline                         | Final clear; live corridor takes the screen.                             |

The phase windows overlap deliberately (0.30..0.40 holds both ENCLOSE and RECEDE; 0.34..0.95 holds both RECEDE and REVEAL) so the camera move feels continuous rather than stepped.

### Three coordinated layers per window (the depth ingredient)

The flat-2D feel of v4 came from rotating a full-bleed slab with no content parallax. v5 splits each window into three independent layers:

1. **Frame** (`.hero` for the front, `.hero-flip-back-window` for the back). Carries the depth recede / lateral sweep / scale. Beveled silhouette via `clip-path: polygon(...)` driven by `--bevel`.
2. **Window shape** (`.hero__video` for the front). Sets `inset` + `border-radius` + the beveled `clip-path`. Stays aligned with the frame.
3. **Content parallax** (`.hero__video video` for the front; `.hero-flip-back__copy` and `.hero-flip-back__diagram` for the back). **Counter-translates** opposite the frame's drift and **counter-scales** opposite the frame's recede, so the texture / copy reads as a deeper plane sliding **slower** than the bevel edge. This is the KPR signature — the user said it as "rotates slower than the card."

Concrete values (front window):

```css
.hero {
  /* Frame: depth recede + lateral sweep, no flip. */
  transform: perspective(1900px) translateX(calc(var(--recede, 0) * -2.8vw))
    translateZ(calc(var(--recede, 0) * -360px)) rotateY(calc(var(--recede, 0) * 18deg))
    scale(calc(1 - var(--enclose, 0) * 0.06));
  opacity: calc(1 - var(--recede, 0) * 1.06);
}
.hero__video video {
  /* Content parallax: ~50% magnitude of the frame's drift, opposite sign. */
  transform: translateX(calc(var(--recede, 0) * 1.4vw)) /* +1.4vw vs frame's -2.8vw */
    scale(calc(1 + var(--recede, 0) * 0.05)); /* counter-scale to frame's recede */
}
```

The back window mirrors the technique: it drifts in from the right (counter to the front's leftward sweep) and scales 0.90 -> 1.00 forward. Its inner copy and diagram counter-translate the drift and counter-scale the growth, so they sit on a deeper plane than the bevel.

### Beveled silhouette

Both windows use the same KPR-style beveled-corner polygon, sized by `--bevel` (which is `calc(var(--enclose, 0) * 32px)`):

```css
clip-path: polygon(
  var(--bevel) 0%,
  calc(100% - var(--bevel)) 0%,
  100% var(--bevel),
  100% calc(100% - var(--bevel)),
  calc(100% - var(--bevel)) 100%,
  var(--bevel) 100%,
  0% calc(100% - var(--bevel)),
  0% var(--bevel)
);
```

At cover 0 the bevel is 0 and the polygon is a full-bleed rectangle (no clipping). The bevels appear as the windows enclose, exposing `.hero`'s `var(--void)` background through the corner cuts. The four `.hero-flip-enclosure` planes form a redundant thin frame around the inset gap (belt-and-braces); the visible "card on void" silhouette is primarily the result of `.hero`'s background showing through the bevel + the backdrop's `inset: 0` void shielding the screen edges.

### Files changed in v5

- [`components/landing/v7/landing.css`](../../components/landing/v7/landing.css) — `@media (prefers-reduced-motion: no-preference) and (min-width: 961px)` block reworked: phase clocks become `--enclose / --recede / --reveal / --back-fade / --bevel`; `.hero` swaps `rotateY(... -180deg)` for the depth-window sweep; `.hero__video` adds the beveled `clip-path: polygon(...)`; new rule `.hero__video video` for the inner-content parallax; `.hero-flip-back-window` becomes a forward-scaling beveled window with the same `--bevel` polygon; `.hero-flip-back__copy` / `.hero-flip-back__diagram` switch to `--reveal`; the entire `.hero-flip-back / __rim / __glaze` rotating-aperture shell block is **deleted**.
- [`components/landing/v7/HeroFlipBackface.tsx`](../../components/landing/v7/HeroFlipBackface.tsx) — the `<div className="hero-flip-back">` rim/glaze block is removed from the JSX. Backdrop + enclosure + back-window subtree (copy + diagram + brandmark) preserved verbatim. Docblock rewritten to describe the v5 depth-window sweep model.
- [`.claude/skills/landing-v7-compositing/SKILL.md`](../../.claude/skills/landing-v7-compositing/SKILL.md) — "In-band hero flip deck" section rewritten to describe v5: layer stack, phase clocks, beveled silhouette, content parallax, updated invariants.

No edits to:

- `useLandingScroll` (continues writing eased `--hero-cover` to both `#hero` and `<html>`, toggling `data-hero-flip="1"` mid-band on capable devices, single rAF frame).
- Anything under `components/landing/home-v2/**` (corridor scene, store, exit scroll hook).
- The parsed v7 HTML pipeline (`lib/v7-parse.ts`).

### v5 invariants (extend the v1 list; **supersede v2-v4 invariants** about flips and rotating aperture shells)

- **No literal flip.** The hero rotates a maximum of 18deg on the Y-axis as it recedes; this is a parallax cue, not a card-turn. Re-introducing `rotateY` magnitudes >~30deg, or two-faced `backface-visibility` setups, returns the page to v4's flat-slab feel and breaks the depth-window read.
- **Both windows are beveled and screen-facing.** Use the shared `--bevel` polygon clip-path. Do NOT rotate readable window content (copy / brandmark / video) on its own axis; rotation lives only on the hero frame's recede, not on the window contents or the back window.
- **Content parallax is non-negotiable.** Without the counter-transform on `.hero__video video` (and on `.hero-flip-back__copy` / `.hero-flip-back__diagram`), the windows revert to v3-flavored 2D posters. Magnitude rule: counter-translate is ~50% of the frame's drift, counter-scale is ~50% of the frame's recede magnitude.
- **The back window stays opaque to almost the boundary.** Keep the hairline `--back-fade` (clears across cover 0.994 -> 1.0). Long crossfades duplicate the second section in the same frame.
- **The corridor remains a black box.** No corridor component, canvas, world anchor, or scroll channel is transformed or reparented by the deck. The facade-to-corridor handoff is a short visual blend, not shared rendering.
- **The deck portals into `main.stations`** as siblings of `#hero`, with `pointer-events: none` and `var(--void)` shields intact (ADR-008).
- **Reduced-motion / <=960px** keep falling through to the legacy scale+fade rules above the `@media` block; the deck is `display: none` outside the gate.

### Why we chose DOM/CSS over a WebGL port

A faithful KPR-style port (one fixed `<canvas>`, one shaped mesh per window, parallaxing texture as a UV offset) is technically closer to the reference but disproportionate to this seam:

- It would collide with the live home-v2 R3F corridor canvas and the brandmark particle canvas — three WebGL contexts on one page is a perf and integration headache.
- The DOM/CSS version captures the FEEL (beveled silhouette + content parallax + sweep) at zero new runtime cost beyond two `transform` properties per frame.
- If this still falls short, a future ADR can revisit a single shared canvas without reverting any of the safety scaffolding here.

### Verification

Playwright at 1920x1080:

| cover | --enclose | --recede | --reveal | --back-fade | observable                                                         |
| ----- | --------- | -------- | -------- | ----------- | ------------------------------------------------------------------ |
| 0.00  | 0         | 0        | 0        | 1           | full-bleed video; back window invisible                            |
| 0.20  | 0.50      | 0        | 0        | 1           | bevel growing, video inset ~24px; back invisible                   |
| 0.45  | 1.00      | 0.214    | 0.180    | 1           | full bevel; hero starting to recede / drift; back fading in        |
| 0.70  | 1.00      | 0.571    | 0.590    | 1           | hero clearly receded + tilted; back window approaching final scale |
| 0.92  | 1.00      | 0.886    | 0.951    | 1           | hero almost gone; back window at final scale                       |
| 0.998 | 1.00      | 0.997    | 1.000    | ~0.5        | hairline clear; live corridor emerging                             |
| 1.00  | -         | -        | -        | 0           | deck `display: none`; hero `visibility: hidden`; corridor pinned   |

Verify content parallax delta (frame translateX vs video translateX) is non-zero across the recede band; corridor `data-corridor-engaged="true"` is `true` throughout the band; `paintProgress` is 0 across the band, 1 at cover=1; reduced-motion / 800x1080 paths never enter the deck (`display: none`, hero on legacy scale+fade fallback).

---

## Context

The hero's existing exit was a quiet **scale + fade**: as the corridor mount rose into view, [`useLandingScroll`](../../components/landing/v7/hooks/useLandingScroll.ts) wrote an eased `--hero-cover` (0..1) to `#hero` and the hero video gently zoomed and faded while the corridor host (`z:3`) physically slid up over the pinned hero (`z:1`). Functional, but it lacked the deliberate "the page just turned" beat that the rest of the v7 brand grammar trades on (HUD bracket frames, depth-corridor flythrough, sphere zoom-dissipate at the corridor exit).

The reference behaviour is [kprverse.com](https://kprverse.com/), which **wraps the hero into a card and 3D-rotates it through depth** to reveal the next section. Browser inspection of KPR's site confirms: native scroll, lerped via a virtual `scroller`, with a single Three.js canvas painting both the wrap and the rotateY recede; the next section is built from the same card shape so the wrap "lands" as content.

Two constraints shaped the response:

1. **The home-v2 depth corridor must not move.** ADR-018 / ADR-021 lock down `progress` / `paintProgress` / `epilogueProgress` / `dockProgress` as single-writer scroll channels owned by [`useDepthScroll`](../../components/landing/home-v2/hooks/useDepthScroll.ts) and [`useCorridorExitScroll`](../../components/landing/home-v2/hooks/useCorridorExitScroll.ts). The 820svh stage height, `EPILOGUE_START = 620/820`, the camera rig, and the dock-engage gate (`epilogueProgress >= 0.72`) are all calibrated against each other; touching them risks sphere jitter, exit dock failure, or the wormhole flythrough breaking.
2. **The reveal must land _exactly_ on the corridor's parked Thoughtform frame** — the keyframe with `THOUGHTFORM /θɔːtfɔːrm/` copy on the left and the dotted compass-gate brandmark with NAVIGATE / BUILD / ENCODE labels on the right. That frame is what the user wants the flip to "open onto."

The load-bearing observation is that the corridor's `getCorridorEngagement` ([`lib/stores/depthGatewayStore.ts`](../../lib/stores/depthGatewayStore.ts) L173-184) defines an **`armed` phase** that fires while the stage rises into the viewport but is not yet pinned. While armed, the corridor's `<Canvas>` runs `frameloop="always"` and paints `paintProgress = 0` at full opacity — i.e. the parked Thoughtform frame is already on screen, fully rendered, behind the hero, throughout the same one-viewport scroll band that drives `--hero-cover`. The flip's `cover = 1` end state therefore coincides frame-for-frame with the corridor's natural start. Nothing about the corridor needs to move; only the hero's exit visual changes.

---

## Decision

Replace the hero's existing scale + fade with a **wrap + 3D `rotateY` recede**, driven entirely by the existing `--hero-cover` channel and a single new `data-hero-flip="1"` attribute that promotes the hero above the corridor host mid-band so the flip _reveals_ — rather than is covered by — the rising mount. No changes anywhere under `components/landing/home-v2/**`. No new scroll listeners. No new store channels.

### Mechanics

1. **`--hero-cover` stays the single progress source.** [`useLandingScroll`](../../components/landing/v7/hooks/useLandingScroll.ts) continues to write the smootherstep-eased cover value on every rAF frame as the corridor mount's top crosses from `vh` to `0`. ADR-002's "single rAF, batched reads" pattern is preserved.

2. **`.hero[data-hero-flip="1"]` promotes z-index 1 → 5 mid-band only.** The same hook that writes `--hero-cover` toggles a capability-gated dataset attribute in the same frame:

   ```ts
   const flipCapable = !reduceMotion && window.matchMedia("(min-width: 961px)").matches;
   if (flipCapable && heroCover > 0 && heroCover < 1) {
     heroEl.dataset.heroFlip = "1";
   } else {
     delete heroEl.dataset.heroFlip;
   }
   ```

   At `cover = 0` (before the band) and `cover = 1` (after, where the existing `visibility: hidden` cleanup takes over), the attribute is absent and the hero stays at its sticky `z:1`. The promotion is purely the band-time inversion that makes a _reveal_ read as a reveal instead of a cover.

3. **CSS owns all phase math.** A single media query, `@media (prefers-reduced-motion: no-preference) and (min-width: 961px)`, wraps the flip treatment so reduced-motion and narrow viewports fall through to the legacy scale + fade rules above it (which stay in place as the fallback path).

   Inside the gate:

   ```css
   .hero {
     background: var(--void);
     transform-origin: 50% 50%;
     will-change: transform;
     transform: perspective(1600px)
       translateZ(calc(var(--hero-cover, 0) * var(--hero-cover, 0) * -640px))
       rotateY(calc(var(--hero-cover, 0) * var(--hero-cover, 0) * var(--hero-cover, 0) * -58deg))
       scale(calc(1 - var(--hero-cover, 0) * 0.13));
   }
   .hero[data-hero-flip="1"] {
     z-index: 5;
   }
   .hero__video {
     inset: calc(var(--hero-cover, 0) * 24px);
     border-radius: calc(var(--hero-cover, 0) * 28px);
     transform: none;
     opacity: 1;
   }
   .hero__content {
     transform: none;
     opacity: calc(1 - var(--hero-cover, 0) * 1.8);
   }
   ```

   - **Wrap (linear `cover`):** `.hero__video` insets and rounds, exposing the parent `.hero`'s `var(--void)` background as a frame around the video. The hero's `overflow: hidden` already constrains the rounded video card inside the box.
   - **Fade (linear, fast `cover * 1.8`):** `.hero__content` (wordmark + tagline) clears around `cover ≈ 0.55` so copy is gone before the rotation gets dramatic.
   - **Flip (`cover²` for translateZ, `cover³` for rotateY):** the recede and rotation curves are concentrated at the back half of the band. Because `--hero-cover` is already smootherstep-eased upstream, the effective curves are `smootherstep²` and `smootherstep³` — at raw cover 0.5 the rotation is ~7°, at raw cover 0.85 it's ~53°, at raw cover 1.0 it's 58°. The big reveal sits exactly where the corridor pins.
   - **`transform: none` on `.hero__video` and `.hero__content`** explicitly nulls the legacy scale rules from `Hero polish` (line ~6135) and the `[data-parallax]`-cascade re-declaration (line ~6471); on capable devices the hero flips as a single rigid card.

4. **The reveal target is the live, armed corridor.** While `--hero-cover` is in the band, `getCorridorEngagement` reports `{ active: false, armed: true, paintProgress: 0 }` — the corridor canvas is painting the parked Thoughtform frame at full opacity, with the same `data-corridor-engaged="true"` HUD-handover that the existing flow uses. As the hero card rotates and recedes, the user sees the parked corridor frame revealed through and around it. At `cover = 1`, the existing `heroEl.style.visibility = "hidden"` line takes over and the corridor takes the screen. There is no separate "land" choreography to write — the corridor's natural start IS the landing frame.

5. **Capability + fallback gate is dual-locked.** The JS toggle and the CSS media query check the same conditions (`prefers-reduced-motion: no-preference` AND `min-width: 961px`). If JS lags or fails, the attribute simply isn't set and the CSS rules still resolve to identity-equivalent at `cover = 0`. Reduced-motion users and ≤960px viewports never hit the flip rules at all — they keep the legacy scale + fade and the existing visibility cutoff.

### Files changed

- [`components/landing/v7/hooks/useLandingScroll.ts`](../../components/landing/v7/hooks/useLandingScroll.ts) — capability check hoisted to the top of the rAF frame; `data-hero-flip` toggle added inside the same `if (heroEl && defEl)` block that writes `--hero-cover`. The duplicate `reduceMotion` declaration in the parallax block was removed (now reuses the hoisted value). No new listeners; no changes to `useEffect` / `useLayoutEffect` lifecycle.
- [`components/landing/v7/landing.css`](../../components/landing/v7/landing.css) — new `@media (prefers-reduced-motion: no-preference) and (min-width: 961px)` block appended after the existing late-cascade hero rules (~line 6475); the legacy scale + fade rules above it are preserved as the fallback.

No edits under `components/landing/home-v2/**`. No edits to corridor stores, hooks, scene, camera rig, shells, or the parsed v7 HTML pipeline.

---

## Constraints honored (do not regress)

- **Single-writer scroll channels** (ADR-018, ADR-021). `useLandingScroll` continues to own only `--depth`, `--hero-cover`, `--py`, the HUD readouts, and now `data-hero-flip`. It does not touch `progress`, `paintProgress`, `epilogueProgress`, `dockProgress`, or `data-corridor-docked` / `data-corridor-engaged`.
- **No global Lenis over the corridor** (ADR-018 v3.10). Native window scroll only.
- **`EPILOGUE_START = 620/820` synced to `.home-v2-stage { height: 820svh }`** (ADR-018, ADR-021). Untouched.
- **`getCameraFov` parity between R3F camera and the DOM mirror camera** (ADR-018). Untouched.
- **`FrameInvalidator` and engagement-gated `frameloop`** (ADR-018). Untouched.
- **Reverse-scroll release (`DOCK_RELEASE_EPILOGUE_PROGRESS = 0.7`)** (ADR-021). Untouched. The flip is fully reversible by symmetry: `--hero-cover` is recomputed every frame from the live `defTop`, and the dataset attribute is set / cleared the same way on the way back up.
- **ADR-008 paint-stack invariants.** `.hero` retains its `var(--void)` background — explicitly set in the new rule so the wrap frame is opaque. The promotion to `z:5` only happens _during_ the band, where the hero is already shielding behind itself; before and after the band the hero is at `z:1` (sticky) or `visibility: hidden`. The fixed `.gateway` (`z:0`) and HUD chrome are unaffected.

## Consequences

### Positive

- The hero exit reads as a deliberate brand beat (wrap → flip → reveal) instead of a quiet zoom, matching the corridor's other dramatic seams (gateway flythrough, sphere zoom-dissipate).
- Zero risk to the corridor: the entire change is two files outside `components/landing/home-v2/**`, and the corridor's armed pre-paint already does the work of "having the next frame ready."
- Reversibility is automatic. The CSS values are pure functions of `--hero-cover`, which is recomputed every rAF; scroll-up retraces scroll-down. The dataset attribute is a band gate, not a latch.
- bfcache-safe. Both writers (`--hero-cover` and the dataset toggle) run inside `useLayoutEffect` on first paint and again on every scroll, so `pageshow` restoration converges to the correct state on the first frame.

### Negative

- One more CSS variable consumer to keep in mind when reasoning about the hero exit band. The legacy scale + fade rules now exist as a _fallback path_ rather than the primary path, which inverts the cascade priority for someone reading top-down.
- The `pow()`-via-multiplication trick (`var(--hero-cover) * var(--hero-cover) * ...`) reads less directly than `pow(var(--hero-cover), 3)`. Multiplication was chosen for compatibility breadth; revisit if `pow()` lands as the codebase's preferred style elsewhere.
- The hero, while flipped, accepts pointer events at `z:5`. The hero contains no interactive elements (the HUD chrome lives outside `#hero`), but if interactive content is ever added inside the hero, this band is a place where it will eclipse the rising corridor. Today, this is fine.

### Neutral

- Hero `background` is now explicitly `var(--void)` inside the media query. Functionally identical to the existing implicit body / void cascade, but makes the wrap frame self-sufficient regardless of stacking context.

---

## What NOT to do (failure modes that would regress this)

- **Don't move the band-gate logic into the corridor hooks.** The flip is a hero exit visual; the corridor only provides the landing frame. Putting `data-hero-flip` writes inside `useDepthScroll` or `useCorridorExitScroll` would re-create the cross-writer scroll-channel bug pattern documented in ADR-018 v3.14 / ADR-021.
- **Don't promote the hero to `z:5` outside the band.** Leaving the attribute permanently set would put the hero above the corridor at all times — covering the corridor's armed pre-paint with a stale hero card and breaking the existing handoff entirely. The attribute is a strict in-band gate.
- **Don't remove the `transform: none` overrides on `.hero__video` and `.hero__content`.** The legacy late-cascade rule (`landing.css` ~line 6471) re-applies `transform: scale(...)` after the parallax block; without explicit `none` overrides inside the media query, the legacy scale would compose on top of the flip and the card would stretch instead of flipping cleanly.
- **Don't change `--hero-cover`'s upstream easing without retuning the `pow²` / `pow³` curves.** The wrap-vs-flip split is calibrated against the smootherstep curve, not raw scroll. Pushing easing changes upstream silently shifts the visual band.
- **Don't add the flip rules outside the media query.** The `prefers-reduced-motion` and `min-width: 961px` gates are dual-locked with the JS toggle for safety; collapsing them would break the reduced-motion fallback path.
- **Don't bake brandmark or station-specific reveal animations into the hero card.** The corridor's parked Thoughtform frame already includes the brandmark gateway, the dotted compass square, and the NAVIGATE / BUILD / ENCODE labels (painted by the corridor's R3F canvas + `CorridorStationHeaders`). The flip is a _hero exit_; treat the corridor as a black box.

---

## References

- [`components/landing/v7/hooks/useLandingScroll.ts`](../../components/landing/v7/hooks/useLandingScroll.ts) — `flipCapable` + `data-hero-flip` toggle (in the same rAF frame as `--hero-cover`).
- [`components/landing/v7/landing.css`](../../components/landing/v7/landing.css) — new `@media (prefers-reduced-motion: no-preference) and (min-width: 961px)` block (~line 6495).
- [`components/landing/home-v2/HomeCorridor.tsx`](../../components/landing/home-v2/HomeCorridor.tsx) and [`components/landing/home-v2/DepthGatewayScene/index.tsx`](../../components/landing/home-v2/DepthGatewayScene/index.tsx) — black box; not edited.
- [`lib/stores/depthGatewayStore.ts`](../../lib/stores/depthGatewayStore.ts) L173-184 — `getCorridorEngagement`'s `armed` phase, which guarantees the parked frame is on screen and ready throughout the flip band.
- [kprverse.com](https://kprverse.com/) — reference behaviour. Native scroll + lerped virtual scroller + Three.js for the wrap and rotateY recede; this ADR's CSS path is a brand-grammar adaptation, not a faithful Three.js port.

---

## v2 rework — Enclose-then-flip with two-faced card (2026-06-15)

### Why v1 wasn't enough

v1 was a single-element "wrap then rotate the hero away" that revealed the live corridor _behind_ the hero as it receded. Closer Playwright scrubbing of [kprverse.com](https://kprverse.com/) showed a different mechanic: the hero **first encloses into a contained card** (no rotation, just shrink + round corners + black margin), and **then** flips on a vertical axis to reveal **the next section on the back face of the card**. The next section isn't behind the flipping hero — it's _on the other side_ of the card. The corridor is an asset that lives "inside" the card, not behind it.

The v2 rework matches that mechanic while still keeping the live corridor untouched.

### What changed

**Choreography (CSS `@media (prefers-reduced-motion: no-preference) and (min-width: 961px)`):**

| Phase     | `--hero-cover` | What happens                                                                                                                                                                                                               |
| --------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENCLOSE   | 0 → 0.45       | Card pinches inward (`scale 1 → 0.85`), corners round, void-black backdrop fades in. NO rotation.                                                                                                                          |
| FLIP      | 0.45 → 1       | `rotateY 0deg → 180deg` on both faces; card grows back (`scale 0.85 → 1`). Front (`#hero`) shows live wormhole video; back shows Thoughtform facade. `backface-visibility: hidden` on each side handles the swap at 90deg. |
| CROSSFADE | 0.85 → 1       | Backdrop + facade opacity 1 → 0, revealing the live corridor that has naturally pinned at `paintProgress = 0`.                                                                                                             |

The shared phase clocks live in CSS variables defined on `<html data-hero-flip="1">` so the front (in parsed `main.stations`) and the portalled back deck inherit identical values:

```css
html[data-hero-flip="1"] {
  --enclose: clamp(0, min(calc(var(--hero-cover) / 0.45), calc((1 - var(--hero-cover)) / 0.55)), 1);
  --flip: clamp(0, calc((var(--hero-cover) - 0.45) / 0.55), 1);
  --back-fade: clamp(0, calc((1 - var(--hero-cover)) / 0.15), 1);
}
```

`--enclose` is a triangle (0 → 1 at cover 0.45 → 0 at cover 1) so the card pinches in then grows back out during the flip. `--flip` is linear (0 at cover 0.45 → 1 at cover 1). `--back-fade` is the deck's alpha (1 across the band, ramps to 0 across cover 0.85 → 1).

**The back face is a static DOM facade, not the live corridor.** The corridor's flythrough reads `getBoundingClientRect()` on its 820svh stage every frame to drive `paintProgress` / `epilogueProgress`; any 3D transform on an ancestor of that stage corrupts the rect and breaks the flythrough. Instead, [`HeroFlipBackface`](../../components/landing/v7/HeroFlipBackface.tsx) is a small `position: fixed` deck containing:

1. `.hero-flip-backdrop` — opaque `var(--void)` covering the viewport, providing the black margin around the enclosed card.
2. `.hero-flip-back` — the facade itself: a copy column (reusing `text.thoughtform.bridge / titleHtml / body1Html / body2Html / cta` and the `.home-v2-copy-block--thoughtform-left` / `.home-v2-copy-bridge` / `.home-v2-copy-title` / `.home-v2-copy-body` typography classes from `home-v2.css` verbatim, so the typographic scale matches the live corridor 1:1) plus the canonical [`BrandmarkGlyph`](../../components/landing/v7/BrandmarkGlyph.tsx) inside a dashed diamond frame (`transform: rotate(45deg)` on the frame, `rotate(-45deg)` on the brandmark to keep it upright).

The deck **portals into `main.stations`** (via `createPortal(content, mainEl)`) so its stacking context is the same as `#hero`. Layered:

```
z:3  .home-corridor-host  (rising, parked frame; armed)
z:4  .hero-flip-backdrop  (void-black margin)
z:5  .hero-flip-back      (facade: copy + brandmark, rotateY+180)
z:6  #hero[data-hero-flip] (front: live video, rotateY)
```

Everything fits inside `main`'s own `z:10` envelope, so the deck never competes with the HUD (`z:50`) or the gateway (`z:0`). Front and back are full-bleed siblings (not parent/child) — `#hero` lives in parsed `dangerouslySetInnerHTML` markup we don't mutate, and its `overflow: hidden` would clip a child rotated card.

The crossfade window (cover 0.85 → 1) hides the facade and backdrop just as the live corridor — armed at `paintProgress = 0` throughout the band — would be revealed. By cover 1 the deck is `display: none` (gated by `html[data-hero-flip="1"]` which `useLandingScroll` clears at the boundary), the hero is `visibility: hidden`, and the live corridor takes the screen as its natural pin engages.

### Files changed in v2

- [`components/landing/v7/hooks/useLandingScroll.ts`](../../components/landing/v7/hooks/useLandingScroll.ts) — additionally mirrors `--hero-cover` (eased) and `data-hero-flip` onto `document.documentElement` so the deck siblings inherit the channel via cascade.
- [`components/landing/v7/HeroFlipBackface.tsx`](../../components/landing/v7/HeroFlipBackface.tsx) — new component. `position: fixed` deck portalled into `main.stations`. Reads `text: V7CorridorText`. `display: none` outside `<html data-hero-flip="1">`.
- [`components/landing/v7/LandingPage.tsx`](../../components/landing/v7/LandingPage.tsx) — mounts `<HeroFlipBackface text={corridorText} containerRef={rootRef} />` as a sibling.
- [`components/landing/v7/landing.css`](../../components/landing/v7/landing.css) — flip media-query block reworked to enclose-then-flip; new `.hero-flip-deck / .hero-flip-backdrop / .hero-flip-back / .hero-flip-back__inner / .hero-flip-back__copy / .hero-flip-back__diagram / .hero-flip-back__diagram-frame / .hero-flip-back__brandmark` rules.

### v2 verification (Playwright, 1920×1080 viewport)

| y    | cover (eased) | flipAttr | hero z | hero vis | back opacity     | corridor engaged                |
| ---- | ------------- | -------- | ------ | -------- | ---------------- | ------------------------------- |
| 0    | 0.000         | null     | 1      | visible  | 1 (display:none) | false                           |
| 270  | 0.104         | "1"      | 6      | visible  | 1                | true (armed)                    |
| 540  | 0.500         | "1"      | 6      | visible  | 1                | true (armed)                    |
| 700  | 0.762         | "1"      | 6      | visible  | 1                | true (armed)                    |
| 800  | 0.886         | "1"      | 6      | visible  | 0.76             | true (armed)                    |
| 920  | 0.974         | "1"      | 6      | visible  | 0.17             | true                            |
| 1000 | 0.996         | "1"      | 6      | visible  | 0.024            | true                            |
| 1080 | 1.000         | null     | 1      | hidden   | (display:none)   | true (pinned)                   |
| 4500 | 1.000         | null     | 1      | hidden   | (display:none)   | true (active)                   |
| 9500 | 1.000         | null     | 1      | hidden   | (display:none)   | true + docked + dissipate=0.596 |

Reverse-scroll re-enters band cleanly (same values at same y in both directions). Mobile fallback (≤960px): media gate skips the flip rules entirely; deck stays `display: none`, hero keeps the legacy scale+fade (verified `videoT: matrix(1.09, …) opacity: 0.775` at cover=0.5 in 800×1080).

### v2 additional invariants (extend the v1 list)

- **The back face is a facade, not the live corridor.** Never replace `HeroFlipBackface` with the home-v2 R3F canvas, a portal of the corridor, or any element whose layout is read by `useDepthScroll`. The crossfade exists because facade ↔ live corridor parity isn't pixel-perfect; closing it via shared rendering would corrupt the corridor's rect math.
- **The deck must portal into `main.stations`, not be a root sibling.** A root-level deck would need a z-index above `main` (z:10) to paint over the rising corridor host (z:3); but then the deck would also paint over the hero (which is z:5/6 inside main). Putting the deck inside main keeps front/back/backdrop in one stacking context where the standard z-order works as written.
- **Front and back are siblings, never parent/child.** `#hero` lives in parsed `dangerouslySetInnerHTML` and has `overflow: hidden`; a back face inside it would be clipped during rotation. The two-element flip with matching `perspective(1600px)` + `transform-origin: 50% 50%` + opposite rotateY is the only stable pattern.
- **Don't drop `backface-visibility: hidden` from either face.** Without it, both faces paint at all rotations and the user sees a mirrored ghost of the front through the back during the flip.
- **The deck must be `display: none` outside the band.** Otherwise the void-black backdrop (`opacity: var(--back-fade, 0)` defaults to 0, but the deck still occupies layout) could intercept pointer events or affect the brandmark suppression check in `HomeCorridor`.

---

## v3 refinement - KPR depth window, not a rotating poster (2026-06-15)

### What changed from v2

Closer inspection of KPR's production bundle showed the reference is not a DOM card whose child content rotates as a flat poster. KPR renders a persistent WebGL card with separate front/back faces and masks; the page content/UI is layered so the visible section content stays comparatively stable while the card shell supplies the depth move. The user-facing effect is "content inside a back window," not "content pasted onto a rotating plane."

The v3 implementation keeps the v2 safety boundary - no corridor code moves - but splits the deck into three roles:

```
z:3  .home-corridor-host          (live corridor, armed/pinned by its own hooks)
z:4  .hero-flip-backdrop          (radial void surround)
z:4  .hero-flip-enclosure         (four closing void planes)
z:5  .hero-flip-back              (rotating structural shell only)
z:5  .hero-flip-back-window       (nearly-flat content window)
z:6  #hero[data-hero-flip="1"]    (front: live wormhole video)
```

The front hero now rotates to 150deg rather than a full 180deg, with a smaller scale change (`1 -> 0.94`) and a modest `translateZ(-120px)`. The black frame is created primarily by the four enclosure planes and the video inset, so the motion reads as the void closing in around the hero instead of the hero simply zooming out.

The back shell still rotates opposite the front, but the actual Thoughtform copy/brandmark lives in `.hero-flip-back-window`, which counter-moves only slightly (`rotateY` up to 10deg while revealing, then 0deg) and sits forward in Z. Copy and diagram layers get their own shallow `translateZ` offsets so the facade reads as a window with internal depth.

The fade clock also changed. v2 faded the deck from cover 0.85 to 1.0; visual QA showed a long duplicate-read window where the facade copy and the live corridor copy were both visible. v3 keeps the facade as the owner of the revealed second section almost to the end, then clears it in a short final handoff:

```css
--back-fade: clamp(0, calc((1 - var(--hero-cover, 0)) / 0.02), 1);
```

The deck stays fully readable through roughly cover 0.98, then fades quickly as the hero reaches the boundary. At cover 1 the existing `data-hero-flip` clear and hero visibility cleanup remove the deck path entirely, and the live corridor owns the screen cleanly.

### v3 invariants

- **Rotate the shell, not the window content.** `.hero-flip-back` is the structural back face. `.hero-flip-back-window` carries the readable facade and should remain almost front-facing.
- **The black frame is an enclosure.** Keep `.hero-flip-enclosure` as four closing planes plus the video inset. Do not reintroduce a large hero-only zoom as the primary cue.
- **Avoid a long duplicate-read blend.** Keep the facade as the owner through most of the band and make the final handoff short; otherwise the second section exists twice in the same frame.
- **The corridor remains a black box.** Do not mount, transform, clone, or reparent the home-v2 corridor inside the back face. The facade-to-corridor handoff is a short visual blend, not shared rendering.

---

## v4 refinement - Hollow aperture + settling proxy (2026-06-15)

The v3 pass still read too much like a 2D poster because the readable Thoughtform facade participated in the card's 3D transform. A second KPR inspection found the important production detail: KPR's home bundle contains a `PersistentCardMask` scene with separate `frontFace` / `backFace` objects and stencil render passes. The card supplies the mask and depth move; the section content is effectively revealed through that mask instead of being ordinary DOM content glued to a rotating plane.

v4 adapts that mechanic without moving the home-v2 corridor:

```
z:3  .home-corridor-host          (live corridor, armed/pinned by its own hooks)
z:4  .hero-flip-backdrop          (void surround)
z:4  .hero-flip-enclosure         (closing void planes)
z:5  .hero-flip-back-window       (fixed, screen-facing Thoughtform proxy)
z:5  .hero-flip-back              (rotating hollow aperture: rim + glass only)
z:6  #hero[data-hero-flip="1"]    (front: live wormhole video, rotates/fades)
```

Key changes from v3:

- The front hero now rotates through a real `rotateY(-180deg)` and fades out immediately after the edge-on crossover, so the wormhole image cannot survive as a large 2D slab during the reveal.
- `.hero-flip-back-window` is fixed and screen-facing. It no longer counter-rotates, tilts, or carries `translateZ`; it is the section proxy seen through the aperture.
- `.hero-flip-back` is hollow. It renders rim bars and a light glass outline only; there is no filled back poster surface.
- The aperture shell has its own `--shell-fade`, so it disappears once it has established depth. The proxy remains readable after that.
- The proxy copy uses a two-phase settle: while the shell is active it is left/narrow to avoid the projected rim slicing the copy; as `--shell-fade` reaches 0 it slides/widens into the measured live corridor copy coordinates (`left ~= 318px`, `width ~= 460px` at 1920x1080). This makes the final clear into the real corridor much less jumpy.
- `--back-fade` is a hairline clear, not a long crossfade: `clamp(0, calc((1 - var(--hero-cover) - 0.001) / 0.006), 1)`. Long blends visibly duplicate the second section; the proxy must stay opaque until it has settled, then clear only at the boundary.

v4 verification points (Playwright, 1920x1080):

| y    | cover  | front opacity | window opacity | shell opacity | state                                       |
| ---- | ------ | ------------- | -------------- | ------------- | ------------------------------------------- |
| 625  | 0.6452 | 0             | 1              | 1             | hollow aperture reveal; copy left/narrow    |
| 860  | 0.9392 | 0             | 1              | 0             | shell dissolved; proxy live-aligned         |
| 978  | 0.9927 | 0             | 1              | 0             | proxy still opaque; no duplicate-read blend |
| 1040 | 0.9995 | 0             | 0              | 0             | real corridor visible                       |
| 1080 | 1.0000 | hidden        | display none   | display none  | deck removed; corridor pinned               |

v4 invariants:

- **Never rotate readable window content.** If copy/brandmark tilt with the shell, the illusion collapses back into a 2D poster.
- **Keep `.hero-flip-back` hollow.** Rim/glass can rotate; a filled surface cannot.
- **Do not widen the final blend.** Long opacity blends reveal the live corridor under the proxy and duplicate the second section.
- **Do not remove the proxy settle.** The left/narrow -> live-aligned copy move is what prevents the shell edge from cutting text while still handing off to the real corridor.
- **The live corridor remains a black box.** No corridor component, canvas, world anchor, or scroll channel is transformed or reparented by the flip.

### Why v1 was rejected

v1 was a "hero rotates away to reveal corridor _behind_ it" mechanic — the corridor was pre-rendered behind the rotating hero, and the user's eye followed the receding hero. This works visually (the corridor IS behind it, armed and fully painted), but it tells the wrong narrative: the hero is _exiting_, not _enclosing the next section_. KPR's chosen mechanic — and what the user requested — is "the next section lives inside the back of the flipped section." That requires a true two-faced card with the next section's content rendered on the back, which is what v2 delivers via the facade + crossfade.
