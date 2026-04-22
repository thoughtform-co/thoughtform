"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SlotsMap } from "@/lib/celestial/schema";
import { CelestialConnector } from "./CelestialConnector";

interface CelestialPortalsProps {
  slots: SlotsMap;
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts a <CelestialConnector/> into each [data-celestial-slot] placeholder
 * found inside the dangerouslySetInnerHTML container. Cleans up on unmount.
 */
export function CelestialPortals({ slots, containerRef }: CelestialPortalsProps) {
  const rootsRef = useRef<Map<string, Root>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const slotEls = container.querySelectorAll<HTMLElement>("[data-celestial-slot]");
    const mounted = new Set<string>();

    slotEls.forEach((el) => {
      const slotId = el.dataset.celestialSlot;
      if (!slotId) return;
      const assignment = slots[slotId];
      if (!assignment || !assignment.enabled) return;

      mounted.add(slotId);

      let root = rootsRef.current.get(slotId);
      if (!root) {
        root = createRoot(el);
        rootsRef.current.set(slotId, root);
      }
      root.render(<CelestialConnector config={assignment.config} slotId={slotId} />);
    });

    return () => {
      rootsRef.current.forEach((root, id) => {
        root.unmount();
      });
      rootsRef.current.clear();
    };
  }, [slots, containerRef]);

  return null;
}
