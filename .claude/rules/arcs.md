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
- [ADR-072: The portfolio arc, and the dossier section kind](../sentinel/decisions/072-portfolio-arc-and-dossier.md) — `/arcs/portfolio`, the ninth kind, the shared evidence, the envelope on arcs
- [ADR-073: The site's header on the arc pages](../sentinel/decisions/073-arc-header.md) — `ArcHudNav` replaces the left reel; `menuPrimary` chapters; the hero's top band
- [ADR-008: Landing v7 background layers](../sentinel/decisions/008-landing-v7-background-layers.md) — the compositing rules the arc shell inherits

**Contracts**

- **One scroll writer per page** (`useArcScroll`, ADR-002). It owns
  `--hero-lift` / `--hero-cover` / `--py` / the wordmark dock / the menu
  gate. Never add a second writer, never write corridor channels
  (`--svc-*`, `data-corridor-*`, `data-active-station`).
- **`--hero-lift` gates the rails.** Detail = written from scroll;
  overview = static `1` on the root. Rails invisible ⇒ check this first.
- **THE HEADER IS THE SITE'S, AND IT REPLACED THE REEL** (ADR-073).
  `ArcHudNav` renders the landing's `.hud__nav*` chrome out of landing.css:
  the CHAPTER links inline in the hero, the section readout + a drawer of
  every `menuLabel` once past half the first viewport. ⚠ `ArcMenu` and the
  whole `.arc-menu*` block are DELETED — the reel only rendered above
  1101×760, so at 1280×720 an arc had no navigation at all (ADR-055's own
  ruling, one surface later). Its observer survives as
  `useArcActiveSection` (the sticky STAGE under terminal motion, the
  section under reveal). ⚠ Not `HudNav` itself: that readout reads the
  corridor bus and its links are the landing's stations. ⚠ The readout's
  label is IMPERATIVELY written — render the span EMPTY or `queueScramble`
  sees `from === to` and never decodes.
- **`menuPrimary` marks a CHAPTER** — the inline row, capped at five and
  registry-pinned; the drawer takes every `menuLabel`. Ten inline links do
  not fit a hero. A `-v2` cut shares its v1's sections, so a pair is
  marked once.
- ⚠ **THE ROW IS CHROME OVER A PHOTO.** The arcs' key visual is near-white
  top-right, where the production hero overlay deliberately leaves the
  plate clear — cream links measured 1.06:1 there. `.arc-hero
.hero__video__overlay` carries a top band for it (6.1–7.2:1 measured);
  the portfolio smoke asserts the row lands on no hero INK at the
  reference viewports.
- **Slice API is read-only.** `sliceV7Sections([])` is consumed as-is; no
  edits to `public/prototypes/v7/**` or `lib/v7-parse/**` from this
  surface, and nothing mounts into the injected hud markup.
- **Compositing:** every section opaque void; `.gateway` stays
  display-none'd; the hero card never fades/transforms (only
  `.hero__content` moves).
- **No three.js / Supabase / `LandingPage` imports** anywhere under
  `components/arcs/` or `lib/arcs/` (landing-performance doctrine).
  ⚠ **The casefile's dossier LEAVES are the one sanctioned import**
  (ADR-072): `ToolField`, `MediaLightbox` (+ `useWalkthrough`),
  `console/ConsoleFrame`, `wireframes/**` and `toolCardData` — DOM-only by
  construction (verified: no three / supabase / stores transitively).
  Never `ServicesCasefile` / `TrackVisual` / the corridor.
- **CSS:** everything page-scoped lives in `arcs.css` under `.arc-*`;
  corridor sheets (home-v2.css / services.css) are never imported —
  grammars are copied. ⚠ The casefile's `casefile.css` + `console.css` ARE
  imported, at the ROUTE, ahead of arcs.css (ADR-072): the dossier mounts
  the landing's console and ~1800 lines of wireframe CSS are the drawing,
  not a grammar to copy. Order: `landing.css → casefile.css → console.css →
arcs.css → theme.css` (theme LAST, ADR-058); never from a client
  component (cascade order would ride the chunking).
- **The `dossier` kind** (ADR-072) = `{ toolId, legend, head? }`, ONE tool
  per section: `toolId` ∈ `PROJECT_CASES` (registry-pinned, all four in
  order on the portfolio), `legend` EQUALS `MODE_LEGEND[mode]`, `head`
  absent ⇒ derived from the record, `head.sub` never authored. It mounts
  the casefile's bay at page scale; the HOST CONTRACT the casefile used to
  supply lives on `.arc-dossier` in arcs.css — `--fl-mono`, `--fl-copy`,
  `--fl-shot-px`, a DEFINITE console height (`--arc-dossier-h` = 100svh −
  2·`--arc-stage-pad` − 24, floored 440, capped 900), the settled gate
  declared, the blocks' seat animation off. ⚠ **A dossier beat must FIT at
  1280×720 / 1440×800 / 1920×1080** (smoke: `data-arc-tall` absent) — a
  tall two-column beat crops the console at the park; the record column
  is what gives (the BEFORE paragraph goes sr-only under 760h). ⚠ A bay
  change is a TWO-surface change: run `services-ring-smoke` AND
  `arc-portfolio-smoke`; both read `tests/visual/helpers/toolBay.ts`.
- **No italics.** Emphasis is `ArcTitle.em` → upright gold; markup inside
  copy strings fails `tests/lib/arcs-registry.test.ts`.
- **Content changes** = edit `lib/arcs/content/*` + registry only; run
  the registry test. New arc = content module + registry entry + assets
  under `public/arcs/<slug>/`.
- **Shared evidence lives in `lib/arcs/content/shared/*` and is imported BY
  REFERENCE** (ADR-072) — the roster, the studio cards + the ATL film, the
  operator's lines, the mode legend, the figures. Share the evidence,
  author the frame: every head, sub and placement stays per arc. The
  registry test pins the references `toBe`; a copied array drifts the
  moment either page edits it. `LOOP_FIGURES` is copy-with-parity to the
  casefile's `report.stats` (`cases-registry.test.ts`) — `lib/arcs` keeps
  no `lib/cases` import.
- **The numbers canon fails on EVERY arc** (ADR-072): 42 / forty-two,
  90 % / 95 %, 15+ teams, 20+ Skills/teams, "teams mapped", "8 teams", and
  a `14 teams` that does not say "using the layer".
- **Money on arcs:** the keynote is a client DECK and prints per-ad spend
  in euros on purpose (the exemption is recorded beside `STUDIO_SHOTS` in
  `lib/cases/content/loop-earplugs.ts`). The PORTFOLIO is a page a reader
  forwards and sits inside the casefile's confidentiality envelope —
  `ENVELOPE_ARCS` in the registry test (currency, thousands separators,
  boards, repos, private repo names, surnames); its studio cards go
  through `ratiosOnly()` (SKU + ROAS). Add a forwarded page to that list;
  never widen it to the deck.
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
  and stopping still types it in"). ⚠ And a beat that becomes NEAR between
  scroll events — a jump past the 120 % margin (End key, `scrollTo`, a
  reel click in one step) — parked blank the same way until ADR-072 gave
  the near-callback one frame through the same timer. Found by a stepped
  drive whose last step cleared the margin; real on every terminal arc.
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
`tests/visual/arc-terminal-smoke.spec.ts`, and for the portfolio
`tests/visual/arc-portfolio-smoke.spec.ts` (the dossiers at the three
reference shapes in both themes, the walkthrough over a pinned beat, PRM,
the small-screen unwrap). Measure at **1280×720 and 1440×800** — the
project's 1440×900 default hides every clipping bug this content has.
Drive REAL stepped scrolls and disable `scroll-behavior: smooth` in the
harness, or the drive lands short. The drive helpers live in
`tests/visual/helpers/arcTerminal.ts`.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) —
Cycle B when adding a section kind or surface; Cycle A after fixes.
