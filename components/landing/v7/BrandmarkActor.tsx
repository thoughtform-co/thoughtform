"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { BrandmarkGlyph } from "./BrandmarkGlyph";

const DEBUG_ENDPOINT = "http://127.0.0.1:7282/ingest/c41d9533-0bb9-4c99-abdb-1d9fed02e7e0";
const DEBUG_SESSION_ID = "31ead7";
const debugLastSentAt = new Map<string, number>();

function rectPayload(rect: DOMRect | null | undefined) {
  if (!rect) return null;
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top),
    left: Math.round(rect.left),
  };
}

function debugBrandmarkActor(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  if (process.env.NODE_ENV === "production") return;
  const key = `${location}:${message}`;
  const now = Date.now();
  if (now - (debugLastSentAt.get(key) ?? 0) < 120) return;
  debugLastSentAt.set(key, now);
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: "pre-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: now,
    }),
  }).catch(() => {});
}

export type BrandmarkActorHandle = {
  morphRects: (src: DOMRect, dst: DOMRect, t: number, easeFn: (n: number) => number) => void;
  pinToRect: (rect: DOMRect, opacity: number, scale?: number) => void;
  setArmed: (armed: boolean) => void;
  setHudOutline: (outline: boolean) => void;
  hide: () => void;
};

function morphShell(
  shell: HTMLElement,
  src: DOMRect,
  dst: DOMRect,
  t: number,
  easeFn: (n: number) => number
) {
  const u = easeFn(t);
  const L = src.left + (dst.left - src.left) * u;
  const T = src.top + (dst.top - src.top) * u;
  const W = src.width + (dst.width - src.width) * u;
  const H = src.height + (dst.height - src.height) * u;
  const sx = W / Math.max(src.width, 0.0001);
  const sy = H / Math.max(src.height, 0.0001);
  const dx = L - src.left;
  const dy = T - src.top;
  gsap.set(shell, {
    left: src.left,
    top: src.top,
    width: src.width,
    height: src.height,
    x: dx,
    y: dy,
    scaleX: sx,
    scaleY: sy,
    transformOrigin: "0 0",
    opacity: 1,
  });
}

export const BrandmarkActor = forwardRef<BrandmarkActorHandle>(
  function BrandmarkActor(_props, ref) {
    const shellRef = useRef<HTMLDivElement>(null);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const apply = () => setReduceMotion(mq.matches);
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }, []);

    const hide = useCallback(() => {
      const shell = shellRef.current;
      if (!shell) return;
      gsap.set(shell, { opacity: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, clearProps: "transform" });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        morphRects: (src, dst, t, easeFn) => {
          const shell = shellRef.current;
          if (!shell || reduceMotion) return;
          const before = shell.getBoundingClientRect();
          morphShell(shell, src, dst, t, easeFn);
          const after = shell.getBoundingClientRect();
          // #region agent log
          debugBrandmarkActor("H5", "BrandmarkActor.tsx:morphRects", "actor morph write", {
            t: Number(t.toFixed(4)),
            src: rectPayload(src),
            dst: rectPayload(dst),
            before: rectPayload(before),
            after: rectPayload(after),
            style: shell.getAttribute("style"),
          });
          // #endregion
        },
        pinToRect: (rect, opacity, scale = 1) => {
          const shell = shellRef.current;
          if (!shell || reduceMotion) return;
          const before = shell.getBoundingClientRect();
          gsap.set(shell, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            x: 0,
            y: 0,
            scaleX: scale,
            scaleY: scale,
            transformOrigin: "50% 50%",
            opacity,
          });
          const after = shell.getBoundingClientRect();
          // #region agent log
          debugBrandmarkActor("H1,H5", "BrandmarkActor.tsx:pinToRect", "actor pin write", {
            target: rectPayload(rect),
            opacity,
            scale,
            before: rectPayload(before),
            after: rectPayload(after),
            style: shell.getAttribute("style"),
          });
          // #endregion
        },
        setArmed: (armed) => {
          shellRef.current?.classList.toggle("tf-brandmark-actor--armed", armed);
        },
        setHudOutline: (outline) => {
          shellRef.current?.setAttribute("data-hud-outline", outline ? "true" : "false");
        },
        hide,
      }),
      [hide, reduceMotion]
    );

    if (reduceMotion) {
      return (
        <div
          ref={shellRef}
          className="tf-brandmark-actor tf-brandmark-actor--rm"
          aria-hidden="true"
        />
      );
    }

    return (
      <div
        ref={shellRef}
        className="tf-brandmark-actor"
        aria-hidden="true"
        data-hud-outline="false"
      >
        <BrandmarkGlyph
          className="tf-brandmark-actor__svg"
          filledClassName="tf-brandmark-actor__filled"
          outlineClassName="tf-brandmark-actor__outline"
          outline
          decorative
        />
      </div>
    );
  }
);

BrandmarkActor.displayName = "BrandmarkActor";
