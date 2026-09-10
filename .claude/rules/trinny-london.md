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

- [ADR-095](../../sentinel/decisions/095-trinny-turn-particle-morph.md) — the turn: the registry seam, the shader's second home, the measured mark, the polar-rank pairing, the beat's clock. ⚠ **U1 deleted the interstitial slab**: the ground changes under a shader instead, the line decodes in place over it, and `#proposition` is the kill edge
- [ADR-094](../../sentinel/decisions/094-trinny-proof-stack-and-proposal.md) — the proof stack, the interstitial, the proposal, and the three mechanisms they needed. ⚠ **U1 (2026-09-10) RECOMPOSED THE CARD**: the head is chrome (client left, tabs right) with the project's name down in the record, the ATL and tooling fields show ONE thing on the house rail, the map's rail is portalled into the head, and the arrival is delayed and settled
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
- **Content by REFERENCE, order by ROUTE.** `proofOrder.ts` names four track ids
  on the Loop casefile (`studio · atl-films · tooling · ai-transformation`) and
  THROWS on a missing one. The card is `track.project` · `track.card.lede`
  (≤180, a record field beside the brief, inside the envelope scan) · the four
  `blocks[].title` with their `ProofGlyph`. ⚠ No `data-m` on anything the stack
  renders — `useRevealMotion` collects its targets at `LandingPage` mount and a
  nested root's nodes rest at opacity 0 forever; entrance rides `--pc-enter`.
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

- ⚠ **THE HEAD IS CHROME AND THE NAME IS IN THE RECORD** (owner, 2026-09-10).
  `LOOP EARPLUGS · {phase}` leads the strip, the tab row closes it, and
  `.tl-card__title` sits in `.tl-card__record` above the lede. **The cost is
  named and taken**: the head is the PEEK BAND, so a covered card's sliver now
  reads the same on all four — only the three with tabs carry a distinguishing
  mark. If it ever needs fixing, the name goes back in the head's right slot on
  the ADS CARD ALONE, never on all four.
- **The tab row is `ConsoleRail`, and stations are DERIVED** (`proof/proofTabs.ts`,
  pure, unit-pinned). A film's handle is its `label` before the middle dot; a
  tool's is `ProjectCase.tab`. ⚠ The MAP is absent from that table on purpose —
  `PdaConsole` owns its three readings and a copy here would be a second switch
  for one piece of state. The ADS card gets no rail: a contact sheet is one
  object however many pictures are in it.
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

- ⚠ **`#trinny` IS THE DECLARED KILL EDGE.** `useCorridorExitScroll` consults
  `[data-corridor-kill]` before its hardcoded chain; on this page none of that
  chain's ids sit below the corridor, and an opaque station the hook does not
  name HARD-CUTS the canvas at its top (ADR-030 §6). The cover rule in
  `trinny-london.css` is keyed on the SAME attribute — the `#voidwalker` form
  (relative, z 6, `content-visibility: visible`, its own ground), never the
  transparent `#services` form — so JS and CSS cannot name different stations.
  Exactly ONE element carries the attribute (the parse guard counts).
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
- **`#trinny { margin-top: -100svh }` on the capable rung** keeps the stage pinned
  until the slab has covered it (the stage would otherwise unpin a viewport
  before the mark's fade ends). ⚠ On the MEDIA rung, never on
  `data-corridor-exit` — a transient attribute would shift the document by a
  viewport when it clears.
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

## Verifying

```bash
npx vitest run tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx tests/lib/trinny-proof-order.test.ts tests/lib/trinny-proof-tabs.test.ts tests/lib/trinny-mark.test.ts tests/lib/theme-lock.test.tsx tests/lib/cases-registry.test.ts tests/lib/rail-instrument-marks.test.ts
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop   # UNCHANGED — the morph's identity-at-0 proof
node scripts/capture-trinny-london.mjs --vp 1920x1247 --port <port>
node scripts/capture-trinny-london.mjs --vp 1280x720 --port <port>
```

⚠ **EDITING THE PROTOTYPE HTML FIRES NO HMR, AND A TAB THAT IS ALREADY OPEN
WILL NOT SHOW IT.** `landing-trinny-london.html` lives under `public/`, so it is
outside the module graph: `lib/v7-parse` re-reads it on the next REQUEST, but
nothing tells the browser to make one. Editing `trinny-london.css` in the same
pass *does* fire HMR and hot-swaps the stylesheet in place — so an open tab ends
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
