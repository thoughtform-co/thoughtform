"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { CHARACTER_ERAS } from "@/lib/voidwalker/characterEras";
import { voidwalkerHologramProgressRef } from "@/lib/voidwalker/voidwalkerHologramClock";

import { useVoidwalkerHologramScroll } from "../../hooks/useVoidwalkerHologramScroll";

import { HoloEraPanels } from "./HoloEraPanels";
import { HoloFigure } from "./HoloFigure";

/**
 * VoidwalkerHologram — the composition that mounts inside
 * `#voidwalker` on the home page.
 *
 * ⚠ THIS IS THE PRODUCTION SIDE OF THE LAB (ADR-082 U2). The look-dev
 * harness at `/test/voidwalker-holo-lab` wraps this same figure and
 * these same panels in a knob bar. Anything tuned there — the
 * treatment, the type ladder, the head-line anchor — lands here without
 * a translation, because both surfaces render the SAME `.vwh` DOM off
 * the SAME `voidwalker-hologram.css`.
 *
 * ⚠ TWO THINGS ARE DELIBERATELY STILL LOOK-DEV.
 *
 * 1. THE PROJECTOR BASE is a DOM MOCK. On the real page the site's own
 *    brandmark flattens and descends into that position — a WebGL
 *    choreography against `BrandmarkPhysicsCoreActor`'s camera-welded
 *    park, its own pass. The gold disc + ring + glow sits here as the
 *    seat that mark will eventually take; the composition above it does
 *    not change when it does.
 * 2. ERA SWITCHING IS A CLICK. The stage scroll clock owns only entry,
 *    reading hold and exit; choosing one of the six loadouts remains a
 *    deliberate player action.
 *
 * ⚠ FIVE OF THE SIX ERAS RENDER THE THOUGHTFORM ASSET. Only the
 * thoughtform-era hologram exists so far (the `voidwalker-avatar` skill's
 * wave 20260826-thoughtform-v5). The other five era buttons switch the
 * copy panels but keep the same figure; the follow-up batch runs the
 * remaining five through the same pipeline. Author holograms lift here
 * by extending the era registry with a `holo` field — the fallback below
 * stays as the default until that field is populated.
 */

const HOLO_STILL = "/images/voidwalker/holo-still-thoughtform.jpg";
const HOLO_VIDEO = "/videos/voidwalker/holo-idle-thoughtform.mp4";
const SCRAMBLE_ARM_AT = 0.05;
const SCRAMBLE_REARM_BELOW = 0.02;
const SCRAMBLE_STAGGER_S = 0.09;

export function VoidwalkerHologram() {
  const [eraIdx, setEraIdx] = useState(1); // thoughtform is index 1 (the authored figure)
  const [epoch, setEpoch] = useState(0);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const yearRef = useRef<HTMLParagraphElement>(null);

  const stageActive = useVoidwalkerHologramScroll(rootRef);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const era = CHARACTER_ERAS[eraIdx];

  /**
   * THE MASTHEAD DECODES IN, LIKE THE SECTION BEFORE IT.
   *
   * `#about` scrambles his NAME and role toward their finals as the copy
   * clock arms (`AboutStage`, ADR-047 U7). This is the same kernel
   * (`lib/home-v2/captionScramble`) on the same three-target stagger, so
   * the era's name resolves the way his own does one section earlier
   * rather than simply fading up.
   *
   * ⚠ THE DECODE IS DESTRUCTIVE — it writes `textContent` — so the
   * targets are refs to leaf spans that hold nothing but their own
   * string, and the accessible name is restored by the final frame
   * (`to` IS the real text). It re-runs on every era switch, keyed off
   * the same arm that bumps the figure's glitch epoch, so the two land
   * together. The arm is derived from the reversible runway clock; reverse
   * scroll below the floor restores the finals, blanks again, and permits a
   * clean replay instead of leaving a one-shot latch behind.
   */
  useLayoutEffect(() => {
    const targets = [kickerRef.current, titleRef.current, yearRef.current];
    if (targets.some((t) => !t)) return;

    const finals = ["Era", era.wardrobe, era.year];
    const restore = () => {
      targets.forEach((el, i) => {
        if (el) el.textContent = finals[i]!;
      });
    };
    if (reduced) {
      restore();
      return;
    }
    // Static/mobile/lab/fallback presentations carry finished copy and do
    // not need a permanent scroll-clock reader. Era clicks still retrigger
    // the finite figure materialize in `pick` below.
    if (!stageActive) {
      restore();
      return;
    }

    const jobs: ScrambleJob[] = [];
    let armed = false;
    let blanked = false;
    let bumpEpoch = false;
    let raf = 0;

    const blank = () => {
      blanked = true;
      targets.forEach((el) => {
        if (el) el.textContent = "";
      });
    };
    const arm = (nowSec: number) => {
      if (!blanked) blank();
      armed = true;
      bumpEpoch = true;
      targets.forEach((el, i) => {
        // Stagger so the era name lands between its two chrome lines.
        queueScramble(jobs, el as HTMLElement, finals[i]!, nowSec + i * SCRAMBLE_STAGGER_S);
      });
    };

    // Era switches while the stage is already live must blank before the
    // browser paints the new finals. Entry from above is blanked on the first
    // rAF after the scroll writer engages (the stage is still off-screen).
    const initial = voidwalkerHologramProgressRef.current;
    if (initial.engaged) {
      blank();
      if (initial.enter >= SCRAMBLE_ARM_AT) arm(performance.now() / 1000);
    }

    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      const clock = voidwalkerHologramProgressRef.current;

      if (!clock.engaged) {
        if (armed || blanked || jobs.length) {
          jobs.length = 0;
          armed = false;
          blanked = false;
          restore();
        }
      } else if (armed && clock.enter <= SCRAMBLE_REARM_BELOW) {
        jobs.length = 0;
        armed = false;
        blanked = false;
        restore();
      } else if (!armed) {
        if (!blanked) blank();
        if (clock.enter >= SCRAMBLE_ARM_AT) arm(performance.now() / 1000);
      }

      if (bumpEpoch) {
        bumpEpoch = false;
        setEpoch((value) => value + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      jobs.length = 0;
      restore();
    };
  }, [era.id, era.wardrobe, era.year, reduced, stageActive]);

  const pick = (i: number) => {
    setEraIdx(i);
    // In scroll-owned stage mode the decoder arm bumps the same epoch. The
    // lab and static fallbacks have no arm, so preserve their click-owned
    // materialize without double-triggering the capable path.
    if (!voidwalkerHologramProgressRef.current.engaged) {
      setEpoch((value) => value + 1);
    }
  };

  return (
    <div className="vwh" data-vwh-era={era.id} ref={rootRef}>
      {/* The era's masthead sits above the figure at display scale. */}
      <header className="vwh__mast" key={era.id}>
        <p className="vwh__mast__kicker vwh__decode-line" ref={kickerRef}>
          Era
        </p>
        <h2 className="vwh__mast__title vwh__decode-line" ref={titleRef}>
          {era.wardrobe}
        </h2>
        <p className="vwh__mast__year vwh__decode-line" ref={yearRef}>
          {era.year}
        </p>
      </header>

      <HoloEraPanels era={era} />

      <div className="vwh__column">
        <HoloFigure
          src={HOLO_STILL}
          videoSrc={reduced ? undefined : HOLO_VIDEO}
          epoch={epoch}
          form="emissive"
          blend="plus-lighter"
          alpha={0.92}
          scanPitch={3}
          glow={1}
          reduced={reduced}
        />

        {/* Placeholder for the brandmark descent — see file header. */}
        <div className="vwh__base" aria-hidden="true">
          <span className="vwh__base__disc" />
          <span className="vwh__base__ring" />
          <span className="vwh__base__glow" />
        </div>
      </div>

      <nav className="vwh__rail" aria-label="Era">
        {CHARACTER_ERAS.map((e, i) => (
          <button
            key={e.id}
            type="button"
            className="vwh__pip"
            data-on={i === eraIdx}
            onClick={() => pick(i)}
          >
            <span className="vwh__pip__year">{e.year}</span>
            <span className="vwh__pip__name">{e.short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
