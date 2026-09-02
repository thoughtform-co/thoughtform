import { WAYPOINTS, sectorLabel, waypointIndex } from "@/lib/latent-flight/content/waypoints";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * DockSystem — the seam the casefile will mount into.
 *
 * On DOCK the station's dossier panel opens beside the right rail, the
 * flight deck goes `inert` (the keys and the pointer look are the vessel's,
 * and the vessel is docked) and focus moves INTO the panel; on undock the
 * panel closes, the deck comes back and focus returns to it. The panel
 * carries the station's name and sector and one line saying the bay is
 * open — the record itself is not on this branch. This system owns only the
 * DOM handoff; the ship owns the state.
 */

export class DockSystem implements LfSystem {
  readonly name = "dock";
  private panel: HTMLElement | null = null;
  private nameEl: HTMLElement | null = null;
  private sectorEl: HTMLElement | null = null;
  private last: string | null = null;
  private raf = 0;

  init(w: World): void {
    const lf = w.root.closest<HTMLElement>(".lf");
    this.panel = lf?.querySelector<HTMLElement>('[data-lf="dock"]') ?? null;
    this.nameEl = lf?.querySelector<HTMLElement>('[data-lf="dock-name"]') ?? null;
    this.sectorEl = lf?.querySelector<HTMLElement>('[data-lf="dock-sector"]') ?? null;
  }

  render(_alpha: number, w: World): void {
    if (w.fsm === this.last) return;
    const was = this.last;
    this.last = w.fsm;
    if (w.fsm === "DOCK") this.open(w);
    else if (was === "DOCK") this.close(w);
  }

  private open(w: World): void {
    const panel = this.panel;
    if (!panel) return;
    const wp = WAYPOINTS[waypointIndex(w.ship.sector)];
    if (this.nameEl) this.nameEl.textContent = wp.name.toUpperCase();
    if (this.sectorEl) this.sectorEl.textContent = sectorLabel(wp.id);
    panel.hidden = false;
    w.root.setAttribute("inert", "");
    w.root.dataset.lfDocked = "1";
    // Focus after the panel has painted once, so the move is announced.
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      panel.querySelector<HTMLElement>('[data-lf-action="undock"]')?.focus({ preventScroll: true });
    });
  }

  private close(w: World): void {
    const panel = this.panel;
    if (!panel) return;
    cancelAnimationFrame(this.raf);
    panel.hidden = true;
    w.root.removeAttribute("inert");
    delete w.root.dataset.lfDocked;
    w.root.focus({ preventScroll: true });
  }

  dispose(w: World): void {
    cancelAnimationFrame(this.raf);
    w.root.removeAttribute("inert");
    delete w.root.dataset.lfDocked;
    if (this.panel) this.panel.hidden = true;
  }
}
