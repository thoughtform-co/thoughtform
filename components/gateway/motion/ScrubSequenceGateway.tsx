"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { GatewayVisualEntry } from "@/lib/gateway-motion/manifest";
import {
  coverRect,
  frameUrl,
  nearestLoaded,
  preloadOrder,
  progressToFrame,
} from "@/lib/gateway-motion/scrub-math";
import { readProgress, type ScrollProgressRef } from "./useScrollProgressRef";

const PRELOAD_CONCURRENCY = 6;
/** Poster hands off to the canvas once this fraction of frames is decoded. */
const READY_FRACTION = 0.25;

/**
 * Treatment 5 — scroll-scrubbed frame sequence (the Apple product-page
 * technique, and the web delivery contract for TouchDesigner/Unreal
 * renders — see docs/gateway-motion/). Frames preload center-out so any
 * scroll position finds a nearby decoded frame; the canvas redraws only
 * when the resolved frame index changes. The proxy sequence packaged from
 * the existing AI video proves the pipeline; final renders drop into the
 * same SequenceMeta without code changes.
 */
export function ScrubSequenceGateway({
  entry,
  active,
  progressRef,
}: {
  entry: GatewayVisualEntry;
  active: boolean;
  progressRef: MutableRefObject<ScrollProgressRef>;
}) {
  const sequence = entry.sequence;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<Map<number, ImageBitmap>>(new Map());
  const loadedSetRef = useRef<Set<number>>(new Set());
  const [loadedCount, setLoadedCount] = useState(0);
  const [posterGone, setPosterGone] = useState(false);

  // Preload queue.
  useEffect(() => {
    if (!sequence) return;
    const frames = framesRef.current;
    const loadedSet = loadedSetRef.current;
    frames.clear();
    loadedSet.clear();

    const controller = new AbortController();
    const order = preloadOrder(sequence.frameCount);
    let cursor = 0;
    let done = 0;

    const worker = async () => {
      while (cursor < order.length && !controller.signal.aborted) {
        const index = order[cursor++];
        try {
          const res = await fetch(frameUrl(sequence.urlPattern, index), {
            signal: controller.signal,
          });
          if (!res.ok) continue;
          const bitmap = await createImageBitmap(await res.blob());
          if (controller.signal.aborted) {
            bitmap.close();
            return;
          }
          frames.set(index, bitmap);
          loadedSet.add(index);
          done++;
          // Batch React updates: every 8 frames + the finish line.
          if (done % 8 === 0 || done === sequence.frameCount) setLoadedCount(done);
        } catch {
          if (controller.signal.aborted) return;
        }
      }
    };
    // .catch guard: an abort mid-flight (fast unmount, StrictMode double
    // invoke) must never surface as an unhandled rejection.
    for (let i = 0; i < PRELOAD_CONCURRENCY; i++) void worker().catch(() => {});

    return () => {
      controller.abort();
      for (const bmp of frames.values()) bmp.close();
      frames.clear();
      loadedSet.clear();
      // Reset display state for the next sequence (initial mount is 0/false).
      setLoadedCount(0);
      setPosterGone(false);
    };
  }, [sequence]);

  // Draw loop — redraw only when the resolved frame changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sequence || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let drawnFrame = -1;
    let sizedW = 0;
    let sizedH = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(1, Math.round(rect.width * dpr));
      const H = Math.max(1, Math.round(rect.height * dpr));

      const target = progressToFrame(readProgress(progressRef.current), sequence.frameCount);
      const frame = nearestLoaded(target, loadedSetRef.current);
      if (frame === null) return;
      if (frame === drawnFrame && W === sizedW && H === sizedH) return;

      if (W !== sizedW || H !== sizedH) {
        canvas.width = W;
        canvas.height = H;
        sizedW = W;
        sizedH = H;
      }
      const bmp = framesRef.current.get(frame);
      if (!bmp) return;
      const r = coverRect(bmp.width, bmp.height, W, H);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(bmp, r.dx, r.dy, r.dw, r.dh);
      drawnFrame = frame;
      if (!posterGone) setPosterGone(true);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [sequence, active, progressRef, posterGone]);

  if (!sequence) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: "#ebe3d6",
          fontFamily: "var(--font-mono, 'PT Mono', monospace)",
          fontSize: 12,
          textAlign: "center",
          padding: 32,
        }}
      >
        <div>
          <p style={{ color: "#caa554", marginBottom: 8 }}>NO SEQUENCE FOR {entry.id}</p>
          <p style={{ opacity: 0.7, maxWidth: 480 }}>
            Package one with:
            <br />
            <code>
              npm run gateway:frames -- --input public/videos/thoughtform-key-visual-2-web.mp4
              --visual {entry.id} --fps 24 --width 1280
            </code>
          </p>
        </div>
      </div>
    );
  }

  const ready = loadedCount / sequence.frameCount >= READY_FRACTION;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      {/* Poster holds the frame until enough of the sequence is decoded. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- raw public asset */}
      <img
        src={sequence.poster}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: posterGone && ready ? 0 : 1,
          transition: "opacity 480ms ease",
          pointerEvents: "none",
        }}
      />
      {loadedCount < sequence.frameCount ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            height: 2,
            width: `${(loadedCount / sequence.frameCount) * 100}%`,
            background: "#caa554",
            opacity: 0.8,
            transition: "width 200ms linear",
          }}
        />
      ) : null}
    </>
  );
}
