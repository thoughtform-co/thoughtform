"use client";

import { useEffect, useRef, useState } from "react";

interface SelectionConnectorProps {
  /** CSS selector to find the selected element (e.g. ".tree-node-trigger--selected") */
  selector: string;
  /** X position of the rail line (in viewport coordinates) */
  railX?: number;
}

/**
 * SelectionConnector - Renders a horizontal line from the HUD rail to a selected element
 *
 * Uses an SVG overlay positioned fixed to the viewport, similar to ConnectorLines on the homepage.
 * The line originates from the left HUD rail and extends to the selected tree item.
 */
export function SelectionConnector({ selector, railX = 64 }: SelectionConnectorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const diamondRef = useRef<SVGRectElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let animationFrameId: number;
    let lastY = 0;
    let lastTargetX = 0;
    let currentY = 0;
    let currentTargetX = 0;

    const updateLine = () => {
      const selectedElement = document.querySelector(selector);

      if (!selectedElement || !pathRef.current || !diamondRef.current) {
        setIsVisible(false);
        animationFrameId = requestAnimationFrame(updateLine);
        return;
      }

      const rect = selectedElement.getBoundingClientRect();

      // Target is shorter than the category buttons - stop about 45px before the element
      const targetX = rect.left - 45; // Stop before the element for cleaner look
      const targetY = rect.top + rect.height / 2;

      // Smooth interpolation for fluid movement
      const lerpSpeed = 0.25;

      if (!isVisible) {
        // Snap to position on first appearance
        currentY = targetY;
        currentTargetX = targetX;
      } else {
        // Smooth transition
        currentY += (targetY - currentY) * lerpSpeed;
        currentTargetX += (targetX - currentTargetX) * lerpSpeed;
      }

      // Only update DOM if position changed significantly
      if (Math.abs(currentY - lastY) > 0.5 || Math.abs(currentTargetX - lastTargetX) > 0.5) {
        // Draw horizontal line from rail to selected element
        const path = `M ${railX} ${currentY} L ${currentTargetX} ${currentY}`;
        pathRef.current.setAttribute("d", path);

        // Position diamond at the rail end
        diamondRef.current.setAttribute("x", String(railX - 4));
        diamondRef.current.setAttribute("y", String(currentY - 4));

        lastY = currentY;
        lastTargetX = currentTargetX;
      }

      setIsVisible(true);
      animationFrameId = requestAnimationFrame(updateLine);
    };

    animationFrameId = requestAnimationFrame(updateLine);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [selector, railX, isVisible]);

  return (
    <svg
      ref={svgRef}
      className="selection-connector"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 50,
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.15s ease-out",
      }}
    >
      {/* Horizontal connector line */}
      <path
        ref={pathRef}
        fill="none"
        stroke="var(--gold, #caa554)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Diamond marker at rail intersection */}
      <rect
        ref={diamondRef}
        width="8"
        height="8"
        fill="var(--gold, #caa554)"
        transform="rotate(45)"
        style={{
          transformOrigin: "center",
          transformBox: "fill-box",
          filter: "drop-shadow(0 0 6px rgba(202, 165, 84, 0.5))",
        }}
      />
    </svg>
  );
}
