/**
 * components/latent-flight/systems — the roster, in run order.
 *
 * The order is the contract: the camera poses first, the cosmos reads the
 * camera and writes the pulsar reading, post reads the reading last. The
 * HUD (M2) will slot between cosmos and post so it projects against the
 * settled camera; input and the ship (M3) go before the camera.
 */

import type { LfFlags } from "@/lib/latent-flight/flags";

import { CameraSystem } from "./CameraSystem";
import { CosmosSystem } from "./CosmosSystem";
import { PostSystem } from "./PostSystem";
import type { LfSystem } from "./System";

export function createSystems(_flags: LfFlags): LfSystem[] {
  return [new CameraSystem(), new CosmosSystem(), new PostSystem()];
}
