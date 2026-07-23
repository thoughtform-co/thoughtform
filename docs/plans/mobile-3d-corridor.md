# Plan: Mobile 3D Depth Corridor + Responsive Section-2 Composition

## Context

The production homepage (`app/(marketing)/page.tsx` → `components/landing/v7/LandingPage.tsx`) replaces three v7 stations — `["definition", "missing-layer", "intelligence-layer"]` (see `CORRIDOR_REPLACED_STATIONS`, `app/(marketing)/page.tsx:22`) — with a single 3D "depth corridor" flythrough. That corridor (`components/landing/home-v2/HomeCorridor.tsx` → `DepthGatewayScene`) flies the camera through four gate groups while the brandmark, a true 3D world object, leads the way. Section 2 ("AI collapsed the distance between *thought* and *form*") is the corridor's first **Thoughtform** beat: copy on the left, brandmark centered/right.

**The problem:** the corridor is hard-disabled on phones. `HomeCorridor.tsx:60` sets `smallViewport = window.innerWidth < 760`, and `:121` `fallback = webglOK === false || reducedMotion || smallViewport` routes every phone to `FallbackCorridor` — plain stacked text, **no brandmark, no flythrough**. So mobile loses both the signature animation and the section-2 composition.

**Outcome:** capable phones get the real 3D flythrough (a performance-tuned "corridor-lite"), with the Thoughtform copy stacked above the brandmark in portrait. Genuinely incapable devices keep a graceful fallback.

**Decisions locked:** Corridor-lite (not full corridor, not 2D-only) · text stacked above the mark · plan committed to a new `plans/` folder.

## Why it's desktop-only today (root cause)

- Blanket block: `HomeCorridor.tsx:60,121` — `window.innerWidth < 760` forces the static fallback.
- The per-layer **mobile particle budget already exists but is dead code** (never runs because the fallback fires first): `pickCount(desktop, tablet, mobile)` with `<760 / <1280` thresholds in `StaticStarfield.tsx:82` (1200), `LatentFieldTunnel.tsx:197` (1400 pts / 110 vectors / 0 tokens), `ScrollStreaks.tsx:123` (1100), `CelestialMotes.tsx:121` (0). The two heaviest layers already `return null` below 760: `LatentTopographyContours.tsx:708`, `LatentWormholeWalls.tsx:435`.
- Composition risk on portrait: `CAMERA_FOV = 38°` (`DepthGatewayScene/sceneGeom.ts`) is *vertical* and aspect-independent. On a 390×844 phone (aspect ~0.46) horizontal coverage collapses ~2.4× vs 16:9 → the left-anchored Thoughtform copy (world X ≈ -1.8) collides with the centered mark and the frame feels cramped. This is why a blanket block was the cheap first choice.

## Approach: Corridor-lite on capable phones

Reuse the existing mobile budget; flip the gate from "is a phone" to "is genuinely incapable"; solve portrait composition with an aspect-aware FOV + a stacked section-2 layout; add the mobile robustness that's currently missing (dpr cap, WebGL context-loss handling).

### Step 1 — One device-tier source of truth
New `lib/hooks/useDeviceTier.ts` (or `components/landing/home-v2/deviceTier.ts`):
- `getDeviceTier(width): "mobile" | "tablet" | "desktop"` (pure; encodes the `<760 / <1280` thresholds **once**) + a `useDeviceTier()` hook.
- `corridorCapable()` capability floor (replaces the blanket phone block): `false` only when `probeWebGL() === false`, or very-low-end (`navigator.hardwareConcurrency <= 2` **and** `deviceMemory <= 2` where available), or `(pointer: coarse)` with width `< 360`. Otherwise `true`.
- Refactor the four `pickCount` helpers + the two `>=760` layer guards to consume `getDeviceTier` so the budget lives in one place. Reuses `lib/webgl/probe.ts` and `lib/hooks/useMediaQuery.ts`.

### Step 2 — Replace the fallback decision (`HomeCorridor.tsx`)
- Drop `smallViewport` state + the `<760` check. Add `capable` from `corridorCapable()` in the existing effect.
- `:121` → `const fallback = webglOK === false || reducedMotion || !capable;`. Keep the WebGL + reduced-motion gates and `FallbackCorridor` untouched.

### Step 3 — Mobile performance tier (`DepthGatewayScene/index.tsx`)
- **dpr:** tier-aware. Today `[1, 1.75]`; mobile → `[1, 1.4]` (phones report DPR ~3, so this is the dominant GPU lever — fragment work drops to ~22% of native res while staying crisp on a dark scene). Feed from `useDeviceTier()`.
- **antialias:** consider `antialias: tier !== "mobile"` (MSAA on a 3× panel is costly; lean on dpr). A/B during verification.
- **frameloop:** keep `"always"` for v1 (motion is scroll-velocity driven). Note a v1.1 enhancement: velocity-gated on-demand rendering via `invalidate()` for battery — staged later because every layer's `useFrame` must tolerate non-continuous frames.
- `powerPreference: "low-power"` already set — keep.

### Step 4 — Confirm layer keep/drop + budget
Keep the three heavy layers **dropped** on mobile (contours/wormhole/motes were culled for *crowding* on small frames, per ADR-018, not just perf). Keep: StaticStarfield (1200), LatentFieldTunnel (~1400+110), ScrollStreaks (1100), GatewayWorld (the gates **are** the content), ThoughtformAtmosphere, InterGateCorridor, FlyingCameraRig. Audit `ThoughtformAtmosphere`, `InterGateCorridor`, and per-gate ring/orbit instancing in `GatewayWorld` for a mobile `pickCount` if they lack one. Rough mobile budget ≈ **~3.9k particles** + gate geometry (comfortable). Verify the LatentFieldTunnel token atlas isn't allocated when `tokens === 0` (early-returns at `:587,:614`).

### Step 5 — WebGL context-loss handling (new; currently absent)
Phones drop GL contexts under memory pressure / backgrounding; today that leaves a frozen canvas. In `DepthGatewayScene/index.tsx` via `onCreated({ gl })`:
- `webglcontextlost` → `e.preventDefault()`, set lost state, render the existing `FallbackCorridor` branch meanwhile.
- `webglcontextrestored` → bump a `key` on `<Canvas>` so all `useMemo` geometry rebuilds; re-sync the depth store; ensure brandmark/copy trackers don't double-mount.

### Step 6 — Aspect-aware FOV (the portrait fix — core correctness)
Widen *vertical* FOV when `aspect < 1` to restore *horizontal* coverage (Hor+ technique). New `getCameraFov(aspect)` in `sceneGeom.ts`:
- `vfov = 2 * atan( tan(hfovTarget/2) / aspect )`, targeting ~50° horizontal on portrait (modest — see R1), **capped ≤ 70°** to avoid fisheye; returns `CAMERA_FOV` for landscape/desktop.
- **Wire BOTH cameras to this same function with the same `aspect`** — they must agree or the DOM copy/brandmark desync from the canvas geometry:
  1. `DepthGatewayScene/index.tsx`: compute `fov` from `innerWidth/innerHeight`; on resize set `camera.fov = getCameraFov(aspect); camera.updateProjectionMatrix()` (R3F updates aspect but **not** fov).
  2. `useWorldDomTracker.ts` mirror camera (`makeMirrorCamera` ~`:156`, resize ~`:229`): use `getCameraFov(aspect)` + `updateProjectionMatrix()` on resize.
- Mitigation for un-filled gates: keep fov widening modest and, if needed, a tier-scoped `GATE_PARK_DISTANCE` (single constant consumed everywhere — it feeds `PARK_LEAD` and gate-Z solving, so override in one place, don't scatter branches).

### Step 7 — Section-2 mobile layout: copy stacked above the mark
The copy pans with the camera as one move, so the tracker overwrites `transform`/`opacity` inline every frame — pure-CSS repositioning is futile for position. Two coordinated changes:
1. **World anchor (`sceneGeom.ts` `thoughtform.leftCopy`) tier-aware on mobile:** center its X on the gate (instead of -1.8) with a small +Y offset; in `CopyAnchors.tsx:47` switch `data-anchor-origin` from `left-center` → `bottom-center` so the block's bottom edge lands above the mark. Center or hide the three decorative phase labels (`navigate/encode/build`) on portrait. Cache tier in a module-level var updated by one resize listener — **do not** read `window`/`matchMedia` inside the per-frame resolvers (R3).
2. **CSS** (`home-v2.css`, new `@media (max-width: 760px)`) only for properties the tracker doesn't write: `.home-v2-copy-block--thoughtform-left` → `width: min(86vw, 420px)`, `text-align: center`, tighter `clamp()` fonts. Mirror the intended look already encoded in `public/prototypes/v7/landing-v7-motion.html:1335-1380` (centered column, mark then text) so corridor + fallback read identically.
3. Optional brandmark presence: `BRANDMARK_WORLD_HALF_EXTENT.thoughtform` (~`sceneGeom.ts:616`, 0.32) can get a mobile bump (~0.40) so the wider-fov projection keeps presence. Single tier-branched constant.

### Step 8 — Docs + repo deliverable
- Commit this plan to **`plans/mobile-3d-corridor.md`** (new folder).
- Update **`sentinel/decisions/018-home-v2-depth-corridor.md`**: new revision entry (capability gate, dpr cap, aspect-aware fov, context-loss handling, section-2 stack) and amend the "Mobile fidelity… out of scope" line. Run `sentinel/MAINTENANCE.md` **Cycle B** (behavior-expanding). Update the governing rule/skill if one covers home-v2 (`.claude/rules/landing-v7.md`).

## Critical files

- `components/landing/home-v2/HomeCorridor.tsx` — capability gate (replace `<760`), context-loss fallback.
- `components/landing/home-v2/DepthGatewayScene/sceneGeom.ts` — `getCameraFov(aspect)`, tier-scoped `GATE_PARK_DISTANCE`/brandmark half-extent, mobile `thoughtform.leftCopy` anchor + origin.
- `components/landing/home-v2/hooks/useWorldDomTracker.ts` — mirror camera consumes `getCameraFov` + updates fov on resize (must match canvas camera).
- `components/landing/home-v2/DepthGatewayScene/index.tsx` — tier-aware dpr, aspect-aware fov + resize, context-loss handlers.
- `components/landing/home-v2/CopyAnchors.tsx` — mobile `data-anchor-origin` for the Thoughtform block + phase labels.
- `components/landing/home-v2/home-v2.css` — `@media (max-width:760px)` stacked section-2 copy.
- New: `lib/hooks/useDeviceTier.ts` feeding the fallback decision + the four `pickCount` helpers / two layer guards across `DepthGatewayScene/`.

## Key risks

- **R1 (highest): portrait FOV feasibility.** Wider vfov may un-fill gates vertically / expose seams tuned for 38°. Mitigate with modest widening + tier-scoped `GATE_PARK_DISTANCE`; resolves only by running the scene — budget iteration time.
- **R2: two-camera FOV agreement.** Canvas camera and mirror camera must compute fov from the same aspect and both update on resize, or DOM/canvas desync.
- **R3: per-frame resolver cost.** Don't read `window`/`matchMedia` inside `COPY_ANCHORS` resolvers (run every rAF); cache tier via one resize listener.
- **R4: `pickCount` is mount-time only** (`useMemo([])`). Counts won't recompute on rotate — acceptable for v1 (re-allocating geometry mid-scroll is jarring); document it. The **fov** path *must* update on resize.
- **R5: context-loss restore** must rebuild geometry + re-sync the depth store without double-mounting trackers.
- **R6: brandmark-mode handoff.** `HomeCorridor.tsx:81-119` toggles `data-brandmark-mode` for the global v7 painter; verify the handoff still works now that the corridor can own the brandmark on phones.

## Verification

1. `npm run dev` (:3003). Open `/test/home-v2` (debug HUD) and `/` (production).
2. Chrome responsive devtools at **360 / 390 / 414** widths, portrait + landscape; scrub the full 460svh corridor through all five beats.
3. Per beat confirm: copy/brandmark/canvas stay in sync (no DOM-vs-canvas drift = cameras agree on fov); Thoughtform copy stacks above the mark with clear margin; gates fill the frame (no seams); no horizontal overflow / no copy-mark collision.
4. CPU throttle 4×; background/foreground the tab to exercise context-loss.
5. Reduced-motion + WebGL-disabled → `FallbackCorridor` still renders.
6. `npm run lint` + `npm run build` clean (tier refactor + fov function type-check).
