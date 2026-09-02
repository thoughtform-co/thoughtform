/**
 * lib/latent-flight/pulsarRef — the beacon's live reading, one writer.
 *
 * `CosmosSystem` writes it every frame; the HUD reads it in its own pass.
 * A module ref rather than a store: this changes every frame and nothing in
 * React may hear about it (the corridor's `rigPointerYawRef` precedent).
 */

export interface PulsarReading {
  /** Game time of the reading, seconds. */
  t: number;
  /** Spin phase, radians. */
  phase: number;
  /** 0..1 — the beam's alignment with the camera this frame. */
  crossing: number;
  /** Crossings counted since start (rising edge through 0.5). */
  count: number;
}

export const pulsarRef: { current: PulsarReading } = {
  current: { t: 0, phase: 0, crossing: 0, count: 0 },
};
