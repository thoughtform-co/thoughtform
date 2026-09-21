"use client";

import { useEffect, useRef, useState } from "react";

import { HoloDatumPanels } from "@/components/landing/home-v2/voidwalker/hologram/HoloDatumPanels";
import { HoloFigure } from "@/components/landing/home-v2/voidwalker/hologram/HoloFigure";
import {
  CHARACTER_ERAS,
  holoFigureFit,
  holoFigureHeadShare,
  resolveCharacterEraHologram,
} from "@/lib/voidwalker/characterEras";

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
  /* ⚠ THE RING KNOB IS GONE, AND `rise` REPLACES IT (ADR-082 U31). U23 put a
     `ring` slider here because the reticle's centre was "the one value in that
     drawing solved by looking rather than by arithmetic". It is arithmetic now:
     on the alpha branch the ring is centred on the painted figure by the same
     terms the lift is solved from, so `--vwd-ret-cy` no longer reaches it — and
     a slider for a token nothing reads is a lie the lab tells (ADR-070 U35).
     ⚠ IT WAS ALSO LYING BEFORE THAT: it wrote `calc(44% − var(--vwh-base-h,
     44px) × .5)` inline on `.vwd`, where `--vwh-base-h` did not resolve (it
     lived on `.vwh`, a descendant), so the 44px fallback always won AND the
     inline value overrode production's measured 57 % — the lab's ring had been
     in the wrong place since it was added.
     What wants judging by eye now is how far the figure RISES: 0 is the old
     bottom seat, 1 puts the cap on the panel heads' row line. Null until
     touched, like `chip`, so the lab opens on production's value. */
  const [rise, setRise] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  /* ⚠ MEASURED, NEVER A LITERAL. `--vwd-bar-h` feeds --vwd-chrome-h feeds
     --vwd-fig-w, so a wrong bar height renders a lab figure column that
     diverges from the landing's — the exact "window that lies about
     production" defect this file's header warns about. A hand-written 56px
     was correct only at the widths where the flex-wrap bar happened to fit
     one row; removing the RAIL knob (ADR-082 U21) moved the wrap threshold
     and nothing re-measured it. The observer makes any future knob change
     self-correcting. 56 stays as the pre-measure fallback only. */
  const [barH, setBarH] = useState(56);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const sync = () => setBarH(Math.round(bar.getBoundingClientRect().height));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

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
    <div
      className="vwh__column"
      data-vwh-region="figure"
      /* ⚠ PRODUCTION'S OWN TWO TOKENS (`VoidwalkerHologram.tsx`). The lab's
         column omitted them, so the phone rung's head-line lift — which reads
         `--holo-head` off this element — computed against the fallback `1` here
         and the lab showed a different phone than the landing. */
      style={
        {
          "--holo-fit": holoFigureFit(hologram),
          "--holo-head": holoFigureHeadShare(hologram),
        } as React.CSSProperties
      }
    >
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
          ...(rise === null ? null : { "--vwd-rise": rise }),
          /* The composition derives the figure's width from the height its
             own chrome leaves; in the lab the knob bar is part of that —
             so the bar reports its own measured height (see barRef above). */
          "--vwd-bar-h": `${barH}px`,
        } as React.CSSProperties
      }
    >
      <div className="dlab__bar" ref={barRef}>
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
          {/* ⚠ SINCE ADR-082 U31 THIS IS THE BUST'S WIDTH AGAIN. From 701px up the
              band is a five-bust gallery and `--vwd-chip` is the frame's width
              (its height follows at 3:2, and the pitch through `--vwd-cell`), so
              one slider still retunes the whole band. Below 701px it is what
              U23 left it: the text reel's pitch alone.
              ⚠ THE PRICE OF A BIGGER BUST IS NOT SHOWN BY THE SLIDER. Past
              ~52px of height the band outgrows the figure slot's width-bound
              slack and the FIGURE starts to shrink; `probe-voidwalker-figure-
              span` prints that slack, and the honest payer is `--vwd-trail-air`
              (the four panel heads rise). */}
          <span className="dlab__lbl">bust {chip === null ? "auto" : `${chip}px`}</span>
          <input
            type="range"
            min={44}
            max={120}
            step={2}
            value={chip ?? 72}
            onChange={(ev) => setChip(+ev.target.value)}
          />
        </label>

        <label className="dlab__slider">
          <span className="dlab__lbl">rise {rise === null ? "auto" : rise.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={rise ?? 1}
            onChange={(ev) => setRise(+ev.target.value)}
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
