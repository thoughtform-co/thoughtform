"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HoloFigure — the hologram slot: the figure, its treatment, and the
 * materialize.
 *
 * ⚠ THE ARCHITECTURE IS "BAKE THE LIGHT, CODE THE SCREEN" (ADR-082 U1).
 * The ASSET carries identity, wardrobe and gold emissive lighting on a
 * pure-black ground; everything raster — the scan lines, the flicker,
 * the translucency, the chroma split, the reveal — is here, in code.
 * Three reasons, and the middle one is the load-bearing one:
 *
 *   1. VP9's 4:2:0 subsampling turns baked 1–2px scan lines into moiré,
 *      and asset-space lines alias against the display grid anyway.
 *      Raster cadences have to be authored in SCREEN space.
 *   2. The wardrobe is ALL BLACK. Under an additive blend black
 *      contributes nothing, so a neutral figure loses its blazer
 *      entirely — measured, `holo-clean-black` is a floating head and
 *      two hands. A gold-LIT figure has no true blacks on the body, so
 *      the same blend keys it for free and the dark folds going
 *      translucent is what a hologram should do anyway.
 *   3. One block retunes six eras and both media types; twelve bakes
 *      do not.
 *
 * ⚠ THE BLEND NEVER REACHES THE PAGE BEHIND IT, AND MUST NOT TRY. On the
 * real station this slot sits inside a sticky, transformed stage, and any
 * transformed ancestor forms a stacking context — so `mix-blend-mode`
 * would blend against a TRANSPARENT local group, and screen-over-nothing
 * paints the asset's black as an opaque black rectangle over the
 * corridor. `.vwh__slot` is `isolation: isolate` with a `.vwh__ground`
 * void wash underneath: the blend always has a floor of the site's own
 * ground, and since screen-with-black is the identity the corridor still
 * reads through the wash's soft edges.
 */

export type HoloForm = "emissive" | "baked" | "clean";

export interface HoloFigureProps {
  /** Poster/still. */
  src: string;
  /** Optional loop; when present it replaces the still once it can play. */
  videoSrc?: string;
  /** Bumped by the parent to re-run the materialize (era switch, button). */
  epoch: number;
  form: HoloForm;
  blend: "plus-lighter" | "screen";
  alpha: number;
  /** Scan-line pitch in px — the dark line is always 1px of it. */
  scanPitch: number;
  glow: number;
  reduced: boolean;
}

/** The materialize's own clock. 900ms of reveal, then the settle — the
 *  glitch grammar's 640ms (themeGlitch.ts) is what the settle borrows. */
const REVEAL_MS = 900;
const SETTLE_MS = 640;

export function HoloFigure({
  src,
  videoSrc,
  epoch,
  form,
  blend,
  alpha,
  scanPitch,
  glow,
  reduced,
}: HoloFigureProps) {
  const [phase, setPhase] = useState<"rest" | "reveal" | "settle">("rest");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setPhase("rest");
      return;
    }
    setPhase("reveal");
    const a = window.setTimeout(() => setPhase("settle"), REVEAL_MS);
    const b = window.setTimeout(() => setPhase("rest"), REVEAL_MS + SETTLE_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [epoch, reduced]);

  // The video restarts with the era so its first frame is the poster the
  // reveal wipes onto — otherwise the figure materializes mid-gesture.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [epoch, videoSrc]);

  return (
    <figure
      className="vwh__slot"
      data-phase={phase}
      data-form={form}
      style={
        {
          "--holo-alpha": alpha,
          "--holo-scan": `${scanPitch}px`,
          "--holo-glow": glow,
          "--holo-blend": blend,
          "--holo-reveal-ms": `${REVEAL_MS}ms`,
        } as React.CSSProperties
      }
    >
      {/* The floor the blend needs. Never remove it to "let the page
          through" — see the isolation note above. */}
      <div className="vwh__ground" aria-hidden="true" />

      <div className="vwh__media-wrap">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="vwh__media"
            src={videoSrc}
            poster={src}
            muted
            loop
            playsInline
            autoPlay={!reduced}
            preload="auto"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- a lab
             slot fed from a gitignored preview cache; Image() would want
             a loader config for paths that only exist on this machine. */
          <img className="vwh__media" src={src} alt="" draggable={false} />
        )}
        {/* The edge bar rides the reveal line. */}
        <span className="vwh__edge" aria-hidden="true" />
      </div>

      {/* ⚠ NO SCANLINE OVERLAY. The cadence rides the media's own MASK
          (holo-lab.css) — an overlay that multiplies across the slot
          darkens the bare ground too and paints a black box around the
          hologram. Only the projection cone is a layer, and it is
          additive, so it has nothing to darken. */}
      <div className="vwh__cone" aria-hidden="true" />
    </figure>
  );
}
