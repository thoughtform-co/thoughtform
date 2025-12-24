import { useEffect, useRef, useCallback, useState } from "react";

interface UseScrollCaptureOptions {
  /** Whether scroll capture is active */
  isActive: boolean;
  /** Callback when progress changes (0-1) */
  onProgressChange: (progress: number) => void;
  /** Current progress value */
  progress: number;
  /** Speed multiplier for scroll (default: 0.002) */
  scrollSpeed?: number;
  /** Callback when capture completes (progress reaches 1) */
  onComplete?: () => void;
  /**
   * Optional: when the user scrolls past completion in the same wheel gesture,
   * release that "extra" scroll as a smooth page scroll (Lenis) so we don't hard-stop.
   * Value is in pixels (wheel delta space).
   */
  onReleaseScrollPx?: (scrollByPx: number) => void;
}

/**
 * Hook to capture scroll events and convert them to progress (0-1)
 * Used for manifesto reveal - scroll events increment progress instead of scrolling the page
 */
export function useScrollCapture({
  isActive,
  onProgressChange,
  progress,
  scrollSpeed = 0.002,
  onComplete,
  onReleaseScrollPx,
}: UseScrollCaptureOptions) {
  const progressRef = useRef(progress);
  const hasCompletedRef = useRef(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Keep ref in sync with prop
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Reset completion flag when deactivated
  useEffect(() => {
    if (!isActive) {
      hasCompletedRef.current = false;
    }
  }, [isActive]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!isActive) return;

      // Only capture downward scroll (positive deltaY)
      // Allow upward scroll to potentially go back
      const delta = e.deltaY;

      // Calculate new progress
      const currentProgress = progressRef.current;
      let newProgress: number;

      if (delta > 0) {
        // Scrolling down - increase progress
        const rawProgress = currentProgress + delta * scrollSpeed;
        newProgress = Math.min(1, rawProgress);
      } else {
        // Scrolling up - decrease progress (but not below 0)
        newProgress = Math.max(0, currentProgress + delta * scrollSpeed);
      }

      // If we reached completion in this same wheel event, mark complete immediately
      // and "release" the remaining wheel delta as a smooth page scroll (Lenis).
      if (delta > 0 && newProgress >= 1) {
        // How much of this wheel delta was "used" to reach progress=1?
        const progressNeeded = 1 - currentProgress;
        const deltaUsed = progressNeeded > 0 ? progressNeeded / scrollSpeed : 0;
        const remainderDeltaPx = Math.max(0, delta - deltaUsed);

        // Prevent Lenis from banking the wheel event; we will re-emit remainder ourselves.
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();

        if (currentProgress !== 1) {
          progressRef.current = 1;
          onProgressChange(1);
        }

        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();

          // Provide a little inertia even if remainder is tiny (mouse wheels often land close to exact).
          // Cap so we don't jump too far.
          const minCarryPx = Math.min(180, Math.max(0, delta * 0.35));
          const carryPx = Math.min(560, Math.max(remainderDeltaPx, minCarryPx));
          if (carryPx > 1) {
            onReleaseScrollPx?.(carryPx);
          }
        }

        return;
      }

      // If progress is at 1 and scrolling down, allow normal scroll
      if (currentProgress >= 1 && delta > 0) {
        // Don't prevent default - let normal scroll happen
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
        return;
      }

      // If progress is at 0 and scrolling up, allow normal scroll
      if (currentProgress <= 0 && delta < 0) {
        return;
      }

      // Prevent default scroll and update progress.
      // IMPORTANT: stop Lenis (and any other wheel listeners) from receiving these wheel events,
      // otherwise momentum gets "banked" and released as an abrupt jump when capture ends.
      // We rely on registering this handler in the CAPTURE phase (see effect below).
      e.stopImmediatePropagation();
      e.preventDefault();
      e.stopPropagation();

      if (newProgress !== currentProgress) {
        progressRef.current = newProgress;
        onProgressChange(newProgress);
      }
    },
    [isActive, scrollSpeed, onProgressChange, onComplete, onReleaseScrollPx]
  );

  // Add/remove wheel listener
  useEffect(() => {
    if (isActive) {
      setIsCapturing(true);
      // Use passive: false to allow preventDefault
      // Use capture phase so we run before Lenis' wheel handler
      window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
      // Also capture touchmove for mobile
      const handleTouchMove = (e: TouchEvent) => {
        if (!isActive || progressRef.current >= 1) return;
        // Simple touch handling - could be improved
        e.preventDefault();
      };
      window.addEventListener("touchmove", handleTouchMove, { passive: false });

      return () => {
        window.removeEventListener("wheel", handleWheel, { capture: true });
        window.removeEventListener("touchmove", handleTouchMove);
        setIsCapturing(false);
      };
    } else {
      setIsCapturing(false);
    }
  }, [isActive, handleWheel]);

  return {
    isCapturing,
    progress: progressRef.current,
  };
}

export default useScrollCapture;
