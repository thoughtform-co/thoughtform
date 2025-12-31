"use client";

import { useState, useEffect, memo, useMemo } from "react";

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

// Simple in-memory cache for fetched SVG text
// Avoids re-fetching the same SVG multiple times
const svgCache = new Map<string, string>();

// Process SVG text with color replacement
function processSVGText(text: string, color: string): string {
  return text
    .replace(/fill="#?[Cc][Aa][Aa]554"/g, `fill="${color}"`)
    .replace(/fill="currentColor"/g, `fill="${color}"`)
    .replace(/fill="none"/g, `fill="none"`)
    .replace(/#?[Cc][Aa][Aa]554/g, color); // Catch style blocks and other hex mentions
}

// Component to load SVG files and apply dynamic colors
function DynamicSVGInner({
  src,
  color = "#caa554",
  width,
  height,
  className,
  preserveAspectRatio = "xMidYMid meet",
}: DynamicSVGProps) {
  const [rawSVG, setRawSVG] = useState<string | null>(() => svgCache.get(src) ?? null);
  const [isLoading, setIsLoading] = useState(!svgCache.has(src));

  // Fetch SVG if not cached
  useEffect(() => {
    if (svgCache.has(src)) {
      setRawSVG(svgCache.get(src)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        svgCache.set(src, text);
        setRawSVG(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to load SVG: ${src}`, err);
        setIsLoading(false);
      });
  }, [src]);

  // Process SVG with color replacement (memoized)
  const svgContent = useMemo(() => {
    if (!rawSVG) return null;
    return processSVGText(rawSVG, color);
  }, [rawSVG, color]);

  if (isLoading || !svgContent) {
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

// Memoized export - prevents re-renders when parent changes but props don't
export const DynamicSVG = memo(DynamicSVGInner);
