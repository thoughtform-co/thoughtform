---
paths:
  - "components/landing/home-v2/services/proof-stack/**"
  - "app/(marketing)/arcs/trinny-london/proposal/proof/**"
  - "components/landing/home-v2/services/ServicesStage.tsx"
  - "components/landing/home-v2/hooks/useServicesStageScroll.ts"
  - "scripts/capture-proof-stack.mjs"
description: The proof card and its scroll-stacked pile — the site's evidence beat, shared by the homepage and the Trinny London pitch page
---

# Rule: the proof stack

Four projects from one casefile as a scroll-stacked pile of cards. Built for
`/arcs/trinny-london/proposal` (ADR-094) and promoted to the homepage's evidence beat in the
casefile's place (ADR-096). **One module, one sheet, three hosts** since
ADR-128: the pile on `/`, the pile on `/arcs/trinny-london/proposal`, and the
card AT REST on a registered arc through the `proof-card` section kind
(`components/arcs/ArcProofCard.tsx`, first on `/arcs/pandora-proposal`).

⚠ **THE THIRD HOST MOUNTS THE CARD WHOLE AND CHANGES NOTHING IN THE MODULE.**
Its wrapper is `.pf-stack > .pf-slot`, because every selector in this sheet is
scoped to that pair and the slot's DECLARED rest state (`--pc-enter: 1;
--pc-cover: 0; --pc-depth: 0`) is what seats every arrival channel with no
hook: no `data-pc-*`, no runway, no `--i`. What the arc supplies is the BOX
(`arcs.css` `.arc-proof`, (0,3,0) over this sheet's (0,2,0) and only inside
`.arc-proof`): the slot goes static at the films console's height law, gated
to the complement of this sheet's own inert rung (≤960 / ≤680h / PRM), which
already parks the card in flow below it. The route imports this sheet ahead of
`arcs.css`. A change to `ProofCard` or to this sheet is a THREE-surface change
now — `services-ring-smoke`, `trinny-london-smoke` and the Pandora capture.

**Read first**

- ⚠ [ADR-097](../../sentinel/decisions/097-proof-card-is-a-folder.md) — **THE
  CARD IS A FOLDER (2026-09-12, owner; U1 the same day on his live read):**
  glass over the corridor with a FLAT gold lip on the clipped ring, the head
  row a full-width BAND carrying the client's gradient over the plain TR+BL
  housing (U1 — the first cut's tab with a 45° step was taken off), the pile
  receding by DEPTH, the plate fading in, and the client's colour from a new
  `CaseDef.accent`. See §The folder below before touching the card's
  silhouette, its material, its recession or its arrival.
- [ADR-096](../../sentinel/decisions/096-proof-stack-on-the-homepage.md) — the
  promotion: the seating, the MEASURED runway split, why dark mode was free,
  and what the casefile's retirement is still waiting on.
- [ADR-094](../../sentinel/decisions/094-trinny-proof-stack-and-proposal.md) —
  the card itself, U1 → U8: the recomposition, the ruled register, the
  apparatus, the chamfer, the 4:5 cut, the type ladder.
- [`.claude/rules/proof.md`](proof.md) — the record, the plates and the
  confidentiality envelope, all unchanged.
- [`.claude/rules/trinny-london.md`](trinny-london.md) — the second host.
- [`.claude/rules/arcs.md`](arcs.md) §The client model — the third host, the
  `proof-card` kind (ADR-128).

## Contracts

- **The mechanic is ADR-030's, the skin is `proof-stack.css`, and neither is
  route-local.** A rule that is true on one surface and not the other belongs
  in that route's own sheet — `services.css` owns the homepage's SEATING and
  nothing else.
- ⚠ **THE PILE IS A SIBLING OF THE PINNED STAGE, AND OUT OF FLOW.** Its slots
  are `position: sticky` and a sticky slot needs real scroll to stick against;
  inside a stage pinned at `top: 0` there is none. In FLOW ahead of the stage
  it would push the stage's pin down the runway and the offer would arrive by
  sliding up after the last card. `position: absolute; inset: 0 0 auto 0` keeps
  both.
- ⚠ **NO `height` ON `.pf-stack`.** Its box is content-height, because that
  height is what the hook MEASURES. Pinning it to `--svc-proof-runway` makes
  the measurement read back the reservation it exists to correct.
- ⚠ **THE PROOF SHARE IS MEASURED AND WRITTEN BACK.** The pile is
  `n × (100svh − pinTop + peek + dwell)` plus the last card and its tail, with
  px terms that do not scale — 489svh at 1280×720, 491 at 1440×900, 483 at
  `useServicesStageScroll` reads `.pf-stack`'s box, SOLVES the share from the
  last card's exit (U3 below — it was `+ SERVICES_PROOF_RELEASE_VH`), and
  writes the total onto `--svc-proof-runway` once per resize.
  `SERVICES_PROOF_RUNWAY_VH` is the PRE-HYDRATION RESERVATION
  (and the fallback), deliberately the ceiling of that range;
  `services-proof-runway-lockstep.test.ts` still pins the CSS literal to it.
- ⚠ **THE RING PARKS AS THE LAST CARD CLEARS** (ADR-096 U3, owner: _"the cards
  from the services section should appear the moment the last card from the
  proof section has disappeared"_). **THIS SUPERSEDES U1**, which is the same
  ask read as the DOM ladder's: `--svc-content-in` carries the masthead and the
  plates, but the "cards" are the WebGL ring, and its three VISIBLE cards fly
  in over `RING_ENTRANCE_WINDOWS` `[0.58, 0.88]` on
  `smoothedDissipate × proofRelease` — so they were parked 0.6–1.1 viewports
  after the pile was gone with U1's guard green (measured at the clearing:
  `--svc-content-in` 0.121, **zero** published anchors).
  The share is SOLVED from two measured positions on the last slot:
  `exit = pinTop + slotH` (its own travel) and `gone = pileH − marginBottom`
  (where its bottom crosses zero). The ramp opens at `gone − exit` and is
  stretched so **`PROOF_RELEASE_PARK`** — `smootherstepInverse` of that window's
  end, 0.734969, in `ringMath` — lands on `gone`. Measured after: 0.880 and
  three anchors, at the pixel.
  ⚠ **`SERVICES_PROOF_HANDOFF_OVERLAP_VH` IS DELETED** — a viewport constant
  cannot anchor a card's disappearance, and the replacement is a derivation of
  the ring's own windows, so **retiming an entrance window retimes the handoff
  with it** (they ride the raw dissipate everywhere else; nothing else would
  notice).
  ⚠ **THE PAGE GETS ~1.6vh SHORTER AND THREE NUMBERS MOVE TOGETHER** —
  `SERVICES_PROOF_RUNWAY_VH` 6.3 → **5.1** (the stack path is the pile alone),
  the `--svc-proof-runway` literal 630 → **510svh**, and
  `SERVICES_PROOF_RELEASE_VH` becomes the CASEFILE's. The ring's 500svh domain
  is untouched by construction. `services-proof-runway-lockstep` is the alarm —
  and it had a latent float bug that 6.3 dodged (`5.1 * 100` is
  509.99999999999994), so both sides round now.
  ⚠ **U1's INVARIANT SURVIVES, STRONGER** — the ramp's own zero IS the release
  point, so the card's whole hold reads exactly 0.000.
  ⚠ **`exit` IS THE LAST SLOT'S PIN (`top-base + i·peek` = 220), NOT 64** —
  deriving it from the constants without the peek term gives 720 against a
  measured 876. ⚠ Read it from computed `top` / `margin-bottom` / `offsetHeight`
  once per layout, **never `offsetTop`** (stuck position) and **never
  `:last-of-type`** (the tail is a later `div`).
  ⚠ **THE FLY-IN GETS THE LAST ~26 % OF THE EXIT** (142–281px). Opening the ramp
  at the card's PIN instead buys a longer fly-in and paints 28 % of the ladder
  under a parked card, through its glass; opening it at the clearing compresses
  the fly-in to ~80px, one wheel notch. Both were computed before this was
  chosen — do not move the opening without redoing that pair.
  ⚠ **Verifying:** `node scripts/capture-proof-stack.mjs --handoff` walks the
  exit in tenths and prints `--svc-content-in` and the anchor count against the
  card's own bottom edge.
- ⚠ **THE LAST CARD'S HOLD IS THE TAIL, AND IT IS SIZED TO THE CARD BEFORE IT**
  (ADR-096 U2, owner: _"fix the last card's hold too"_). Every other card is
  held by the one that covers it; the last has nothing above it, so its hold is
  the runway left under its own margin box. Measured parked spans — arrived,
  uncovered, still — ran 240 / 280 / 360 at 1440×900 with the LAST at 240: the
  pile accelerates and then the final card got the shortest hold of the four.
  `.pf-stack__tail` is `clamp(280px, 40svh, 400px)` now (was
  `clamp(160px, 24svh, 280px)`), which lands 288 / 360 / 400 against sibling
  targets of 280 / 360 / 400.
  ⚠ **THE MARGIN CANCELS** — sticky is bounded by the containing block MINUS
  the element's own margins, and the last slot's 394px margin is inside that
  block, so it comes off both terms and the range is the tail alone.
  ⚠ **`.pf-slot:last-of-type { margin-bottom: 0 }` HAS NEVER MATCHED** —
  `:last-of-type` counts by element TYPE and `.pf-stack__tail` is a later
  `div`. Leave it dead: by the line above, zeroing that margin changes NO hold
  and instead removes the runway the U1 release runs over after the card has
  cleared — it would pull the opening in front of the card's unstick.
  ⚠ **A LONGER TAIL IS A LONGER PILE**, so `SERVICES_PROOF_PILE_VH` (5.1),
  `SERVICES_PROOF_RUNWAY_VH` and the `--svc-proof-runway` literal move in the
  same commit — `services-proof-runway-lockstep` is the alarm. (They are 5.1
  and 510svh since U3 took the release inside the pile; this bullet shipped
  them as 6.3 / 630svh.) It does NOT disturb the handoff: the unstick point and
  the box shift together, and U3 solves the ramp from BOTH, so a longer tail
  moves the whole beat down the page without re-timing any part of it.
  ⚠ **PIN THE HOLD BEHAVIOURALLY.** Deriving the sticky range from `offsetTop`
  reads the STUCK position (`seatProofCard`'s own finding) — it reported 125px
  against a 320px tail. The smoke walks the card instead: parked at its pin,
  parked 80px before the tail is spent, off its line 120px after.
- ⚠ **THE INERT RUNG IS RESTATED IN TWO SHEETS, AND THE SEAT RUNG IS A
  SUPERSET OF THE PARK RUNG** —
  `(max-width: 960px), (max-height: 680px), (prefers-reduced-motion: reduce)`
  in both. `proof-stack.css` §7 parks the slots; `services.css` puts the box
  back in flow. Put the box in flow without parking and nothing breaks (sticky
  slots in flow is the Trinny mechanic); park without putting the box in flow
  and the pile lands on top of the offer accordion. ⚠ **SINCE ADR-107 THE
  PHONE IS NOT PARKED**: `proof-stack.css` §8, scoped to `.pf-stack--split`
  on `PROOF_STACK_SPLIT_MEDIA` (`(max-width: 960px) and (min-height: 681px)
and (prefers-reduced-motion: no-preference)` — the park rung's first term
  taken back, the other two kept), re-sticks the slots INSIDE the seat rung's
  ≤960. The seat rung stays as it is; `proof-stack-split-gate.test.ts` pins
  the sheet's literal to the constant.
- ⚠ **THE MAP CARD'S FIELD ANSWERS ITS RAIL ON THE PHONE (ADR-107 U2,
  2026-09-25, owner: the tabs "only show the first tab's content").** Below
  the console's rung the map's fallback is a LIST PER READING keyed on the
  same `view` the portalled rail selects (`PdaPhoneReadings.tsx`: the estate by
  workstream with each row's run mode, and the configured streams' `RUNS ·
REACH · WHERE` — two since ADR-126; the five shapes' list left with the
  third reading), never one list
  that ignores it — and NO rail of its own (`ConsoleFrame` renders the
  fallback on every rung; a second `ConsoleRail` doubled the desktop arcs'
  stations behind a hidden list); `.pf-field--map::after` is `display: none` at ≤960 (the
  wheel listener it guarded only captures at ≥961), and `.fl-pda__list`
  releases at its bounds (`overscroll-behavior-y: auto; touch-action: pan-y`).
  A fallback that ignores the control it sits under is a control nobody can
  press. Guard: the phone smoke's "the map's field answers its rail with
  two readings" + `tests/lib/pda-phone-readings.test.ts`.
- ⚠ **ON A PHONE EVERY PROJECT IS TWO SHEETS (ADR-107).** `ProofStack`'s
  `split` renders each track as a RECORD slot (`data-pc-index 2k`, `--i: k`,
  the head band over the record) and a FIELD slot (`2k+1`, **`--i: k+1`**, the
  rail · bay · foot with NO head), so the field seats under its record's band
  — the head row IS `--pc-peek` — and the next record pins on the field's own
  line. `--pc-n` is `tracks + 1`. `ServicesStage` reads the media and REMOUNTS
  the stack on it (`key`), because the hook collects its slots once. The
  record does not recede for its own field (`--pc-dp` drops the cover term on
  `.pf-slot--record`); a later pair counts two enters, so recede/dim are
  halved; the field sheet is cut BL only; no blur, `--pf-glass-a` .74; the
  record's band carries ONE ellipsised line of the arc title
  (`.pf-card__headtitle`) because three of four phases read `Build`. Omitted
  (Trinny, desktop), `ProofCard` and `ProofStack` are byte-identical.
  ⚠ `data-pc-index` runs **0–7 on a phone**; a measurement that assumes
  `[data-pc-index="1"]` is the second PROJECT is reading the first project's
  FIELD. `tests/visual/proof-stack-mobile-smoke.spec.ts` (the two Chromium
  phone projects) is the guard; `capture-proof-stack.mjs --mobile --pairs
--headless` is the look.
- **`tracks` is a PROP.** Content by reference, ORDER by route (`proofOrder.ts`,
  shared today — `atl-films · tooling · studio · ai-transformation` since
  ADR-126: the tools before the studio, the titles in the present tense, the
  pile read as the practice with Loop as the illustration). ⚠ The pile's order and each card's `arc.step` can disagree with
  nothing failing — pinned arithmetically by `trinny-proof-order.test.ts` and on
  the rendered page by the smoke.
- ⚠ **EVERY SELECTOR IS SCOPED BY `.pf-stack`, AND THE SCOPE IS LOAD-BEARING.**
  The sheet overrides `console.css` and `casefile.css` at (0,3,0); flattened to
  `.pf-card__tabs .fl-con__stn` it loses to the rules it was measured against.
  The component renders its own `.pf-stack` wrapper for exactly this.
- ⚠ **TOKENS ONLY, WHICH IS WHAT MAKES IT THEME-HONEST.** Every colour is a ramp
  step off `--dawn-rgb` / `--void-deep-rgb` / `--gold-rgb` / `--gold-line`, which
  ADR-058 SWAPS — so one set of declarations paints cream on near-black and ink
  on parchment with no `[data-theme]` branch. Measured: `--pf-plate` is
  `rgba(5, 4, 3, 0.62)` dark, `rgba(228, 218, 201, 0.62)` light; the lip is
  `color(srgb .79 .65 .33 / .3)` dark, `(.54 .42 .13 / .3)` light — `--gold-line`
  through `color-mix()`, no branch. The two alphas that invert across the flip
  (`--pf-bloom-a`, `--pf-head-a`) are re-derived in `theme.css` BLOCK 4c on
  `.pf-stack`; the one non-token value, a CLIENT's colour, is written INLINE by
  the host and only read here. ⚠ **A literal here is a guard failure — and since
  ADR-097 that is TRUE**: the sheet was in neither `type-material-tokens`' PINS
  nor `theme-css-sweep`'s SHEETS for a week while its header and this rule both
  said it was. Both carry it at zero now.
- ⚠ **FOUR CONSOLES ARE MOUNTED AT ONCE — IN EIGHT SLOTS ON A PHONE.**
  `document.querySelector(".fl-con__console")` answers with the SHEETS card
  whatever is on screen, and `.fl-pda` / `.fl-wire` are unique only by luck.
  Scope every measurement to `[data-pc-index="N"]` — this is the one thing the
  single-panel casefile never had to say. On the split pile a console lives in
  the FIELD slot (`2k+1`); the record slot mounts none.
- ⚠ **`.pf-card` IS A CONTAINING BLOCK FOR `fixed` DESCENDANTS** (it carries a
  `clip-path`). Survivable only because `MediaLightbox` portals to
  `document.body`; a dialog written inline here is trapped in the card.
- **`ProofStack` is a named AND default export.** `/arcs/trinny-london/proposal` mounts it
  through `lazy()`; the homepage imports it into `ServicesStage`.

- ⚠ **THE RED LINE'S FIRST/LAST-RULE OVERRIDE IS RETIRED (ADR-084 U2).**
  U10 had to strip the band grid's outer hairlines here, because inside a
  closed frame they sat a pixel under the dawn lid and a pixel over the dawn
  floor. The sheet is four quadrants divided by ONE INTERNAL CROSS now, so it
  has no perimeter rule at all and the frame's own edges are the block's.
  ⚠ This card is the SMALLEST field the sheet renders in (579 × 215 at
  1280×720, a 108px quadrant), so it is where a longer sentence fails first —
  the smoke measures each quadrant's ink against its cell in both directions.

## The folder (ADR-097, live on both hosts)

- ⚠ **AND THE FIRST CARD ASSEMBLES FROM A WIREFRAME OF ITSELF (ADR-104,
  2026-09-15, owner).** _"I would like it to first show a wireframe of all the
  elements when it slides open, kind of like what we have with the software for
  few … once it's fully open, all the content is actually revealed, because the
  slide-in opening with the thumbnail of the ATL doesn't really work."_ So the
  beat is TWO passes of one scan: pass 1 is ADR-097 U12's aperture, UNCHANGED,
  revealing `.pf-cardwire` with `.pf-card__body` held at the slit; then pass 2,
  in which the body's clip window grows centre-out while the skeleton's two
  halves retract to their own walls. Card 0 only.
  ⚠ **PASS 2's 720ms IS DERIVED** — its edges travel pass 1's distance on pass
  1's object, so they take pass 1's time, on pass 1's curve. U12's own lesson
  read forward: **re-solve a timing for the SIZE of the object, and when the
  object is the same size the timing is the same.**
  ⚠ **THERE IS NO HOLD, AND PASS 2 STARTS INSIDE PASS 1's TAIL (ADR-104 U1,
  2026-09-20, owner: _"I want the content to be shown a little faster"_).**
  The 200ms hold plus pass 2's own ease-in was ~350ms in which nothing on the
  card moved. Pass 2 is delayed **560ms** (measured: the aperture is 94.7 %
  open there; the content window is a ~60px slit, 5.3 %, when it lands at
  720; 50 % at 920), so the content is
  opening the frame the sweep ends — filled at **1280ms**, was 1640, both
  durations and the curve untouched. ⚠ Little slack under it: at 480 the two
  edge pairs read as one gesture. If it still reads slow, the next dial is
  pass 2's DURATION, on his word, not the delay.
  ⚠ **THE HEAD BAND IS NOT SKELETAL** — it is the card's own MATERIAL (the
  client's gradient over the housing), not its content, and it is the one strip
  a covered card shows. The folder arrives REAL and its contents are drawn; the
  skeleton insets by `--pc-peek` and pass 2 clips one element, not two.
  ⚠ **PURE MOTION, ZERO FADES STILL BINDS.** A crossfade between skeleton and
  content would be U12's retired flash in a new costume. The handoff is a seam.
  ⚠ **THE COMPLEMENT NEEDS TWO HALVES, AND THAT IS ARITHMETIC** — at progress
  `t` the content holds `[50 − 50t, 50 + 50t]` and the skeleton the two OUTER
  bands, a disjoint shape **one polygon cannot describe**. `ProofCardWire`
  renders the drawing twice for that reason alone; the duplication is a
  technique, not a content fact, so the call site sees one element. `inset()`,
  never `polygon()` — the children of a chamfered box are square.
  ⚠ **`backwards`, NEVER `forwards`** (ADR-101's ruling): the 560ms delay holds
  each `from` frame, and the end falls to the CASCADE — no clip on the body,
  fully retracted on the halves. A `forwards` fill pins an `inset()` on the body
  for the rest of the card's life. **The close needs no mirror**: the `out`
  cascade hides the card, so the interior's state is unobservable through it.
  ⚠ **IT IS THE CARD'S OWN LAYOUT IN THE CARD'S OWN TOKENS.** Every box mirrors
  a real one and every colour is `--pf-rule` / `--pf-rule-soft` — within a hair
  of the casefile kit's `--w-hair` / `--w-fill`, so it is the grammar the owner
  named AND the lines that survive into the filled card are literally the same
  colour they were in the skeleton. One new value, `--pf-wire-fill`. Shelling in
  `.fl-wire` would have imported a `container-type: size` flex column the
  drawing immediately overrides.
  ⚠ **A BAR IS A LINE AND ITS ROW IS THAT LINE'S BOX.** The first cut drew one
  bar for the title and two for the lede and put the register **111px high**
  (claims at y232 against the real y343) with every other measure correct — the
  left column read as a different card and the fill became a cut. Each type
  block is now a grid whose `grid-auto-rows` is `font-size × line-height` off
  the same tokens the real type uses. Measured after: lede, claims, claim 0, the
  rail row and the bay all at **dy 0**. ⚠ The line COUNTS are card 0's own, and
  ⚠ the caption is two lines because the film is CENTRED — its height seats the
  plate, and a one-line stand-in put the plate 14px low.
  ⚠ **IT LETTERS NOTHING** — `--fl-mono` resolves only inside `.fl-case` /
  `.arc-*` and this card is neither, so a label would take a third face; and a
  drawing with no strings is outside the confidentiality scanner. Smoke-pinned.
  ⚠ **`getAnimations()` IS PER-ELEMENT, AND TWO HARNESSES WERE BLIND THE SAME
  WAY.** Pass 2 runs on DESCENDANTS, so `capture-proof-stack --glitch` paused
  only pass 1 (and would have shot a strip with pass 2 running free) and
  `settleArrival` returned at 720ms instead of 1640, handing every plate read a
  half-filled card — **the exact flake that helper exists to remove**. Both take
  `{ subtree: true }`; the helper's cap is 5000ms. A guard that walks an element
  cannot see work you moved into its children.
  ⚠ **CARD 0 MUST STAY A `films` FIELD** — the skeleton follows POSITION, so a
  re-order leaves it describing a card that moved with every other guard green.
  `trinny-proof-order.test.ts` is the one assertion that fails on it.
  ⚠ **Looking at it:** `node scripts/capture-proof-stack.mjs --glitch
0,360,560,720,920,1100,1280` — pass 2 begins at 560, the fill's midpoint is 920. Rules in [ADR-104](../../sentinel/decisions/104-the-card-assembles-from-its-wireframe.md).

- ⚠ **THE FIRST CARD OPENS, AND ONLY THE FIRST** (ADR-097 U11 for the beat,
  **U12 for the skin**). Owner, 2026-09-13: _"a cool glitch effect where the
  first card appears — the others can just scroll over it as it is now"_; then
  2026-09-14, on the live read: _"it's a bit too flashy, which could give
  seizures … instead I want that sort of scan-line animation which we have in
  the text cards in our arc at the bottom that then opens from the center to
  the left and right sides."_ Card 0 is ABSENT through its whole rise and its
  APERTURE sweeps open from a zero-width centre slit over 720ms in its last
  ~140px; scrolling back up irises it shut in 420ms. Seven things about it,
  each of which was a defect first:
  ⚠ **THE FLASH WAS COUNTABLE, AND THAT IS WHY IT IS NOT A DIAL.** The retired
  `pf-glitch-strike` ran `opacity 0 → .62 → .12 → 1` linear over 640ms: three
  large-area luminance transitions inside its first **378ms** (~4 dark↔light
  alternations a second, against WCAG 2.3.1's three-per-second general-flash
  threshold), with `pf-glitch-bands`' five hard `steps(1, end)` shape changes
  over the top. The relative-luminance delta is NOT measured and does not need
  to be. **Nothing on this card may reintroduce a luminance flicker.**
  ⚠ **PURE MOTION, ZERO FADES** — the corridor caption card's own law
  (`.home-v2-reticle`, the text card at the bottom of NAVIGATE / ENCODE /
  BUILD, which is the grammar he named). There is no opacity curve, no tear
  and no `filter` in the block. A sweep and a flicker fight each other.
  ⚠ **THE SCAN LINE IS THE CARD'S OWN.** Nothing new is drawn: the gold lip
  ring (`.pf-card::before`) and the head's rule are already horizontal
  hairlines, and the aperture terminates them at its two travelling edges, so
  they draw outward from the centre. A literal travelling hairline was offered
  and not taken.
  ⚠ **THE TRIGGER IS THE CHANNEL, NOT `data-pc-state`.** That attribute
  returns to `pinned` whenever the card above scrolls back off a covered slot,
  so a state-keyed arrival re-fires on a card that never left — four times on
  the way back up. `--pc-enter` stays at 1 while covered, so a hysteresis on it
  (0.92 in / 0.82 out) fires once per real arrival.
  ⚠ **READ THE INLINE VALUE, NOT THE COMPUTED ONE.** The sheet declares
  `--pc-enter: 1` as the SSR rest state, so a computed read at mount says 1 for
  a card three viewports below the fold. The inline property is empty until the
  hook writes — which is the event the `MutationObserver` (on `style`, the
  hook's own delta-gated writes) is waiting for. No second scroll listener.
  ⚠ **EVERYTHING ANIMATES ON `.pf-card`, NEVER ON THE SLOT.** A `filter`,
  `opacity`, `clip-path` or `mask` on an ANCESTOR makes it the backdrop root and
  the card's `backdrop-filter` goes blind for the length of the sweep; and a
  transform on the slot parks the whole pile.
  ⚠ **THE LAST FRAME IS THE CASCADE AND `fill-mode` IS `none`** — the open
  frame is STRING-EQUAL to `.pf-card`'s own six-point chamfer polygon, and the
  closed frame is that polygon with every **X at 50% and every Y untouched**, so
  the sweep is purely lateral, the six points interpolate one for one, and both
  cuts are present throughout (the silhouette is never square for a frame). A
  `forwards` fill pins the clip and the card refuses to recede under the three
  that cover it. The smoke pins the shape by string equality against card 1.
  ⚠ **THE CLOSE HOLDS `opacity` AND `visibility` ITSELF** — the `out` cascade
  says `opacity: 0; visibility: hidden`, so a close animating the clip alone
  plays on an invisible card. It ends on the slit, where nothing paints.
  ⚠ **IT IS A PROP, NOT A RULE IN THE SHEET** — `arrival="glitch"`, passed by
  `ServicesStage` alone (the name is U11's and stays, so the one call site does
  not churn). Gated in CSS on the exact inverse of the inert rung, where the
  hook parks every slot at `enter: 1` and there is no arrival to open.
  ⚠ **A HARNESS MUST WAIT ON THE ANIMATIONS, NOT ON A TIMEOUT** —
  `seatProofCard` returns when the hook publishes `pinned` and its retry wait is
  450ms against a 720ms sweep, so a plate read after it samples a HALF-OPEN card
  on any pass but the first. `settleArrival` awaits `getAnimations().finished`.
  ⚠ **THE PACING IS EASE-IN-OUT AND IT IS NOT THE REFERENCE'S** (owner, the
  same day: _"a bit more subtle … a bit too fast … easy in, easy out, like any
  frontend design best practice"_). The caption card's own pair — 550ms on the
  expo-out `cubic-bezier(0.16, 1, 0.3, 1)` — is **84 % open at 90ms**, so the
  sweep is spent in its first sixth. Proportionally identical on the caption
  card; what differs is ABSOLUTE EDGE SPEED, 575px a side here against ~230px
  there. `cubic-bezier(0.65, 0, 0.35, 1)` at 720ms is exactly half open at
  360ms and readable end to end. **Copy a reference for what it DOES; re-solve
  its timing for the size of the object you put it on.**
  ⚠ **BOTH HOSTS MOVE TOGETHER** — one grammar, one pair of numbers. A change
  here is a change in `trinny-london.css`'s `tl-aperture*`, and the reverse.
  ⚠ **Looking at it:** `node scripts/capture-proof-stack.mjs --glitch
0,180,360,540,720` replays it on a paused clock. **Cancel the animations
  before restarting** — toggling the attribute alone ADDS a CSS animation the
  WAAPI has paused rather than replacing it (3 → 6 → 9 → 12 across one strip,
  with every computed value still looking right).
- **THE HEAD ROW IS THE CLIENT'S BAND, AND THE SILHOUETTE IS THE PLAIN TR+BL
  HOUSING** (U1, owner, on the live read: _"having the gradient only on the
  left … doesn't really work. I want the full top row to have that gradient,
  and let's keep that notch in the top-right corner"_). The head is the
  full-width row it was — rule under it, `gap: 24px`, `padding: 0
--pf-card-px` — painting `linear-gradient(90deg, rgba(accent, --pf-head-a) →
× .25)` on itself; the card's clip takes the TR chamfer out of it. The grid
  row is still `--pc-peek`, so the body, the insets, the type ladder and the
  MEASURED runway are byte-identical.
  ⚠ **THE TAB WAS BUILT AND TAKEN OFF THE SAME DAY.** The first cut drew the
  head as a tab (`--pf-tab-w`, a 45° step, eight-point polygons with a
  `−0.414px` inner step, a ≤960 collapse) and left the row's top-right open;
  the folder read comes from the BAND over a body whose corners stay cut (the
  braindance header), not from a step in the outline. ADR-097 U1 holds the
  record; do not restore the step from muscle memory.
- ⚠ **THE INERT RUNG FLOORS THE HEAD AT `--pc-peek`** — its rows are
  `auto auto`, and a 12px tinted band reads as a rule, not a band.
- **THE FIELD STARTS ON THE RECORD'S DATUM, AND THE DATUM IS UNDRAWN** (U2 for
  the datum, U5 for the rule: "remove the line above the tabs"). `--pf-card-py`
  is the record's top padding, so the field takes it as `padding-top` and the
  rail's row starts on the title's own line; the stations hang `--pf-rail-hang`
  (8px) under it at `--pf-rail-h` (30px), STRETCHED not centred, so the row's
  height is the box's. Measured at 1440×900: rail top 153 = title top 153, box
  30px (was 22–23 in a 34px row). ⚠ **THE DATUM IS A LAYOUT TERM, NOT A PAINTED
  ONE** — the smoke pins both halves, the row on the title's line AND the field
  painting nothing there.
- ⚠ **THE RAIL IS BACK IN THE FIELD (U7), SO EVERY CLAUSE HERE ABOUT ITS SEAT
  IS LIVE AGAIN.** U6 moved it up into the client's band and the owner read it
  live — "I don't think the tabs in the header is working; can't we restore
  them in their original position?" — so `ProofCard`'s `railSeat` default goes
  back to `"field"` and U2 and U5 hold as written: the rail on the record's
  datum, the frame's width (U8), the datum undrawn. ⚠ U3's "frame open into
  the rail" is RETIRED by U10 — the frame is a closed box one gap under it.
  - ⚠ **THE CSS REVERTS ITSELF; THE SMOKES DO NOT.** Every band rule is scoped
    to `[data-pf-rail]`, which only the head seats write, so flipping the seat
    restored U3's open frame and U4's full-bleed rail with no rule edited. U6
    had rewritten the smoke's folder block to read the rail from the HEAD, to
    expect the frame's lid and to expect a flat station — all three had to come
    back by hand. **A skin that reverts by attribute and a guard that reverts
    by hand are two halves of one change, and only one is automatic.**
  - ⚠ **`/test/proof-card-head-lab` STAYS, and so does `railSeat`.** `"field"`
    is the default and what ships; `"panel"` and `"flat"` are lab-only
    (ADR-070 U35 — the losing drawing goes with its guards once the owner has
    read it, not before). Rejected on the read: `flat`, the band seat itself;
    `panel`, because a 450px gold slab on the two-station films card is not
    the same grammar as four handles on the tools card.
- ⚠ **THE HEAD HAS NO RIGHT SLOT, AND THE PEEK BAND PAYS FOR IT** (U7: "remove
  the numbers (01 etc)"). `.pf-card__arc` and its rule are deleted. The ordinal
  held that slot from ADR-094 U4 _because_ `01 … 04` differs per card, and
  three of the four `phase` values read `Build` — so the sliver a covered card
  shows is `LOOP EARPLUGS · BUILD` on cards 1–3 and `· NAVIGATE` on 4. The
  defect U1 and U4 both solved is re-opened deliberately. `track.arc.step`
  stays in the RECORD (`trinny-proof-order.test.ts` still pins the sequence
  against it); it letters nowhere on the card.
  ⚠ **BOTH SMOKES PIN THE ABSENCE** — `arcs === 0` and `headRails === 0` per
  card, not a deleted assertion. The head is the one strip a covered card
  shows, so anything creeping back into it is on screen four times over.

- ⚠ **A RULE AT THE DATUM IS A SECOND STATEMENT OF THE WELD.** U2 drew one
  because the rail was inset 18px from the divider and something had to reach
  across; U4 took the rail full-bleed onto the divider, so the rail IS the
  connection and the rule was drawing it again one line up. Do not restore it
  without first checking whether the rail still reaches the divider.
  ⚠ Its own failure is worth keeping: the first cut drew it COLLINEAR with the
  boxes' top borders — same y, same colour — and a box covers 97 % of the run,
  so the only paint was an 18px stub at each end, invisible at dawn .18. **A
  line a box sits on is a line you have deleted.** The computed style reported
  it present, 1px, right colour, right y; a 3× crop is what showed it was not.
- **THE PANEL IS A TERMINAL OF FRAMES** (U10, owner, beside Vilimovský's
  Cyberpunk panels and Starfield's TRAVEL DATA: "in that terminal interface you
  have different frames — that's what we also need to do … the tabs don't need
  to have a border connected to them; they're just items"). Three DISCRETE
  regions on one inset (`--pf-field-px`), all square, all at `--pf-rule`, one
  token of air between them (`--pf-frame-gap`, 10px fixed, the field's
  `row-gap`): the RAIL (its boxes unchanged — what joined them to the frame was
  the frame's walls rising to their bottom edge); a CLOSED four-sided evidence
  frame on EVERY kind — `.fl-con__console` (sheets, map), `.pf-field--tools`,
  and `.pf-field--films`, the one field that had been unframed; and an
  optional FOOT frame — the studio's verdict, the tools' walkthrough button.
  The last region ends on the record's last claim rule.
  ⚠ **THIS RETIRES U3's OPEN LID AND U9's OPEN FLOOR TOGETHER** — both fused
  the frame to a neighbour (U3 to the rail, U9 to the lip) so the walls would
  "connect"; read beside the references, connecting was the defect. A
  terminal's regions connect to nothing.
  ⚠ **ADR-094 U8's ONE FLOOR IS BACK**, as `.pf-card__field { padding-block:
var(--pf-card-py) }` — one term at both ends, the same term the record pads
  by, so datum and floor cannot drift apart. `.pf-field` stays `inset: 0`, and
  the two `100cqh` chains subtract the frame's own 2px and nothing else:
  `--pf-bay-head-h` and `--pf-watch-h` are DELETED, not zeroed. ⚠ U8's apparatus
  HEAD (`IN SERVICE {year}`) does not come back with its floor — deleted on the
  card; the year stays in the record and on the homepage bay's FEED line.
  ⚠ `console.css`'s ≤980 unwrap sets the console's `border: 0` at (0,1,0); the
  frame law's (0,3,0) rule wins there on purpose — the flow rung is a terminal
  too. ⚠ The lab's `[data-pf-rail]` lid rule (U6) is deleted as a no-op.
  ⚠ **PINNED FROM BOTH ENDS, ON BOTH HOSTS**: lid AND floor `1px`, both walls
  non-zero, `frameTop − tabsBottom = rowGap` with the gap itself pinned
  `[8, 14]`, `paddingBottom = paddingTop`, the last region's bottom on the
  record's last rule (≤2) per card, the foot row present exactly on the studio
  and tools cards. The trinny reads go through `k` (covered cards are receded).
- ⚠ **THE FOOT IS A PORTAL SLOT, AND `:empty` IS ITS ROW** (U10). `ProofCard`
  renders `.pf-card__foot` after the bay as an IMPLICIT third grid row (never a
  third explicit track — an empty explicit track still takes a `row-gap`),
  holds its host in state via a ref callback like `railHost`, and `ProofField`
  portals the tools' `.pf-watch` into it and passes it to `SheetsPlate` as
  `verdictHost` — the plate's SECOND additive seam; omitted, byte-identical
  (`arc-portfolio-smoke`'s `fillUnion` is the proof). `.pf-card__foot:empty {
display: none }` gives the films and the map no row and no second gap; the
  JSX is a self-closing div — a whitespace child defeats `:empty`. ⚠ OUTSIDE
  THE BAY BY CONSTRUCTION: the bay is the size container, so a sibling foot
  shrinks it by its own height and no `cqh` chain has to know; a foot inside it
  is one more term in every chain (the head and watch rows were, until U10).
  Both blocks render in place until the host exists (SSR, the first render)
  and move in the layout phase, before paint.
- ⚠ **THE WALKTHROUGH IS A BUTTON, NOT A BAR** (U10, owner: "a bigger button
  like the Starfield one"). ≥44px (`clamp(44px, 5.5svh, 60px)`), the frame's
  width, a three-track grid (label centred, the duration in an outlined chip
  at the end — the reference's `[X]`), `--gold-line` rim + `--gold-ink` ink at
  rest, `--gold` + `--gold-contrast` on hover/focus (the drawer's big-CTA
  precedent, ADR-050, and the lit station's own fill). NOT gold at rest —
  owner's choice; ADR-063's count and ADR-050 Addendum 5 are the reasons; (b)
  light fill and (c) gold at rest are two-line swaps recorded in the ADR. Still
  11px PT Mono: the stations above it are 11px. Its `min-height` is a literal
  because it is in no chain. The light smoke pins its label ≥ 4.5:1.
- ⚠ **THE VERDICT IN THE FOOT IS STATED, NOT INHERITED.** Outside `.fl-con` /
  `.fl-case` the casefile rule's `--con-hair`, `--fl-plate-px`,
  `--fl-chrome-sm` and `--fl-ink-dim` are undeclared, so `.pf-card__foot
.fl-verdict` declares every value on `--pf-*`; family and uppercase still
  reach it by class. Its paragraph reserves two line boxes (`min-height:
2.8em`) so a rail switch cannot resize the bay. ⚠ **A CLOSED CONSOLE DOUBLES
  THE RED LINE'S FIRST/LAST HAIRLINES** against the lid and floor — two
  `.pf-field--sheets`-scoped overrides zero them. The ads take
  `clamp(10px, 1.6cqw, 18px)` of air inside their frame (a dial).
- **THE RAIL IS THE FRAME'S WIDTH, AND NOTHING DIVIDES THE COLUMNS** (U8,
  owner: "the length of the tabs should be the same as the right panel where
  the image and text lives", and "let's maybe also remove the vertical divider
  between the left and right panel"). `.pf-card__tabs` takes the field's
  `padding-inline` like everything else in the panel, so the rail's two ends
  ARE the frame's two ends; `.pf-card__record` draws no `border-right`.
  ⚠ **ADR-094 U8's ≥15px INSET IS BACK IN FORCE** — U4 had reversed it to run
  the rail full-bleed to the divider and the card's edge, and U8 reverses that
  by U4's own reason: the rail shares an edge with what it HEADS, and with the
  divider gone the frame is the only edge left to share.
  ⚠ **THE SPLIT SURVIVES THE LINE** — it is the body's `2fr 3fr` grid, so
  removing the border moved no geometry: the field's box still begins exactly
  where the record's ends (0px, pinned). The ≤960 rung keeps its own
  `border-bottom`; stacked, that is a different problem.
  ⚠ **THE RAIL'S INSET HAS BEEN PINNED FOUR WAYS IN TWO DAYS** — U8's floor,
  U4's full-bleed equality, U6's sign check for the band seat, U8's floor
  again. Each was right for its seat, which is why the smoke's message strings
  name the seat: a bare `>= 15` says nothing about which ruling it holds.
- ⚠ **THE PANEL'S CHROME COSTS THE BAY 48px, PLUS ITS FOOT** — the rail's row
  (hang 8 + 30) and one gap above the frame, and on the studio and tools cards
  a second gap and the foot (84px verdict / 50px button at 1440×900). The
  height-bound film narrows accordingly and its caption wraps to two lines;
  nothing clips, and the height cannot be taken back without breaking U10's
  one-floor rule — the other half of what makes the two columns read as one
  card. ⚠ At ≤960 the field's floor is `--pf-field-px`, not `--pf-card-py`:
  stacked, there is no record floor beside the field, and 0 would put the
  frame's floor on the lip's own pixel row (U9's doubled line).
- **THE PLATE IS GLASS, ONE DIAL.** `--pf-glass-a` .62,
  `backdrop-filter: blur(--pf-blur)` under `@supports`, no `brightness()`, the
  scanline UNDER the copy, a PIXEL-sized bloom off the body's top-right. Light
  drops the blur (the bed is faded there). Perf is measured, not assumed:
  `capture-proof-stack.mjs --perf` — long-frame share 17.9 → 14.9 % @1440×900,
  22.4 → 15.1 % @1920×1247. The fallback if a bed ever costs more (covered
  cards drop the blur, `--pf-glass-a` densifying on cover) is recorded in the
  ADR and unbuilt.
- **THE LIP IS FLAT `color-mix(in srgb, var(--gold-line) 30%, transparent)`** —
  the housing's own value, re-derived for light by the token. ⚠ NOT the services
  plate's 168° ramp: on a frame this wide the ramp's `.1` middle falls on the
  longest edges (ADR-092 stage 1 U1). ⚠ NOT a padded-gradient shell: on glass it
  reads straight through (hud-panel-lab.css:378). The ring is mandatory.
- ⚠ **THE CONSOLE IS A CELL IN A GLASS HOUSING**: `.pf-card__field .fl-con
{ --con-ground: transparent }` — the PAINT token only; `--con-void` stays,
  it is the bed for the station diamond and `--pda-void`.
- **THE PILE RECEDES BY DEPTH.** The hook writes `--pc-depth` (Σ enters above
  the slot; additive, 0 when parked; `/test/project-cards` ignores it); CSS
  windows its nearest term as `--pc-dp = depth − cover + cov` so the cover law
  holds. `scale(1 − .03·dp)` about `50% 0` (tops stay on their sticky lines, the
  bands staircase inward — a translateZ toward a top-centre vanishing point
  without a `perspective` the hook could not survive), opacity dims `.08·dp`,
  the wash goes toward the GROUND (`void-deep`, `.14·min(dp,3)`). A covered
  card's CONTENT leaves on the cover channel (`× (1 − cov)`) so the front glass
  looks onto an empty folder, and its `.pf-card__body` is `visibility: hidden`
  once `covered` so nothing under the pile takes focus.
- **THE PLATE FADES IN**: `--pc-in-plate = clamp(0, enter / .45, 1)`, opacity on
  `.pf-card`, exactly 1 at every pin (the smoke reads it there). Measured
  mid-arrival .78 @1440, .86 @1920 — was 1.
- **THE CLIENT IS THE RECORD'S.** `CaseDef.accent?: { rgb: [r,g,b] }` — NUMBERS
  (the envelope scan walks strings and `"rgb(202,165,84)"` trips its
  thousands-separator rule), the client's value never derived from the site's
  gold. `proofStackClient()` → `ProofStack` writes `--pf-accent-rgb` inline only
  when present (fallback `--gold-rgb`); `ProofCard` prints `client.name`. Loop
  carries no accent today (owner: not important); any hue is one triple. ⚠ A
  hue in the mechanical gate's 230–300° band is a finding.
- ⚠ **A RECT IS A PICTURE OF A LAYOUT.** The trinny smoke's `cardShape` reads
  cards 1–3 COVERED, i.e. scaled by depth: `mark` is `offsetWidth`, and every
  inset delta is divided by the card's rendered-over-layout ratio `k`. The old
  reads passed on `.98` only because `21 × .98` rounds back to 21.
- ⚠ **`<html>` SCROLLS SMOOTHLY, SO A `scrollTo` IS AN ANIMATION.**
  `seatProofCard` settles the rewind AND the solve (`settleScroll`) before it
  reads state; a fixed 250ms left the rewind ~900px short under load, the slot
  still stuck, `offsetTop` reading 743 for 0, and the seat converging on
  `covered`. Any new scroll-then-measure in these smokes takes the same helper.

## The pile's hold, and the covered field (ADR-123 commit B, 2026-09-24)

The phone's pile is eight sticky sheets over a LIVE corridor bed (ADR-108's
fixed canvas), and the owner's iPhone reloaded the page inside it — a WebKit
memory kill nothing here can measure, so what is resident and running under
the pile was cut and the cut is bisected on the device (ADR-123 §Part 1).

- **THE HOLD.** In split mode `ProofStack` runs two `IntersectionObserver`s on
  `.pf-stack__runway` (`0 0 -92% 0` and `-92% 0 0 0`): while the runway spans
  from above the frame's top 8 % to below its bottom 92 %, the sheets cover
  everything but the gutters, and `setPileHold(true)` writes three-free
  `lib/home-v2/pileHoldRef.ts` and stamps `data-pile-hold="1"` on `<html>`.
  ⚠ A REF, NOT A STORE FIELD — `servicesAmbient` keeps its single writer
  (ADR-021). ⚠ Observers, never a scroll listener: they fire on the
  compositor's own schedule and cost nothing at rest.
- **WHAT READS IT.** The corridor's `FrameInvalidator` gate is
  `active || armed || docked || (servicesAmbient && !hold) || vwTravel.engaged`,
  re-reconciled on the hold's own listener (`onPileHold`) as well as the
  store's; under the hold a passive `scroll` listener paints ONE frame per
  event so the bed in the gutters still moves, and at rest nothing draws.
  Cost, named: the haze's twinkle freezes in the gutters between scroll
  events. Desktop never sets the hold (the pile is seated over a pinned stage
  there), so the invalidator is byte-identical off the split rung.
- **A COVERED FIELD SHEET STOPS PAINTING.**
  `.pf-slot--field[data-pc-state="covered"] .pf-card { visibility: hidden;
clip-path: none }` in the split block — on the CARD, never the slot (the
  hook measures the slot's rect), and the RECORD keeps its band by
  construction (ADR-107 §4: the band is the tab that names the folder
  underneath). Covered ⇔ cover ≥ .999, so nothing visible changes at the
  flip. ⚠ No `contain: paint` (a rising card sits `--pc-rise` below its slot
  during arrival) and no `will-change`.
- **THE PARTICLE CANVAS DOES NOT MOUNT ON `/`.** `BrandmarkSystem` renders
  `BrandmarkParticleCanvas` only with two live anchors — the journey needs two
  keyframes with a measured rect before it ever sets `visible`
  (`useBrandmarkJourney`), and the landing strips every station that carried
  one; so a second full-screen WebGL context was mounting at DPR 1.75,
  redrawing once per scroll frame, and could never paint a pixel.
  `landing-brand-anchors.test.ts` pins the parsed body at zero anchors. Hosts
  that do mount it take DPR 1.4 on a coarse pointer.
- **GUARDS.** The phone proof-stack smoke: no hold at the top; hold on with
  slot 3 pinned; `__tfFrames.corridor` (exposed under `navigator.webdriver`
  only) advances ≤ 2 over 600 ms at rest and ≥ 2 after six scroll steps; the
  covered field's card `hidden` with its record's band `visible` and the slot's
  box intact; no `.tf-brandmark-particle-canvas`. The ring smoke: on the band
  no hold and the corridor advancing ≥ 5 frames in 600 ms.

## The phone's ruling sheets (ADR-116, 2026-09-21, owner)

- ⚠ **A FIELD SHEET'S CONTENTS FIT ITS BAY, AND THAT IS NOW MEASURED.** The
  bay is a DEFINITE box on a phone (`overflow: hidden`, `container-type:
size`), while `casefile.css`'s ≤960 block stacks the comparison and the
  quadrants and un-clamps every sentence for hosts where height is free. On
  the card that flow was cut mid-line (875px of comparison in a 375px bay).
  The card now keeps each sheet's DRAWING and drops its SENTENCES, which the
  foot frame's verdict carries: GOVERNANCE is two tiles on one line (kicker ·
  name · picture · quoted claim), RED LINE is the 2×2 round `NO AI UGC` (tag ·
  claim). Rules in `proof-stack.css`'s ≤960 block, `.pf-stack`-scoped, so both
  proof hosts take them and neither the arc nor the casefile does. The
  sentences are sr-only, never deleted.
- ⚠ **THE TWO TILES SHARE THEIR ROWS BY `subgrid`** (head · slack · picture ·
  claim · slack) so the two pictures are one size on one line. The picture's
  row is capped at the tile's inner width (`calc(50cqw − 22px)`) and the grid
  fills a capped track before the `fr` rows, so the pair centres with the
  slack split round it. ⚠ **The tile's own `row-gap` must equal the parent's
  (0)** — a subgrid takes the difference out of its items, which shrank the
  picture 9px at 844h with every gate green.
- ⚠ **`100cqh` INSIDE THE SHEET IS THE BAY** (`console.css`'s ≤980 unwrap takes
  the console's container away); `− 2px` is the console's border.
- ⚠ **THE CROSS IS `--hub-cross`**, declared once on `.fl-caps-block--hub
.fl-caps--sheet` and painted by `background-image: var(--hub-cross)`;
  casefile's phone block takes it off a stacked list at THAT selector's
  specificity (its (0,1,0) reset never won — the stray vertical line on every
  host) and the card paints it back on its own 2×2.
- **The guard** is `proof-stack-mobile-smoke`'s ADR-116 case: painted text
  runs' Range rects inside the bay and inside their own tile or quadrant, the
  pictures square, equal, on one line and ≥72px, the quadrants a 2×2 with the
  cross, the hub over no risk. It finds the sheets slot by what it carries
  (`.pf-field--sheets`), never by index.

## The phone's rail and its pitch (ADR-082 U27, 2026-09-19, owner)

- ⚠ **THREE STATIONS NEED 369px ON A 313px ROW, AND THE TYPE IS AT THE 10px
  CONTROL FLOOR** — so size could never close it and the 56px came out of
  CHROME: station padding 9→4, gap 7→5, **the doubled seam margin** (the
  desktop rule adds `margin-left: 6px` on top of `margin-right: 6px`, so every
  seam cost 12px — that alone was the last 8px), and **the ◆ on the OPEN
  station only**. A mark beside a dormant station says nothing; the lit one is
  a filled box that already carries it.
  ⚠ **THE BUDGET IS STATE-INDEPENDENT BY CONSTRUCTION** — exactly one station
  is lit, so the row always spends one mark and a tap cannot re-wrap the row
  under the reader's thumb.
- ⚠ **FOUR STATIONS CANNOT MAKE ONE LINE AT ANY BUDGET** (the tools rail is
  320px of label alone), so that row wraps DELIBERATELY as two equal columns.
  A ragged 3-then-1 reads as a bug.
- ⚠ **THE RESERVE IS NOT SLACK, THE CASCADE IS.** `--pc-card-h` is
  `100svh − top-base − n·peek − bottom-safe` and the DEEPEST slot lands its
  bottom exactly on `vh − bottom-safe`. The hole the owner saw is under an
  EARLY card — slot 1 pins at 116px and ends at 672 on an 852px screen, with
  nothing to peek into because the next slot is a full dwell below in flow.
  **The only lever is the PITCH**, and it is floored by the head band: that
  band is the card's own 13px title over two lines, so 44px is a floor rather
  than a preference. Phone-split only; the desktop pile's 52 is untouched.
- ⚠ **THE SMOKE READS THE PITCH, IT DOES NOT PIN IT.** It asserted the literal
  `52` in three places. It reads `--pc-peek` and asserts the LAW (a field seats
  one peek under its record) plus the 44px floor — a guard that pins the dial
  fails on a tuning change while saying nothing about the law.
- ⚠ **RUN THE MOBILE SPECS WITH `--workers=1`.** Parallel workers against one
  dev server produced four different failures across three runs here, and 9/9
  twice serially.

## The aperture's numbers have THREE hosts

⚠ **720ms in / 420ms out on `cubic-bezier(0.65, 0, 0.35, 1)` is ONE PAIR OF
NUMBERS ACROSS THE SITE**, and since [ADR-119 U1](../../sentinel/decisions/119-the-musings-rack.md)
(2026-09-22) it has a third host: `proof-stack.css`'s `pf-aperture*`, the Trinny
route's `tl-aperture*`, and the musings shelf's `mu-aperture*`. The pair is
ADR-097 U12's settled reading — the corridor caption card's own expo-out is 84 %
open at 90ms, which is right on a 509px card and 2.5× too fast in pixels on an
object this size — so **copy a reference for what it DOES and re-solve its
timing for the size of the object you put it on**, then keep every host on the
result. `tests/lib/musings-row.test.ts` pins all three by source; one changing
alone is a house grammar running a different clock on one surface, with nothing
on screen to report it.

## Verifying

```bash
node scripts/capture-proof-stack.mjs --vp 1440x900 --theme dark --mid --perf
node scripts/capture-proof-stack.mjs --vp 1440x900 --theme light
node scripts/capture-proof-stack.mjs --vp 1920x1247 --theme dark --perf   # the owner's window
node scripts/capture-trinny-london.mjs --vp 1920x1247 --port 3003      # the other host
npx playwright test tests/visual/services-ring-smoke.spec.ts --project=desktop
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
node scripts/design-eval/mechanical.mjs --url / --scope ".pf-stack" --prm        # + --theme light
```

⚠ **THE MECHANICAL GATE MUST RUN WITH `--prm` HERE.** It does not scroll, and
at scroll 0 the record and the field are `opacity: 0` (the hook writes
`--pc-enter` ≈ 0) while the head is not — so a plain run measures the peek
band, reports PASS and never trips the void tripwire. Under PRM the pile is
parked in flow and everything paints.

⚠ **HEADED, AND REAL SCROLLS.** The pile sits over the scroll-driven WebGL
corridor; a headless context leaves the canvas dead and a teleport skips the
engagement band.
⚠ **AND A SEAT CONVERGES, IT IS NOT SOLVED ONCE.** `offsetTop` on a STUCK
sticky slot reports its stuck position, so rewind above the pile before
solving; then converge on `data-pc-state`, the hook's own published value,
because the corridor's lazy mount grows the document under the first scroll.
