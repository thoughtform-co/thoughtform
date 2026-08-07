import type { ComponentType } from "react";

import { VesperSessionWireframe } from "./VesperSessionWireframe";

/**
 * TOOL_WIREFRAMES — per-tool AUTHORED wireframes for the bay (ADR-068 D5).
 *
 * A tool listed here draws its interface into `.fl-shot__frame`; a tool
 * ABSENT here renders its duotoned capture, unchanged. That is the whole
 * switch — the bay, the FEED line, the corner brackets, the RUN plate, the
 * halftone veil and the walkthrough button are identical on both branches,
 * because what changes is the EVIDENCE, not the housing.
 *
 * ⚠ A WIREFRAME IS AUTHORED EVIDENCE: NO `<img>`, NO DUOTONE. ADR-064 U2
 * drew the line at AUTHORED vs CAPTURED — the stills are Loop's ads and the
 * films their commercials, left in intended colour, while the four tool
 * CAPTURES are arbitrary screenshot UI, which is exactly what the duotone
 * exists to normalize. A drawing made in this surface's own vocabulary is
 * already normalized; filtering it would be treating our own hand as
 * someone else's screenshot. So the smoke's both-halves assertion is now
 * PER TOOL: a capture tool must be filtered, a wireframe tool must have no
 * img and no filter. That pair is what can tell a deliberate exception from
 * a treatment that has silently stopped applying.
 *
 * Mímir, Babylon and Heimdall keep their captures until each is drawn —
 * every wireframe is its own small pass against this contract, measured at
 * the bay's own three boxes.
 */
export const TOOL_WIREFRAMES: Record<string, ComponentType> = {
  vesper: VesperSessionWireframe,
};
