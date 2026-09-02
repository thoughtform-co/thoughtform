/**
 * components/latent-flight/systems — the roster, in run order.
 *
 * The order is the contract: the boot clock first, then input writes the
 * stick, the ship integrates it and writes the pose, the camera poses from
 * the ship, the cosmos reads the camera and writes the pulsar reading, the
 * rail lattice reads the ship, the HUD projects against the settled camera
 * and reads the pulse, the dock seam reads the state the ship set, and post
 * reads the reading last.
 */

import type { LfFlags } from "@/lib/latent-flight/flags";

import { BootSystem } from "./BootSystem";
import { CameraSystem } from "./CameraSystem";
import { CosmosSystem } from "./CosmosSystem";
import { DockSystem } from "./DockSystem";
import { HudSystem } from "./HudSystem";
import { InputSystem } from "./InputSystem";
import { PostSystem } from "./PostSystem";
import { RailSystem } from "./RailSystem";
import { ShipSystem } from "./ShipSystem";
import type { LfSystem } from "./System";

export function createSystems(_flags: LfFlags): LfSystem[] {
  return [
    new BootSystem(),
    new InputSystem(),
    new ShipSystem(),
    new CameraSystem(),
    new CosmosSystem(),
    new RailSystem(),
    new HudSystem(),
    new DockSystem(),
    new PostSystem(),
  ];
}
