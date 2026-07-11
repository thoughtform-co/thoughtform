"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { GatewayVisualEntry } from "@/lib/gateway-motion/manifest";
import { readProgress, type ScrollProgressRef } from "./useScrollProgressRef";
import "./motion.css";

export interface KenBurnsConfig extends Record<string, number> {
  /** Scale at scrollProgress 0 / 1. */
  zoomFrom: number;
  zoomTo: number;
  /** Transform origin as fractions of the frame (artifact sits right-of-center). */
  originX: number;
  originY: number;
  /** Vertical travel across the scroll range, in % of stage height. */
  travelY: number;
}

export const KENBURNS_DEFAULTS: KenBurnsConfig = {
  zoomFrom: 1.06,
  zoomTo: 1.22,
  originX: 0.7,
  originY: 0.45,
  travelY: -4,
};

/**
 * Treatment 1 — scroll-linked Ken Burns on the raw plate.
 * <picture> AVIF→WebP with the browser picking width via srcSet; a gsap
 * quickTo pair smooths scale + translateY toward the scroll target each
 * frame; a CSS wrapper adds a 90s idle drift so the plate never sits
 * perfectly still. Under prefers-reduced-motion everything freezes to the
 * zoomFrom frame (drift + grain are disabled in motion.css).
 *
 * Also the universal fallback: no WebGL, no depth assets required.
 */
export function KenBurnsGateway({
  entry,
  progressRef,
  active,
  config = KENBURNS_DEFAULTS,
  drift = true,
}: {
  entry: GatewayVisualEntry;
  progressRef: React.MutableRefObject<ScrollProgressRef>;
  active: boolean;
  config?: KenBurnsConfig;
  /** Idle drift wrapper — off for the Living Plate mode, which needs a
   *  perfectly still plate so the star-twinkle overlay stays registered. */
  drift?: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const { avifSrcSet, webpSrcSet, fallbackSrc } = useMemo(() => {
    const toSrcSet = (sources: { w: number; src: string }[]) =>
      [...sources]
        .sort((a, b) => a.w - b.w)
        .map((s) => `${s.src} ${s.w}w`)
        .join(", ");
    const webpSorted = [...entry.plate.webp].sort((a, b) => b.w - a.w);
    return {
      avifSrcSet: toSrcSet(entry.plate.avif),
      webpSrcSet: toSrcSet(entry.plate.webp),
      fallbackSrc: webpSorted[0]?.src ?? "",
    };
  }, [entry]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !active) return;

    gsap.set(img, {
      transformOrigin: `${config.originX * 100}% ${config.originY * 100}%`,
      scale: config.zoomFrom,
      yPercent: 0,
    });
    if (reducedMotion) return;

    const toScale = gsap.quickTo(img, "scale", { duration: 0.6, ease: "power3" });
    const toY = gsap.quickTo(img, "yPercent", { duration: 0.6, ease: "power3" });

    let raf = 0;
    const tick = () => {
      const p = readProgress(progressRef.current);
      toScale(config.zoomFrom + (config.zoomTo - config.zoomFrom) * p);
      toY(config.travelY * p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      gsap.killTweensOf(img);
    };
  }, [active, config, progressRef, reducedMotion]);

  return (
    <div className={drift ? "gwm-kenburns__drift" : "gwm-stage__layer"}>
      <picture>
        {avifSrcSet ? <source type="image/avif" srcSet={avifSrcSet} sizes="100vw" /> : null}
        <img
          ref={imgRef}
          className="gwm-kenburns__img"
          srcSet={webpSrcSet}
          sizes="100vw"
          src={fallbackSrc}
          alt={entry.name}
          draggable={false}
          decoding="async"
        />
      </picture>
    </div>
  );
}
