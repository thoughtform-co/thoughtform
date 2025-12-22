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
        newProgress = Math.min(1, currentProgress + delta * scrollSpeed);
      } else {
        // Scrolling up - decrease progress (but not below 0)
        newProgress = Math.max(0, currentProgress + delta * scrollSpeed);
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

      // Prevent default scroll and update progress
      e.preventDefault();
      e.stopPropagation();

      if (newProgress !== currentProgress) {
        progressRef.current = newProgress;
        onProgressChange(newProgress);
      }
    },
    [isActive, scrollSpeed, onProgressChange, onComplete]
  );

  // Add/remove wheel listener
  useEffect(() => {
    if (isActive) {
      setIsCapturing(true);
      // Use passive: false to allow preventDefault
      window.addEventListener("wheel", handleWheel, { passive: false });
      // Also capture touchmove for mobile
      const handleTouchMove = (e: TouchEvent) => {
        if (!isActive || progressRef.current >= 1) return;
        // Simple touch handling - could be improved
        e.preventDefault();
      };
      window.addEventListener("touchmove", handleTouchMove, { passive: false });

      return () => {
        window.removeEventListener("wheel", handleWheel);
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
