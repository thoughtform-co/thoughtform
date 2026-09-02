import { STRINGS } from "@/lib/latent-flight/boot/bootTimeline";
import { WAYPOINTS, waypointIndex, type WaypointId } from "@/lib/latent-flight/content/waypoints";
import { WAYPOINT_S, courseAt, headingOf, sectorAt, waypointS } from "@/lib/latent-flight/flight/course";
import {
  AUTOPILOT,
  SHIP_AT_REST,
  autopilotThrottle,
  integrateShip,
  type ShipState,
} from "@/lib/latent-flight/flight/flightModel";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * ShipSystem — the vessel on the course.
 *
 * Runs after input and before the camera. Integrates the flight model on
 * the fixed step from the commanded stick and throttle (or from the
 * autopilot when a course is engaged), writes the pose the camera and the
 * instruments read, and drives the FSM by MOTION: any way under way is
 * FLIGHT, an engaged course inside a station's approach band is APPROACH,
 * arriving at a station docks, arriving anywhere else holds. It also owns
 * the flight verbs: engage, hold, throttle, undock.
 *
 * Reduced motion: an engaged course is a CUT, not a flight — the vessel is
 * at the mark on the next step. Hand-flown motion still flies, because the
 * reader asked for it.
 */

/** Inside this much of the course the vessel is AT a waypoint. HOME's own
 *  marker sits 0.02 down the lead-out, so the station holds "at HOME". */
export const HOLD_RANGE = 0.025;

function nameOf(id: WaypointId): string {
  return WAYPOINTS[waypointIndex(id)].name.toUpperCase();
}

export class ShipSystem implements LfSystem {
  readonly name = "ship";
  private st: ShipState = { ...SHIP_AT_REST };
  private w: World | null = null;

  init(w: World): void {
    this.w = w;
    w.commands.engage = () => this.engage();
    w.commands.hold = () => this.hold();
    w.commands.throttleStep = (d) => this.throttleStep(d);
    w.commands.undock = () => this.undock();
    this.writePose(w, this.st);
  }

  dispose(): void {
    this.w = null;
  }

  update(dt: number, w: World): void {
    const prev = this.st;
    if (w.fsm === "BOOT" || w.fsm === "DOCK") {
      this.writePose(w, prev);
      return;
    }
    let cmd = w.input.throttle;
    const ap = w.ship.autopilot;
    if (ap) {
      const sT = waypointS(ap);
      if (w.reducedMotion) {
        this.st = { ...prev, s: sT, v: 0, throttle: 0, x: 0, y: 0 };
        this.arrive(w, ap, prev);
        return;
      }
      const a = autopilotThrottle(prev.s, sT);
      if (a === null) {
        this.st = { ...prev, s: sT, v: 0, throttle: 0 };
        this.arrive(w, ap, prev);
        return;
      }
      cmd = a;
      const r = sT - prev.s;
      if (WAYPOINTS[waypointIndex(ap)].dock && w.fsm === "FLIGHT" && r < AUTOPILOT.approachRange) {
        w.dispatch("approach-enter");
        w.log.push(STRINGS.approach(nameOf(ap), r.toFixed(2)));
      }
    }
    const next = integrateShip(
      prev,
      { throttleCmd: cmd, lateral: ap ? 0 : w.input.lateral, vertical: ap ? 0 : w.input.vertical },
      dt,
      w.course.length,
      { x: w.rail.halfX, y: w.rail.halfY }
    );
    this.st = next;

    // The FSM follows the motion.
    if (w.fsm === "VISTA" && (cmd > 0 || next.v > 0.05)) {
      w.dispatch("engage");
      if (!ap) w.log.push(STRINGS.underway);
    } else if ((w.fsm === "FLIGHT" || w.fsm === "APPROACH") && !ap && cmd === 0 && next.v < 0.02) {
      this.st = { ...next, v: 0 };
      w.dispatch("release");
      w.log.push(STRINGS.holdingIn(nameOf(sectorAt(next.s))));
    }
    this.writePose(w, prev);
  }

  /** The autopilot reached its mark. */
  private arrive(w: World, id: WaypointId, prev: ShipState): void {
    w.ship.autopilot = null;
    w.input.throttle = 0;
    if (w.target === id) w.target = null;
    this.writePose(w, prev);
    if (WAYPOINTS[waypointIndex(id)].dock) {
      if (w.fsm === "FLIGHT") w.dispatch("approach-enter");
      w.dispatch("dock");
      w.log.push(STRINGS.docked(nameOf(id)));
    } else {
      w.dispatch("release");
      w.log.push(STRINGS.onStation(nameOf(id)));
    }
  }

  /* ── verbs ─────────────────────────────────────────────────────────── */

  private engage(): void {
    const w = this.w;
    if (!w) return;
    if (w.fsm === "BOOT") w.commands.skipBoot();
    if (w.fsm === "DOCK") return;
    if (!w.target) {
      w.log.push(STRINGS.noLock);
      return;
    }
    const sT = waypointS(w.target);
    if (sT <= this.st.s + AUTOPILOT.arriveRange) {
      w.log.push(STRINGS.astern(nameOf(w.target)));
      return;
    }
    w.ship.autopilot = w.target;
    w.input.throttle = 0;
    w.input.lateral = 0;
    w.input.vertical = 0;
    w.log.push(STRINGS.engaged(nameOf(w.target)));
  }

  private hold(): void {
    const w = this.w;
    if (!w || w.fsm === "DOCK") return;
    if (w.fsm === "BOOT") w.commands.skipBoot();
    const wasMoving = w.ship.autopilot !== null || w.input.throttle > 0;
    w.ship.autopilot = null;
    w.input.throttle = 0;
    if (w.fsm === "APPROACH") w.dispatch("approach-leave");
    if (wasMoving) w.log.push(STRINGS.hold);
  }

  private throttleStep(delta: number): void {
    const w = this.w;
    if (!w || w.fsm === "DOCK") return;
    if (w.fsm === "BOOT") w.commands.skipBoot();
    // A hand on the throttle overrides the autopilot.
    if (w.ship.autopilot) {
      w.ship.autopilot = null;
      w.input.throttle = this.st.throttle;
      if (w.fsm === "APPROACH") w.dispatch("approach-leave");
    }
    const next = Math.round((w.input.throttle + delta) * 8) / 8;
    w.input.throttle = Math.max(0, Math.min(1, next));
  }

  private undock(): void {
    const w = this.w;
    if (!w || w.fsm !== "DOCK") return;
    w.dispatch("undock");
    w.dispatch("release");
    w.log.push(STRINGS.undocked);
  }

  /* ── the pose ──────────────────────────────────────────────────────── */

  private writePose(w: World, prev: ShipState): void {
    const st = this.st;
    const pose = courseAt(w.course, st.s);
    const p = pose.p;
    const n = pose.n;
    const b = pose.b;
    const sh = w.ship;
    sh.position = [
      p[0] + n[0] * st.x + b[0] * st.y,
      p[1] + n[1] * st.x + b[1] * st.y,
      p[2] + n[2] * st.x + b[2] * st.y,
    ];
    sh.heading = headingOf(pose.t);
    sh.throttle = st.throttle;
    sh.s = st.s;
    sh.v = st.v;
    sh.x = st.x;
    sh.y = st.y;
    sh.sPrev = prev.s;
    sh.xPrev = prev.x;
    sh.yPrev = prev.y;
    sh.sector = sectorAt(st.s);
    let at: WaypointId | null = null;
    for (let i = 0; i < WAYPOINT_S.length; i++) {
      if (Math.abs(WAYPOINT_S[i] - st.s) <= HOLD_RANGE) at = WAYPOINTS[i].id;
    }
    sh.at = at;
  }
}
