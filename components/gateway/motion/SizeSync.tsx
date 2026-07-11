"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Fallback size synchronizer for the treatment canvases. R3F sizes via
 * ResizeObserver, but the initial measure can be missed when the canvas
 * mounts late (post-texture-load) or in a hidden/background tab where
 * observers and rAF are frozen. Strategy: retry on a short timer burst
 * after mount until the drawing buffer agrees with the container rect,
 * then stay passive on resize/visibilitychange events.
 */
export function SizeSync() {
  const gl = useThree((s) => s.gl);
  const setSize = useThree((s) => s.setSize);

  useEffect(() => {
    const sync = () => {
      const el = gl.domElement.parentElement;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      const dpr = gl.getPixelRatio();
      const drifted =
        Math.abs(gl.domElement.width - rect.width * dpr) > 2 ||
        Math.abs(gl.domElement.height - rect.height * dpr) > 2;
      if (drifted) setSize(rect.width, rect.height);
      return !drifted;
    };

    // Timer burst (not rAF — timers still fire, throttled, in hidden tabs):
    // every 150ms until two consecutive clean checks or ~4s elapsed.
    let cleanStreak = 0;
    let shots = 0;
    const interval = window.setInterval(() => {
      shots++;
      cleanStreak = sync() ? cleanStreak + 1 : 0;
      if (cleanStreak >= 2 || shots > 26) window.clearInterval(interval);
    }, 150);

    const onEvent = () => sync();
    window.addEventListener("resize", onEvent);
    document.addEventListener("visibilitychange", onEvent);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", onEvent);
      document.removeEventListener("visibilitychange", onEvent);
    };
  }, [gl, setSize]);

  return null;
}
