"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import {
  bumpFrame,
  exposeFrameCountersForAutomation,
  type FrameCounters,
} from "@/lib/home-v2/frameCounterRef";

/**
 * One `useFrame` per Canvas that counts its painted frames into
 * `frameCounterRef` (ADR-123 §Part 1). Renders nothing, draws nothing, and
 * runs at priority 0 like every painter — a frame R3F does not render (demand
 * mode at rest) is a frame this does not count, which is the point.
 *
 * ⚠ THIS FILE IMPORTS R3F, so it may only be mounted INSIDE a Canvas that is
 * already behind the landing's lazy seams (`landing-import-doctrine`): the
 * corridor's scene and the brandmark particle field both are.
 */
export function FrameCounter({ which }: { which: keyof FrameCounters }) {
  useEffect(() => {
    exposeFrameCountersForAutomation();
  }, []);
  useFrame(() => {
    bumpFrame(which);
  });
  return null;
}
