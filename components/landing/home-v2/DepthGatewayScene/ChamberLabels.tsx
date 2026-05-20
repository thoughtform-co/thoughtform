"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  BRANDMARK_REST,
  LEFT_BODY_POSITION,
  RIGHT_BODY_POSITION,
  SUBSTRATE_SCALE,
  getBrandmarkPosition,
  getBrandmarkScale,
  getSideBodyOpacity,
} from "./sceneGeom";

/**
 * ChamberLabels — projects the live 3D anchor points (brandmark
 * centre + on-screen radius, L/R celestial bodies) onto the canvas
 * and writes them as CSS variables on the stage's HTML overlay so
 * DOM elements track the 3D content precisely.
 *
 * Same projection trick the production `TriadScene` uses
 * (`camera.project()` → NDC → CSS %), extended to also project the
 * brandmark's centre + right edge so Chamber B's diagnostic pills
 * can sit on an orbit just outside the brandmark cloud, even as
 * the camera dollies and the cloud's apparent size changes.
 *
 * CSS vars written on `[data-home-v2-overlay]`:
 *
 *   --brand-x / --brand-y — brandmark centre in canvas %.
 *   --brand-r             — half-width of the brandmark on screen,
 *                            in px. Diagnostic pills use this to
 *                            sit at a consistent visual distance
 *                            from the cloud.
 *   --left-x / --left-y   — Trusted Sources body in canvas %.
 *   --right-x / --right-y — Headless Surfaces body in canvas %.
 *   --label-opacity       — driven by `getSideBodyOpacity(chamberC)`,
 *                            fades the L/R HUD captions with their
 *                            3D bodies.
 *
 * Returns `null` — the DOM elements live as siblings of the canvas
 * (see `HomeV2Page`).
 */
export function ChamberLabels() {
  const { camera, gl } = useThree();

  const leftWorld = useMemo(() => new THREE.Vector3(...LEFT_BODY_POSITION), []);
  const rightWorld = useMemo(() => new THREE.Vector3(...RIGHT_BODY_POSITION), []);
  const brandWorld = useMemo(() => new THREE.Vector3(...BRANDMARK_REST), []);
  const brandEdgeWorld = useMemo(() => new THREE.Vector3(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  const lastWrite = useRef<Record<string, string>>({});

  useFrame(() => {
    const transform = useDepthGatewayStore.getState().transform;
    const { progress, chamberA, chamberC, active } = transform;

    const canvas = gl.domElement;
    const overlay = canvas
      .closest(".home-v2-stage__sticky")
      ?.querySelector<HTMLElement>("[data-home-v2-overlay]");
    if (!overlay) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;

    // ── Brandmark centre + on-screen radius ──────────────────
    // Track the brandmark's CURRENT world position (not the REST
    // fallback) so Chamber A's right→centre drift is reflected for
    // any DOM decoration that wants to follow it. The on-screen
    // radius lets the diagnostic pills sit at a stable visual
    // distance from the cloud as the camera dollies through.
    const [bx, by, bz] = getBrandmarkPosition(progress, chamberA);
    brandWorld.set(bx, by, bz);

    // BrandmarkPointCloud blends from `baseScale` toward
    // SUBSTRATE_SCALE across Chamber C — mirror that here so the
    // projected radius tracks the morph.
    const baseScale = getBrandmarkScale(progress, chamberA);
    const liveScale = baseScale + (SUBSTRATE_SCALE - baseScale) * chamberC;
    // BRANDMARK_LOCAL_HALF (0.55) × parent group scale ≈ world
    // half-size on the X axis.
    brandEdgeWorld.set(brandWorld.x + liveScale * 0.55, brandWorld.y, brandWorld.z);

    scratch.copy(brandWorld).project(camera);
    const brandX = (scratch.x * 0.5 + 0.5) * 100;
    const brandY = (-scratch.y * 0.5 + 0.5) * 100;
    setVar(overlay, lastWrite.current, "--brand-x", `${brandX.toFixed(2)}%`);
    setVar(overlay, lastWrite.current, "--brand-y", `${brandY.toFixed(2)}%`);

    scratch.copy(brandEdgeWorld).project(camera);
    const edgeX = (scratch.x * 0.5 + 0.5) * 100;
    const radiusPct = Math.abs(edgeX - brandX);
    const radiusPx = (radiusPct / 100) * rect.width;
    setVar(overlay, lastWrite.current, "--brand-r", `${radiusPx.toFixed(1)}px`);

    // ── Side bodies (Trusted Sources / Headless Surfaces) ────
    scratch.copy(leftWorld).project(camera);
    const leftX = (scratch.x * 0.5 + 0.5) * 100;
    const leftY = (-scratch.y * 0.5 + 0.5) * 100;
    setVar(overlay, lastWrite.current, "--left-x", `${leftX.toFixed(2)}%`);
    setVar(overlay, lastWrite.current, "--left-y", `${leftY.toFixed(2)}%`);

    scratch.copy(rightWorld).project(camera);
    const rightX = (scratch.x * 0.5 + 0.5) * 100;
    const rightY = (-scratch.y * 0.5 + 0.5) * 100;
    setVar(overlay, lastWrite.current, "--right-x", `${rightX.toFixed(2)}%`);
    setVar(overlay, lastWrite.current, "--right-y", `${rightY.toFixed(2)}%`);

    const opacity = active ? getSideBodyOpacity(chamberC) : 0;
    setVar(overlay, lastWrite.current, "--label-opacity", opacity.toFixed(3));
  });

  return null;
}

function setVar(el: HTMLElement, cache: Record<string, string>, key: string, value: string): void {
  if (cache[key] !== value) {
    el.style.setProperty(key, value);
    cache[key] = value;
  }
}
