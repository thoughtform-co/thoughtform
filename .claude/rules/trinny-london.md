---
paths:
  - "app/(marketing)/arcs/trinny-london/proposal/**"
  - "public/prototypes/v7/landing-trinny-london.html"
  - "public/trinny-london/**"
  - "lib/theme/themeLock.ts"
  - "lib/theme/themeBootstrap.ts"
  - "components/landing/v7/ThemeLock.tsx"
  - "components/landing/v7/rail-instruments/journeyOrder.ts"
  - "components/landing/v7/rail-instruments/useJourneyMarks.ts"
  - "components/landing/v7/rail-instruments/sectionGlyphs.tsx"
  - "components/landing/home-v2/hooks/useCorridorExitScroll.ts"
  - "components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx"
  - "scripts/capture-trinny-london.mjs"
  - "lib/brandmark/morphTargetRef.ts"
  - "tests/lib/trinny-mark.test.ts"
description: The Trinny London pitch variant — the light lock, its own journey clock, the proof stack, the turn (the mark morphs, the ground warms, the line decodes) and the proposal
---

# Rule: /trinny-london

A client pitch page built as a HOMEPAGE VARIANT on the ADR-053 recipe, forced
into light, unlisted. Same `LandingPage`, same corridor, order
hero → about → the Arc → **the proof STACK (in `#services`) → the turn (the
parked mark morphs into the client's, the ground warms, the line decodes in
place) → the proposal** → contact.

**Read first**

- ⚠ [ADR-102](../../sentinel/decisions/102-one-pinned-scene-the-configuration-becomes-the-plates.md) — **PROPOSED (2026-09-14), built and guarded, pending the owner's live read. `#proposition` IS ONE PINNED SCENE**: the record strikes in and the slot pins on the same frame, the PHASES beat renders inside the stage over the board, and everything from the dwell to the paragraph's opening is a pure function of the station's clock `sv` (viewport units). The nodes fold INTO the chip (shrinking before they travel), the chip slides to plate 1's band, two copies peel right one after another, each plate unrolls out of the band that arrived. ⚠ It retires ADR-101 §A.3 and §B.1–B.3: no seam clock, no phases' strike, no document-space carrier. See §The scene below
- ⚠ [ADR-099](../../sentinel/decisions/099-proposal-nests-and-the-configuration-scrolls-in.md) — **PROPOSED (2026-09-13), built and guarded, pending the owner's live read. THE ROUTE IS `/arcs/trinny-london/proposal` NOW** (a 308 from the old URL; ADR-098 §2's flat-engagement rule is untouched — what nests is a `ClientDef.pages` record, outside `[slug]`'s one-segment namespace). ⚠ **U5's PIN IS RETIRED AND THE CONFIGURATION IS AN ARC BEAT** that scrolls in over the emptied turn — the blank frame the owner saw WAS the pin; the clock is `propArrival`, the overlap is arithmetic (`p = 0.7727`), the coral rule and `--tp-in` are deleted, and the beat carries the `.arc-head`'s cross. ⚠ **EVERY PROPOSAL HEAD TAKES A DATUM** (`arcs.css`, format-scoped, so the Suri and Perfect Ted pages take it too). ⚠ **A `flow` KIND** draws the brief → renders → markets pipeline; see §The interstitial and the proposal
- [ADR-095](../../sentinel/decisions/095-trinny-turn-particle-morph.md) — the turn: the registry seam, the shader's second home, the measured mark, the polar-rank pairing, the beat's clock. ⚠ **U1 deleted the interstitial slab**: the ground changes under a shader instead and the line decodes in place over it. ⚠ **U5 (2026-09-10) DELETED THE SECOND SLAB** — the products LEAVE on the turn's own clock, `#proposition` is transparent, the mark fades behind it, and the kill edge is **`#contact`** (⚠ its PIN is retired by ADR-099 and the kill edge is `#offer` since ADR-094 U9 — both are recorded below)
- [ADR-094](../../sentinel/decisions/094-trinny-proof-stack-and-proposal.md) — the proof stack, the interstitial, the proposal, and the three mechanisms they needed. ⚠ **U1 (2026-09-10) RECOMPOSED THE CARD**: the head is chrome with the project's name down in the record, the fields show ONE thing on the house rail, and the arrival is delayed and settled. ⚠ **U2 (same day) PUT THE ARC IN THE RECORD AND THE TABS IN THE FIELD** — `CaseTrack.arc`, the order reversed to lead on the frontier work, the claim sentences read, and the ATL films in their 4:5 cut. ⚠ **U3 (same day) MADE THE ARC THE TITLE**, gave the studio card its THREE SHEETS via a portalled `SheetsPlate`, and made both the films and the tools PLAY. ⚠ **U4 (same day) NOTCHED THE CARDS** (ADR-065's canonical TR+BL, which caught the console's stale TL+BR), cut the head down to its ORDINAL, renamed `THE LINE` → `GOVERNANCE`, and made the 4:5 cut play IN ITS FRAME. ⚠ **U7 (2026-09-11) REDREW THE PROPOSAL AS ONE INSTRUMENT WITH A PICKER** — the layer they own, the teams as tiles, the picked team’s five-question configuration, adoption and automation across the seam; see §The interstitial and the proposal
- [ADR-093](../../sentinel/decisions/093-trinny-london-light-locked-variant.md) — this route's lock and its journey clock
- [ADR-053](../../sentinel/decisions/053-workshop-corridor-variant.md) — the recipe it repeats, and its two invariants
- [ADR-058](../../sentinel/decisions/058-light-mode-theme.md) — the theme channel the lock overrides
- [ADR-059](../../sentinel/decisions/059-rail-instruments.md) — the four-corner scheme and its two clocks
- [ADR-030](../../sentinel/decisions/030-tools-section-cover-stack.md) — the stack mechanic the proof reuses, and the §6 seam bug the kill edge answers

## Contracts

- **Variant-local CSS only.** `trinny-london.css` is scoped to `.tl-root` (or
  keyed on `<html>`, for chrome the wrapper cannot reach). Never port a rule
  from it into `landing.css` / `home-v2.css` / `services.css` /
  `rail-instruments.css` — a shared-sheet edit changes `/` and
  `/claude-workshop`. ⚠ ADR-053's two rules are DUPLICATED here rather than
  shared: one rule scoped to both roots is a shared sheet by another name.
  ⚠ **The sheet is pinned at ZERO type literals** (`type-material-tokens`):
  every letter-spacing is a `--track-*` role token, every weight a
  `--weight-*` token, every colour a ramp step off `--dawn-rgb` /
  `--gold-rgb`. A literal here is a guard failure, and that is the guard.
- ⚠ **THE LOCK NEVER WRITES `localStorage`.** `data-theme` is a paint decision;
  `tf-theme` is the visitor's. A lock that persisted itself would follow the
  reader back to `/`. It also beats `?theme=dark` — a pitch page has no
  legitimate dark reading, and the smoke asks for dark to prove it.
- ⚠ **STAMPING THE ATTRIBUTE IS HALF THE JOB.** `ThemeLock` calls
  `hydrateFromDom()` immediately after, because the WebGL painters and the
  services drawer's bake read the STORE, not the attribute
  ([`services-ring.md`](services-ring.md) records the drawer half). And it is a
  `useLayoutEffect`: a passive one lands after `HeroThemeGlitch` subscribes, and
  the notify then reads as a real flip and warms both hero plates (~780 kB) on a
  page that can never toggle.
- ⚠ **A ROUTE EARNS ITS `LIGHT_LOCKED_ROUTES` ROW AND ITS `HERO_ROUTES` ROW BY
  HAND.** Both lists are hand-written; nothing derives them, so nothing else
  would say a route had changed its theme or its plate. A locked route also
  needs the rule that hides the switch — a lock without it leaves a control that
  visibly does nothing.
- ⚠ **THE ROSTER IS BUILT FROM THE PAGE ORDER, NEVER FROM PRODUCTION CLOCKS.**
  `markState` compares indices, so a production mark carries its production
  position: reordering `JOURNEY_MARKS` makes About read `ahead` at the offer and
  Thesis `passed` inside the bio, with every mark rendering and nothing throwing.
  `TRINNY_JOURNEY_ORDER` is the one clock; changing the page's sections means
  editing that array and nothing else.
- ⚠ **AND THE SECTOR TOTAL IS PART OF THE ROSTER.** It shipped as `01/07` on a
  five-row page: the hook seeded production's total and its bail-out compared
  only the POSITION, which at rest on the hero is 0 either way. Any new state on
  that hook is compared in the same check.
- ⚠ **THE JOURNEY ROW IS HIDDEN EVERYWHERE NOW, AND THE RULE LEFT THIS SHEET**
  (ADR-098 U1, 2026-09-12). This route asked first; the arcs and then the
  homepage asked next, so `.rin-cl--journey { display: none }` and the bracket
  restore moved into `rail-instruments.css` and the route-local copy is gone.
  The consequence below is still this route's alone, because every other
  surface keeps its nav-corner readout. The original reasoning, which still
  holds: (owner,
  2026-09-10). `RailInstruments` hosts the marks INSIDE `.hud__corner--tl` and
  `html[data-rail-instruments]` zeroes that bracket's border, because the row IS
  the corner mark; with the row gone the border returns — which is exactly what
  `rail-instruments.css`'s own `≤960` rung does, so this is that rung
  route-scoped to every width, and the clip goes back to production's 0 sides
  (the −340px opening exists only to spare the row's outboard mark).
  ⚠ **`display: none`, NOT an unmounted component** — the marks keep computing,
  so `TRINNY_JOURNEY_ORDER`'s clock stays exercised by the smoke, which reads
  `data-mark`/`data-state` (both readable on a hidden node) rather than rects.
  Unmounting would need a prop threaded through shared chrome, which is what
  rule 2 already declined to do for the nav readout one corner over.
  ⚠ **CONSEQUENCE, NAMED: this page now has NO section indicator.** Rule 2 hides
  the nav-corner readout on the grounds that "the TOP-LEFT journey row does make
  the claim"; the drawer's bars are the only navigation left. Restoring the
  readout is NOT the fix — on this station order it names ABOUT through the
  corridor approach and jumps backwards on arrival.
- ⚠ **THE HERO CURTAIN LIFTS OVER A HELD `#about`, AND THE HOLD IS ON THE
  CONTENT** (owner, 2026-09-10: parallax over section two "like we have on the
  home page"). The hero is already identical on both routes — `relative` z 4,
  native scroll 1:1, `--hero-lift` matching to four decimals. What differs is
  what is behind it: on `/` the corridor mount's sticky cell goes
  `position: fixed` during the entry band, so the frame is FROZEN and the hero
  uncovers it bottom-up; here `#about` is a normal-flow station whose top tracks
  the hero's bottom to the pixel, so the two travel in lockstep and nothing
  moves against anything. ⚠ **Rule 1 is why the homepage's own mechanism cannot
  be reused** — the fixed entry hold is deliberately undone on this route.
  ⚠ **IT IS A SCROLL-DRIVEN ANIMATION, NOT A SCROLL-LINKED TRANSFORM, AND THAT
  IS NOT A PREFERENCE.** The first cut wrote `translateY(calc((1 -
var(--hero-lift)) * -100dvh))` off the shared scroll writer and JITTERED: the
  page scrolls on the COMPOSITOR and a main-thread variable lands a frame later,
  so on the frame each wheel step arrives the content travels with the page and
  is corrected on the next — measured `227.2 / 243.2 / 243.2` repeating, a
  displacement of exactly one wheel step, every step. `animation-timeline:
scroll(root block)` with `animation-range: 0 100dvh` moves it off the main
  thread; re-measured, spread **0.00px**. ⚠ **This is why the homepage holds its
  corridor with `position: fixed` rather than a transform** — anything cancelling
  native scroll must be composited, and no easing hides a frame of lag.
  ⚠ **`@supports (animation-timeline: scroll(root block))` IS LOAD-BEARING.**
  Without it a browser lacking scroll timelines keeps the `animation` and drops
  only the `animation-timeline`, running the keyframes on the DOCUMENT timeline
  and throwing the content a full viewport off its seat (measured `contentTop =
-605` where it should be 243). Guarded, the unsupported path drops the block
  and gets plain flow — what this route shipped before.
  ⚠ **THE HOLD GOES ON `#about > *`, NEVER ON `#about`.** The station is
  what the section clock measures: held on the station itself, `useActiveSection`
  reads its rect at the viewport top from scrollY 0 and the page lights ABOUT
  while the reader is still on the hero (the journey-rail smoke caught it at
  once — gold on `about` where it asserts `hero`). That is rule 2's defect
  arriving from the other side. ⚠ The background needs no help: the hero's
  bottom edge IS `#about`'s natural top at every position, so the band the
  curtain uncovers is exactly the band the station's box already covers, and
  content translated above that edge is under the hero (z 4 over z 2).
  ⚠ The range ends at identity and continuously, so the corridor, the stack, the
  turn and the proposal are untouched; `> *` rather than the content's own class,
  so a child added to the parsed station travels with it; gated to the capable
  rung because the hold is one `dvh` of travel and a phone's `dvh` moves under
  the URL bar.
- **`resolveActiveIdx`'s `preMountStationId` defaults to `hero`** and must stay
  byte-identical for `/`. On this page the lag station is `about`, because the
  corridor mount is not a `.station`.
- **The nav items are a PROP.** They are hardcoded in React, so the parse-time
  link cleanup cannot reach them; filtering at mount instead would flash the
  dead links on the hero and change the drawer's count after hydration.
- **The workshop's guard stays untouched.** `claude-workshop-parse.test.ts`
  pins its own prototype; this route has `trinny-london-parse.test.ts`. The two
  HTML files diverged with ADR-094 (the proof slot, two stations, the hero's
  ghost CTA); the path check that told them apart while identical still runs.
- **The page is unlisted:** `robots: { index: false, follow: false }`, absent
  from `app/sitemap.ts`. ⚠ The forked prototype under `/prototypes/` deploys and
  is world-fetchable (robots-disallowed only) — the same exposure class, and the
  proposal's client-naming copy now lives in it.

## The proof stack (ADR-094)

⚠ **THE CARD AND THE PILE LIVE IN `components/landing/home-v2/services/
proof-stack/` SINCE [ADR-096](../../sentinel/decisions/096-proof-stack-on-the-homepage.md)**
(2026-09-12) — the owner asked for the same beat on the homepage, so the module
and its sheet were PROMOTED rather than copied, and the route scope
`.tl-root .tl-*` became `.pf-stack .pf-*` (same specificity, same overrides).
This route keeps three shims under `proof/` so `trinny-proof-order.test.ts` and
`trinny-proof-tabs.test.ts` are untouched, and `ProofStack` there stays a
DEFAULT export for `lazy()`. Every contract below still binds — read it with
[`proof-stack.md`](proof-stack.md), which owns the shared half.
⚠ The route-local `--tl-ink` / `--tl-rule` / `--tl-plate` tokens stay on
`.tl-root` for the TURN and the PROPOSAL; the card carries its own `--pf-*`
copy so the pile is self-contained on either host.

- ⚠ **`#services` KEEPS ITS ID AND MOUNTS `[data-tl-proof-root]`, NEVER
  `[data-services-root]`.** `useCorridorExitScroll` resolves `#services` by id
  and RETURNS WITHOUT IT — the dissipate, the dock and the ambient hold all key
  to its rect, and that handoff is the part of the page the owner likes.
  `ServicesPortal` returns before `createRoot` without its slot, which is what
  keeps the casefile, the masthead, the plate cluster and the ring hit-areas
  off this page with no flag. Restoring `data-services-root` mounts two proofs.
- ⚠ **THE WEBGL CARD RING IS OPTED OUT ON `<html>`** — `data-services-ring="off"`,
  stamped by `TrinnyPortals` in a LAYOUT effect and read ONCE at mount by
  `CorridorArmillary`. Without it the ring replays its fly-in behind the
  transparent station: its entrance is `smoothedDissipate × proofRelease` and
  `proofRelease` RESTS AT 1 with no stage to write it. ⚠ Never gate the ring on
  `[data-services-root]` presence (the card-face labs mount it without that
  markup) and ⚠ never write `proofRelease = 0` from a route — `useJourneyMarks`
  and `useActiveSection` read `< 0.75` as "the casefile owns services".
- **`TrinnyPortals` is a SIBLING of `LandingPage`, rendered AFTER the wrapper.**
  Passive effects run post-order, so the parsed body exists by then on both a
  full load and a client-side entry; the root lifecycle is `ServicesPortal`'s
  verbatim. The stack is `lazy()`-imported — the landing's import doctrine walks
  this route's static graph and the stack pulls the casefile's plates in.
- **The mechanic is `useStackedCardsScroll`, the skin is this route's.** The
  hook queries `[data-pc-slot]` and reads each slot's COMPUTED `position` and
  `top`, so: every slot carries an inline `--i`, every slot must resolve
  `sticky` or the hook parks the whole pile, `overflow-anchor: none` on the
  stack and its descendants, the slot is POSITIONING ONLY (the recession and the
  wash live on `.tl-card`). The `.pcl-*` console skin is never imported.
- ⚠ **THE FIRST PIN CLEARS THE FRAME'S TOP-LEFT ROW** — `--pc-top-base` ≥ 64px.
  At 16px the first card's head sat under the six journey marks (~y45 at every
  viewport); the smoke pins the floor.
- ⚠ **THE INERT RUNG IS ROUTE-OWNED: `(max-width: 960px), (max-height: 680px),
(prefers-reduced-motion: reduce)`.** ADR-030's own rung is 759h, which would
  make 1280×720 — the reference laptop — a static list. Keep the hook's contract
  either way: the rung flips `position` to `static` and the hook parks.
- **Content by REFERENCE, order by ROUTE — and since U2 the order IS the
  record's arc.** `proofOrder.ts` names four track ids on the Loop casefile
  (**`atl-films · studio · tooling · ai-transformation`**) and THROWS on a
  missing one. The card is `track.project` · `track.card.lede` (≤180, a record
  field beside the brief, inside the envelope scan) · the four `blocks[]` as
  `title` + `desc` with their `ProofGlyph` · and `track.arc` in the head.
  ⚠ **THE SEQUENCE AND `arc.step` CAN DISAGREE WITH NOTHING FAILING** — the
  head prints the step from the record while the pile is ordered by this
  array, so a re-order in one place letters `03 · 01 · 02` down a scroll with
  four correct cards; `trinny-proof-order.test.ts` asserts they agree.
  ⚠ **AND THE CLIENT TOO, SINCE ADR-097**: the shim passes
  `trinnyProofClient()` — the record's `client` for the kicker (a JSX literal
  until then) and `CaseDef.accent` for the folder tab's colour. This route
  therefore wears the whole folder skin (glass, gold lip, tab, depth) with no
  route-local rule: `proof-stack.css` is ONE sheet on two hosts, and the
  smoke's `cardShape` reads its covered cards through their depth scale
  (`offsetWidth`, deltas ÷ `k`).
  ⚠ **THE ORDER LEADS ON THE FRONTIER WORK** (`atl-films`), reversing the first
  two cards: it is what earned the studio the right to run AI itself, and a
  stack opening on the studio has the consequence before the cause. The
  casefile's directory order is untouched — a directory is an index, this is a
  narrative. ⚠ No `data-m` on anything the stack renders — `useRevealMotion`
  collects its targets at `LandingPage` mount and a nested root's nodes rest at
  opacity 0 forever; entrance rides `--pc-enter`.
- **The field follows the FIELD's aspect, not the viewport's.** `.tl-card__field`
  is a size container: the ads count their rows off it, and in a PORTRAIT field
  (the owner's 1920×1247) the four wireframes stack 1×4 and the posters stack —
  the drawings are authored for landscape bays (W/H 2.3–2.9) and printed through
  each other in a 2×2 at the tall shape. ⚠ `data-proof-settled=""` is declared
  statically on the field host (the console and the map's SVG rest at opacity 0
  without it), and ⚠ the map field carries a transparent layer above the
  console: `PdaConsole` owns the wheel while the pointer is on it, which inside
  a sticky stack freezes the page whenever the cursor rests on card four.

## The card, recomposed (ADR-094 U1)

- ⚠ **ONE LADDER, AND THE CLAIM IS THE LEDE'S PEER (U8, owner 2026-09-11:
  _"the smaller text below … can both be a bit larger. Maybe the title …
  can also be increased"_).** Declared on `.tl-card`: `--tl-copy` is the
  lede's size (16 → 19, unchanged) and the ROOT, `--tl-ratio` 1.2, `--tl-sub`
  the sentence one step under, `--tl-display` (24 → 32) the title three steps
  over. The claim takes the lede's SIZE at `--weight-lit`, so claim and
  sentence rank by size and claim and lede by weight — ADR-088's law one
  surface over. The mark is `--tl-glyph`: 21px, 28px on the 940h rung, never
  a value that is not a multiple of 7 (`ProofGlyph.tsx`). Chrome (kicker,
  ordinal, stations, watch bar, bay head) stays 11px PT Mono off the ladder.
  ⚠ Nothing pinned a type size on this card before U8; the smoke now pins the
  claim EQUAL to the lede (an equality, not a floor), weight 500, mark ∈ {21,
  28}, title ≥ 24.
- ⚠ **THE REGISTER IS FOUR RULED BANDS TO THE FLOOR (U8, owner: "a lot of
  unused white space … maybe we need to add some visual elements … I don't
  want to add too much text").** `.tl-card__record` is a grid
  `auto auto minmax(0, 1fr)` (title · lede · register); `.tl-card__claims` on
  `grid-auto-rows: minmax(0, 1fr)`, each band centring its claim + sentence
  (`align-content: center`; `align-items: start` kept so the mark hangs off
  the claim's line); a `--tl-rule` seam above the first band and as the LAST
  rule (it is the column's floor line), `--tl-rule-soft` (.10 → .12) between.
  The RED LINE sheet's grammar (ADR-084) and the Panels references' law: air
  inside a drawn box is room, air under a list is a hole. Bands measure 44px
  at 1280×720, 60 at 1440×800, 150 at 1920×1247. ⚠ `minmax(0, 1fr)`, never
  `auto` — an `auto` row pools the slack under the list again. No new copy:
  the marks grew and the rules are the visual element.
- ⚠ **ONE INSET, ONE FLOOR, ALL FOUR CARDS (U8, owner: "the elements are too
  close to the center border and the right border").** `--tl-field-px` is
  `padding-inline` on `.tl-card__field`, so the rail's stations and the bay
  land on the same two verticals; ⚠ its slope is **`1.25vw`, not `2vw`** —
  the inset comes out of four stations' width, and at `2vw` `BRIEFING AGENT`
  truncated at both laptop shapes (ADR-089 U3's headroom warning from the
  other side); the stations went to `padding: 5px 9px` with it, and the
  leading station's 6px margin moved to `+ .fl-con__stn`. `.tl-field` is
  inset `--tl-field-gap` above and **`--tl-card-py` below — the record's own
  vertical padding** — so every field ends on the register's last rule (three
  cards ran their console to the card's edge, 40px under it). ⚠ Each kind
  that derives a height from `100cqh` (the BAY, which keeps its full box)
  subtracts both terms — the film does; the ads and the map fill their field.
- ⚠ **THE TOOLS BAY IS AN APPARATUS (U8).** `.tl-field--tools` is one
  `--tl-rule` box from under the rail to that floor, rows
  `--tl-bay-head-h | minmax(0, 1fr) | --tl-watch-h` (30 / – / 30): the HEAD
  `.tl-bay__head` letters `IN SERVICE {year}` (`ProjectCase.year`, rendered
  in `ProofField.tsx` — one designation, ADR-064 U1; chrome, not copy), the
  drawing centres in the middle row (`align-self`, auto margins) with
  `--tl-bay-pad` off the walls, and the watch bar is the box's FOOT — full
  width, `--tl-rule-soft` above, cue and label leading, duration at the far
  end. `--tl-wire-h` subtracts every one of those terms from `100cqh`.
  ⚠ **U3's "never `1fr auto`" is superseded HERE ONLY**: it guarded a bar
  that belonged under its drawing from landing on the bay's floor; the bar
  IS the foot now. ⚠ **A bigger bay does not buy a bigger drawing** —
  `.fl-wire__lbl` caps at 10px, vesper's dock at 58px, mímir's rail at 190px —
  so the box is the answer to the void and the aspect is a bonus:
  `--tl-wire-ar` eases 1.62 → **1.5** under `@container (max-aspect-ratio: 1)`
  (a portrait bay, the owner's) and stays 1.62 where the bay is height-bound
  (a lower aspect there only narrows the drawing). All four drawings were
  looked at on stills at 1.5. The smoke pins the box, its head, the drawing's
  clearance, the bar's three edges on the box's, and the register's floor on
  the box's floor.
- ⚠ **THE CLAIM IS THE TITLE AND THE HEAD IS AN ORDINAL** (U3 + U4, owner
  2026-09-10: _"the lines that I said, 'We push the frontiers of AI creative,'
  should replace the title 'AI Above-the-Line'"_, then _"that subtitle …
  in the top-right corner, you can remove that"_). `.tl-card__title` letters
  `arc.title`; `.tl-card__arc` is `arc.step` alone. ⚠ **THE STEP IS THE PEEK
  BAND'S WHOLE JOB NOW** — U1 named the cost of emptying the strip, U2
  answered it with the arc, U3 with the project's name, and U4 took the name
  back out; `01 … 04` differs per card and is an INDEX rather than a second
  title, so the pile still reads as a sequence when the slivers stack.
  ⚠ **`project` LETTERS NOWHERE ON THE CARD** — the claim is the heading and
  the rail names the parts. Pinned from BOTH ends in the smoke (claim up top,
  head is TWO DIGITS), or a name creeping back satisfies neither check.
- ⚠ **THE CARD IS A CHAMFERED HOUSING, TR + BL** (U4, owner: _"all the cards
  in the proof section should have a notch, like on the homepage, in the
  bottom-left and top-right corners"_) — ADR-065's canonical diagonal, and
  its reading of what a chamfer MEANS: a machined housing, which is what a
  card holding an instrument is. ⚠ **A CLIP CUTS A BORDER, IT NEVER STROKES
  ONE** (ADR-089), so the rule is a CLIPPED RING — one polygon, outer contour
  plus inner, `evenodd` making the middle a hole. ⚠ The inner leg is **not**
  `ch − 1px`: insetting a 45° cut by `d` shortens its leg by `d(2 − √2)` ≈
  0.586d. ⚠ **RULE 4 COMES WITH IT AND IT CAUGHT A LIVE MISMATCH** — the
  console still carried `console.css`'s **TL + BR** cut (ADR-065 U2's
  exception, RETIRED by ADR-089 on the casefile, `.fl-case`-scoped so this
  route never got it): one box leaning the opposite way inside another.
  `clip-path: none` on `.tl-card__field .fl-con__console`, route-scoped.
  ⚠ And the card is now a containing block for `fixed` descendants —
  survivable only because `MediaLightbox` portals to `document.body`.
- ⚠ **THE 4:5 CUT PLAYS IN ITS FRAME, NOT OVER THE PAGE** (U4, owner: _"when
  you click on the video thumbnail, it shows the full-screen video. I don't
  want that"_). `CaseFilm.portrait` is `{ poster, src, meta }` — `CaseFilm`'s
  own pair one aspect down — and a click swaps the `<button>` for a `<video>`
  in the SAME box (cut and frame are both 4:5, so nothing reflows under the
  pointer). ⚠ **NOT A BUCKET, AND NOT BY PREFERENCE**: CSP is `media-src
'self' blob: data:`, so "add them to Supabase, whatever" resolves to
  `public/videos/` — transcoded 11 Mbps → 6.8 MB / 1.2 MB, lighter than the
  16:9 masters beside them. ⚠ **STILL NO `<video>` UNTIL A CLICK** (ADR-056
  U5); `autoPlay` is safe because the mount IS the click. ⚠ **THE PLAY STATE
  IS KEYED ON THE FILM'S `src`, NOT A BOOLEAN** — a boolean carries across a
  station switch and starts the next film unasked. ⚠ **THE LIGHTBOX SURVIVES
  WHERE IT EARNS ITS KEEP**: the tools keep theirs because a screen recording
  of a UI is unreadable at card scale.
  ⚠ **"THE SAME BOX" IS A RECT, AND FOR A DAY IT ONLY MEANT A SIZE** (owner,
  2026-09-10: the player _"moves to the left side while it should stay
  centered like the thumbnail"_). `.tl-field--films` centred with
  `justify-content`, which centres the **track** — and its one column was
  `auto`, so the track took whichever child contributed the widest
  max-content. Under the still that was the CAPTION (326.2px at 1280×720,
  against a 250.2px film); under the player it was the `<video>`'s intrinsic
  width, which saturates the track to the full box. With the track filling the
  field there is nothing left to centre and `.tl-film` — which has a definite
  `width` — falls to `justify-items`' start: **121–141px of jump at every
  reference viewport, at an unchanged size**. Fixed by making the track
  definite (`minmax(0, 1fr)`) and centring the ITEM (`justify-items`), which
  also un-did a still that was already 38px off-centre at 1280×720.
  ⚠ **A GRID THAT CENTRES CONTENT-SIZED TRACKS CENTRES WHATEVER THE CONTENT
  HAPPENS TO BE** — so any box whose child swaps element type (an `<img>` for
  a `<video>`, a poster for a player) wants a definite track, not an `auto`
  one. ⚠ **AND THE GUARD COMPARED `{w, h}`**, which is ADR-069 U1's rect-as-
  silhouette one surface later: the size genuinely never moved, so every
  assertion stayed green. It compares the full rect now — ⚠ **measured
  RELATIVE TO THE FIELD, never the viewport**, because `locator.click()` runs
  a `scrollIntoViewIfNeeded` first and the two reads either side of it are
  taken at different scroll offsets (181px of pure `y` drift on a frame that
  had not moved in its panel). That trap is already recorded two bullets
  down; it applies to a rect read just as much as to a scroll baseline.
- ⚠ **THE SHEETS' RAIL READS `THE WORK` · `THE GOVERNANCE` · `THE RED LINE`**
  (U4 took `THE LINE` → `GOVERNANCE`; the owner's 2026-09-10 pass took `THE
ADS` → `THE WORK` and added the article back). They are `CaseSheet.label`s
  in the record, so **the casefile, the portfolio arc and this card move
  together** — and the sheets' `id`s do NOT (`ads`, `line`, `red-line` are DOM
  ids; `data-sheet` and two smokes read them). U4's own reason still holds:
  the tab said "the line" under a band reading THE PRINCIPLE and beside a
  sheet called THE RED LINE. ⚠ A label edit is a THREE-surface change — run
  `trinny-london-smoke`, `services-ring-smoke` AND `arc-portfolio-smoke`.
- ⚠ **THE TAB ROW LIVES IN THE FIELD SINCE U2**, seated on the right panel's
  own top edge at FULL WIDTH — `ConsoleRail`'s native `flex: 1 1 0`, which U1
  had to override for a reason that no longer holds (four stations at 295px
  each across a ~1180px header bar is a divided bar; across a ~700px panel they
  are its frame). Stations are DERIVED (`proof/proofTabs.ts`, pure,
  unit-pinned): a film's handle is its `label` before the middle dot, a tool's
  is `ProjectCase.tab`. ⚠ The MAP and the SHEETS are absent from that table on
  purpose — `PdaConsole` and `SheetsPlate` each own which of their own things
  is open, and a copy here would be a second switch for one piece of state.
- ⚠ **THE STUDIO CARD MOUNTS `SheetsPlate` WHOLE, NOT ITS BODIES** (U3, owner:
  the studio card should have _"tabs, just like on the homepage, where we have
  our guidelines on where not to use AI, governance and the red line"_). THE
  three sheets were all in the record and this card rendered
  the ad wall alone. ⚠ **THE PLATE COMES WHOLE BECAUSE OF TOKENS** — `.fl-cmp`
  and `.fl-caps--sheet` read `--con-hair`, `--con-hair2`, `--fl-chrome-*`,
  `--fl-display`, `--fl-ink-dim` and `--fl-plate-px`, declared on `.fl-case`
  and `.fl-con` **and re-derived for light on those same selectors**; this
  route has neither class and is light-locked, so a route-local copy of the
  dark values renders dark line work on parchment (ADR-058's trap). The
  console brings both themes. Its rail portals through `railHost`, the seam
  U1 built for the map. ⚠ **THE SIX ADS NEED A RESTORE** — `casefile.css`
  hides 4–6 by default and puts them back under `.fl-case` at a viewport rung;
  with no `.fl-case` this route showed three. The bay IS a size container
  here, so the rung is `@container (max-aspect-ratio: 1.15)` — the honest
  test, where the casefile could only use a class as a proxy.
- ⚠ **BOTH THE FILMS AND THE TOOLS PLAY, AND NONE OF THE VIDEO IS NEW** (U3,
  owner: _"we should have a video walkthrough of all these software"_).
  `ProjectCase.walkthrough` and `CaseFilm.src` are the same files the homepage
  plays. ⚠ **TWO OBJECTS, TWO AFFORDANCES**, the homepage's own split: a
  film's control is its own FRAME (a `<button>` with a cue — `.fl-film`'s
  grammar), a drawing gets a LABELLED bar, because a control over a wireframe
  has to say what it opens. One affordance per object; the drawing is not
  clickable. ⚠ `MediaLightbox` portalling to `document.body` is MANDATORY
  here, not tidy: the card is in a `position: sticky` slot inside a clipped
  stack, and a clipped ancestor becomes the containing block even for `fixed`.
  The scroll lock comes with it, which is why nothing has to close the player
  on scroll. ⚠ The still is the 4:5 cut and the player is the MASTER.
- ⚠ **THE WATCH BAR COMES OUT OF THE HEIGHT THE DRAWING SOLVES AGAINST.** The
  bay is the size container, so `100cqh` is the whole bay — bar included — and
  `--tl-watch-h` is subtracted once, in `--tl-wire-h`, used by both the cap and
  the width it derives. ⚠ And the tools field's rows are `auto auto`, never
  `1fr auto`: a `1fr` row absorbs the slack, so `align-content` has nothing to
  distribute and the bar lands on the bay's floor ~300px from its drawing.
- ⚠ **A COVERED CARD'S CONTROLS ARE UNREACHABLE NOW.** The rail, the watch bar
  and the film's frame are in the FIELD, under the card above, where the
  head's tabs used to be in the visible peek band. A harness driving any card
  but the pinned one must RE-SEAT it — and `seatSlot` cannot, twice over: it
  returns early on `covered`, and `rect.top + scrollY` on an already-pinned
  `sticky` slot gives the PINNED position, so `doc − pin` converges on wherever
  it already is (measured 12532 → 12765, `covered` eight passes running). It
  is sound walking DOWN the pile only; `seatPinnedFromTop` rewinds to the
  stack's top and walks, and rewinds again if it overshoots.
- ⚠ **TWO HARNESS TRAPS THAT BLAME THE PAGE FOR THE HARNESS.**
  `locator.click()` SCROLLS its target into view first, so a scroll baseline
  taken before the click is a reading from a different position — measure the
  lock with the player already open. And `page.mouse.wheel` dispatches where
  the POINTER is, wherever the last click left it; a wheel outside the dialog
  is not testing the dialog.
- ⚠ **THE SIZE CONTAINER IS `.tl-card__bay`, ONE LEVEL UNDER THE FIELD** (U2).
  The ads count their rows off `100cqh`, the film derives its width from it and
  the wireframe's bay is `(100cqh − 4px) × 1.62`; left on the field it would
  now include the rail's row and every drawing would be sized against a box it
  does not fill. ⚠ Moving the rail also **SOLVES** the map's portal rather than
  re-opening it: `.tl-field--map::after` is inside the bay, so a rail above the
  bay is outside its box by construction.
- ⚠ **THE CLAIM CARRIES ITS SENTENCE, AND IT NEEDS A 940h RUNG** (U2).
  `CaseBlock.desc` was in the record and unread here. Four 95-character
  sentences are ~170px of ink against a ~424px record column at 1280×720, so
  below the rung they are sr-only — the casefile's own 1070h precedent, same
  arithmetic. The column is seated at the TOP now, not centred. ⚠
  `align-items: start` on the claim, never `center`: grid synthesizes a
  replaced element's baseline from its bottom edge, so a centred glyph sits
  mid-paragraph once the sentence wraps.
- ⚠ **THE ATL FILMS SHOW THEIR 4:5 SOCIAL CUT** (`CaseFilm.portrait`, optional
  and additive). The field is 693×926 at the owner's viewport, where a 16:9
  poster is a stamp with a third of the box empty either side. ⚠ 4:5 is the
  ONLY aspect both films were resized to, which is what lets the rail switch
  without the frame changing size; their durations differ, which is why it is a
  STILL and not a second `src`. ⚠ It carries its own `meta` — `CaseFilm.meta`
  reads "16:9 master · 30 sec" and under a 4:5 still that names the wrong shape
  for the picture above it. ⚠ `LOOP_ATL_FILMS` is `toBe`-pinned and shared by
  reference with the homepage casefile and the portfolio arc; a field only one
  renderer reads changes nothing for the other two.
- ⚠ **THE SKIN IS ADR-089 U3/U4's, RE-POINTED, AND THAT IS THE OWNER'S "I
  wouldn't use a gradient".** Every rule of that pass is `.fl-case`-scoped in
  `casefile.css` and the smoke asserts this route has NO `.fl-case`, so the
  map's rail here was still rendering `console.css`'s original — **four**
  ramps, not one: the dormant station's recess, the lit station's fill, the
  console's gold glow off its top edge (directly behind the rail) and its
  scanline. All four are `.tl-root`-scoped now; the smoke pins
  `background-image: none` AND `clip-path: none` on every station, from both
  ends. ⚠ Fixing it in `console.css` instead lands on `/`, `/arcs/*` and two
  labs, where the markup is byte-pinned.
- ⚠ **CONTENT-WIDTH STATIONS.** `flex: 1 1 0` suits a rail spanning a console's
  top edge; in a header bar with ~1180px free at 1440 it is a divided bar.
- **`PdaConsole.railHost` is the seam, and it is additive.** Given an element
  the rail is portalled there; omitted, the render is byte-identical (the
  `services-ring-smoke` gate). ⚠ **`view` STAYS ITS OWN STATE** — the flight
  between readings is keyed on the transition, and a controlled prop would fork
  that machine. ⚠ It is also what makes those readings PRESSABLE here:
  `.tl-field--map::after` covers the console so its wheel capture cannot freeze
  the pinned stack, and the rail was under it.
- ⚠ **THE WIREFRAME BAY IS LOCKED LANDSCAPE** (`--tl-wire-ar: 1.62`). The field
  is PORTRAIT at the owner's viewport (693×926) and the drawings are authored
  for W/H 2.3–2.9: given the whole box, babylon pooled its transcript rows at
  the top of a 700px table and heimdall's player became an empty column. 1.62 is
  a floor with headroom — ADR-068 U7's `cqw` cap binds below 1.12. The lock
  comes OFF below 960px, where the field is a definite `clamp()` box and
  `casefile.css`'s own flow rung expects to fill it.
- ⚠ **A WRAPPER WHOSE ONLY CHILD IS ABSOLUTELY INSET HAS NO WIDTH TO FALL BACK
  ON**, and this bit twice in one pass: `place-content: center` collapsed the
  bay's track to 0, and on the phone `margin-inline: auto` did the same by
  cancelling `justify-self: stretch` (measured 0×502 with the drawing simply
  absent). Keep the column `1fr` and the margins 0 wherever the width is `auto`.
- **The phone gives the rail its own full-width row** under the client line —
  ADR-083's IA, and it keeps the 44px touch floor `console.css`'s unwrap rung
  exists for. Without it the stations stacked down the head's right edge and
  broke a two-word handle over two lines.
- ⚠ **THE ARRIVAL'S DWELL IS DERIVED, NOT GUESSED.** `margin − n·peek −
bottom-safe` IS the scroll for which a card is pinned and the next has not
  started rising — the viewport height cancels, so `--pc-dwell` buys the same
  beat at 720 and at 1247. It was NEGATIVE before U1. The three arrival
  channels (`--pc-in`, `--pc-in-record`, `--pc-in-field`) window the hook's
  already-smoothstepped `--pc-enter`, so the motion starts late and settles
  before the pin; they OVERLAP on purpose, or the field is a lit plate with an
  empty half in it. ⚠ **The hook is not touched** — it is shared with
  `/test/project-cards`, and `data-pc-state` still comes from the raw channel.
- ⚠ **A SOLVED `y` GOES STALE ON THE STACK TOO.** The smoke's `seatSlot`
  converges on **`data-pc-state`**, the hook's own published value, not on the
  rect: the dwell made the pile ~700px taller and one pre-measured
  `top − pin + 40` stopped reaching card 4, reporting `incoming` on a card the
  still showed seated. Same law as `rollToP` one beat later.
- ⚠ **THE CARD'S MARKUP HAD NO GUARD AT ALL** until U1 — `tl-card` appeared in
  zero test files. The smoke now reads the ruling: the client leads, the name is
  in the record, the stations are flat and square, the field renders exactly one
  film / one drawing, and a click swaps it.

## The interstitial and the proposal (ADR-094)

- ⚠ **`#contact` IS THE DECLARED KILL EDGE** (ADR-095 U5; it was `#trinny`
  until U1 deleted that station, then `#proposition` until U5 made it
  transparent so the mark could fade BEHIND the record instead of dying at its
  top edge — ⚠ **the two earlier ids appear in older notes and neither is
  live**). `useCorridorExitScroll` consults `[data-corridor-kill]` before its
  hardcoded chain; on this page none of that chain's ids sit below the
  corridor, and an opaque station the hook does not name HARD-CUTS the canvas
  at its top (ADR-030 §6). The cover rule in `trinny-london.css` is keyed on
  the SAME attribute — the `#voidwalker` form (relative, z 6,
  `content-visibility: visible`, its own ground), never the transparent
  `#services` form — so JS and CSS cannot name different stations. Exactly ONE
  element carries the attribute (the parse guard counts), which is what makes
  moving the edge an attribute move and nothing else.
- **Both new stations publish `data-station="proposition"`.** The interstitial
  opens the proposal chapter and has no mark of its own; the Proposal mark lights
  from it on. ⚠ A roster-only station resolves DIRECTLY (`rosterDirectId`):
  `resolveActiveIdx` maps an unknown id to index 0, the hero, and the HOME mark
  would light over the proposal with nothing throwing. The direct path never
  fires for a manifest station id and never while the corridor is engaged.
- **The products are alpha WebPs in `public/trinny-london/`** — cut from the
  `shearwater` engagement's harvest, the Naked Ambition roundel cropped off (a
  composited overlay, not the product). ⚠ CSP is `img-src 'self'`: no Contentful
  URLs. ⚠ Since ADR-095 they live in the TURN, not the interstitial, and they
  carry NO `data-parallax` and NO `data-m` — see §The turn below.
- **`--tl-brand-rgb` is a route-local token** (240, 104, 80, the Naked Ambition
  tube). Never a re-derivation of `--gold`: the WebGL golds are exempt from CSS
  by design and would go out of step.
- **The proposal letters no Arc vocabulary, no digit, no "self-sufficient"** —
  `trinny-offer.test.ts` walks `TRINNY_BOARD` (ADR-100; `TRINNY_CONFIGURATION`
  before it) with `PROPOSAL_COPY_BANS` (it was the parse guard's job while the
  record lived in the HTML). Connectors on the offer are 1px DIVS (the wireframe
  law); the board's ribbons are svg paths inside a box the beat owns.
- ⚠ **THE CONFIGURATION IS AN ARC BEAT NOW, AND IT SCROLLS IN (ADR-099,
  2026-09-13, owner: _"the elements from the next section should scroll into
  view"_).** `#proposition`'s record is ONE `[data-tl-config-root]` slot that
  `TrinnyPortals` mounts `ArcConfiguration` into, over `TRINNY_CONFIGURATION`
  in `offer/offerSections.ts` — so it carries the `.arc-head` (eyebrow, origin
  cross, coord stamps) every other beat has, and the owner's "all sections
  have that cross" is answered by the record becoming a beat rather than by a
  rule. ⚠ **DELETED WITH THE PIN**: `.tl-prop__stage/head/lead/title/desc`
  (with the coral rule the owner called a "weird red divider"), the whole
  `.tl-config*` block, `--tp-in`, `data-tl-reveal` on this station, and
  `proposition/usePropPick.ts` — `ArcConfiguration` owns its picker on
  `data-cfg-*`. ⚠ **THE SLOT MAY NOT CARRY `.tl-prop__inner`**: the station's
  banding and the arc's `.arc-band` both apply and the instrument is squeezed
  into a column with the ground beside it; the station gives up its horizontal
  padding too, exactly as `#offer` does one station down. ⚠ **AND
  `.arc-root` PAINTS AN OPAQUE GROUND** — the transparency rule must cover
  `.arc-root` AND `.arc-section`, or the beat mounts on the arcs' own page
  ground with a hard seam at the station's top edge (measured: the coral
  stopped dead at y 811 at 1920×1247, every geometry gate green).
- ⚠ **THE DRAWING IS ONE INSTRUMENT WITH A PICKER (ADR-094 U7, owner
  2026-09-11: the old Aether landing's headless panel is "the composition I
  like").** That composition is unchanged and now renders through
  `ArcConfiguration`: the LAYER they own (four rows — Rules · Examples ·
  Sources · Loops — that DIM unless the picked team reads them), the SEAM (two
  arrows, adoption pointing at the layer, automation pointing back at the
  work), and the WORK (three team tiles, then the picked team's configuration
  read out in the registry's five questions: who owns it · what runs it · the
  bar · what it can reach · where it runs). The three kickers stay. ⚠ **THE
  RECORD CAME HOME RATHER THAN BEING REWRITTEN** — ADR-098 §4 ported this
  drawing onto the arcs surface, and `TRINNY_CONFIGURATION` is the same three
  teams, four layer rows, two seam notes and three kickers lifted verbatim
  from the deleted tiles' `data-*`, so "the same instrument" is a claim the
  diff can carry. ⚠ **THE RESTING STATE IS AUTHORED** (first tile selected,
  its rows lit), so the drawing reads whole with no JS and under reduced
  motion. ⚠ **GOLD IS THE BUILT THING AND NOTHING ELSE**: the lit rows, the
  picked tile, the readout's rule — the plate, the unlit rows and the tiles at
  rest are dawn. ⚠ **THE PICKED TILE IS FILLED HERE** (ADR-089 U4), where the
  pitch page's own cut outlined it; the newer house law wins, and this route
  took it by mounting the arcs' component. ⚠ The mechanical gate reports five
  `accent` findings on `.arc-cfg` (four lit layer rows, the readout's rule) —
  **identical on `/arcs/suri-proposal`**, i.e. the authored gold the ruling
  above asks for, not a regression.
- ⚠ **SUPERSEDED ON THIS PAGE BY ADR-100 (2026-09-13, owner: _"it doesn't look
  bad, but it's a lot of things to look at"_; the beat is the PROBLEM
  STATEMENT; left = their current status, kept simple, right = their
  configuration as an EXPANDED version of the proof's own; not in frames).**
  `#proposition` mounts the `board` kind now — `ArcBoard` over `TRINNY_BOARD`
  (same slot, same `id: "configuration"`, same `.arc-head` and datum): the
  proof's R4 grammar at page scale as TWO svg boards on one row with no plate
  around them, dormant (dashed dawn, the card GREEN-outlined because all the
  work is the people's) beside lit. ⚠ **U2 (2026-09-14) IS THE LIVE DRAWING:
  A LEDGER BESIDE A BOARD.** The dormant side is four ruled rows (a mono key,
  a sans value, hairlines, nothing else) and the lit side is the assembled
  board — the green seat over its drop, THE CONTEXT with four tags, the gold
  CHIP (`AI CAPABILITY` / "owned by the team" — the capability in-house is
  the heart of it), WHERE IT RUNS with four tools as PEERS, three ribbons
  meeting the chip's centre. ⚠ The two sides must NOT mirror each other
  (owner: _"it should be a contrast like before and after, but without
  implying they're unorganized"_) — a ledger is ordered and connected to
  nothing.
  ⚠ **U4 (same day) PUTS THE DRAWING ON THE HEAD'S OWN BAND, DELETES THE
  HEAD STRIPS AND HANGS `WHERE IT SCALES` UNDER THE CHIP.** The heads were
  always pixel-identical to the phases' (title x 360, copy x 1146.7 at
  1920×1247); the DRAWING was on the instrument band, 120px wider per side,
  and that is what he read as the head being "a bit more centered versus the
  other sections" — visible only above the ~1503px crossover. The beat's own
  head margin goes too (45px of air under the dek against every plate beat's
  143). The board is a CROSS now: the seat's green drop in, the gold run out
  of the chip's floor on the same 108 units, the context and the tools at
  its sides. The chip is TOP-RIGHT-ONLY, the silhouette of the plates it
  becomes one beat later. `VB.h` 548, five facts, five ledger rows, 32 wires,
  label sets 10 / 17. See `.claude/rules/arcs.md` and ADR-100 U4.
  ⚠ **AND THEY DO NOT ARRIVE AT ONE SPEED (U3, same day, owner: _"the
  elements from the studio today should move a bit slower into view"_).** The
  board ASSEMBLES, so its rungs overlap into one gesture; the ledger is four
  rows READ IN ORDER, so its rungs are 0.72s at a 140ms stagger (was 0.42/80)
  and its last row lands at 1.30s against the board's 0.92s. The ledger
  finishing last is the point: read first, read slowest.
  ⚠ **EVERY LIT RUNG IS SCOPED `[data-board-state="configured"]`, AND
  WITHOUT IT THE WHOLE LADDER IS DEAD.** The rules that START the animations
  (`.is-arc-js .arc-board.is-in .arc-board__in` / `… __wire`) are FOUR
  classes; a bare `.arc-board.is-in [data-board-role="card"]` is two classes
  and an attribute, so the shorthand wins and `animation:` RESETS
  `animation-delay` to zero. Shipped that way in U1 and measured on
  2026-09-14: every configured module arrived on the same frame, while the
  dormant rules — carrying a second attribute, so they TIE and win on source
  order — staggered correctly. **A delay that does not apply fails silently:
  nothing errors, nothing logs, the still is identical, and it reads as a
  taste decision.** The smoke asserts each ladder is strictly increasing and
  that the ledger's is the slower of the two, from both ends. ⚠ No diamonds, no notes, one sentence in the seat, THE CONTEXT not
  THE LAYER, and both sides share the datum and the floor.
  ⚠ **U1 (same day, owner: _"no, radically simplify it"_) IS THE LIVE CUT** —
  the first cut's bed, two sockets, foot rows, hatched cables, four layer
  sentences, second card row, tool notes and the height-elastic crop (with
  `ArcBoardRow`'s `ResizeObserver`) are ALL deleted; FOUR objects per board,
  one line apiece, 10 / 18 lettered nodes where there were 19 / 38, and the
  svg sits at its own height with the beat's slack pooling at the floor
  (ADR-099's named cost). When he asks for simple, the FIRST cut is the
  minimal one. The picker is gone with the panel; `ArcConfiguration` and
  `.arc-cfg*` are byte-identical for the registered proposals. ⚠ The record is
  the DISCOVERY CALL in roles ("No one, as their day job", "all by hand",
  "not written down") — blunt by design and the owner's to soften; the copy
  law and `arc-board-fit` re-walk any change. ⚠ The beat pays for its
  instrument (`--arc-sec-pad` and the head's margin tightened on
  `.arc-sec--board`): with the arc's defaults the 1280×720 box is 385px and
  the chrome rung falls under the 10px floor. ⚠ The head's margin floors at
  36px — at 24 the head's coord stamp sat on the board's datum label at 720h,
  visible only on the still. Rules for the kind: `.claude/rules/arcs.md` §The
  client model; the numbers: ADR-100 U1.
- **`mobile-section-seams.spec.ts` is `/`-only** — the trinny stations are not in
  its `STATION_IDS`; phones are covered by the capture script.

## The offer (ADR-094 U9)

The proposal's beats after the configuration — phases · loop · needs and keeps
· the fee · the people · next steps · appendix — APPENDED to this page (owner,
2026-09-13, over an arc handoff), rendered by the ARCS' OWN COMPONENTS.
⚠ **SINCE ADR-102 THE PHASES RENDER IN `#proposition`'S SCENE, NOT HERE**
(`TRINNY_PHASES` / `TRINNY_SCENE`; `#offer` opens on the flow with
`startIndex` 2, seven beats). Everything below about the plates' material,
notch and guards still holds — the plate is the same component in a different
station — and `#phases` keeps its id.

- ⚠ **`#offer` IS A STATION WHOSE ONLY CHILD IS A SLOT.** `[data-tl-offer-root]`
  is mounted by `TrinnyPortals` through a second nested root (the proof
  stack's lifecycle verbatim) with `offer/TrinnyOffer.tsx`: an `.arc-root`
  around `ArcListGroups` / `ArcCards` over `offer/offerSections.ts`. The record
  is that module, never the prototype — a second hand-written copy of every
  proposal section is the fork ADR-098 argued against, and the plates and the
  ledger (ADR-098 U2) land here and on `/arcs/suri-proposal` from ONE renderer.
- ⚠ **THE KILL EDGE IS `#offer` NOW** — the first opaque station below the
  corridor (the `.station` base paints the ground; every arc beat paints its
  own void). `#contact` gave it up; the parse guard pins both ends and the
  count. §9's cover rule is keyed on the attribute, so nothing in CSS moved.
- ⚠ **`arcs.css` IS IMPORTED BY THIS ROUTE**, before `trinny-london.css` and
  `theme.css`. Audited: every rule is `.arc-*`-scoped but `#rollout`,
  `html[data-arc-entry]` and the theme-lock switch rule, none of which this
  page can match differently. Its light re-derivation reaches the offer
  through `.arc-root` — the plates' foot is a DARK band on parchment here, and
  the smoke reads that off the computed colours.
- ⚠ **NOT `ArcSectionRenderer`, NOT `ArcShell`.** The renderer statically
  imports every kind incl. the dossier console and the holo program's three.js
  mount; the shell injects chrome this page already has. `TrinnyOffer` is a
  page-local switch over `list-groups` and `cards` plus the reveal opt-in
  (class and observer together) — `trinny-offer.test.ts` fails a beat authored
  in any other kind, which would otherwise vanish silently.
- ⚠ **THE THREE PHASE PLATES ARE NOTCHED TOP-RIGHT, AND ONLY TOP-RIGHT**
  (ADR-098 U4 then U5, owner 2026-09-14: _"redesign the modular approach cards
  so they have the notch"_, then, on the still, _"I don't think we need a
  notch in the bottom-left corner because … it is too close to the text"_).
  The plate's floor IS the inverse DELIVERABLE band and its text is set inside
  it, so a BL chamfer bites the line the reader is on; the head band under the
  TR cut has a short mono kicker and sits clear. **A cut is free only where
  nothing is set against it.**
  ⚠ One corner is lawful by ADR-065's own uniform-set clause — three plates
  of one kind, one nesting level, one scale, on the TOP end of the canonical
  TR + BL diagonal — and a single notch MEANS oriented-or-connected, which a
  numbered sequence of phases is.
  ⚠ **NO `border`: a clip CUTS a border and never strokes one.** The edge is
  a two-contour `evenodd` RING on `::before`, inner leg `ch − 0.586px`.
  ⚠ **THE GUARD IS HIT-TESTED, NOT PARSED** — the computed `clip-path` keeps
  its percentages and `calc()`s, so a pixel-pair regex finds one point in
  five; `elementFromPoint` inside each corner's triangle asks what actually
  painted, and the corner is pinned from BOTH ends. ⚠ Resolving the cut needs
  a probe element: **a custom property is a string until something lays it
  out.** CSS-only, three pages — run `arc-terminal-smoke` too.
- **The journey**: `offer` is in `TRINNY_JOURNEY_ORDER`; the Proposal mark
  RANGES over `proposition` + `offer` (the Arc's device); the sector reads
  05/06 on it (rows are stations, the range is the mark's); the drawer has
  `04 · The offer`. The station's `display: block; padding: 0` is §9b — the
  landing's centred flex station is wrong for seven viewport beats.
- ⚠ **THE COPY IS SURI'S, NOUN-SWAPPED, BY THE OWNER'S OWN INSTRUCTION** —
  "I can change the contents later". `trinny-offer.test.ts` walks it with
  `PROPOSAL_COPY_BANS` and fails on any `Suri` / `Kate` / `Mark` / `Nick`.
- **Capture**: stops `21-offer-phases` and `22-offer-pricing`, rolled to TWICE
  (the arcs' reveal is an IntersectionObserver with a -10 % dead band). ⚠ The
  seam from the pinned proposition into the offer is NOT a stop — shoot it by
  hand (`topOf("offer") − 0.45·vh`) after touching either station.

## The turn (ADR-095)

- ⚠ **`#turn` IS TRANSPARENT AND CARRIES NO KILL.** The canvas must live through
  the whole beat: its cover form is `#services`'s (transparent,
  `content-visibility: visible`) keyed on `data-corridor-exit`, and
  **`#proposition`** — the first opaque station below the corridor since U1
  deleted the interstitial — carries the one `data-corridor-kill`. ⚠ **The child
  cover rule sets `z-index` ONLY** — `home-v2.css` gives `#services > *` a
  `position: relative` that would un-stick the turn's stage.
- ⚠ **NOTHING SLIDES OVER THE TURN (U1, owner: the slab was "an ugly paint that
  just floats over it").** The station is `100svh + runway` with NO overlap
  viewport, so the stage releases in the frame its own progress reaches 1, and
  the beat resolves its own ground instead of being covered. A panel rising
  over this stage is the thing that was rejected; if a seam ever reappears, the
  fix is the wash's resolve, not a cover.
- ⚠ **`align-content` ALIGNS BLOCK CONTENT (Chrome 123+).** The station's base rule
  is a centred grid; the capable rung's `display: block` did not undo
  `align-content: center`, and the stage sat a viewport down inside the 320svh
  station — stuck at p ≈ 0.95 instead of 0.45 with every gate green. The rung
  declares `align-content: start`. When a sticky child pins late, measure its
  `top` at a known `p` before touching the writer.
- **The seam is a MODULE REF, registered in the same layout effect as
  `data-services-ring`** (`brandmarkMorphRef`, three-free): the corridor's parked
  mark reads it ONCE at mount, `load()`s the builder lazily and writes the
  target INTO the existing `aMorphTarget` attribute (never a geometry rebuild).
  Registered only when the capable rung matches. ⚠ `readBrandmarkMorph()` is 0
  without a spec and every consumer is identity at 0 — that is the byte-
  identity proof for `/`, and the HUD snapshots are its gate. ⚠ ONE writer of
  `progress`: `useTurnScroll`. Never write it from a test or a lab.
- **Everything moves as a pure function of `#turn`'s rect** (`turnClock.ts`):
  `p = (vh − top) / (vh + runway)`, `runway = height − 2·vh`; the morph opens at
  0.25 (card 4 covers the mark until it has scrolled ~0.7vh) and settles by
  0.80; the products enter over 0.42–0.97. Reverse scroll unwinds exactly;
  nothing rides a clock (ADR-021, the motion-sickness ruling). The writer parks
  under reduced motion or when the stage does not compute `sticky`.
- ⚠ **THE PRODUCTS CARRY NO `data-parallax` AND NO `data-m`.** The parallax
  channel derives `--py` from the element's LIVE rect — constant inside a
  pinned stage — and writes `translate`, which the writer owns; `data-m` would
  be a second owner of their opacity. Pose is five vars (`--tm-dx/-dy/-dr/-s/-o`)
  through the `translate`/`rotate`/`scale` PROPERTIES, never a `transform`.
  Rest positions are tokens (`--tm-rest-x/-y/-r`) on each modifier class.
- ⚠ **AND THEY LEAVE (U5).** `productExit` mirrors `productEnter` with the
  stagger REVERSED — last to land, first to go — and `productPose` SUMS both
  into one angle and one radius rather than branching, so there is no seam
  where one hands over to the other and no state to get wrong scrolling back.
  `TURN_PRODUCT_OUT` 0.88 LEADS the line's un-type at 0.90 on purpose: the
  stage clears products-then-line and hands a bare warmed ground to the
  proposal. ⚠ The fade is the TAIL, not the gesture — the product is off the
  frame edge before it stops being drawn and `overflow: hidden` does the work;
  a product that dissolved on the spot has vanished, which is a different
  reading from one that left.
  ⚠ **UNTIL U5 THEY NEVER LEFT**, and the smoke pinned `--tm-o ≥ 0.95` at the
  end of the runway — i.e. it asserted the defect. That is what the owner
  named as "a parallax paint flying over it": nothing was clearing the stage,
  so the next station could only arrive by covering it.
- ⚠ **THERE IS NO NEGATIVE-MARGIN OVERLAP ANYWHERE ON THIS ROUTE.** Older
  notes cite `#trinny { margin-top: -100svh }`; that station and that rule are
  both deleted. A panel rising over the turn's stage is the thing the owner
  rejected twice, and U5's answer is a station that does not rise — see below.
- **The mark's three copies derive from `mark/trinnyMark.ts`** (measured numbers,
  not a trace): the SVG asset, the inline fallback (`fill="currentColor"`, hidden
  under `html[data-services-ambient="true"]`), and the 3D target.
  `tests/lib/trinny-mark.test.ts` pins them together. ⚠ Each glyph is ONE
  outline; ⚠ the target is sampled ONCE (the sampler re-fits per call).
- **The pairing is by class and polar rank** (`pairByPolarRank.ts`): one radius
  split (0.42) classifies both marks, ring pairs with ring, the bars with the
  monogram. A change to either mark's geometry re-asks whether the split still
  falls between the base's ring and the target's monogram — the test pins the
  band.
- **THE GROUND IS A SHADER, AND IT HAS NO CLOCK.** `turn/turnWash.ts` is a raw
  WebGL quad on a canvas in the stage; `draw()` runs from the writer's own rAF
  when the scroll moved, never a loop (ADR-021, and a shader that idles burns a
  GPU on a parked page). ⚠ Its colour is READ from `--tl-brand-rgb`, never
  restated. ⚠ **It is a shader for a reason** — a wide, low-contrast ramp on
  parchment bands as a CSS gradient, and the ordered dither is what stops it
  reading as paint; the CSS fallback (`data-tl-wash="css"`, stamped when the
  context is refused) accepts that banding on purpose.
- ⚠ **THE GROUND STAYS, AND THE PROPOSAL CARRIES IT (U4, owner 2026-09-10:
  "the gradient doesn't change colour — when you enter the Trinny section, that
  gradient can stay that shader").** `washOf` holds after its peak and
  `#proposition` paints the SAME shader behind its record. ⚠ **ONE FIELD, TWO
  CANVASES** — the vignette resolves in VIEWPORT space (`uOrigin` / `uView`), so
  the two are one field by construction rather than two that match; computed
  against each canvas's own box they land differently either side of the seam.
  ⚠ **AND IT ENDS BY FEATHERING, NOT BY A CLOCK** (`TURN_PROP_FADE`): a
  scroll-driven resolve measured wrong both ways on a station 1.29 viewports
  tall — wide enough to keep the record on coral and it stepped against
  `#contact`, narrow enough to clear that and the colour went while the drawing
  was still on screen. ⚠ Three defects sat between "it should work" and it
  working, all invisible in the code and obvious in a pixel sample across the
  seam: **the turn's canvas stopped being redrawn** once `p` saturated (which is
  exactly when its stage releases and the canvas starts travelling — a
  viewport-locked field must be repainted when its canvas MOVES, not only when
  its amount changes); **each wash took its station's rect instead of its
  canvas's**; and **the drawing buffer went stale** because `resize()` only ran
  on window events (a `ResizeObserver` on the canvas drives it now). ⚠ The
  fallback rungs hold the same law with `background-attachment: fixed`.
- ⚠ **THE WASH FILLS THE WHOLE VIEWPORT (U2, owner 2026-09-10), AND THE COST
  IS ON THE RECORD.** U1 masked the field out of the outer 7.5 % / 5.5 % off a
  measurement: at full bleed the ground runs under the right rail's telemetry
  and BEARING and LOCAL were both gone at 1920×1247. The owner read that and
  ruled the other way — _"I don't want you to change the reel. Just extend that
  gradient … the color doesn't really clash with our reel"_ — so the mask is
  deleted and the rail is untouched. ⚠ **The peak (× 0.66) is the only dial
  left and NOTHING measures this shader's contrast** (the arcs walk is DOM-only,
  the light walk reads `backgroundColor`); raising it re-opens exactly that
  question with no gate to catch it. Re-shoot 15/16 at 1920×1247 first.
- **THE LINE USES THE HOUSE DECODE, SCRUBBED.** `turn/turnDecode.ts` calls
  `lib/home-v2/captionScramble.ts` — the site's ONE kernel, never a second
  implementation. `scrambleFrame` is pure in `t`, so a scroll-derived `t` is
  reversible for free (the Voidwalker hologram's idiom). ⚠ **`advanceScrambles`
  may not be used here**: it drops finished jobs, and a dropped job is a latch
  scrolling back up would find nothing to unwind.
- ⚠ **THE TURN IS THE ONE LINE ON THIS PAGE ALLOWED "SELF-SUFFICIENT"**
  (ADR-095 U8, owner 2026-09-14). Its paragraph reads "An AI-first approach
  designed to make Trinny's teams self-sufficient." and its title "And now we
  bring this to Trinny London." `PROPOSAL_COPY_BANS` bans the word (ADR-018:
  _say the behaviour_) and the owner ruled it stays HERE, because the proof
  card two beats up says it about Loop's team and this is the sentence that
  carries the claim across. ⚠ The exemption is that one line: the board and
  the offer stay under the law. ⚠ And nothing mechanical walks the turn at all
  — its copy is in the forked prototype HTML, which no scanner reads — so a
  green suite is not evidence the law held on this beat. ⚠ `.tl-turn__sub` is
  `max-width: 52ch`, NOT 44: at 44 the line breaks inside `self-sufficient`
  (a browser breaks at an existing hyphen), which is ADR-098 U1's finding one
  beat over.
  ⚠ **THE CLIENT'S NAME IS BOUND WITH A NO-BREAK SPACE, AND THE LANE IS NOT
  THE LEVER** (owner, 2026-09-14: _"can you put Trinny London on the same line
  below it?"_). The title carries `Trinny London.` in the ghost AND in the
  live layer, so the join travels with the STRING. Narrowing the measure until
  the break falls where it should holds at one viewport and lies at the next:
  the lane is three rungs of `min(px, %)` against type that clamps on `vw`, so
  the characters per line move with both. ⚠ **AND THE HOUSE DECODE KERNEL DID
  NOT KNOW U+00A0 WAS WHITESPACE** — `captionScramble.ts` tested `ch === " "`,
  so an NBSP fell through to the glyph pool and SHUFFLED, un-binding the name
  for the whole decode while the ghost held a two-line box. `isSpace` covers
  both and the branch resolves the character to **ITSELF** (`out += incoming ||
outgoing`), never a hard-coded `" "` — flattening it to a plain space loses
  the join for the same reason. ⚠ One kernel, shared with the corridor's
  caption card, so the fix lands wherever a caller binds a name.
  ⚠ Measured: `And now we bring this to / Trinny London.` at 1920×1247 and
  1280×720; at 1440×800 the lane is 560px against 56px type and it reads
  `… this / to Trinny London.` — the NAME is still whole, which is what the
  binding is for. Named, not fixed: forcing `to` up means widening a lane that
  was solved against the product column.
  ⚠ `tests/lib/trinny-mark.test.ts`'s `FINALS` MIRRORS those three
  strings by hand and moves in the same commit — a stale entry does not fail,
  it decodes a line that is not on the page.
- ⚠ **THE COPY SITS AROUND THE MARK, NOT ON IT (U3, owner 2026-09-10).** Two
  blocks — eyebrow + title above, paragraph + button below — seated off ONE
  pair of tokens, and the pair is the MARK's geometry: `--tl-mark-cy` is the
  weld point `turnClock.ts` also swings the product arcs about, `--tl-mark-r`
  is the ring's on-screen radius. ⚠ **The radius is the fallback mark's own
  expression (`min(25svh, 24vw)`), never a flat percentage** — the WebGL mark
  is a BILLBOARD, so its screen size follows the viewport's HEIGHT on a
  landscape window and its WIDTH on a phone (25 % of the height at 1920×1247
  and 1280×720, 11 % at 390×844). ⚠ The product rests moved OUTBOARD with it:
  they were placed against a centred block that left both top corners free,
  and with the title in that band `London.` ran under a tube at 1280×720. ⚠
  And **the title takes two lines between 961 and 1500px** — the lane cannot
  hold a thirty-character display line beside a product column, and it is the
  BLOCK that narrows; the type ladder does not shrink to fit.
- ⚠ **THE BUTTON IS THE CLIENT'S** — `--tl-yellow-rgb` / `--tl-yellow-ink`, read
  off trinnylondon.com's own `--yellow` and `--brand-grey-1`, which is how
  their hero CTAs are painted (flat fill, square, uppercase). A second
  route-local brand literal beside the coral, for the same reason: it is the
  client's value, so deriving it from this site's ramp would be inventing a
  colour they did not choose. The outline went with the fill — a filled plate
  does not need a rim, and the border made it read as chrome.
- ⚠ **`#turn`'s GRID COLUMN MUST BE `1fr`, AND WITHOUT IT THE WHOLE BEAT IS
  INVISIBLE BELOW THE CAPABLE RUNG.** Every child of the stage is absolutely
  positioned, so an auto track sizes to zero: the stage measured 0 × 844 on a
  phone, the copy's `min(860px, 84%)` resolved to zero and its text overflowed
  into the stage's own `overflow: hidden`. Only the mark survived, being the
  one child with an absolute width. The capable rung escapes it by switching to
  `display: block`, which is why every desktop looked correct. ⚠ **Third time in
  two passes** (ADR-094 U1's wireframe bay and its phone rung were the others):
  **a box whose only children are out of flow has no content width, so any
  content-sized track collapses and every percentage inside it resolves to
  zero.**
- ⚠ **THE PROPOSAL'S HEAD IS A HEADING AND A PARAGRAPH (U3).** The eyebrow read
  `The proposal` over a heading that names the thing, on a page whose journey
  rail already says Proposal — three times in one band. The paragraph lost its
  middle sentence too: the adoption-and-automation loop is what the drawing
  under it draws. The parse guard pins the absence of both.
- ⚠ **`#proposition` IS TRANSPARENT, AND SINCE ADR-099 IT IS NOT PINNED.** U5
  made it a pinned station whose record powered on in place, on the reasoning
  that _an opaque station in normal flow can only ARRIVE by travelling_. It
  bought the blank frame the owner then reported: **a pin cannot begin until
  the thing above it has ended**, so stops `18-turn-resolve` and `19-prop-armed`
  were pixel-identical bare frames, ~1 viewport of held ground with nothing in
  it. The station keeps its id, its bus station, its journey range, its
  transparent cover form and the U6 ground; **the stage, `--tp-in`,
  `propPinnedProgress`, `propInOf`, `TURN_PROP_IN/_LIT`, the ghost/live decode
  pair and `data-tl-reveal` on this station are all deleted**, and its record
  is an arc beat that scrolls in (see §The interstitial and the proposal).
- ⚠ **THE CLOCK IS AN ARRIVAL, AND THE OVERLAP IS ARITHMETIC.**
  `propArrival(top, vh)` = `clamp01((vh − top) / vh)`, one rect read. `#turn`
  is `100svh + 120svh` with a sticky stage, so `p = 1` exactly as its bottom
  reaches the viewport's, and `#proposition` starts `--tl-prop-lead` (50svh)
  above that: the record opens at `p = 1 − 0.5/2.2 = 0.7727` and is **half
  arrived at `p = 1`** (measured live at 0.77). It rises while the products
  leave (`TURN_PRODUCT_OUT` 0.88 → 1.0), which is the owner's fourth ask
  answered by the same change as his third. ⚠ **AND IT DELETES A LATCH** — the
  pinned clock's one asymmetric failure was a station kept with its stage
  removed: `q` pinned at 0 and the record invisible forever. An arrival has no
  such state, which is the durable half of U5's `var(--tp-in, 1)` fail-open.
- ⚠ **`.station` CARRIES 140px TOP / 220px BOTTOM PADDING AT 1920×1247, AND
  THAT IS WHY THE PIN WAS NEVER THE STATION'S TOP** (U5's finding, kept
  because it binds on any future sticky child here): a sticky child travels
  inside its container's CONTENT box, so both paddings come out of the runway
  — 16px of real travel at 1280×720 against a 60svh runway, and the error is
  viewport-dependent, so no literal could have hidden it. The station's
  vertical padding stays 0 on the capable rung.
- ⚠ **THE CORAL RULE IS DELETED (ADR-099, owner: the configuration "has some
  weird red divider").** U5's own bullet — _a rule is part of what it rules_,
  which is why `data-tl-reveal` went on `.tl-prop__head` rather than on
  `.tl-prop__lead` inside it — is retired with the head that drew it. The beat
  carries the `.arc-head`'s eyebrow, origin cross and coord stamps instead.
- ⚠ **`#contact` TAKES `data-m="fade"` AND NOTHING ELSE** (U5). Every other
  role in that system translates. It is not pinned — a page's last card does
  not need a stage — so the scrubbed channel has nothing to key on, and the
  one non-travelling role is the same law with the machinery already in the
  sheet. The parse guard pins the role set.
- ⚠ **THE MARK FADES AGAINST THE PROPOSAL'S ARRIVAL, NOT MORE OF THE TURN'S.**
  `markVeil(p, q)` is ADDITIVE, and since ADR-099 that is load-bearing rather
  than merely safe: `veilOf` saturates at `p = 0.72` and the arrival opens at
  `p ≈ 0.7727`, so the two HAND OVER instead of racing — the turn takes the
  mark to 0.72 and the arrival carries it the rest of the way, landing as the
  record does. The clock test asserts the overlap arithmetic. Ceiling
  `TURN_VEIL_PROP_MAX` **0.94** — a watermark behind the drawing, never 1
  (`brandmarkMorphRef.veil` puts the mark BACK, not away). 0.90 was the first
  cut and measured too present: the ring crossed the layer band. This is the
  one dial on the effect.
- ⚠ **EVERY DECODED LINE IS A GHOST PLUS A LIVE LAYER, AND BOTH HALVES ARE
  LOAD-BEARING.** The kernel keeps the string's LENGTH, but its glyphs are mono
  caps against a proportional sans, so a decoding line is wider than its resting
  self and would re-wrap. The ghost is in flow, transparent, carries the true
  text for the accessibility tree and HOLDS THE BOX; the live layer is absolute
  over it and is the only thing the writer touches. ⚠ The live layer is a LEAF
  (the kernel writes `textContent` and would destroy markup inside it), and ⚠
  **no `data-m` on this copy** — that is the move-and-fade reveal system, which
  is exactly what the masthead law forbids and this replaces.
- **`brandmarkMorphRef.veil` puts the mark BACK, not away.** It multiplies the
  actor's opacity (identity at 0 without a spec) so the line can hold the centre
  with the mark as a ghost behind it. Never 1: the mark stays on the page.
- ⚠ **A HARNESS MUST CONVERGE ON THE PUBLISHED CLOCK, NOT ON ONE SOLVED `y`.**
  The document grows under the scroll as the lazy chunks mount, so a scroll
  position solved before the roll landed at p 0.64 when 0.84 was asked — the
  difference between the line lit and the line mid-decode, and the first still
  showed it. The capture and the smoke both re-solve against `data-tl-turn`
  until it agrees. Capture stops 14–17 are solved for `p`, never guessed.

## The seam into the proposal, and the head's seat (ADR-095 U6 / ADR-099)

- ⚠ **THE LEAD IS A WHOLE VIEWPORT SINCE [ADR-101](../../sentinel/decisions/101-the-configuration-strikes-in-and-the-chip-becomes-the-plates.md) §A,
  AND THAT DELETES THE "HALF" IN EVERY NUMBER BELOW.** The record stopped
  RISING: it is STRUCK in, seated, once the turn is spent, and a strike needs
  the frame before it EMPTY and the thing struck already COMPOSED — which is
  one scroll position, not two. At 100svh `q` reaches 1 where `p` does
  (`q(p) = (p × 220 — 220 + lead)/100`), so `#proposition`'s top IS the turn's
  release (measured 20500 both, pinned to ±2px). ⚠ `TURN_PROP_VEIL_IN`
  0 → **0.384** and `TURN_PROP_VEIL_FULL` 0.5 → **1** went with it: at the old
  lead `q` opened PAST `veilOf`'s end so a 0 start was merely safe, and at
  this one it opens in the MIDDLE of it — two writers on the one channel that
  has exactly one owner. The unit test derives both from the lead it reads
  out of the sheet.
- ⚠ **THE TWO STATIONS OVERLAP BY `--tl-prop-lead`, AND THAT IS WHY THE
  GROUNDS MUST SWAP.** A sticky stage costs ONE VIEWPORT of scroll-off at its
  end by construction, and by the turn's release its stage is empty (products at
  `TURN_PRODUCT_GONE`, line past `TURN_CTA_OUT`) — so that viewport was the
  reader scrolling through nothing. The negative margin takes ALL of it back
  (release → pin 1.00 → **0.00** viewports since ADR-101 §A; it was 0.50 under
  ADR-095 U6, and the guard that pinned "half" now pins zero).
  ⚠ Neither other lever reaches it: the turn's clock is signed off, and
  `--tl-prop-runway` is DWELL, so shortening it changes how long the record
  stays, never when it arrives.
  ⚠ **SINCE ADR-099 THE LEAD IS THE ONE DIAL ON WHEN THE RECORD OPENS**, and
  the arithmetic is stated on the turn's own clock rather than on a pin: `#turn`
  is `100svh + 120svh`, so `q` opens at `p = 1 − lead/2.2` — 0.7727 at the old
  50svh, **0.5455** at 100. Raising the lead starts it earlier and eats further
  into the turn, which the owner has signed off.
  ⚠ **AND THE COVERAGE HALF OF U6's GUARD HAD TO CHANGE ITS QUESTION.** It
  asserted ONE ground covers ≥90 % of the frame — true while the proposal was a
  160svh pinned station whose ground blanketed the viewport alone. Its record is
  a beat now, so past the release the coral FEATHERS (`TURN_PROP_FADE`) exactly
  where `#offer` begins painting (measured at release +0.7vh: the prop canvas
  reaches alpha 1 by y 998 and `#offer`'s opaque top IS 998). The guard measures
  the UNION of the painted bands. **Loosening the number until it passed was the
  alternative, and that is how a guard stops describing the page.** ⚠ A union is
  a sorted-interval merge — the first cut took `max(coral, offerTop)`, where
  `offerTop` is where the band BEGINS, and passed for the wrong reason.
- ⚠ **EXACTLY ONE GROUND PAINTS THE FRAME AT EVERY SCROLL POSITION.** Both
  stations paint a viewport-locked coral wash at the same amount, so wherever
  both are in frame the field composites TWICE and the upper one's edge is a
  hard horizontal band across the viewport (measured: the ground's top edge at
  y=116 with p 0.96). Two halves, and **leaving out either moves the seam
  rather than removing it**: `.tl-prop__ground` reaches UP by the lead (`top:
calc(var(--tl-prop-lead) * -1 - 4px)`) so it covers the frame alone from the
  release; and the turn's wash is switched off at `p >= 1` via
  `data-tl-handoff` on `#turn`.
- ⚠ **IT IS A SWAP, NOT A CROSS-FADE, AND THE STEP IS INVISIBLE BY ARITHMETIC.**
  `washOf` saturates at `TURN_WASH_PEAK` 0.68 and the proposal's is drawn at a
  constant 1, so at the handoff both carry the SAME amount on a field locked to
  the same origin (U4). Identical pixels either side. A cross-fade would be the
  wrong instrument — two half-alpha coats of one field is still two coats.
- ⚠ **THE POLARITY FAILS OPEN, AND THE TWO ATTRIBUTES ARE OPPOSITE FOR THAT
  REASON.** The proposal's ground is hidden by a STAMPED `data-tl-ground="hold"`,
  never by the absence of a channel: one that must be present to paint would
  blank the field on the phone, under reduced motion, and the instant `park()`
  runs. Both are cleared in `park()`. Route law, one station over: an absent
  reveal channel means SHOWN.
- **Both rules key the STATION, not the stage**, so one selector reaches the
  WebGL canvas AND the no-shader gradient (whose opacity rides `--tl-wash`).
- ⚠ **AND THE HERO SEATS ON THE EDITORIAL BAND, WHICH IS THE SAME COMPLAINT
  ON THE OTHER AXIS** (ADR-099 U1, owner 2026-09-14: _"the alignment of the
  hero one and maybe also the paragraph is not consistent with the alignment of
  the two text components in the other sections"_). Every banded text component
  on this page rides ADR-048: the station's `--hud-content-inset` padding PLUS
  `--rail-inset`, landing the edge on `--band-margin`. `#about`'s pair and all
  nine proposal heads do; `.hero__content` took the padding alone.
  ⚠ **IT ONLY EXISTS ABOVE THE 1200px BAND'S CROSSOVER, I.E. ONLY AT HIS OWN
  VIEWPORT** — `--rail-inset` is `--band-margin − --hud-content-inset` and
  resolves to ZERO below it, so hero/band measure 129/129 at 1280×720 and
  145/145 at 1440×800 and **192/360** at 1920×1247. A defect invisible at
  every reference shape is one only a capture at his own window can find.
  ⚠ **JOIN THE BAND, NEVER RE-INSET THE SECTIONS** — ADR-048's own standing
  clause, and the sections are the nine that already agree. `margin-inline:
var(--rail-inset)` on `.tl-root .hero__content` (§3c), the recipe
  `.proof__beat` / `.voidwalker` / the services masthead already use.
  ⚠ Route-scoped by rule 1, and **the homepage has the same divergence** —
  flagged, not taken: on `/` the hero's neighbour is a full-bleed canvas, not
  nine banded heads, so nothing sits beside it to be inconsistent with.
- ⚠ **THE PROPOSAL'S HEADS ALL SEAT ON ONE DATUM, AND IT IS NOT THIS PAGE'S
  RULE (ADR-099 §3, owner: _"make sure the hero one and the paragraph are
  always positioned at the right position"_).** `.arc-sec { align-content:
center }` seats a head by HALF ITS BEAT'S BODY HEIGHT, so a head's position
  is a function of what is under it — measured **0.107 → 0.197** of the frame
  across this page's own beats at 1920×1247, with nothing on any head's box
  saying so. `.arc-root[data-arc-format="proposal"] .arc-sec:has(> .arc-band >
.arc-head)` takes `align-content: start` and `padding-block-start:
var(--arc-head-datum)` = `clamp(48px, 10.7svh, 148px)` — the homepage services
  masthead's own 0.107, which is the value U5 solved for on this station before
  its pin was retired. ⚠ **IT LIVES IN `arcs.css`, NOT HERE**: `/arcs/suri-
proposal` and `/arcs/perfect-ted-proposal` have the same defect for the same
  reason, and a fix scoped to one client's page would be a rule true on one
  surface. ⚠ **`:has()` is the mechanism** — chapter heads, interstitial
  callouts and the close band draw no `.arc-head` and keep centring.
  ⚠ `start` is also the safer overflow: `center` spills equally through top and
  bottom, so `scrollHeight === clientHeight` and every clip gate reports zero.
- ⚠ **THE COST IS STILL THE SLACK POOLING AT THE FLOOR, AND THE ANSWER MOVED
  TO THE DRAWING.** U5 left this open and named the trap — giving the record a
  `1fr` row opens ~185px between the head and the drawing, and _a rule is part
  of what it rules_. With the datum in place the answer is that **the DRAWING
  takes a share of the beat, never the head**: `.arc-flow` carries a
  `min-height: clamp(300px, 46svh, 620px)` for exactly this. Air under a record
  reads as room; air above it reads as a mis-seat.
- ⚠ **THE GUARD ASSERTS THE EQUALITY, NOT THE VALUE.** A fixed frac passes at
  one viewport and lies at another; what was asked for is that the heads agree
  with EACH OTHER — the smoke measures the configuration head's seat against
  the phases head's at two viewports, with the datum's own value checked once
  and loosely. ⚠ **`.arc-reveal` RESTS TRANSLATED**, so a rect read before
  `is-in` measures the animation: the guard waits for the class and the
  transition, which is why it passed solo and failed in a full run.

## The corridor is SHARED, and it moved (ADR-018, 2026-09-10)

- ⚠ **`/` AND `/arcs/trinny-london/proposal` MEASURE BYTE-IDENTICAL THROUGH THE CORRIDOR.**
  Sampled at the same progress stops, every reading matched to the pixel. So a
  corridor complaint read on this route is NOT a route defect, and a fix for it
  lands on `/` and `/claude-workshop` too. **Measure both before scoping.**
- ⚠ **THE THOUGHTFORM COMPOSITION'S SPREAD IS A FUNCTION OF FRAME HEIGHT.** A
  perspective camera's lateral screen offset is `x·vh / (2·d·tan(fov/2))` — the
  frame's WIDTH cancels out of the aspect term — while the copy block caps at
  460 CSS px. So the gutter between the columns grew from 7.2 % of the frame at
  1280×720 to 29.0 % at 1639×1269. `thoughtformSpread()` /
  `thoughtformGateX()` / `thoughtformCopyX()` solve it back to the authored
  proportion, and every Thoughtform-anchored painter reads one of them.
  ⚠ It scales CENTRES, never sizes; the phase labels' gate-relative offsets stay
  undamped because they are welded to a rigid object; and the pan's target is
  `-thoughtformGateX()` or the composition overshoots the axis.
- ⚠ **THE DAMP IS A NO-OP AT OR BELOW 900h**, which is every committed snapshot
  viewport (the Playwright project default is 1440×900). `landing-page.spec.ts
-g "HUD"` must pass WITHOUT `--update-snapshots` — that is the identity proof.
- ⚠ **THE CORRIDOR'S LINEWORK IS NOT DETERMINISTIC ACROSS REPEATED HEADED RUNS.**
  The compass's frames, leaders and pips vanished from one capture and returned
  on the next **with identical code** — the ADR-038 quality governor degrading
  under repeated GPU-heavy Playwright launches. Re-shoot the same code twice
  before blaming a change for missing linework.
- ⚠ **ROLL TWICE INTO A PINNED BAND.** The first long roll from the top is
  clamped while the corridor inflates the document, so the reading is of an
  UNPINNED station — it reported a head frac of 4.1 and read as catastrophic
  rather than as a harness miss. Every probe here re-rolls and verifies
  `scrollY` before measuring.

## The two arrivals (ADR-101 §A, skin per ADR-097 U12)

Owner, 2026-09-14: the configuration's elements _"don't have to fly in. They
don't have to have a movement. They need to have a glitch effect like we have
on our homepage"_, only once the turn has emptied — and the same for the
phases one station down.

⚠ **AND LATER THE SAME DAY THE GLITCH CAME OUT, ON BOTH HOSTS** (ADR-097 U12,
owner, on the live read of the homepage card this route copied: _"it's a bit
too flashy, which could give seizures"_). The flash was countable — three
large-area luminance transitions inside 378ms, ~4 dark↔light alternations a
second, against WCAG 2.3.1's three-per-second general-flash threshold — so it
is not a dial. **Everything below still binds except what PAINTS**: the order,
the lead, the hysteresis, the two hidden states, the fill mode, the delay
property and both ladders are untouched. The skin is the corridor caption
card's centre-out APERTURE (**720ms on `cubic-bezier(0.65, 0, 0.35, 1)`**,
ease-in-out, PURE MOTION with zero fades) — `tl-aperture` · `tl-aperture-close` ·
`tl-aperture-plate` · `tl-aperture-plate-close` · `tl-settle`.

- ⚠ **IT IS THE PROOF CARD'S ARRIVAL (ADR-097), NOT THE HERO'S SLICE-TEAR
  (ADR-060).** Both answer to "the homepage's glitch" and only one can be
  aimed at a live beat: the hero's is a CANVAS that samples the painted page,
  which has nothing to sample until the thing is already visible — the frame
  the effect exists to replace. The card's is CSS on the object itself, and it
  materialises a COMPOSED thing in place. ⚠ **COPIED as `tl-aperture*` into
  the route sheet, never imported** — a route sheet reaching into a landing
  sheet is a dependency in the wrong direction, and the arcs already say so of
  `pda.css` one object over. U11's band comb, power-on curve and chromatic
  resolve were copied here first and came out with U12; the COPY is the
  durable half of this bullet, not the keyframes it happened to name.
- ⚠ **THE TRIGGER IS A HYSTERESIS AND `await` IS NOT `out`.** `arriveNext`
  (pure, unit-pinned) is ADR-021's one sanctioned exception: a bounded burst on
  a hysteresis, because a burst has a DIRECTION and a progress value does not.
  Both hidden states paint identically; `out` plays the 260ms reverse and
  `await` has never been seen, and collapsing them strikes the record out on
  the way IN. NaN leaves the state alone; a deep reload seeds `in`.
- ⚠ **`PROP_ARRIVE_IN` IS 0.99, NOT 1, AND THAT IS MEASURED.** `propArrival`
  clamps, so `q === 1` needs the station's top at or above zero EXACTLY — and
  every converging roller here lands at top **0.22px** (q 0.99983) with the
  record hidden and every stamp correct. **A threshold no measurement can rest
  on fires by luck.** What the ask actually wants is that the frame be EMPTY,
  so that is what is asserted: at q 0.99 the turn's `ctaInkOf` is 0.0009 and
  the loudest product is 0.0054. ⚠ The guard walks ALL FOUR products — the
  exit stagger runs BACKWARDS, and a spot check on k = 3 reads seven times low.
- ⚠ **THE SCENE'S CLOCK `sv` JOINS THE WRITER'S DELTA GATE (ADR-102; it was
  the seam's `t` under ADR-101).** `p` and `q` both saturate the frame the
  record lands and agree forever after, which is the whole of the scene's
  scroll; gated on those two the scene is never written. ⚠ **AND NOTHING THE
  SCENE MOVES EXISTS WHEN THE WRITER MOUNTS** — the configuration's root is
  lazy, so a `querySelector` in the effect body returns null FOREVER, which
  reads as a scene that never opens with nothing throwing. Resolved in
  `measure()`, re-run from a `MutationObserver` on the slot's subtree (see
  §The scene for why a `ResizeObserver` on the slot goes blind). Found by
  looking at a still.
- ⚠ **TAKING AN ANIMATION AWAY TAKES WHAT IT WAS HOLDING UP.** ADR-100's
  ladder rests `.arc-board__in` / `__bloom` at `opacity: 0` and the ribbons at a
  full dash offset, relying on `forwards` fills to put them back; with the
  ladder replaced and the strike ending on the cascade the board struck in and
  then vanished on its own last frame. Both resting states are restored
  route-scoped, beside the neutralised `.arc-reveal` rise.
- ⚠ **EVERY DELAY RIDES `var(--tl-gl-d, 0ms)` INSIDE THE SHORTHAND.** That is
  ADR-100 U3's lesson taken properly: a shorthand cannot reset what it is
  READING, so the per-rung rules set a property and there is no specificity
  race left to lose. ⚠ `animation-fill-mode` is **`backwards`**, never
  `forwards` — the last frame is already the cascade's identity, but a delayed
  rung without it sits lit for its delay and then snaps to zero.
- ⚠ **ONE APERTURE KEYFRAME NOW (ADR-102 took the plate's).** `tl-aperture`
  is OVERSCANNED by `--tl-gl-o` 48px with an identity frame larger than the
  box (the head hangs its designation, origin cross, two coord stamps and
  close cross OUTSIDE its border box, and a 0 → 100% clip guillotines all
  four); it also serves `.arc-board__svg`, which sweeps as a WHOLE object.
  ⚠ Its CLOSED frame is the open one with every **X at 50% and every Y
  untouched** — purely lateral, point for point. ⚠ **AND IT IS NARROWED TO
  `#configuration .arc-head` AND SCOPED `:not([data-tl-scene-past])`**: the
  phases' head lives in this station too now and opens on the scene's own
  clock, and a strike may never replay over a folded board (§The scene).
  `tl-aperture-plate(-close)` is deleted — a plate UNROLLS out of the band the
  chip became.
- ⚠ **THE CHROMA IS DELETED, AND SO IS THE DIAL IT LEFT OPEN** (U12). It rode
  `.arc-plate__row` / `__foot` and never the opaque plate (`filter` applies to
  the whole rendered output and the clip lands AFTER it, so a split on the
  plate is clipped away) — and on parchment its 1.16 brightness GREYED the ink
  for ~70ms, which was recorded here as the one dial. A brightness pulse is a
  luminance flash; the rows and the foot are revealed by the plate's own sweep
  now, which is the caption card's law and one less thing between the reader
  and the plate. **Nothing inside a plate animates.**
- ⚠ **`visibility: hidden` AND `pointer-events: none` WHILE A STATION WAITS.**
  The stations overlap by a whole viewport, so for the turn's last screen
  `#proposition` is laid out directly over the turn's own button; a transparent
  box swallows the one link that beat offers. The smoke asks it from the LINK's
  side (`elementFromPoint` at the CTA's centre). (The plates' own hold is the
  scene's `data-tl-plate="held"` now — §The scene.)
- ⚠ **AN ABSENT STAMP MEANS SHOWN.** `park()` removes both, and parked is the
  phone, the short window and reduced motion. This route's own polarity law one
  station over (the ground's, ADR-099). Pinned by its own smoke case: if it
  ever meant HIDDEN, the readers who cannot see the burst would be the readers
  who cannot see the record, and nothing else would fail.
- ⚠ **`animationName` IS THE DECLARATION, NOT THE STATE.** It keeps naming the
  keyframes long after the burst ends, so "did it finish" is asked of
  `getAnimations()`. `settleStrike` waits on `.finished` with a `catch` (an
  animation cancelled mid-flight REJECTS) rather than on a timeout — a
  arrival's length is a LADDER (1.60s to the ledger's last rung), not a
  duration.
- **The ladders.** Board 640ms — card 80 · seat 160 · lane seat 240 · lane
  layer 300 · layer 360 · lane tools 360 · tools 440 · lane reach 480 · reach 560. Ledger 960ms — seat 80 · layer 220 · card 360 · tools 500 · reach 640.
  (The phases' ladder left with ADR-102.) ADR-100 U3's "read first, read
  slowest" survives the change of mechanism, TWICE — the rungs and both
  durations are byte-identical under U12's `tl-settle`, because replacing that
  ladder with a per-part aperture would have deleted an owner ruling to buy
  one more sweep (and a `clip-path` percentage on an SVG `<g>` does not
  resolve against a per-group box in any case).
- ⚠ **THE SWEEP IS EASE-IN-OUT, AND BOTH HOSTS CARRY ONE PAIR OF NUMBERS**
  (owner, same day: _"a bit more subtle … a bit too fast … easy in, easy
  out"_). The caption card's expo-out is 84 % open at 90ms — fine at its own
  509px, 2.5× too fast in pixels on objects this size. 720ms in / 420ms out on
  `cubic-bezier(0.65, 0, 0.35, 1)`, matching `proof-stack.css` exactly; change
  one and change the other. ⚠ `tl-settle` keeps its OWN curve and both
  durations (640 / 960) — it is a fade on ADR-100 U3's ladder, not the sweep,
  and that ruling is stated in those two numbers.
- **Left open:** the two durations (720 / 420); the beats below `#phases`
  keeping the plain rise (the owner asked for "the next section").

## The scene (ADR-102)

Owner, 2026-09-14, on ADR-101's flight: it _"jitters and lags"_; _"once you
enter the studio today, the AI capability card almost immediately starts
moving"_; _"all the cards surrounding it … need to collapse inwards so it feels
like one configuration. Only then does it need to move"_; _"AI capability
should first move to the utter left and then the other card should open up to
the right of it"_; a plate's reveal must _"evolve … from the upper part of the
cards that has moved from the previous section"_; the title revealed too, the
paragraph _"only after all the cards have been revealed"_.

- ⚠ **THE JITTER WAS A MAIN-THREAD WRITER AGAINST A COMPOSITOR SCROLL, AND THE
  CURE IS A FRAME IN WHICH NOTHING MOVES.** ADR-101's carrier was posed in
  document space from a rAF while it had to move smoothly relative to a page
  the compositor was scrolling — §3's hero curtain already measured that
  failure on this route: _one wheel step of displacement, every step_. No
  easing hides a frame of lag. `#proposition` is a sticky SCENE now (the slot
  is the stage, `100svh` inside a station of `100svh + --tl-scene-runway`),
  the PHASES beat renders inside it seated absolutely over the board
  (`TRINNY_SCENE`; `#offer` opens on the flow, `startIndex` 2), and the
  carrier lives INSIDE the stage. The chip, the three bands, the carrier, the
  title and the paragraph are all stationary while the clock runs. Measured:
  the stage's top at 0.00 across eight wheel steps of the slide and the
  carrier's box within 0.01px of its own pose on every frame.
  ⚠ **THE PLATES' FEET MUST FIT THE STAGE, AND THE BEAT'S BOX CANNOT SEE
  WHETHER THEY DO.** Inside the stage `#phases` is `inset: 0`, so its box IS
  the stage and ADR-100's "one viewport" read on the beat passes whatever the
  content does; the plates' feet ran 23.7px past the frame at 1280×720 (the
  last line of the DELIVERABLE band, for the whole settled dwell) with every
  gate green. A bottom-pad trim was the first answer and changed NOTHING —
  the datum seats the head at `start` and content flows from the top, so the
  bottom pad is never in the sum. The head's own margin is: under
  `(max-height: 760px)` both heads in the scene take the terminal cut's
  `clamp(28px, 5.5vh, 72px)` (39.6px at 720h; feet at 718.5). Both, so the
  ADR-100 guard on the two margins stays equal. The smoke's last ADR-102 case
  measures the plates' feet against the stage's bottom at both ends.
- ⚠ **THE PIN CANNOT BEGIN BEFORE THE RECORD, BY ARITHMETIC.** ADR-099's blank
  frame was a pin that began while the record was still rising; under
  ADR-101's 100svh lead q = 1 IS the station's top at the frame's top, which
  is the frame a sticky child pins on. Struck in and pinned on one frame.
- ⚠ **THE LAYOUT IS KEYED ON THE WRITER'S STAMP AND FAILS OPEN.** The
  station's height, the slot's pin, the phases' seat and the sticky canvas
  all hang on `data-tl-scene`, written only once the board, its four role
  groups, the three plates and their heads have resolved AND the slot has
  been verified to compute `sticky`; `park()` removes it. Absent — the phone,
  the short window, reduced motion, a root that never mounted — the station is
  two flowing beats with the arcs' own seam: the inert page. Pinned by the
  reduced-motion case.
- ⚠ **THE CLOCK IS IN VIEWPORT UNITS, NOT NORMALISED.** `sv` = how many
  viewports the station's top has passed the frame's top (`sceneProgress`),
  published as `--tl-scene` / `data-tl-scene`; every window in `turnClock.ts`
  is authored in svh, so a runway edit can only TRUNCATE the scene.
  `trinny-seam` reads `--tl-scene-runway` out of the sheet and pins
  `SCENE_END` under it. Windows: DWELL 0–40 · WITHDRAW 40–70 · FOLD 58–109
  (reach · tools · layer · seat, 7 apart) · HAND-OVER 112 · SLIDE 114–150 ·
  TITLE 134–164 · UNROLL 152–178 / 200–226 / 248–274 · COPY 165–198 /
  214–246 · PARAGRAPH 278–302 · SETTLE to 318 · runway 325.
- ⚠ **A NODE SHRINKS BEFORE IT TRAVELS, AND IT IS GEOMETRY.** The roles paint
  seat · layer · card · tools · reach, so the tools and the reach paint OVER
  the chip; a full-size node sliding to the chip's centre crosses its edge on
  top of it. `foldPose` shrinks over the first 70 % of the node's window and
  travels over the last 70 %; the unit test walks the board's own boxes and
  asserts scale ≤ 0.1 at the crossing. The fold is the CSS `transform`
  PROPERTY on the role `<g>` (`transform-box: fill-box`), identity at `sv` 0
  — `getBBox` is blind to it, so the board's overlap walk is measured there
  and nowhere else (`arcs.md`'s amended rule). ⚠ **The seat lane retracts
  with the opposite dash sign** — it is drawn from the seat DOWN to the chip,
  the other three from the chip outward.
- ⚠ **THE WITHDRAW, THE TITLE AND THE PARAGRAPH ARE ONE SCRUBBED APERTURE**
  — `.arc-ap`'s form (`clip-path: inset(-o calc(50% − ap·(50% + o)))`), on
  the two head COLUMNS never on `.arc-head` (which carries the arrival's
  keyframe animation on the same property), overscanned by `--tl-gl-o`.
  Every channel's absent value is 1 = shown. No `transition` on any scrubbed
  property — smoothing is lag by another name; the smoke pins
  `transitionDuration` 0s on every one.
- ⚠ **THE CARRIER IS BORN AT THE HAND-OVER AND THE COPIES ON THE BANDS THEY
  PEEL OFF.** Carrier 0 is the chip's box (live off the svg's rect, in the
  STAGE's coordinates — never assumed (0, 0): `.station` is `100vw` with
  `margin-left: calc(50% − 50vw)`) until its slide opens, then `lerpRect` to
  plate 1's band; carriers 1 and 2 start pixel-identical on the band before
  and land on the band after. `data-tl-chip="away"` hides the WHOLE card
  group now, outline included — the ribbons have retracted, there is no
  socket. `left/top/width/height`, not `translate` (a transformed box
  rasterises text on a different sub-pixel grid than the layout-positioned
  band). ⚠ **The words start LATE (`SCENE_DECODE_START` 0.2) and land early
  (0.9)**: a decode from zero shuffled the real band's own words under the
  reader while the copy still stood on it — seen on the still, not by a gate.
  One wall per carrier over both of its lines.
- ⚠ **A PLATE IS HELD, THEN UNROLLS, THEN RESTS ON `arcs.css`'S OWN CLIP.**
  `data-tl-plate="held"` is `visibility: hidden` (nothing of it paints until
  its band lands); `unroll` is the route's polygon with the bottom edge at
  `--tl-unroll-y` (px, from the band's `offsetHeight` to the plate's), the
  top-right cut intact and the ring clipping with the plate so the travelling
  edge carries no rule; the writer REMOVES the stamp once the plate is whole,
  so the notch guard reads the resting clip untouched.
- ⚠ **THE GROUND'S CANVAS IS VIEWPORT-SIZED AND STICKY INSIDE THE GROUND.**
  A canvas spanning a four-viewport ground is a ~24-megapixel shader pass per
  scroll frame. ⚠ **`.tl-prop__ground` LOST ITS `overflow: hidden` FOR IT** —
  an ancestor with a non-visible overflow is a scroll container, and the
  canvas would have stuck to the ground's own never-scrolling scrollport:
  frozen one viewport above the station, the frame bare, every geometry gate
  green. The feather is a PAIR now (`vec2 uFeather`, `feather()` mapping the
  ground's bottom edge into the canvas's own fractions each frame, solved
  against the CANVAS's rect so the ramp is continuous across the frame it
  unsticks); `TURN_PROP_FEATHER_VH` 0.84 is the old 0.42 of a two-viewport
  canvas. The grounds-union smoke reads the CANVAS's rect with the GROUND's
  opacity (the hold is stamped on the ground) and samples the scene's release.
- ⚠ **`data-tl-scene-past` IS A LATCH, CLEARED ONLY WHEN THE RECORD STRIKES
  OUT.** A deep reload mid-scene seeds `in` and would replay the settle ladder
  over a folded board, so every `animation:` under `[data-tl-prop-arrive="in"]`
  is scoped `:not([data-tl-scene-past])`. ⚠ Cleared on the way BACK it
  re-matches every one of those rules, and a rule that starts matching again
  RESTARTS its animation — measured: eleven animations running at the pin on
  the way back up, the whole strike replaying over a board the reader was
  scrolling back through. Pinned from both ends (the reload case; the
  scene walk's return to `sv` 0 with nothing running).
- ⚠ **FOUR SILENT TRAPS, EACH FOUND ON THE READOUT OR THE STILL.** (1)
  `measureSeam`'s probes mutate the subtree the `MutationObserver` watches —
  `relayout()` drains `takeRecords()` after every measure, or the tab hangs in
  a microtask loop with nothing thrown. (2) A `ResizeObserver` on the slot is
  blind once the slot is a fixed-height stage — mounting no longer changes
  its box; the `MutationObserver` is the mount signal and the carrier layer's
  own per-frame text writes are filtered out of it. (3) A React root's first
  `render` CLEARS its container — the layer is mounted from `measure()`, never
  at effect time. (4) `−top / vh` at the pin is `−0`, which prints `-0.00` on
  the stamp the harness converges on.
- ⚠ **`rollToS` CONVERGES ON THE STATION'S RECT, NEVER THE STAGE'S AND NEVER
  THE PUBLISHED CLOCK AT ITS FLOOR.** The stage is sticky, so its rect reports
  wherever it is pinned (rolling to it converges on wherever the page already
  is), and `sceneProgress` clamps (`rollToT`'s lesson, ADR-101). The station
  is a layout fact; several passes, because the lazy root's stamp grows it by
  three viewports on first entry.
- **Named, not fixed:** the plates and the title sit on the coral wash rather
  than `#offer`'s parchment (the scene is in `#proposition`); tools and reach
  paint over the chip in DOM order (the shrink hides it); the runway's length
  is the owner's read; `useJourneyMarks`' LOCAL readout runs 0 → 1 over four
  viewports on this station; dark, as ever on a light-locked route.

## The seam: the chip becomes the plates (ADR-101 §B) — RETIRED BY ADR-102

⚠ **Everything below is the record of ADR-101 §B and is SUPERSEDED on the
mechanism** (the document-space layer, the three-window sum, the socket
outline, one wall for six pairs). What survives is B.0 (one material — the
plates' head and foot paint the chip's wash, house-wide), B.4 (the probes and
the measured baseline) and B.5 (the house decode kernel, never
`advanceScrambles`). Read §The scene above for what is live.

Owner, 2026-09-14: _"The AI capability card at the center moves into the
center of the screen, and then it copies itself left and right. That becomes
the cards from the 'We propose a modular approach' section … I don't want
fucking cross-dissolves. This really needs to be an elegant transformation of
the element."_

- ⚠ **ONE MATERIAL, SO THERE IS NOTHING TO CROSS-FADE.** `--arc-gold-wash` is
  on `.arc-root` (0.12, re-derived 0.18 in light) and the board's own
  `--arc-board-gold-wash` ALIASES it; the plate's head band paints that wash
  over the plate's sheen with the 2px `--gold-line` rule STOPPING AT THE CUT,
  which is the chip's material exactly. ⚠ **The foot takes the same wash, which
  retires ADR-098 U2's inverse band** — a slab of solid ink under a head made of
  the chip's material says the plate is two things, and `--arc-seam` above it
  does the dividing. ⚠ The RING becomes visible over the foot, and that is the
  point: U2 relied on the inverse band bleeding to the silhouette to CAP the
  plate. ⚠ House-wide (one renderer, three proposal pages); measured in light,
  head and foot composite to the identical `rgb(223,208,180)` with `--gold-ink`
  at **4.81:1**. ⚠ The chip's second line takes `--weight-lit`, because it
  becomes the plate's name and PP Neue Montreal is STATIC — a weight that
  changes mid-flight snaps.
- ⚠ **ONE SUMMED EXPRESSION, NEVER A BRANCH.**
  `C(t) = chip + e1(centre — chip) + e2(park — centre) + e3(head — park)`, with
  the three ramps over DETACH [0, .25], SPLIT [.25, .55] and SEAT [.55, 1] —
  `productPose`'s own law one station up. No seam where a window hands over, no
  state to get wrong scrolling back, continuity pinned at 1e-9.
- ⚠ **`chip` AND `head` ARE READ LIVE, EVERY FRAME, AND THAT IS THE WHOLE
  CLAIM.** Both boxes move under the scroll, so a pose solved against a
  remembered rect lands where that rect used to be. The two WELDS measure
  **0.00px on all four terms** at t = 0 and t = 1. Off by a few pixels at
  either end and the reader sees exactly the jump a cross-fade was avoided to
  prevent. ⚠ The MIDDLE carrier holds still through the split (plate 2's
  column centre IS the frame's centre, 956.95 against a client width of 1914),
  so it reads as two copies peeling OFF one object.
- ⚠ **THE LAYER IS ABSOLUTE IN DOCUMENT SPACE, ON `document.body`, NEVER
  FIXED.** The chip and the heads are glued to the page; a fixed carrier is
  composited against the VIEWPORT, so a missed frame leaves it where the
  scroll used to be while the things it welds to have moved. `document.body`
  because an absolute whose containing block is the INITIAL one is in document
  space — and giving `.tl-root` a `position` would re-home every absolutely
  positioned descendant of the page root. `z-index: 12` (over the stations'
  10 and the caption overlay's 11, under the HUD's 50).
- ⚠ **THE CHIP IS HIDDEN, ITS OUTLINE IS NOT.** Four ribbons still run to that
  box, so a seat that vanished would leave them ending in the middle of the
  board; what stays is the SOCKET, dashed, which is the dormant side's own
  grammar. `data-tl-heads="hold"` hides the plates' head bands by
  `visibility` alone — the body has to keep painting under a band in flight,
  which is why §A hides a waiting plate the same way. Both stamps fail OPEN.
- ⚠ **EVERY TOKEN IS RESOLVED THROUGH A PROBE.** A custom property is a STRING
  until something lays it out, and this layer sits outside `.arc-root` where
  none of `--arc-*` resolves at all; the probe goes inside the element that
  OWNS the token. The edge colour is lerped in JS and written as a literal
  `rgba()`, which needs no `color-mix` fallback branch.
- ⚠ **AND A `display: none` LAYER MEASURES ZERO.** The baseline probe ran while
  the layer was `hidden` and reported **0**, which places each span's BOX top
  on the chip's BASELINE and drops its text **18.85px** — nothing errors,
  nothing else moves, and it reads as the words having been placed by eye. It
  is un-hidden for the measurement and restored after (delta 0.01px).
  ⚠ The baseline itself is MEASURED (a zero-size inline-block at
  `vertical-align: baseline`), never derived from a font table, and the leaves
  carry the PLATES' own line-heights — at `line-height: 1` the name lands
  1.7px high on the hand-over frame.
- ⚠ **THE WORDS DECODE ON ONE WALL.** Six pairs, the longest pair's duration,
  or `M1` lands while `Creative operations and scaling` is still shuffling and
  three bands resolve at three moments. The ends are STRING-EQUAL (those two
  frames are the welds) and the decode finishes at **90 % of the seat**, so
  the last stretch is a pure geometry move and the hand-over carries no
  half-shuffled glyph. Never `advanceScrambles`.
- ⚠ **`rollToT` CONVERGES ON THE BEAT'S RECT, NOT ON THE PUBLISHED CLOCK.**
  `seamProgress` CLAMPS, so every position above `#phases` reads 0.00 and a
  `t = 0` target "arrives" two viewports short with every assertion downstream
  reading a page nowhere near where it was asked for. **A clamped clock is not
  a convergence target at its own floor.** ⚠ And the plates must have STOPPED
  STRIKING before their heads are measured — §A's burst animates
  `translate: 2.5px 0` on the plate, so a head read mid-strike is up to 2.5px
  from where it settles and the harness is moving its own target.
- **Left open:** the plates in DARK (all four proposal routes are light-locked,
  so that value has never been looked at — ADR-100 U1's own note one object
  over); and the carrier crossing the board's other modules through the
  detach, which is what a single travelling object does.

## Verifying

```bash
npx vitest run tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx tests/lib/trinny-proof-order.test.ts tests/lib/trinny-proof-tabs.test.ts tests/lib/trinny-mark.test.ts tests/lib/theme-lock.test.tsx tests/lib/cases-registry.test.ts tests/lib/rail-instrument-marks.test.ts
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop   # UNCHANGED — the morph's identity-at-0 proof
# ⚠ THE RECORD IS SHARED: `CaseTrack.arc` and `CaseFilm.portrait` are additive
# and optional, so these two must pass UNTOUCHED or the change was not additive.
npx playwright test tests/visual/services-ring-smoke.spec.ts tests/visual/arc-portfolio-smoke.spec.ts --project=desktop
node scripts/capture-trinny-london.mjs --vp 1920x1247 --port <port>
node scripts/capture-trinny-london.mjs --vp 1280x720 --port <port> --out .cursor/trinny-shots/1280
```

⚠ **THE CAPTURE'S CONFIGURATION STOPS ARE SOLVED FOR `q`, NEVER FOR `topOf`.**
Since ADR-099 `q` is `propArrival` — the station's arrival, not a stage's
travel — so the station's top at the viewport top is `q = 1`, not 0. The stops
are `19-turn-empties` (`rollToQ(0.95)`) and `20-config-strike` /
`20b-config-struck` / `12-proposition` at full arrival; `rollToQ` converges on
the published `data-tl-prop` exactly as `rollToP` does on `data-tl-turn`.
⚠ **THE SCENE'S THIRTEEN STOPS ARE SOLVED FOR `sv` ON THE STATION'S RECT**
(`21-scene-dwell` … `33-scene-settled`, ADR-102), then the offer's `34-offer-flow`
/ `35-offer-pricing`. The seam IS a stop now; look at every one of them — the
first cut's two defects (a missing layer, a replayed strike on the way back)
were on the readout and on the still, and on no gate.

⚠ **EDITING THE PROTOTYPE HTML FIRES NO HMR, AND A TAB THAT IS ALREADY OPEN
WILL NOT SHOW IT.** `landing-trinny-london.html` lives under `public/`, so it is
outside the module graph: `lib/v7-parse` re-reads it on the next REQUEST, but
nothing tells the browser to make one. Editing `trinny-london.css` in the same
pass _does_ fire HMR and hot-swaps the stylesheet in place — so an open tab ends
up with the NEW CSS over the OLD server-rendered body, which is worse than
either alone: rules keyed on markup that is not there yet simply do not apply.
It cost a review round on 2026-09-10 (the split copy's `--over` / `--under`
carry the seating, so the old single block fell back to the stage's top edge and
read as "you didn't do it"). **Hard-reload after touching the prototype, and say
so when handing the page over.**

⚠ The capture is **headed and at the owner's own viewport** — every reference
viewport in this repo is landscape while he runs a tall window, and headless
leaves the corridor canvas dead. **Look at the stills**: every defect this
route has found was invisible to a green gate. ⚠ The in-app Browser pane
cannot drive a scripted scroll while hidden (its animation frames stall), so
the capture script is the way to see the page.

**Process:** [sentinel/MAINTENANCE.md](../../sentinel/MAINTENANCE.md) — Cycle B
when adding a section, Cycle A after fixes.
