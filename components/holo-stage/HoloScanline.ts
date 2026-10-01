/**
 * HoloScanline — a CRT scanline pass over the stage (ADR-140).
 *
 * The Evangelion engine's `makeScanPass` (MIT), reduced to the one thing a
 * held instrument's screen carries: horizontal lines every three physical
 * px, MULTIPLIED over the frame. No phosphor mask (an RGB mask over 11px
 * mono type reads as texture on the words), no rolling bar. Strength is a
 * dial, ≤ 0.12 by the lab's reading, and it is ZERO ON PAPER — the light
 * drawing is ink on a page and a page has no phosphor — kept MOUNTED at zero
 * rather than unmounted, because swapping the composer's child count between
 * themes remounts every effect under it (`HoloStageCanvas`'s own note).
 *
 * A `postprocessing` `Effect`; R3F mounts it as a `<primitive>` child of the
 * composer. `resolution` is the library's own uniform (physical px).
 */

import { BlendFunction, Effect } from "postprocessing";
import { Uniform } from "three";

const FRAG = /* glsl */ `
uniform float uStrength;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = uv * resolution;
  float line = 0.5 + 0.5 * cos(px.y * 6.28318530718 / 3.0);
  float m = 1.0 - uStrength * (1.0 - line) * 0.9;
  outputColor = vec4(inputColor.rgb * m, inputColor.a);
}`;

export class HoloScanlineEffect extends Effect {
  constructor(strength = 0.1) {
    super("HoloScanlineEffect", FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([["uStrength", new Uniform(strength)]]),
    });
  }

  get strength(): number {
    return (this.uniforms.get("uStrength") as Uniform<number>).value;
  }

  set strength(v: number) {
    (this.uniforms.get("uStrength") as Uniform<number>).value = v;
  }
}
