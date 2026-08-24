# ADR-075: The arc hero IS the homepage hero — plate, boot, and the curtain seam

- **Status:** Accepted (2026-08-24)
- **Surface:** every `/arcs/[slug]` detail hero · `components/landing/v7/hooks/useHeroBoot.ts` (extracted, shared) · `components/arcs/ArcHero.tsx` · `ArcShell` · `useArcScroll` · `arcs.css` · `ArcDef.hero.plate` · `lib/theme/heroPreload.ts`
- **Supersedes:** nothing. It PORTS ADR-022 v8's curtain to the arcs and adopts ADR-058 U2's plate delivery + ADR-060's glitch there; ADR-073's hero top band narrows to the arcs that still need it.
- **Prior art:** ADR-008 (the paint stack and the shield rules) · ADR-022 v8 (the seam) · ADR-039 (LCP discipline) · ADR-052/057 (the arc chassis and the beat grammar) · ADR-058 U2 (the two plates) · ADR-060 (the swap glitch) · ADR-063 U2 (the gold ramp) · ADR-073 (the header and its band)
- **Rules:** [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md)

## Context

The owner asked for the arc pages' hero to **be** the homepage's — the same
key visual, the same boot, and "the parallax effect in the second section" —
and for the hero copy to be concise. Three findings shaped what that means:

**1. The seam is the inverse of the obvious reading.** ADR-022 **v8** is
live (v7 is superseded): the landing's hero is `position: relative;
z-index: 4; height: 100vh` and **scrolls straight up and off**, while the
second section is held **still** (`html[data-corridor-entry="1"]` →
`.home-v2-stage__sticky { position: fixed; top: 0 }`). The reader sees a
curtain lift off a stationary panel. An arc held nothing — hero and beat 1
both scrolled, so there was no reveal at all.

**2. The arcs' light-mode hero was already the homepage's plate, by
accident.** `theme.css` swaps the key visual with a **global** rule on
`.hero__bg` (paint `Gateway_v2-light.webp`, hide the `<img>`), because on
the landing there is only one hero. Measured live at
`/arcs/portfolio?theme=light` before this pass: the computed background was
the Gateway plate while the arc's own `Thoughtform_Key Visual_14d.webp` was
`display: none`. So every arc showed its own plate in dark and the
LANDING's in light, and nothing on the surface said so.

**3. Half the contract was already ported.** `useArcScroll` writes
`--hero-cover` (the same smootherstep), `--hero-lift` (linear) and `--py`;
`ArcHero` already reuses `.hero`, `.hero__bg`, `.hero__content` and the
type. What was missing: the `<picture>`, the glitch, the boot, the
`visibility` release, and the seam.

## Decision

### 1. The curtain seam — ported, terminal arcs only

The hero is unchanged: relative, z 4, in flow, 100vh. While any of the card
still covers the viewport, `useArcScroll` sets `data-arc-entry` on `<html>`
and the FIRST beat's `.arc-plane` is fixed to the viewport; past that it
returns to flow and the stage's own sticky pin takes over.

⚠ **Freeze the PLANE, never the stage.** `.arc-stage` is what gives the
beat its flow height, and `useArcTerminalMotion` caches
`beat.topDoc = rect.top + scrollY`, derives `pinStartY` from it and writes
`--arc-stage-pin` off `stageH`. Take the stage out of flow and every
downstream beat shifts ~100svh and every clock desyncs. The plane carries
only content, so fixing it leaves the section's height untouched — the same
split the landing makes when it fixes `.home-v2-stage__sticky` and never
`.home-v2-stage`.

⚠ **The fixed cell replicates the stage's own box.** The stage is a centred
grid with `--arc-stage-pad` block padding, so a plane pinned to `top: 0`
alone would sit a padding's worth off the one it hands over to. Measured
across the handoff: the band's centre moves **0px**.

⚠ **`left: 50%; width: 100vw; margin-left: -50vw`, never `inset: 0`** — the
landing recorded that bug (a fixed box at `left: 0` takes the
scrollbar-excluded width and jumps sideways at the seam).

⚠ **`:not([data-arc-tall])` is the guard, and it maintains itself** — the
controller writes that attribute per viewport. A stage taller than the
viewport centres its plane in a box bigger than the fixed cell, so the two
positions could not agree; a tall first beat keeps today's behaviour.

⚠ **The release query must repeat the freeze's selector, `:not()`
included.** A media query adds no specificity, so the first cut's release
was (0,6,1) against the freeze's (0,7,1) and **silently lost** — measured
`position: fixed` under reduced motion and at 430px before the selectors
were tied.

The flag is written **synchronously in the scroll handler, not in the
rAF** — it switches a layer mode, and one frame of lag shows a gap at the
handoff (the landing's `syncCorridorEntryState` does the same, for the same
reason). `writeHeroCurtainLift` is ported with it: `.hero` is z 4 over
`.arc-section`'s z 1, so off-screen is not enough once a held panel shares
the viewport with the card.

Measured at 1440×800: the plane holds `top: 0` while the card's top runs
0 → −784, `--hero-lift` tracks 1:1, and the release lands at exactly 800.

**Left in flow deliberately.** A sticky hero was the simpler build and is
what "parallax" usually means, but it is ADR-022's own rejected v7 — and it
would freeze `--py`, because `useArcScroll` derives the drift from a live
rect that a pinned element makes constant. The faithful mechanic is also
the one that keeps the plate drifting.

### 2. The plate — declared, not inherited

`ArcDef.hero.plate?: "gateway"`. With it (the portfolio) `ArcHero` renders
the landing's delivery verbatim — an AVIF `<source>` over the WebP `<img>`,
`loading="lazy"` so the light theme never fetches the dark plate — and the
global light rule is now _correct_ rather than accidental. Without it the
hero is marked `data-plate="own"` and `arcs.css` hands the image back in
light. Scoped in **arcs.css**, never by editing theme.css:
`theme-css-sweep.test.ts` pins those selector strings and the landing still
wants them.

The glitch (ADR-060) mounts in `ArcShell` for gateway heroes only. The arc
route drops its static `<link rel="preload">` for them and
`/arcs/portfolio` joins `HERO_ROUTES` instead — a static link always names
the dark plate, because the preload scanner runs before the script that
knows the theme. Verified: dark preloads the AVIF, light preloads the light
WebP.

### 3. The boot — extracted, shared

`useHeroBoot` is `LandingPage`'s hero boot, lifted with its constants and
its ADR-039 discipline. ONE generalisation: the line collector recurses, so
a headline carrying the arcs' `<em>` decodes **both** halves instead of
leaving the gold one resolved. `tests/lib/hero-boot.test.tsx` pins both
shapes — the landing's `<br>` split unchanged, the arc's `<em>` preserved
with its span nested inside it.

### 4. The copy, and two contrast findings

The lede goes from ~280 characters to **110** — the homepage's own register
(a short headline over ~110). Measured after the plate swap, sampling the
composited screenshot around each ink box at 1280×720 and 1440×800:

|                 | before    | after                |
| --------------- | --------- | -------------------- |
| header links    | 6.1–7.2:1 | **15:1** both themes |
| headline        | —         | **15:1** both themes |
| eyebrow (light) | 1.84:1    | **5.76:1**           |
| eyebrow (dark)  | 2.86:1    | **8.3:1**            |

Two things came out of measuring rather than assuming:

- **ADR-073's top band narrows to `[data-plate="own"]`.** A gateway hero is
  already dark where the header sits (15.7:1 with no band), and in light
  the band is the wrong instrument twice over: theme.css re-pins its
  `--void-deep-rgb` to the PAGE colour, so it washed parchment across the
  top and drove the eyebrow to 1.84:1. The band exists for the near-white
  key visual; it goes where that visual goes.
- **The eyebrow moves onto the gold ramp's INK rung** (ADR-063 U2). One
  saturated gold cannot serve a mark and small text across a ground flip;
  `--gold-ink` inverts with the ground and is byte-equal to the shipped
  value in dark.

## Consequences

- ADR-008's paint-stack table gains the arc rows and its stale hero row is
  corrected — it still called the live hero `sticky; z:1`.
- The seam ships on terminal arcs (the portfolio and both `-v2` cuts). The
  two v1 client decks keep today's behaviour; they gain only the light-mode
  plate fix.
- ⚠ **A measured contrast defect is left open, and it is not new.** The
  keynote's own hero copy reads **2.5:1** (headline) and **2.0:1** (lede)
  in DARK, because that key visual is near-white behind the copy column and
  the production overlay's left gradient does not reach far enough. It
  predates this pass and belongs to those decks' own hero, not to the
  portfolio's — but it is now measured, so it is written down rather than
  left to be rediscovered.

## Verification

`npm run verify` (1012 unit tests) · `arc-portfolio-smoke` 7/7 desktop,
including the seam case whose two assertions ARE the parallax (the card has
moved a known distance, the panel has not moved at all) and the plate case
that pins the bug this fixes · `arc-terminal-smoke` · the landing's own
hero cases, including the 18 % curtain screenshot.

⚠ Two `landing-page.spec.ts` corridor snapshots fail on this tree and are
**not** from this pass: `#voidwalker` (ADR-074, committed while this work
was in progress) adds a station to the landing, and those two assertions
scroll by PERCENTAGE, so 40 % now lands at a different corridor depth.
Their baselines are from 2026-08-02 and ADR-074's commits never updated
them. Re-baselining a corridor frame is a judgment about what the corridor
should look like, so it stays with that work.
