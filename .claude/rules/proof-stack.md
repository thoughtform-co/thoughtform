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
  1920×1247. `useServicesStageScroll` reads `.pf-stack`'s box, adds
  `SERVICES_PROOF_RELEASE_VH`, and writes the total onto `--svc-proof-runway`
  once per resize. `SERVICES_PROOF_RUNWAY_VH` is the PRE-HYDRATION RESERVATION
  (and the fallback), deliberately the ceiling of that range;
  `services-proof-runway-lockstep.test.ts` still pins the CSS literal to it.
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
- **THE FRAME OPENS INTO THE RAIL** (U3, owner: "the horizontal divider or
  border for the frame where the images live, we shouldn't have that. The
  vertical lines should just connect to the tabs above it"). The frame is a
  bay the rail is the HEAD of: both framed kinds take `border-top: 0` — the
  shared `.fl-con__console` (sheets, map) and the tools' own
  `.pf-field--tools` — `.pf-field`'s inset drops its top term, and `--con-gap`
  is `0px` here so the console's box IS the field's box. Measured: frame top =
  rail bottom. ⚠ U3 also pinned the walls to the STATIONS' outer edges; U4
  made the rail full-bleed and the frame is 18px inboard of it now, by design
  — that clause was an inference, the lid and the reach to the rail were the
  instruction.
  ⚠ **`--pf-field-gap` IS DELETED, NOT ZEROED.** It was subtracted in two
  derived heights (the film's width and the wire's); a no-op term in an
  arithmetic chain is a term the next reader has to disprove. Three sites move
  together.
  ⚠ **PINNED FROM BOTH ENDS** — a box that lost ALL its borders passes a
  no-top-border assertion, so the smoke asserts the lid is `0px` AND the left
  wall is not, plus the wall reaching the rail and landing on the station's
  edge.
- **THE RAIL IS FULL-BLEED; EVERYTHING ELSE KEEPS ITS INSET** (U4, owner: "the
  tabs need to connect with the vertical rail that separates the left and the
  right panel … the tabs should be full width and should also reach the edge
  on the other side. The visuals and the text can remain centered with some
  padding or margin"). `.pf-card__tabs` negates the field's `padding-inline`:
  first station ON the divider, last ON the card's edge, measured 0px at both
  ends. ⚠ **THIS REVERSES ADR-094 U8's ≥15px RAIL INSET**, which was the
  owner's own note — and it is not a contradiction: U8 was about the elements
  INSIDE the panel and this is the ruling that the rail is not one of them.
  ⚠ **PINNED IN BOTH DIRECTIONS**: the rail on the field's edges AND the frame
  on the field's padding. A rail that drifted inboard and a frame that went
  full-bleed each look like the other's fix, so neither half asserts alone.
- ⚠ **THE RAIL'S DATUM COSTS THE BAY 41px**, so the height-bound film narrows
  347 → 326px at 1440×900 (U3 gave 10 back with the gap) and its caption wraps
  to two lines; one line needs ~347. Nothing clips, and the height cannot be
  taken back without breaking U8's floor rule (every field ends on the
  record's floor) — which is the other half of what makes the two columns read
  as one card.
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
