"use client";

import { useMemo } from "react";
import { easeInOutCubic, easeOutCubic, lerp } from "./easing";

/**
 * Scroll thresholds for definition→manifesto transition
 */
const DEF_TO_MANIFESTO_START = 0.25; // Start transforming at 25%
const DEF_TO_MANIFESTO_END = 0.35; // Complete transformation by 35%

/**
 * Frame dimension constants
 */
const BASE_WIDTH = 500;
const WIDTH_GROWTH = 200; // 500px → 700px
const BASE_HEIGHT = 100;
const HEIGHT_GROWTH = 300; // 100px → 400px (min-height)
const ACTUAL_CONTENT_HEIGHT = 640; // Actual terminal content height

export interface DefToManifestoTransitionResult {
  /** Eased transition progress (0 = definition, 1 = manifesto) */
  t: number;
  /** Raw (uneased) progress */
  rawT: number;
  /** Growth progress with ease-out */
  growthProgress: number;
  /** Current frame width */
  frameWidth: number;
  /** Current frame height */
  frameHeight: number;
  /** Frame bottom position (CSS calc string) */
  frameBottom: string;
  /** Frame left position (CSS calc string) */
  frameLeft: string;
  /** Frame transform (for horizontal centering) */
  frameTransform: string;
  /** Terminal background opacity */
  terminalOpacity: number;
  /** Terminal backdrop blur */
  terminalBlur: number;
  /** Terminal border opacity */
  terminalBorderOpacity: number;
  /** Whether height should be controlled (vs auto) */
  shouldControlHeight: boolean;
  /** Pointer events enabled */
  pointerEventsEnabled: boolean;
  /** Content padding top (for terminal header clearance) */
  contentPaddingTop: number;
}

/**
 * Hook that computes all definition→manifesto transition values.
 * Memoizes computations based on scrollProgress and tHeroToDef.
 *
 * @param scrollProgress - Normalized scroll progress (0-1)
 * @param tHeroToDef - Hero→Definition transition progress (from useHeroToDefTransition)
 * @returns Transition values for the definition→manifesto phase
 */
export function useDefToManifestoTransition(
  scrollProgress: number,
  tHeroToDef: number
): DefToManifestoTransitionResult {
  return useMemo(() => {
    // Calculate raw and eased progress
    const rawT = Math.max(
      0,
      Math.min(
        1,
        (scrollProgress - DEF_TO_MANIFESTO_START) / (DEF_TO_MANIFESTO_END - DEF_TO_MANIFESTO_START)
      )
    );
    const t = easeInOutCubic(rawT);

    // Apply smoother easing to growth
    const growthProgress = easeOutCubic(t);

    // Calculate frame dimensions
    const frameWidth = BASE_WIDTH + growthProgress * WIDTH_GROWTH;
    const frameHeight = BASE_HEIGHT + growthProgress * (ACTUAL_CONTENT_HEIGHT - BASE_HEIGHT);

    // Bottom positioning (continuous from hero→definition→manifesto)
    // Definition state: bottom = 50vh - 70px
    // Manifesto state: bottom = 50vh - (actualHeight/2) for centering
    const defBottomVh = 50;
    const defBottomPx = -70;
    const manifestoBottomVh = 50;
    const manifestoBottomPx = -(ACTUAL_CONTENT_HEIGHT / 2);

    // Hero→definition bottom calculation
    const heroBottomPx = 90 * (1 - tHeroToDef);
    const heroBottomVh = tHeroToDef * defBottomVh;
    const heroBottomOffsetPx = tHeroToDef * defBottomPx;

    // Definition position (when t = 0)
    const definitionBottomPx = heroBottomPx + heroBottomOffsetPx;
    const definitionBottomVh = heroBottomVh;

    // Interpolate to manifesto centered position
    const currentBottomPx = definitionBottomPx + (manifestoBottomPx - definitionBottomPx) * t;
    const currentBottomVh = definitionBottomVh + (manifestoBottomVh - definitionBottomVh) * t;

    const frameBottom = `calc(${currentBottomPx}px + ${currentBottomVh}vh)`;

    // Left position: 184px → 50% (centered)
    const frameLeft = `calc(${(1 - t) * 184}px + ${t * 50}%)`;

    // Transform for horizontal centering
    const frameTransform = `translateX(${-50 * t}%)`;

    // Terminal styling
    const terminalOpacity = t;
    const terminalBlur = 8 * t;
    const terminalBorderOpacity = 0.1 * t;

    // Height control
    const shouldControlHeight = t > 0;

    // Pointer events
    const pointerEventsEnabled = tHeroToDef > 0.95 || tHeroToDef < 0.05 || t > 0;

    // Content padding (for terminal header clearance)
    const contentPaddingTop = 16 + 56 * t;

    return {
      t,
      rawT,
      growthProgress,
      frameWidth,
      frameHeight,
      frameBottom,
      frameLeft,
      frameTransform,
      terminalOpacity,
      terminalBlur,
      terminalBorderOpacity,
      shouldControlHeight,
      pointerEventsEnabled,
      contentPaddingTop,
    };
  }, [scrollProgress, tHeroToDef]);
}

export { DEF_TO_MANIFESTO_START, DEF_TO_MANIFESTO_END, BASE_WIDTH, BASE_HEIGHT };
