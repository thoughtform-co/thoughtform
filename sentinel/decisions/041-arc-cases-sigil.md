# ADR-041: Arc Cases — the reveal is PHASED (nodes fold, then the card emerges), the trigger becomes a sigil welded to the sphere's front pole, and the card face carries the capability rows

**Date:** 2026-07-14
**Status:** Accepted (supersedes ADR-036 §3's single-level card read and §5's
DOM arming chip. Everything else in ADR-036 remains LIVE and unchanged: the
in-canvas card in the gyro assembly, `cardEdges` + the direct shell-local fold,
the pure `streamLatchMath`, `arcCasesStore`, the `ARC_CASES_MEDIA` gate,
`arcBandFactor`'s Build-band × epilogue-kill exclusivity + dissipate guard, the
no-camera-channel / no-scroll-writer contract, and ADR-033 §5's funnel.)
**Scope:** `lib/arc-cases/arcCasesMath.ts` (phase + settle math),
`lib/arc-cases/arcCasesLevelRef.ts` (`cardPresence`),
`lib/arc-cases/cardLayout.ts` (`SIGIL_Z`),
`components/landing/home-v2/arc-cases/ArcCasesSigil.tsx` (new — the trigger),
`components/landing/home-v2/arc-cases/ArcCasesTerminalCta.tsx` (DELETED),
`components/landing/home-v2/arc-cases/ArcCasesCard.tsx` (reads `cardPresence`),
`components/landing/home-v2/arc-cases/ArcCasesStepper.tsx` (`cardPresence` + CLOSE),
`components/landing/home-v2/arc-cases/caseCardBake.ts` (capability band),
`components/landing/home-v2/DepthGatewayScene/shell/ShellStack.tsx` (fold reads
`arcFoldInput`), `.../DepthGatewayScene/sceneGeom.ts` (`intelligence.sigil`
anchor + `gateSigil`), `components/landing/home-v2/CopyAnchors.tsx` (mount),
`components/landing/home-v2/CorridorStationHeaders.tsx` (chip mount removed),
`components/landing/home-v2/home-v2.css`, `tests/lib/arc-cases-math.test.ts`,
`tests/visual/arc-cases-card-smoke.spec.ts`.

## Context

Three owner objections to the shipped ADR-036 reveal:

1. **The card face was thin.** The bake painted only the codename, index,
   status, title, subline, stack chips, mode/tagline and metric — leaving a
   ~320px dead void between the screenshot band and the bottom copy stack. The
   four `capabilities` on every case (and `shift`, `team`, `challenge`) went
   unpainted, even though the retired HORIZONTAL console card
   (`ToolCardConsole`, ADR-030 Update 2) had shown them as CAP rows.

2. **The reveal fired in the wrong order.** "The panel appears right before
   [the nodes move], but it should come after it." One damped `armLevel` drove
   the node-stream fold AND the card materialize simultaneously; because the
   fold rides a smootherstep (flat at its start) while card opacity was LINEAR
   in the same level, the card visibly led the nodes it is supposed to hang
   from.

3. **The trigger was generic chrome.** "VIEW THE CASES" was a DOM chip docked
   under the Build title. The owner wanted "a subtle button, a sort of sigil
   that sits on the front of the sphere in the middle, where the two orbits
   collide", softly pulsing.

## Decision

### 1. The reveal is PHASED — one clock, two ordered phases

The single damped arm level stays the ONLY clock (no new clock, no new scroll
writer — ADR-021/032 hold). It is split into two named phases, both pure
functions of the same `level` in `arcCasesMath.ts`:

- `ARC_FOLD_DONE = 0.62`; `arcFoldInput(level) = clamp01(level / 0.62)`.
  `ShellStack` feeds THIS to `arcLatchEnvelope` (which supplies the easing —
  the input is a BARE clamped ratio; pre-easing it would double-ease and stall
  the fold's start). The fold is complete at level 0.62.
- `ARC_CARD_PHASE = [ARC_FOLD_DONE, 1]`; `arcCardPresence(level) =
smootherstep(0.62, 1, level)`. Every CARD read moves off the raw level onto
  this: the six material opacities, `group.visible`, the scale-in, and the
  depth-write hysteresis.

The card-phase start is pinned to `ARC_FOLD_DONE` **exactly**, which makes the
ordering invariant strict and testable: `arcCardPresence(level) === 0` at every
level where `arcFoldInput(level) < 1`. Because `smootherstep` is flat at its
start, the card still emerges gently off the latch — there is no dead beat.

`ARC_LABEL_FADE_OUT` (0.55) is unchanged, so the whole beat reads:
**labels fade (0→0.55) → nodes fold and latch (0→0.62) → card materializes into
the frame they made (0.62→1)**. Close plays it backwards for free.

`arcCasesLevelRef` gains `cardPresence`, published by the SAME single writer
(the card's `useFrame` at priority −5), so no reader recomputes the phase. The
stepper moved from `level` to `cardPresence` — the control row cannot arrive
before the card it controls.

### 2. The trigger is a world-anchored sigil on the sphere's FRONT POLE

**Where.** `SUBSTRATE_GYRO_GIMBAL_RINGS` are three great circles built by
`buildGreatCircle` in the **XZ plane**. Ring 0 (r 0.88, no tilt) is edge-on → a
horizontal line; ring 2 (r 1.16, rolled by `BRANDMARK_SWORD_TILT_RAD`, the
brandmark's spine) is edge-on → a near-vertical line. Their planes meet along
the **Z axis**, so in screen projection they cross as an "X" through the dead
centre of the sphere's front face. That crossing IS the sphere's front pole —
and it is the same optical axis the card grows on (`CARD_CENTER_X/Y = 0`). So
`SIGIL_Z = 0.98`: proud of the dotted shell (front face ≈ 0.95), inside the card
(`CARD_Z` 1.2). The sigil is the seed the card grows from, and the card occludes
it once open. (Ring 1 is the face-on circle; its convergence with ring 2 near
the TOP is a different, more decorative crossing — deliberately not chosen.)

**Why DOM, not in-canvas.** An in-canvas 3D sigil was the first instinct (ADR-036's
thesis being that DOM over the scene reads as floating chrome). The evidence
corrected it: the corridor canvas is `pointer-events: none` and there are **zero
R3F click handlers anywhere** in `components/landing/**` — every corridor click,
including the ADR-029 services card ring, goes through a DOM overlay
(`ServicesRingHitAreas`). So an in-canvas sigil would STILL need a DOM hit area:
strictly more machinery, no new capability. And a small marker welded to the
geometry — banking, scaling and depth-fading with it, exactly like the
SOURCES/SURFACES chips and the Encode cardinal markers already on that sphere —
is precisely what reads as PART of the instrument. ADR-036's "floating"
objection was about a large fixed viewport-centred PANEL, not a welded marker.
It also sits at the front pole, the closest point to the camera, so nothing can
occlude it: the depth-compositing argument for going in-canvas does not apply.

`ArcCasesSigil` therefore rides the existing world-anchor pipeline: anchor
`intelligence.sigil` in `COPY_ANCHORS` positioned by `gyroAssemblyWorldPosition`
(which folds in the gyro bank, assembly scale, epilogue planet-grow), the
tracker writes transform + perspective scale, and `gateSigil` writes opacity.
The pulse is a CSS keyframe (cloned from `servicesReadoutPip`) — **no JS clock
at all**, which also sidesteps the Phase-4 `clock.elapsedTime` re-entry-pop
hazard by construction.

**The settle gate.** `sigilSettle(stack)` = `smootherstep(ARC_SIGIL_SETTLE,
smoothed stack reveal)`, `ARC_SIGIL_SETTLE = [0.70, 0.84]`. The trigger does not
offer itself until the sources/surfaces notes have SETTLED — the owner's
sequencing applied to the trigger, so the reveal can't be armed before the frame
it lands in exists. **Measured, not guessed** (live, 1600×1000): the smoothed
stack reads ≈0.72 at paintProgress 0.90 (notes still flying in), ≈0.79 at the
camera park (0.9225), ≥0.96 by 0.95 (accretion `peakAt`). A first pass of
`[0.72, 0.96]` only went live at paint 0.95, leaving barely ~270px of scroll
before the epilogue kill — the trigger was effectively unreachable. Re-measure
before ever retuning this.

**The focus/pointer split — load-bearing.** While armed, the card covers the
sigil's axis. So: opacity → ~0 (via `gateSigil`'s `1 − cardPresence`), and
`pointer-events: none` (via `[data-armed="true"]`) so the invisible marker can
never catch a phantom click over the card face. But it is **NOT `inert`** — its
inert gate reads `sigilSettle` WITHOUT the card-fade, so it stays focusable and
`Escape` can return focus to the trigger that opened the reveal (the stepper's
handler queries `[aria-controls="arc-cases-terminal"]`, which is this button).
Do not "simplify" the inert gate to read the host's opacity — that folds in the
card-fade and silently breaks the Escape refocus.

The chip's other contracts moved over verbatim: `aria-expanded` +
`aria-controls`, the every-frame `inert` reconciliation (the stale-inert bug),
the stable callback ref, and **the auto-disarm watcher**. `ArcCasesTerminalCta`
is deleted.

### 3. CLOSE moves to the stepper

The sigil is behind the card once open, so it cannot carry the close. The
stepper row — which arrives WITH the card and is the reveal's whole pointer/AT
surface while open — gains a CLOSE control. (Escape still works; the reveal is
still not a modal: no focus trap, no backdrop, scroll stays free.)

### 4. The card face carries the capability rows

`bakeCaseCardFace` fills the dead band with the four `capabilities` (gold
`CAP 0N` index + title + wrapped desc) — the information the retired horizontal
console card painted, transposed into the portrait bake. It is a **MEASURED
fit**, not a fixed offset: the copy stack is bottom-anchored and wraps
differently per case (Heimdall's title/subline run longest), so the available
band varies. Rows degrade **full → title-only → skipped** and can never overflow
into the copy stack. `SHOT_H` is the tuning knob if the band gets tight.

## Alternatives rejected

- **An in-canvas 3D sigil + a tracked DOM hit area** — strictly more machinery
  (a new R3F component + a screen-rect publisher + a DOM hit layer) for no new
  capability, since the canvas takes no clicks and a DOM button is needed
  either way. See §2.
- **Retuning `ARC_BAND_IN` to chase the stack window.** The band
  (`[0.845, 0.9]`) no longer tracks the stack accretion (`{0.875, 0.95}`) — the
  comment in `arcCasesMath.ts` claiming it does is stale drift from when the
  stack moved (`sceneGeom.ts`, "v3.12c Crossing follow-up: stack pushed
  0.81/0.93 → 0.875/0.95"). But naively pushing the band up to the peak would
  gate the card OFF at the park (park centre 0.9225 < peakAt 0.95). The
  sequencing is enforced on the TRIGGER (`sigilSettle`) instead; `ARC_BAND_IN`
  is deliberately left alone. **Do not "fix" it without re-deriving the park.**
- **Making the sigil `inert` while armed** — breaks the Escape refocus (§2).
- **Keeping the sigil mouse-clickable while armed** — it sits at the centre of
  the card's face in the DOM stacking order, so it would swallow clicks aimed at
  the card.
- **Painting the outcome paragraph / meta strip / tech footer** on the card face
  — owner picked the capability rows only.

## Verification

`npx tsc --noEmit` clean; `npm run lint` **0 errors / 300 warnings** (baseline
unchanged); `npx vitest run` **256 pass** (arc-cases-math 13 → 23: the phase
functions, the **strict ordering invariant** `arcCardPresence === 0 while
arcFoldInput < 1`, the settle gate, and `SIGIL_Z` between the shell and the card;
the `ARC_EPILOGUE_KILL[1] < 0.72` services-ring exclusivity pin stays green).
`arc-cases-card-smoke` rewritten against the sigil — **10 pass** (front-pole
placement at viewport centre; inert mid-corridor AND while the notes accrete;
live at the park; arming fades the labels + reveals the stepper + drops the
sigil to opacity ~0 / pointer-events none while KEEPING it focusable; the
**ordering trace**; stepping; CLOSE; Escape-refocus; auto-disarm; mobile
absence). `landing-corridor` + `services-ring` smokes **52 pass** (no
regressions).

Driven live at the Build park (1600×1000): the sigil pulses at the ring crossing
on the sphere's front and stays welded under the pointer bank; the arm trace
shows **cardPresence exactly 0 for the first ~384ms while the source labels fade
0.66 → 0.24 → 0** (the nodes fold with no card), the card beginning at ~507ms —
the fold lands, THEN the screen materializes into it. Heimdall (longest copy)
renders all four CAP rows with no collision.

**Playwright note (a real gotcha):** `locator.click()` on the sigil can never
pass actionability — the marker is re-projected every frame and the gyro carries
a continuous idle drift, so its bounding box never repeats across two animation
frames ("element is not stable"). Use a real `page.mouse.click` at the projected
centre (still hit-tested, so it still proves the pointer-events opt-in and
z-order). `clickSigil()` in the smoke does this.

**Left for the owner's aesthetic pass:** the sigil's size/pulse cadence
(`home-v2-cases-sigil-pulse`, 2.6s), the exact `ARC_FOLD_DONE` split (0.62 — how
long the nodes hang on an empty frame before the screen arrives), and the CAP
row type scale.
