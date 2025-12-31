"use client";

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// SVG LOADER COMPONENT
// ═══════════════════════════════════════════════════════════════

export interface DynamicSVGProps {
  src: string;
  color?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  preserveAspectRatio?: string;
}

// Component to load SVG files and apply dynamic colors
export function DynamicSVG({
  src,
  color = "#caa554",
  width,
  height,
  className,
  preserveAspectRatio = "xMidYMid meet",
}: DynamicSVGProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState<string>("0 0 100 100");

  useEffect(() => {
    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        // Extract viewBox from SVG
        const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/);
        if (viewBoxMatch) {
          setViewBox(viewBoxMatch[1]);
        }

        // Replace fill colors with dynamic color
        // Replace both fill="#CAA554" and fill="#caa554" and fill="currentColor"
        // Also handle the brand color in CSS style blocks
        let processed = text
          .replace(/fill="#?[Cc][Aa][Aa]554"/g, `fill="${color}"`)
          .replace(/fill="currentColor"/g, `fill="${color}"`)
          .replace(/fill="none"/g, `fill="none"`)
          .replace(/#?[Cc][Aa][Aa]554/g, color); // Catch style blocks and other hex mentions

        setSvgContent(processed);
      })
      .catch((err) => {
        console.error(`Failed to load SVG: ${src}`, err);
      });
  }, [src, color]);

  if (!svgContent) {
    return (
      <div
        style={{
          width: width || "100%",
          height: height || "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ opacity: 0.3 }}>Loading...</div>
      </div>
    );
  }

  // If no dimensions provided, let CSS handle sizing (for adaptive frames)
  // If only height is provided, set width to auto to preserve aspect ratio
  const hasNoDimensions = width === undefined && height === undefined;
  const containerWidth = hasNoDimensions ? "auto" : width !== undefined ? width : "auto";
  const containerHeight = hasNoDimensions ? "auto" : height !== undefined ? height : "auto";

  return (
    <div
      className={className}
      style={{
        width: containerWidth,
        height: containerHeight,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
