import { STRINGS } from "@/lib/latent-flight/boot/bootTimeline";
import { WAYPOINTS, waypointIndex, type WaypointId } from "@/lib/latent-flight/content/waypoints";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * InputSystem — the reader's hands, scene 1 subset.
 *
 *   any key / pointerdown   skips the boot
 *   pointer move            LOOK — the reticle and a damped head offset,
 *                           inside a deadzone box of ±16 % of the viewport
 *   Tab / Shift+Tab         cycle the lock, only while the flight deck has
 *                           focus (the stage carries `tabindex`) — anywhere
 *                           else Tab stays the browser's
 *   1 … 7                   lock a waypoint by index
 *   Escape                  release the lock
 *   Space                   ENGAGE — the drive is offline in scene 1, so the
 *                           log says so and nothing moves
 *   click                   the route marks and the glass diamonds lock;
 *                           the key-row buttons do what they say
 *
 * Verbs are installed on `world.commands`; the HUD reads `world.target` and
 * never listens to the DOM itself. No pointer lock: the pointer stays a
 * pointer over every button, and Escape stays the hatch.
 */

const LOOK_DEADZONE_FRAC = 0.16;

export class InputSystem implements LfSystem {
  readonly name = "input";
  private w: World | null = null;
  private lf: HTMLElement | null = null;

  init(w: World): void {
    this.w = w;
    this.lf = w.root.closest<HTMLElement>(".lf");
    w.commands.lock = (id) => this.lock(id);
    w.commands.release = () => this.release();
    w.commands.cycle = (dir) => this.cycle(dir);
    w.commands.engage = () => this.engage();
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerdown", this.onPointerDown, true);
    this.lf?.addEventListener("click", this.onClick);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown, true);
    this.lf?.removeEventListener("click", this.onClick);
    this.w = null;
  }

  /* ── verbs ─────────────────────────────────────────────────────────── */

  private lock(id: WaypointId): void {
    const w = this.w;
    if (!w) return;
    if (w.fsm === "BOOT") w.commands.skipBoot();
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
    if (!w) return;
    const n = WAYPOINTS.length;
    const cur = w.target ? waypointIndex(w.target) : -1;
    // From nothing, Tab lands on the first waypoint AHEAD of the vessel.
    const start = cur < 0 ? (dir === 1 ? 0 : n) : cur;
    let next = (start + dir + n) % n;
    if (WAYPOINTS[next].id === w.ship.sector && n > 1) next = (next + dir + n) % n;
    this.lock(WAYPOINTS[next].id);
  }

  private engage(): void {
    const w = this.w;
    if (!w) return;
    if (w.fsm === "BOOT") w.commands.skipBoot();
    // Scene 1: the drive is not built yet. Say so in the instrument's voice.
    w.log.push(STRINGS.driveOffline);
  }

  /* ── listeners ─────────────────────────────────────────────────────── */

  private onKey = (e: KeyboardEvent): void => {
    const w = this.w;
    if (!w) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (w.fsm === "BOOT" && e.key !== "Shift") w.commands.skipBoot();
    const onDeck = document.activeElement === w.root;
    if (e.key === "Tab" && onDeck) {
      e.preventDefault();
      this.cycle(e.shiftKey ? -1 : 1);
      return;
    }
    if (e.key === "Escape") {
      this.release();
      return;
    }
    if (/^[1-7]$/.test(e.key) && !(e.target instanceof HTMLInputElement)) {
      this.lock(WAYPOINTS[Number(e.key) - 1].id);
      return;
    }
    if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      this.engage();
    }
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

  private onPointerDown = (): void => {
    const w = this.w;
    if (w && w.fsm === "BOOT") w.commands.skipBoot();
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
    else if (action === "engage") this.engage();
  };
}
