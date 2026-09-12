---
paths:
  - "app/(marketing)/trinny-london/**"
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

- [ADR-095](../../sentinel/decisions/095-trinny-turn-particle-morph.md) — the turn: the registry seam, the shader's second home, the measured mark, the polar-rank pairing, the beat's clock. ⚠ **U1 deleted the interstitial slab**: the ground changes under a shader instead and the line decodes in place over it. ⚠ **U5 (2026-09-10) DELETED THE SECOND SLAB** — the products LEAVE on the turn's own clock, `#proposition` is transparent and PINNED with its record powering on in place, the mark fades behind it, and the kill edge is **`#contact`**
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
  the parse guard walks its text. Connectors are 1px DIVS (the wireframe law).
- ⚠ **THE DRAWING IS ONE INSTRUMENT WITH A PICKER (ADR-094 U7, owner
  2026-09-11: the old Aether landing's headless panel is "the composition I
  like").** Three `.tl-config__band`s on one hairline plate: the LAYER they
  own (four rows — Rules · Examples · Sources · Loops — that DIM unless the
  picked team reads them), the SEAM (two arrows, adoption pointing at the
  layer, automation pointing back at the work, each a 1px `<i>` run with a
  border-drawn head), and the WORK (three team tiles, then the picked team's
  configuration read out in the registry's five questions: who owns it ·
  what runs it · the bar · what it can reach · where it runs). The three
  kickers stay. ⚠ **THE RECORD LIVES ON THE TILES AS `data-*`**
  (`data-layers`, `data-owner`, `data-runs`, `data-bar`, `data-reach`,
  `data-where`) so the parse guard's digit / Arc / self-sufficient walk
  reaches every string the pick can letter; `usePropPick`
  (`proposition/usePropPick.ts`, called from `TrinnyPortals`) is ONE
  delegated listener on `[data-tl-config]` — never a listener per tile inside
  a `dangerouslySetInnerHTML` body. ⚠ **THE RESTING STATE IS AUTHORED**: the
  first tile carries `aria-selected="true"` and every row `is-on`, so the
  drawing reads whole under reduced motion and on the phone, where the hook
  is the only thing that changes it. ⚠ **GOLD IS THE BUILT THING AND NOTHING
  ELSE**: the lit rows, the picked tile, the readout's rule — the plate, the
  unlit rows and the tiles at rest are dawn. `data-tl-reveal` stays on the
  instrument's root (the count is still three). The picker is smoke-pinned
  from both ends (picked and un-picked tile, lit and dimmed row) and the
  parse guard pins the tiles' layer ids against the rows' ids.
- **`mobile-section-seams.spec.ts` is `/`-only** — the trinny stations are not in
  its `STATION_IDS`; phones are covered by the capture script.

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
- ⚠ **`#proposition` IS TRANSPARENT AND PINNED, AND ITS RECORD APPEARS RATHER
  THAN ARRIVES (U5, owner: "the elements from the next section should just
  come into view").** It was an OPAQUE station in normal flow whose head and
  drawing entered on `data-m`, and **an opaque station in normal flow can only
  ARRIVE by travelling — its content travels with it.** So it takes `#turn`'s
  shape (`100svh` + a 60svh runway, a sticky `[data-tl-prop-stage]`), its
  record sits blank while the station travels, and it powers on once the stage
  parks. Nothing can be seen sliding because nothing is visible while anything
  moves. The reveal is the house terminal stutter on `--tp-in`, **OPACITY
  ONLY** (a transform here is the move-and-fade system back in new clothes),
  with the title on the scrubbed house decode and its ghost/live pair.
  ⚠ **`var(--tp-in, 1)` FAILS OPEN** — the writer REMOVES the property when it
  parks, so the phone and reduced-motion paths get the record standing lit. A
  reveal channel that is absent must mean shown, never hidden.
- ⚠ **THE PIN IS NOT THE STATION'S TOP, AND ASSUMING IT WAS SHIPPED THE DEFECT
  IN MINIATURE.** `.station` carries 140px top / 220px bottom padding at
  1920×1247, so the stage is still 140px short of pinning in the frame the
  station's top reaches the viewport top — the first clock opened the reveal
  45px into that travel and lit the record while it was still moving. And a
  sticky child travels inside its container's CONTENT box, so the bottom
  padding comes out too: **16px of real travel at 1280×720** against a 60svh
  runway, measured as a head clipped off the top of the viewport. The station's
  vertical padding is 0 on the capable rung with the air spent INSIDE the
  stage, and `propPinnedProgress` measures the STAGE's own travel off
  `offsetTop`/`offsetHeight`. The error is viewport-dependent, so no literal
  could have hidden it.
- ⚠ **A RULE IS PART OF WHAT IT RULES.** `data-tl-reveal` goes on
  `.tl-prop__head`, not on `.tl-prop__lead` inside it: the head draws the coral
  rule under the band, and one level down that line painted at full strength
  across an otherwise empty frame.
- ⚠ **`#contact` TAKES `data-m="fade"` AND NOTHING ELSE** (U5). Every other
  role in that system translates. It is not pinned — a page's last card does
  not need a stage — so the scrubbed channel has nothing to key on, and the
  one non-travelling role is the same law with the machinery already in the
  sheet. The parse guard pins the role set.
- ⚠ **THE MARK FADES AGAINST THE PROPOSAL'S ARRIVAL, NOT MORE OF THE TURN'S.**
  `markVeil(p, q)` is ADDITIVE and `q` is exactly 0 until the stage pins, so
  the turn's beat is byte-identical and the clock test asserts it. Ceiling
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

## The seam into the proposal, and the head's seat (ADR-095 U6 / ADR-094 U5)

- ⚠ **THE TWO STATIONS OVERLAP BY `--tl-prop-lead` (50svh), AND THAT IS WHY THE
  GROUNDS MUST SWAP.** A sticky stage costs ONE VIEWPORT of scroll-off at its
  end by construction, and by the turn's release its stage is empty (products at
  `TURN_PRODUCT_GONE`, line past `TURN_CTA_OUT`) — so that viewport was the
  reader scrolling through nothing. The negative margin takes half of it back
  (release → pin 1.00 → **0.50** viewports, release → LIT 1.28 → **0.77**).
  ⚠ Neither other lever reaches it: the turn's clock is signed off, and
  `--tl-prop-runway` is DWELL, so shortening it changes how long the record
  stays, never when it arrives.
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
- ⚠ **THE PROPOSAL'S HEAD SEATS ON THE HOMEPAGE'S DATUM, NOT ON ITS OWN
  DRAWING.** `align-content: center` set the head's position from half the
  configuration drawing's height: 306px / frac **0.241** at 1920×1247 against
  `.services-masthead__title` at **0.107** on the same frame. `start` plus
  `padding-block-start: clamp(48px, 10.7svh, 148px)` lands it at 0.107 at every
  reference viewport. ⚠ `start` is also the safer overflow — `center` spills
  equally through top and bottom, so `scrollHeight === clientHeight` and every
  clip gate reports zero.
- ⚠ **LEFT OPEN: the slack pools at the floor** (457px at the owner's viewport).
  _Split the slack, don't pool it_ says give the drawing a `1fr` row — but that
  opens ~185px between the head's coral rule and the drawing, and _a rule is
  part of what it rules_. Owner's eye, not a guess.

## The corridor is SHARED, and it moved (ADR-018, 2026-09-10)

- ⚠ **`/` AND `/trinny-london` MEASURE BYTE-IDENTICAL THROUGH THE CORRIDOR.**
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

⚠ **THE CAPTURE'S PROPOSAL STOPS ARE SOLVED FOR `q`, NEVER FOR `topOf`.** The
station's top at the viewport top IS `q = 0` — the one frame the record is
guaranteed to be empty in. That still is worth having (it is the proof there
is nothing travelling), but it is not the proposal: stops 19 / 20 / 12 are
armed · striking · lit, and `rollToQ` converges on the published
`data-tl-prop` exactly as `rollToP` does on `data-tl-turn`.

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
