---
paths:
  - "components/landing/home-v2/services/proof-stack/**"
  - "app/(marketing)/trinny-london/proof/**"
  - "components/landing/home-v2/services/ServicesStage.tsx"
  - "components/landing/home-v2/hooks/useServicesStageScroll.ts"
  - "scripts/capture-proof-stack.mjs"
description: The proof card and its scroll-stacked pile — the site's evidence beat, shared by the homepage and the Trinny London pitch page
---

# Rule: the proof stack

Four projects from one casefile as a scroll-stacked pile of cards. Built for
`/trinny-london` (ADR-094) and promoted to the homepage's evidence beat in the
casefile's place (ADR-096). **One module, one sheet, two hosts.**

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
- [`.claude/rules/trinny-london.md`](trinny-london.md) — the other host.

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
- ⚠ **THE INERT RUNG IS RESTATED IN TWO SHEETS AND MUST STAY IDENTICAL** —
  `(max-width: 960px), (max-height: 680px), (prefers-reduced-motion: reduce)`.
  `proof-stack.css` parks the slots; `services.css` puts the box back in flow.
  Park one without the other and the pile lands on top of the offer accordion.
- **`tracks` is a PROP.** Content by reference, ORDER by route (`proofOrder.ts`,
  shared today). ⚠ The pile's order and each card's `arc.step` can disagree with
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
- ⚠ **FOUR CONSOLES ARE MOUNTED AT ONCE.** `document.querySelector(".fl-con__console")`
  answers with the SHEETS card whatever is on screen, and `.fl-pda` / `.fl-wire`
  are unique only by luck. Scope every measurement to `[data-pc-index="N"]` —
  this is the one thing the single-panel casefile never had to say.
- ⚠ **`.pf-card` IS A CONTAINING BLOCK FOR `fixed` DESCENDANTS** (it carries a
  `clip-path`). Survivable only because `MediaLightbox` portals to
  `document.body`; a dialog written inline here is trapped in the card.
- **`ProofStack` is a named AND default export.** `/trinny-london` mounts it
  through `lazy()`; the homepage imports it into `ServicesStage`.

## The folder (ADR-097, live on both hosts)

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
