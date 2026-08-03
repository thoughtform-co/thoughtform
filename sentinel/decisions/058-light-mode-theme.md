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

> **REVERSED 2026-08-02 — see Update 1. The darkening lasted one day; gold
> is now `#CAA554` in BOTH modes.** The bullets above are kept because the
> reasoning is still the argument AGAINST the current value, and whoever
> revisits this needs to see what it costs. The WebGL exemption survives
> unchanged — it just no longer describes a split, since both families now
> hold the same value.

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

### 5. The hero stays a dark artifact — ⚠ REVERSED BY UPDATE 2

> This section is kept for the reasoning, which was sound and is worth
> reading before touching the hero. Its conclusion no longer holds: there
> is a light cut of the artwork now, the island below is deleted, and the
> hero is an ordinary part of the parchment page. See Update 2.

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

## Update 1 — gold stops darkening, and the marker inverts everywhere (2026-08-02, owner)

Two changes to the light cascade, both DOM-only. Dark stays byte-identical:
every rule is `html[data-theme="light"]`-scoped and no dark literal moved.

### 1. `--gold` is `#CAA554` in light, same as dark

Decision 3 above darkened it to `#9A7A2E`. That value was derived from one
role — gold as small text — and measuring all three roles reversed it:

| gold's role                             | `#9A7A2E` | `#CAA554` |
| --------------------------------------- | --------- | --------- |
| gold as SMALL TEXT on parchment         | 3.18:1    | 1.83:1    |
| INK on a gold FILL (directory row, CTA) | 4.74:1    | 8.23:1    |
| PARCHMENT on a gold fill (chips)        | 3.18:1    | 1.83:1    |

Two of three improve, and the darker value also read olive-drab at display
size where gold is doing brand work, not wayfinding. It additionally put the
DOM out of step with the WebGL golds — which stayed luminous by design — so
the services heading and the orbit rings were visibly different colours in
the same frame. Tensor makes the instrument one colour again.

**The accepted cost, recorded so nobody re-derives it as a bug:** gold as
small mono chrome (`4 ITEMS`, `IN BUILD`, `ON RECORD`, the contact email)
now sits at 1.83:1. That is exactly what the darkening bought, and it is
the standing argument for revisiting this. **The fix, if it is ever taken,
is a SECOND token for gold-as-text — not re-darkening `--gold`**, which
would drag the fills and the emphasis marker back down with it.

Sites moved: the `html[data-theme="light"]` ramp + `--gold-rgb` +
`--gold-05` + `--gold-bright`, the `.services-plate-cluster` scoped block,
the `.gateway__stage` radial, and `ServicesCardRing`'s `FACE_LIGHT` /
`DRAWER_LIGHT` / tray-wall literals. The `.hero` dark island is untouched
(it re-pins the whole dark ramp and always did).

### 2. The washed marker inverts on EVERY surface, and its fill is solid

The `.fl-brief__body em` inversion (text → ink, wash carries the emphasis)
was correct and was only ever applied to the casefile brief. The corridor
caption runs the identical recipe through three more selectors and failed
identically in all of them. All four now share one rule.

Two rules govern which selectors join:

- **Only markers with a WASH invert.** Gold text with nothing behind it
  (`__title em`, `.home-v2-copy-body em`) is wayfinding at display size and
  keeps its gold. Verified: `BUILD` / `NAVIGATE` still compute gold on a
  transparent background.
- **Both caption paths move together** — the plain `<em>` (reduced-motion /
  fallback) and the per-character `--em` spans the typewriter splits it
  into — or the marker changes colour when reduced motion is on.

And the fill is now `var(--gold)`, **not an alpha of it**. An alpha wash is
the dark recipe's logic, where gold is a glow read against near-black.
Composited over parchment, `rgba(--gold-rgb, 0.22)` resolves to `#E4D5B9` —
a sand tint that reads as a smudge rather than a mark. Solid gold is what a
highlighter is on paper, and it is the role where gold measures best
(8.2:1 with ink, against 2.7:1 on the old wash).

**Known cosmetic gap:** the typewriter path carries no horizontal padding
(it would gap the per-char backgrounds into a dashed bar) while the brief
and plain `<em>` carry `0.16em`. Invisible at 22% alpha; at full strength
the caption mark sits flush to its text while the brief's has breathing
room. Fixing it needs run-boundary selectors (`:has()` + `:not(x + x)`) to
extend only the first and last character outward — deliberately not taken.

## Update 2 — the hero gets a light cut (2026-08-03, owner)

> _"For the light mode, I added this hero section image… you may need to
> compress it without losing the quality and resolution."_

**§5 is reversed.** The reason it existed was "no token can recolor a
raster" — true, and the answer was to frame the dark artwork instead. The
owner made a second raster, so the premise is gone.

### The island is deleted

`html[data-theme="light"] .hero` re-pinned the entire dark palette — both
ramps and every RGB triple — so the hero rendered pixel-identically in both
themes. It is gone, and the hero is now an ordinary part of the parchment
page: ink headline and copy, ink nav, gold CTA on `--gold-contrast`.

The scrims needed no rule. `.hero__video__overlay` rides
`rgba(var(--void-deep-rgb), …)`, which is the light triple once the island
stops overriding it, so the gradients wash the artwork in deep parchment
instead of black — correct for free.

Two things that existed _because_ of §5 move with it:

- **The wordmark swap is UNGATED.** It required `.is-collapsed` (the
  ADR-043 dock at 50vh) because the mark's home position sat on the dark
  hero and the Night cut's ink half would have vanished there. On
  parchment the gate is not merely unnecessary, it is wrong — it would
  print the cream Dual cut onto the light artwork for the whole first
  viewport. The rule the gate encoded still holds; the answer changed.
- **The toggle's parchment chip is now parchment on parchment.** Kept — it
  still separates the control from the artwork — but its comment no longer
  claims a dark backing.

**A bug heals for free:** the top-right nav readout has no light
accommodation at all and had been printing ink over the dark hero. It is
correct now without a rule.

### Two plates, two codecs — measured, not chosen

|       | file                    | bytes  | why                |
| ----- | ----------------------- | ------ | ------------------ |
| dark  | `Gateway_v1b.avif`      | 346 kB | was an 835 kB WebP |
| light | `Gateway_v2-light.webp` | 435 kB | was a 7.0 MB PNG   |

The asymmetry is the finding. Both plates are the same painterly artwork
with the same film grain, but grain on near-black hides AVIF's block
artifacts and grain on parchment does not. At q50 the light plate's
upper-left wash breaks into visible rectangular tone blocks (max error 101
against the master, vs WebP q85's 26) and it is still visible at q68 —
which costs 381 kB, so there is no saving to trade for the damage. The dark
plate at AVIF q50 is indistinguishable from its master down to the ring's
hatching and the micro-annotations. **Do not harmonise them onto one
format.** `scripts/hero-plates/prepare.mjs` records the numbers.

This also lands the re-encode the perf notes had parked "awaiting Vince".

### Neither theme fetches the other's plate

That is the whole load design, and each half of it is load-bearing:

- The light plate is a **CSS background** on `.hero__bg`. A background is
  only fetched when its rule matches, so dark never touches it.
- The dark plate stays a `<picture>` — AVIF with the WebP as fallback,
  because this is the LCP element and Edge only got AVIF in 121 — carrying
  **`loading="lazy"`**. In light the img is `display: none`, so it has no
  box, never intersects, and is never fetched.
- The preload is **injected by script**, not a static `<link>`. The preload
  scanner runs before any script, so a server-rendered link would always
  pull the dark plate and a light visitor would pay for both. It is typed
  (`image/avif`), so a browser that cannot decode AVIF skips the preload
  and takes the fallback rather than downloading both.
- It sits **outside the `THEME_TOGGLE` gate** in `app/layout.tsx`. That
  flag is this ADR's rollback; inside the gate, rolling back would silently
  drop the hero preload on the only path left.

Verified on a clean tab: dark fetches 346 kB and no WebP; light fetches
435 kB and no dark plate at all. ⚠ Measure this in a FRESH tab — a tab that
has visited the other theme reports the other plate as a memory-cache hit,
with `initiatorType: "link"`, which reads exactly like a real second
preload. It cost a round of chasing.

Given up knowingly: no-JS clients and non-executing crawlers get no preload
(the img still loads at layout; it is `alt=""` decoration), and client-side
navigations lose the hoisted nav-time preload.

### What is NOT changed

The flip is still the **hard cut** of §2. The glitch (ADR-060) is a canvas
laid over an already-flipped hero, not a transition of the flip itself.

## Rollback

`THEME_TOGGLE = false`. The bootstrap never injects, the toggle never mounts,
`<html>` never carries the attribute, and every `theme.css` light selector is
unmatched (the sheet still ships, inert). The dark site is byte-identical
apart from the hero plate, which is now AVIF for everyone — that half is
deliberately outside the flag, and reverting it means restoring the `<img
src>` to the WebP.
