import { WAYPOINTS, waypointIndex, type WaypointId } from "@/lib/latent-flight/content/waypoints";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * InputSystem — the reader's hands.
 *
 *   any key / pointerdown   skips the boot
 *   pointer move            LOOK — the reticle and a damped head offset,
 *                           inside a deadzone box of ±16 % of the viewport
 *   W / S, wheel            throttle up / down, one eighth at a time
 *   A / D, ← / →            the stick across (held)
 *   ↑ / ↓                   the stick up / down (held)
 *   H                       hold — throttle to zero, autopilot off
 *   Space                   ENGAGE — fly the engaged course to the lock
 *   Tab / Shift+Tab         cycle the lock, only while the flight deck has
 *                           focus (the stage carries `tabindex`) — anywhere
 *                           else Tab stays the browser's
 *   1 … 7                   lock a waypoint by index
 *   Escape                  one step back: undock → cancel the course →
 *                           release the lock
 *   click                   the route marks and the glass diamonds lock;
 *                           the key-row buttons do what they say
 *
 * Verbs are installed on `world.commands` by the system that owns them (the
 * ship owns engage / hold / throttle / undock; this one owns the lock); the
 * HUD reads `world.target` and never listens to the DOM itself. While the
 * vessel is DOCKED the flight keys are inert and Escape undocks. No pointer
 * lock: the pointer stays a pointer over every button, and Escape stays the
 * hatch.
 */

const LOOK_DEADZONE_FRAC = 0.16;
const THROTTLE_STEP = 1 / 8;

export class InputSystem implements LfSystem {
  readonly name = "input";
  private w: World | null = null;
  private lf: HTMLElement | null = null;
  private held = new Set<string>();

  init(w: World): void {
    this.w = w;
    this.lf = w.root.closest<HTMLElement>(".lf");
    w.commands.lock = (id) => this.lock(id);
    w.commands.release = () => this.release();
    w.commands.cycle = (dir) => this.cycle(dir);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerdown", this.onPointerDown, true);
    this.lf?.addEventListener("click", this.onClick);
    this.lf?.addEventListener("wheel", this.onWheel, { passive: false });
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown, true);
    this.lf?.removeEventListener("click", this.onClick);
    this.lf?.removeEventListener("wheel", this.onWheel);
    this.held.clear();
    this.w = null;
  }

  update(_dt: number, w: World): void {
    // The stick is whatever is held right now; the ship integrates it.
    if (w.fsm === "DOCK") {
      w.input.lateral = 0;
      w.input.vertical = 0;
      return;
    }
    const h = this.held;
    const right = h.has("d") || h.has("arrowright");
    const left = h.has("a") || h.has("arrowleft");
    const up = h.has("arrowup");
    const down = h.has("arrowdown");
    w.input.lateral = (right ? 1 : 0) - (left ? 1 : 0);
    w.input.vertical = (up ? 1 : 0) - (down ? 1 : 0);
  }

  /* ── verbs ─────────────────────────────────────────────────────────── */

  private lock(id: WaypointId): void {
    const w = this.w;
    if (!w) return;
    if (w.fsm === "BOOT") w.commands.skipBoot();
    if (w.fsm === "DOCK") return;
    if (w.target === id) return;
    w.target = id;
  }

  private release(): void {
    const w = this.w;
    if (!w || w.target === null) return;
    w.target = null;
  }

  private cycle(dir: 1 | -1): void {
    const w = this.w;
    if (!w || w.fsm === "DOCK") return;
    const n = WAYPOINTS.length;
    const cur = w.target ? waypointIndex(w.target) : -1;
    // From nothing, Tab lands on the first waypoint AHEAD of the vessel.
    const start = cur < 0 ? (dir === 1 ? 0 : n) : cur;
    let next = (start + dir + n) % n;
    if (WAYPOINTS[next].id === w.ship.at && n > 1) next = (next + dir + n) % n;
    this.lock(WAYPOINTS[next].id);
  }

  /** Escape is one step back. */
  private back(): void {
    const w = this.w;
    if (!w) return;
    if (w.fsm === "DOCK") {
      w.commands.undock();
      return;
    }
    if (w.ship.autopilot) {
      w.commands.hold();
      return;
    }
    this.release();
  }

  /* ── listeners ─────────────────────────────────────────────────────── */

  private onKey = (e: KeyboardEvent): void => {
    const w = this.w;
    if (!w) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (w.fsm === "BOOT" && e.key !== "Shift") w.commands.skipBoot();
    const key = e.key.toLowerCase();
    const onDeck = document.activeElement === w.root;
    const onButton = e.target instanceof HTMLButtonElement;
    if (e.key === "Tab" && onDeck) {
      e.preventDefault();
      this.cycle(e.shiftKey ? -1 : 1);
      return;
    }
    if (e.key === "Escape") {
      this.back();
      return;
    }
    if (w.fsm === "DOCK") return;
    if (/^[1-7]$/.test(e.key) && !(e.target instanceof HTMLInputElement)) {
      this.lock(WAYPOINTS[Number(e.key) - 1].id);
      return;
    }
    if (e.key === " " && !onButton) {
      e.preventDefault();
      w.commands.engage();
      return;
    }
    if (key === "w" && !e.repeat) {
      w.commands.throttleStep(THROTTLE_STEP);
      return;
    }
    if (key === "s" && !e.repeat) {
      w.commands.throttleStep(-THROTTLE_STEP);
      return;
    }
    if (key === "h" && !e.repeat) {
      w.commands.hold();
      return;
    }
    if (key === "a" || key === "d" || key.startsWith("arrow")) {
      if (key.startsWith("arrow")) e.preventDefault();
      this.held.add(key);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.held.delete(e.key.toLowerCase());
  };

  private onBlur = (): void => {
    this.held.clear();
  };

  private onWheel = (e: WheelEvent): void => {
    const w = this.w;
    if (!w) return;
    // The page does not scroll; the wheel is the throttle. Over a button
    // it stays the browser's.
    if ((e.target as HTMLElement | null)?.closest("button, a, [data-lf='dock']")) return;
    e.preventDefault();
    if (w.fsm === "DOCK") return;
    if (e.deltaY === 0) return;
    w.commands.throttleStep(e.deltaY < 0 ? THROTTLE_STEP : -THROTTLE_STEP);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const w = this.w;
    if (!w) return;
    const cx = w.size.w / 2;
    const cy = w.size.h / 2;
    const dx = (e.clientX - cx) / (LOOK_DEADZONE_FRAC * w.size.w);
    const dy = (e.clientY - cy) / (LOOK_DEADZONE_FRAC * w.size.h);
    w.look.x = Math.max(-1, Math.min(1, dx));
    w.look.y = Math.max(-1, Math.min(1, dy));
  };

  private onPointerDown = (e: PointerEvent): void => {
    const w = this.w;
    if (!w) return;
    if (w.fsm === "BOOT") w.commands.skipBoot();
    // A press on the world gives the deck focus, so Tab cycles the lock.
    const t = e.target as HTMLElement | null;
    if (t && !t.closest("button, a, [data-lf='dock']") && w.fsm !== "DOCK") {
      w.root.focus({ preventScroll: true });
    }
  };

  private onClick = (e: Event): void => {
    const w = this.w;
    const t = e.target as HTMLElement | null;
    if (!w || !t) return;
    const route = t.closest<HTMLElement>("[data-lf-route]");
    if (route) {
      this.lock(route.dataset.lfRoute as WaypointId);
      return;
    }
    const wp = t.closest<HTMLElement>("[data-lf-wp]");
    if (wp) {
      this.lock(wp.dataset.lfWp as WaypointId);
      return;
    }
    const action = t.closest<HTMLElement>("[data-lf-action]")?.dataset.lfAction;
    if (action === "next") this.cycle(1);
    else if (action === "engage") w.commands.engage();
    else if (action === "hold") w.commands.hold();
    else if (action === "undock") w.commands.undock();
  };
}
