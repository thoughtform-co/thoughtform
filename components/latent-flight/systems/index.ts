/**
 * components/latent-flight/systems — the roster, in run order.
 *
 * M0 mounts an empty roster: the engine clears to the ground colour and
 * proves the loop, the rails and the mount. Systems join here as the
 * milestones land, always in the order the contract names.
 */

import type { LfFlags } from "@/lib/latent-flight/flags";

import type { LfSystem } from "./System";

export function createSystems(_flags: LfFlags): LfSystem[] {
  return [];
}
