---
paths:
  - "app/(marketing)/arcs/**"
  - "components/arcs/**"
  - "lib/arcs/**"
description: Client arc pages — deck pages on the HUD slice
---

# Rule: Client arcs (/arcs)

An "arc page" is a client landing page (a ported deck) — NOT "the Arc"
(the corridor's Navigate → Encode → Build loop). See LANGUAGE.md.

**Read first**

- [ADR-052: Client arcs](../sentinel/decisions/052-client-arcs.md)
- [ADR-057: Terminal motion](../sentinel/decisions/057-arc-terminal-motion.md) — the pinned-beat grammar on the `-v2` cuts
- [ADR-008: Landing v7 background layers](../sentinel/decisions/008-landing-v7-background-layers.md) — the compositing rules the arc shell inherits

**Contracts**

- **One scroll writer per page** (`useArcScroll`, ADR-002). It owns
  `--hero-lift` / `--hero-cover` / `--py` / the wordmark dock / the menu
  gate. Never add a second writer, never write corridor channels
  (`--svc-*`, `data-corridor-*`, `data-active-station`).
- **`--hero-lift` gates the rails.** Detail = written from scroll;
  overview = static `1` on the root. Rails invisible ⇒ check this first.
- **Slice API is read-only.** `sliceV7Sections([])` is consumed as-is; no
  edits to `public/prototypes/v7/**` or `lib/v7-parse/**` from this
  surface, and nothing mounts into the injected hud markup.
- **Compositing:** every section opaque void; `.gateway` stays
  display-none'd; the hero card never fades/transforms (only
  `.hero__content` moves).
- **No three.js / Supabase / `LandingPage` imports** anywhere under
  `components/arcs/` or `lib/arcs/` (landing-performance doctrine).
- **CSS:** everything page-scoped lives in `arcs.css` under `.arc-*`;
  corridor sheets (home-v2.css / services.css) are never imported —
  grammars are copied. Route import order: landing.css first, arcs.css
  LAST.
- **No italics.** Emphasis is `ArcTitle.em` → upright gold; markup inside
  copy strings fails `tests/lib/arcs-registry.test.ts`.
- **Content changes** = edit `lib/arcs/content/*` + registry only; run
  the registry test. New arc = content module + registry entry + assets
  under `public/arcs/<slug>/`.
- **Next 16:** route `params` is a Promise — `await params`.
- Videos: `preload="none"` + poster, never autoplay; no gated `.skill`
  downloads via `public/`.

## Terminal motion (ADR-057) — the `-v2` cuts

Two choreography systems live on this surface, selected by
`ArcDef.motion`. Absent/`"reveal"` = the ADR-052 IO reveal;
`"terminal"` = the pinned-beat grammar.

- **Disjoint by gate, never by discipline.** Above the enhanced tier a
  terminal page never gets `is-arc-js` (v1 CSS inert) and a reveal page
  never gets `data-motion` (terminal CSS inert). The class and the
  observer are added or skipped TOGETHER, so "hidden but never revealed"
  is unreachable. Below the tier a terminal page falls back to the reveal
  path — not to a dead static page.
- **`ARC_TERMINAL_MEDIA` (961px) is THE gate**, shared by the hook, the
  ArcShell split and the CSS release. ⚠ That release is
  `(max-width: 960px)`, NOT the v1 reveal block's 900px — borrowing 900
  leaves 901–960px with sticky beats and no clock writing to them.
- **The writer is still `useArcScroll`.** `useArcTerminalMotion` adds no
  scroll listener; it returns an `onFrame` run as the tail of that rAF,
  reading the `scrollY` its caller already sampled. Offsets are cached at
  mount/resize/ResizeObserver — never a per-frame `getBoundingClientRect`.
  ⚠ **That frame stops the instant the reader stops moving**, so any
  TIME-based condition in it must wake itself (`scheduleSettleCheck`).
  The 180ms re-type settle relied on the next scroll frame and stranded
  the masthead blank FOREVER on scroll-up-and-stop — pinned by
  `tests/visual/arc-terminal-smoke.spec.ts` ("scrolling UP into a beat
  and stopping still types it in").
- **The stage pin is `sticky; top: vh − stageH`** (`--arc-stage-pin`,
  measured by the writer with the same numbers `beatOut` parks on): 0
  for a fitting stage; negative for a tall one, which reads through its
  overflow and then pins on its last, fully visible viewport. Measured:
  a plain `top: 0` pin fits only 15 of 23 sections at 1440×900 and 7 at
  1280×720. ⚠ **Never `bottom: 0`** — sticky-bottom only restrains exit
  through the bottom edge, so past the park it never engages and the
  fold plays on a MOVING stage (shipped once; the reverse smoke caught
  the head sliding 48px). Stage height is content-driven — CSS sizes it,
  JS only records it.
- **Terminal padding is deliberately tight.** Pinned, the transition is
  the breath; padding only steals height from content that must fit. Do
  not restore the v1 flow padding here.
- **THE MASTHEAD LAW (owner, twice — services 2026-07-27, arcs
  2026-08-01): the masthead never moves and never fades, either
  direction.** `data-arc-still` = `opacity: 1; transform: none` — NO
  clock factor; visibility lives in the text. It TYPES in at a
  stationary head (down: immediately at park; up-return: after 180ms
  stillness) and UN-TYPES out (down: smoothed out ≥ 0.30; up: ≥12px of
  upward intent while pinned), with two force-blank truncation guards
  (unpin with text; smoothed out ≥ 0.5, ahead of the iris).
  ⚠ **The masthead leaves LAST** — it tops the LIFO ladder, so it must
  stay readable while the cards fold. Thresholds read the SMOOTHED
  channel, and the ordering `RETYPE < UNTYPE < FORCE_BLANK < iris(0.56)`
  is the contract (unit-pinned); `RETYPE_OUT` stays DERIVED
  (`UNTYPE_OUT * 0.4`). Keying these to the RAW ramp fired ~107px into
  an 888px tail — inside the settle hold, smoothed ≈0.001, nothing else
  moved — and blanked the masthead off a parked, legible section.
  Tall beats sticky-pin the head at `--arc-head-pin` (void-backed;
  content passes beneath). The `close` band is the one exception: types
  once at the page foot, never churns. Never give a head a `--dx`/`--dy`.
- **Decode targets are LEAF spans whose attribute equals their text**,
  each with a `.arc-tdec__ghost` twin, and **the live layer stays
  ABSOLUTE** (`inset: 0` over the in-flow hidden ghost — the
  ServicesMasthead recipe). A grid-stacked live layer contributes
  height, typing then changes layout, scroll anchoring nudges scrollY to
  compensate, and the controller reads the nudges as upward intent —
  the beat churns type ↔ un-type forever (720p, adjacent tall beats).
  Blank IMPERATIVELY on arm — `queueScramble` no-ops when text already
  matches, and a pre-rendered blank breaks hydration. `captionScramble`
  only. Quote interstitial lines TYPE (someone else's voice; the law
  still applies).
- **Rungs stay ≤ 0.56**, the LIFO mirror — the departure offset is derived
  as `0.56 − --ci-off`, so a higher rung would leave before the fold began.
- **The iris trails the panels** (opens at out 0.56) and every inset rests
  NEGATIVE — survey marks overhang their border box. `contain: paint`
  stays banned; the iris lives on `.arc-plane`, never on `.arc-stage`
  (which carries the opaque void).
- **No `backdrop-filter` on arcs.** The stages sit on opaque void, so
  there is nothing to frost and no settled-gate problem to inherit.
- **A `-v2` arc shares its v1 `sections` and `hero` BY REFERENCE**
  (registry-test pinned). Never copy the array; fork a single element with
  `.map()` if one ever has to diverge. Promotion = set `motion` on the v1
  def and delete the v2 module.
- **No motion fields on `ArcSectionBase`** — sections are shared with v1,
  so authoring fields would leak motion into content.

**Verifying terminal motion:** `tests/lib/arc-motion.test.ts` (clocks),
`tests/lib/arc-terminal-markup.test.tsx` (conventions + v1 byte-identity),
`tests/visual/arc-terminal-smoke.spec.ts`. Measure at **1280×720 and
1440×800** — the project's 1440×900 default hides every clipping bug this
content has. Drive REAL stepped scrolls and disable `scroll-behavior:
smooth` in the harness, or the drive lands short.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) —
Cycle B when adding a section kind or surface; Cycle A after fixes.
