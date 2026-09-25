"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { DepthGatewayTransform, Beat } from "@/lib/stores/depthGatewayStore";
import { BEAT_WINDOWS, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { isMobileComposition } from "@/lib/hooks/useDeviceTier";
import {
  PHONE_SEAT_AIR_PX,
  type PhoneSeatEdge,
  phoneSphereScale,
  phoneStraddleWorldY,
  writePhoneSphereScale,
  writePhoneStraddle,
} from "@/lib/home-v2/phoneStraddle";
import {
  MOBILE_GYRO_SPHERE_SCALE,
  MOBILE_GYRO_SPHERE_SCALE_MAX,
  getBrandmarkWorldPosition,
  getCameraFov,
  type DepthFocusWindow,
  depthFocusOpacity,
  getCameraLookAt,
  getCameraPosition,
  phoneSphereRingWorld,
} from "../DepthGatewayScene/sceneGeom";

/**
 * useWorldDomTracker — the central per-frame projector for the
 * home-v2 depth corridor (ADR-018, world-owned rebuild).
 *
 * Projects named WORLD anchors to screen pixels every frame and
 * writes inline `transform: translate3d(...)` + `opacity` to DOM
 * elements found via `[data-world-anchor="{id}"]`. The single
 * mirror camera traces the SAME path as the R3F scene's
 * `FlyingCameraRig` (position dolly + lookAt X-pan), so DOM and
 * canvas content move as one cohesive frame — copy and labels
 * ride the world like gate annotations on Star Atlas.
 *
 * Anchors with a static position pass `[x, y, z]` directly. Anchors
 * with a dynamic position (e.g. the travelling brandmark) pass a
 * resolver `(transform) => [x, y, z]`.
 *
 * Per-anchor opacity is driven by `visibilityBeats` membership, with
 * a smooth fade-in / fade-out at the outer boundaries of the
 * combined visibility window. Anchors behind the camera are hidden.
 *
 * `onPaint` is an optional per-anchor hook called after the inline
 * styles are written, for consumers that need to compute extra
 * frame state (e.g. the brandmark actor's perspective-correct
 * width/height + tilt).
 */

export type WorldAnchorPosition =
  | readonly [number, number, number]
  | ((transform: DepthGatewayTransform) => readonly [number, number, number]);

export interface PerspectiveScaleConfig {
  /** World-space camera-to-anchor distance at which scale = 1.
   *  Below this distance the element gets LARGER (up to `max`);
   *  above this distance it gets SMALLER (down to `min`). Pick
   *  this to match the camera-to-gate distance at the anchor's
   *  parked beat (usually `GATE_PARK_DISTANCE` ≈ 4.5). */
  referenceDistance: number;
  /** Minimum scale clamp (when very far). Defaults to 0.35. */
  min?: number;
  /** Maximum scale clamp (when very close). Defaults to 1.25. */
  max?: number;
}

export interface WorldAnchor {
  /** DOM lookup: `[data-world-anchor="{id}"]`. */
  id: string;
  /** Static `[x, y, z]` or dynamic resolver. */
  position: WorldAnchorPosition;
  /** Beats during which the anchor is visible (opacity 1). Outside,
   *  fades to 0 with a soft envelope (see `fadeFrac`). */
  visibilityBeats: Beat[];
  /** Fade window (fraction of the FULL combined visibility window)
   *  applied at both outer boundaries. Default 0.15. */
  fadeFrac?: number;
  /** Optional perspective scaling. When set, the element is
   *  CSS-transformed with a scale factor derived from the
   *  camera-to-anchor distance, so labels at depth read SMALLER
   *  and grow into view as the camera approaches. Without this
   *  the element is always at 1:1 size regardless of world Z,
   *  which is what we want for HUD chrome but reads as "pop-in"
   *  for in-world labels (e.g. Diagnostic orbit pills that the
   *  user is supposed to feel flying toward). */
  perspectiveScale?: PerspectiveScaleConfig;
  /** Optional camera-space focus window. When set, the anchor's
   *  visibility opacity is MULTIPLIED by
   *  `depthFocusOpacity(camToAnchor, depthFade)` — so in-world DOM
   *  labels emerge by DISTANCE, not just by beat membership.
   *
   *  Beat visibility decides WHEN the element is allowed to paint;
   *  depthFade decides HOW MUCH of that paint actually reaches the
   *  user as the camera approaches and passes the anchor.
   *
   *  Use this for any DOM anchor co-located with a 3D gate that
   *  should appear faintly when far, intensify as the camera
   *  closes the distance, and recede as it passes — matching the
   *  Star Atlas-style depth contract that already governs the
   *  R3F geometry on this route (see ADR-018 2026-05-24 revision).
   *
   *  Without this, anchors with multi-beat visibility windows pop
   *  to full opacity the moment they enter the window — even if
   *  the camera is still many world units away — which reads as
   *  "the next section is already there" rather than as travel
   *  through depth. */
  depthFade?: DepthFocusWindow;
  /** Phone only (ADR-125 U1): seat this cluster on a chrome band at its
   *  park. The tracker projects `base` (the anchor at straddle 0) at
   *  `parkProgress` once per resize, measures the element, and writes the
   *  world-Y straddle that puts the anchored edge on the band + the seat
   *  air into `lib/home-v2/phoneStraddle`'s registry, which the anchor's
   *  own `position` reads. `edge: "top"` is a `bottom-center` title (its
   *  BOTTOM edge is the anchor), `"bottom"` a `top-center` caption. */
  phoneSeat?: {
    edge: PhoneSeatEdge;
    parkProgress: number;
    base: (transform: DepthGatewayTransform) => readonly [number, number, number];
  };
  /** Optional per-frame hook fired after inline transform + opacity
   *  are written. Use for extra frame state (perspective-correct
   *  width/height, custom tilt, etc.). */
  onPaint?: (ctx: PaintContext, element: HTMLElement) => void;
}

export interface PaintContext {
  /** Latest depth-gateway transform. */
  transform: DepthGatewayTransform;
  /** The mirror camera (already updated this frame). */
  camera: THREE.PerspectiveCamera;
  /** Current viewport width (px). */
  vw: number;
  /** Current viewport height (px). */
  vh: number;
  /** Anchor's world position resolved this frame. */
  worldPos: readonly [number, number, number];
  /** Projected screen position (px). */
  screenX: number;
  screenY: number;
  /** False if the anchor is behind the camera. */
  inFront: boolean;
  /** Computed visibility opacity (0..1). */
  visibilityOpacity: number;
}

/** Map `data-anchor-origin` keyword → `translate(x%, y%)` value. The
 *  percent translate is applied AFTER the pixel translate3d in the
 *  combined transform string, so it shifts the element by a fraction
 *  of its OWN size — landing the named anchor point on the projected
 *  screen position.
 *
 *    "center"        : centre of the element on the anchor
 *    "top-center"    : top edge centred horizontally on the anchor
 *    "bottom-center" : bottom edge centred horizontally on the anchor
 *    "left-center"   : left edge centred vertically on the anchor
 *    "right-center"  : right edge centred vertically on the anchor
 *    "top-left"      : element's top-left corner on the anchor (no shift)
 *    "top-right"     : element's top-right corner on the anchor
 *    "bottom-left"   : element's bottom-left corner on the anchor
 *    "bottom-right"  : element's bottom-right corner on the anchor
 */
const ANCHOR_ORIGINS: Record<string, string> = {
  center: "-50%, -50%",
  "top-center": "-50%, 0%",
  "bottom-center": "-50%, -100%",
  "left-center": "0%, -50%",
  "right-center": "-100%, -50%",
  "top-left": "0%, 0%",
  "top-right": "-100%, 0%",
  "bottom-left": "0%, -100%",
  "bottom-right": "-100%, -100%",
};

/** Make a mirror camera mounted to the same FOV as the R3F scene.
 *  Uses the aspect-aware `getCameraFov` so the DOM projection matches
 *  the canvas camera on portrait viewports (ADR-018 mobile revision). */
function makeMirrorCamera(aspect: number): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(getCameraFov(aspect), aspect, 0.1, 100);
}

/**
 * THE BOX THE DOM PROJECTS INTO IS THE STAGE CELL, NEVER THE WINDOW
 * (ADR-018, 2026-09-16). The canvas paints into `.home-v2-stage__sticky`
 * — `100svh` tall, and `100svh` stays SMALL on iOS while
 * `window.innerHeight` grows to the large viewport as the toolbar
 * collapses. Projecting NDC into the window and then writing `left/top`
 * inside the cell pushed every anchor down by `(lvh − svh) / 2` at the
 * centre, growing away from it: the mark and the phase labels sat ~50px
 * under the compass frame on a real iPhone while the WebGL frame (drawn
 * in the cell) was exactly where the world said. Chromium's phone
 * emulation carries the same class of mismatch (`innerHeight` 912 on an
 * 844 window), which is why no DOM-vs-DOM probe ever saw it.
 *
 * Every root the tracker is handed lives inside that cell — the copy
 * layer is `inset: 0` in it, the brandmark shell is absolute in it (and
 * stays a DOM descendant when CSS promotes it to `fixed`, where the
 * canvas is `fixed` at `100svh` too) — so the cell is the one box both
 * projectors share. Resolved once per root and observed, never read per
 * tick: `clientWidth`/`clientHeight` are a layout read, and the cell does
 * not move when the toolbar does, which is the whole point.
 */
export function stageBoxOf(root: Element | null): HTMLElement | null {
  if (!root) return null;
  return (root.closest(".home-v2-stage__sticky") as HTMLElement | null) ?? (root as HTMLElement);
}

/** The projection box: the stage cell's size, the window only while the
 *  cell measures nothing (before first layout). */
export function projectionSize(box: HTMLElement | null): { w: number; h: number } {
  const w = box?.clientWidth ?? 0;
  const h = box?.clientHeight ?? 0;
  if (w > 0 && h > 0) return { w, h };
  return { w: window.innerWidth || 1, h: window.innerHeight || 1 };
}

/** Sync the mirror camera to the corridor camera path for the
 *  given progress. */
function syncMirrorCamera(camera: THREE.PerspectiveCamera, progress: number) {
  const [cx, cy, cz] = getCameraPosition(progress);
  const [lx, ly, lz] = getCameraLookAt(progress);
  camera.position.set(cx, cy, cz);
  camera.up.set(0, 1, 0);
  camera.lookAt(lx, ly, lz);
  camera.updateMatrixWorld();
}

/** Resolve an anchor's world position (static or dynamic). */
function resolvePosition(
  position: WorldAnchorPosition,
  transform: DepthGatewayTransform
): readonly [number, number, number] {
  return typeof position === "function" ? position(transform) : position;
}

/** Compute per-anchor visibility opacity (0..1) from beat membership.
 *
 *  The combined "visible" window is the union of the start of the
 *  earliest beat and the end of the latest beat in `visibilityBeats`.
 *  Inside the window the anchor is at 1; outside, it ramps to 0
 *  across `fadeFrac * (windowWidth)` at each edge. */
function computeVisibilityOpacity(anchor: WorldAnchor, progress: number): number {
  const windows = BEAT_WINDOWS.filter((w) => anchor.visibilityBeats.includes(w.beat));
  if (windows.length === 0) return 0;
  const start = Math.min(...windows.map((w) => w.start));
  const end = Math.max(...windows.map((w) => w.end));
  const fadeFrac = anchor.fadeFrac ?? 0.15;
  const fade = (end - start) * fadeFrac;
  if (progress >= start && progress <= end) return 1;
  if (progress > start - fade && progress < start) {
    return (progress - (start - fade)) / fade;
  }
  if (progress > end && progress < end + fade) {
    return 1 - (progress - end) / fade;
  }
  return 0;
}

export function useWorldDomTracker(
  anchors: readonly WorldAnchor[],
  rootRef: RefObject<HTMLElement | null>
): void {
  // Refs persist across frames so we don't allocate per tick.
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const projectedRef = useRef<THREE.Vector3 | null>(null);
  const fwdRef = useRef<THREE.Vector3 | null>(null);
  const toAnchorRef = useRef<THREE.Vector3 | null>(null);
  const lastStateRef = useRef<Map<string, { x: number; y: number; o: number; visible: boolean }>>(
    new Map()
  );
  const elementCacheRef = useRef<Map<string, HTMLElement | null>>(new Map());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stageBox = stageBoxOf(rootRef.current);
    const box = projectionSize(stageBox);
    cameraRef.current = makeMirrorCamera(box.w / box.h);
    projectedRef.current = new THREE.Vector3();
    fwdRef.current = new THREE.Vector3();
    toAnchorRef.current = new THREE.Vector3();
    lastStateRef.current = new Map();
    elementCacheRef.current = new Map();

    const elementFor = (id: string): HTMLElement | null => {
      const root = rootRef.current;
      if (!root) return null;
      const elementCache = elementCacheRef.current;
      let element = elementCache.get(id);
      if (!element) {
        const selector = `[data-world-anchor="${id}"]`;
        element = root.matches(selector)
          ? (root as HTMLElement)
          : root.querySelector<HTMLElement>(selector);
        if (element) elementCache.set(id, element);
      }
      return element ?? null;
    };

    // ── The beats' seat lines (ADR-125 U1, phone only) ───────────────
    // A seated anchor's straddle is DERIVED from the frame: at the beat's
    // park, project the anchor's base pose (straddle 0) and one world unit
    // above it, measure the cluster, and solve the world-Y that puts its
    // anchored edge on the chrome band + the seat air. Then the sphere: the
    // largest ring that clears both clusters on the tightest beat, capped.
    // Runs once per resize (and again when a seated cluster reflows), never
    // per tick — `offsetHeight` is a layout read. The results live in
    // `lib/home-v2/phoneStraddle`'s registry, which `sceneGeom` reads; the
    // record is written onto the root as `data-phone-seats` for the smoke.
    const seatCam = makeMirrorCamera(box.w / box.h);
    const seatProj = new THREE.Vector3();
    const seatFwd = new THREE.Vector3();
    const seatTo = new THREE.Vector3();
    let seatsDirty = true;
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const derivePhoneSeats = () => {
      seatsDirty = false;
      if (!isMobileComposition()) return;
      const root = rootRef.current;
      if (!root) return;
      const topLine = root.querySelector<HTMLElement>(".home-v2-copy-seat--top")?.offsetHeight ?? 0;
      const bottomLine =
        root.querySelector<HTMLElement>(".home-v2-copy-seat--bottom")?.offsetHeight ?? 0;
      if (!(topLine > 0 && bottomLine > 0)) {
        seatsDirty = true;
        return;
      }
      const vh = box.h;
      seatCam.aspect = box.w / vh;
      seatCam.fov = getCameraFov(seatCam.aspect);
      seatCam.updateProjectionMatrix();
      const live = useDepthGatewayStore.getState().transform;
      const projectY = (p: readonly [number, number, number]) => {
        seatProj.set(p[0], p[1], p[2]).project(seatCam);
        return (-seatProj.y * 0.5 + 0.5) * vh;
      };
      type Band = {
        park: number;
        titleBottom?: number;
        captionTop?: number;
        title?: number;
        caption?: number;
      };
      const bands = new Map<string, Band>();
      let seated = 0;
      for (const anchor of anchors) {
        const seat = anchor.phoneSeat;
        if (!seat) continue;
        const element = elementFor(anchor.id);
        if (!element) {
          seatsDirty = true;
          continue;
        }
        const park = seat.parkProgress;
        syncMirrorCamera(seatCam, park);
        const at: DepthGatewayTransform = {
          ...live,
          progress: park,
          paintProgress: park,
          active: true,
          armed: false,
        };
        const base = seat.base(at);
        const [lx, ly, lz] = getCameraLookAt(park);
        seatFwd.set(lx, ly, lz).sub(seatCam.position).normalize();
        seatTo.set(base[0], base[1], base[2]).sub(seatCam.position);
        const dist = Math.max(0.2, Math.abs(seatTo.dot(seatFwd)));
        const centreY = projectY(base);
        const pxPerUnit = centreY - projectY([base[0], base[1] + 1, base[2]]);
        if (!(pxPerUnit > 0)) continue;
        let scale = 1;
        if (anchor.perspectiveScale) {
          const { referenceDistance, min = 0.35, max = 1.25 } = anchor.perspectiveScale;
          scale = Math.min(max, Math.max(min, referenceDistance / dist));
        }
        const clusterPx = element.offsetHeight;
        const seatLinePx = seat.edge === "top" ? topLine : bottomLine;
        const y = phoneStraddleWorldY({
          edge: seat.edge,
          vh,
          seatLinePx,
          clusterPx,
          scale,
          centreY,
          pxPerUnit,
        });
        writePhoneStraddle(anchor.id, y);
        if (ro) ro.observe(element);
        seated += 1;
        const key = anchor.id.split(".")[0];
        const band = bands.get(key) ?? { park };
        if (seat.edge === "top") {
          band.titleBottom = seatLinePx + clusterPx * scale;
          band.title = y;
        } else {
          band.captionTop = vh - seatLinePx - clusterPx * scale;
          band.caption = y;
        }
        bands.set(key, band);
      }
      if (seated === 0) return;
      let tightest = Infinity;
      const record: Record<string, unknown> = {
        vh,
        air: PHONE_SEAT_AIR_PX,
        topLine,
        bottomLine,
        sphereBase: MOBILE_GYRO_SPHERE_SCALE,
        sphereMax: MOBILE_GYRO_SPHERE_SCALE_MAX,
      };
      for (const [key, band] of bands) {
        if (band.titleBottom === undefined || band.captionTop === undefined) continue;
        syncMirrorCamera(seatCam, band.park);
        const sphere = getBrandmarkWorldPosition(band.park);
        const sphereY = projectY(sphere);
        const unit = sphereY - projectY([sphere[0], sphere[1] + 1, sphere[2]]);
        const ringPxAtBase = phoneSphereRingWorld(band.park) * unit;
        const halfBand = Math.min(sphereY - band.titleBottom, band.captionTop - sphereY);
        const fit = phoneSphereScale({
          halfBandPx: halfBand,
          ringPxAtBase,
          base: MOBILE_GYRO_SPHERE_SCALE,
          max: MOBILE_GYRO_SPHERE_SCALE_MAX,
        });
        tightest = Math.min(tightest, fit);
        record[key] = {
          park: r2(band.park),
          title: r2(band.title ?? NaN),
          caption: r2(band.caption ?? NaN),
          titleBottom: r2(band.titleBottom),
          captionTop: r2(band.captionTop),
          sphereY: r2(sphereY),
          ringPxAtBase: r2(ringPxAtBase),
          fit: r2(fit),
        };
      }
      if (Number.isFinite(tightest)) {
        writePhoneSphereScale(tightest);
        record.sphere = r2(tightest);
      }
      root.setAttribute("data-phone-seats", JSON.stringify(record));
    };

    const onResize = () => {
      const cam = cameraRef.current;
      if (!cam) return;
      const next = projectionSize(stageBox);
      box.w = next.w;
      box.h = next.h;
      cam.aspect = box.w / box.h;
      // Keep fov in lock-step with the canvas camera (both derive from
      // the same aspect) so the projection never desyncs on rotate.
      cam.fov = getCameraFov(cam.aspect);
      cam.updateProjectionMatrix();
      // The frame moved (or a seated cluster reflowed): re-derive the
      // phone seats on the next tick, never inside the observer.
      seatsDirty = true;
    };
    // The cell resizes on rotate and on a real resize; it does NOT resize
    // when an iOS toolbar collapses — which is exactly when `window`
    // `resize` fires with a height this box must not follow.
    const ro =
      stageBox && typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    if (ro && stageBox) ro.observe(stageBox);
    else window.addEventListener("resize", onResize);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const root = rootRef.current;
      const cam = cameraRef.current;
      const proj = projectedRef.current;
      const fwd = fwdRef.current;
      const toA = toAnchorRef.current;
      if (!root || !cam || !proj || !fwd || !toA) return;

      if (seatsDirty) derivePhoneSeats();

      const transform = useDepthGatewayStore.getState().transform;
      // Use `paintProgress` so during the `armed` pre-arm pass the
      // mirror camera sits at parked Thoughtform (progress 0) — the
      // first `active` frame then already has every anchor's
      // transform written, so the room reads as "furnished on
      // arrival" rather than filling in as the user scrolls.
      const painting = transform.active || transform.armed;
      const paintProgress = transform.paintProgress;
      syncMirrorCamera(cam, paintProgress);

      const vw = box.w;
      const vh = box.h;

      // Camera-forward (used for behind-camera culling).
      const [lx, ly, lz] = getCameraLookAt(paintProgress);
      fwd.set(lx, ly, lz).sub(cam.position).normalize();

      for (const anchor of anchors) {
        const element = elementFor(anchor.id);
        if (!element) continue;

        const worldPos = resolvePosition(anchor.position, transform);

        // Behind-camera cull.
        toA.set(worldPos[0], worldPos[1], worldPos[2]).sub(cam.position);
        const camToAnchor = toA.dot(fwd);
        const beatOpacity = computeVisibilityOpacity(anchor, paintProgress);
        // Depth-fade: when an anchor opts in via `depthFade`, the
        // beat-driven opacity is multiplied by a depth-focus
        // envelope so the element registers faintly when far,
        // intensifies as the camera closes the distance, and
        // recedes as it crosses the camera. Without this, in-world
        // labels with multi-beat visibility windows pop to full
        // opacity the moment they enter the window — which reads
        // as "the next section is already there" instead of as a
        // distant object approaching.
        const depthMultiplier = anchor.depthFade
          ? depthFocusOpacity(camToAnchor, anchor.depthFade)
          : 1;
        const visibilityOpacity = beatOpacity * depthMultiplier;
        const inFront = camToAnchor > 0.2;
        // Paint (write transform) while armed OR active. Opacity is
        // forced to 0 while only armed so nothing is visually shown
        // until the stage actually pins. The first `active` frame
        // then flips opacity to its computed visibility value with
        // every transform already in place.
        const visible = inFront && visibilityOpacity > 0.001 && painting;

        const lastState = lastStateRef.current;
        const last = lastState.get(anchor.id);

        if (!visible) {
          if (!last || last.visible) {
            element.style.opacity = "0";
            element.style.pointerEvents = "none";
            lastState.set(anchor.id, {
              x: last?.x ?? 0,
              y: last?.y ?? 0,
              o: 0,
              visible: false,
            });
          }
          continue;
        }

        // Project world -> NDC -> screen.
        proj.set(worldPos[0], worldPos[1], worldPos[2]).project(cam);
        const screenX = (proj.x * 0.5 + 0.5) * vw;
        const screenY = (-proj.y * 0.5 + 0.5) * vh;

        const becameVisible = !last || !last.visible;
        if (becameVisible) {
          // Clear any inline display:none set by a consumer (notably
          // ProjectedBrandmarkActor during the substrate-cut window).
          element.style.pointerEvents = "";
          element.style.display = "";
        }

        // Resolve anchor origin from `data-anchor-origin` attribute.
        // The pixel translate places the element's TOP-LEFT corner at
        // (screenX, screenY); the percent translate (applied AFTER
        // because CSS transforms read left-to-right) shifts the
        // element by a fraction of its OWN size so the desired
        // origin lands on (screenX, screenY).
        const origin = element.getAttribute("data-anchor-origin") ?? "center";
        const originPercent = ANCHOR_ORIGINS[origin] ?? ANCHOR_ORIGINS.center;

        // Optional perspective scaling — labels at depth read
        // smaller and grow as the camera closes the distance.
        // Without this the projected screen X/Y is correct but
        // the element is always rendered at 1:1 size, which
        // reads as "pop-in" for in-world labels.
        let scaleSegment = "";
        if (anchor.perspectiveScale) {
          const { referenceDistance, min = 0.35, max = 1.25 } = anchor.perspectiveScale;
          // `camToAnchor` is the signed forward distance computed
          // above. Use the unsigned magnitude here so the scale is
          // well-behaved right up to the cull edge.
          const dist = Math.max(0.2, Math.abs(camToAnchor));
          const raw = referenceDistance / dist;
          const scale = Math.min(max, Math.max(min, raw));
          scaleSegment = ` scale(${scale.toFixed(3)})`;
        }

        const transformValue = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(
          2
        )}px, 0) translate(${originPercent})${scaleSegment}`;

        if (
          !last ||
          becameVisible ||
          Math.abs(screenX - last.x) > 0.25 ||
          Math.abs(screenY - last.y) > 0.25 ||
          // Always re-write while perspective scale is active so
          // the element interpolates smoothly with distance —
          // pixel-position change alone won't catch the case
          // where the camera dollies forward but the anchor sits
          // on the optical axis (screenX/screenY barely change).
          !!anchor.perspectiveScale
        ) {
          element.style.transform = transformValue;
        }

        // Paint at the computed visibility opacity for BOTH `active`
        // and `armed`. `paintProgress` is forced to 0 while armed
        // (see depthGatewayStore.getCorridorEngagement) so the
        // parked Thoughtform layout is what the user sees as the
        // sticky stage rises into pin — copy + phase labels are
        // already in place, the second section reads as composed
        // on arrival rather than fading in only after pin.
        if (!last || becameVisible || Math.abs(visibilityOpacity - last.o) > 0.005) {
          element.style.opacity = `${visibilityOpacity.toFixed(3)}`;
        }

        lastState.set(anchor.id, { x: screenX, y: screenY, o: visibilityOpacity, visible: true });

        if (anchor.onPaint) {
          anchor.onPaint(
            {
              transform,
              camera: cam,
              vw,
              vh,
              worldPos,
              screenX,
              screenY,
              inFront,
              visibilityOpacity,
            },
            element
          );
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    // Pause the per-frame projection loop while the tab is hidden — it
    // projects ~N anchors every frame and is pure overhead in the
    // background. Safe to hard-stop: `tick` carries no integrated state
    // (it re-reads `paintProgress` and projects from scratch each frame),
    // so the first frame after resume is fully correct with no snap.
    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [anchors, rootRef]);
}
