# ADR-110: The card turns over — the phone's open state is the card's own back

**Status:** Proposed (2026-09-16) — shipped on ADR-108's rung and flag
(`SERVICES_CARD_RING_MOBILE`), guarded, pending the owner's read on a real
device. ADR-108's device checklist is this record's gate too.
**Supersedes:** ADR-109 §2 (the DOM sheet — it lasted a day). ADR-109 §1 (the
band composition: title · seat · paragraph, the measured seat, the fill law)
stands untouched.
**Related:** ADR-029 (the card is ONE object) · ADR-047 rev 2 (the portrait
back — the back-plane idiom this copies) · ADR-050 (the desktop drawer, and
why it is not ported) · ADR-065 (the corner law) · ADR-092 §4 (the baked
type ramp, seeded here) · ADR-107 (the phone rung).

## Context

The owner, on the sheet ADR-109 had just shipped (2026-09-16):

> for the cards on mobile … I don't think we need to have another panel
> appear. I think we can just rotate them around their axis so that the back
> side shows the services. That means we have to redesign it a bit … make
> sure it's performant, works, and looks good.

Two calls taken with him before building: **the card stays the same size
when it turns** (no open boost), and **the back carries the full spec** —
chip · title · `01 / What` · `02 / How` · the CTA, what the drawer and the
sheet carried.

Under ADR-029's law this is the better object: the drawer was a second slab
and the sheet a DOM panel; the back is the card's own reverse, so nothing
appears beside the card and nothing hides it. And the ring already had the
machinery — ADR-047's portrait back is a second plane behind the slab at
`rotation.y = π`, FrontSide, its own texture, the depth-write handed over past
the flip's midpoint, its chamfer chrome drawn mirrored. The phone never baked
it. This pass gives every phone card a back of its own.

## Decision

**A tap turns the front card π about its own Y on a damped clock; a per-card
BACK plane carries the spec, baked lazily at a crisper ratio than the front;
the hit layer maps the back's ✕ and CTA onto the card's own rect. Nothing DOM
rises. Desktop is byte-identical.**

### 1. The back plane

`ServicesCardRing` takes `flipBack` (the phone mount in `CorridorArmillary`
alone passes it). Under it each card group gets one more child — appended
LAST, after the veil, so indices 0–5 and `DECK_INTRA_ORDERS` are untouched
(the deck never engages on the phone): `backGeometry` (the portrait back's
`PlaneGeometry(cardW, cardHeight)`) at z `−(slabDepth/2 + RING_CONTENT_LIFT)`,
`rotation [0, π, 0]`, a per-card `meshBasicMaterial` (FrontSide, transparent,
`depthWrite: false`), renderOrder **0.115** between the portrait back (0.11,
null map on the phone) and the veil (0.12). Mounted with the FLAG, never with
the texture (the positional-order rule); `map` is null until the bake lands.
The GLOW material takes `DoubleSide` under the flag — its plane sits at +z,
and a FrontSide halo culls away at full turn.

### 2. The clock and the pose

- `flipLevelRef` per card damps toward "this card is open AND its back is
  baked for this theme" at `RING_FLIP_RATE` 6 (~450 ms to settle);
  `flipT = smootherstep(level)`. ⚠ Gated on the texture EXISTING (the
  drawer's own `wantOpen` gate): a cold tap waits one bake rather than
  turning a blank slab.
- The normal branch's yaw gains `+ π·flipT`. ⚠ **The FACING yaw stays alive.**
  The drawer flattens ALL local yaw because its seam breaks under any; the
  back has no seam, and the phone's dismissal is STEP-keyed, so a turned card
  may still be turning with the ring — a yaw pinned to π would hold it still
  and swing it ~45° on close. Only the front-pose BIAS eases out
  (`bias.yaw · (1 − flipT)`), so the turned face is square. Euler XYZ ⇒
  `Rx(pitch)·Ry(yaw + π)`: the back arrives upright with the front's pitch
  sign because the plane carries its own `Ry(π)` (`Ry(π)∘Ry(π)` = identity).
- **No open boost** (owner): the card turns in place. The ADR-109 seat solve
  is unchanged — `ringMobileFrontWidthPx(vw, seatH)` and `ringMobileSeatY`
  read the seat directly; the sheet's room law and `ringMobileSheetFit` are
  deleted.
- The side cards recede by `1 − RING_MOBILE_OPEN_SIDE_DIM (0.6) · flipT`
  (ADR-109's constant, renamed). The face alpha firms through
  `openPairAlpha(depthO, max(drawerT, flipT))` and the back's material takes
  the same alpha — FrontSide-culled until the midpoint, so no gate of its own.
- **The depth-write handoff** (ADR-047 rev 2's `backWrite`): the ELECTION
  (`depthWriteGate` on the front's `nz` ∧ opacity > .55) is unchanged; the
  assignment moves — `front.depthWrite = write ∧ flipT ≤ .5`,
  `back.depthWrite = write ∧ flipT > .5`. Without it the mark's renderOrder-1
  points paint over the turned card.
- Anchors publish `back: flipT > RING_FLIP_BACK_PUBLISH (0.9)`. The rect is
  the front mesh's projected bbox, which at full turn is the same box
  mirrored about its centre — `x/y/w/h` already describe the back. Mid-turn
  the rect is a sliver: the hit layer's `w > 8` filter drops the button for
  ~3 frames and the shims render only at `back`.

### 3. The back bake

`bakeCardBack(plate, pal, variant, scale)` — bake px space (840×1360) under
`bakeSize(scale)` + `ctx.scale`, like `bakeCardFace`. **`BAKE_SCALE_MOBILE_BACK`
0.75** (`ringCtaBox`): 630×1020, 2.57 MB, ≈ 3.43 MB with mips. The fronts stay
at 0.5; a spec face on a DPR-3 phone needs the raster — 257 css px × 3 = 771
device px against 630 texture px is 1.22× magnification; at 0.5 it would be
1.84×, and the 30 px chrome rungs blur.

- Chrome: the drawer's ground + wash; the portrait back's MIRRORED chamfer
  voids, shell and ticks (`traceChamferPathMirrored` — the slab's physical
  BL cut lands at screen BR after `Ry(π)`; the texture itself reads upright
  and unmirrored; production `card` ⇒ BR only); the drawer's ✕ chit at
  `DRAWER_CLOSE_BOX` — the SAME corner and scale as the front's OPEN chit
  (ADR-050's one-corner law). Palette `DRAWER_DARK` / `DRAWER_LIGHT` by theme.
- Type through ONE helper, `setBakeType`, in the new three-free
  **`lib/services-ring/ringType.ts`** (ADR-092 §4's stage-2 seed:
  `TRACK_LABEL .08`, `TRACK_EYEBROW .15`, `TRACK_DISPLAY −.02`,
  `WEIGHT_TEXT 400`, `WEIGHT_LIT 500`, the two bake faces; `ring-type.test.ts`
  pins the rungs equal to `variables.css`). The type ratchet gains that
  file's own row (`{ letterSpacing: 2, bold: 0 }`) and `ServicesCardRing.tsx`
  stays at 18 / 6 — the bake never writes the property itself.
  `waitForCardFonts` needs no change (it loads faces, not sizes).
- **The rungs, bake px, floor 34** (css on the 257 px iPhone 14 card × 0.306;
  a 700h phone's 199 px card × 0.237). ⚠ The first cut floored at 30 and left
  ~110 bake px pooling above the CTA; the visual review spent that slack on
  the type, and the gold TEXT rungs moved to the ramp's INK rung
  (`DrawerPalette.goldInk` / `goldLine` — Tensor gold in dark, theme.css's
  light `--gold-ink` #6e5216 / `--gold-line` #8a6b20 on parchment, where
  #caa554 as text is 1.8:1):

| row                                                                     | rung                | css @ 257 | css @ 199 |
| ----------------------------------------------------------------------- | ------------------- | --------- | --------- |
| chip (mono, eyebrow track, gold ink)                                    | 34                  | 10.4      | 8.1       |
| title (sans 400, ≤ 2 lines, dawn .92, display track)                    | 58 / lh 66          | 17.7      | 13.7      |
| `01 / What` · `02 / How` (mono, label track, gold ink)                  | 34                  | 10.4      | 8.1       |
| bullets (sans, 15 px gold diamond, indent 38)                           | 42 / lh 48 / gap 14 | 12.9      | 10.0      |
| dt (mono, label track, ink .5)                                          | 34                  | 10.4      | 8.1       |
| dd (sans; the wide `Leaves with` in gold ink)                           | 40 / lh 44          | 12.2      | 9.5       |
| CTA (`700` mono, eyebrow track, gold-line plate at `RING_CARD_CTA_BOX`) | 34                  | 10.4      | 8.1       |

The card keeps its size by the owner's call, so the chrome rungs land at
~10 css px on an iPhone 14 and ~8 on a 700h phone — the named cost; the floor
is the lever if the device read asks for more.

- **Fit is SOLVED, not reviewed** — `lib/services-ring/backFace.ts`:
  `backFaceLayout(plate, measure)` is ONE layout function parameterised by
  `measure(text, px, family, track) → px`. The bake passes a real
  `ctx.measureText`; the gate test passes `modelMeasure`, whose advances are
  MEASURED and then padded (`scripts/probe-bake-advance.mjs` on the live
  page: PP Neue Montreal 400 runs 0.43 em on average and 0.48 em on the widest
  of the back's own strings, PT Mono 0.60 exactly; the model takes 0.50 and
  0.60 + track), so every model width is ≥ its real width, the model's line
  counts bound the real ones, and the two can never disagree on rows. ⚠ The
  first model guessed 0.55 for the sans and FAILED two records that fit — a
  wider model bounds nothing tighter. Wraps are greedy, and where greedy gives
  two lines the split minimising the longer line ("An AI capability / the
  team can run.", "Fixed term, / dated handover" — the review's orphans),
  never more lines than greedy. Rows: chip baseline 72 (sharing the chit's
  centre 62 — the front's own rule); title cap top 140 (the front's datum) →
  baselines 181 / 247; `What` = last title + 66; bullets first +56, lines +48,
  bullets +14; rule = last bullet + 36; `How` = rule + 42; dt = How + 54, dd =
  dt + 44 + i·44, rows +28; cells (Duration | Participants), (Format |
  Language), (Leaves with, wide); `contentBottom = last dd + 8 ≤ CTA_Y0 − 24`
  (1208). Under the model: keynote 1031 · workshop 1119 · embedded 1141 ·
  **guided-build 1189** (two 2-line cells in each of its first two rows).
  Levers if a record ever fails: `ddLh` 44 → 42, then a wide Duration row —
  never the rungs. A dev-only `console.warn` fires if a real bake overruns.

### 4. Bake timing and memory

- Lazy, per card, latched by the frame loop (the drawer's idiom): URGENT for
  the tapped card without a texture, IDLE (`requestIdleCallback`, `setTimeout`
  fallback) for the FRONT card's back once the ring is parked — so the card
  the reader is looking at is ready before the tap.
- **Cache 2** — the open card's and the front's; a landing bake evicts
  (disposes) whatever is neither. Worst live set: fronts 4 × 0.5 ≈ 6.1 MB
  with mips + 2 backs ≈ 6.9 MB = **13.0 MB**. Each entry remembers the theme
  it was baked in, so a theme flip makes it STALE (the loop reads a stale
  entry as null, the next bake replaces and disposes it) — no setState in an
  effect. Uploads drain through the existing `gl.initTexture` warm-up queue;
  every live entry is disposed on unmount. A `glEpoch` remount resets the
  cache; `openPlateRef` still holds the id, so the loop re-requests urgently.

### 5. The hit layer and the stage

- `ServicesRingHitAreas`: on `anchor.back` the front button is a TOGGLE
  (`data-back="1"`, `aria-label` "Close … details"; tapping the turned face
  turns it back) and LATER siblings shim the back: an
  `<a class="svc-ring-hits__hit--cta">` over `RING_CARD_CTA_BOX` fractions of
  the CARD rect (coplanar; x-fractions map directly at full turn), a
  `<button class="svc-ring-hits__hit--close">` over `DRAWER_CLOSE_BOX`, and
  the sr-only spec paragraph (chip · title · breakdown · the five cells — the
  readable copy now that the sheet is gone). ⚠ **Both shims grow to the 44 px
  touch floor ABOUT THEIR BOX'S CENTRE** (`touchBox`): the first cut put
  `min-width/height: 44px` on the ✕ in CSS, which anchors at the box's
  top-left — a 44 px square 13 px right and down of a 17 px chit, running 16
  px past the card's edge (the visual review's first finding; a
  `translate(calc(… 100%))` cannot recentre it because the percentage is of
  the already-grown box). The desktop `anchor.drawer` branch is verbatim.
- `ServicesStage`: `sheetActive` → `flipActive`; the STEP-keyed dismissal
  (ADR-109's ruling) and Escape stay; `data-plate-open` on the phone; the
  band's hit layer gains `onCloseDrawer`; `ServicesSpecSheet` is deleted with
  its CSS, `sheetTop`, `RING_MOBILE_SHEET_ROOM/CLEAR` and `ringMobileSheetFit`.
  The `[data-plate-open]` copy dims: lead .35 stays, intro .1 → **.35**
  (nothing covers it now).

## Measured (Chromium phone emulation, SwiftShader)

| viewport / theme | front card at rest            | turned                        | ✕ shim (centred on the chit) | CTA shim                   |
| ---------------- | ----------------------------- | ----------------------------- | ---------------------------- | -------------------------- |
| 390×844 dark     | 262.6 × 434.6 @ (69.8, 168.5) | 257.5 × 411.4 @ (72.8, 184.2) | 44 × 44 @ (289.3, 181)       | 225.6 × 44 @ (88.8, 547.6) |
| 430×932 light    | —                             | 260.2 × 416.5 @ (96.9, 235.9) | 44 × 44 @ (315.9, 232.9)     | 228 × 44 @ (113, 604.1)    |

The turned card is the same box (the rest rect carries the front pose's
tilt, ~5 % of projected height; turned, the bias has eased out), centred on
the seat; `data-plate-open` follows the state; the ✕ turns it back. Zero
`.svc-plate`, zero `.svc-sheet`. The visual review (a sub-agent on the
stills) confirmed the reverse reads as the same slab — bezel, halo, the BR
cut on the slab's own diagonal, no mirroring, no constellation ghost, no
particles over the card — and found the four things above (the off-centre ✕
shim, gold text on parchment, the pooled slack, the orphans), all taken.
⚠ `back-mid.png` at +220 ms is identical to the open still under SwiftShader
— the turn itself is the device read's.

## Guards

- `tests/lib/services-ring-mobile-gate.test.ts` (the card turns over):
  `BAKE_SCALE_MOBILE_BACK` ∈ (0.5, 1] and `bakeSize(0.75)` = 630×1020; every
  record's back solved under the measured model — content bottom ≤ the limit,
  title ≤ 2 lines, every wrapped line inside its measure, rows monotonic;
  every rung ≥ the floor; the publish threshold and the clock's settle; the
  ✕ and CTA boxes disjoint; `flipBack` passed exactly once, by the phone
  mount; the sheet named nowhere. `tests/lib/ring-type.test.ts`: the rungs
  equal `variables.css`. The type ratchet: `ringType.ts`'s row.
- `tests/visual/services-ring-mobile-smoke.spec.ts` (both Chromium phone
  projects): the band composition cases as ADR-109 left them, plus — no sheet,
  the card shut and no shims at rest; tap → `aria-expanded="true"`,
  `data-back="1"`, `data-plate-open="1"`, the CTA (`#contact`) inside the card
  rect, the ✕ ≥ 44 px in the card's top-right, the sr copy, the card's size
  and seat unchanged and inside the chrome bands; the ✕ turns it back with the
  step untouched; the face, Escape and a beat of scroll turn it back and a
  60 px nudge does not; the side tap rolls the band; dark + light.
- `services-ring-smoke` (desktop) unchanged but for the accordion case's
  `.svc-sheet` count (0 now).

## Alternatives rejected

- **The sheet** (ADR-109 §2) — the owner: "I don't think we need another
  panel".
- **Porting the drawer** — at any width where its open pair fits 390 px its
  largest glyph is under 8 css px, and its bake is the one texture the phone
  cannot afford (ADR-109's arithmetic stands).
- **An open boost** (the card growing ~25 % when turned) — offered, declined
  by the owner; the card turns in place and the type floor carries the cost.
- **Flattening the facing yaw** (the drawer's `openPairYaw`) — wrong for a
  step-keyed dismissal; the card must keep turning with the ring.
- **Baking the back at the front's 0.5** — 1.84× magnification of 30 px
  chrome on a DPR-3 phone; 0.75 is the smallest ratio that stays crisp.
- **A four-deep cache** — 19.8 MB worst case against 13.0 at two; a rare
  re-open costs one ~10 ms bake.

## Left open

- The device read (ADR-108's checklist, plus: the turn's feel, the back's
  type at ~9 css px chrome, the ✕ and CTA under a thumb, the halo through the
  turn, light, no particles over the turned card).
- The chrome rungs on ≤ 700h phones (~8 css px). The floor (`BACK_TYPE_FLOOR`)
  is the lever; an open boost was declined.
- The desktop drawer's gold text on parchment has the same 1.8:1 the review
  measured here; it keeps its literals (a separate pass — `pal.goldInk` is
  ready for it).
- Mid-turn the projected rect is a sliver and the delta gate publishes every
  frame for ~450 ms — cheap, but never at rest.
- The section readout printed a neighbouring service's name on one still
  (`KEYNOTE // SERVICES` under the Embedded card) — the emulator's slow frames
  or a pre-existing readout lag; not this pass's, to be checked on the device.

## Files

`components/landing/home-v2/services/hologram/ServicesCardRing.tsx` ·
`components/landing/home-v2/services/hologram/ringCtaBox.ts` ·
`lib/services-ring/ringType.ts` (new) · `lib/services-ring/backFace.ts` (new) ·
`lib/services-ring/ringMath.ts` · `lib/services-ring/ringProgressRef.ts` ·
`lib/stores/hologramConnectorStore.ts` ·
`components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx` ·
`components/landing/home-v2/services/ServicesRingHitAreas.tsx` ·
`components/landing/home-v2/services/ServicesStage.tsx` ·
`components/landing/home-v2/services/services.css` ·
`components/landing/home-v2/services/ServicesSpecSheet.tsx` (deleted) ·
`tests/lib/services-ring-mobile-gate.test.ts` · `tests/lib/ring-type.test.ts` ·
`tests/lib/type-material-tokens.test.ts` ·
`tests/visual/services-ring-mobile-smoke.spec.ts` ·
`tests/visual/services-ring-smoke.spec.ts` ·
`scripts/capture-services-mobile.mjs` · `scripts/probe-bake-advance.mjs` (new) ·
`.claude/rules/services-ring.md` ·
`.claude/rules/mobile-sections.md` · `.claude/rules/type-material.md` ·
`.claude/skills/landing-performance/SKILL.md`.
