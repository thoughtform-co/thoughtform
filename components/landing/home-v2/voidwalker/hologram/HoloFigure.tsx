"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { glitchFrame, type GlitchBand, type GlitchPlan } from "@/lib/key-visual/themeGlitch";
import {
  CANONICAL_CHARACTER_ERA_HOLOGRAM,
  holoFigureFit,
  isCharacterEraHologram,
  type CharacterEraHologram,
} from "@/lib/voidwalker/characterEras";
import {
  holoGlitchInterrupt,
  holoGlitchPlan,
  holoPlateRect,
  holoScanPhase,
  type HoloGlitchRun,
} from "@/lib/voidwalker/holoGlitch";
import {
  getHoloAlphaSupport,
  getHoloHevcAlphaSupport,
  onHoloAlphaSupport,
  onHoloHevcAlphaSupport,
} from "@/lib/voidwalker/holoAlphaSupport";

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
 *
 * ⚠ AN ERA CHANGE IS A GLITCH, NOT A CUT (ADR-082 U42, owner 2026-09-24:
 * "when you scroll between eras I want a glitch effect to happen on the
 * avatar so there's a clean transition between the avatars"). The `<video>`
 * still swaps `src` in place — imperatively, in a layout effect, so the
 * element still holds the outgoing frame when `useHoloGlitch` below snapshots
 * it — and a canvas laid over it tears that frame away in bands while the
 * incoming plate resolves from a coarse mosaic (the hero's own theme-swap
 * grammar, `lib/key-visual/themeGlitch.ts`). The video is hidden under the
 * canvas for the run and shown on the kernel's identity frame, so nothing of
 * the swap is ever painted. One transition for scroll AND click; the
 * epoch-driven `reveal` / `settle` phases are the figure lab's timed
 * materialize now and production never enters them on an era change.
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
  /**
   * The eras a reader can step to from this one (ADR-082 U42): their alpha
   * posters are decoded ahead of time so the glitch has an incoming plate the
   * instant the era changes. The parent resolves them; the lab passes none.
   */
  neighbours?: readonly CharacterEraHologram[];
  /** Bumped by the parent to re-run the materialize (the lab's button). */
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
   * epoch changes (the lab's button) still run the finite materialize.
   */
  initialMaterialization?: HoloInitialMaterialization;
}

/** The materialize's own clock. 900ms of reveal, then the settle — the
 *  glitch grammar's 640ms (themeGlitch.ts) is what the settle borrows. */
const REVEAL_MS = 900;
const SETTLE_MS = 640;

/** Backing-store cap for the glitch canvas — the hero's own (a 640ms effect
 *  does not need a DPR-3 texture). */
const GLITCH_MAX_DPR = 2;

type HoloCodec = "vp9" | "hevc" | null;

/** Something `drawImage` accepts: a decoded poster, or a snapshot of the
 *  outgoing video's frame. */
type Plate = HTMLImageElement | HTMLCanvasElement;

interface GlitchState extends HoloGlitchRun<Plate> {
  fromAsset: CharacterEraHologram;
  toAsset: CharacterEraHologram;
  plan: GlitchPlan;
  start: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  raf: number;
}

const resolveAsset = (h: CharacterEraHologram | null | undefined): CharacterEraHologram | null =>
  h === undefined ? null : isCharacterEraHologram(h) ? h : CANONICAL_CHARACTER_ERA_HOLOGRAM;

/** An era's identity for the seed: its alpha path is one string per era. */
const idOf = (a: CharacterEraHologram) => a.videoAlphaPath;

/**
 * The era glitch (ADR-082 U42): the canvas, the plates it warms, the run.
 *
 * ⚠ IT PAINTS IN THE SAME TASK AS THE SWAP. `begin` is called from a LAYOUT
 * effect while the `<video>` still carries the outgoing `src` — the one moment
 * its frame can still be snapshotted — and it inserts the canvas and paints
 * frame 0 before returning, so the browser's next paint has the canvas over a
 * video that is already hidden. Defer any of it to a passive effect or a rAF
 * and the new poster flashes for one frame under the tear.
 *
 * ⚠ THE OUTGOING PLATE IS THE LIVE FRAME, THE INCOMING ONE IS ITS POSTER. A
 * `<video>` whose `src` has just changed draws nothing for a while, so the
 * kernel's "new" source is the era's alpha poster — frame zero, which is
 * exactly what the video paints first when it is shown again. The posters of
 * the neighbouring eras are decoded while the figure is near the viewport;
 * one that is not decoded yet means no glitch (the hard cut the station had).
 *
 * ⚠ THE FLOOR BRANCH IS A HARD CUT, DELIBERATELY. Safari without an era's
 * `.mov` composites that era on the opaque floor, and a run across a branch
 * flip would have to paint two compositing models at once; an engine with
 * neither codec keeps what it has. Named in the ADR as left open.
 */
function useHoloGlitch(args: {
  slotRef: React.RefObject<HTMLElement | null>;
  wrapRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  nearRef: React.MutableRefObject<boolean>;
  codec: HoloCodec;
  reduced: boolean;
  scanPitch: number;
}) {
  const { slotRef, wrapRef, videoRef, nearRef, codec } = args;
  const runRef = useRef<GlitchState | null>(null);
  const platesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const liveRef = useRef({ reduced: args.reduced, scanPitch: args.scanPitch, disposed: false });
  useLayoutEffect(() => {
    liveRef.current.reduced = args.reduced;
    liveRef.current.scanPitch = args.scanPitch;
  }, [args.reduced, args.scanPitch]);

  const alphaSrc = useCallback(
    (a: CharacterEraHologram) =>
      codec === "vp9" ? a.videoAlphaPath : codec === "hevc" ? a.videoAlphaHevcPath : undefined,
    [codec]
  );

  /** Decode a poster ahead of time. Idempotent; a failure leaves the plate
   *  absent, which is "no glitch", never a broken run. */
  const warm = useCallback((src: string) => {
    const plates = platesRef.current;
    if (plates.has(src) || pendingRef.current.has(src)) return;
    pendingRef.current.add(src);
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img
      .decode()
      .then(() => {
        if (!liveRef.current.disposed) plates.set(src, img);
      })
      .catch(() => {
        /* The glitch skips for this pair; the swap already happens. */
      })
      .finally(() => pendingRef.current.delete(src));
  }, []);

  const finish = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.canvas.remove();
    runRef.current = null;
    slotRef.current?.removeAttribute("data-vwh-glitch");
    // The video sat paused under the canvas (see the restart effect); its
    // first frame is the plate the run just resolved to, so this is a
    // continuation, not a cut.
    const v = videoRef.current;
    if (v && nearRef.current) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }, [slotRef, videoRef, nearRef]);

  const drawPlate = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      img: CanvasImageSource,
      rect: { x: number; y: number; w: number; h: number },
      band: GlitchBand,
      boxW: number,
      boxH: number
    ) => {
      const dy = band.y0 * boxH;
      const dh = (band.y1 - band.y0) * boxH;
      ctx.save();
      ctx.globalAlpha = band.alpha;
      ctx.beginPath();
      ctx.rect(0, dy, boxW, dh);
      ctx.clip();
      const dx = band.offsetX * boxW;
      if (band.cell <= 1.05) {
        ctx.drawImage(img, rect.x + dx, rect.y, rect.w, rect.h);
      } else {
        // Mosaic: downscale into the scratch canvas, then blow it back up
        // with smoothing off — the hero's own route to a hard-edged grid.
        const sw = Math.max(1, Math.round(boxW / band.cell));
        const sh = Math.max(1, Math.round(boxH / band.cell));
        if (!scratchRef.current) scratchRef.current = document.createElement("canvas");
        const scratch = scratchRef.current;
        scratch.width = sw;
        scratch.height = sh;
        const sctx = scratch.getContext("2d");
        if (sctx) {
          const k = sw / boxW;
          sctx.clearRect(0, 0, sw, sh);
          sctx.drawImage(img, (rect.x + dx) * k, rect.y * k, rect.w * k, rect.h * k);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(scratch, 0, 0, sw, sh, 0, 0, boxW, boxH);
          ctx.imageSmoothingEnabled = true;
        }
      }
      ctx.restore();
    },
    []
  );

  const paint = useCallback(
    (run: GlitchState, elapsedMs: number): boolean => {
      const { ctx, canvas } = run;
      const boxW = canvas.clientWidth;
      const boxH = canvas.clientHeight;
      const frame = glitchFrame(run.plan, elapsedMs);
      const rFrom = holoPlateRect(boxW, boxH, run.fromFit, run.fromAsset);
      const rTo = holoPlateRect(boxW, boxH, run.toFit, run.toAsset);
      /* ⚠ THE INCOMING PLATE IS THE ERA'S POSTER, NEVER THE `<video>` ELEMENT.
         Drawing the swapped video into the canvas was tried and measured:
         `drawImage` of this VP9-alpha stream paints NOTHING while the element
         sits paused at its load point (readyState 4, alpha 0 everywhere) and
         a half-bright picture at other moments — the frame under the canvas
         came out at mean 11.7/255 against the video's own 43.9. The poster is
         frame zero as a q82 WebP, which is what the element paints first when
         it is shown again; the hand-over from it to the crf-48 VP9 frame is a
         texture step the reader crosses on every load today. */
      ctx.clearRect(0, 0, boxW, boxH);
      for (const band of frame.bands) {
        const old = band.source === "old";
        const rect = old ? rFrom : rTo;
        if (!rect) continue;
        drawPlate(ctx, old ? run.from : run.to, rect, band, boxW, boxH);
      }
      if (frame.scanline) {
        // The fleck rides the FIGURE's own ink, never the void around it:
        // `source-atop` paints only where the bands already painted.
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = frame.scanline.alpha;
        ctx.fillStyle = frame.scanline.mix > 0.5 ? "rgb(236, 227, 214)" : "rgb(176, 139, 66)";
        ctx.fillRect(0, Math.round(frame.scanline.y * boxH), boxW, 1);
        ctx.restore();
      }
      return frame.done;
    },
    [drawPlate]
  );

  /** Start (or restart) a run from `from` to `to`. Returns false where the
   *  station falls back to the cut it had. */
  const begin = useCallback(
    (from: CharacterEraHologram, to: CharacterEraHologram): boolean => {
      const live = liveRef.current;
      if (live.reduced || codec === null || live.disposed) return false;
      if (typeof document === "undefined" || document.hidden) return false;
      if (!nearRef.current) return false;
      if (alphaSrc(from) === undefined || alphaSrc(to) === undefined) return false;
      const wrap = wrapRef.current;
      const slot = slotRef.current;
      if (!wrap || !slot) return false;
      const toPlate = platesRef.current.get(to.posterAlphaPath);
      if (!toPlate) {
        warm(to.posterAlphaPath);
        return false;
      }
      const toFit = holoFigureFit(to);
      // The capture's dev hook: a multiplier on the run so a still can hold a
      // mid-run frame. Absent everywhere else.
      const slowAttr = slot.closest(".vwd")?.getAttribute("data-vwh-glitch-slow");
      const slow = slowAttr ? Number(slowAttr) || 1 : 1;

      let run = runRef.current;
      if (run) {
        // Interrupted: restart from the plate the run was arriving at.
        const next = holoGlitchInterrupt(run, { toId: idOf(to), to: toPlate, toFit });
        run = {
          ...run,
          ...next,
          fromAsset: run.toAsset,
          toAsset: to,
          plan: holoGlitchPlan(next.fromId, next.toId, slow),
          start: performance.now(),
        };
        runRef.current = run;
        slot.setAttribute("data-vwh-glitch", `${next.fromId}>${next.toId}`);
      } else {
        // The outgoing plate: the live frame while the element still holds
        // it, else the outgoing era's own poster.
        let fromPlate: Plate | null = null;
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
          try {
            const snap = document.createElement("canvas");
            snap.width = v.videoWidth;
            snap.height = v.videoHeight;
            const sctx = snap.getContext("2d");
            if (sctx) {
              sctx.drawImage(v, 0, 0, snap.width, snap.height);
              /* ⚠ A PLAYING VIDEO DRAWS; ONE PAUSED AT ITS LOAD POINT DRAWS
                 NOTHING (measured: readyState 4, alpha 0 on every pixel). A
                 blank snapshot would tear an empty plate away, so the frame is
                 checked for ink on a coarse sample and the era's poster stands
                 in where there is none. */
              const probe = document.createElement("canvas");
              probe.width = 36;
              probe.height = 64;
              const pctx = probe.getContext("2d", { willReadFrequently: true });
              if (pctx) {
                pctx.drawImage(snap, 0, 0, probe.width, probe.height);
                const px = pctx.getImageData(0, 0, probe.width, probe.height).data;
                for (let i = 3; i < px.length; i += 4) {
                  if (px[i]! > 8) {
                    fromPlate = snap;
                    break;
                  }
                }
              }
            }
          } catch {
            fromPlate = null;
          }
        }
        if (!fromPlate) fromPlate = platesRef.current.get(from.posterAlphaPath) ?? null;
        if (!fromPlate) return false;

        const canvas = document.createElement("canvas");
        canvas.className = "vwh__glitch";
        canvas.setAttribute("aria-hidden", "true");
        // Before the edge bar, so the bar stays above it as it sits above the media.
        wrap.insertBefore(canvas, wrap.querySelector(".vwh__edge"));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          canvas.remove();
          return false;
        }
        const fromId = idOf(from);
        const toId = idOf(to);
        run = {
          fromId,
          toId,
          from: fromPlate,
          to: toPlate,
          fromFit: holoFigureFit(from),
          toFit,
          fromAsset: from,
          toAsset: to,
          plan: holoGlitchPlan(fromId, toId, slow),
          start: performance.now(),
          canvas,
          ctx,
          raf: 0,
        };
        runRef.current = run;
        slot.setAttribute("data-vwh-glitch", `${fromId}>${toId}`);
      }

      // Size the backing store to the box the sheet gave the canvas, and put
      // its scanline mask on the incoming video's own phase.
      const { canvas, ctx } = run;
      const boxW = canvas.clientWidth;
      const boxH = canvas.clientHeight;
      if (boxW <= 0 || boxH <= 0) {
        finish();
        return false;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, GLITCH_MAX_DPR);
      canvas.width = Math.max(1, Math.round(boxW * dpr));
      canvas.height = Math.max(1, Math.round(boxH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const phase = `0 ${holoScanPhase(boxH, run.toFit, live.scanPitch)}px`;
      canvas.style.setProperty("mask-position", phase);
      canvas.style.setProperty("-webkit-mask-position", phase);

      // Frame 0 in THIS task: the outgoing plate, whole, before anything paints.
      paint(run, 0);
      const active = run;
      const tick = () => {
        active.raf = 0;
        if (runRef.current !== active) return;
        const done = paint(active, performance.now() - active.start);
        if (done) {
          finish();
          return;
        }
        active.raf = requestAnimationFrame(tick);
      };
      if (active.raf) cancelAnimationFrame(active.raf);
      active.raf = requestAnimationFrame(tick);
      return true;
    },
    [alphaSrc, codec, finish, nearRef, paint, slotRef, videoRef, warm, wrapRef]
  );

  useEffect(() => {
    // A hidden tab stops rAF; the canvas would sit frozen over the video
    // until the tab came back. Finish instead — the video underneath is
    // already the new era.
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const live = liveRef.current;
    // Re-armed on every mount: a strict-mode double invoke would otherwise
    // leave `disposed` true for the component's whole life, and every plate
    // decode would be dropped with nothing to say so.
    live.disposed = false;
    return () => {
      live.disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      finish();
    };
  }, [finish]);

  return useMemo(() => ({ begin, warm, alphaSrc, runRef }), [begin, warm, alphaSrc]);
}

export function HoloFigure({
  src,
  videoSrc,
  hologram,
  neighbours,
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
  const slotRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
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

  const productionAsset = resolveAsset(hologram);
  // ⚠ LOCKED AT MOUNT, ON PURPOSE. The probe settles during page load and the
  // station is far down the corridor, so this is decided long before anyone
  // sees it — but reading it live would let a late verdict swap the <source>
  // under a playing element and restart the figure mid-view. `null` (undecided)
  // resolves to the floor path, which is the fail-safe branch.
  const [codec] = useState<HoloCodec>(() =>
    getHoloAlphaSupport() === true ? "vp9" : getHoloHevcAlphaSupport() === true ? "hevc" : null
  );
  const [, forceProbeSettled] = useState(0);
  useEffect(() => {
    // Only matters if the station somehow mounts before a probe settles;
    // re-render once so the very next mount reads a decided value. Both lanes
    // are watched because the HEVC one settles AFTER the VP9 one on Safari.
    const offVp9 =
      getHoloAlphaSupport() === null
        ? onHoloAlphaSupport(() => forceProbeSettled((n) => n + 1))
        : undefined;
    const offHevc =
      getHoloHevcAlphaSupport() === null
        ? onHoloHevcAlphaSupport(() => forceProbeSettled((n) => n + 1))
        : undefined;
    return () => {
      offVp9?.();
      offHevc?.();
    };
  }, []);

  const glitch = useHoloGlitch({ slotRef, wrapRef, videoRef, nearRef, codec, reduced, scanPitch });

  /* ⚠ THE BRANCH IS PER-ERA, NOT PER-ENGINE, AND THIS IS THE WHOLE TRAP. The
     codec verdict says what the ENGINE can composite; whether THIS era has a
     file in that format is a different question. `azeroth` ships no `.mov`
     (see `characterEras.ts`), so on Safari the engine answers "hevc" and the
     record answers "nothing" — and if the attribute still claimed alpha the
     CSS would switch the floor off over the opaque MP4 and paint the black
     pane this branch exists to remove. An era with no source for the locked
     codec falls all the way back to the floor. */
  const alphaSrcForCodec = productionAsset ? glitch.alphaSrc(productionAsset) : undefined;
  const alphaMedia = codec !== null && (reduced || alphaSrcForCodec !== undefined);

  const requestedPosterSrc =
    (alphaMedia ? productionAsset?.posterAlphaPath : productionAsset?.posterPath) ??
    src ??
    (alphaMedia
      ? CANONICAL_CHARACTER_ERA_HOLOGRAM.posterAlphaPath
      : CANONICAL_CHARACTER_ERA_HOLOGRAM.posterPath);
  const requestedVideoSrc = reduced
    ? undefined
    : ((alphaMedia ? alphaSrcForCodec : productionAsset?.videoPath) ?? videoSrc);
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

  /* ⚠ THE `<video>`'S `src` IS SET HERE, IMPERATIVELY, NEVER AS A PROP
     (ADR-082 U42). The era change has to be seen BEFORE the element lets go
     of its frame — a `src` React had already written would have emptied it by
     the time any effect ran — so the DOM keeps the outgoing era until this
     layout effect has snapshotted it, laid the canvas over it and painted
     frame 0; only then does the source move, all of it before the browser
     paints. Where the glitch cannot run (the floor branch, reduced motion, a
     plate not decoded, a hidden tab, the figure off screen, the first mount)
     this is the plain swap the station always had. */
  const shownRef = useRef<{ src: string | undefined; asset: CharacterEraHologram | null }>({
    src: undefined,
    asset: null,
  });
  useLayoutEffect(() => {
    const v = videoRef.current;
    const prev = shownRef.current;
    if (prev.src === playableVideoSrc && prev.asset === productionAsset) return;
    if (
      v &&
      prev.src !== undefined &&
      prev.asset &&
      productionAsset &&
      prev.asset !== productionAsset
    ) {
      glitch.begin(prev.asset, productionAsset);
    }
    shownRef.current = { src: playableVideoSrc, asset: productionAsset };
    if (v && playableVideoSrc !== undefined && v.getAttribute("src") !== playableVideoSrc) {
      v.src = playableVideoSrc;
    }
  }, [playableVideoSrc, productionAsset, glitch]);

  /* Warm the plates a step away (and this era's own, the fallback for an
     outgoing frame the element no longer holds) once the figure is near. */
  useEffect(() => {
    if (!near || codec === null || reduced) return;
    const targets = [productionAsset, ...(neighbours ?? [])];
    for (const a of targets) {
      if (!a || glitch.alphaSrc(a) === undefined) continue;
      glitch.warm(a.posterAlphaPath);
    }
  }, [near, codec, reduced, productionAsset, neighbours, glitch]);

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
      if (glitch.runRef.current) return; // the run's last frame plays it
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else if (!v.paused) {
      v.pause();
    }
  }, [near, playableVideoSrc, glitch]);

  // The video restarts with the era so its first frame is the poster the
  // reveal wipes onto — otherwise the figure materializes mid-gesture.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    // ⚠ UNDER A GLITCH IT WAITS. The canvas resolves to frame zero and hands
    // over on its last frame (`finish` plays it); played here it would be
    // 640ms into its loop when the canvas lifts, one gesture off its poster.
    if (glitch.runRef.current) return;
    // An era change can only be made with the station on screen; the near
    // gate just keeps a programmatic epoch bump from fetching a far loop.
    if (!nearRef.current) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [epoch, playableVideoSrc, glitch]);

  return (
    <figure
      ref={slotRef}
      className="vwh__slot"
      data-vwh-handoff-target="portrait"
      data-phase={phase}
      data-form={form}
      /* The compositing branch. Present ⇒ the media carries real alpha, so the
         floor, the additive blend and this slot's isolation are all switched
         off in CSS. Absent ⇒ the ADR-082 U2 floor path, unchanged. */
      /* ⚠ PRESENCE IS STILL THE CONTRACT — every `[data-holo-alpha]` selector
         and the boundaries spec's own `hasAttribute` read it that way — and the
         VALUE names which lane won, so a regression that lights the attribute
         with no alpha source behind it is visible rather than inferred. */
      data-holo-alpha={alphaMedia ? (codec ?? "") : undefined}
      data-vwh-frame-width={productionAsset?.frame.width}
      data-vwh-frame-height={productionAsset?.frame.height}
      data-vwh-head-y={productionAsset?.headY}
      data-vwh-foot-y={productionAsset?.footY}
      // A NON-STANDING pose's standing span (ADR-082 U32) — absent on every
      // standing era, so their markup is unchanged; the probes read it to
      // measure a kneeling figure by the man it draws, not by its ink.
      data-vwh-stature={
        productionAsset && "stature" in productionAsset ? productionAsset.stature : undefined
      }
      style={
        {
          "--holo-alpha": alpha,
          "--holo-scan": `${scanPitch}px`,
          "--holo-glow": glow,
          "--holo-blend": blend,
          "--holo-reveal-ms": `${REVEAL_MS}ms`,
          /* ⚠ EVERY ERA PAINTS THE SAME FIGURE HEIGHT (ADR-082 U25). The
             delivery canvas is normalised and the figure inside it is not, so
             this is the shrink that takes each era's own measured span down to
             `HOLO_FIGURE_SPAN`. Omitted where there is no registry asset (the
             figure lab passes bare `src`/`videoSrc`), and the sheet's
             `var(--holo-fit, 1)` is that branch. */
          ...(productionAsset ? { "--holo-fit": holoFigureFit(productionAsset) } : {}),
        } as React.CSSProperties
      }
    >
      {/* The floor the blend needs. Never remove it to "let the page
          through" — see the isolation note above. */}
      <div className="vwh__ground" aria-hidden="true" />

      <div className="vwh__media-wrap" ref={wrapRef}>
        {playableVideoSrc ? (
          <video
            ref={videoRef}
            className="vwh__media"
            /* `src` is written by the era-change layout effect above, never
               here — see it for why. */
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
        {/* The glitch canvas (`.vwh__glitch`) is inserted here, before the
            edge bar, for the length of an era change — see `useHoloGlitch`. */}
        {/* The edge bar rides the reveal line. */}
        <span className="vwh__edge" aria-hidden="true" />
      </div>

      {/* ⚠ NO SCANLINE OVERLAY. The cadence rides the media's own MASK
          (holo-lab.css) — an overlay that multiplies across the slot
          darkens the bare ground too and paints a black box around the
          hologram.
          ⚠ AND NO PROJECTION CONE (ADR-082 U35): its radial gold hot spot sat
          on the projector disc, and went with it — the "circular paint at
          the bottom" the owner asked to remove. */}
    </figure>
  );
}
