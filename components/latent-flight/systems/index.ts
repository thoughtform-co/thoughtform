/**
 * components/latent-flight/systems — the roster, in run order.
 *
 * The order is the contract: the boot clock first, then input, then the
 * camera poses, the cosmos reads the camera and writes the pulsar reading,
 * the HUD projects against the settled camera and reads the pulse, and post
 * reads the reading last. The ship (M3) slots between input and the camera.
 */

import type { LfFlags } from "@/lib/latent-flight/flags";

import { BootSystem } from "./BootSystem";
import { CameraSystem } from "./CameraSystem";
import { CosmosSystem } from "./CosmosSystem";
import { HudSystem } from "./HudSystem";
import { InputSystem } from "./InputSystem";
import { PostSystem } from "./PostSystem";
import type { LfSystem } from "./System";

export function createSystems(_flags: LfFlags): LfSystem[] {
  return [
    new BootSystem(),
    new InputSystem(),
    new CameraSystem(),
    new CosmosSystem(),
    new HudSystem(),
    new PostSystem(),
  ];
}
