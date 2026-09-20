---
paths:
  - "components/landing/home-v2/services/**"
  - "components/landing/home-v2/unifiedServicesInstrument.ts"
  - "components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx"
  - "lib/services-ring/**"
description: Services card ring — the corridor↔DOM split, and what must move together
---

# Rule: Services card ring

`#services` is the corridor's conversion beat, and it is split across **two
React roots**: the cards are WebGL planes orbiting inside the corridor canvas
(`CorridorArmillary` → `ServicesCardRing`), while every interactive and
readable surface is DOM in `ServicesStage`. Nothing about it is a single
component you can edit in isolation.

**Read first**

- ⚠ [ADR-112: The portrait raster, and the four services](../sentinel/decisions/112-the-portrait-raster-and-the-four-services.md) — **THE LIVE FACE since 2026-09-19 (owner): `raster-photo`** — the photograph itself as glyphs at rest, resolving into the photograph on hover through the VEIL PLANE; and the FOUR SERVICES re-cut: Keynote · Workshop · **Embedded** (Advisory folded in) · **Home session**. See §The portrait raster below
- [ADR-086: The services card carries the work, not the practitioner](../sentinel/decisions/086-services-card-carries-the-work.md) — the face from 2026-08-30 to 2026-09-19: `card`, the constellation drawing (one cloud, four edge rules) on the centred arrangement with the title pinned to display. Superseded on the FACE by ADR-112; the title datum, `faceUsesPhoto` and its finding still bind. ⚠ **Three things keyed off the photograph and none of them errors without one** — the fetch, the veil and the scrims all read `faceUsesPhoto`; see §The card carries the work below
- ⚠ [ADR-108: The ring on phones](../sentinel/decisions/108-the-ring-on-phones.md) — **PROPOSED (2026-09-16), shipped behind `SERVICES_CARD_RING_MOBILE`, the owner's DEVICE read is the gate.** The same ring in the same canvas on the phone rung: the corridor's ambient hold engages on phones, a sticky BAND in `ServicesStage` is the ring's seat and clock, the ring draws at a phone profile (half bake, no drawer, no hover, the scale SOLVED at the front card's depth). ⚠ **[ADR-109](../sentinel/decisions/109-the-services-beat-on-a-phone.md) (same day, owner) MAKES THE BAND THE COMPOSITION** — title · seat · paragraph in one screen, the ring fitted to the measured seat, no plates on the rung. ⚠ **[ADR-110](../sentinel/decisions/110-the-card-turns-over.md) (same day, owner) MAKES THE OPEN STATE THE CARD'S OWN BACK** — a tap turns the card π about its Y and a per-card back plane carries the spec, baked lazily at 0.75 through the new `ringType.ts` ramp and fit-solved by `backFace.ts`; ADR-109's DOM sheet lasted a day. See §The ring on phones below
- [ADR-029: Services card ring](../sentinel/decisions/029-services-card-ring.md) — the ring, and the ONE-OBJECT guardrail
- [ADR-050: Card face + in-canvas drawer](../sentinel/decisions/050-services-card-face.md) — the tight face, the drawer, the promotion
- [ADR-025: Services hologram stage](../sentinel/decisions/025-services-hologram-stage.md) — the oscillation history; read before redesigning this surface again
- [ADR-044: Services masthead](../sentinel/decisions/044-services-masthead.md) · [ADR-047: About deck flip](../sentinel/decisions/047-about-deck-flip-stage.md) — the beat before and the beat after
- [ADR-061: Intelligence Map work configurations](../sentinel/decisions/061-intelligence-map-work-configurations.md) — proposed harmonization contract for the Proof field mounted at the front of this stage; do not mark accepted before verification

## The card is ONE object

The 2026-07-10 red alert stands: never split a card into a photo plane plus a
separate text console, and never hide the card to show something else in its
place. All copy is BAKED onto the face. The open state is the card's own
in-canvas **drawer**, not a DOM plate — three DOM revisions were rejected
because a flat DOM rect cannot be a projected, tilted, bloomed slab, so the
silhouette changes shape at the handoff however well the pixels match.

Consequence: anything interactive or screen-readable about a baked surface
lives in `ServicesRingHitAreas`, shimmed over a **projected rect** the canvas
publishes to `hologramConnectorStore`. A surface with its own yaw needs its own
rect — the drawer is not a linear extension of the card's.

## Proposed About→Voidwalker portrait handoff

**Proposed and unshipped/unpushed; pending visual approval.**
`ServicesCardRing` is the sole owner of the portrait transform across the
capable `-120svh` / `20svh` shared pin seam.
It interpolates to a Three-free viewport-seat ref inside the existing corridor
canvas. The About/Voidwalker portal publishes geometry only: no duplicate
portal transform, no revived `--about-portal`, and no second canvas. Keep the
ref module free of Three/Fiber/Drei so the landing DOM import boundary does not
regress. The seam is disabled at 961–1100 and on every
mobile/PRM/corridor-fallback/flag-off path.

## The portrait raster (ADR-112, live)

The face is `raster-photo`: the photograph itself, as glyphs, resolving into
the photograph on hover. Four lab rounds in one day led here (materials →
bodies → the lattice → "no extrusion … a raster that fills most of the card
… on hover it reveals the photos"); the owner read the row live and promoted
it with the four services it was baked on.

- **The rest face** is `cardViz.applyGlyphRaster` over the toned plate: 78 × 76
  PT Mono cells on the raster's 18px pitch, each a glyph off the shaded ramp
  by the cell's mean luminance, NORMALISED to the plate's 5th–98th percentile
  (one gamma cannot serve the gold plate's crushed blacks and the parchment
  print's lifted ones), every third row losing light. ⚠ **A PRINT INVERTS**
  (`FacePalette.print`): the first light still was a negative. ⚠ **The two
  type bands are QUIET** — `RASTER_QUIET_HEAD` 300 / `_FOOT` 1060 in
  `lib/services-ring/reveal.ts` (three-free), eased 40px into the field, at a
  quarter alpha, with the `full` band's scrims stacked on top. The type draws
  last. `tests/lib/services-ring-reveal.test.ts` pins that the bands clear the
  title's second line and the paragraph's first.
- **The reveal rides the VEIL PLANE** (ADR-050 U3's own "hover resolves the
  photograph", verb kept, mechanism inverted: the face is the screen, the
  plane carries the photograph). `hologram/cardReveal.ts` is a ShaderMaterial
  over the same composition baked WITHOUT the glyph pass (`bakeCardFace`'s
  `photoOnly` option — ⚠ never a phantom `"reveal"` variant, which five
  predicates would accept). A FIXED 42 × 68 pop grid, a mosaic refining
  24 × 39 → full under it, the type bands cross-fading crisp, all off one
  damped level at `REVEAL_DAMP_RATE` 4.5/s (slower than the veil's 7 so the
  mosaic is seen refining). ⚠ **`texture2DGradEXT` with the ORIGINAL uv's
  derivatives**, or every cell border picks a coarse mip and draws a
  hairline. ⚠ **`.opacity` on a ShaderMaterial is a silent no-op** — the loop
  keys on the VARIANT (`revealMaterialsRef`, null elsewhere) and writes
  through `driveRevealMaterial` in the material's module (which is what holds
  the lint budget: one warning per ref-derived local a property is written
  on). `uOpacity` is held at 0 while `uMap` is null; an unbound sampler reads
  opaque.
- ⚠ **`bakeCardFace`'s `drawn` is `!faceUsesPhoto(variant)`**, never the
  two-term expansion it was: a third photographed viz was "drawn" and baked
  the constellation under nothing, silently.
- **The phone takes the rest bake** (no hover, no reveal; the tap turns the
  card over). It FETCHES the four portraits now — 342 kB, a cost ADR-109 had
  counted as absent — and its face is unread on a device. Keeping the phone
  on `card` was refused: the constellation's `guided-build` drawing is the
  SURVEY, which means Advisory's person-led work, under the Home session.
  ⚠ **`bakeCardFace`'s cover fit is `fit`, never `scale`** — as `scale` it
  shadowed the bake-scale parameter and the phone rastered a QUARTER of its
  canvas over the photograph (the first phone still). ⚠ The fallback veil is
  HIDDEN on `raster-photo` (its dots are the photograph's treatment, a second
  screen over glyphs). **A bake that scales is verified at the scale it ships
  at** — `scripts/capture-services-mobile.mjs`, not the lab.
- **Every path keys on `faceVariant === "raster-photo"`**: the bake branch,
  the reveal bake (no setState otherwise), the veil-material swap (a stable
  `null` dep on every other face), the loop's write. The v8 face was
  pixel-diffed before and after: only the scroll-clocked backdrop differed.
- **The four services** (`servicePlateData.ts` / `serviceData.ts`): Keynote ·
  Workshop verbatim; **Embedded** — chip is the doctrine's flagship word,
  ADR-111's title stays, the leadership altitude (Advisory's standing read)
  enters as the third workstream's own bullet and an include; **Home
  session** on the `guided-build` slot — six to eight people at the owner's
  table in Antwerp for one morning, `Reserve a seat`, the slot's own
  `strategic` photograph. ⚠ **NO DIGIT ON THE HOME SESSION** (ops prices it
  per seat; `tests/lib/services-copy.test.ts` bans digits outright, the feed
  label's slot ordinal excepted) and the fit is solved on production by the
  same test. The designations (AT THE TABLE · THE ARGUMENT · THE SKILL ·
  NAVIGATE), the scan note and the smoke's role-name pins moved with the
  chips; the lab's `serviceRecut` module dissolved — no alias.
- Dials left for the owner's read: the rest raster's base alpha (dim in
  dark, 15–41 % band coverage), the scan cadence, the ink (the cell's toned
  colour is one line away).

## The card carries the work (ADR-086, 2026-08-30 → 2026-09-19)

⚠ **Superseded on the FACE by ADR-112 above** — the face was `card`, a drawn
constellation where the photograph used to be, three components and no more
(a title, a paragraph, a visualization — owner's own constraint). What
survives: the title datum off the chit, the `faceUsesPhoto` predicate and its
three consumers, the `card` face itself as the lab's V8.

- ⚠ **`faceUsesPhoto(variant)` IS ONE PREDICATE BECAUSE THREE THINGS READ IT,
  AND ALL THREE FAIL SILENTLY.** The face bake is not the plate photo's only
  consumer: the ring **fetches** all four portraits before baking (334 kB the
  landing paid for a card that painted none of them), the hologram **veil** is
  the photo's dot-matrix treatment and runs full over y 230–640 — straight
  through the poster band's figure — and the **scrims** exist to hold copy over
  an image. None of them throws on a drawn face. They just degrade it.
- ⚠ **THE VEIL IS SILENCED ON ITS MATERIAL, NEVER BY DROPPING THE MESH.**
  `DECK_INTRA_ORDERS` rebases renderOrder positionally over
  `cardGroup.children` — see the renumbering trap below.
- ⚠ **THE SCRIM TEST IS THE BAND, NOT THE DRAWING.** A `full`-band composition
  either carries a photo or bleeds its field under the type (nebula); both need
  the ramp. A banded drawing clears the copy by ~100 units and never does.
  Shipping the ramp on a drawn face is wrong in DARK (it washes the lower half
  of the figure toward black) and a no-op in LIGHT (the scrim family IS the
  parchment ground) — an unexplained gradient in one theme only.
- ⚠ **THE CHIT DOES NOT MOVE, THE TYPE DOES.** A centred title cannot share the
  chit's centre line the way a top-left one does, so `TITLE_HEAD_CAP_TOP`
  CLEARS it — derived as `TIGHT_EXPAND_INSET + TIGHT_EXPAND_SIZE + 50`, so the
  two cannot drift apart.
- ⚠ **THE `poster` BAND IS SOLVED AGAINST THE WORST-CASE TYPE** across all four
  services (two title lines + a four-line paragraph → 100/99 units of
  clearance), and the figure is HEIGHT-bound, so ~328 is its ceiling. Growing
  the box buys nothing.
- ⚠ **MOBILE STILL CARRIES THE PHOTOGRAPHS.** `ServicePlateCard` is a separate
  surface with its own IA (ADR-083) built around a full-bleed photo window, and
  the four assets stay live for it. The ruling is desktop-only today.
- `tight` and `full` are byte-identical through this change and `tight` stays in
  the lab as V1 — the face variant is one word in `CorridorArmillary`.

## What must move together

Changing the card's shape or state model touches every file in the table
below, in lockstep. Change one alone and the surface is incoherent, not merely
imperfect. ⚠ **THE TABLE IS THE RECORD AND THE PROSE DOES NOT COUNT** — it said
"six" over ten rows while `CLAUDE.md` said "five", three counts and all of them
wrong (ADR-111). A number in a sentence beside a list is a number nobody
updates:

| File                                     | Owns                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `unifiedServicesInstrument.ts`           | the flag (`SERVICES_CARD_RING`, `SERVICES_CARD_DRAWER`)                                                                    |
| `CorridorArmillary.tsx`                  | mounts the ring; passes `faceVariant` / `openDrawer`                                                                       |
| `ServicesStage.tsx`                      | owns open state; the production `openPlateRef` writer                                                                      |
| `ServicesRingHitAreas.tsx`               | every hit target + the sr-only copy of baked text                                                                          |
| `ServicesDesignationLayer.tsx`           | callout occlusion against each published card rect                                                                         |
| `BrandmarkPhysicsCoreActor.tsx`          | publishes `rigPointerYawRef` — the rig yaw the open pair cancels (ADR-050, 2026-07-27)                                     |
| `casefile/ServicesCasefile.tsx`          | the proof casefile that holds the front of the runway (ADR-056)                                                            |
| `useCorridorExitScroll.ts`               | the dock gate — on the phone rung `mobile` is `≤960 && !ringMobile` (ADR-108)                                              |
| `ringCtaBox.ts`                          | the bake dims AND the phone bake ratios (`BAKE_SCALE_MOBILE`, `_BACK`, `bakeSize`) — three-free                            |
| `backFace.ts` · `ringType.ts`            | the phone back's rows (fit-solved) and the baked type ramp (ADR-110) — three-free                                          |
| `lib/services-ring/reveal.ts`            | the portrait raster's quiet zones and the reveal's ramps (ADR-112) — three-free, read by the bake, the shader and the test |
| `hologram/cardReveal.ts`                 | the veil plane's reveal material and its per-frame write (ADR-112)                                                         |
| `servicePlateData.ts` · `serviceData.ts` | the four services' copy — the chips are ACCESSIBLE NAMES the smoke pins (ADR-112)                                          |

`openPlateRef` has a **single-writer contract**: `ServicesStage` in production,
`CardFaceLabShell` on the lab route. Never add a third.

## The copy law for this surface (ADR-111)

The services cards sell the practice's offer, so the doctrine's own bans apply
to every string here. ⚠ **They were codified only in `.claude/rules/arcs.md`
and `.claude/rules/trinny-london.md` until 2026-09-17** — the surface that
carries the offer had no guard at all, which is how a superseded position
regresses silently.

- ⚠ **NO PRICE FIELD** (owner, 2026-07-25, restated in `servicePlateData.ts`).
  Money stays in the proposal. The doctrine prices each workstream as its own
  stage gate; **the STAGES may be named, the PRICES may not.**
- ⚠ **BANNED WORDS, from the strategy skill's language bank:**
  **"self-sufficiency"** (say the behaviour — the approved substitute is "a
  setup the team runs by itself"; the landing already bans it, ADR-018),
  **"flywheel"**, **"fractional"** without the cadence AND the dated handover in
  the same breath, prompts-as-product, **the founder as the offer** (no person
  named), and Navigate/Encode/Build as three separate products.
- ⚠ **PRODUCTION CARRIES ITS BOUNDARY OR IT IS NOT MENTIONED.** "Never an
  ongoing production retainer, never asset delivery as the thing sold" (settled
  2026-09-12). There is no room for the clause on a card, so the cards say
  `Fixed term, dated handover` instead — which the doctrine itself calls what
  separates the engagement from a retainer.
- ⚠ **STAY IN THE JUDGMENT HALF.** Thoughtform owns the judgment layer, not the
  data layer — no ontology, knowledge graph, systems of record or permissions in
  card copy. Name the seam, never model the data.
- ⚠ **VALUE AND DEPENDENCE IN THE SAME BREATH.** A layer claim stated alone
  arms whoever wants to cut the experts. The Embedded card names the team as the
  mechanism twice (`participants`, `leavesWith`) for exactly this reason.
- ⚠ **THE LEDE IS ≤160ch** (`servicePlateData.ts`: past that it crowds the title
  band), and ⚠ **THE PHONE BACK'S FIT IS SOLVED BEFORE THE STRING IS WRITTEN,
  never after.** `tests/lib/services-ring-mobile-gate.test.ts` walks every plate
  through `backFaceLayout` and fails FIRST on long copy. The cost model is in
  ADR-111: one paid line of budget, a third title line is fatal (`<= 2` is
  asserted), and `participants` / `language` growing to two lines is FREE
  because `rowH = max(...)` and their rows are already two-line tall.
- ⚠ **`chip` AND `ctaLabel` ARE ACCESSIBLE NAMES.** `ServicesRingHitAreas`
  builds the sr-only copy from them and `services-ring-smoke` pins the resulting
  role names. Changing either moves those pins in the same commit.

## The Proof map allocates work configurations

`ServicesCasefile` uses one evidence hierarchy. The left column carries the
selected project's identity, summary, exactly four proof points and the
directory. New proof points are `CaseBlock { title, desc }` — a CLAIM and its
evidence; the display figure was deleted in ADR-067 because across four rows
its values carried nine different grammars. Legacy `readouts` normalize into
that same 2×2 register. The right panel has no generic footer: the selected
visual owns its full height beneath the designation rail.

The Intelligence Map has exactly three projections: **CONFIGURATION · TEAM ·
ALLOCATION**. The persistent moving atom is a work configuration, keyed by a
stable non-display id, and selection survives projection and overlay changes.
Configuration uses one vertical set of five work-shape anchors. The canonical
47 Skills form one fixed bus labelled `ENCODED SUBSTRATE · 47 SKILLS / 5
SHAPES`, with 47 persistent pips in five unlabelled runs. Do not restore a
bottom shape legend, SUBSTRATE tab, STACK view or renamed Skills inventory.

Compact detail occupies a reserved, non-overlapping lower console: identity,
summary and six facet states plus checkpoint, allocation basis, broad owner and
linked Skill names. Expanded detail reuses the component and adds facet prose
inside the lazy ADR-006 portal. Linked pips plus those names are the complete
relationship treatment. No relationship SVG, ResizeObserver or node-to-pip
measurement loop is allowed.

Allocation communicates rounded aggregate evidence through generic Fast ·
Everyday · Deep · Frontier lanes, reach/draw cohorts and qualitative bands. It
is not live telemetry and must never attach token counts, cost or causal usage
shares to a Skill. Visible and hidden browser data carry no personal names or
identifying initials, vendor/model names, currency, internal links or private
board/doc/repo identifiers. Private sources are authoring inputs only.

Keep the field on the DOM seam: pure deterministic layout, one bounded
click-driven intra-field FLIP, no second canvas/force graph, no runtime private
fetch and no Three/R3F/Drei import. Its instrument grammar is flat: solid
surfaces, one-pixel rules and categorical marks, with no map gradient or hatch
fill. Mobile uses grouped in-flow rows and detail rather than squeezing the
desktop field. `97%` stays canonical across Proof and the AI keynote, and all
four Software for Few capability labels remain live while their canonical tool
records remain Production. Full accepted contracts and verification evidence live
in ADR-061 and `.claude/rules/proof.md`.

## Traps specific to this surface

- **Renumbering the deck.** `DECK_INTRA_ORDERS` is positional over
  `cardGroup.children`. Mount children with their FLAG, never gated on a lazily
  loaded texture — a mid-session child insert renumbers the ADR-047 deck's
  slots while its rebase is running.
- **Drawer renderOrder stays POSITIVE** and nested inside the card's range;
  orbit tracks render at 0, so a negative slot puts gold track dashes over the
  drawer's text.
- **Growing the card's footprint** invalidates the DOM overlays that dodge it —
  feed the new rect to `ServicesDesignationLayer`'s existing filter rather than
  inventing a second suppression path. The symptom mimics a texture
  bleed-through; see BEST-PRACTICES.
- **The open pair's edges are a YAW problem, not a bake problem.** The tray
  is offset a card-width along card-local +x, so any residual yaw — the
  card's, the rig's — swings it deeper and perspective draws it smaller,
  splitting the top/bottom borders. Nudging bake insets to compensate chases
  a moving target: the error tracks the cursor. Zero the yaw (and the
  drawer's content depth) instead; spend liveliness on PITCH, which moves
  both slabs identically. The RIG's yaw counts too — cancel it ON THE CARD
  (`openPairYaw` × `rigPointerYawRef`), never by damping the rig, which
  freezes the mark and orbits while a card is open. ADR-050 "Flush seam".
  **…and PITCH is DAMPED, not free (2026-08-02).** "Spend liveliness on
  pitch" met its limit: rig pointer pitch + hover pitch reach ~0.3 rad at a
  screen corner, and at that lean the pair's EXTRUDED frames (glass walls,
  chamfer cut, double silhouettes, the tray's open glint) stop agreeing
  with the flat bakes — the owner's "Escher-esque". `openPairPitch` ×
  `rigPointerPitchRef` scales the open pair's WORLD pitch to
  `OPEN_PAIR_PITCH_KEEP` (0.22 ≈ 4° max) on the same drawer clock; closed
  ring and deck are byte-identical (t = 0 identity, unit-pinned). The tray
  glint also dropped its BACK-face outline — an open bracket cannot afford
  two silhouettes (front U + floating back U = an impossible object under
  any tilt); the leading depth edges alone carry the thickness read.
- **The DRAWER bake is THEMED; the card faces are not (2026-08-02).**
  `bakeDrawerFace` takes a `DrawerPalette` — dark is the shipped ADR-050
  literals verbatim, light is Semantic Dawn ground / Latent Night ink /
  light-role gold (#caa554 — Tensor in BOTH modes since 2026-08-02;
  ADR-058's one-day #9a7a2e darkening is reversed), and the tray's slab caps, walls and glint
  follow via the same `drawerTheme` state (re-baked on a store flip; the
  old set disposes through the `[drawerTextures]` cleanup). The CARD faces
  keep their photo-dark treatment in BOTH themes — kept-dark imagery is an
  ADR-058 Lane-0 decision, and the parchment tray against the dark device
  is what sells "spec sheet pulled out of the machine". ⚠ A raw
  `data-theme` attribute write does NOT re-bake (only the store notifies);
  both real paths — the toggle and the `?theme=` bootstrap — go through
  the store/attribute pair correctly. ⚠ **Any new stroke inside
  `bakeDrawerFace` picks from `pal.*` — not a raw literal**
  (2026-08-29). The shell gradient's four stops and the CTA's stroke/fill
  spent months as hardcoded `rgba(202, 165, 84, …)` gold + `rgba(${DAWN}, …)`
  cream; parity in dark hid it, parchment did not. A literal that "happens
  to match" the token strands on the next palette change.
- **The open pair's ALPHA is ONE invariant, not two** (2026-08-29). Face
  and tray content both route through `openPairAlpha(depthO, drawerT) =
lerp(depthO, 1, t)` — pinned in three-free `ringMath`, unit-tested at
  both ends and against the shipped face formula. Duplicating the
  arithmetic invites the drift that put the tray's ceiling at 0.9 while
  the face was 1.0 (the "awkwardly attached" read), which let the card's
  seam-side glint at renderOrder 0.05 print through the sub-1 tray at
  0.07 as a gold hairline. The tray's GLASS caps, walls and glint keep
  `depthO` — they are glass and meant to remain translucent; the
  invariant is about the printed material, not the material of the slab.
- **The OPEN pair carries the LAWFUL TR+BL diagonal — split across the
  halves** (2026-08-29). Tight closed, the card has BL only; the tray
  now takes TR (`drawerSlabGeometry` cuts at `slabW *
RING_SLAB_CHAMFER_FRAC` — the card's own leg). Neither half owns a
  full diagonal alone (ADR-050 Update 2's "don't repeat the chamfer, it
  declares another device" holds); the composite reads on ADR-065's
  canonical TR+BL. The cut lands in the tray's `RING_SLAB_BEZEL` glass
  margin, ~2.8 % of card height clear of the content plane — unit-pinned
  from below at 1 % so a subpixel roundoff cannot clip the drawer bake's
  border stroke or `✕` chit.
- **The card carries TWO glint sets — closed frame + open bracket —
  cross-faded on `drawerT`** (2026-08-29). Closed × (1 − t) + open × t,
  same renderOrder (0.05). The two together sum to 1 at every t, so the
  silhouette does not pulse and the seam-side edge is unlit on the open
  pair (the `EdgesGeometry` alone kept drawing back-cap + both chamfer
  diagonals + all four depth connectors while the tray drew a single
  bracket — the second half of the Escher fix). `cardOpenGlintGeometry`
  is a bracket: front outline minus the SEAM edge, BL chamfer diagonal,
  two LEFT-side depth connectors (mirror of the tray's right-side pair).
  Delete either fade term and the silhouette pulses at each open/close,
  or the seam edge lights through the tray again.
- **⚠ THE TIGHT CARD FACE CARRIES NO CTA, AND MAY NOT GROW ONE** (ADR-050
  Addendum 5, 2026-08-29). It bakes a framed NAME + the expand chit in the
  header, photo, lede at the foot — three content elements, one control.
  A `SEE THE SPEC →` button at `RING_CARD_CTA_BOX` shipped for one morning
  and came straight back out: `DRAWER_CTA_BOX === RING_CARD_CTA_BOX`, so
  the card's button and the drawer's booking CTA stood at the same height
  and the same width, and **two full-width gold-outlined bars side by side
  are one visual rhyme no matter what the labels say.** Differing labels
  and a body-vs-outline weight split were both tried; the eye pairs on
  SILHOUETTE and resolves "which do I press" before reading either.
- **⚠ The OPEN affordance is the top-right chit, and its SIZE is the
  reason it is allowed to persist while open.** A 56px corner glyph reads
  as chrome belonging to the card; a full-width labelled bar reads as a
  command addressed to the reader, and a second one of those is a fork.
  `TIGHT_EXPAND_SIZE` / `TIGHT_EXPAND_INSET` derive from `DRAWER_CLOSE_*`
  so open and close occupy one corner at one scale. Visual only — the
  whole face is already a full-rect `onOpenFront` button.
- **⚠ The NAME FRAME is measured, and shares the chit's stroke.** Hairline
  `pal.goldA(0.55)` at 2px — **identical to the chit's**, so the two
  objects bracketing the header band are one chrome family. Outlined, not
  filled: the filled ADR-029 block is what made the old chip read as a tag
  beside a headline. The name wraps against `chitX0 − 20 − pad` so a long
  service name can never run under the affordance, and the frame sizes to
  the widest line. ⚠ **`NAME_CAP_H` is a measured CONSTANT, never
  `measureText`** — `actualBoundingBoxAscent` varies per STRING, so four
  services would carry four frame heights. ⚠ Frame and chit share a
  CENTRE (y 62), not a top edge: different-height boxes on a shared top
  edge read as misaligned.
- **⚠ `CTA_LABEL_PX` / `CTA_ARROW_PX` are the DRAWER's alone now**, and
  stay at 28 / 34. The pairing argument that raised them died with the
  card's CTA, but the measurement stands: at 1280×720 the OPEN pair
  renders at scale 0.426, putting a 21px label on **8.9 CSS px**. The
  `full` variant keeps its own 21/30 literals on purpose (it is the
  ADR-029 comparison baseline; re-typing it makes the comparison
  unfaithful).
- **⚠ Measure baked type on the LIVE ring, never off a screenshot.** A
  capture of a scaled canvas understates the card badly — reading pixel
  coordinates off one put the card at ~310px wide when the anchor rect
  said 462. Take the scale from the published anchor
  (`boundingBox().height / BAKE_H`) and multiply the bake px.
- **⚠ Only the TOP scrim is branched on `variant`; the ground scrim is
  SHARED.** Tight header 190 → 260 bake px at `0.9 → 0.72 → 0` (the name
  frame reaches y 100 where the full face only put a chip's caps at y 80).
  The ground ramp was branched for one day to compensate for a lede lifted
  above a CTA box, and came out with it — **a branch added to compensate
  for a change must be removed with the change**, or it survives as an
  unexplained darkening the next reader has to disprove. If the copy ever
  moves again, re-shape the RAMP, not the origin: dropping the origin eats
  the photo, which is the middle third of the composition.
- **⚠ The tight face bakes no `plate.statusCode` and no `plate.title`.**
  Both are still on the type and both still render on the MOBILE
  accordion; a readout rail in the header band pushed the name down and
  came out (Addendum 5). Deleting either from the data breaks mobile.
- **Dismissal keys on ring PROGRESS, not the step clock** — `data-active-step`
  only changes at beat boundaries, which lets a card rotate a half-slot with
  its drawer still out (`drawerDismissedByScroll`, unit-pinned in `ringMath`).
- **`ringMath` and `openPlateRef` are THREE-FREE on purpose.** The DOM side
  imports them; a `three` import there drags the WebGL stack into the landing's
  First Load JS.
- **Keep the ring mount gate and the services DOM gate the SAME media query.**
  Reduced motion keeps the plate accordion regardless of any flag. ⚠ **AND
  SINCE ADR-108 THE PHONE HAS A SECOND PAIR OF GATES THAT MUST STAY ONE
  STRING**: `SERVICES_RING_MOBILE_MEDIA` is read by the ring mount, the
  services DOM AND `useCorridorExitScroll` — three readers, one constant,
  pinned by source in `services-ring-mobile-gate`. The accordion STAYS on the
  phone (it is the offer); the ring joins it as the visual above the plates.
- **No wall-clock motion** (ADR-021) — only scroll clocks, click-driven slides,
  pointer-look, and the bounded spring.
- **The ring no longer owns the front of its runway (ADR-056).** The proof
  casefile does, and `splitServicesRunway` re-derives the ring's progress
  over what is left so every ring constant is unchanged. Two consequences:
  a runway FRACTION is not a ring progress any more (the smoke helper
  converts — do not hand-roll offsets), and the release gates the ring's
  ENTRANCE CLOCK (`ringEntranceClock` in `CorridorArmillary` — smoothed
  dissipate × `proofRelease`, fed as `dissipateGetter`), which holds the
  cards OFF-STAGE for the dwell and then replays the ADR-029 directional
  fly-in. Never swap that back to a `masterOpacityGetter` fade: a master
  fade lights the cards in their PARKED pose, i.e. a crossfade — the exact
  read the owner rejected (2026-07-28). The anchors follow for free (the
  park gate and the publish gate read the same clock). Delaying the ring by
  retuning `RING_ENTRANCE_WINDOWS` does not work either: they ride the raw
  dissipate, which has already saturated by then.
  ⚠ **AND SINCE ADR-096 U3 THAT RELEASE RAMP IS THE LAST PROOF CARD'S OWN
  EXIT.** The owner asked for the cards to be there the moment the last card
  has gone, so `useServicesStageScroll` solves the proof share against
  **`PROOF_RELEASE_PARK`** (`ringMath` — `smootherstepInverse` of
  `RING_ENTRANCE_WINDOWS[0][1]`, 0.734969) so the three visible cards finish
  flying in at exactly that pixel. **That makes the windows load-bearing off
  this surface**: retiming one retimes the handoff with it, silently, because
  everywhere else they ride the raw dissipate and nothing would notice. The
  three VISIBLE cards must also keep sharing one window end — the unit test
  fails if they stop.

## The ring on phones (ADR-108, proposed)

- **THREE READERS OF ONE STRING, AND THE FLAG IS THE OFF SWITCH.**
  `SERVICES_CARD_RING_MOBILE` + `SERVICES_RING_MOBILE_MEDIA` (=
  `PROOF_STACK_SPLIT_MEDIA` — one phone rung for both `#services` beats).
  `CorridorArmillary` mounts the phone ring, `ServicesStage` renders the band
  - the hit layer + `data-card-ring-mobile="on"`, `useCorridorExitScroll`
    stops treating the rung as `mobile` so the dock and the ambient hold
    engage. Any one of them on a different string is a phone with a band and
    no ring, or a ring with no canvas — nothing errors. Flag off ⇒ the old
    phone page byte for byte, which is the fallback if the device read fails.
- ⚠ **THE WHOLE PHONE CORRIDOR EXIT CHANGES UNDER THIS FLAG.** The hook's
  one-line change makes every dock consequence live on phones: the fixed
  canvas, the veil, `data-corridor-exit`, the `MobileEpilogueSignal` CSS
  belt, `#services`' transparent ground. `#voidwalker` is the kill exactly
  as on desktop (the smoke asserts it); `corridorFallback` still wins.
- **THE BAND IS THE SEAT AND ITS SCROLL IS THE CLOCK.** The stage is unpinned
  on phones, so `.svc-ring-runway` (300svh, `RING_MOBILE_RUNWAY_SVH`, pinned
  equal to the sheet by the gate test) holds a sticky 100svh
  `.svc-ring-band`; `useServicesStageScroll`'s inert branch runs
  `ringMobileClock(t)` off the band's rect and writes `progress`
  (five beats over `[0, RING_MOBILE_LEAVE_START]`, capped under
  `RING_EXIT_START` — the exit stack is never entered), `proofRelease` (the
  band's arrival ramp — `ringEntranceClock` is UNCHANGED and this is what
  drives the fly-in), the new optional **`hold`** on `servicesRingProgressRef`
  (the phone mount's `masterOpacityGetter` and nobody else's — read `?? 1`,
  so desktop and every lab see the ring as it was) and the step.
- ⚠ **THE SCALE IS SOLVED AT THE FRONT CARD'S DEPTH, NOT THE MARK'S.**
  `ringMobileGroupScale` (`ringMath`, three-free): the front card orbits
  `orbitBase` nearer the camera and that offset scales with the group, so
  the solve is implicit. Solved at the mark's depth the card measured 383px
  against a 257px ask — ~1.5×, from ~0.9 units of orbit on a ~3-unit camera
  depth. The ask is `ringMobileFrontWidthPx(vw) = min(260, 0.66·vw)`; the
  radius is `RING_ORBIT_BASE_RADIUS × RING_MOBILE_RADIUS_MUL` (0.7) so the
  side cards stay inside the 70° portrait frustum.
- **THE PHONE PROFILE**: `profile="mobile"` → bake at `BAKE_SCALE_MOBILE` 0.5
  through `bakeSize()` with the bake drawing under `ctx.scale` (every
  coordinate stays in 840×1360 space; the CTA/drawer box fractions hold by
  construction; ~6 MB of texture with mips against ~32), `openDrawer={false}`
  (no drawer bake, no open state), no portrait back, no hover pick,
  anisotropy ≤ 4. Governor floor: `useQualityStore.countMultiplier > 0.35`
  or no ring at all — never half a ring.
  ⚠ **READ ONE PRIMITIVE OFF THE QUALITY STORE, NEVER `useQualityTier()`** in
  the armillary — it returns a fresh object per snapshot and
  `useSyncExternalStore` loops until the canvas boundary crashes, with the
  ring publishing nothing and no ring-side error to point at it.
- ⚠ **THE BAND IS THE COMPOSITION (ADR-109, supersedes "a tap goes to the
  plate").** The masthead renders INSIDE `.svc-ring-band` on this rung — a
  grid `auto minmax(0,1fr) auto`, the masthead `display: contents`: title ·
  an empty **`.svc-ring-seat`** · the paragraph. The hook publishes the
  seat's rect as the OPTIONAL `seat` on `servicesRingProgressRef` (absent on
  desktop and every lab ⇒ byte-identical there); the ring fits the front
  card's HEIGHT to `RING_MOBILE_SEAT_FILL` (0.82) of it
  (`ringMobileFrontWidthPx(vw, seatH)` — the width law still caps, the
  aspect and the bake never change) and lands its centre on the seat's
  (`ringMobileSeatY`, solved at the card's own depth, re-projected by the
  gate test). **No `.svc-plate` on this rung** (`ServicesPlateCluster` is
  not rendered; the photographs are not fetched); PRM and ≤680h keep the
  accordion. ⚠ `display: contents` means the desktop's masthead dim cannot
  reach here — the phone dims the lead and the intro (.35 each) directly.
  ⚠ **THE BAND HAS AIR AND IS CENTRED (ADR-082 U28, 2026-09-19, owner: the
  paragraph "too close to the cards", "the H1 and paragraph should be
  centred").** The grid had no `row-gap` — the seat's bottom WAS the
  paragraph's top, and the front card fills 82 % of the seat. `row-gap:
clamp(20px, 3.4svh, 36px)`, `justify-items: center`, `text-align: center`,
  and the lead + intro on `margin-inline: auto`. Measured at 393×852: title
  64–121 · seat 150–661 · intro 690–780. ⚠ The DESKTOP is untouched: its
  paragraph is the masthead's right column beside the title, never under the
  card, so there was nothing there to move.
- ⚠ **A TAP TURNS THE CARD OVER — NEVER THE DRAWER, AND NO LONGER A SHEET
  (ADR-110; ADR-109's DOM sheet lasted a day).** The desktop's
  `openServiceId` / `openPlateRef` / Escape extend to the phone under
  `flipActive`; the response is the card's OWN BACK: `flipBack` (the phone
  mount alone) appends one more plane per card — LAST child, after the veil,
  so indices 0–5 and `DECK_INTRA_ORDERS` hold — at `−(slabDepth/2 +
RING_CONTENT_LIFT)`, `rotation.y = π`, FrontSide, renderOrder 0.115, its
  map the lazily baked back (`bakeCardBack`, `BAKE_SCALE_MOBILE_BACK` 0.75,
  the drawer's palette, the portrait back's MIRRORED chamfer chrome, the ✕ at
  `DRAWER_CLOSE_BOX` — the front's OPEN corner). `flipLevelRef` damps at
  `RING_FLIP_RATE` toward "open AND baked for this theme" (⚠ gated on the
  texture, or a cold tap turns a blank slab); the normal branch's yaw gains
  `+ π·flipT`. ⚠ **THE FACING YAW STAYS ALIVE** — only the front-pose bias
  eases out (`bias.yaw · (1 − flipT)`); the drawer's `openPairYaw` flattens
  all yaw for its SEAM, and a step-keyed dismissal needs the turned card to
  keep turning with the ring. ⚠ **THE DEPTH-WRITE HANDS OVER AT THE
  MIDPOINT** (`front = write ∧ flipT ≤ .5`, `back = write ∧ flipT > .5`; the
  ELECTION is unchanged) or the mark's points paint over the turned card.
  The glow goes `DoubleSide` under the flag (a FrontSide halo culls at full
  turn); the side cards recede by `RING_MOBILE_OPEN_SIDE_DIM`; the back's
  material takes the face's `openPairAlpha`. **The card keeps its size**
  (owner) — the ADR-109 seat solve is untouched. ⚠ **TYPE IS SOLVED, NOT
  REVIEWED**: `backFace.ts`'s `backFaceLayout(plate, measure)` is ONE layout
  function; the bake hands it `measureText`, the gate test a GENEROUS model,
  so the rows agree and every record ends above `CTA_Y0 − 24` on rungs ≥ 30
  bake px (~9 css px chrome on an iPhone 14 — the named cost). Every rung
  goes through `ringType.ts`'s `setBakeType` (ADR-092's stage-2 seed; the
  ring file's ratchet pins did not move — never write the property's name in
  a new comment there). **Cache 2** (the open card's + the front's, ~6.9 MB
  with mips; entries remember their theme and go stale on a flip — no
  setState in an effect), the front's back pre-baked IDLE once parked, the
  tapped card's URGENTLY. Anchors publish `back` past
  `RING_FLIP_BACK_PUBLISH`; the hit layer's front button becomes a TOGGLE and
  shims the back's CTA (`RING_CARD_CTA_BOX`) and ✕ (`DRAWER_CLOSE_BOX`, grown
  to 44 px in CSS) onto the CARD rect (coplanar) plus the sr-only spec.
  ⚠ **DISMISSAL KEYS ON THE STEP** (`activeServiceForProgress` changes),
  never on `drawerDismissedByScroll`'s 35px; plus the face, ✕, Escape. A SIDE
  tap rolls the band to that card's beat (`servicesMobileBeatScrollTarget` ←
  `ringMobileBandFraction`, the inverse of `ringMobileClock`, round-tripped
  in the gate test). The lockstep table above gains `backFace.ts` +
  `ringType.ts` (the back's rows and rungs) and `useServicesStageScroll.ts`
  (the seat).
- ⚠ **THE BAND'S CLOCK READS THE LAYOUT VIEWPORT (ADR-113).** `bandTravel` is
  `300svh − vh`, and `vh` was `window.innerHeight` — which on iOS follows the
  toolbar, so the ring rotated ~4.6 % of its runway while the thumb was still.
  `useServicesStageScroll` reads `layoutViewportHeight()` now (the ICB, what
  `100svh` resolves to). ⚠ And the band lives INSIDE a snap area: `#services`
  is a `scroll-snap-align: start` stop on the phone rung; the sticky band
  itself is not, and the side-tap tween's beats rest far outside any proximity
  radius of `#about`'s stop (`mobile-section-seams.spec.ts`, `probe-mobile-
lockin.mjs`). Rules in `mobile-sections.md` §10.
- **Verifying:** `npx vitest run tests/lib/services-ring-mobile-gate.test.ts
tests/lib/ring-type.test.ts` (the three readers, the bake, the clock, the
  scale solve re-projected, the seat, the beat inverse, the back's fit over
  every record, the rungs) and
  `npx playwright test tests/visual/services-ring-mobile-smoke.spec.ts
--project=iphone-14-chromium --project=iphone-14-pro-max-chromium`; stills
  via `node scripts/capture-services-mobile.mjs --theme dark|light [--vp 430x932]`.
  ⚠ The emulated iPhone USED TO lay out 421px wide (ADR-107's finding) — a
  31px `100vw` overflow the emulator zoomed out to fit; since ADR-082 U28
  clipped the root it lays out at the device's own 390, so every width ask
  here is exact now and every phone number recorded before 2026-09-19 was
  ~8 % generous. The still and the frame rate are the OWNER's device read,
  and ADR-108's checklist is the gate.

## Verifying

The corridor is scroll-driven WebGL: drive a REAL scroll (`window.scrollTo(0, y)`),
never an instant teleport, which skips the engagement band and leaves the canvas
dead. `tests/visual/services-ring-smoke.spec.ts` is the harness. Expect
run-to-run pose variance at the same nominal progress — confirm a suspected
composition bug across several runs before chasing it.

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
