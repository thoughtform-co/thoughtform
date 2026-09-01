"use client";

import { useEffect, useRef, useState } from "react";

import {
  CANONICAL_CHARACTER_ERA_HOLOGRAM,
  isCharacterEraHologram,
  type CharacterEraHologram,
} from "@/lib/voidwalker/characterEras";
import { getHoloAlphaSupport, onHoloAlphaSupport } from "@/lib/voidwalker/holoAlphaSupport";

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
 *   3. One block retunes five eras and both media types; ten bakes
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
export type HoloInitialMaterialization = "timed" | "scroll";

export interface HoloFigureProps {
  /** Poster/still. Kept for the look-development lab. */
  src?: string;
  /** Optional loop; when present it replaces the still once it can play. */
  videoSrc?: string;
  /**
   * Validated production pair. Invalid generated records fail back to the
   * canonical Thoughtform pair; the lab can continue to pass `src` and
   * `videoSrc` directly.
   */
  hologram?: CharacterEraHologram | null;
  /** Bumped by the parent to re-run the materialize (era switch, button). */
  epoch: number;
  form: HoloForm;
  blend: "plus-lighter" | "screen";
  alpha: number;
  /** Scan-line pitch in px — the dark line is always 1px of it. */
  scanPitch: number;
  glow: number;
  reduced: boolean;
  /**
   * The lab keeps its authored timed mount reveal. Production passes
   * `scroll`: its first acquisition is driven by `--vwh-morph`, while later
   * epoch changes (era-button choices) still run the finite materialize.
   */
  initialMaterialization?: HoloInitialMaterialization;
}

/** The materialize's own clock. 900ms of reveal, then the settle — the
 *  glitch grammar's 640ms (themeGlitch.ts) is what the settle borrows. */
const REVEAL_MS = 900;
const SETTLE_MS = 640;

export function HoloFigure({
  src,
  videoSrc,
  hologram,
  epoch,
  form,
  blend,
  alpha,
  scanPitch,
  glow,
  reduced,
  initialMaterialization = "timed",
}: HoloFigureProps) {
  const [phase, setPhase] = useState<"rest" | "reveal" | "settle">("rest");
  const [failedVideoSrc, setFailedVideoSrc] = useState<string | null>(null);
  const [failedPosterSrc, setFailedPosterSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const initialEpochRef = useRef(epoch);
  const previousEpochRef = useRef(epoch);
  /* ⚠ THE LOOP PLAYS ONLY NEAR THE VIEWPORT (2026-09-01, pre-launch). The
     element mounts at hydration four stations below the fold, and a bare
     `autoPlay` FORCES the fetch — preload="metadata" alone was measured
     doing nothing (1.8 MB of WebM pulled at page top). An observer with a
     one-viewport lead arms playback just before arrival; far away the loop
     pauses. On phones this also means the bytes are never fetched until the
     figure tab is opened (display: none never intersects). */
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);

  const productionAsset =
    hologram === undefined
      ? null
      : isCharacterEraHologram(hologram)
        ? hologram
        : CANONICAL_CHARACTER_ERA_HOLOGRAM;
  // ⚠ LOCKED AT MOUNT, ON PURPOSE. The probe settles during page load and the
  // station is far down the corridor, so this is decided long before anyone
  // sees it — but reading it live would let a late verdict swap the <source>
  // under a playing element and restart the figure mid-view. `null` (undecided)
  // resolves to the floor path, which is the fail-safe branch.
  const [alphaMedia] = useState<boolean>(() => getHoloAlphaSupport() === true);
  const [, forceProbeSettled] = useState(0);
  useEffect(() => {
    // Only matters if the station somehow mounts before the probe settles;
    // re-render once so the very next mount reads a decided value.
    if (getHoloAlphaSupport() !== null) return;
    return onHoloAlphaSupport(() => forceProbeSettled((n) => n + 1));
  }, []);

  const requestedPosterSrc =
    (alphaMedia ? productionAsset?.posterAlphaPath : productionAsset?.posterPath) ??
    src ??
    (alphaMedia
      ? CANONICAL_CHARACTER_ERA_HOLOGRAM.posterAlphaPath
      : CANONICAL_CHARACTER_ERA_HOLOGRAM.posterPath);
  const requestedVideoSrc = reduced
    ? undefined
    : ((alphaMedia ? productionAsset?.videoAlphaPath : productionAsset?.videoPath) ?? videoSrc);
  // ⚠ THE LAST-RESORT POSTER MUST MATCH THE COMPOSITING BRANCH. On the alpha
  // path the floor, the blend and the isolation are all switched off, so an
  // opaque `.jpg` landing here would paint its black ground as a rectangle —
  // the exact pane this update removed, reappearing only in the failure case
  // where nobody looks.
  const canonicalPoster = alphaMedia
    ? CANONICAL_CHARACTER_ERA_HOLOGRAM.posterAlphaPath
    : CANONICAL_CHARACTER_ERA_HOLOGRAM.posterPath;
  const posterSrc = failedPosterSrc === requestedPosterSrc ? canonicalPoster : requestedPosterSrc;
  const playableVideoSrc = failedVideoSrc === requestedVideoSrc ? undefined : requestedVideoSrc;

  useEffect(() => {
    const epochChanged = previousEpochRef.current !== epoch;
    previousEpochRef.current = epoch;
    const timedInitial = epoch === initialEpochRef.current && initialMaterialization === "timed";
    if (reduced || (!epochChanged && !timedInitial)) {
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
  }, [epoch, initialMaterialization, reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (typeof IntersectionObserver === "undefined") {
      nearRef.current = true;
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        nearRef.current = entry.isIntersecting;
        setNear(entry.isIntersecting);
      },
      { rootMargin: "100% 0px 100% 0px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [playableVideoSrc]);

  // Play within a viewport of the station, pause beyond it — this effect is
  // what replaced the <video>'s own autoPlay attribute.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (near) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else if (!v.paused) {
      v.pause();
    }
  }, [near, playableVideoSrc]);

  // The video restarts with the era so its first frame is the poster the
  // reveal wipes onto — otherwise the figure materializes mid-gesture.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    // An era change can only be made with the station on screen; the near
    // gate just keeps a programmatic epoch bump from fetching a far loop.
    if (!nearRef.current) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [epoch, playableVideoSrc]);

  return (
    <figure
      className="vwh__slot"
      data-vwh-handoff-target="portrait"
      data-phase={phase}
      data-form={form}
      /* The compositing branch. Present ⇒ the media carries real alpha, so the
         floor, the additive blend and this slot's isolation are all switched
         off in CSS. Absent ⇒ the ADR-082 U2 floor path, unchanged. */
      data-holo-alpha={alphaMedia ? "" : undefined}
      data-vwh-frame-width={productionAsset?.frame.width}
      data-vwh-frame-height={productionAsset?.frame.height}
      data-vwh-head-y={productionAsset?.headY}
      data-vwh-foot-y={productionAsset?.footY}
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
        {playableVideoSrc ? (
          <video
            ref={videoRef}
            className="vwh__media"
            src={playableVideoSrc}
            poster={posterSrc}
            width={720}
            height={1280}
            muted
            loop
            playsInline
            /* No autoPlay, and "metadata", never "auto": this element mounts
               at hydration four stations below the fold, the loops run
               1.9-3.3 MB, and a bare autoPlay FORCES the fetch whatever the
               preload hint says (measured: 1.8 MB pulled at page top with
               preload="metadata" + autoPlay). Playback is driven by the
               near-viewport observer above — the repo's own preload="none"
               doctrine, .claude/rules/arcs.md, one notch looser because this
               figure must already be moving as the station arrives. */
            preload="metadata"
            onError={() => setFailedVideoSrc(requestedVideoSrc ?? null)}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- a lab
             slot fed from a gitignored preview cache; Image() would want
             a loader config for paths that only exist on this machine. */
          <img
            className="vwh__media"
            src={posterSrc}
            alt=""
            width={720}
            height={1280}
            draggable={false}
            onError={() => {
              if (posterSrc !== canonicalPoster) {
                setFailedPosterSrc(requestedPosterSrc);
              }
            }}
          />
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
