---
name: theme-parity
description: Both-themes discipline for thoughtform.co (ADR-058 — dark default, light
  is data-theme="light"). Activates whenever a NEW UI element, class, CSS
  block, canvas painter, or asset lands on a public route, and whenever
  reviewing/finishing such a change. Triggers on adding components or
  classes under components/landing/**, editing casefile.css / services.css
  / home-v2.css / landing.css, adding WebGL painters or shader colors,
  adding public/ imagery or logos, or any request mentioning light mode,
  dark mode, theming, or "looks wrong on Vercel/localhost". The rule it
  enforces — a new element is not DONE until it has been styled AND
  verified in both themes.
---

# Theme parity — every new element ships in both themes

Dark is the default (the ABSENCE of `data-theme`); light is
`html[data-theme="light"]`, flipped pre-paint by the bootstrap in
`app/layout.tsx` and at runtime by `themeStore` (ADR-058). Every visual
element on a public route therefore has TWO renderings, and only one of
them is on your screen while you build. This skill is the discipline that
keeps the other one from shipping broken.

## The law

**A new element is not done until it has a light-mode answer and you have
SEEN both.** Not "tokens should handle it" — checked. The ADR-058 sweep
flipped ~455 declarations through tokens, and everything since ships its
own light rows. The failure mode this skill exists for: an element built
in dark, reviewed in dark, shipped, and discovered washed-out on parchment
by the owner.

## DOM elements — the checklist

1. **Tokens first.** Paint with `var(--gold)`, `var(--dawn)`,
   `var(--void)`, the `--*-rgb` triples and the ramp tokens
   (`--gold-30`, …). A raw hex/rgba is a decision to OWN the light
   variant by hand — allowed, but then step 2 is mandatory.
2. **Alphas do not survive the flip.** Cream at α over near-black keeps
   its contrast; ink at the SAME α over parchment gives most of it away
   (theme.css's opening note: α 0.28 measured 1.86:1 on parchment against
   a comfortable dark-side read). Anything below ~0.6α that must be READ
   needs a light-mode lift row in
   `components/landing/v7/theme.css` — content gets the content-grade
   lift, chrome the chrome lift, and the hierarchy between them is the
   information design: never flatten everything to ink.
3. **Gold splits by ROLE.** Wayfinding gold (labels, active states,
   markers) runs at FULL strength in light — gold tops out ~3.2:1 on
   parchment, so dark's decorative dimming has no headroom there.
   Decorative gold (washes, fills, beds) drops instead.
4. **Emphasis inverts its PARTS, not its meaning.** The gold-wash marker
   (never italics) carries emphasis in the TEXT in dark and in the WASH in
   light — reuse the existing `em` treatment, never a bespoke one.
5. **Element-level token re-declarations shadow the flip.** A block that
   declares `--void:`/`--dawn:`/`--gold:` ON an element needs its own
   scoped light override (the `.services-plate-cluster` precedent) — grep
   for re-declarations when adding one.
6. **Run the sweep test:** `npx vitest run tests/lib/theme-css-sweep.test.ts`
   (no self-referential custom props; no void-ink text on gold fills).

## WebGL / canvas painters

CSS never reaches inside a canvas. Painters hold colors as module
constants and uniforms, so every painter needs a value PER MODE:

- Read the mode via `readThemeMode()` (`lib/theme/themeModeRef`) at
  init — never `getComputedStyle` in a frame path — and subscribe to
  `useThemeStore` for the flip (one imperative `.set()` per flip, no
  React re-render; the `ShellSubstrateGyro` core is the template).
- Scene-level pairs live in `lib/theme/palette.ts` (`DARK_SCENE` /
  `LIGHT_SCENE`). ⚠ The dark column is the shipped constants VERBATIM —
  dark stays byte-identical, pinned by `tests/lib/theme-palette.test.ts`.
- Additive blending can only LIGHTEN — it cannot draw ink on parchment.
  A painter that must read in light needs a normal-blend or erase path
  (the light occluder ERASES via a custom blend instead of painting the
  page color; see `applyCoreTheme`'s docblock for why paint-the-ground
  double-multiplies alpha).

## Assets

**Photography has ONE light recipe — the parchment print.** The WebGL side
is `buildParchmentToneLut` (ServicesCardRing) and the DOM side is the
matching CSS chain in theme.css (`sepia(0.55) saturate(0.88)
brightness(1.1) contrast(0.9)`); they are one recipe in two renderers —
change both or neither. It applies to SERVICE imagery (card faces, mobile
plate photos, the about portrait). It deliberately does NOT apply to
content imagery shown as evidence (casefile stills/films — natural colour,
rules/proof.md) or the hero (dark artifact). Baked photo surfaces re-bake
on the theme store flip (`ringTheme`); remember a raw `data-theme`
attribute write does not notify the store.

Artwork does not retint. A gold/cream asset dissolves on parchment and a
gold/ink one dies on near-black — ship a variant per theme and gate the
swap on WHAT IS ACTUALLY BEHIND IT, not just on the theme: the hero stays
a dark artifact in light mode (ADR-058 §5), so an asset that lives over
the hero swaps only once it leaves it (the bottom-left wordmark gates on
`.is-collapsed` for exactly this). Swap via theme-scoped CSS
(`::after` background — `content: url()` on `<img>` does not replace in
Firefox), never by editing parse-injected prototype markup.

## Verify — both themes, actually rendered

- Fast pass while building: `?theme=light` / `?theme=dark` URL override,
  or flip `document.documentElement.dataset.theme` in the console (delete
  the attribute for dark — dark is the ABSENCE of it).
- The corridor and every WebGL surface need a REAL GPU and real scrolls:
  headed Playwright against localhost, screenshot the beat in both themes
  (the website-screenshot skill's corridor mode, or a small headed
  script). A hidden browser pane composites nothing.
- Localhost and the Vercel deploy run the SAME code — when someone
  reports "wrong on Vercel, fine on localhost", suspect a STALE
  DEPLOY/CACHED CHUNK first (diagnosed 2026-08-02: the "white corridor
  in light" report reproduced on neither once the current deploy was
  actually loaded; production domain ≠ the vercel.app alias — check
  `npx vercel ls` and compare a content fingerprint before hunting a
  code path).
- End-of-change gate: the element seen in BOTH themes at 1440×800, plus
  the sweep test. If it sits inside the casefile, both themes at 1280×720
  too (the binding viewport for that surface).

## Where the doctrine lives

- ADR-058 (`sentinel/decisions/058-light-mode-theme.md`) — channel,
  transports, gold-by-role, ink-ramp asymmetry, scope.
- `components/landing/v7/theme.css` — the light sheet; its comments ARE
  the measured rationale. Add new rows in the matching section.
- `lib/theme/palette.ts` + `lib/theme/themeModeRef.ts` — the GL side.
- `tests/lib/theme-css-sweep.test.ts`, `tests/lib/theme-mode.test.ts`,
  `tests/lib/theme-palette.test.ts` — the mechanical guards.
