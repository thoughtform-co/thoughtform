/**
 * components/latent-flight/World — what every system receives.
 *
 * The World is the engine's shared state, passed by reference into every
 * `update` and `render`. It holds the three.js trio, the size, the game
 * clock, the FSM state, the flags, the DOM handles and the emitter. Systems
 * read and write it directly; nothing here is reactive. React sees only the
 * low-frequency store (`lib/latent-flight/engine/store`).
 */

import type * as THREE from "three";

import type { Emitter } from "@/lib/latent-flight/engine/events";
import type { LfState } from "@/lib/latent-flight/engine/gameState";
import type { LfFlags } from "@/lib/latent-flight/flags";
import type { GameClock } from "@/lib/latent-flight/gameClock";

export interface LfSize {
  /** CSS pixels. */
  w: number;
  h: number;
  /** The renderer's effective pixel ratio (after the quality ceiling). */
  dpr: number;
}

/** Discrete events the engine emits. Never per frame. */
export interface LfEvents {
  /** The FSM moved. */
  state: { from: LfState; to: LfState };
  /** The WebGL context was lost; the engine is paused. */
  "gl-lost": undefined;
  /** The context came back; the mount should rebuild the engine. */
  "gl-epoch": undefined;
  /** The first frame rendered. */
  ready: undefined;
}

export interface World {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  size: LfSize;
  clock: GameClock;
  fsm: LfState;
  flags: LfFlags;
  /** Reduced motion, resolved once at mount (media query OR `?rm=1`). */
  reducedMotion: boolean;
  /** The stage element the canvas fills — the box every projection uses. */
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  events: Emitter<LfEvents>;
  /** Renderer profile from the one-shot probe; `"mobile"` caps antialias. */
  gpu: "ok" | "low" | "software" | "unknown";
}
