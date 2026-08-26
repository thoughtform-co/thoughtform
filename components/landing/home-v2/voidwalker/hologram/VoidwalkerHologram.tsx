"use client";

import { useEffect, useRef, useState } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

import { CHARACTER_ERAS } from "@/lib/voidwalker/characterEras";

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
 * 2. ERA SWITCHING IS A CLICK. The corridor already carries a scroll
 *    clock; wiring the hologram to it is its own pass with its own smoke
 *    (the section is the corridor's opaque cover — see the file header
 *    on `VoidwalkerStation.tsx`).
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

export function VoidwalkerHologram() {
  const [eraIdx, setEraIdx] = useState(1); // thoughtform is index 1 (the authored figure)
  const [epoch, setEpoch] = useState(0);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const yearRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const era = CHARACTER_ERAS[eraIdx];

  /**
   * THE ENTRANCE FIRES ONCE, ON ARRIVAL.
   *
   * ⚠ NOTHING MAY RISE (owner, 2026-08-26). `#about` exits by sliding
   * its cluster away, so a section that answers it by scrolling its own
   * contents upward performs the same move twice in a row. The
   * composition ASSEMBLES instead — the columns come in from the side
   * each one lives on, the figure tears in, the masthead resolves.
   *
   * The attribute is written straight to the node rather than held in
   * state: this is a one-shot with no other consumer, and a re-render
   * here would restart the figure's own clock. Scrolling back up does
   * not replay it (`io.disconnect()`), which is what keeps the beat a
   * ARRIVAL rather than a loop.
   */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (reduced) {
      el.setAttribute("data-vwh-in", "");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.setAttribute("data-vwh-in", "");
        // The figure's glitch runs off the same clock as an era switch.
        setEpoch((e) => e + 1);
        io.disconnect();
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

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
   * the same `epoch` the figure's glitch uses, so the two land together.
   */
  useEffect(() => {
    if (reduced) return;
    const targets = [kickerRef.current, titleRef.current, yearRef.current];
    if (targets.some((t) => !t)) return;

    const jobs: ScrambleJob[] = [];
    const t0 = performance.now() / 1000;
    const finals = ["Era", era.wardrobe, era.year];
    targets.forEach((el, i) => {
      // Stagger so the name lands between its two chrome lines.
      queueScramble(jobs, el as HTMLElement, finals[i]!, t0 + i * 0.09);
    });

    let raf = 0;
    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      if (jobs.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Leave the real strings behind if we unmount mid-decode.
      targets.forEach((el, i) => {
        if (el) el.textContent = finals[i]!;
      });
    };
  }, [epoch, era.wardrobe, era.year, reduced]);

  const pick = (i: number) => {
    setEraIdx(i);
    setEpoch((e) => e + 1);
  };

  return (
    <div className="vwh" data-vwh-era={era.id} ref={rootRef}>
      {/* The era's masthead sits above the figure at display scale. */}
      <header className="vwh__mast">
        <p className="vwh__mast__kicker" ref={kickerRef}>
          Era
        </p>
        <h2 className="vwh__mast__title" ref={titleRef}>
          {era.wardrobe}
        </h2>
        <p className="vwh__mast__year" ref={yearRef}>
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
