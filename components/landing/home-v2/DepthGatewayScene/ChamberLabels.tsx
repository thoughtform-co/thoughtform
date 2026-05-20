"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { LEFT_BODY_POSITION, RIGHT_BODY_POSITION, getSideBodyOpacity } from "./sceneGeom";

/**
 * ChamberLabels — projects the L/R celestial-body world positions
 * onto screen space and writes the result as CSS variables on the
 * stage's HTML overlay so the DOM labels (`Trusted Sources` /
 * `Headless Surfaces`) track the 3D bodies precisely.
 *
 * Same projection trick the production `TriadScene` uses
 * (`camera.project()` → NDC → CSS %), but writes onto the stage
 * overlay element queried by `[data-home-v2-overlay]`. We also
 * write a single `--label-opacity` that ties both labels to
 * `getSideBodyOpacity(chamberC)`, so the fade-in is perfectly
 * synced with the 3D body opacity.
 *
 * Lives inside the R3F `<Canvas>` because it needs `useThree()` to
 * grab the camera and canvas DOM element. Returns `null` — the
 * actual DOM labels are rendered as siblings of the canvas (see
 * `HomeV2Page`).
 */
export function ChamberLabels() {
  const { camera, gl } = useThree();

  const leftWorld = useMemo(() => new THREE.Vector3(...LEFT_BODY_POSITION), []);
  const rightWorld = useMemo(() => new THREE.Vector3(...RIGHT_BODY_POSITION), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  const lastWrite = useRef<Record<string, string>>({});

  useFrame(() => {
    const { chamberC, active } = useDepthGatewayStore.getState().transform;
    const canvas = gl.domElement;
    const overlay = canvas
      .closest(".home-v2-stage__sticky")
      ?.querySelector<HTMLElement>("[data-home-v2-overlay]");
    if (!overlay) return;

    // Project left + right body world positions to canvas CSS %.
    // We use the canvas's bounding rect for the projection size so
    // the labels land exactly on the body centres regardless of
    // sticky / viewport sizing.
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;

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
