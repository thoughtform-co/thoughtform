# ADR-094: /trinny-london — the proof as a card stack, the interstitial, the proposal

**Date:** 2026-09-09
**Status:** Proposed — shipped and guarded, pending the owner's live read
**Surfaces:** `app/(marketing)/trinny-london/**` (`TrinnyPortals.tsx`, `proof/**`, `journey.ts`, `trinny-london.css`), `public/prototypes/v7/landing-trinny-london.html`, `public/trinny-london/*.webp`, `lib/cases/types.ts` + `content/loop-earplugs.ts` (`CaseTrack.card`), `components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx`, `components/landing/home-v2/hooks/useCorridorExitScroll.ts`, `components/landing/v7/rail-instruments/{journeyOrder,useJourneyMarks,sectionGlyphs}.tsx`
**Related:** ADR-093 (the route), ADR-053 (the variant recipe), ADR-030 (the stack mechanic, and the §6 seam bug), ADR-021 (the corridor exit and its no-wall-clock rule), ADR-056 / ADR-089 (the casefile this replaces on ONE route), ADR-059 (the journey marks), ADR-092 (the type tokens the sheet is pinned to), ADR-065 (corners), ADR-077 / ADR-058 (light re-derives)

## Context

ADR-093 put the site's own frame around a client pitch and mounted the proof
casefile unchanged. The owner's read of it, after the client call: the
casefile is a terminal-and-game-UI instrument and on a pitch page it is the
resting point, so it has to read at a glance — clean cards, one per Loop
project, stacking as the reader scrolls; a title, one paragraph and four
bullets on the left; the directory gone. After the proof, nothing of the
offer: the page turns to the client — an interstitial in their colour with
their products, then the proposition, kept apart from the Arc (the Arc is
the approach; this is the offer). Four decisions were taken with him
(cards first and the detail tier only after his read; the accent is the
Naked Ambition coral; a new short lede per project in the record; the
proposal is a drawing of their configuration, not claim cards).

Three things about the landing made this more than a component swap, and
each is a mechanism the site did not have.

## Decision

### 1 · `#services` keeps its id and mounts the route's own slot

`useCorridorExitScroll` resolves `#services` BY ID and returns without it —
the epilogue's dissipate, the dock and the ambient hold would all vanish,
and the "then we land on the proof" handoff is the part of the page the
owner likes. So the station stays, and the fork swaps its inner
`[data-services-root]` for `[data-tl-proof-root]`. `ServicesPortal`
returns before `createRoot` without its slot, which is what keeps the
casefile, the masthead, the plate cluster and the ring hit-areas off this
page with no flag and no shared edit. `home-v2.css`'s exit-band rules keep
the station transparent over the live ambient bed; without the attribute it
paints opaque — fail-safe by default.

⚠ **THE WEBGL CARD RING STILL MOUNTED AND FLEW IN.** `CorridorArmillary`
mounts `ServicesCardRing` on a flag and a media query with no DOM presence
check, and the ring's entrance is `smoothedDissipate × proofRelease` where
`proofRelease` RESTS AT 1 — so with no stage writer the four cards replayed
their fly-in and parked at full opacity behind the transparent station,
visible in every gap the stack left. The route stamps
`data-services-ring="off"` on `<html>` in a LAYOUT effect and the armillary
reads it ONCE at mount (a route property, not scroll state). ⚠ Never gate
on `[data-services-root]` presence instead — the card-face labs mount the
ring without it — and ⚠ never write `proofRelease = 0` from a route:
`useJourneyMarks` and `useActiveSection` read `< 0.75` as "the casefile
owns services".

### 2 · A route-local nested root, a sibling of `LandingPage`

`TrinnyPortals` renders after the `.tl-root` wrapper (passive effects run
post-order, so the parsed body exists on both a full load and a client-side
entry), finds the slot in `document`, and mirrors `ServicesPortal`'s root
lifecycle verbatim. The stack is `lazy()`-imported: the landing's import
doctrine walks this route's static graph, and the stack pulls the casefile's
plates in. `LandingPage` is untouched.

### 3 · The stack is ADR-030's mechanic with this route's skin

`useStackedCardsScroll` reads each `[data-pc-slot]`'s COMPUTED position and
`top`, so CSS owns the geometry and the inert path; it writes
`--pc-enter` / `--pc-cover` / `data-pc-state`. The `.pcl-*` console-plate
skin is not imported — `trinny-london.css` re-authors the sticky recipe
under `.tl-stack` / `.tl-slot` / `.tl-card` (the slot is positioning only;
the recession `scale(1 − 0.02·cover)` and a dawn wash live on the card; no
shadow — the card reference set's own "what not to take").

- ⚠ **THE FIRST PIN CLEARS THE FRAME.** At `--pc-top-base: 16px` the first
  card's head strip sat under the top-left journey row (six marks, ~y45 at
  every viewport). 64px clears the corner zone; every later card's head is a
  peek lower and was always clear.
- ⚠ **THE INERT RUNG IS ROUTE-OWNED.** ADR-030's own rung is `max-height:
759px`, which would make 1280×720 — the reference laptop — a static list.
  This route gates at 680h so it still stacks there (card ≈ 510px), and at
  ≤960w / PRM the four cards are in flow with a gap.
- **The head strip IS the peek band**: kicker + name in 52px, so the pile
  indexes itself — what the directory was for.

### 4 · The card is three registers, by reference

CLAIM `track.project` · FIELD the record's own visual via `track.visual` ·
CHROME one mono kicker. The paragraph is a NEW record field,
`CaseTrack.card.lede` (≤180, pinned beside the brief's ceiling and walked by
the same envelope scan): the brief is the casefile's 420-character
paragraph and a card that reused it carried three sentences where it has
room for one and a half. The bullets are the register's four
`blocks[].title` with their `ProofGlyph` as the mark — sans, not mono; mono
never carries the claim. Order is the route's (`proofOrder.ts`: studio ·
films · tools · map — creative first, the tools around it, the layer last),
content is `CASES`'s.

The field, per kind — the six ads whole at 4:5 (natural colour, ADR-056 U5),
the two posters, the four AUTHORED wireframes (the drawn record, ADR-068
U3), the PDA console. Two of them follow the FIELD's aspect through a
container query, because the owner's 1920×1247 gives the field a PORTRAIT
box while 1280×720 gives it a landscape one: the wireframes are authored for
landscape bays (W/H 2.3–2.9) and squeezed to 345×450 cells in a 2×2 at the
tall shape — mímir's three panels printed through each other — so a
portrait field stacks them 1×4 (690×235); the posters likewise stack. The
ads count their rows the same way (two rows where the aspect affords them,
one where it does not). ⚠ `.fl-con__console` and `.fl-imap__svg` rest at
opacity 0 without an ancestor `data-proof-settled`; the field host declares
it statically (the arcs' recipe). ⚠ `PdaConsole` owns the wheel while the
pointer is on it; inside a sticky stack that freezes the page whenever the
cursor rests on card four, so the map field carries a transparent layer
above the console — the events reach nothing that calls `preventDefault`.

### 5 · The ambient's kill edge is declared, not hardcoded

`useCorridorExitScroll` resolved the station the ambient fades against from
hardcoded ids (`#voidwalker ?? #practice ?? #contact`); on this page both
former are absent, so the canvas survived to `#contact` and the new opaque
interstitial would have HARD-CUT it at its own top (ADR-030 §6, a fifth
time). Additive: `[data-corridor-kill]` is consulted first, the chain is the
fallback, production stamps nothing. ⚠ **THE COVER SIDE IS KEYED ON THE
SAME ATTRIBUTE** (`html[data-corridor-exit] .tl-root [data-corridor-kill]`,
the `#voidwalker` form — relative, z 6, `content-visibility: visible`,
keeps its own ground), so JS and CSS cannot name different stations. The
interstitial declares its own opaque ground at id specificity; the ambient
fades over its approach band while the fourth card is pinned.

### 6 · The journey clock learns a roster-only station

`TRINNY_JOURNEY_ORDER` is `hero · about · thesis · navigate · encode · build
· services · proposition · contact`. The Proof mark keeps the `services` id
— the manifest row is the only way a mark lights through `resolveActiveIdx`
— and draws the `proof` glyph through a new `MarkSpec.glyph` (the
`JourneyMark` field already existed for the arcs). `proposition` is a
station the manifest does not know; `resolveActiveIdx` mapped it to index 0
— the hero — so the HOME mark would have lit over the proposal with nothing
throwing. `rosterDirectId` answers such an id straight off
`data-active-station` (only on a roster, never while the corridor is
engaged, and never for a manifest station id, whose path carries the beat
granularity and the proof/services split); `journeyPosition` /
`journeySector` take it as an optional fourth argument, every
three-argument caller byte-identical. Both `#trinny` and `#proposition`
publish `proposition`, so the Proposal mark lights from the interstitial
on. The `splitServices` helper keeps a roster with no `proof` row on
`services` rather than lighting nothing while the offer's clock happens to
read "held".

### 7 · The interstitial and the proposal are static HTML in the fork

The interstitial: opaque, one viewport, parchment graded into
`--tl-brand-rgb` (240,104,80 — sampled from the Naked Ambition tube, a
route-local token, never a `--gold` re-derivation), the four product
cutouts from the `shearwater` engagement's harvest as alpha WebPs in
`public/trinny-london/` (⚠ CSP is `img-src 'self'`; ⚠ the Good
Housekeeping roundel is a composited overlay and was cropped off), each on
`data-parallax` at its own speed — ⚠ never a keyframe: ADR-021 bans
wall-clock motion on the landing. The proposal: title-left /
paragraph-right head over a coral rule, then THEIR configuration plotted —
the people, the encoded layer (gold: the one thing that gets built), the
surfaces they already run — with 1px DIV connectors (the wireframe law),
adoption reading down and automation up, three mono kickers. No Arc
labels, no digit, no "self-sufficient" (the parse guard walks the text).

## Alternatives rejected

- **Removing `#services` and adding a `#proof` station.** The exit hook
  returns without `#services`; the dissipate the owner likes goes with it.
- **A prop on `ServicesStage` selecting the proof.** A shared seam for a
  one-route decision, threaded through a component whose runway is a shared
  stylesheet (`--svc-proof-runway`); the slot swap costs nothing shared.
- **Gating the ring on `[data-services-root]` presence.** The labs mount it
  without that markup.
- **A pure-CSS stack (`animation-timeline: view()`).** The cover channel for
  card i is the ENTRANCE of card i+1, a sticky element's own `view()` stalls
  at the pin, and it publishes no state the smoke can assert.
- **Reusing the brief as the card's paragraph.** Three sentences in a box
  for one and a half; the owner's complaint was the amount of text.
- **Claim cards for the proposal.** A second card grid competing with the
  proof's; the drawing plots a record instead.

## Consequences

- `/` and `/claude-workshop` are unchanged where it counts: every shared
  edit is an `?? existing` fallback or a mount-time attribute read that
  production never stamps; the HUD pixel snapshots pass without
  `--update-snapshots`.
- `.claude/rules/landing-v7.md`'s "do not remount tools-cards" now names the
  retired STATION and exempts the mechanic.
- `mobile-section-seams.spec.ts` is `/`-only; the trinny stations are not
  in its `STATION_IDS` — phones are covered by the capture script.
- The detail tier (a click opens the full plate in a dialog) is the next
  step after the owner's read; the cards carry no CTA until then. ⚠
  `.claude/rules/proof.md` names a `useDialogShell` that was never extracted
  — `MediaLightbox` + `useWalkthrough` are the implementation.

## Three things found by looking, every gate green

1. The ring behind the stack (§1) — the plan as first written shipped it;
   the design review caught it before the still did.
2. The first card's head under the journey marks at every viewport.
3. The tool drawings printing through each other at the owner's viewport —
   invisible at 1280×720 and 1440×900, both landscape fields.

## Verifying

```bash
npx vitest run tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx tests/lib/trinny-proof-order.test.ts tests/lib/cases-registry.test.ts tests/lib/rail-instrument-marks.test.ts tests/lib/section-label.test.ts tests/lib/landing-import-doctrine.test.ts tests/lib/type-material-tokens.test.ts tests/lib/theme-lock.test.tsx
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop        # UNCHANGED
npx playwright test tests/visual/landing-corridor-smoke.spec.ts tests/visual/services-ring-smoke.spec.ts --project=desktop
node scripts/capture-trinny-london.mjs --vp 1920x1247        # headed — LOOK at the stills
node scripts/capture-trinny-london.mjs --vp 1280x720
```

## Left open

- The detail tier, after the owner's read.
- The structural orbits (`orbitExitGetter` rests at 1) still draw behind the
  stack; judged acceptable on the stills — gate them under the same
  attribute if gold hairlines ever show between cards.
- The nav-corner readout resolves the proposal to "THE ARC" (the route hides
  it; bars only), and the sub-1101×760 rail diamond would jump to the hero
  detent there.
- The proposal runs past one viewport at 1280×720 (head + drawing +
  kickers); fine at the owner's shape.
