"use client";

import { tokenToPositions, type CornerToken, Frame } from "@thoughtform/ui";

// ═══════════════════════════════════════════════════════════════
// CORNER HELPERS
// ═══════════════════════════════════════════════════════════════

// Helper to convert active corners set to token
export function cornersToToken(corners: Set<string>): CornerToken {
  const sorted = [...corners].sort().join("-");
  if (corners.size === 4) return "four";
  if (corners.size === 0) return "none";
  const mapping: Record<string, CornerToken> = {
    tl: "tl",
    tr: "tr",
    bl: "bl",
    br: "br",
    "bl-tl": "tl-bl",
    "tl-tr": "tl-tr",
    "bl-br": "bl-br",
    "br-tr": "tr-br",
    "bl-tr": "tr-bl",
    "br-tl": "tl-br",
    "bl-br-tl": "no-tr",
    "bl-br-tr": "no-tl",
    "bl-tl-tr": "no-br",
    "br-tl-tr": "no-bl",
  };
  return mapping[sorted] || "none";
}

// Helper to convert token to active corners set
export function tokenToCorners(token: CornerToken): Set<string> {
  return new Set(tokenToPositions(token));
}

// ═══════════════════════════════════════════════════════════════
// CORNER SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════

export interface CornerSelectorProps {
  value: CornerToken;
  onChange: (value: CornerToken) => void;
}

export function CornerSelector({ value, onChange }: CornerSelectorProps) {
  const activeCorners = tokenToCorners(value);

  const toggleCorner = (corner: string) => {
    const newCorners = new Set(activeCorners);
    if (newCorners.has(corner)) {
      newCorners.delete(corner);
    } else {
      newCorners.add(corner);
    }
    onChange(cornersToToken(newCorners));
  };

  const corners = ["tl", "tr", "bl", "br"] as const;

  return (
    <div className="corner-selector">
      <div className="corner-selector__frame">
        {/* Frame outline */}
        <div className="corner-frame__border" />
        {/* Clickable corners */}
        {corners.map((corner) => (
          <button
            key={corner}
            className={`corner-toggle corner-toggle--${corner} ${activeCorners.has(corner) ? "active" : ""}`}
            onClick={() => toggleCorner(corner)}
            title={`Toggle ${corner.toUpperCase()} corner`}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HUD WRAPPER COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * HUDWrapper - Now using Frame from @thoughtform/ui
 * This is a thin wrapper that maps the legacy props to the new Frame component
 */
export interface HUDWrapperProps {
  children: React.ReactNode;
  cornerToken?: CornerToken;
  borderThickness?: number;
  cornerThickness?: number;
  borderColor?: string;
  cornerColor?: string;
  cornerLength?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function HUDWrapper({
  children,
  cornerToken = "four",
  borderThickness = 0,
  cornerThickness: cornerThicknessValue = 1.5,
  borderColor = "rgba(202, 165, 84, 0.15)",
  cornerColor = "#caa554",
  cornerLength = 24,
  className = "",
  style = {},
}: HUDWrapperProps) {
  return (
    <Frame
      corners={cornerToken}
      cornerArm={cornerLength}
      cornerThickness={cornerThicknessValue}
      cornerColor={cornerColor}
      border={borderThickness > 0}
      borderColor={borderColor}
      borderWidth={borderThickness}
      surface="transparent"
      padding="none"
      className={className}
      style={style}
    >
      {children}
    </Frame>
  );
}
