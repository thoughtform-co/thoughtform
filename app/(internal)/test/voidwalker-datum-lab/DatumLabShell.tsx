"use client";

import { useEffect, useState } from "react";

import { HoloDatumPanels } from "@/components/landing/home-v2/voidwalker/hologram/HoloDatumPanels";
import { HoloFigure } from "@/components/landing/home-v2/voidwalker/hologram/HoloFigure";
import { CHARACTER_ERAS, resolveCharacterEraHologram } from "@/lib/voidwalker/characterEras";

/**
 * DatumLabShell — the knob bar around the SHIPPED datum composition.
 *
 * ⚠ THIS LAB IS A WINDOW ONTO PRODUCTION, NOT A COPY (ADR-070 U35). It mounts
 * `HoloDatumPanels` and imports `voidwalker-datum.css`, both of which the
 * landing renders, so there is no second drawing to drift. Everything here is
 * the harness: the knob bar, and the era/epoch state that `VoidwalkerHologram`
 * owns in production (where the scroll clock also feeds it).
 *
 * ⚠ TWO THINGS ARE DELIBERATELY NOT PRODUCTION. The projector base is a DOM
 * mock — on the real page the site's own brandmark flattens and descends into
 * that position — and era switching here is a plain click, where the landing
 * additionally derives the era from the runway's own progress and pins the
 * scroll on a click.
 */
export function DatumLabShell() {
  /* Azeroth: the only era with its own authored hologram, and the subject of
     every mockup in the pass — so the lab opens where the review left off. */
  const [eraIdx, setEraIdx] = useState(2);
  const [epoch, setEpoch] = useState(0);
  /* ⚠ NULL UNTIL TOUCHED, because an inline style beats every stylesheet rule
     including a media query. Seeded at 64 the knob wrote `--vwd-chip: 64px`
     onto the root on first paint and the phone rung's own
     `clamp(44px, 13vw, 56px)` never applied — the band rendered at desktop
     size on a 375px screen, which is the exact thing the slider exists to let
     the owner judge. A lab knob may not defeat the default it explores. */
  const [chip, setChip] = useState<number | null>(null);
  const [rail, setRail] = useState(0.12);
  const [bust, setBust] = useState(0.34);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const era = CHARACTER_ERAS[eraIdx] ?? CHARACTER_ERAS[0];
  const hologram = resolveCharacterEraHologram(era);

  const pick = (i: number) => {
    setEraIdx(i);
    setEpoch((e) => e + 1);
  };

  /* The same node production builds, so the figure's own treatment and its
     `portrait` handoff target are the shipped ones. */
  const figureColumn = (
    <div className="vwh__column" data-vwh-region="figure">
      <HoloFigure
        hologram={hologram}
        epoch={epoch}
        form="emissive"
        blend="plus-lighter"
        alpha={0.92}
        scanPitch={3}
        glow={1}
        reduced={reduced}
      />
      {/* ⚠ MOCK — see the file header. */}
      <div className="vwh__base" data-vwh-region="platform" aria-hidden="true">
        <span className="vwh__base__disc" />
        <span className="vwh__base__ring" />
        <span className="vwh__base__glow" />
      </div>
    </div>
  );

  return (
    <main
      className="vwd dlab"
      style={
        {
          ...(chip === null ? null : { "--vwd-chip": `${chip}px` }),
          "--vwd-rail": rail,
          "--vwd-bust-span": bust,
          /* The composition derives the figure's width from the height its
             own chrome leaves; in the lab the knob bar is part of that. */
          "--vwd-bar-h": "56px",
        } as React.CSSProperties
      }
    >
      <div className="dlab__bar">
        <div className="dlab__grp">
          <span className="dlab__lbl">Era</span>
          {CHARACTER_ERAS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className="dlab__btn"
              data-on={i === eraIdx}
              onClick={() => pick(i)}
            >
              {e.short}
            </button>
          ))}
        </div>

        <label className="dlab__slider">
          <span className="dlab__lbl">chip {chip === null ? "auto" : `${chip}px`}</span>
          <input
            type="range"
            min={44}
            max={120}
            step={2}
            value={chip ?? 64}
            onChange={(ev) => setChip(+ev.target.value)}
          />
        </label>

        <label className="dlab__slider">
          <span className="dlab__lbl">bust {bust.toFixed(2)}</span>
          <input
            type="range"
            min={0.16}
            max={0.9}
            step={0.02}
            value={bust}
            onChange={(ev) => setBust(+ev.target.value)}
          />
        </label>

        <label className="dlab__slider">
          <span className="dlab__lbl">rail {rail.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.01}
            value={rail}
            onChange={(ev) => setRail(+ev.target.value)}
          />
        </label>

        <button
          type="button"
          className="dlab__btn dlab__btn--go"
          onClick={() => setEpoch((e) => e + 1)}
        >
          Materialize
        </button>
      </div>

      <HoloDatumPanels
        selectedEraIndex={eraIdx}
        onSelectEra={pick}
        idPrefix="datum-lab"
        figure={figureColumn}
      />
    </main>
  );
}
