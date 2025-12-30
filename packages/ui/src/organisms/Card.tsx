// Card Organism
// =============================================================================
// Frame-based card with content, terminal, and data tiers

import * as React from "react";
import { cn } from "../utils/cn";
import {
  Frame,
  type CornerToken,
  type CornerPreset,
  type SurfaceVariant,
} from "../molecules/Frame";
import { gold, dawn } from "../tokens/colors";
import { fontFamily, fontSize } from "../tokens/typography";

export type CardTier = "content" | "terminal" | "data";
export type AccentPosition = "none" | "top" | "left";
export type AccentColor = "gold" | "dawn" | "verde";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card tier determines default styling */
  tier?: CardTier;
  /** Card title */
  title?: React.ReactNode;
  /** Label text (shown in header) */
  label?: string;
  /** Index number (e.g., "01") */
  index?: string;
  /** Accent bar position */
  accent?: AccentPosition;
  /** Accent bar color */
  accentColor?: AccentColor;
  /** Corner configuration (passed to Frame) */
  corners?: CornerToken;
  /** Corner preset (passed to Frame) */
  cornerPreset?: CornerPreset;
  /** Custom corner arm length */
  cornerArm?: number;
  /** Custom corner thickness */
  cornerThickness?: number;
  /** Corner color */
  cornerColor?: string;
  /** Show border */
  border?: boolean;
  /** Border color */
  borderColor?: string;
  /** Surface variant */
  surface?: SurfaceVariant;
  /** Children content */
  children?: React.ReactNode;
}

const accentColorMap: Record<AccentColor, string> = {
  gold: gold.DEFAULT,
  dawn: dawn.DEFAULT,
  verde: "#39ff14",
};

/**
 * Get default props for each tier
 */
function getTierDefaults(tier: CardTier): Partial<CardProps> {
  switch (tier) {
    case "content":
      return {
        surface: "elevated",
        cornerPreset: "card",
        border: false,
        borderColor: dawn["08"],
      };
    case "terminal":
      return {
        surface: "void",
        cornerPreset: "frame",
        border: true,
        borderColor: dawn[15],
      };
    case "data":
      return {
        surface: "elevated",
        cornerPreset: "subtle",
        border: false,
        borderColor: dawn["08"],
      };
    default:
      return {};
  }
}

/**
 * Card - Versatile card component with three tiers
 *
 * **Tiers:**
 * - `content` - Standard content cards with elevated surface
 * - `terminal` - Terminal-style cards with border and header dot
 * - `data` - Compact data display cards
 *
 * @example
 * ```tsx
 * // Content card
 * <Card tier="content" title="Card Title" index="01" label="Category">
 *   <p>Card content goes here</p>
 * </Card>
 *
 * // Terminal card
 * <Card tier="terminal" title="Terminal Title" label="System">
 *   <p>Terminal content</p>
 * </Card>
 *
 * // Data card
 * <Card tier="data" title="42" label="Metric">
 *   {/* Optional additional content *\/}
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      tier = "content",
      title,
      label,
      index,
      accent = "none",
      accentColor = "gold",
      corners = "four",
      cornerPreset,
      cornerArm,
      cornerThickness,
      cornerColor = gold.DEFAULT,
      border,
      borderColor,
      surface,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const defaults = getTierDefaults(tier);

    // Merge defaults with props
    const finalCornerPreset = cornerPreset ?? defaults.cornerPreset ?? "card";
    const finalBorder = border ?? defaults.border ?? false;
    const finalBorderColor = borderColor ?? defaults.borderColor ?? dawn["08"];
    const finalSurface = surface ?? defaults.surface ?? "transparent";

    const renderHeader = () => {
      if (tier === "terminal") {
        return (
          <div
            style={{
              fontFamily: fontFamily.data,
              fontSize: fontSize.xs,
              color: dawn[50],
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                background: gold.DEFAULT,
                marginRight: "8px",
              }}
            />
            {label || "Terminal"}
          </div>
        );
      }

      if (tier === "content" && (index || label)) {
        return (
          <div
            style={{
              fontFamily: fontFamily.data,
              fontSize: fontSize.xs,
              color: gold.DEFAULT,
              marginBottom: "8px",
            }}
          >
            {index && <span>{index}</span>}
            {index && label && <span> · </span>}
            {label && <span style={{ color: dawn[30] }}>{label}</span>}
          </div>
        );
      }

      if (tier === "data" && label) {
        return (
          <div
            style={{
              fontFamily: fontFamily.data,
              fontSize: fontSize.xs,
              color: dawn[30],
              marginBottom: "4px",
            }}
          >
            {label}
          </div>
        );
      }

      return null;
    };

    const renderTitle = () => {
      if (!title) return null;

      if (tier === "terminal") {
        return (
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: fontSize.xl,
              color: dawn.DEFAULT,
              textAlign: "center",
            }}
          >
            {title}
          </div>
        );
      }

      if (tier === "data") {
        return (
          <div
            style={{
              fontFamily: fontFamily.data,
              fontSize: fontSize["2xl"],
              color: gold.DEFAULT,
            }}
          >
            {title}
          </div>
        );
      }

      // content tier
      return (
        <div
          style={{
            fontFamily: fontFamily.data,
            fontSize: fontSize.sm,
            color: dawn.DEFAULT,
          }}
        >
          {title}
        </div>
      );
    };

    const renderAccent = () => {
      if (accent === "none") return null;

      const accentStyle: React.CSSProperties = {
        position: "absolute",
        background: accentColorMap[accentColor],
        ...(accent === "top" && {
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
        }),
        ...(accent === "left" && {
          top: 0,
          left: 0,
          bottom: 0,
          width: "3px",
        }),
      };

      return <div style={accentStyle} aria-hidden="true" />;
    };

    return (
      <Frame
        ref={ref}
        corners={corners}
        cornerPreset={finalCornerPreset}
        cornerArm={cornerArm}
        cornerThickness={cornerThickness}
        cornerColor={cornerColor}
        border={finalBorder}
        borderColor={finalBorderColor}
        surface={finalSurface}
        padding={tier === "data" ? "sm" : "md"}
        className={cn("relative", className)}
        style={style}
        {...props}
      >
        {renderAccent()}
        {renderHeader()}
        {renderTitle()}
        {children}
      </Frame>
    );
  }
);

Card.displayName = "Card";

// Re-export types
export type { CornerToken, CornerPreset, SurfaceVariant };
