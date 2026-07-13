# ADR-035: Arc Cases Terminal — a fixed DOM overlay unfurls (edges converging to centre) under the Build title; the terrace reveal retires

**Date:** 2026-07-13
**Status:** Accepted (supersedes the ADR-034 terrace REVEAL — ADR-033's
§5 funnel restructure + mobile/PRM story remain live, as does the
click-owned / band-gated / exclusivity contract)
**Scope:** `lib/arc-cases/arcCasesMath.ts` (+ `arcCasesLevelRef.ts`,
`lib/stores/arcCasesStore.ts`),
`components/landing/home-v2/arcCasesTerminal.ts` (flag, replaces
`arcCasesTerrace.ts`),
`components/landing/home-v2/arc-cases/**` (the two DOM components +
barrel),
`components/landing/home-v2/CorridorStationHeaders.tsx` (CTA mount +
caption fade),
`components/landing/home-v2/DepthGatewayScene/sceneGeom.ts`
(stack-label fade),
`components/landing/home-v2/HomeCorridor.tsx` (overlay mount),
`components/landing/home-v2/home-v2.css`,
`app/(internal)/test/arc-cases-terminal` (lab),
`tests/lib/arc-cases-math.test.ts`,
`tests/visual/arc-cases-terminal-smoke.spec.ts`.

## Context

ADR-034 (commit `bdb65c4`) displayed the four production cases (Mímir /
Vesper / Babylon / Heimdall) by panning the corridor camera laterally
right and raising ONE landscape screen out of the substrate topography.
The owner rejected it on sight: ugly and convoluted. Two revisions (a
fixed device slab, then a terrain-shroud aperture) didn't save the
mechanism — the lateral camera channel and the excavated-viewport read
were the objection, not the tuning.

The replacement keeps everything the ADRs got right — click-owned +
opt-in, scroll GATES rather than drives, the `arcBandFactor`
Build-band × epilogue-kill contract, the services-ring exclusivity pin,
`ARC_CASES_MEDIA` gate parity, the auto-disarm watcher, ADR-033's §5
funnel restructure + mobile/PRM story — and replaces the REVEAL. The
corridor camera returns to a **pure Z dolly** (the ADR-018 two-camera
contract is un-parameterized again). On arm, the sources/surfaces DOM
label chips **fully disappear** (the canvas pips/streams stay lit — they
FRAME the reveal) and a fixed DOM **terminal-style overlay** unfurls over
the centre of the viewport, its two halves **converging to a centre
seam** (the inverse of the caption card's centre-out "sanctioned
unfold"), showing one case at a time with stepping.

Owner confirmed via Q&A: full swap in one plan; a DOM overlay (NOT a
baked 3D slab — the content is trivially DOM-renderable and the bake
LUT/occlusion machinery bought nothing here); edges-converge-to-centre
motion. The content layer stays deliberately minimal — the owner iterates
after v1.

## Decision

**Flag:** `ARC_CASES_TERMINAL` in `arcCasesTerminal.ts` (ON). Off
restores the pre-ADR-033 corridor byte-identically: every per-frame
reader multiplies by a literal 1 (no label/caption fade) and every mount
is conditional. Gate `ARC_CASES_MEDIA` carried over verbatim
(≥1101×760, no reduced motion) — the JS gate is the exact twin of the
CSS hide of BOTH the CTA dock and the overlay (gate parity).

### 1. No camera channel — the Z dolly is restored

ADR-034's `arcCameraShiftX` (applied to both cameras) and
`getTerraceViewportLayout(aspect)` are GONE (Commit 1). The corridor
camera is a pure Z dolly again (X = 0 end-to-end); `FlyingCameraRig` and
`useWorldDomTracker` read no lateral channel. The reveal touches nothing
in the R3F tree except the stack-label opacity read (§4). **The reveal
is DOM-only.** This is the single most important consequence of ADR-035:
there is no in-canvas cases object, and the two-camera "one path"
contract (ADR-018) is once again un-parameterized.

### 2. The CTA — a chip under the Build title

`ArcCasesTerminalCta` is just the chip now (the stepper moved into the
overlay). It is mounted by `CorridorStationHeaders` as the `bld`
station's `afterContent`, so it renders **in-flow, centered UNDER the
"BUILD ON THE LAYER." title** inside `.home-v2-station-header__head`
(both the static and typewriter split branches render `afterContent`
there) — NOT on the bottom-right rail (the ADR-034 position, retired
with its pointer-events carve-out).

It drives its OWN opacity with its own rAF (the `CorridorProgressRail`
pattern): `smoothstep(0.885, 0.915, paintProgress) × (1 − BUILD_OUT) ×
engaged × !docked`, **inert reconciled EVERY frame** (a React re-render
re-attaching the ref must never leave a stale inert behind the
write-suppression — a real bug found in build-out), with a stable
callback ref that seeds inert on attach. Labels `VIEW THE CASES` ↔
`CLOSE` (terminal inverse video while armed). The station header layer is
`pointer-events: none`; the chip opts back in via the `.home-v2-copy-cta`
convention. Auto-disarm watcher carried verbatim: `beat !==
"intelligence" || epilogueProgress > 0.02 || docked || !active`.

### 3. The overlay — a converging DOM terminal

`ArcCasesTerminal` (mounted in `HomeCorridor` right after
`CorridorStationHeaders`, so DOM order = focus order) is a fixed,
centered overlay: `width min(58vw, 880px)`, `height min(54vh, 520px)`,
two GENUINE content halves (no duplication) — left = the case screenshot
figure (keyed by case id; a plain `<img>` with a CSS gold treatment
approximating the retired bake LUT — v1, owner iterates), right = the
meta header (codename chip, `NN / 04 · STATUS`), body (mode · tagline,
gold metric, title runs em→gold, first 6 stack chips), and the footer
stepper (`◂ 01 02 03 04 ▸` — the right-rail signature re-homed: diamond
prev/next, active chip gold + underline, aria-pressed).

**The converging unfurl** is a PURE CSS clip-path transition (no JS
motion): each half clips from its OUTER edge toward the centre seam
(`inset(-12px 100% -12px -12px) → inset(-12px 0 -12px -12px)` left;
mirror for right) on the sanctioned bezier `cubic-bezier(0.16, 1, 0.3,
1)` over 0.55s. A 1px dashed-gold `__front` rides each opening edge on
the same clock, landing at the centre as the seam divider; four gold
corner crosses at the outer corners (the caption reticle's
`.home-v2-reticle__cross` recipe) are static and REVEALED by the sweep
(negative clip insets give them breathing room — no `overflow: hidden`).
**Delayed-visibility close:** the panel is `visibility: hidden` with
`transition: visibility 0s linear 0.55s`; `.is-open` flips it visible
with zero delay — so on close it stays visible/animating through the
reverse sweep then drops out. Content swap = `key={activeCase.id}` +
a 0.18s fade-in keyframe (crossfade-on-step read; no queue, retarget-safe
— rapid stepping just remounts the keyed content).

Not a modal: `Escape` while open disarms and refocuses the CTA (query
`[aria-controls="arc-cases-terminal"]`); NO focus trap, NO backdrop dim,
scroll stays free (ADR-032 guardrails). The closed panel's `inert`
(reconciled every frame by the level writer — §4) keeps its stepper
buttons out of the tab order.

### 4. The single level writer + the label/caption fade

`ArcCasesTerminal` owns the SINGLE writer of `arcCasesLevelRef` — a DOM
rAF (the progress-rail pattern), no longer an R3F `useFrame`:
`dt` from rAF timestamps clamped `[0, 0.1]`; `armDamp = dampLevel(prev,
armed ? 1 : 0, dt)` (rate 2.2 — the ADR-033 clock) with residual
snapping (`< 0.001 → 0`, `> 0.999 → 1`, BEST-PRACTICES "snap them");
`band = arcBandFactor(paintProgress, epilogue) × (1 − smootherstep(0,
0.15, dissipate))` (the old terrace band assembly — accepted via a
`bandGetter` prop defaulting to that production assembly so the lab can
pass `() => 1`); `level = armDamp × band`; inert reconciled every frame;
`level` reset to 0 on unmount. It is a **DOM-only channel** now — no R3F
reader.

Two readers consume `level`:

- `gateStackLabel` (sceneGeom): every stack-label element — per-row chips
  AND the SOURCES/SURFACES group headers — multiplies opacity by
  `arcLabelFade(level) = 1 − smootherstep([0, 0.55], level)`. The labels
  are fully gone by mid-arm (level 0.55), BEFORE the halves meet, so the
  panel lands on a clean field. "The labels disappear."
- `CorridorStationHeaders`: the persistent caption card fades by
  `1 − level` (**full fade** — a single multiplier, trivially flipped to
  a dim if wanted).

**Two-rAF ordering caveat:** the writer (overlay rAF) and one reader (the
world-DOM tracker's rAF) run on independent loops, so a reader may see a
value up to ONE frame stale — at most ~16ms on the ~0.45s arm envelope,
imperceptible. Documented in `arcCasesLevelRef.ts`.

### 5. Exclusivity + gating (carried over verbatim)

`arcBandFactor` = Build-band rise `[0.845, 0.9]` × epilogue kill
`[0, 0.1]`, × the dissipate guard `(1 − smootherstep(0, 0.15,
dissipate))` at the writer. The services ring needs dissipate ≥ 0.6 ⇒
`epilogueProgress ≥ 0.72`: **the terminal and the services ring can
never co-render** — same pin (`ARC_EPILOGUE_KILL[1] < 0.72`), pinned in
`tests/lib/arc-cases-math.test.ts`. No scroll writers, no scroll lock, no
backdrop (ADR-032 guardrails); no wall-clock JS motion (ADR-021 —
CSS clip-path transitions + a damped-rAF level are the sanctioned
mechanics).

## Removal inventory (the terrace)

Landed in Commit 1 (`5a6d342`): the lateral camera channel
(`arcCameraShiftX` in `FlyingCameraRig` + `useWorldDomTracker`,
`getTerraceViewportLayout`), the terrain-shroud rise + `uTerrace`
uniform/attributes in `SubstrateTopography` (reverted to pre-034;
`substrateTerrain.ts` kept as the single relief-math source, minus
`terrainGroundY`), the terrace components + bake
(`ArcCasesTerraceScreen/Gate/Cta`, `terraceContourField`, `terraceLayout`,
`caseScreenBake`), `arcCasesTerrace.ts`, the terrace lab + smoke, and all
`terrace*`/`TERRACE_*` math. SURVIVES: `toolCardData.ts` (the single
canonical case module), ADR-033 §5 (funnel arrays, register split,
rolodex roster, exit seam), the mobile `.home-v2-case-chips` row, the
fallback codename line, `lib/services-ring/ringMath.ts` (imported
unchanged; pin stays green).

## Alternatives rejected

- **Any lateral/vertical camera channel** (the ADR-034 reveal) — the
  camera moving to frame the cases was the core objection; the Z dolly is
  restored and the ADR-018 contract un-parameterized. A future camera
  channel would have to re-earn both cameras' consent from scratch.
- **A terrain shroud / raised in-world screen** — reads as an object laid
  over (or excavated from) the landscape; two revisions failed to make it
  read as intended.
- **A canvas bake (baked-CanvasTexture slab) for the content** — the
  established depth-correct pattern (ADR-029/033/034) buys nothing for
  DOM-renderable text + one screenshot; a DOM overlay gives real focus /
  aria / selectable text and a CSS clip-path unfurl for free, with no
  glEpoch re-bake, no LUT, no occlusion story.
- **A modal (focus trap + backdrop dim + scroll lock)** — violates the
  ADR-032 guardrails (the sphere keeps primacy; the reveal is opt-in
  chrome, not a takeover). Escape + inert are enough.
- **Caption DIM instead of full fade** — kept as a one-character flip
  (`1 − level` → e.g. `1 − 0.8·level`); the owner wanted the field clean.

## Verification

Lab `/test/arc-cases-terminal` (real store + overlay, `bandGetter =
() => 1`, arm/step/select buttons, live level readout).
`tests/lib/arc-cases-math.test.ts` (13) pins damp / band / exclusivity /
stepSlot / `arcLabelFade` (endpoints + monotonic + gone-by-mid-arm).
`tests/visual/arc-cases-terminal-smoke.spec.ts` (6 structural, desktop +
mobile projects): CTA docks under the Build title (inert mid-corridor,
live + below the title at the park); arm → `data-open`, inert dropped,
CLOSE label, stack-label opacity < 0.05 after settle (proves the DOM
level writer); step + select (aria-pressed, codename swaps); close drains
(overlay inert, labels recover); scroll-out auto-disarm + clean re-arm;
mobile/tablet absent (overlay null, dock CSS-hidden). Manual at 1440×900:
no camera movement through arm/disarm (sphere + pips pixel-static);
labels gone by mid-sweep, streams/pips lit; halves converge, fronts land
as the seam; caption fades; close reverses everything; rapid stepping
never queues; arm → scroll to epilogue → auto-disarm within 2%, services
ring only post-dissipate. Safari: `backdrop-filter` + `clip-path`
transition on the same element (ships on the caption card already).
