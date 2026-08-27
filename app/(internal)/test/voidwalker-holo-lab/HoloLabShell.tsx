"use client";

import { useEffect, useMemo, useState } from "react";

import { CHARACTER_ERAS } from "@/lib/voidwalker/characterEras";

import { HoloEraPanels } from "@/components/landing/home-v2/voidwalker/hologram/HoloEraPanels";
import {
  HoloFigure,
  type HoloForm,
} from "@/components/landing/home-v2/voidwalker/hologram/HoloFigure";

/**
 * HoloLabShell — look-dev for the hologram composition that replaces
 * ADR-082's character stage (ADR-082 U1).
 *
 * ⚠ THIS IS A LAB, AND TWO THINGS HERE ARE DELIBERATELY NOT PRODUCTION.
 * The projector base is a DOM mock — on the real page the site's own
 * brandmark flattens and descends into that position, which is a WebGL
 * choreography against `BrandmarkPhysicsCoreActor`'s camera-welded park
 * and its own pass. Era switching is the same deliberate tab interaction
 * as production; the landing scroll clock owns only entry, hold, and exit.
 * Everything else — the treatment, the materialize, the panels, the asset
 * contract — is meant to graduate.
 *
 * ⚠ ASSETS COME FROM THE OFFLINE SKILL, THROUGH THE EXISTING CACHE.
 * `scripts/sync-voidwalker-avatar-preview.mjs` mirrors the
 * voidwalker-avatar skill's `waves/` into `public/_previews/` (gitignored,
 * per-machine) and its extension allowlist already covers .jpg/.png/.webm/
 * .mp4, so no script change was needed. A missing asset falls back to the
 * era's registry still rather than rendering an empty slot.
 */

const PREVIEW = "/_previews/voidwalker-avatar";

/** The look-dev wave. One era is authored so far; the rest fall back. */
const HOLO_WAVE = "20260826-thoughtform-v5";

const FORM_SRC: Record<HoloForm, string> = {
  emissive: `${PREVIEW}/${HOLO_WAVE}/style-holo-emissive-black.jpg`,
  baked: `${PREVIEW}/20260826-thoughtform-v4/style-holo-baked-full.jpg`,
  clean: `${PREVIEW}/20260826-thoughtform-v4/style-holo-clean-black.jpg`,
};

const VIDEO_SRC = `${PREVIEW}/${HOLO_WAVE}/holo-idle-black.mp4`;

export function HoloLabShell() {
  const [eraIdx, setEraIdx] = useState(0);
  const [form, setForm] = useState<HoloForm>("emissive");
  const [useVideo, setUseVideo] = useState(false);
  const [blend, setBlend] = useState<"plus-lighter" | "screen">("plus-lighter");
  const [alpha, setAlpha] = useState(0.92);
  const [scanPitch, setScanPitch] = useState(3);
  const [glow, setGlow] = useState(1);
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
  const src = useMemo(() => FORM_SRC[form], [form]);

  const pick = (i: number) => {
    setEraIdx(i);
    setEpoch((e) => e + 1);
  };

  return (
    <main className="hll">
      <div className="hll__bar">
        <div className="hll__grp">
          <span className="hll__lbl">Era</span>
          {CHARACTER_ERAS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className="hll__btn"
              data-on={i === eraIdx}
              onClick={() => pick(i)}
            >
              {e.short}
            </button>
          ))}
        </div>

        <div className="hll__grp">
          <span className="hll__lbl">Form</span>
          {(["emissive", "baked", "clean"] as HoloForm[]).map((f) => (
            <button
              key={f}
              type="button"
              className="hll__btn"
              data-on={f === form}
              onClick={() => {
                setForm(f);
                setEpoch((e) => e + 1);
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="hll__grp">
          <span className="hll__lbl">Media</span>
          <button
            type="button"
            className="hll__btn"
            data-on={!useVideo}
            onClick={() => setUseVideo(false)}
          >
            still
          </button>
          <button
            type="button"
            className="hll__btn"
            data-on={useVideo}
            onClick={() => {
              setUseVideo(true);
              setEpoch((e) => e + 1);
            }}
          >
            video
          </button>
        </div>

        <div className="hll__grp">
          <span className="hll__lbl">Blend</span>
          {(["plus-lighter", "screen"] as const).map((b) => (
            <button
              key={b}
              type="button"
              className="hll__btn"
              data-on={b === blend}
              onClick={() => setBlend(b)}
            >
              {b}
            </button>
          ))}
        </div>

        <label className="hll__slider">
          <span className="hll__lbl">α {alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.01}
            value={alpha}
            onChange={(ev) => setAlpha(+ev.target.value)}
          />
        </label>
        <label className="hll__slider">
          <span className="hll__lbl">scan {scanPitch}px</span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={scanPitch}
            onChange={(ev) => setScanPitch(+ev.target.value)}
          />
        </label>
        <label className="hll__slider">
          <span className="hll__lbl">glow {glow.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={2.5}
            step={0.1}
            value={glow}
            onChange={(ev) => setGlow(+ev.target.value)}
          />
        </label>

        <button
          type="button"
          className="hll__btn hll__btn--go"
          onClick={() => setEpoch((e) => e + 1)}
        >
          Materialize
        </button>
      </div>

      <section className="hll__stage">
        <div
          className="vwh"
          data-vwh-era={era.id}
          data-vwh-region="character-sheet"
          data-testid="voidwalker-character-sheet"
        >
          <HoloEraPanels selectedEraIndex={eraIdx} onSelectEra={pick} idPrefix="holo-lab" />

          <div className="vwh__column" data-vwh-region="figure">
            <HoloFigure
              src={src}
              videoSrc={useVideo ? VIDEO_SRC : undefined}
              epoch={epoch}
              form={form}
              blend={blend}
              alpha={alpha}
              scanPitch={scanPitch}
              glow={glow}
              reduced={reduced}
            />

            {/* ⚠ MOCK. On the real page the brandmark itself flattens and
                descends into this position — the base is not a graphic we
                draw, it is where the site's own mark ends up. */}
            <div className="vwh__base" data-vwh-region="platform" aria-hidden="true">
              <span className="vwh__base__disc" />
              <span className="vwh__base__ring" />
              <span className="vwh__base__glow" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
