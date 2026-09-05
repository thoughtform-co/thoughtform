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
- [ADR-072: The portfolio arc, and the dossier section kind](../sentinel/decisions/072-portfolio-arc-and-dossier.md) — `/arcs/loop-earplugs`, the ninth kind, the shared evidence, the envelope on arcs
- [ADR-073: The site's header on the arc pages](../sentinel/decisions/073-arc-header.md) — `ArcHudNav` replaces the left reel; `menuPrimary` chapters; the hero's top band
- [ADR-075: The arc hero IS the homepage hero](../sentinel/decisions/075-arc-hero-curtain.md) — the plate, the shared boot, and the curtain seam
- [ADR-076: The portfolio flows, and the architecture closes it](../sentinel/decisions/076-portfolio-flows-and-the-architecture-beat.md) — reveal motion on the portfolio, the curtain on the flowing path, the `intelligence` kind
- [ADR-077: The arcs' ink ramp](../sentinel/decisions/077-arcs-ink-ramp.md) — the colour tokens that let the light theme reach this surface
- [ADR-079: The portfolio is a trajectory, and every beat owns a screen](../sentinel/decisions/079-portfolio-trajectory-and-the-beat.md) — **the live cut**: `rollout` absorbed into the board, `tool-index`, Vesper first, one beat per viewport
- ⚠ [ADR-090: The dossier is one housing](../sentinel/decisions/090-dossier-is-one-housing.md) — **PROPOSED (2026-09-05), shipped and guarded, pending the owner's live read.** The four dossier beats become one machined housing (ADR-089's grammar at page scale): TR+BL chamfer on the plate rung, `--arc-plate` ground, the designation seated in a header band fused to the top edge, a column split the record's rules terminate on, `--arc-seam` .28 dividing regions against `--arc-rule` .12 within one, and the console demoted to a square CELL inside it (ADR-065 rule 4). ⚠ **The record overhung the console by 8.6–88.7px, a different amount per tool** — `align-items: start` aligned the tops and nothing aligned the bottoms. ⚠ **The reveal observer's `-10%` dead band is a real budget constraint** — see §The dossier housing below before touching `--arc-dossier-h`
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
- **THE HERO IS THE HOMEPAGE'S, AND THE CARD IS THE MOVER** (ADR-075,
  porting ADR-022 v8). It stays `relative; z-index: 4; height: 100vh` and
  scrolls off, while the FIRST beat is held still — `data-arc-entry` on
  `<html>` (written SYNCHRONOUSLY in the scroll handler: it switches a
  layer mode and a rAF's lag shows a gap) fixes that beat's `.arc-plane`
  to the viewport. ⚠ **Freeze the PLANE, never the stage** — the stage is
  the beat's flow height and `useArcTerminalMotion` caches `topDoc` /
  `pinStartY` / `--arc-stage-pin` off it. ⚠ The fixed cell must repeat the
  stage's centred box + `--arc-stage-pad`, use
  `left: 50%; width: 100vw; margin-left: -50vw` (never `inset: 0`), and the
  release query must repeat the freeze's selector `:not([data-arc-tall])`
  INCLUDED — a media query adds no specificity and the first cut's release
  silently lost 0,6,1 against 0,7,1. ⚠ A sticky hero is ADR-022's rejected
  v7 AND would freeze `--py` (the drift comes off a live rect).
- **`hero.plate: "gateway"` DECLARES the landing's key visual** (ADR-075):
  the AVIF/WebP `<picture>`, the theme glitch, and a row in `HERO_ROUTES`
  instead of the route's static preload (a static link can only ever name
  the dark plate). ⚠ Without it the hero is `data-plate="own"` and
  arcs.css hands its image back IN LIGHT — theme.css's swap is global on
  `.hero__bg`, so until ADR-075 every arc showed its own plate in dark and
  the LANDING's in light. ADR-073's top band is scoped to own plates for
  the same reason.
- **The hero BOOTS from `useHeroBoot`** — the landing's own effect, shared.
  Its collector recurses, so a headline's `<em>` decodes too; both shapes
  are pinned in `tests/lib/hero-boot.test.tsx`.
- **THE PORTFOLIO FLOWS; THE `-v2` DECKS ARE PINNED** (ADR-076). `motion`
  is absent on `PORTFOLIO_ARC` — a deck is presented, a portfolio is
  scrolled — and the reveal grammar is the shards pages' own (IO,
  `rootMargin -10%`, one-shot `is-in`, a 0.65s rise). Deleting `motion`
  is the whole change: the dispatch is motion-threaded end to end.
  ⚠ **The curtain rides the flowing path too**: `data-arc-curtain` on
  the root (detail + gateway plate + not terminal) freezes the first
  section's own `> .arc-band`, since there is no `.arc-plane` here. Same
  warnings as ADR-075 — repeat the freeze's selector in the release
  (`:not([data-arc-tall])` included; the pair is the reveal system's
  **900px**), replicate the centred box + `--arc-stage-pad`, and use
  `left: 50%; width: 100vw; margin-left: -50vw`. ⚠ The held band needs
  NO background (the hero covers it, then the section's own void does),
  and `useArcScroll` writes `data-arc-tall` itself here because no
  controller runs. ⚠ Sample the handoff WITHIN A PIXEL of the seam —
  the two boxes agree only at `scrollY = vh`, so a wider sample measures
  your own scroll and reports a jump that is not there.
- **THE COPY LAW ON THE PORTFOLIO** (ADR-078 U1, owner: the earlier set
  "disgusts me… people will hate me for it"). A title is a NAME, not an
  aphorism. Three shapes are banned as DISPLAY TITLES and walked by
  `arcs-registry.test.ts` over every `head.title`: the counting pair
  ("Twenty-two teams, forty-five minutes each"), the reversal epigram
  ("The method is the durable centre. The tools are its proof"), and the
  spelled-out-number opener ("Forty-seven Skills, five shapes of work").
  Where the owner already has a phrase for a thing, THAT phrase is the
  title — "Software for few", "the Intelligence Map", "Adoption that works
  is automation". Subs are one or two short sentences, and there are no
  prose interstitials on this page: the connective tissue is each
  section's own sub. ⚠ **TITLES ONLY** — a dated LOG ROW may state a count
  in the same words, because a record is not a claim.
- ⚠ **ONE BEAT PER SCREEN, AND IT IS THE PADDING (ADR-079).** `.arc-sec` has
  carried `min-height: 100svh; align-content: center` since ADR-052; what broke
  it was its own `clamp(96px, 14vh, 200px)` padding, which takes 201px out of a
  720px beat and pushed a dossier to 786. Padding is `var(--arc-sec-pad, …)` now
  and the portfolio lowers the token. ⚠ **Scoped by `data-arc-format`, NOT by
  motion** — the workshop v1 is also a reveal page and runs past twenty sections.
  ⚠ **A token, never a `padding-block` override**: a format selector outranks the
  per-kind rules that set `padding-block: var(--arc-stage-pad)` and would retune
  them silently. ⚠ The architecture beat LOST ADR-076's "may run past one"
  exemption (it measured 1141 in a 1080 beat); `--arc-intel-h` takes the beat's
  budget as a second term, and its WIDTH rides that height (`max-width` = h ×
  1.2), so an over-tight cap fails the smoke on width while height still passes.
- **The `tool-index` kind** (ADR-079) = `{ head }` and nothing else — the tools
  chapter head, given the four records it opens (number · codename · `subline` ·
  mode), each row opening its own beat. The renderer resolves `PROJECT_CASES`;
  authoring the lines would be a second, driftable description of four tools the
  page already draws in full. ⚠ Order is `TOOL_ORDER` (**Vesper first** — the
  tool built FOR the creative process before the three built AROUND it), pinned
  against the section list: an index pointing at beats in a different order than
  it lists them is what that constant prevents. ⚠ **Tabs switch a VIEW; the view
  is asymmetric** — rails stay inside consoles (map 3 · tools 4 · sheets 3 ·
  films 2) and the page's own navigation is the trajectory. Never a page-level
  tab strip (owner: "if everything is in tabs, then it's not gonna work").
- ⚠ **`rollout` IS RETIRED (ADR-079).** It plotted the SAME 2024 → now span the
  board plots, in a second grammar at the far end of the page. Its rows are
  stations, its platform work is the board's `parallel` track, its counts are the
  registers. The casefile keeps `ROLLOUT_ROWS` as the canonical copy, untouched;
  what went is the arc's re-authored second version and the parity pin with it.
- **The `program` kind** (ADR-078 U1, re-cut ADR-079) = `{ head, waypoints,
priors?, parallel?, footnote? }`, ONE per page and FIRST — it is what the
  curtain holds. Each waypoint carries `sub` (its date) and `note` (one sentence
  on what the move WAS: the board named seven dated things and left the arc
  between them to be inferred). ⚠ **The stations ALTERNATE above and below the
  axis and `data-lane` is DERIVED from the index** — seven across the band leave
  ~120px each against a 168px block, so alternating doubles the pitch between
  same-side neighbours; that is what buys each one a date, a name and a note.
  ⚠ **The adoption curve is its own register at the foot**, never a line behind
  the stations (drawn under them it crossed every note). ⚠ **No year scale** —
  every station prints its own date, so a row repeating them was the same fact
  twice AND a collision; the priors run in at the head of the adoption band.
  ⚠ **Gold that is READ takes `--gold-ink`** — the register figures went gold and
  measured 1.68:1 on parchment on raw `--gold`. It
  replaced `flywheel`, which drew adoption and automation as a ratchet:
  ⚠ **a diagram of a METAPHOR, in a house where every instrument draws a
  RECORD.** The dossiers draw real tool interfaces, the map 47 real
  Skills, the sheets real ads. A drawing earns its place here by plotting
  something that HAPPENED; if all it knows is an argument, the argument is
  better as a sentence.
  The board plots the engagement across a dated axis: a graticule, the
  adoption curve as a step ladder, what shipped at its real date as an
  anchor into its own chapter, framed registers, and the seat where both
  arrive. ⚠ **THE GAPS ARE THE READING** — `at` is authored from the
  record and registry-pinned SORTED; spacing waypoints evenly deletes the
  one thing the chart knows that a list does not. ⚠ It letters NO figures
  (the registers read `LOOP_FIGURES` in the renderer) and no digits but
  YEARS. ⚠ It must fit ONE VIEWPORT at 1280×720 or `data-arc-tall`
  disarms the curtain with only one smoke assertion to say so.
  ⚠ **SINCE ADR-080 IT ALSO MOUNTS A WebGL INSTRUMENT** — the same record in
  three dimensions, one coaxial ring per dated waypoint with the RADIUS
  carrying the adoption reach at that date, so the step ladder and the rings
  are ONE encoding. It lives in `.arc-prog__plot`, it is ABSOLUTE so it adds
  zero flow height and cannot move `data-arc-tall`, and it is gated on
  `data-holo`: absent / `"static"` render the flat board VERBATIM, `"live"`
  hides only the un-lettered field. ⚠ Every lettered string stays DOM in BOTH
  modes. ⚠ Arrival + drag ONLY: no idle animation, no wheel capture, no second
  scroll writer. ⚠ Verify HEADED — headless has no GL, so the beat silently
  falls back and the shoot looks fine.
  ⚠ **ADR-080 U3 IS THE LIVE CUT: THE DRAWING TAKES THE BEAT AND THE LABELS
  TRACK THEIR RINGS.** In live mode the header line, the priors/adoption pair,
  the platform track and the six registers LEAVE FLOW and float on the drawing
  (`z-index: 2` — DOM order paints an absolute `hd` UNDER the canvas otherwise;
  all `pointer-events: none`), and the plot is the **`1fr` REMAINDER** of a box
  one viewport less its padding: 331 → 528 at 1280×720, 574 → 941 at 1920×1247.
  ⚠ **A remainder, never a clamp** — it cannot trip `data-arc-tall` at any size,
  which a hand-sized `--pg-h` could. ⚠ **`align-content: stretch` MUST BE
  DECLARED TWICE**: the ADR-076 curtain's base rule declares `center` at (0,4,0)
  and outranks the plain selector (measured: the drawing came out 474 instead of
  941). ⚠ `user-select` widens to the whole panel — the registers stop being
  copyable, knowingly (selection is layout, so `pointer-events: none` does not
  stop a drag painting `--gold-30` plates on them).
  ⚠ **THE LENS IS SOLVED FROM THE CANVAS** (`solveHoloFit`) — three's `fov` is
  VERTICAL and nothing in the folder read the canvas, so the record filled
  23.9 % of the width BY CONSTRUCTION. Fit by the BINDING axis inside gutters
  for the chrome, plus a `setViewOffset` for their asymmetry. ⚠ **Solve the
  LENS, never the distance** (perspective is `distance / object-depth`, and
  `CAM_DISTANCE` is also OrbitControls' min/max). ⚠ **The fit includes the
  mark's plated collar** (r 2.043 vs the widest ring's 1.18) and that costs
  ~40 % of the size, bought so the one closed ring in the object is not cropped
  through its centre. ⚠ **Memoise the `camera` prop** or R3F reverts the solved
  fov on every render.
  ⚠ **`frontnessFromDepth` REPLACED AN EXPRESSION THAT NEVER RAN** — with
  `near 0.1 / far 60` every anchor returned the floor 0.25, always, so the
  label-dimming grammar had never worked. Band the REAL camera distance, never
  `ndc.z`.
  ⚠ **THE LABELS TRACK (`ArcProgramCourse` + `holoLabelLayout`)**, which
  supersedes U2's rejection by a CHANGED PREMISE (spread 377px → ~1200px, and
  the `note` is a hover so a block is two lines). ⚠ The declutter is a
  MECHANISM, not a safety net — two labels genuinely overlap at rest at 1280.
  ⚠ The anchor publishes a RIM NORMAL or the leader stops pointing at anything
  once the object turns. ⚠ Write the WHOLE transform in JS, centring included:
  an inline transform REPLACES the CSS one (the lab's own bug). ⚠ The note is
  `opacity: 0`, never `display: none` — it must stay in the a11y tree and in
  `textContent`.
  ⚠ **AZIMUTH IS CLAMPED to `REST_AZIMUTH ± 18°` = [−72°, −36°]**, chosen on
  ring openness and strictly negative so the dates can never run backwards;
  ±60° reaches +6°, past the axis into both failures at once. `rotateSpeed`
  0.22 — at 0.55 a 500px drag sweeps 187° and slams the clamp.
  ⚠ **AND SINCE ADR-080 U2 THE OBJECT IS FREE: NO FRAME, IN LIVE MODE**
  (owner, twice). The panel's border, chamfer clip, plate ground and every
  internal rule go TRANSPARENT (never `border: 0` — zeroing the widths
  re-flows the beat against its one-viewport budget), `.arc-prog__plot` stops
  clipping, the ruler is `display: none` (7px of FLOW, not an opacity), the
  canvas BLEEDS to the band's border box and `--pg-h` is `clamp(300px, 46svh,
  660px)` — 266 → 331 at 1280×720, 430 → 574 at 1920×1247, and **capped by
  the CURTAIN**: 46svh spends 65 of the 78px of slack the tightest shape has,
  so raising it means re-measuring `data-arc-tall` at all three.
  ⚠ **THE BLEED NEGATES `--instrument-margin` FIRST** — the same three-deep
  chain `.arc-band--instrument` reads. `--band-margin` alone is 120px wider
  per side at 1920 and put a 2152px canvas in a 1914px page.
  ⚠ **A CANVAS THAT DOES NOT PAINT THE PAGE'S GROUND DRAWS A RECTANGLE.**
  `HOLO_DARK.ground` is `--void` and `HOLO_LIGHT.ground` the parchment, pinned
  by `holo-program-geom.test.ts`; the plot declares NO bed and no ink
  literals, so the contrast walk climbs to `.arc-section`'s real ground.
  ⚠ **The vignette was the frame after that** — at full strength it darkened
  the canvas corners 5 units below the page; `vignetteScale` is 0.3 on dark.
  ⚠ **THE READER TURNS IT**, so `.arc-holo[data-live]` takes the pointer
  (never the bare host — an empty transparent host still hit-tests) and
  `.arc-prog__stns` goes `pointer-events: none` with its anchors taking it
  back. ⚠ **`user-select: none` ON THE PLOT** or a drag paints a `--gold-30`
  SELECTION PLATE behind all seven labels.
  ⚠ **THE COURSE STAYS A DATED ROW.** Tracking the stations to the rings' own
  rims (the lab's grammar, and what U1's commit claims the page does) was
  built and measured: seven coaxial rims project into ~500px and seven
  three-line blocks need three times that. It needs leader lines, and its own
  pass.
  ⚠ **ADR-080 U1's CLAIMS WERE LAB-ONLY** — its commit touched
  `components/holo-program/**` and the lab and nothing under
  `components/arcs/**`, so the free object, the drag and the light drawing all
  landed one directory short. The page's smoke runs with **WebGL OFF** by
  design and measures the FALLBACK board, so it cannot see any live-mode
  defect: gate live mode with `scripts/capture-arc-portfolio.mjs --holo` and a
  headed capture, at all three shapes in both themes.
- ⚠ **A HERO IS NEVER A FRAME OUT OF THE PAGE'S OWN EVIDENCE** (ADR-078 U2,
  owner). The portfolio briefly opened on the DJ Neighbour poster, reasoning
  that a Loop page should carry a Loop image. It should — but a poster frame
  is EVIDENCE, and the reel shows it properly further down in a console with
  its own rail; blown up to 100vh it is the work spent as wallpaper, and it
  cheapens the thing the reel is there to sell. The plate is the house key
  visual and the client-specific part of the hero is what it SAYS. A
  client-supplied image at hero grade is welcome; a still lifted out of a
  beat below is not. Smoke-pinned (`no poster frame in the hero`).
- ⚠ **THE CURTAIN IS NOT GATED ON THE PLATE** (ADR-078 U1). It read
  `plate === "gateway"`, so an arc taking its own key visual would have
  silently lost the ADR-076 seam — a choreography coupled to an image. A
  hero declares `curtain: true`; the plate answers only for what is
  painted. ⚠ An own plate also flips five other things: plain `<img>` (no
  `<picture>`), `data-plate="own"`, the ADR-073 top band APPLIES, arcs.css
  keeps the arc's image in light, and the ADR-060 theme glitch unmounts.
  ⚠ **`HERO_ROUTES` IS HAND-WRITTEN, NOT DERIVED** (`lib/theme/heroPreload.ts`)
  — a route that changes its plate must be removed from it by hand, or it
  script-injects a preload for a plate that page never paints.
  ⚠ **The own-plate top scrim is a dark LITERAL**: it sits over a PHOTO and
  theme.css re-pins `--void-deep-rgb` on any `.hero__video__overlay`, which
  washed parchment across the key visual in light (ADR-077's stays-literal
  clause).
- **The `sheets` and `films` kinds** (ADR-078) = `{ head }` and nothing
  else, the `intelligence` kind's contract one directory row across. The
  renderers resolve `LOOP_STUDIO_SHEETS` / `LOOP_ATL_FILMS`
  (`lib/cases/content/loop-earplugs.ts`), the SAME arrays the casefile rows
  carry, pinned `toBe` by `cases-registry.test.ts` — so the studio's imagery
  policy and the reel cannot be edited on one surface alone. Host contract is
  `.arc-intel`'s: `--fl-mono` · `--fl-copy` · `--fl-shot-px`, a definite
  height gated on `(min-width: 981px) and (prefers-reduced-motion:
no-preference)`, the settled gate declared, NEVER `data-proof-settled`.
  ⚠ **The aspect cap is the contract on both** — `--arc-sheets-h` × 1.7 and
  `--arc-films-h` × 1.7 — for the reason ADR-076 records and the films plate
  learned on its own surface: a 16:9 frame in a much wider box resolves to an
  undersized stamp in an empty console, which reads as cropped.
  ⚠ **`SheetsPlate` takes `stillSizes`** (default `"200px"` = the casefile's
  bytes; the arc passes `"320px"`): a `sizes` hint is a statement about the
  BOX. Any OTHER edit to either plate is a TWO-surface change — run
  `services-ring-smoke` AND `arc-portfolio-smoke`.
- **The `intelligence` kind** (ADR-076) = `{ head }` and nothing else,
  ONE per page, at the FOOT (after the dossiers and the outcome, before
  the close — it is the answer to what is underneath the work).
  `ArcIntelligence` mounts `IntelligenceMapPlate` from
  `LOOP_INTELLIGENCE_MAP` (`lib/cases/content/loop-earplugs.ts`), the
  SAME five arrays the casefile row carries, pinned `toBe` by
  `cases-registry.test.ts`. Host contract is `.arc-dossier`'s —
  `--fl-mono`, `--fl-copy`, a definite height, the settled gate declared.
  ⚠ **THE BOX'S ASPECT IS THE CONTRACT**: `max-width` is derived from
  `--arc-intel-h` (×1.2) because `meet` fits by the SMALLER ratio and a
  panel wider than the crop letterboxes horizontally — the band's full
  instrument width gave w/h 2.2 and a third of the panel empty, with a
  height-only fill guard reporting green. Assert BOTH axes and the
  aspect. ⚠ **Never declare `data-proof-settled` on this host**: it is
  half of `PdaConsole`'s wheel gate, and arming it puts a scroll trap in
  the middle of a flowing page.
- **The written 47-Skill roster is the KEYNOTE's** (ADR-076). The
  portfolio's text roster and its five-shapes rows are deleted — the
  console draws the same record. `SOFTWARE_FEW_LINE` is likewise
  keynote-shaped ("the Skills ABOVE"), so the portfolio's tools head
  authors its own sub: share the evidence, author the frame.
- **No STATIC three.js / Supabase / `LandingPage` imports** anywhere under
  `components/arcs/` or `lib/arcs/` (landing-performance doctrine).
  ⚠ **ONE DYNAMIC SEAM IS SANCTIONED (ADR-080)** — `ArcHoloProgramMount`
  reaches `components/holo-program/HoloProgramCanvas` through
  `next/dynamic({ssr:false})`, so the WebGL graph is a lazy chunk and the
  route's First Load JS is unchanged. `tests/lib/arcs-import-doctrine.test.ts`
  is the MECHANICAL half: until ADR-080 this ban was a rule with no
  mechanism, so a stray `import * as THREE` would have passed CI and
  inflated the budget silently. The scene's three-free modules
  (`holoProgramGeom`, `hoverRef`) may be imported statically — that is the
  `journeyScalars` transport pattern, and the guard names them.
  ⚠ **The casefile's dossier LEAVES are the one sanctioned import**
  (ADR-072, extended by ADR-076 and ADR-078): `ToolField`, `MediaLightbox`
  (+ `useWalkthrough`), `console/ConsoleFrame`, `console/ConsoleRail`,
  `wireframes/**`, `toolCardData`, `IntelligenceMapPlate` with `map/pda/**`
  (the architecture beat) and — since ADR-078 — `SheetsPlate` and
  `FilmsPlate` (the studio beats). DOM and SVG only by construction
  (verified per plate: react + next/image + `lib/cases` types + the console
  pair; no three / supabase / stores transitively).
  Never `ServicesCasefile` / `TrackVisual` / the corridor.
  ⚠ **`useCloseOnCasefileFold` NO-OPS OFF THE CASEFILE** — it looks for
  `.services-stage[data-proof-live]`, which no arc writes, so `FilmsPlate`'s
  fold-close simply never arms and the lightbox closes on Escape / backdrop
  / its own scroll lock, exactly as the dossier walkthrough has since
  ADR-072. If an arc ever mounts `films` under TERMINAL motion, the wrapper
  has to thread `useCloseOnArcBeatFold` instead.
- **COLOUR GOES THROUGH THE RAMP, NEVER A LITERAL** (ADR-077).
  `.arc-root` declares `--arc-ink-*` (copy), `--arc-edge` / `--arc-rule` /
  `--arc-rule-dash` (structure), `--arc-grid*` (the dot-matrix),
  `--arc-plate` / `--arc-sheen` (a plate's ground) and `--arc-chip*`, all
  against `--dawn-rgb` / `--void-deep-rgb`, which ADR-058 SWAPS. A literal
  like `rgba(235, 227, 214, .08)` is cream-on-black spelled out and is
  precisely what the flip cannot reach — that is how the portfolio shipped
  cards painting a near-black ground on parchment.
  ⚠ **RE-DERIVE THE ALPHA IN LIGHT, never inherit it**: the same number
  recedes toward BLACK on void and toward PARCHMENT on light, and
  dark-on-light reads weaker at equal alpha (ADR-063 U2; console.css's
  `--con-edge` says it in the same words). The override block at the foot
  of arcs.css is the one place to lift a rung.
  ⚠ **TWO THINGS STAY LITERAL**: `.arc-card__scrim` and the hero's top
  band, because both sit over a PHOTO (ADR-058's kept-dark imagery) and a
  flip would wash parchment across an image — ADR-075's own bug.
  ⚠ The parity walk in `arc-portfolio-smoke` COMPOSITES before measuring
  and asserts the ground flipped; reading `color` alone passes twice on
  the dark theme.
- ⚠ **THE FOUR CORNERS ARE THE LANDING'S (ADR-059 U6).** `ArcRailInstruments`
  owns BOTH working corners — the arc's five chapters top-left, the exit mark ·
  session · theme switch bottom-right with the switch centred on the right
  rail's track. It replaces the standalone `LightModeToggle` on any DETAIL arc
  with a menu; the `/arcs` OVERVIEW keeps the toggle and both brackets, and
  that is the sliver of U2's "the arcs have no row" ruling that survives.
  ⚠ **The roster is DERIVED (`buildArcMarks`), never hard-coded** — the change
  reaches all five arcs. ⚠ **A chapter is a RANGE** (`idxEnd`), so Tools owns
  its four dossiers, and the first chapter opens at 0 so ADR-059's
  one-mark-is-gold invariant holds by construction. ⚠ **Never import
  `clusters.ts` from an arc**: it resolves the landing's roster at MODULE
  EVALUATION and throws, so a renamed landing station would white-screen a
  client's page — share `markState.ts` alone. ⚠ **The switch stays LAST**
  (U3's standing rule) and the controls must render on the FIRST COMMIT, or
  `HeroThemeGlitch` misses `.theme-toggle` and the first toggle loses its
  plate-warm. ⚠ Glyphs are MAPPED, not drawn — five existing keys by position,
  decorative by owner ruling.
- **CSS:** the route's sheet order is `landing.css → casefile.css →
console.css → pda.css → arcs.css → theme.css → rail-instruments.css`
  (ADR-072, ADR-076; theme LAST, ADR-058). ⚠ The instruments sheet sits AFTER
  theme.css, mirroring the landing route exactly — it declares no
  `[data-theme]` rules at all, and theme.css's one instruments rule outranks
  its base on specificity from either position (ADR-059 U6). Everything page-scoped lives in `arcs.css` under `.arc-*`;
  corridor sheets (home-v2.css / services.css) are never imported —
  grammars are copied. ⚠ The casefile's `casefile.css` + `console.css` ARE
  imported, at the ROUTE, ahead of arcs.css (ADR-072): the dossier mounts
  the landing's console and ~1800 lines of wireframe CSS are the drawing,
  not a grammar to copy — and `pda.css` joins them for the architecture
  beat (ADR-076). Never import any of them from a CLIENT component: the
  cascade order would then ride the chunking.
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

## The dossier housing (ADR-090)

The four dossier beats are one machined housing; the console is a cell inside it.
All of it is `.arc-dossier`-scoped and gated at
`(min-width: 981px) and (prefers-reduced-motion: no-preference)`.

- ⚠ **THE REVEAL OBSERVER HAS A DEAD BAND AND THE HOUSING MAY NOT FILL INTO
  IT.** The ADR-052 reveal runs at `rootMargin: -10%`, so the bottom tenth of
  the viewport never triggers an intersection. Sized to the beat's whole
  budget, the record's LAST block parks there: measured at 1920×1080,
  `.arc-dossier__stack`'s top landed at **975 against a root bottom of 972** and
  stayed at `opacity: 0` forever while the other five revealed.
  `--dos-reveal-clear` reserves it. ⚠ **The cost is DOUBLE the clearance** —
  shrinking a beat re-centres it, so 50px of budget buys ~25px of margin.
  ⚠ **It binds only where the CONSOLE sets the row**, so 1280×720 is unaffected
  and cannot catch it; measure at 1920×1080.
- ⚠ **THE CONTAINING BLOCK IS THE REVEAL WRAPPER, NOT THE HOUSING.** Releasing
  `.arc-head__lead` does not reach `.arc-dossier`: `.arc-head` carries
  `.arc-reveal`, whose transform makes it a containing block for absolute
  descendants, so the designation printed through the title.
  `.arc-dossier .arc-head { position: relative }` is DECLARED — left implicit,
  the band's seat would depend on animation state.
- ⚠ **THE INSET IS PAID FOR BY THE FIELD.** The record column is a fixed
  fraction, so every pixel of `--dos-pad` and of the grid gap comes off the
  console. `.fl-bay__top`'s FEED line neither wraps nor shrinks and is ALREADY
  clipped 28.8px at 1280×720 (pre-existing, ADR-068's budget); both tokens are
  tuned so the field lands back at its pre-housing width.
- ⚠ **A BORDER, NOT ADR-089's CLIPPED RING.** A `clip-path` cuts a border and
  never strokes one, which is why the casefile needs a two-contour path for its
  gold lip. This edge is flat dawn, so a plain border under a single-contour
  clip is correct. ⚠ **And no gold on it** — the record already spends gold on
  the badge, the route arrow and the NOW plate.
- ⚠ **THE BAND'S RULE RUNS FULL WIDTH**, unlike the casefile's, which stops at
  the split because `ConsoleRail` is the field's own header. A dossier console
  has NO rail, so nothing collides with it. It letters the designation ALONE
  (ADR-089 U1) — the bay's FEED line already prints `IN SERVICE {year}`.
- ⚠ **`--con-ground: transparent`, NEVER `background: none`**, and
  **`border-color: transparent`, NEVER `border: 0`** — the light walks read
  that property for their bed, and the border box sizes the field.
- ⚠ **THE HOUSING CHANGES THE RECORD'S BED IN LIGHT.** `--arc-plate` is `.55`
  in dark (walked past) but FULLY OPAQUE in light, so it becomes the bed for
  every rung in the record column. Five of them joined the contrast walk for
  that reason; a new text element in this column belongs there too, because the
  count guard only notices a LISTED selector that stops matching.
- ⚠ **`--arc-seam` IS LIFTED IN LIGHT** (.28 → .42), like every line rung on
  the ramp. Carried across, the two-rung ladder collapses on parchment.
- ⚠ **CSS-ONLY BY DESIGN** — `arc-terminal-markup.test.tsx` pins
  `class="arc-dossier__console arc-ap"` exactly and counts 12
  `data-arc-decode`. Build the band by moving containing blocks, not elements.
- **Verifying:** `arc-portfolio-smoke --project=desktop` AND
  `arc-terminal-smoke --project=desktop`, plus
  `node scripts/capture-arc-portfolio.mjs --vp 1920x1080` in both themes.
  ⚠ Six failures on `iphone-14` / `tablet` are PRE-EXISTING (the ≤960
  `.fl-wire` aspect rung) — stash before blaming a change.

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
`tests/lib/arc-terminal-markup.test.tsx` (conventions + v1 byte-identity)
and `tests/visual/arc-terminal-smoke.spec.ts`, which walks the `-v2` cuts
— the terminal pages. ⚠ **`arc-portfolio-smoke.spec.ts` is NOT one of
them since ADR-076**: that page flows, so it has no stage, no decode
ladder and no fold, and its spec asserts the FLOWING contracts (the
sections' order, the curtain on `.arc-band`, the dossiers at the three
reference shapes in both themes, the walkthrough, the architecture
beat's box/aspect/rail/wheel, PRM, the small-screen unwrap). Run BOTH
when you touch the arc chassis: the terminal spec is what proves a
change to the shared components left the decks alone. Measure at **1280×720 and 1440×800** — the
project's 1440×900 default hides every clipping bug this content has.
Drive REAL stepped scrolls and disable `scroll-behavior: smooth` in the
harness, or the drive lands short. The drive helpers live in
`tests/visual/helpers/arcTerminal.ts`.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) —
Cycle B when adding a section kind or surface; Cycle A after fixes.
