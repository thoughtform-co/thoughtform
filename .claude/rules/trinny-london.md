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
description: The Trinny London pitch variant — the light lock, its own journey clock, the proof stack, the interstitial and the proposal
---

# Rule: /trinny-london

A client pitch page built as a HOMEPAGE VARIANT on the ADR-053 recipe, forced
into light, unlisted. Same `LandingPage`, same corridor, order
hero → about → the Arc → **the proof STACK (in `#services`) → the Trinny
interstitial → the proposal** → contact.

**Read first**

- [ADR-094](../../sentinel/decisions/094-trinny-proof-stack-and-proposal.md) — the proof stack, the interstitial, the proposal, and the three mechanisms they needed
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
  URLs. ⚠ They float on `data-parallax` — the house channel — never a keyframe
  (ADR-021: no wall-clock motion on the landing), and never a `transform:
translate` beside it (the channel writes `translate`; a transform doubles it).
- **`--tl-brand-rgb` is a route-local token** (240, 104, 80, the Naked Ambition
  tube). Never a re-derivation of `--gold`: the WebGL golds are exempt from CSS
  by design and would go out of step.
- **The proposal letters no Arc vocabulary, no digit, no "self-sufficient"** —
  the parse guard walks its text. Connectors are 1px DIVS (the wireframe law).
- **`mobile-section-seams.spec.ts` is `/`-only** — the trinny stations are not in
  its `STATION_IDS`; phones are covered by the capture script.

## Verifying

```bash
npx vitest run tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx tests/lib/trinny-proof-order.test.ts tests/lib/theme-lock.test.tsx tests/lib/cases-registry.test.ts tests/lib/rail-instrument-marks.test.ts
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop   # UNCHANGED
node scripts/capture-trinny-london.mjs --vp 1920x1247
node scripts/capture-trinny-london.mjs --vp 1280x720
```

⚠ The capture is **headed and at the owner's own viewport** — every reference
viewport in this repo is landscape while he runs a tall window, and headless
leaves the corridor canvas dead. **Look at the stills**: every defect this
route has found was invisible to a green gate. ⚠ The in-app Browser pane
cannot drive a scripted scroll while hidden (its animation frames stall), so
the capture script is the way to see the page.

**Process:** [sentinel/MAINTENANCE.md](../../sentinel/MAINTENANCE.md) — Cycle B
when adding a section, Cycle A after fixes.
