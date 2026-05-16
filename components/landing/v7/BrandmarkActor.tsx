"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { BrandmarkGlyph } from "./BrandmarkGlyph";

/**
 * BrandmarkActor — the fixed-position SVG actor for the v7 brandmark
 * journey (ADR-013).
 *
 * In particle mode (the default) the actor is HIDDEN by CSS via the
 * `[data-brandmark-mode="particle"] .tf-brandmark-actor` rule — the
 * global `BrandmarkParticleCanvas` paints the brandmark cloud and
 * the actor has no role.
 *
 * In SVG-fallback mode (reduced motion or no WebGL) the actor is
 * the visible transit painter: `useBrandmarkJourney` pins it to the
 * journey transform's rect via `pinToRect(rect, opacity)` every
 * scroll frame. At parked stations with a native dock
 * (sigil / miss / rail) the actor is hidden by CSS (the native dock
 * SVG paints); at parked-orbit (no native dock) and during transit
 * the actor is the visible mark.
 *
 * Retired in ADR-013 Phase 4b:
 *   - `morphRects` imperative API — never called by the journey hook,
 *     which uses `pinToRect` for every state. Dead code.
 *   - Debug telemetry POST to `localhost:7282` — diagnostic plumbing
 *     from a one-off investigation, no longer needed.
 */

export type BrandmarkActorHandle = {
  pinToRect: (rect: DOMRect, opacity: number, scale?: number) => void;
  setArmed: (armed: boolean) => void;
  setHudOutline: (outline: boolean) => void;
  hide: () => void;
};

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
        pinToRect: (rect, opacity, scale = 1) => {
          const shell = shellRef.current;
          if (!shell) return;
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
        },
        setArmed: (armed) => {
          shellRef.current?.classList.toggle("tf-brandmark-actor--armed", armed);
        },
        setHudOutline: (outline) => {
          shellRef.current?.setAttribute("data-hud-outline", outline ? "true" : "false");
        },
        hide,
      }),
      [hide]
    );

    // Reduced-motion users get an empty shell; the journey hook
    // still pins it (in SVG mode) but the inline opacity stays 0 so
    // there's no transit motion — the native dock SVGs at their
    // parked positions are the only visible paints.
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
