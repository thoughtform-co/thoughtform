import {
  BloomEffect,
  ChromaticAberrationEffect,
  EdgeDetectionMode,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  VignetteEffect,
} from "postprocessing";
import * as THREE from "three";

import { pulsarRef } from "@/lib/latent-flight/pulsarRef";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * PostSystem — the chain: SMAA → Bloom → ChromaticAberration → Vignette.
 *
 * A threshold of 0.85 sits above every hairline (dawn at ≤ .55 additive over
 * void) and below the core, so only the light source blooms. The aberration
 * is ZERO at rest and rides the pulse: ADR-080 measured that even 0.00012
 * separates hairlines into a misprint on a line-work object, and the one
 * moment a fringe reads as optics rather than a registration error is the
 * signal. The vignette is the holo program's measured 0.3 scale. No grain
 * pass — the haze and band dither themselves in-shader.
 *
 * ⚠ HALF-FLOAT, NO MULTISAMPLING, SMAA, UNENCODED — each measured, not chosen.
 *   - The scene is authored in DISPLAY values (`scene/color.ts`) and the
 *     renderer's output colour space is LINEAR (`LatentFlightEngine`), so
 *     nothing in the pipeline may encode. A half-float buffer is one
 *     postprocessing never tags as sRGB (it tags BYTE buffers, and three
 *     then encodes into them), and `encodeOutput = false` on every pass
 *     keeps the chain a pass-through by construction rather than by the
 *     identity a linear output space happens to make of it.
 *   - Half-float with 4× multisampling came out BLACK on the owner's GPU
 *     (ANGLE/D3D): the effect pass could not resolve it. So no MSAA, and
 *     SMAA in front of the chain instead — the field cage is hairlines and
 *     the renderer's own `antialias` never reaches a render target.
 *   - The chase that found this: the void read (56,53,50) in EVERY
 *     configuration, plain render included, and the last suspect standing
 *     was three converting the clear colour to the output colour space —
 *     which postprocessing's ClearPass then reused. Toggling passes one at a
 *     time in a headed browser is what isolated it; nothing in the DOM did.
 */

/** ⚠ `radius` and `levels` are the spread. At the library defaults (0.85 / 8)
 *  the widest mip levels carry one 3 px core across the whole frame. */
export const BLOOM = { threshold: 0.85, smoothing: 0.3, intensity: 0.9, radius: 0.5, levels: 5 } as const;
export const ABERRATION_AT_PULSE = 0.0002;
export const VIGNETTE = { offset: 0.2, darkness: 0.15 } as const;

export class PostSystem implements LfSystem {
  readonly name = "post";
  private composer: EffectComposer | null = null;
  private aberration: ChromaticAberrationEffect | null = null;

  init(w: World): void {
    const composer = new EffectComposer(w.renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 0,
    });
    composer.addPass(new RenderPass(w.scene, w.camera));

    const smaa = new SMAAEffect({
      preset: w.gpu === "ok" ? SMAAPreset.HIGH : SMAAPreset.MEDIUM,
      edgeDetectionMode: EdgeDetectionMode.LUMA,
    });
    const aa = new EffectPass(w.camera, smaa);
    composer.addPass(aa);

    const bloom = new BloomEffect({
      mipmapBlur: true,
      luminanceThreshold: BLOOM.threshold,
      luminanceSmoothing: BLOOM.smoothing,
      intensity: w.flags.bloom ? BLOOM.intensity : 0,
      radius: BLOOM.radius,
      levels: BLOOM.levels,
    });
    const aberration = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0, 0),
      radialModulation: false,
      modulationOffset: 0,
    });
    const vignette = new VignetteEffect({
      eskil: false,
      offset: VIGNETTE.offset,
      darkness: VIGNETTE.darkness,
    });
    const effects = new EffectPass(w.camera, bloom, aberration, vignette);
    composer.addPass(effects);
    // ⚠ EVERY EffectPass carries ENCODE_OUTPUT by default, not only the one
    // that renders to screen, and `addPass` re-initialises the pass's
    // material — so the switch is thrown AFTER the passes are added, or it
    // is silently re-armed and the ground lifts to 54/255 (measured).
    aa.encodeOutput = false;
    effects.encodeOutput = false;

    composer.setSize(w.size.w, w.size.h, false);
    this.composer = composer;
    this.aberration = aberration;
    w.compose = () => composer.render();
    w.post = composer;
  }

  render(): void {
    if (!this.aberration) return;
    const c = pulsarRef.current.crossing * ABERRATION_AT_PULSE;
    this.aberration.offset.set(c, c);
  }

  resize(w: World): void {
    this.composer?.setSize(w.size.w, w.size.h, false);
  }

  dispose(w: World): void {
    w.compose = null;
    this.composer?.dispose();
    this.composer = null;
    this.aberration = null;
  }
}
