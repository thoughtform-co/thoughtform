# ADR-058: Light mode — the theme channel, the toggle, and the two palettes

**Date:** 2026-08-01
**Status:** Accepted (Phase 0 shipped behind `THEME_TOGGLE`; Phases 1–4 in flight)
**Scope:** `lib/theme/themeModeRef.ts` (new), `lib/stores/themeStore.ts` (new),
`components/landing/v7/themeToggle.ts` (new — the flag),
`components/landing/v7/theme.css` (new — the whole light cascade),
`components/landing/v7/LightModeToggle.tsx` + `ThemeGlyph.tsx` (new),
`app/layout.tsx` (the pre-paint bootstrap + `<html suppressHydrationWarning>`),
`app/styles/variables.css` (`--gold-contrast`), the four public route files
(theme.css import), `LandingPage.tsx` + `ArcShell.tsx` (the mount).

## Context

The site is dark-first by art direction. The owner asked for a light mode
reachable from a control near the bottom-right rail, with two specific
requirements: **the rails become Latent Night**, and **the particle system
inverts** — today it mixes Tensor Gold with Semantic Dawn cream over black;
in light it should mix Tensor Gold with near-black night dust over parchment.

Sigil already ships the mechanism (`05_sigil.thoughtform`): a class on
`<html>`, one token override block, a pre-paint script, `localStorage`. What
does not port is everything downstream of the tokens — Sigil has no WebGL, and
its one canvas painter (`RunicRain`) is a documented light-mode bug because it
hardcodes its gold.

A full sweep sized the real problem:

- **The DOM/CSS side is small.** The prototype HTML's `<style>` never reaches
  production (`scopeCss.ts` computes `scopedCss`; nothing consumes it), so
  there is ONE CSS surface: the `globals.css` @import run plus five route
  sheets. `landing.css` is already ~88 % tokenized (1388 `var()` against 189
  raw `rgba`). Flipping `--void` / `--dawn` / `--gold` inverts most of the
  page, including all seventeen CelestialConnector shapes, `PhaseGlyphSvg`,
  `BrandmarkGlyph` and `ServicesOrbitMap` for free.
- **The WebGL side is the long tail, and it is a BLENDING problem before it
  is a color problem.** ~25 corridor materials use `THREE.AdditiveBlending`,
  tuned over black. Additive over parchment cannot draw a dark particle at
  all — it can only lighten. So "invert the particles" means switching those
  materials to normal blending in light mode and re-deriving alphas, not
  swapping constants.
- **Two 2D canvas bakes** (`ServicesCardRing`, `arc-cases/caseCardBake`) carry
  ~110 hardcoded literals and cache their `CanvasTexture`s.

## Decision

### 1. The channel is an ATTRIBUTE, and dark is its ABSENCE

`data-theme="light"` on `<html>`, or no attribute at all. Never
`data-theme="dark"`.

This is not stylistic. Eleven inner elements already carry a hardcoded
`data-theme="dark"` — `LandingPage.tsx:521`, `ArcShell.tsx:77`,
`HomeV2Page.tsx:37` and seven test shells. Every one of them is **inert**: the
only `[data-theme]` selector in any CSS lives in the unserved
`public/prototypes/v7/tokens.css`. Keeping dark as the unqualified `:root`
default means those markers stay inert, none of them has to change (several
are byte-pinned by the v7-parse tests), and a dark session's DOM is
byte-identical to the pre-ADR site.

Two bans follow, both recorded at the top of `theme.css`:

- **No `[data-theme="dark"]` selectors** — they would double-match the inert
  inner markers and fire in the wrong subtree.
- **No `theme-*` classes.** The landing root div's live className _is_
  `theme-instrument density-comfortable`, and `landing.css:7945-7975` carries
  inert `body.theme-instrument` / `body.theme-latent` ambience rules that stay
  dead only because `<body>` never receives the class. A class-based theme
  would arm that family.

### 2. Two transports, one synchronous writer

CSS reads the attribute. WebGL cannot — `getComputedStyle` per frame is
exactly what the `corridorDissipateRef` perf pass removed (a style read there
invalidated ~1.7k elements per write). So the mode also travels through
`lib/theme/themeModeRef.ts`, a three-free module ref in the shape of
`corridorDissipateRef`, including its self-heal: `readThemeMode()` falls back
to the pre-paint attribute while `version === 0`, so a painter mounted before
the store hydrates does not show dark for a frame on a light reload.

`useThemeStore.setMode` is the single writer, and its order is the contract:

1. `themeModeRef` — a painter rAF racing this task must not read stale;
2. the `<html>` attribute — the CSS channel;
3. `localStorage` (wrapped: a blocked store must never block the flip);
4. the zustand notify.

All four in ONE synchronous task, so the style recalc from (2) and the uniform
writes driven by (1) land in the **same rendered frame**. Never defer a step
into an effect — a one-frame CSS/GL tear is the failure this prevents.

The flip is a HARD CUT. `material.blending` is discrete, `CanvasTexture`s
cannot lerp without double-baking, and a WebGL tween would tear against the
CSS flip. There is also no document-wide color transition: a
`* { transition: color }` over ~1.7k elements is the same recalc storm the
perf pass eliminated.

### 3. Gold splits by ROLE, not by surface type

Owner decision, 2026-08-01, and it follows the design system's
mode-independence law ("only the environment changes; gold adapts its value
for contrast but keeps its role"):

- **DOM / text / chrome gold darkens** to `#9A7A2E` in light. `#CAA554` on
  parchment is ~2.2:1 — unusable as type.
- **WebGL particle and glow golds stay luminous** (`#CAA554` / `#B08B42`).
  They are light emitters, not type, and darkening them would cost the field
  its glow.
- **The 2D bakes follow the DOM family**, because they are chrome and type
  rendered into a texture, and they sit at a visible seam with DOM chrome.

`--gold-contrast` is introduced for text printed ON a gold fill. Its dark
value is byte-equal to `--void`, so migrating a `color: var(--void)` site to
it is a no-op in dark, while surviving the flip (where `--void` becomes
parchment and would land ~3:1 on the darkened gold). This is Sigil's
"void-as-text-on-gold" failure class, fixed before it happens.

### 4. The ink ramp is asymmetric on purpose

Dark ink on parchment reads lighter than light text on void at the same alpha,
so the top steps are pushed up (.7→.88, .5→.62, .4→.5, .3→.4 — proven on
Sigil) while **steps ≤.15 are unchanged**: those are hairlines and washes, and
boosting them makes the page read ruled.

### 5. The hero stays a dark artifact

`/images/Gateway_v1b.webp` is a dark raster and the LCP element; no token can
recolor it. Rather than commission a second asset or attempt a filter, light
mode **frames** it: `.hero` re-pins the dark ramp for its own subtree, so the
hero renders pixel-identically in both themes and reads as a window into the
void at the top of a parchment page. Its `rgba(5,4,3,…)` scrims scrim a
still-dark image and are therefore correct untouched.

### 6. The toggle mounts OUTSIDE `.hud`, and owns its own state

Placement: the bottom-right chrome band, **inboard of the `--br` corner
bracket**, pairing with the ADR-043 bottom-left wordmark — one chrome band, a
mark at each end. Not inside `.hud__rail--r`, for two hard reasons: the rails
carry the ADR-031 U16 hero-curtain `clip-path` (a control there is invisible
for the whole hero, then pops in), and the rail's terminal 100 % tick is
byte-pinned by `tests/lib/rail-manifest.test.ts`.

So it is a fixed `.theme-toggle-overlay` at z 60 outside `.hud` — the
`.hud-nav-overlay` precedent, which is curtain-exempt by design.

**All theme state lives in the leaf.** `LandingPage` owns a
`dangerouslySetInnerHTML` body with nested `createRoot`s inside it; a
LandingPage re-render re-applies that markup and silently orphans them (the
services cards vanish with no error). LandingPage only renders the toggle
behind a build-time const — same rationale as `CelestialEditorGate`.

In light mode the control still has to read over the dark hero raster for the
first viewport, so it carries a parchment chip backplate — structural, with no
scroll coupling and no new writer.

### 7. Scope: public routes only, dark default

`theme.css` is imported by the four public route files (`/`,
`/claude-workshop`, `/arcs`, `/arcs/[slug]`), LAST in each, and **never** from
`globals.css`. That keeps the documented postcss-import ordering incident
untouched, and it is what scopes the theme: admin, astrogation and `/test/*`
never load a light rule even though the attribute is global.

First visit is DARK. `prefers-color-scheme` is deliberately not consulted
(owner, 2026-08-01); honoring it later is a one-line change to the bootstrap
script. `?theme=light|dark` overrides for QA and Playwright and is never
persisted — adopting an override must not write it to storage, which is why
`hydrateFromDom()` touches state and the ref only.

### 8. RGB TRIPLES carry the one-off alphas (Phase 1)

The sweep hit a wall the plan had not sized: most literals use alphas the
ramps have no step for — gold at .55 / .45 / .18 / .32, void at .62 / .72 /
.85, and so on. Adding a token per alpha would have meant ~15 new steps,
which violates the design system's "use the nearest step, do not invent
`dawn-20`" law and would still miss the next one-off.

Instead the palette gained RGB triples — `--gold-rgb`, `--dawn-rgb`,
`--dawn-alt-rgb`, `--void-rgb`, `--void-deep-rgb`, `--atreides-rgb`,
`--atreides-mid-rgb`. `rgba(var(--gold-rgb), 0.55)` computes byte-identically
to the literal it replaced and picks up the light value for free. **455
literals across the four route sheets** now flow through them, and the ramps
keep their role for the common steps (including the deliberate asymmetric
light bump, which the triples must not flatten — theme.css sets the ramp
explicitly and wins).

Three traps, all hit for real and now pinned by
`tests/lib/theme-css-sweep.test.ts`:

- **Self-reference is silent death.** A hex→token pass turns
  `.services-plate-cluster { --gold: #caa554 }` into `--gold: var(--gold)`,
  a CSS dependency cycle: the property becomes guaranteed-invalid and every
  consumer falls back to inherit. Three of these landed (two atreides, one
  gold) and nothing in lint or typecheck saw them — only a computed-style
  diff did.
- **`--void` as text on a gold fill** is Sigil's documented failure class and
  it was live here in four places (`.btn--solid`, `.approach__cta`, the
  casefile's inverse-video row, the dead tweaks segment). They now use
  `--gold-contrast`. `color: var(--void)` on a `--dawn` fill is NOT the same
  bug — that pair inverts to parchment-on-ink and stays correct.
- **Custom-property declarations need sweeping too.** Skipping `--x: <literal>`
  lines left the casefile's and services' LOCAL palettes dark while the root
  ramps flipped.

**Verification method (adopt this for Phases 2–4).** A computed-style
fingerprint — hash every color-bearing property across all ~1681 styled
elements — taken before the sweep and re-taken after each pass. It caught the
cycle bug that review missed, and it proves byte-identity far more strongly
than reading a diff. Dark hash `-279327076` held across all 455 conversions.

Two categories are deliberately NOT swept and belong to Phase 2: colors
written as **inline styles by JS** (`.home-v2-stack-label__*`, from
`artifactGeom`'s `*_CSS` role tiers) and everything inside the WebGL canvas.

## Consequences

- Dark stays byte-identical throughout the project. The sweep's Lane A only
  tokenizes when the dark computed value is byte-exact; anything else becomes
  a light-sheet override (Lane B) or is left alone (Lane 0 — photo scrims over
  kept-dark imagery, mask colors, admin-scoped rules). `test:visual:update` is
  banned for dark baselines for the duration.
- The 235-vs-236 dawn drift (both families live: 573 and 159 occurrences) is
  NOT normalized in dark — that would be a pixel change for cosmetic gain.
  Both map to identical ink values in light, so the drift self-heals there.
- `--gold-bright`, `--surface-1` and `--dawn-45` are used-but-undefined today
  and get definitions in the LIGHT block only. Defining them in dark would
  change dark: `--gold-bright` has two different fallbacks at two sites, and
  `--surface-1`'s fallback carries alpha 0.94.
- `.services-plate-cluster` re-declares tokens ON the element, which shadows
  any html-level override — it needs (and has) a scoped re-override. Any
  future element-level token block needs the same treatment; grep for
  `--void:` / `--dawn:` / `--gold:` re-declarations when sweeping a sheet.
- `arcs.css`'s `var(--void, #0a0908)` inline fallbacks do NOT defeat the flip:
  a fallback applies only when the property is undefined, and the light block
  defines it.
- Phase 2 will add identity-default uniforms (`uTintB`, `uMixRatio`,
  `uHeadGain`, per-painter `alphaGain`) so the dark path stays byte-identical
  through the WebGL work, and untuned painters will ship with
  `alphaGain = 0` — a quieter light corridor is acceptable, a broken one is
  not.

## Rollback

`THEME_TOGGLE = false`. The bootstrap never injects, the toggle never mounts,
`<html>` never carries the attribute, and every `theme.css` light selector is
unmatched (the sheet still ships, inert). The dark site is byte-identical.
