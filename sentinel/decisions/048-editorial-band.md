# ADR-048: Editorial band — the shared horizontal frame for section text

**Date:** 2026-07-17
**Status:** Accepted
**Scope:** `components/landing/v7/landing.css` (`:root` band tokens,
`--rail-inset` re-derivation, voidwalker parity comment),
`components/landing/home-v2/services/services.css` (masthead comment,
lead cap), `components/landing/home-v2/about/about-stage.css` (comment),
`components/landing/home-v2/home-v2.css` (Arc split cap → token).
Amends ADR-044 (masthead horizontal geometry) and ADR-045 (rail parity
formula). Complements `--station-title-top` (ADR-044 round 2), which
systemized the vertical axis the same way.

## Context

The owner compared the services masthead against linear.app (2026-07-16):
Linear's section headers feel consistent because everything keys to one
centered, width-capped content container — title left, paragraph right,
shared top line, stable margins. Thoughtform's editorial text instead sat
at a **two-layer, uncapped, viewport-proportional inset**: station padding
(`--hud-content-inset` ≈ `--hud-margin + --hud-rail-width + clamp(24px,3vw,56px)`)
plus `--rail-inset: calc(var(--hud-margin) + 8vw)`. Both layers grow with
viewport width and nothing caps the band, so the effective side inset
drifted ~218px → ~451px across 1024 → 2560 viewports with no stable
proportion, and the title↔paragraph gap ballooned on wide screens while
the paragraph crowded the card ring on laptops.

The vertical axis was already systemized (`--station-title-top`, one token
shared by the corridor station heads and the masthead). This ADR does the
same for the horizontal axis.

## Decision

1. **Band tokens** (landing.css `:root`, beside the HUD geometry tokens):

   ```css
   --band-max: 1200px;
   --band-pull: 0px;
   --band-margin: max(
     var(--hud-content-inset),
     calc(var(--hud-content-inset) + var(--band-pull)),
     calc((100vw - var(--band-max)) / 2)
   );
   ```

   `--band-margin` is the viewport-edge → text-edge distance for every
   section-level editorial column. Below the cap crossover (~1503px at
   `--band-pull: 0`) it equals `--hud-content-inset` — the hero headline's
   left edge, i.e. **one shared content edge across the whole journey**.
   Above the crossover the band pins at `--band-max`, centered, so margins
   grow symmetrically instead of drifting open-ended. `1200px` matches the
   Arc split-cartouche cap and the legacy `--content-max-width`.

2. **`--rail-inset` is re-derived as the band remainder**:

   ```css
   --rail-inset: calc(var(--band-margin) - var(--hud-content-inset));
   ```

   Its documented meaning is preserved — "column pull inboard of the
   station content box; effective viewport inset = station padding +
   rail-inset" — but the sum is now exactly `--band-margin` by
   construction: capped and chrome-true instead of the open-ended 8vw.
   All three consumers moved in lockstep with **zero consumer-site
   edits**: the services masthead (`--masthead-inset`), the `#about`
   deck-flip grid, and the static `.voidwalker` grid (≥961px-scoped).

3. **Knob semantics.** `--band-pull` = a fixed extra pull inboard of the
   content edge below the crossover (0 = flush with the hero edge, the
   owner's pick; raising it also raises the crossover — e.g. 100px moves
   it to ~2004px). `--band-max` = the ultrawide lever — raise to
   1320/1440 if 2560-class screens read pinched. **Never retune ring math
   for clearance** (ADR-044: `CENTER_Y_OFFSET` is the vertical lever;
   `--band-max` is now the horizontal one). The first `max()` arm floors
   the band at the content box so content can never cross outboard toward
   the rail chrome (ADR-031: content aligns to rails, never the reverse),
   even at a negative pull.

4. **Band-relative lead cap.** `.services-masthead__lead` `max-width:
40vw` → `min(40vw, calc(var(--band-max, 1200px) * 0.52))`. 40vw was
   tuned for the uncapped band; at 2560 it is 1024px and could cross the
   intro column inside a 1200px band. 624px keeps ≥160px of gutter
   against the intro's 42ch worst case; no visual change with current
   copy. The intro cap `min(42ch, 34vw)` composes at every width
   (worst-case lead+intro = 1079px ≤ 1200px) and is unchanged.

5. **The services.css fallback calc is deliberately untouched.**
   `--masthead-inset: var(--rail-inset, calc(var(--hud-margin, 54px) + 8vw))`
   keeps the ORIGINAL pre-band formula as its fallback: it fires only
   where landing.css's `:root` tokens are absent (standalone harnesses);
   production and `/test/services-wordmark` both load landing.css and
   always resolve the token. Do not "simplify" or zero it.

6. **Arc split cap consolidated** (pure token dedup, zero visual change):
   `.home-v2-station-header--split` `width: min(92vw, 1200px)` →
   `min(92vw, var(--band-max, 1200px))`. The 920px caption-card/console
   caps are a different, deliberate cap — not banded.

## Expected geometry (verification table)

`--band-margin` = viewport-left of the masthead lead / about grid
(hero-edge-aligned below the ~1503px crossover):

| Viewport  | band-margin | old effective inset | Δ    |
| --------- | ----------- | ------------------- | ---- |
| 1024×768  | 107.5       | 218                 | −111 |
| 1280×800  | 129         | 267                 | −138 |
| 1440×900  | 145         | 301                 | −156 |
| 1680×1050 | 240         | 351                 | −111 |
| 1920×1080 | 360         | 400                 | −40  |
| 1999×1080 | 399.5       | 406                 | −6   |
| 2560×1440 | 680         | 451                 | +229 |

At the owner's 1999px reference width the title barely moves (−6px) while
the paragraph pulls ~300px inboard to mirror it — the system reproduces
the Linear composition at the reference width and stops the drift on both
sides of it. Below the crossover the columns pull outward (more measure,
paragraph moves AWAY from the centered ring — the ADR-044 MacBook
complaint class improves). ≤960px nothing changes: the masthead goes
static in-flow, station padding flips to 32px, voidwalker parity is
≥961-scoped.

## Alternatives rejected

- **Per-section fixed margins** — re-drifts the moment sections are tuned
  independently; the whole point is one token.
- **Structural grid band element** (single wrapper grid instead of two
  absolutely-pinned columns) — JSX churn in the render-stability-sensitive
  LandingPage tree; the masthead reveal controller walks specific children
  (scramble targets, `[data-live]` cursor, the intro's corner-cross
  siblings); and the token moves both about grids in lockstep for free. The
  one real grid advantage — intrinsic overlap-impossibility — is covered by
  the band-relative lead cap.
- **Capping `--hud-content-inset` itself** — moves the rail chrome; the
  rails/ticks are load-bearing HUD identity (ADR-031) and content aligns to
  them, never the reverse.
- **Banding the hero** — considered and declined: the hero is chrome-welded
  left-anchored by design ("Hero Omega"); below the crossover its edge
  already IS the band edge, and above it the divergence is the same
  archetype split Linear itself uses (hero vs content sections).

## Consequences

- One number answers "where does section text sit horizontally" at any
  width, the same way `--station-title-top` answers it vertically. Future
  stations compose the same two layers (station padding + `--rail-inset`,
  the ADR-045 contract — the band IS that composition, now capped) and
  land on the band automatically.
- At 2560 the intro plate moves ~229px toward the centered instrument.
  No interaction risk (masthead is `pointer-events: none`); if it reads
  crowded, raise `--band-max` — never ring math.
- The `tests/visual/landing-page.spec.ts` `toHaveScreenshot` suite turned
  out to have NO committed baselines (the snapshots dir was never in git;
  a first local run just writes actuals and exits 1 — pre-existing
  condition, platform-suffixed `-win32` names). The CI Playwright surface
  is the corridor/ring smokes, which pass unchanged. If baselines are
  ever committed, expect the services/about tail + seam shots to carry
  the table's Δ values vs any pre-band captures.
- PRM-desktop asymmetry (pre-existing class, accepted): under
  `prefers-reduced-motion` at >960px the masthead is static full-width
  while `.voidwalker` keeps band margins — the parity already didn't hold
  in that tier; the band only moves where the voidwalker edge sits. Do not
  split the combined media query for this.
- 961–1100 static-fallback tier: voidwalker columns widen ~300→419px each
  (definite-size portrait, nothing distorts).
