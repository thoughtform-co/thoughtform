"use client";

import { TalkMarkField } from "./TalkMarkField";

/**
 * The talk's ground (ADR-156 U3): one sticky screen at the head of the talk,
 * pulled out of flow by its own height, that paints the page's void and,
 * very faintly, the brand mark as particles (owner, 2026-10-15: "the
 * Thoughtform brand mark as a subtle particle system in the background").
 *
 * ⚠ IT IS THE OPAQUE GROUND THE TALK'S STAGES DROP. The flow stamp holds the
 * corridor's cell behind everything above the corridor, and once the eras
 * finish its thesis copy unmasks; this ground is what stands between the two.
 * Its visibility is the tail's reader's: off while the talk's top is still
 * below the screen's top (the welded talk overlaps the eras' runway), on from
 * the frame the eras' exit ends.
 *
 * The mark is `TalkMarkField`, a self-contained 2D canvas (the
 * brandmark-particle skill's sanctioned exception, never a fourth global
 * painter); the wrapper dims it.
 */
export function TalkGround() {
  return (
    <div className="uxm-ground" aria-hidden="true">
      <div className="uxm-ground__mark">
        <TalkMarkField />
      </div>
    </div>
  );
}
