import * as THREE from "three";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import {
  Announcer,
  lockSentence,
  releaseSentence,
  stateSentence,
} from "@/lib/latent-flight/a11y/announce";
import { BOOT_COMMS, STRINGS } from "@/lib/latent-flight/boot/bootTimeline";
import {
  WAYPOINTS,
  bearingTo,
  formatBearing,
  formatRange,
  rangeTo,
  sectorLabel,
  waypointIndex,
  type WaypointId,
} from "@/lib/latent-flight/content/waypoints";
import { STATE_WORD, type LfState } from "@/lib/latent-flight/engine/gameState";
import { setLfState } from "@/lib/latent-flight/engine/store";
import {
  MARK_SIZE_PX,
  clampToFrame,
  ndcToScreen,
  quartile,
  type FrameRect,
} from "@/lib/latent-flight/hud/anchorMath";
import { PULSAR } from "@/lib/latent-flight/pulsar";
import { pulsarRef } from "@/lib/latent-flight/pulsarRef";

import { STAR_EXTENT, STAR_SCALE } from "../scene/NeutronStar";
import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * HudSystem — everything the reader reads, written from the frame.
 *
 * Runs after the camera has settled and before post: projects every anchor
 * (the seven waypoints, the beacon, the lock) into CSS px and writes ONE
 * transform per anchor that moved, drives the boot's power-on from the cue
 * table, decodes text with the site's own scramble kernel, keeps the two
 * meters and the three rail readouts current, and speaks to the live
 * region on discrete events only. No layout reads in the loop: the frame
 * rectangle is measured on resize and every mark is transform-positioned.
 *
 * DOM draws what you read; WebGL draws what you fly through.
 */

const TAPE_PX_PER_DEG = 7;
const TAPE_WINDOW_DEG = 40;
const LOOK_DEADZONE_FRAC = 0.16;
const LOOK_TAU_S = 0.12;
const SIG_DECAY_S = PULSAR.periodS / 8;
const COMMS_HOLD_S = 2.4;
const COMMS_GAP_S = 0.5;

interface Mark {
  id: WaypointId;
  el: HTMLElement;
  world: THREE.Vector3;
  x: number;
  y: number;
  size: number;
  shown: boolean;
  edge: string | null;
  q: number;
  flip: boolean;
  state: string;
  opacity: number;
}

interface Seat {
  el: HTMLElement;
  v: HTMLElement;
  last: string;
}

/** "Moved by more than a quarter pixel" — true from a NaN seed, so the first
 *  write always happens. `NaN > x` is false, which is how a mark could stay
 *  unplaced forever. */
function moved(a: number, b: number): boolean {
  return !(Math.abs(a - b) <= 0.25);
}

function must<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`[latent-flight] HUD handle missing: ${selector}`);
  return el;
}

export class HudSystem implements LfSystem {
  readonly name = "hud";
  private lf!: HTMLElement;
  private hud!: HTMLElement;
  private h: Record<string, HTMLElement> = {};
  private marks: Mark[] = [];
  private markByld = new Map<WaypointId, Mark>();
  private routeMarks = new Map<WaypointId, HTMLElement>();
  private legs: SVGPathElement[] = [];
  private legD: string[] = [];
  private legOpacity: number[] = [];
  private seats: Seat[] = [];
  private tapeTicks: { el: HTMLElement; deg: number; shown: boolean }[] = [];
  private tapeLabels: { el: HTMLElement; deg: number; shown: boolean }[] = [];
  private thrSegs: HTMLElement[] = [];
  private sigSegs: HTMLElement[] = [];
  private frame: FrameRect = { left: 0, top: 0, right: 1, bottom: 1 };
  private jobs: ScrambleJob[] = [];
  private announcer = new Announcer();
  private v = new THREE.Vector3();
  private look = { x: 0, y: 0 };
  private lookPx = { x: Number.NaN, y: Number.NaN };
  private opacity = new Map<HTMLElement, number>();
  private text = new Map<HTMLElement, string>();
  private powered = false;
  private beaconTagged = false;
  private lastFsm: LfState | null = null;
  private lastTarget: WaypointId | null = null;
  private convergeFrames = 0;
  private prevCross = 0;
  private lastPulseT = Number.NEGATIVE_INFINITY;
  private thr = -1;
  private sig = -1;
  private commsQueue: { at: number; text: string }[] = [];
  private commsUntil = 0;
  private commsShown = "";
  private beaconBox = 0;
  private targetBox = 0;
  private depth: HTMLElement | null = null;

  /* ── init ──────────────────────────────────────────────────────────── */

  init(w: World): void {
    const lf = w.root.closest<HTMLElement>(".lf");
    if (!lf) throw new Error("[latent-flight] the stage is not inside .lf");
    this.lf = lf;
    this.hud = must<HTMLElement>(lf, '[data-lf="hud"]');
    for (const el of Array.from(this.hud.querySelectorAll<HTMLElement>("[data-lf]"))) {
      this.h[el.dataset.lf as string] = el;
    }

    // The seven marks and their route twins.
    for (const wp of WAYPOINTS) {
      const el = must<HTMLElement>(this.hud, `[data-lf-wp="${wp.id}"]`);
      const mark: Mark = {
        id: wp.id,
        el,
        world: new THREE.Vector3(wp.position[0], wp.position[1], wp.position[2]),
        x: Number.NaN,
        y: Number.NaN,
        size: 12,
        shown: false,
        edge: null,
        q: -1,
        flip: false,
        state: "",
        opacity: -1,
      };
      this.marks.push(mark);
      this.markByld.set(wp.id, mark);
      this.routeMarks.set(wp.id, must<HTMLElement>(this.hud, `[data-lf-route="${wp.id}"]`));
      w.anchors.set(`wp:${wp.id}`, mark.world);
    }
    this.legs = Array.from(this.hud.querySelectorAll<SVGPathElement>("[data-lf-leg]"));
    this.legD = this.legs.map(() => "");
    this.legOpacity = this.legs.map(() => -1);

    // The right rail's three seats — inside the rail box so the percentage
    // tops land on the ladder's own rungs.
    const rail = lf.querySelector<HTMLElement>(".hud__rail--r");
    if (rail) {
      const host = document.createElement("div");
      host.className = "lf-tele-host";
      const keys = [STRINGS.keys.bearing, STRINGS.keys.sector, STRINGS.keys.local];
      const tops = ["16.667%", "50%", "91.667%"];
      keys.forEach((k, i) => {
        const el = document.createElement("span");
        el.className = "lf-tele";
        el.style.top = tops[i];
        el.setAttribute("aria-hidden", "true");
        const kEl = document.createElement("b");
        kEl.className = "lf-tele__k";
        kEl.textContent = k;
        const rule = document.createElement("i");
        rule.className = "lf-tele__rule";
        const vEl = document.createElement("b");
        vEl.className = "lf-tele__v";
        vEl.textContent = "";
        el.append(kEl, rule, vEl);
        host.appendChild(el);
        this.seats.push({ el, v: vEl, last: "" });
      });
      rail.appendChild(host);
    }
    this.depth = lf.querySelector<HTMLElement>(".hud__depth");

    // The tape's ticks and labels, by degree, for the centre-out reveal.
    for (const seat of Array.from(this.hud.querySelectorAll<HTMLElement>(".lf-tape__seat"))) {
      const deg = Number(seat.dataset.deg);
      const tick = seat.querySelector<HTMLElement>(".lf-tape__tick");
      const label = seat.querySelector<HTMLElement>(".lf-tape__label");
      if (tick) this.tapeTicks.push({ el: tick, deg, shown: false });
      if (label) this.tapeLabels.push({ el: label, deg, shown: false });
    }
    this.thrSegs = Array.from(this.h.thr.querySelectorAll<HTMLElement>(".lf-meter__segs i"));
    this.sigSegs = Array.from(this.h.sig.querySelectorAll<HTMLElement>(".lf-meter__segs i"));

    this.commsQueue = w.fsm === "BOOT" ? BOOT_COMMS.map((c) => ({ ...c })) : [];
    if (w.fsm !== "BOOT") this.commsUntil = 0;

    this.resize(w);
    this.setText(this.h["beacon-v1"], STRINGS.beacon.value1);
    this.setText(this.h["beacon-v2"], STRINGS.beacon.value2);
  }

  resize(w: World): void {
    if (!this.lf) return;
    // The frame the edge markers pin to: the two tracks and the rail's own
    // top and bottom. Measured here, never in the loop.
    const l = this.lf.querySelector<HTMLElement>(".hud__rail--l");
    const r = this.lf.querySelector<HTMLElement>(".hud__rail--r");
    if (l && r) {
      const lb = l.getBoundingClientRect();
      const rb = r.getBoundingClientRect();
      this.frame = { left: lb.left + 24, top: lb.top + 12, right: rb.right - 24, bottom: lb.bottom - 12 };
    } else {
      this.frame = { left: 48, top: 48, right: w.size.w - 48, bottom: w.size.h - 48 };
    }
    this.lookPx = { x: Number.NaN, y: Number.NaN };
  }

  /* ── update: damping only ──────────────────────────────────────────── */

  update(dt: number, w: World): void {
    const k = w.reducedMotion ? 1 : 1 - Math.exp(-dt / LOOK_TAU_S);
    this.look.x += (w.look.x - this.look.x) * k;
    this.look.y += (w.look.y - this.look.y) * k;
  }

  /* ── render ────────────────────────────────────────────────────────── */

  render(_alpha: number, w: World): void {
    const b = w.boot;
    const t = w.clock.t;
    const { w: W, h: H } = w.size;
    const cam = w.camera;
    cam.updateMatrixWorld();

    /* power-on edges ---------------------------------------------------- */
    if (!this.powered && b["hud-power"] >= 1) this.powerOn(w, t);
    if (!this.beaconTagged && b["beacon-tag"] >= 1) {
      this.beaconTagged = true;
      this.queue(this.h["beacon-v1"], STRINGS.beacon.value1, t);
      this.queue(this.h["beacon-v2"], STRINGS.beacon.value2, t);
    }
    if (w.fsm !== this.lastFsm) {
      this.lastFsm = w.fsm;
      if (this.powered) this.queue(this.h["state-word"], STATE_WORD[w.fsm], t);
      if (w.fsm !== "BOOT") this.announcer.say(stateSentence(STATE_WORD[w.fsm], sectorLabel(w.ship.sector)));
    }

    /* boot-driven visibility ------------------------------------------- */
    this.fade(this.h.tape, b["tape-light"] > 0 ? 1 : 0);
    const tapeP = b["tape-light"];
    for (const tk of this.tapeTicks) {
      const show = tapeP >= Math.abs(tk.deg) / 60;
      if (show !== tk.shown) {
        tk.shown = show;
        tk.el.style.opacity = show ? "1" : "0";
      }
    }
    for (const lb of this.tapeLabels) {
      const show = tapeP >= Math.abs(lb.deg) / 60;
      if (show !== lb.shown) {
        lb.shown = show;
        lb.el.style.opacity = show ? "1" : "0";
      }
    }
    for (const el of this.routeMarks.values()) this.fade(el, b["hud-power"]);
    this.fade(this.h.state, b["hud-power"]);
    for (const s of this.seats) this.fade(s.el, b["hud-power"]);
    if (this.depth) this.fade(this.depth, b["course-mark"]);
    const arm = b["reticle-arm"];
    this.fade(this.h.look, arm > 0 ? 1 : 0);
    this.fade(this.h.reticle.querySelector<HTMLElement>(".lf-reticle__boresight")!, arm);
    this.fade(this.h.thr, b["meters-selftest"] > 0 ? 1 : 0);
    this.fade(this.h.sig, b["meters-selftest"] > 0 ? 1 : 0);
    this.fade(this.h.beacon, b["beacon-tag"]);
    this.fade(this.h.keys, b["key-row"]);
    if (b["beacon-tag"] > 0) this.h.beacon.hidden = false;

    /* the reticle's look ----------------------------------------------- */
    const lx = this.look.x * LOOK_DEADZONE_FRAC * W;
    const ly = this.look.y * LOOK_DEADZONE_FRAC * H;
    const scale = 1.6 - 0.6 * arm;
    if (moved(lx, this.lookPx.x) || moved(ly, this.lookPx.y) || arm < 1) {
      this.lookPx = { x: lx, y: ly };
      this.h.look.style.transform = `translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
    }

    /* the marks ---------------------------------------------------------- */
    const ship = w.ship.position;
    const wpP = b["waypoints"];
    for (let i = 0; i < this.marks.length; i++) {
      const m = this.marks[i];
      const wp = WAYPOINTS[i];
      this.v.copy(m.world).project(cam);
      const behind = this.v.z > 1;
      const [sx, sy] = ndcToScreen(this.v.x, this.v.y, W, H);
      const pin = clampToFrame(sx, sy, behind, this.frame);
      const range = rangeTo(ship, wp);
      const q = quartile(range);
      const size = pin.edge ? 8 : MARK_SIZE_PX[q];
      const state = w.ship.sector === wp.id ? "here" : w.target === wp.id ? "locked" : "ahead";
      const flip = pin.x > W * 0.66;
      if (q !== m.q) {
        m.q = q;
        m.el.dataset.q = String(q);
      }
      if (state !== m.state) {
        m.state = state;
        m.el.dataset.state = state;
        const route = this.routeMarks.get(wp.id);
        if (route) {
          route.dataset.state = state === "locked" ? "ahead" : state;
          if (state === "locked") route.setAttribute("aria-pressed", "true");
          else route.removeAttribute("aria-pressed");
        }
      }
      if (flip !== m.flip) {
        m.flip = flip;
        if (flip) m.el.dataset.flip = "1";
        else delete m.el.dataset.flip;
      }
      if (pin.edge !== m.edge) {
        m.edge = pin.edge;
        if (pin.edge) m.el.dataset.edge = pin.edge;
        else delete m.el.dataset.edge;
      }
      if (size !== m.size) {
        m.size = size;
        m.el.style.setProperty("--lf-mark", `${size}px`);
      }
      const x = pin.x - size / 2;
      const y = pin.y - size / 2;
      if (moved(x, m.x) || moved(y, m.y)) {
        m.x = x;
        m.y = y;
        m.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      }
      // Stagger in route order over the cue, 60 ms apart.
      const stagger = Math.max(0, Math.min(1, (wpP * 7 - i) * 1.5));
      if (stagger !== m.opacity) {
        m.opacity = stagger;
        m.el.style.opacity = stagger.toFixed(3);
        if (stagger > 0 && m.el.hidden) m.el.hidden = false;
      }
      // Remember the centre for the legs.
      m.el.dataset.cx = pin.x.toFixed(1);
      m.el.dataset.cy = pin.y.toFixed(1);
    }

    /* the course legs ---------------------------------------------------- */
    for (let i = 0; i < this.legs.length; i++) {
      const a = this.marks[i];
      const c = this.marks[i + 1];
      if (!Number.isFinite(a.x) || !Number.isFinite(c.x)) continue;
      const d = `M${(a.x + a.size / 2).toFixed(1)},${(a.y + a.size / 2).toFixed(1)}L${(c.x + c.size / 2).toFixed(1)},${(c.y + c.size / 2).toFixed(1)}`;
      if (d !== this.legD[i]) {
        this.legD[i] = d;
        this.legs[i].setAttribute("d", d);
      }
      const op = Math.min(a.opacity, c.opacity);
      if (op !== this.legOpacity[i]) {
        this.legOpacity[i] = op;
        this.legs[i].style.opacity = op.toFixed(3);
      }
      const locked = w.target !== null && waypointIndex(w.target) === i + 1;
      if ((this.legs[i].dataset.locked === "1") !== locked) {
        if (locked) this.legs[i].dataset.locked = "1";
        else delete this.legs[i].dataset.locked;
      }
    }

    /* the beacon --------------------------------------------------------- */
    const star = w.anchors.get("star");
    if (star) {
      this.v.copy(star).project(cam);
      const [sx, sy] = ndcToScreen(this.v.x, this.v.y, W, H);
      const dist = star.distanceTo(cam.position);
      const pxPerUnit = H / 2 / (Math.tan((cam.fov * Math.PI) / 360) * dist);
      const box = Math.round(2 * STAR_EXTENT * STAR_SCALE * pxPerUnit + 12);
      if (box !== this.beaconBox) {
        this.beaconBox = box;
        this.h.beacon.style.setProperty("--lf-box", `${box}px`);
      }
      const flip = sx > W * 0.66;
      if ((this.h.beacon.dataset.flip === "1") !== flip) {
        if (flip) this.h.beacon.dataset.flip = "1";
        else delete this.h.beacon.dataset.flip;
      }
      this.h.beacon.style.transform = `translate3d(${(sx - box / 2).toFixed(1)}px,${(sy - box / 2).toFixed(1)}px,0)`;
    }

    /* the lock ----------------------------------------------------------- */
    if (w.target !== this.lastTarget) {
      const prev = this.lastTarget;
      this.lastTarget = w.target;
      if (w.target) {
        const wp = WAYPOINTS[waypointIndex(w.target)];
        const range = formatRange(rangeTo(ship, wp));
        this.h.target.hidden = false;
        this.h["target-box"].style.setProperty("--lf-conv", "1.6");
        this.convergeFrames = 2;
        this.setText(this.h["target-v2"], range);
        this.queue(this.h["target-v1"], wp.name.toUpperCase(), t);
        this.say(STRINGS.lock(wp.name.toUpperCase(), range), t);
        this.announcer.say(lockSentence(wp.name, range));
      } else {
        this.h.target.hidden = true;
        this.h["tape-target"].hidden = true;
        if (prev) {
          this.say(STRINGS.released, t);
          this.announcer.say(releaseSentence());
        }
      }
    }
    if (this.convergeFrames > 0 && --this.convergeFrames === 0) {
      this.h["target-box"].style.setProperty("--lf-conv", "1");
    }
    if (w.target) {
      const m = this.markByld.get(w.target)!;
      const box = m.size + 16;
      if (box !== this.targetBox) {
        this.targetBox = box;
        this.h.target.style.setProperty("--lf-box", `${box}px`);
      }
      const cx = m.x + m.size / 2;
      const cy = m.y + m.size / 2;
      this.h.target.style.transform = `translate3d(${(cx - box / 2).toFixed(1)}px,${(cy - box / 2).toFixed(1)}px,0)`;
      if ((this.h.target.dataset.flip === "1") !== m.flip) {
        if (m.flip) this.h.target.dataset.flip = "1";
        else delete this.h.target.dataset.flip;
      }
      // The target's bearing on the tape.
      const wp = WAYPOINTS[waypointIndex(w.target)];
      let off = bearingTo(ship, wp.position) - w.ship.heading;
      off = ((off + 540) % 360) - 180;
      const onTape = Math.abs(off) <= TAPE_WINDOW_DEG;
      this.h["tape-target"].hidden = !onTape;
      if (onTape) this.h["tape-target"].style.left = `calc(50% + ${(off * TAPE_PX_PER_DEG).toFixed(1)}px)`;
    }

    /* the meters --------------------------------------------------------- */
    const selfTest = b["meters-selftest"];
    const thrActual = Math.round(w.ship.throttle * 8);
    let thr = thrActual;
    let sig: number;
    const cross = pulsarRef.current.crossing;
    if (cross > 0.5 && this.prevCross <= 0.5) this.lastPulseT = t;
    this.prevCross = cross;
    const since = t - this.lastPulseT;
    const sigActual = Number.isFinite(since) ? Math.max(0, Math.min(8, 8 - Math.floor(since / SIG_DECAY_S))) : 0;
    sig = sigActual;
    if (selfTest > 0 && selfTest < 1) {
      const p = selfTest;
      const sweep = p < 0.5 ? Math.round((p / 0.5) * 8) : Math.round(8 - ((p - 0.5) / 0.5) * 8);
      thr = Math.max(thrActual, sweep);
      sig = Math.max(sigActual, sweep);
    }
    this.fill(this.thrSegs, thr, "thr");
    this.fill(this.sigSegs, sig, "sig");

    /* the rail readouts and the tape ------------------------------------- */
    if (this.powered) {
      this.seat(0, formatBearing(w.ship.heading));
      this.seat(1, sectorLabel(w.ship.sector));
      this.seat(2, w.ship.s.toFixed(2));
      const strip = this.h["tape-strip"];
      const tx = `translate3d(${(-w.ship.heading * TAPE_PX_PER_DEG).toFixed(1)}px,0,0)`;
      if (strip.style.transform !== tx) strip.style.transform = tx;
      this.setText(this.h.heading, formatBearing(w.ship.heading));
      if (this.depth) {
        const top = `${(w.ship.s * 100).toFixed(2)}%`;
        if (this.depth.style.top !== top) this.depth.style.top = top;
      }
    }

    /* the log ------------------------------------------------------------ */
    this.comms(w, t);

    /* decodes and the live region ---------------------------------------- */
    advanceScrambles(this.jobs, t);
    const sentence = this.announcer.tick(t);
    if (sentence !== null) {
      this.h.live.textContent = sentence;
      setLfState({ status: sentence });
    }
  }

  /* ── helpers ───────────────────────────────────────────────────────── */

  private powerOn(w: World, t: number): void {
    this.powered = true;
    const instant = w.fsm !== "BOOT";
    const write = (el: HTMLElement | undefined, text: string) => {
      if (!el) return;
      if (instant) this.setText(el, text);
      else this.queue(el, text, t);
    };
    write(this.seats[0]?.v, formatBearing(w.ship.heading));
    write(this.seats[1]?.v, sectorLabel(w.ship.sector));
    write(this.seats[2]?.v, w.ship.s.toFixed(2));
    for (const s of this.seats) s.last = s.v.textContent ?? "";
    write(this.h["state-word"], STATE_WORD[w.fsm]);
    write(this.h["state-name"], WAYPOINTS[waypointIndex(w.ship.sector)].name.toUpperCase());
    this.setText(this.h.heading, formatBearing(w.ship.heading));
  }

  private seat(i: number, value: string): void {
    const s = this.seats[i];
    if (!s || s.last === value) return;
    if (this.jobs.some((j) => j.el === s.v)) return;
    s.last = value;
    s.v.textContent = value;
  }

  private queue(el: HTMLElement | undefined, text: string, t: number): void {
    if (!el) return;
    queueScramble(this.jobs, el, text, t);
    this.text.set(el, text);
  }

  private setText(el: HTMLElement | undefined, text: string): void {
    if (!el) return;
    if (this.text.get(el) === text) return;
    this.text.set(el, text);
    el.textContent = text;
  }

  private fade(el: HTMLElement | undefined, opacity: number): void {
    if (!el) return;
    const o = Math.round(opacity * 1000) / 1000;
    if (this.opacity.get(el) === o) return;
    this.opacity.set(el, o);
    el.style.opacity = String(o);
  }

  private fill(segs: HTMLElement[], n: number, which: "thr" | "sig"): void {
    const cur = which === "thr" ? this.thr : this.sig;
    if (cur === n) return;
    if (which === "thr") this.thr = n;
    else this.sig = n;
    segs.forEach((el, i) => {
      const on = i < n;
      if ((el.dataset.on === "1") !== on) {
        if (on) el.dataset.on = "1";
        else delete el.dataset.on;
      }
    });
  }

  /** Push a line to the front of the log: it decodes now and holds. */
  private say(text: string, t: number): void {
    this.commsQueue = this.commsQueue.filter((c) => c.at > t + COMMS_HOLD_S);
    this.show(text, t);
  }

  private show(text: string, t: number): void {
    if (text === this.commsShown) return;
    this.commsShown = text;
    this.queue(this.h.comms, text, t);
    this.commsUntil = t + COMMS_HOLD_S;
  }

  private comms(w: World, t: number): void {
    // Lines pushed by other systems take the front.
    while (w.log.length) this.say(w.log.shift()!, t);
    const next = this.commsQueue[0];
    if (next && t >= next.at) {
      this.commsQueue.shift();
      this.show(next.text, t);
      return;
    }
    if (this.commsShown !== STRINGS.idle && t >= this.commsUntil + COMMS_GAP_S && !next) {
      // Nothing scheduled and the last line has held: rest on the idle string.
      const armed = w.fsm !== "BOOT" && w.boot["key-row"] >= 1;
      if (armed) this.show(STRINGS.idle, t);
    }
  }

  dispose(w: World): void {
    this.jobs.length = 0;
    this.lf.querySelector(".lf-tele-host")?.remove();
    for (const wp of WAYPOINTS) w.anchors.delete(`wp:${wp.id}`);
  }
}
