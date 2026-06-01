# Depth Corridor Grammar

The home-v2 "depth corridor" (ADR-018) replaces three v7 stations with a single 3D flythrough: one R3F canvas (`DepthGatewayScene`) flies the camera through four gate stations while the brandmark — a true world object — leads the way. This reference captures the load-bearing invariants. Break one and the DOM copy desyncs from the canvas, the mobile composition collapses, or the GPU burns battery off-screen.

Source of truth: `components/landing/home-v2/**`, timeline owner `DepthGatewayScene/sceneGeom.ts`, store `lib/stores/depthGatewayStore.ts`.

---

## Philosophy

The corridor is a single continuous **camera move through latent space**, not a sequence of slides. Every visual — camera, brandmark, compass rings, copy, particle layers — is a pure function of one scroll-derived scalar. There is exactly one timeline and one camera path; everything else reads from them. Coherence comes from that single source, never from independently animating parts.

---

## The timeline law — everything reads `paintProgress`

The store transform (`depthGatewayStore.ts`) exposes both a raw `progress` and a derived `paintProgress`:

| Field          | Meaning                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| `progress`     | Raw 0–1 scrub of the stage. Debug/HUD only.                                              |
| `paintProgress`| What every visual reads. `= progress` while `active`; forced to `0` while `armed`/idle.  |
| `active`       | Stage pinned (`rect.top <= 0`) and still in view. Corridor is engaged.                   |
| `armed`        | Stage rising into the pin; parked layout painted (`paintProgress = 0`).                  |
| `velocity`     | Signed progress-units/sec; zero when idle. Drives velocity-gated layers only.            |

**Rule:** any new visual MUST read `paintProgress`, never raw `progress`. The canvas camera (`FlyingCameraRig`), the DOM mirror camera (`useWorldDomTracker`), the brandmark (`ProjectedBrandmarkActor`), the compass (`ThoughtformCompassGate`), and every `COPY_ANCHORS` resolver all read `paintProgress`. Reading raw `progress` desyncs you from the rest of the scene.

`getCorridorEngagement(rect, vh, progress)` (`depthGatewayStore.ts`) is the single resolver for `active`/`armed`/`paintProgress` — do not recompute engagement elsewhere.

---

## World-space anchoring — the mirror-camera contract

DOM copy and the brandmark are **not** CSS-positioned. They are placed at world coordinates and projected to screen by a mirror camera (`useWorldDomTracker.ts`) that traces the **same path** as the canvas camera. The tracker overwrites each anchor's inline `transform`/`opacity` every frame.

**Rule:** the canvas camera and the mirror camera must compute FOV from the **same aspect via `getCameraFov(aspect)`** and both call `updateProjectionMatrix()` on resize. If they disagree, the DOM copy drifts off the canvas geometry. Pure-CSS repositioning of a tracked anchor's *position* is futile — change the world anchor in `COPY_ANCHORS`; use CSS only for properties the tracker does not write (width, font-size, text-align).

The tracker fires `onPaint(ctx, element)` **after** writing opacity — the sanctioned hook for folding in a per-element factor (the brandmark and the mobile phase factors use this).

---

## Aspect-aware FOV (portrait rule)

`CAMERA_FOV = 38` is a **vertical** FOV (aspect-independent), so portrait phones lose ~2.4× horizontal coverage vs 16:9. `getCameraFov(aspect)` widens the vertical FOV when `aspect < 1` (Hor+ technique) to restore horizontal coverage, **capped ≤ 70°** to avoid fisheye; returns `CAMERA_FOV` for landscape/desktop.

**Rule:** wire BOTH cameras to `getCameraFov` with the same aspect. FOV must update on resize (R3F updates aspect but not fov). Particle counts (`pickCount`) are mount-time only and intentionally do **not** recompute on rotate.

---

## Device tiers & capability gate

`lib/hooks/useDeviceTier.ts` is the single source for sizing decisions:

- `getDeviceTier(width)` → `"mobile" | "tablet" | "desktop"` (`<760 / <1280` thresholds, encoded once).
- `corridorCapable()` — capability floor. The corridor runs on capable phones; only `probeWebGL() === false`, very-low-end hardware, or `(pointer: coarse)` under 360px wide routes to `FallbackCorridor`. The gate is "genuinely incapable", **not** "is a phone".
- `isMobileComposition()` — cached boolean for per-frame resolvers (do NOT read `window`/`matchMedia` inside resolvers that run every rAF). `useDeviceTier()` is the reactive React hook for components.

---

## Mobile composition — two scroll moments

Desktop is copy-left / brandmark-right with a pan-to-centre as you scroll. Mobile (`isMobileComposition()`) reshapes the Thoughtform beat into discrete scroll moments, all gated behind `isMobileComposition()` / `useDeviceTier()` so desktop is provably unchanged:

- **`getMobilePaintProgress(progress)`** — monotonic, continuous piecewise remap keyed off `MOBILE_THOUGHTFORM_END = 0.38` and `dollyHoldEnd`. The entire mobile dwell maps into the camera-held window so the camera stays still through the copy and diagram moments, then flies. Applied at the `paintProgress` write in `useDepthScroll.ts`; on mobile `beat`/`gateProgress` are derived from the painted value, not raw progress.
- **`getThoughtformMobilePhase(rawProgress)`** → `{ copyFactor, diagramFactor, slideY }`. Identity on desktop (short-circuits → all 1 / 0). Drives: copy fading out (Moment 1 → 2), brandmark + compass + phase labels fading/sliding in (Moment 2), via the `onPaint` hook. Position math still uses `paintProgress`; only opacity/slide use the phase factors.

**Rule:** copy/label visibility is keyed off `paintProgress` against `BEAT_WINDOWS` — keeping the mobile remap inside the thoughtform window means no `BEAT_WINDOWS` edits are needed for the dwell. Continuity (C0) at remap seams matters: verify no camera-Z pop where segments meet (`cameraZDollyT` is 0 across the held window, so seams there are safe).

---

## Render-gating contract (load-bearing)

The Canvas is mounted for the whole page but only draws while the corridor is engaged: `frameloop={engaged ? "always" : "demand"}` where `engaged = active || armed` (subscribed via a boolean selector — re-renders only on the engage/disengage edge, not per scroll frame). Disengaged ⇔ corridor fully off-screen, so the GPU idles with nothing visible frozen. This is engagement-gated, **not** velocity-gated, on purpose:

Several layers animate on **continuous `clock` time**, independent of scroll, so they keep moving while the user is parked-and-reading:

| Layer                  | Clock-driven motion                              | File:line (approx)                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------------- |
| ThoughtformAtmosphere  | star twinkle (`uTime`) + boot-glow "breathing"   | `ThoughtformAtmosphere.tsx:339,393`         |
| LatentFieldTunnel      | embedding-vector twinkle (`uTime`)               | `LatentFieldTunnel.tsx:722,737`             |
| InterGateCorridor      | debris-ring rotation (`rotation.z += spinRate*δ`)| `InterGateCorridor.tsx:145`                 |

A naive velocity-gate would freeze these on-screen the moment scrolling stops — a visible regression. Engagement-gating keeps `frameloop="always"` for the whole time the corridor is visible (including parked dwell), and only stops when it is off-screen.

**Rule:** a `useFrame` that animates on continuous `clock` time is permitted *only* because the loop is kept alive while engaged. It MUST tolerate being paused when disengaged and MUST NOT rely on running off-screen. If you ever need a layer to animate while the corridor is off-screen, the engagement gate is the wrong mechanism — revisit ADR-018 first. Everything else (camera, starfield opacity, streaks, motes, wormhole/contours, gates) is a pure function of `paintProgress`/`velocity` and freezes cleanly when idle.

---

## Quick checklist before editing the corridor

- New visual reads `paintProgress` (not raw `progress`)? 
- Touched FOV → both cameras use `getCameraFov(aspect)` + `updateProjectionMatrix()` on resize?
- Mobile branch gated behind `isMobileComposition()` / `useDeviceTier`, desktop path untouched?
- Per-frame resolver avoids reading `window`/`matchMedia` (use the cached `isMobileComposition()`)?
- New `useFrame` with clock-time motion documented against the render-gating contract (paused off-screen is OK)?
- Verified at 390×844 portrait + desktop, scrubbing the full stage, with DOM copy locked to the canvas?
