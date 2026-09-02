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

import type { BootState } from "@/lib/latent-flight/boot/bootTimeline";
import type { WaypointId } from "@/lib/latent-flight/content/waypoints";
import type { Emitter } from "@/lib/latent-flight/engine/events";
import type { LfEvent, LfState } from "@/lib/latent-flight/engine/gameState";
import type { LfFlags } from "@/lib/latent-flight/flags";
import type { Course } from "@/lib/latent-flight/flight/course";
import type { GameClock } from "@/lib/latent-flight/gameClock";

/** The vessel, as the instruments read it. `ShipSystem` is the one writer. */
export interface ShipPose {
  position: [number, number, number];
  /** Heading, degrees, 0 = down −Z, clockwise from above. */
  heading: number;
  /** 0 … 1. */
  throttle: number;
  /** Course parameter, 0 … 1. */
  s: number;
  /** Speed along the course, world units per second. */
  v: number;
  /** Lateral offsets in the course frame, world units. */
  x: number;
  y: number;
  /** The previous fixed step's pose, for render interpolation. */
  sPrev: number;
  xPrev: number;
  yPrev: number;
  /** The waypoint the vessel is IN — the last one it reached. */
  sector: WaypointId;
  /** The waypoint the vessel is holding AT (inside the hold range), or none. */
  at: WaypointId | null;
  /** The autopilot's destination, or none (hand-flown). */
  autopilot: WaypointId | null;
}

/** The commanded stick and throttle, written by input, read by the ship. */
export interface LfInput {
  /** Commanded throttle, 0 … 1 in eighths. */
  throttle: number;
  /** −1 … 1, right positive. */
  lateral: number;
  /** −1 … 1, up positive. */
  vertical: number;
}

/** The verbs. Systems that own an action install it here; the HUD's
 *  buttons and the keys call through. Defaults are no-ops. */
export interface LfCommands {
  lock(id: WaypointId): void;
  release(): void;
  cycle(dir: 1 | -1): void;
  engage(): void;
  hold(): void;
  throttleStep(delta: number): void;
  undock(): void;
  skipBoot(): void;
}

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
  /** The stage element the canvas fills — the box every projection uses,
   *  and the flight deck that takes the keys. */
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  events: Emitter<LfEvents>;
  /** Renderer profile from the one-shot probe; anything but `ok`/`unknown`
   *  turns antialias and multisampling off. */
  gpu: "ok" | "low" | "software" | "unknown";
  /** When a post chain is mounted it replaces the plain render: the engine
   *  calls this instead of `renderer.render`. Null = no post. */
  compose: (() => void) | null;
  /** The post chain's composer, for the debug handle only. */
  post: { passes: { name: string; enabled: boolean }[] } | null;
  /** World-space anchors the HUD projects and the capture reads by name
   *  (`star`, each waypoint). Written by the system that owns them. */
  anchors: Map<string, THREE.Vector3>;
  /** Boot cue progress, 0 … 1 each. `instantBoot()` when there is no boot. */
  boot: BootState;
  /** The boot clock, seconds (frozen under `?hold=`). */
  bootT: number;
  /** Pointer look, −1 … 1 of the deadzone box on each axis. */
  look: { x: number; y: number };
  /** The locked waypoint, or none. */
  target: WaypointId | null;
  ship: ShipPose;
  input: LfInput;
  /** The route as a curve. */
  course: Course;
  /** The rail lattice's cross-section at the glass, world units — the
   *  flight model's lateral bounds. Written by the rail system on resize. */
  rail: { halfX: number; halfY: number };
  commands: LfCommands;
  /** Lines pushed for the log; the HUD drains them. */
  log: string[];
  /** Drive the FSM. Bound by the engine. */
  dispatch(event: LfEvent): LfState;
}
