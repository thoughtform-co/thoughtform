import * as THREE from "three";

import { hexToRgb01 } from "@/lib/latent-flight/vistaPalette";

/**
 * rawColor — a token as a DISPLAY value, not a linear one.
 *
 * Every painter on this site authors its shader output as the value the
 * screen shows (the corridor's `StaticStarfield` writes `(0.93, 0.89, 0.84)`
 * and that is what is displayed), because a `ShaderMaterial` writes raw
 * fragments and the canvas shows them as-is. `new THREE.Color(hex)` would
 * instead decode the token to LINEAR light (0.83 for dawn's 0.92), and the
 * post chain passes values through unencoded (`EffectPass.encodeOutput =
 * false`) so the same convention holds with and without post.
 *
 * ⚠ Measured before this existed: with linear colours and the pass encoding
 * its output, a haze authored at alpha .05 displayed at 59/255 — a grey
 * wash over the whole sky — because sRGB encoding lifts the lows ~5×.
 */
export function rawColor(hex: number): THREE.Color {
  const [r, g, b] = hexToRgb01(hex);
  return new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
}
