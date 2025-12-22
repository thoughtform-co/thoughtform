"use client";

import { cn } from "@/lib/utils";
import type { Element, DividerContent } from "@/lib/types";

interface DividerElementProps {
  element: Element;
  isEditing: boolean;
}

export function DividerElement({ element, isEditing }: DividerElementProps) {
  const content = element.content as DividerContent;
  const isHorizontal = content.orientation === "horizontal";

  // Map color tokens to actual colors (simplified)
  const getColor = (colorToken: string | undefined): string => {
    if (!colorToken) return "rgba(255, 255, 255, 0.15)";
    if (colorToken.startsWith("#") || colorToken.startsWith("rgb")) return colorToken;
    // Handle design system tokens
    const tokens: Record<string, string> = {
      "dawn-15": "rgba(255, 255, 255, 0.15)",
      "dawn-30": "rgba(255, 255, 255, 0.30)",
      "dawn-50": "rgba(255, 255, 255, 0.50)",
      gold: "#D4AF37",
    };
    return tokens[colorToken] ?? colorToken;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isHorizontal ? "w-full h-full" : "h-full w-full"
      )}
      style={{
        opacity: element.opacity ?? 1,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      }}
    >
      <div
        style={{
          width: isHorizontal ? "100%" : `${content.thickness ?? 1}px`,
          height: isHorizontal ? `${content.thickness ?? 1}px` : "100%",
          backgroundColor: getColor(content.color),
          borderStyle: content.style ?? "solid",
        }}
      />
    </div>
  );
}

export default DividerElement;
