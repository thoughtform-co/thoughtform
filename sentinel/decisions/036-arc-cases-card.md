# ADR-036: Arc Cases Card — the reveal becomes ONE in-canvas 3D tools card mounted between the two nodes; the node streams fold onto its slab edges; the DOM overlay retires

**Date:** 2026-07-14
**Status:** Accepted (supersedes the ADR-035 REVEAL SURFACE — the fixed
DOM overlay panel + its `panelRect` viewport-unprojection latch are
retired. ADR-035's CTA chip, `arcCasesStore`, `ARC_CASES_MEDIA` gate,
`arcBandFactor` Build-band × epilogue-kill exclusivity, dissipate guard,
label fade, and caption fade all remain LIVE under ADR-036. ADR-033 §5
funnel restructure + mobile/PRM story remain live.)
**Scope:** `lib/arc-cases/cardLayout.ts` (new, + pins),
`lib/arc-cases/arcCasesLevelRef.ts` (`panelRect` → `cardEdges`),
`lib/arc-cases/streamLatchMath.ts` (pure math unchanged; caller rewired),
`components/landing/home-v2/arc-cases/caseCardBake.ts` (new — the portrait
bake restored from the retired orbit ring),
`components/landing/home-v2/arc-cases/ArcCasesCard.tsx` (new — the in-canvas
card + gate + level writer),
`components/landing/home-v2/arc-cases/ArcCasesStepper.tsx` (new — the DOM
control row),
`components/landing/home-v2/arc-cases/ArcCasesTerminalCta.tsx` (unchanged —
the arming chip), `arc-cases/index.ts`,
`components/landing/home-v2/arcCasesCard.ts` (flag, replaces
`arcCasesTerminal.ts`),
`components/landing/home-v2/DepthGatewayScene/BrandmarkAccretionShell.tsx`
(card mount inside the gyro assembly),
`components/landing/home-v2/DepthGatewayScene/shell/ShellStack.tsx` (fold
rewired to direct shell-local math),
`components/landing/home-v2/DepthGatewayScene/sceneGeom.ts` +
`CorridorStationHeaders.tsx` (flag rename only — the readers are unchanged),
`components/landing/home-v2/HomeCorridor.tsx` (overlay → stepper),
`components/landing/home-v2/home-v2.css` (panel block removed; stepper
re-homed as a standalone fixed row), `app/(internal)/test/arc-cases-card`
(lab), `tests/lib/arc-cases-card-layout.test.ts`,
`tests/visual/arc-cases-card-smoke.spec.ts`.

## Context

ADR-035 rendered the four production cases (Mímir / Vesper / Babylon /
Heimdall) as a fixed DOM overlay panel whose two halves converged to a
centre seam; ADR-035 Update 1 folded the source/surface node streams onto
that panel's screen-rect borders by unprojecting the DOM
`getBoundingClientRect` through the live camera every frame. The owner
rejected the composite on sight: the nodes visibly move, "as if they're
latching onto something", but the screen in the middle "is just floating."
A DOM panel over a 3D scene has no depth relationship to the world it sits
in — the streams latch to a rectangle that lives in a different space, so
the panel never reads as PART of the instrument.

The directive (verbatim intent): rebuild the reveal drawing inspiration
from **the original tools cards** — the in-canvas 3D device-slab cards
(ADR-029/033) — "a bit less wide and a bit more compact so they fit within
the two nodes. Really approach it from a 3D point of view (3JS, WebGL). I
want these nodes to attach to the sides and the edges of this card."

## Decision

**Replace the DOM overlay with ONE in-canvas 3D portrait card**, mounted in
world space between the two stack columns in front of the Build-park
sphere, with the source/surface streams folding onto the card's ACTUAL
left/right slab side walls in shared 3D space. The card physically hangs on
the nodes.

**Flag:** `ARC_CASES_CARD` in `arcCasesCard.ts` (ON; replaces
`ARC_CASES_TERMINAL`/`arcCasesTerminal.ts`). Off restores the pre-ADR-033
corridor byte-identically: every per-frame reader multiplies by a literal
1 (no label/caption fade, no fold), every mount is conditional. Gate
`ARC_CASES_MEDIA` carried over verbatim (≥1101×760, no reduced motion) —
the JS gate is the exact twin of the CSS hide of the CTA dock + the DOM
stepper (gate parity).

### 1. Mount space — the load-bearing decision

The card is mounted as a SIBLING of `ShellStack` inside the `gyroAssembly`
group (`BrandmarkAccretionShell`) — the SAME transform space the
source/surface stream groups live in (scaled by `GYRO_ASSEMBLY_SCALE` 1.18,
rotated by the pointer bank). Two consequences, both the point:

- The card banks WITH the streams. When the cursor tilts the gyro assembly,
  the card and the folded lines rotate together as one rigid instrument —
  that shared motion is exactly what makes the screen read MOUNTED, not
  floating.
- The stream attach points are computed by DIRECT shell-local math from the
  card's own geometry. There is **no viewport unprojection, no `panelRect`,
  no per-frame live-camera re-solve** (all retired with the overlay). The
  card publishes its slab side-wall edges once on layout/aspect change
  (`arcCasesLevelRef.cardEdges`, in shell-local coords); `ShellStack` reads
  them and folds directly. Because the spaces are identical and rigid, the
  latch is welded for free under any bank.

This is the original RING precedent (the ADR-033 ring mounted inside the
pointer-look instrument), not the ADR-034 terrace precedent (a world-fixed
object beside the terrain). The cases belong to the instrument.

### 2. Card sizing — "less wide, more compact, fits within the two nodes"

Portrait `RING_CARD_ASPECT` (420/680). `getCardGeometry(colX)`
(`cardLayout.ts`, shell-local units) targets the half-width as a fraction
of the column half-span (`getStackColumnLocalX`), then follows the portrait
aspect but CLAMPS the height to the lane spread (`CARD_MAX_HALF_HEIGHT`
0.95, inside the source ±0.95 / surface ±1.05 fans) so the card never
towers over the sphere. On every desktop aspect the height clamp dominates
(the columns sit wide), so the realised card is a fixed compact portrait
(~1.17 × 1.9 shell-local ≈ 1.38 × 2.24 world) whose slab side walls sit at
≈±0.64 local — comfortably inside the pip columns (colX ∈ [1.4, 1.92]),
leaving a clear run for the folded streams. Centred on x = 0, y = 0; z =
1.2 shell-local — in FRONT of the dotted shell (~0.95) and clear of the
gimbal rings (~1.05), so the streams fold FORWARD out of the pip plane onto
the side walls (the nodes reach out and grab the screen). Yaw/pitch ≈ 0
(the card faces the on-axis park camera dead-on; the pointer bank supplies
the life). Constants + the fits-within-columns invariant are pinned in
`tests/lib/arc-cases-card-layout.test.ts`.

### 3. The card (`ArcCasesCard.tsx`) + the level writer

`ArcCasesCardGate` (matchMedia on `ARC_CASES_MEDIA`) mounts
`ArcCasesCardOverlay` inside the gyro assembly. The card is the ADR-029/033
device-slab grammar, one card: a behind-slab gold halo (renderOrder −0.1),
a chamfered `ExtrudeGeometry` glass slab (caps `#14110c` / side walls
`SERVICES_GOLD`, renderOrder 0), an `EdgesGeometry` glint (0.05), a baked
content plane (0.1) with a crossfading incoming plane (0.11), and a
dot-matrix veil (0.12) — everything below the brandmark point pass
(renderOrder 1) so the mark and the terrain composite correctly.

The `arcCasesLevelRef.level` writer moved BACK into R3F: a `useFrame` at
priority −5 (the terrace precedent — before ShellStack folds at 0, killing
the ADR-035 two-rAF lag). `level = dampLevel(prev, armed × band)` with the
band assembly carried from the terminal (`arcBandFactor` × dissipate
guard); residual snapping; reset to 0 on unmount. Arm drives the
materialize: opacity ramp + a slight scale-in (0.94 → 1) + the veil to its
rest profile, and depth-write hysteresis on the settled content plane
(0.82/0.68 — translucent while materializing so the sphere shows through,
opaque once settled). Faces: deferred portrait bake of all four cases
(`caseCardBake.ts` — restored from the retired orbit ring's inline bake
INCLUDING the subline lede) + a glEpoch re-bake; content steps by CROSSFADE
between two content planes (the terrace pattern; no rotation, no
wall-clock).

### 4. The fold (`ShellStack`, direct shell-local math)

`ShellStack` reads `cardEdges` and folds each source stream onto the LEFT
slab side wall, each surface stream onto the RIGHT, distributed top-to-bottom
by `attachFractionForRow` over the card's content height, landing a hair
inboard (`CARD_EDGE_INSET`) so the tip meets the gold lip. The pure math
(`streamLatchMath.ts` — `attachFractionForRow`, `arcLatchEnvelope`,
`latchControlPoints`, `cubicBezierPoint`, `buildDockedPath`) is UNCHANGED;
only the caller changed (attach point is now `(edgeX, cardY, cardZ)` in
shared local space instead of an unprojected screen ray). The stagger,
solid-alpha docking, morph curves the motes ride, and restore-once-on-release
all carry over. Flag-off / unarmed / no-edges / reduced-motion = rest pose,
byte-identical.

### 5. DOM — chip stays, stepper re-homed, overlay deleted

The `ArcCasesTerminalCta` chip under the Build title is UNCHANGED (arming,
own-rAF opacity, every-frame inert reconciliation, auto-disarm watcher).
The stepper (◂ 01 02 03 04 ▸) moved OUT of the (deleted) overlay into a
standalone `ArcCasesStepper` — a compact fixed row bottom-centre that rides
the shared arm level for its opacity + inert (own rAF, inert reconciled
every frame) and carries the region id `arc-cases-terminal` so the chip's
`aria-controls` stays honest with no CTA change. Escape while armed disarms

- refocuses the CTA (not a modal). `home-v2.css` dropped the whole panel
  block (halves / clip-path / fronts / crosses / meta) and re-homed the
  stepper rules; gate-parity CSS hides the dock + stepper below the media
  floor.

### 6. Exclusivity + guardrails (carried over verbatim)

`arcBandFactor` = Build-band rise `[0.845, 0.9]` × epilogue kill `[0, 0.1]`,
× the dissipate guard at the writer. Services ring needs dissipate ≥ 0.6 ⇒
`epilogueProgress ≥ 0.72`: **the card and the services ring can never
co-render** — same pin (`ARC_EPILOGUE_KILL[1] < 0.72`). No scroll writers,
no scroll lock, no backdrop (ADR-032); no wall-clock motion — the damped
level is the only clock (ADR-021).

## Alternatives rejected

- **The DOM overlay reveal** (ADR-035's panel, and ADR-032's drawer before
  it) — a fixed DOM rectangle over the 3D scene reads as floating chrome
  laid over the artifact; it has no depth relationship to the world, so the
  streams latch to a different space. Rejected twice now.
- **Viewport-unprojection latch** (ADR-035 Update 1) — solving the panel's
  screen rect back into world space every frame is machinery that only
  exists because the panel lives in DOM space. In shared world space the
  attach points are direct math; the unprojection is deleted.
- **A camera channel** (ADR-034) — never; the corridor stays a pure Z
  dolly. The card lives in the instrument, not the camera.
- **Mounting the card world-fixed beside the terrain** (the ADR-034 terrace
  precedent) — it would NOT bank with the streams, so it would read as a
  detached object again. The card is a sibling of the stream groups inside
  the gyro assembly precisely so it banks with them.
- **A wide/landscape card** — the owner's objection was width; a compact
  portrait slab between the columns is the "fits within the two nodes"
  read.

## Verification

Lab `/test/arc-cases-card` (the card in a bare Canvas, `bandGetter =
() => 1`, `preload`, a level slider + store controls + the DOM stepper).
`npm run lint` (0 errors), `npx tsc --noEmit` (clean), `npx vitest run`
(242 pass — the new `arc-cases-card-layout` pins + the carried
`arc-cases-math` / `arc-cases-latch-math` / `services-ring-math` pins all
green), `npm run build` (clean, temp distDir),
`tests/visual/arc-cases-card-smoke.spec.ts` (CTA dock placement/inert/arm;
armed → stepper row visible + inert dropped + stack labels fade < 0.05
[proves the R3F level writer]; step/select via the stepper; close recovery;
scroll-out auto-disarm; mobile absent). Playwright screenshots vs the live
dev server at 1440×900 and 1101×760 (rest / mid-fold / armed / banked /
closed — `verify-card-*.png`, gitignored): the card reads as a solid 3D
glass slab with gold chamfered edges and a legible baked face, clearly
narrower than the node span; the green streams fold onto its left slab wall
and the dawn streams onto its right; a pointer-move confirms the card banks
WITH the streams and the latch stays welded; mid-fold shows the synchronized
materialize (translucent card, sphere showing through) resolving to an
opaque settled face; close unwinds symmetrically and the labels + caption
recover.

**Left for the owner's aesthetic pass:** the fold's arm length / arrival
tangent, the brightness of the wrap-tail/mote bunching at the fold zone,
the exact card size (`CARD_MAX_HALF_HEIGHT`) and depth (`CARD_Z`), and
whether to add tiny square end-caps at the attach points (the "little
squares" mount emphasis — left out of v1 because the fold bundle is already
bright at the termination; it is a documented knob, not a decision).
