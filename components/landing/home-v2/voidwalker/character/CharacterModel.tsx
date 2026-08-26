"use client";

import { useEffect } from "react";

import type { CharacterEra } from "@/lib/voidwalker/characterEras";
import { setCharacterStageEra } from "@/lib/voidwalker/characterStageRef";

interface Props {
  era: CharacterEra;
}

/**
 * CharacterModel — the DOM-side bridge to the corridor canvas.
 *
 * Publishes the currently-selected era to `characterStageRef`, which
 * the corridor's `CharacterStageActor` reads on `useFrame`. The actual
 * mesh mount is inside the corridor R3F canvas (ADR-082 — one canvas,
 * not two), so this component renders NOTHING to the DOM.
 *
 * ⚠ WHY A REF, NOT PROPS. The R3F painter cannot be a React child of
 * this DOM component — the corridor canvas is a separate tree. A ref
 * bus (the same shape `vwTravelRef` and `aboutStageProgressRef` use)
 * is the shipping pattern for DOM → canvas hand-offs on this site.
 *
 * ⚠ The still image is ALWAYS rendered in the parent viewport
 * (`.ch-viewport__still`). This component's only job is to tell the
 * canvas "which era" and "what rect on screen"; the canvas answers
 * by fading in over the still and driving the mesh. On the fallback
 * paths (no WebGL, PRM, mobile) the canvas never mounts, so this
 * component is inert and the still is the surface.
 */
export function CharacterModel({ era }: Props) {
  useEffect(() => {
    setCharacterStageEra(era.id);
    return () => {
      setCharacterStageEra(null);
    };
  }, [era.id]);

  return null;
}
