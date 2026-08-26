"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const era = CHARACTER_ERAS[eraIdx];

  const pick = (i: number) => {
    setEraIdx(i);
    setEpoch((e) => e + 1);
  };

  return (
    <div className="vwh" data-vwh-era={era.id}>
      {/* The era's masthead sits above the figure at display scale. */}
      <header className="vwh__mast">
        <p className="vwh__mast__kicker">Era</p>
        <h2 className="vwh__mast__title">{era.wardrobe}</h2>
        <p className="vwh__mast__year">{era.year}</p>
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
