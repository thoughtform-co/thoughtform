import * as THREE from "three";

import { courseAt } from "@/lib/latent-flight/flight/course";
import { SHIP } from "@/lib/latent-flight/flight/flightModel";
import {
  GLASS_DEPTH,
  TICKS,
  buildLattice,
  latticeExtents,
  tickY,
  type RailRects,
} from "@/lib/latent-flight/rail/railLattice";

import { createRailLattice, type RailLattice } from "../scene/RailLattice";
import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * RailSystem — the rails as a corridor.
 *
 * Measures the two rail tracks and the rail box on resize (never in the
 * loop), unprojects them to the glass depth to get the lattice's
 * cross-section, builds the lattice along the whole course from that
 * section, and publishes the section as the ship's lateral bounds. With the
 * vessel centred on the course the near cross-section lands on the chrome
 * to the pixel — `railAlignment()` measures exactly that against the live
 * camera and is the capture's gate.
 */

export class RailSystem implements LfSystem {
  readonly name = "rail";
  private w: World | null = null;
  private lf: HTMLElement | null = null;
  private lattice: RailLattice | null = null;
  private rects: RailRects | null = null;
  private v = new THREE.Vector3();

  init(w: World): void {
    this.w = w;
    this.lf = w.root.closest<HTMLElement>(".lf");
  }

  resize(w: World): void {
    const rects = this.measure(w);
    this.rects = rects;
    const e = latticeExtents(rects, { fovDeg: w.camera.fov, w: w.size.w, h: w.size.h });
    w.rail.halfX = e.x;
    w.rail.halfY = e.y;
    this.rebuild(w, e.x, e.y);
  }

  private measure(w: World): RailRects {
    const l = this.lf?.querySelector<HTMLElement>(".hud__rail--l");
    const r = this.lf?.querySelector<HTMLElement>(".hud__rail--r");
    const lt = l?.querySelector<HTMLElement>(".hud__rail__track");
    const rt = r?.querySelector<HTMLElement>(".hud__rail__track");
    if (l && r && lt && rt) {
      const lb = l.getBoundingClientRect();
      const ltb = lt.getBoundingClientRect();
      const rtb = rt.getBoundingClientRect();
      return {
        leftX: ltb.left + ltb.width / 2,
        rightX: rtb.left + rtb.width / 2,
        top: lb.top,
        bottom: lb.bottom,
      };
    }
    // No chrome (the rails hide under 960px): a nominal frame.
    return { leftX: w.size.w * 0.04, rightX: w.size.w * 0.96, top: w.size.h * 0.13, bottom: w.size.h * 0.87 };
  }

  private rebuild(w: World, halfX: number, halfY: number): void {
    if (this.lattice) {
      w.scene.remove(this.lattice.group);
      this.lattice.dispose();
    }
    this.lattice = createRailLattice(buildLattice(w.course, halfX, halfY));
    w.scene.add(this.lattice.group);
  }

  render(alpha: number, w: World): void {
    if (!this.lattice) return;
    const sh = w.ship;
    const k = Math.max(0, Math.min(1, alpha));
    const s = sh.sPrev + (sh.s - sh.sPrev) * k;
    this.lattice.setShip(s * w.course.length, (sh.v / SHIP.vMax) * 2);
    this.lattice.setLevel(w.boot["rails-uncover"]);
  }

  /**
   * The largest deviation, in CSS px, between the lattice's cross-section at
   * the glass and the chrome it is meant to sit on — the two tracks and the
   * rail's top and bottom — projected through the LIVE camera. Zero-ish at
   * rest with the vessel centred and the pointer still.
   */
  railAlignment(): number {
    const w = this.w;
    const rects = this.rects;
    if (!w || !rects) return Number.POSITIVE_INFINITY;
    const arc = w.ship.s * w.course.length + GLASS_DEPTH;
    const c = courseAt(w.course, Math.min(1, arc / w.course.length));
    let worst = 0;
    for (const side of [-1, 1]) {
      for (const k of [0, TICKS - 1]) {
        const y = tickY(k, w.rail.halfY);
        this.v.set(
          c.p[0] + c.n[0] * side * w.rail.halfX + c.b[0] * y,
          c.p[1] + c.n[1] * side * w.rail.halfX + c.b[1] * y,
          c.p[2] + c.n[2] * side * w.rail.halfX + c.b[2] * y
        );
        this.v.project(w.camera);
        const sx = (this.v.x * 0.5 + 0.5) * w.size.w;
        const sy = (0.5 - this.v.y * 0.5) * w.size.h;
        const dx = Math.abs(sx - (side < 0 ? rects.leftX : rects.rightX));
        const dy = Math.abs(sy - (k === 0 ? rects.top : rects.bottom));
        worst = Math.max(worst, dx, dy);
      }
    }
    return worst;
  }

  dispose(w: World): void {
    if (this.lattice) {
      w.scene.remove(this.lattice.group);
      this.lattice.dispose();
      this.lattice = null;
    }
    this.w = null;
  }
}
