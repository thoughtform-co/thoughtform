import * as THREE from "three";

import { getDeviceTier } from "@/lib/hooks/useDeviceTier";
import {
  effectiveDprCeiling,
  reportFrameSample,
  resetFrameSampler,
  useQualityStore,
} from "@/lib/hooks/useQualityTier";
import { flightFov } from "@/lib/latent-flight/camera/fov";
import { Emitter } from "@/lib/latent-flight/engine/events";
import { transition, type LfEvent, type LfState } from "@/lib/latent-flight/engine/gameState";
import { stepLoop } from "@/lib/latent-flight/engine/loop";
import { resetLfStore, setLfState } from "@/lib/latent-flight/engine/store";
import type { LfFlags } from "@/lib/latent-flight/flags";
import { advanceClock, createGameClock } from "@/lib/latent-flight/gameClock";
import { pulsarRef, type PulsarReading } from "@/lib/latent-flight/pulsarRef";
import { VISTA } from "@/lib/latent-flight/vistaPalette";
import { classifyRenderer } from "@/lib/webgl/rendererClass";

import type { LfEvents, World } from "./World";
import { rawColor } from "./scene/color";
import type { LfSystem } from "./systems/System";

/**
 * LatentFlightEngine — the game loop, and the one owner of the frame.
 *
 * One `tick` per animation frame: clamp the delta → advance the game clock →
 * run every system's fixed-step `update` (0…4 times) → run every system's
 * `render(alpha)` → `renderer.render` → the liveness attribute → the frame
 * sample for the quality governor. React constructs it once and never hears
 * from it again except through the low-frequency store and the emitter.
 *
 * What it borrows from the corridor, deliberately: the DPR ceiling and the
 * FPS governor (`useQualityTier`), the renderer profile probe, the
 * context-loss remount recipe, the aspect-aware fov. What it does not: any
 * scroll writer, any store the landing reads, any React in the frame.
 *
 * ⚠ Strict Mode constructs, disposes and constructs again on the SAME canvas
 * in development. `dispose` therefore releases listeners and GPU resources
 * but never forces a context loss — the second engine reuses the canvas's
 * one context, and three re-initialises its state on a fresh renderer.
 */

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** The stage element the canvas fills. Sized by CSS; measured here. */
  root: HTMLElement;
  flags: LfFlags;
  reducedMotion: boolean;
  systems: LfSystem[];
}

export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 400;

/** What `samplePixels` reports — enough for a capture gate, never a bitmap. */
export interface PixelSummary {
  w: number;
  h: number;
  /** Mean luminance, 0–255. */
  mean: number;
  /** Distinct luminance values seen (a flat wash has few; stars have many). */
  distinct: number;
  /** Brightest luminance, 0–255. */
  max: number;
  /** Count of gold-dominant pixels (warm, r > g > b, bright). */
  gold: number;
  /** First gold-dominant pixel, CSS px from the top-left, or null. */
  goldAt: [number, number] | null;
  /** Gold-dominant pixels inside the focus radius (0 without a focus). */
  goldNear: number;
}

export interface PixelFocus {
  /** CSS px from the top-left. */
  x: number;
  y: number;
  /** CSS px. */
  r: number;
}

declare global {
  interface Window {
    __latentFlight?: {
      samplePixels: (focus?: PixelFocus) => Promise<PixelSummary>;
      state: () => LfState;
      frame: () => number;
      dispatch: (event: LfEvent) => LfState;
      pulsar: () => PulsarReading;
      /** Game time, seconds. */
      time: () => number;
      /** Named world anchors projected to CSS px (top-left origin). */
      anchors: () => Record<string, [number, number]>;
      /** Debug: render one frame synchronously (with or without post) and
       *  summarise its pixels — for environments whose rAF never fires. */
      renderOnce: (withPost: boolean) => PixelSummary;
      world: () => World;
      /** Debug: one pixel of the current default framebuffer, CSS px. */
      pixelAt: (x: number, y: number) => [number, number, number];
    };
  }
}

export class LatentFlightEngine {
  readonly world: World;
  readonly events: Emitter<LfEvents>;
  private readonly systems: LfSystem[];
  private acc = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private disposed = false;
  private frame = 0;
  private ro: ResizeObserver | null = null;
  private unsubQuality: () => void = () => {};
  private pixelRequest: ((s: PixelSummary) => void) | null = null;
  private pixelFocus: PixelFocus | null = null;

  constructor(opts: EngineOptions) {
    const { canvas, root, flags, reducedMotion, systems } = opts;
    const gpu = classifyRenderer();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: gpu === "ok" || gpu === "unknown",
      powerPreference: "high-performance",
      // Only a capture needs to read the buffer after the frame; everyone
      // else keeps the cheaper swap.
      preserveDrawingBuffer: flags.capture,
    });
    // ⚠ ONE COLOUR CONVENTION, AND THIS LINE IS WHAT ENFORCES IT. Every
    // painter on this site writes DISPLAY values from its shaders and the
    // canvas shows them as-is. three, however, converts the CLEAR colour and
    // every built-in material to `outputColorSpace` on the way to the screen
    // — and postprocessing's ClearPass reuses that converted value — so with
    // the default sRGB output the void cleared to (62,59,56) instead of
    // (10,9,8) in both the plain and the composed path (measured, headed).
    // A linear output space makes three's conversion the identity: the raw
    // token bytes in `scene/color.ts` are what reaches the screen.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(rawColor(VISTA.ground), 1);
    renderer.autoClear = true;

    const scene = new THREE.Scene();
    const aspect = Math.max(1e-3, root.clientWidth / Math.max(1, root.clientHeight));
    const camera = new THREE.PerspectiveCamera(flightFov(aspect), aspect, CAMERA_NEAR, CAMERA_FAR);

    this.events = new Emitter<LfEvents>();
    this.systems = systems;
    this.world = {
      renderer,
      scene,
      camera,
      size: { w: 0, h: 0, dpr: 1 },
      clock: createGameClock(reducedMotion ? 0 : 1),
      // Reduced motion never enters BOOT: the rest state IS the finished page.
      fsm: flags.boot && !reducedMotion ? "BOOT" : "VISTA",
      flags,
      reducedMotion,
      root,
      canvas,
      events: this.events,
      gpu,
      compose: null,
      post: null,
      anchors: new Map(),
    };

    resetLfStore();
    setLfState({ mode: "flight", fsm: this.world.fsm, ready: false, stamp: "" });

    // The quality governor: seed from the GPU probe, follow the DPR ceiling.
    useQualityStore.getState().probe();
    this.applyDpr(useQualityStore.getState().dprCeiling);
    this.unsubQuality = useQualityStore.subscribe((s, prev) => {
      if (s.dprCeiling !== prev.dprCeiling) this.applyDpr(s.dprCeiling);
    });

    this.resize();
    for (const s of this.systems) s.init?.(this.world);

    canvas.addEventListener("webglcontextlost", this.onLost, false);
    canvas.addEventListener("webglcontextrestored", this.onRestored, false);
    document.addEventListener("visibilitychange", this.onVisibility);
    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(root);
    } else {
      window.addEventListener("resize", this.onWindowResize);
    }

    if (flags.capture) {
      window.__latentFlight = {
        samplePixels: (focus) => this.samplePixels(focus),
        state: () => this.world.fsm,
        frame: () => this.frame,
        dispatch: (event) => this.dispatch(event),
        pulsar: () => pulsarRef.current,
        time: () => this.world.clock.t,
        anchors: () => this.projectAnchors(),
        renderOnce: (withPost) => {
          const w = this.world;
          for (const s of this.systems) s.render?.(0, w);
          if (withPost && w.compose) w.compose();
          else w.renderer.render(w.scene, w.camera);
          return this.readPixels(null);
        },
        world: () => this.world,
        pixelAt: (x, y) => {
          const w = this.world;
          w.renderer.setRenderTarget(null);
          const gl = w.renderer.getContext();
          const dpr = w.size.dpr || 1;
          const px = new Uint8Array(4);
          gl.readPixels(
            Math.round(x * dpr),
            gl.drawingBufferHeight - 1 - Math.round(y * dpr),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            px
          );
          return [px[0], px[1], px[2]];
        },
      };
    }
  }

  /* ── Lifecycle ─────────────────────────────────────────────────────── */

  start(): void {
    if (this.disposed || this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    resetFrameSampler();
    this.raf = requestAnimationFrame(this.tick);
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  resume(): void {
    if (this.disposed || this.running) return;
    this.running = true;
    // A resumed engine owes nothing for the time it was hidden.
    this.last = performance.now();
    this.acc = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pause();
    this.unsubQuality();
    this.ro?.disconnect();
    this.ro = null;
    window.removeEventListener("resize", this.onWindowResize);
    this.world.canvas.removeEventListener("webglcontextlost", this.onLost, false);
    this.world.canvas.removeEventListener("webglcontextrestored", this.onRestored, false);
    document.removeEventListener("visibilitychange", this.onVisibility);
    for (const s of this.systems) s.dispose?.(this.world);
    this.world.scene.clear();
    this.world.renderer.dispose();
    this.events.clear();
    delete this.world.root.dataset.lfFrame;
    if (this.world.flags.capture && window.__latentFlight) delete window.__latentFlight;
  }

  /* ── The frame ─────────────────────────────────────────────────────── */

  private tick = (now: number): void => {
    if (!this.running) return;
    const frameS = (now - this.last) / 1000;
    this.last = now;
    const w = this.world;
    try {
      advanceClock(w.clock, frameS);
      const r = stepLoop(this.acc, frameS, (dt) => {
        for (const s of this.systems) s.update?.(dt, w);
      });
      this.acc = r.acc;
      for (const s of this.systems) s.render?.(r.alpha, w);
      if (w.compose) w.compose();
      else w.renderer.render(w.scene, w.camera);
      if (this.pixelRequest) {
        const resolve = this.pixelRequest;
        const focus = this.pixelFocus;
        this.pixelRequest = null;
        this.pixelFocus = null;
        resolve(this.readPixels(focus));
      }
    } catch (err) {
      // A system that throws every frame would flood the console; pause
      // and say so once. The error boundary above the mount never sees a
      // frame error (it is outside React), so this log IS the report.
      this.running = false;
      console.error("[latent-flight] frame failed; engine paused", err);
      return;
    }
    this.frame += 1;
    w.root.dataset.lfFrame = String(this.frame);
    if (this.frame === 1) {
      setLfState({ ready: true });
      this.events.emit("ready", undefined);
    }
    reportFrameSample(frameS);
    this.raf = requestAnimationFrame(this.tick);
  };

  /* ── State ─────────────────────────────────────────────────────────── */

  dispatch(event: LfEvent): LfState {
    const from = this.world.fsm;
    const to = transition(from, event);
    if (to === from) return from;
    this.world.fsm = to;
    setLfState({ fsm: to });
    this.events.emit("state", { from, to });
    return to;
  }

  /* ── Size and quality ──────────────────────────────────────────────── */

  resize(): void {
    const w = this.world;
    const width = Math.max(1, w.root.clientWidth);
    const height = Math.max(1, w.root.clientHeight);
    w.size.w = width;
    w.size.h = height;
    w.renderer.setSize(width, height, false);
    const aspect = width / height;
    w.camera.aspect = aspect;
    w.camera.fov = flightFov(aspect);
    w.camera.updateProjectionMatrix();
    for (const s of this.systems) s.resize?.(w);
  }

  private applyDpr(ceiling: number): void {
    const tier = getDeviceTier(window.innerWidth);
    const dpr = Math.min(window.devicePixelRatio || 1, effectiveDprCeiling(tier, ceiling));
    this.world.size.dpr = dpr;
    this.world.renderer.setPixelRatio(dpr);
    if (this.world.size.w > 0) {
      this.world.renderer.setSize(this.world.size.w, this.world.size.h, false);
    }
  }

  /* ── Capture ───────────────────────────────────────────────────────── */

  /** Resolves with a summary of the NEXT rendered frame's pixels — read
   *  right after `renderer.render`, which is the only moment the buffer is
   *  guaranteed to hold the frame without `preserveDrawingBuffer`. */
  samplePixels(focus?: PixelFocus): Promise<PixelSummary> {
    return new Promise((resolve) => {
      this.pixelRequest = resolve;
      this.pixelFocus = focus ?? null;
      if (!this.running) this.resume();
    });
  }

  private projectAnchors(): Record<string, [number, number]> {
    const out: Record<string, [number, number]> = {};
    const v = new THREE.Vector3();
    const { camera, size } = this.world;
    camera.updateMatrixWorld();
    for (const [name, world] of this.world.anchors) {
      v.copy(world).project(camera);
      out[name] = [(v.x * 0.5 + 0.5) * size.w, (0.5 - v.y * 0.5) * size.h];
    }
    return out;
  }

  private readPixels(focus: PixelFocus | null): PixelSummary {
    // The default framebuffer, explicitly: a composer pass may leave one of
    // its own targets bound, and readPixels reads whatever is bound.
    this.world.renderer.setRenderTarget(null);
    const gl = this.world.renderer.getContext();
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const buf = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    const seen = new Uint8Array(256);
    let sum = 0;
    let max = 0;
    let gold = 0;
    let goldNear = 0;
    let goldAt: [number, number] | null = null;
    const dpr = this.world.size.dpr || 1;
    const fx = focus ? focus.x * dpr : 0;
    const fy = focus ? focus.y * dpr : 0;
    const fr2 = focus ? focus.r * dpr * (focus.r * dpr) : 0;
    for (let i = 0; i < buf.length; i += 4) {
      const r = buf[i];
      const g = buf[i + 1];
      const b = buf[i + 2];
      const l = (r * 299 + g * 587 + b * 114) / 1000;
      sum += l;
      if (l > max) max = l;
      seen[l | 0] = 1;
      // Gold-dominant: bright, warm, r > g > b with the token's own ratios.
      if (r > 120 && r > g * 1.08 && g > b * 1.4) {
        gold += 1;
        const px = (i / 4) % w;
        const py = h - 1 - (i / 4 - px) / w; // readPixels is bottom-up
        if (!goldAt) goldAt = [px / dpr, py / dpr];
        if (focus) {
          const dx = px - fx;
          const dy = py - fy;
          if (dx * dx + dy * dy <= fr2) goldNear += 1;
        }
      }
    }
    let distinct = 0;
    for (let i = 0; i < 256; i++) distinct += seen[i];
    const n = buf.length / 4;
    return { w, h, mean: n ? sum / n : 0, distinct, max, gold, goldAt, goldNear };
  }

  /* ── Listeners ─────────────────────────────────────────────────────── */

  private onLost = (e: Event): void => {
    e.preventDefault();
    this.pause();
    this.events.emit("gl-lost", undefined);
  };

  private onRestored = (): void => {
    this.events.emit("gl-epoch", undefined);
  };

  private onVisibility = (): void => {
    if (document.hidden) this.pause();
    else this.resume();
  };

  private onWindowResize = (): void => {
    this.resize();
  };
}
