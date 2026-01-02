// useElementSize Hook
// =============================================================================
// ResizeObserver-based hook for measuring element dimensions
// Enables 9-slice-style layouts where corners stay fixed while edges stretch

import { useState, useEffect, useRef, useCallback } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Hook to observe and return element dimensions using ResizeObserver
 *
 * @param debounceMs - Optional debounce delay (default: 0 for immediate updates)
 * @returns [ref, size] - Ref to attach to element, current size
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [ref, size] = useElementSize();
 *
 *   return (
 *     <div ref={ref}>
 *       Width: {size.width}, Height: {size.height}
 *     </div>
 *   );
 * }
 * ```
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(
  debounceMs = 0
): [React.RefCallback<T>, ElementSize] {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Ref callback - called when element mounts/unmounts
  const refCallback = useCallback(
    (node: T | null) => {
      // Cleanup previous observer
      cleanup();

      if (node) {
        elementRef.current = node;

        // Create new observer
        observerRef.current = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;

          const { width, height } = entry.contentRect;

          const updateSize = () => {
            setSize((prev) => {
              // Only update if dimensions actually changed (avoid unnecessary re-renders)
              if (prev.width === width && prev.height === height) {
                return prev;
              }
              return { width, height };
            });
          };

          if (debounceMs > 0) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(updateSize, debounceMs);
          } else {
            updateSize();
          }
        });

        observerRef.current.observe(node);

        // Set initial size
        const rect = node.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      } else {
        elementRef.current = null;
      }
    },
    [cleanup, debounceMs]
  );

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return [refCallback, size];
}
