/**
 * hologramConnectorStore — bridges the 3D hologram scene and the 2D HUD
 * connector overlay.
 *
 * A projector component inside the R3F canvas computes, each frame, the
 * screen-space pixel position of each service "anchor" (a detected point on
 * the artifact). The HTML/SVG overlay outside the canvas subscribes here and
 * draws the scan-line from each anchor to its service card — the CV-scan
 * effect that links the brandmark to the services (Sutera / Blue-Flax look).
 */

import { create } from "zustand";

export interface ConnectorAnchor {
  /** Screen-space pixel X. */
  x: number;
  /** Screen-space pixel Y. */
  y: number;
  /** False when the anchor is behind the camera / off-clip. */
  visible: boolean;
}

interface HologramConnectorState {
  anchors: ConnectorAnchor[];
  setAnchors: (anchors: ConnectorAnchor[]) => void;
}

export const useHologramConnectors = create<HologramConnectorState>((set) => ({
  anchors: [],
  setAnchors: (anchors) => set({ anchors }),
}));
