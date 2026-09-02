import {
  BOOT_DONE_AT,
  bootCue,
  bootStateAt,
  instantBoot,
} from "@/lib/latent-flight/boot/bootTimeline";
import { setLfState } from "@/lib/latent-flight/engine/store";

import type { World } from "../World";
import type { LfSystem } from "./System";

/**
 * BootSystem — the power-on clock.
 *
 * Advances the boot time, publishes every cue's progress as `world.boot`,
 * and drives the ONE piece of chrome the boot touches outside the HUD: the
 * rails' curtain clip. `--hero-lift` is what the landing reveals its frame
 * with (ADR-031 U16, a spatial clip, never a fade); ramping it 0 → 1 here
 * uncovers the rails top to bottom with zero new CSS. When the boot is
 * over, or skipped, or never played (reduced motion, `?boot=0`), the
 * property rests at 1 and the shell's own pin holds it there.
 *
 * `?hold=<cue>` freezes the clock at that cue's `at` for deterministic
 * stills and stamps `boot|hold:<cue>|dark`; the rest state stamps
 * `vista|VISTA|dark`. The capture waits on those identities, never a sleep.
 */

const STAMP_REST = "vista|VISTA|dark";

export class BootSystem implements LfSystem {
  readonly name = "boot";
  private t = 0;
  private held: number | null = null;
  private done = false;

  init(w: World): void {
    w.commands.skipBoot = () => this.skip(w);
    if (w.fsm !== "BOOT") {
      w.boot = instantBoot();
      w.bootT = BOOT_DONE_AT;
      this.done = true;
      setLfState({ stamp: STAMP_REST });
      return;
    }
    const cue = w.flags.hold ? bootCue(w.flags.hold) : undefined;
    this.held = cue ? cue.at : null;
    this.t = this.held ?? 0;
    w.boot = bootStateAt(this.t);
    w.bootT = this.t;
    document.documentElement.style.setProperty("--hero-lift", "0");
    setLfState({ stamp: cue ? `boot|hold:${cue.id}|dark` : "boot|BOOT|dark" });
  }

  update(dt: number, w: World): void {
    if (this.done || w.fsm !== "BOOT") return;
    if (this.held === null) this.t += dt;
    w.boot = bootStateAt(this.t);
    w.bootT = this.t;
    document.documentElement.style.setProperty("--hero-lift", w.boot["rails-uncover"].toFixed(3));
    if (this.held === null && this.t >= BOOT_DONE_AT) this.finish(w);
  }

  private finish(w: World): void {
    if (this.done) return;
    this.done = true;
    w.boot = instantBoot();
    w.bootT = Math.max(w.bootT, BOOT_DONE_AT);
    document.documentElement.style.setProperty("--hero-lift", "1");
    if (w.fsm === "BOOT") w.dispatch("boot-done");
    setLfState({ stamp: STAMP_REST });
  }

  skip(w: World): void {
    if (this.done || w.fsm !== "BOOT") return;
    this.held = null;
    this.finish(w);
  }

  dispose(): void {
    // The shell owns the resting value; leave it at 1 for the next engine.
    document.documentElement.style.setProperty("--hero-lift", "1");
  }
}
