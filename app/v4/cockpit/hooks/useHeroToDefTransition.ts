"use client";

import { useMemo } from "react";
import { easeInOutCubic, lerp } from "./easing";

/**
 * Fixed scroll thresholds for hero→definition transition
 */
const HERO_END = 0; // Transition starts immediately on scroll
const DEF_START = 0.12; // Transition completes by 12% of total scroll

export interface HeroToDefTransitionResult {
  /** Eased transition progress (0 = hero, 1 = definition) */
  t: number;
  /** Raw (uneased) progress */
  rawT: number;
  /** Whether to show SVG Vector I (only at start) */
  showSvgVector: boolean;
  /** Hero Wordmark opacity */
  heroWordmarkOpacity: number;
  /** Hero Wordmark visibility */
  heroWordmarkVisible: boolean;
  /** Definition Wordmark opacity */
  defWordmarkOpacity: number;
  /** Definition Wordmark visibility */
  defWordmarkVisible: boolean;
  /** Wordmark container top position */
  wordmarkTop: (isMobile: boolean) => string | undefined;
  /** Wordmark container opacity */
  wordmarkContainerOpacity: number;
  /** Wordmark container visibility */
  wordmarkContainerVisible: boolean;
  /** Brandmark (embedded compass) opacity */
  brandmarkOpacity: number;
  /** Particle morph progress (for ParticleWordmarkMorph) */
  particleMorphProgress: number;
  /** Particle morph visibility */
  particleMorphVisible: boolean;
  /** Runway arrows opacity */
  runwayArrowsOpacity: number;
  /** Runway arrows visibility */
  runwayArrowsVisible: boolean;
}

/**
 * Hook that computes all hero→definition transition values.
 * Memoizes computations based on scrollProgress.
 *
 * @param scrollProgress - Normalized scroll progress (0-1)
 * @returns Transition values for the hero→definition phase
 */
export function useHeroToDefTransition(scrollProgress: number): HeroToDefTransitionResult {
  return useMemo(() => {
    // Calculate raw and eased progress
    const rawT = Math.max(0, Math.min(1, (scrollProgress - HERO_END) / (DEF_START - HERO_END)));
    const t = easeInOutCubic(rawT);

    // SVG Vector I only visible at very start
    const showSvgVector = scrollProgress < 0.02;

    // Hero Wordmark - stays visible until particles fully take over
    const heroWordmarkOpacity = t < 0.15 ? 1 : t < 0.35 ? 1 - (t - 0.15) / 0.2 : 0;
    const heroWordmarkVisible = t <= 0.35;

    // Definition Wordmark - fades in at end of transition
    const defWordmarkOpacity = t > 0.75 ? (t - 0.75) / 0.25 : 0;
    const defWordmarkVisible = t > 0.7;

    // Wordmark container position and visibility
    const wordmarkTop = (isMobile: boolean): string | undefined => {
      if (isMobile) return undefined;
      return `calc(${lerp(90, 0, t)}px + ${lerp(0, 50, t)}vh - ${lerp(0, 125, t)}px)`;
    };

    // Wordmark container fades out by 30%
    const wordmarkContainerOpacity =
      scrollProgress < 0.25 ? 1 : scrollProgress < 0.3 ? 1 - (scrollProgress - 0.25) / 0.05 : 0;
    const wordmarkContainerVisible = scrollProgress < 0.3;

    // Brandmark (compass in the O) fades with transition
    const brandmarkOpacity = 1 - t;

    // Particle morph visible during mid-transition
    const particleMorphProgress = t < 0.15 ? 0 : t > 0.85 ? 1 : (t - 0.15) / 0.7;
    const particleMorphVisible = t > 0.1 && t < 0.9;

    // Runway arrows fade out quickly
    const runwayArrowsOpacity = t < 0.02 ? 1 : t < 0.08 ? 1 - (t - 0.02) / 0.06 : 0;
    const runwayArrowsVisible = t < 0.1;

    return {
      t,
      rawT,
      showSvgVector,
      heroWordmarkOpacity,
      heroWordmarkVisible,
      defWordmarkOpacity,
      defWordmarkVisible,
      wordmarkTop,
      wordmarkContainerOpacity,
      wordmarkContainerVisible,
      brandmarkOpacity,
      particleMorphProgress,
      particleMorphVisible,
      runwayArrowsOpacity,
      runwayArrowsVisible,
    };
  }, [scrollProgress]);
}

export { HERO_END, DEF_START };
