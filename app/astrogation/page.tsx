"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import {
  CATEGORIES,
  getComponentsByCategory,
  getComponentById,
  searchComponents,
  type ComponentDef,
  type PropDef,
} from "./catalog";
import "./astrogation.css";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface UIComponentPreset {
  id: string;
  name: string;
  component_key: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface StyleConfig {
  // Border
  borderStyle: "none" | "solid" | "dashed" | "dotted" | "double";
  borderWidth: number;
  borderColor: string;
  // Fill
  fillType: "none" | "solid" | "gradient";
  fillColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  // Custom props
  props: Record<string, unknown>;
}

// Brand colors for picker
const BRAND_COLORS = [
  { name: "Gold", value: "#caa554", variable: "--gold" },
  { name: "Dawn", value: "#ebe3d6", variable: "--dawn" },
  { name: "Void", value: "#0a0908", variable: "--void" },
  { name: "Verde", value: "#39ff14", variable: "--verde" },
  { name: "Alert", value: "#ff6b35", variable: "--alert" },
  { name: "Dawn 50%", value: "rgba(235, 227, 214, 0.5)", variable: "--dawn-50" },
  { name: "Gold 50%", value: "rgba(202, 165, 84, 0.5)", variable: "--gold-50" },
];

// ═══════════════════════════════════════════════════════════════
// THOUGHTFORM LOGO
// ═══════════════════════════════════════════════════════════════

function ThoughtformLogo({ size = 24, color = "#caa554" }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 430.99 436"
      width={size}
      height={size}
      fill={color}
    >
      <path d="M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z" />
      <path d="M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z" />
      <path d="M29.12,218.81l132.09-.05v.05H29.12h0Z" />
      <path d="M163.32,250.35l12.58.05h-12.58v-.05Z" />
      <path d="M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z" />
      <path d="M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z" />
      <path d="M254.35,0l-33.01,182.26h-.6L254.35,0h0Z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT PREVIEW RENDERERS
// ═══════════════════════════════════════════════════════════════

function ComponentPreview({
  componentId,
  props,
  fullSize = false,
}: {
  componentId: string;
  props: Record<string, unknown>;
  style?: StyleConfig; // Kept for compatibility but not used - styling is via component props
  fullSize?: boolean;
}) {
  const def = getComponentById(componentId);
  if (!def) return <div className="preview-error">Unknown component</div>;

  // Components are styled through their own props (borderStyle, borderColor, backgroundColor, etc.)
  // No wrapper styling - this follows shadcn/ui pattern where components own their appearance
  const content = renderComponent(componentId, props, def, fullSize);

  return (
    <div
      className={`component-preview-wrapper ${fullSize ? "component-preview-wrapper--full" : ""}`}
    >
      {content}
    </div>
  );
}

function renderComponent(
  componentId: string,
  props: Record<string, unknown>,
  def: ComponentDef,
  fullSize = false
): React.ReactNode {
  // Scale factor for full-size preview
  const scale = fullSize ? 2 : 1;
  switch (componentId) {
    case "brand-mark":
      return (
        <div className="preview-center">
          <ThoughtformLogo
            size={((props.size as number) || 48) * scale}
            color={(props.color as string) || "#caa554"}
          />
        </div>
      );

    case "brand-mark-outline":
      return (
        <div className="preview-center">
          <svg
            viewBox="0 0 430.99 436"
            width={((props.size as number) || 48) * scale}
            height={((props.size as number) || 48) * scale}
            fill="none"
            stroke={(props.color as string) || "#caa554"}
            strokeWidth="8"
          >
            <path d="M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z" />
          </svg>
        </div>
      );

    case "word-mark":
      return (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: ((props.size as number) || 24) * scale,
            color: (props.color as string) || "#caa554",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          Thoughtform
        </div>
      );

    case "button": {
      const variant = (props.variant as string) || "ghost";
      const btnSize = (props.size as string) || "md";
      const customBg = props.backgroundColor as string;
      const customText = props.textColor as string;
      const customBorder = props.borderColor as string;
      const cornerToken = (props.cornerToken as CornerToken) || "four";
      const borderThickness = (props.borderThickness as number) ?? 1;
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;

      const sizeStyles = {
        sm: fullSize ? "12px 24px" : "6px 12px",
        md: fullSize ? "16px 32px" : "10px 20px",
        lg: fullSize ? "20px 40px" : "14px 28px",
      };
      const variantStyles = {
        ghost: {
          background: customBg && customBg !== "transparent" ? customBg : "transparent",
          color: customText || "var(--dawn-70)",
        },
        solid: {
          background: customBg && customBg !== "transparent" ? customBg : "var(--gold)",
          color: customText || "var(--void)",
        },
        outline: {
          background: customBg && customBg !== "transparent" ? customBg : "transparent",
          color: customText || "var(--gold)",
        },
      };

      return (
        <HUDWrapper
          cornerToken={cornerToken}
          borderThickness={borderThickness}
          cornerThickness={cornerThickness}
          borderColor={customBorder || "rgba(202, 165, 84, 0.15)"}
          cornerColor={customBorder || "#caa554"}
          cornerLength={fullSize ? 16 : 8}
        >
          <button
            style={{
              padding: sizeStyles[btnSize as keyof typeof sizeStyles],
              ...variantStyles[variant as keyof typeof variantStyles],
              border: "none",
              fontFamily: "var(--font-mono)",
              fontSize: fullSize ? "14px" : "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            {(props.label as string) || "Button"}
          </button>
        </HUDWrapper>
      );
    }

    case "card-frame-content": {
      const borderStyle = (props.borderStyle as string) || "solid";
      const borderColor = (props.borderColor as string) || "rgba(235, 227, 214, 0.08)";
      const bgColor = (props.backgroundColor as string) || "transparent";
      const cornerToken = (props.cornerToken as CornerToken) || "four";
      const borderThickness = (props.borderThickness as number) ?? 1;
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;

      return (
        <HUDWrapper
          cornerToken={cornerToken}
          borderThickness={borderStyle !== "none" ? borderThickness : 0}
          cornerThickness={borderStyle !== "none" ? cornerThickness : 0}
          borderColor={borderColor}
          cornerColor={borderColor}
          cornerLength={fullSize ? 24 : 12}
        >
          <div
            className={`preview-card preview-card--content ${fullSize ? "preview-card--full" : ""}`}
            style={{
              ...(fullSize ? { minWidth: "320px", padding: "24px" } : {}),
              border: "none", // HUDWrapper handles it
              background: bgColor !== "transparent" ? bgColor : undefined,
            }}
          >
            {props.accent !== "none" && (
              <div
                className={`preview-card__accent preview-card__accent--${props.accent}`}
                style={{
                  background:
                    props.accentColor === "dawn"
                      ? "var(--dawn)"
                      : props.accentColor === "verde"
                        ? "var(--verde)"
                        : "var(--gold)",
                }}
              />
            )}
            <div
              className="preview-card__index"
              style={fullSize ? { fontSize: "12px", marginBottom: "12px" } : undefined}
            >
              {String(props.index || "01")} ·{" "}
              <span className="preview-card__label">{String(props.label || "Label")}</span>
            </div>
            <div
              className="preview-card__title"
              style={fullSize ? { fontSize: "18px" } : undefined}
            >
              {(props.title as string) || "Card Title"}
            </div>
          </div>
        </HUDWrapper>
      );
    }

    case "card-frame-terminal": {
      const cornerColor = (props.cornerColor as string) || "#caa554";
      const cornerSize = ((props.cornerSize as number) || 16) * scale;
      const borderStyle = (props.borderStyle as string) || "solid";
      const borderColor = (props.borderColor as string) || "rgba(235, 227, 214, 0.15)";
      const bgColor = (props.backgroundColor as string) || "transparent";
      const cornerToken = (props.cornerToken as CornerToken) || "four";
      const borderThickness = (props.borderThickness as number) ?? 1;
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;

      return (
        <HUDWrapper
          cornerToken={cornerToken}
          borderThickness={borderStyle !== "none" ? borderThickness : 0}
          cornerThickness={borderStyle !== "none" ? cornerThickness : 0}
          borderColor={borderColor}
          cornerColor={cornerColor}
          cornerLength={cornerSize}
        >
          <div
            className={`preview-card preview-card--terminal ${fullSize ? "preview-card--full" : ""}`}
            style={{
              ...(fullSize ? { minWidth: "360px", padding: "32px" } : {}),
              border: "none", // HUDWrapper handles it
              background: bgColor !== "transparent" ? bgColor : undefined,
            }}
          >
            <div
              className="preview-card__header"
              style={fullSize ? { fontSize: "12px", marginBottom: "16px" } : undefined}
            >
              <span
                className="preview-card__dot"
                style={fullSize ? { width: "10px", height: "10px" } : undefined}
              />
              {(props.label as string) || "Terminal"}
            </div>
            <div className="preview-card__body" style={fullSize ? { fontSize: "24px" } : undefined}>
              {(props.title as string) || "Terminal Title"}
            </div>
          </div>
        </HUDWrapper>
      );
    }

    case "card-frame-data": {
      const borderStyle = (props.borderStyle as string) || "solid";
      const borderColor = (props.borderColor as string) || "rgba(235, 227, 214, 0.08)";
      const bgColor = (props.backgroundColor as string) || "transparent";
      const cornerToken = (props.cornerToken as CornerToken) || "four";
      const borderThickness = (props.borderThickness as number) ?? 1;
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;

      return (
        <HUDWrapper
          cornerToken={cornerToken}
          borderThickness={borderStyle !== "none" ? borderThickness : 0}
          cornerThickness={borderStyle !== "none" ? cornerThickness : 0}
          borderColor={borderColor}
          cornerColor={borderColor}
          cornerLength={fullSize ? 20 : 10}
        >
          <div
            className={`preview-card preview-card--data ${fullSize ? "preview-card--full" : ""}`}
            style={{
              ...(fullSize ? { minWidth: "200px", padding: "20px" } : {}),
              border: "none", // HUDWrapper handles it
              background: bgColor !== "transparent" ? bgColor : undefined,
            }}
          >
            <div
              className="preview-card__metric-label"
              style={fullSize ? { fontSize: "12px" } : undefined}
            >
              {(props.label as string) || "Metric"}
            </div>
            <div
              className="preview-card__metric-value"
              style={fullSize ? { fontSize: "48px" } : undefined}
            >
              {(props.title as string) || "42"}
            </div>
          </div>
        </HUDWrapper>
      );
    }

    case "hud-corner": {
      const position = (props.position as string) || "top-left";
      const cornerSize = ((props.size as number) || 40) * scale;
      const thickness = (props.thickness as number) || 2;
      const cornerColor = (props.color as string) || "#caa554";
      const cornerStyle = {
        "top-left": {
          borderTop: `${thickness}px solid ${cornerColor}`,
          borderLeft: `${thickness}px solid ${cornerColor}`,
        },
        "top-right": {
          borderTop: `${thickness}px solid ${cornerColor}`,
          borderRight: `${thickness}px solid ${cornerColor}`,
        },
        "bottom-left": {
          borderBottom: `${thickness}px solid ${cornerColor}`,
          borderLeft: `${thickness}px solid ${cornerColor}`,
        },
        "bottom-right": {
          borderBottom: `${thickness}px solid ${cornerColor}`,
          borderRight: `${thickness}px solid ${cornerColor}`,
        },
      };
      return (
        <div
          style={{
            width: cornerSize,
            height: cornerSize,
            ...cornerStyle[position as keyof typeof cornerStyle],
          }}
        />
      );
    }

    case "hud-rail": {
      const orientation = (props.orientation as string) || "vertical";
      const showTicks = props.showTicks !== false;
      const tickCount = (props.tickCount as number) || 11;
      const length = ((props.length as number) || 200) * scale;
      const railColor = (props.color as string) || "#caa554";
      const isVertical = orientation === "vertical";

      return (
        <div
          style={{
            position: "relative",
            width: isVertical ? 60 * scale : length,
            height: isVertical ? length : 60 * scale,
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
          }}
        >
          {/* Main rail line */}
          <div
            style={{
              position: "absolute",
              [isVertical ? "left" : "top"]: 0,
              [isVertical ? "top" : "left"]: 0,
              [isVertical ? "bottom" : "right"]: 0,
              [isVertical ? "width" : "height"]: "1px",
              background: `linear-gradient(${isVertical ? "to bottom" : "to right"}, transparent 0%, ${railColor}80 10%, ${railColor}80 90%, transparent 100%)`,
            }}
          />
          {/* Tick marks */}
          {showTicks && (
            <div
              style={{
                position: "absolute",
                [isVertical ? "left" : "top"]: 0,
                [isVertical ? "top" : "left"]: 0,
                [isVertical ? "bottom" : "right"]: 0,
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                justifyContent: "space-between",
              }}
            >
              {Array.from({ length: tickCount }).map((_, i) => {
                const isMajor = i % 5 === 0;
                return (
                  <div
                    key={i}
                    style={{
                      [isVertical ? "width" : "height"]: isMajor ? 16 * scale : 8 * scale,
                      [isVertical ? "height" : "width"]: "1px",
                      background: isMajor ? railColor : `${railColor}80`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    }

    case "hud-frame-complete": {
      const showCorners = props.showCorners !== false;
      const showRails = props.showRails !== false;
      const showTicks = props.showTicks !== false;
      const cornerSize = ((props.cornerSize as number) || 40) * scale;
      const cornerColor = (props.cornerColor as string) || "#caa554";
      const frameWidth = ((props.width as number) || 400) * scale;
      const frameHeight = ((props.height as number) || 300) * scale;
      const tickCount = 11;

      return (
        <div
          style={{
            position: "relative",
            width: frameWidth,
            height: frameHeight,
          }}
        >
          {/* Corners */}
          {showCorners && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: cornerSize,
                  height: cornerSize,
                  borderTop: `2px solid ${cornerColor}`,
                  borderLeft: `2px solid ${cornerColor}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: cornerSize,
                  height: cornerSize,
                  borderTop: `2px solid ${cornerColor}`,
                  borderRight: `2px solid ${cornerColor}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: cornerSize,
                  height: cornerSize,
                  borderBottom: `2px solid ${cornerColor}`,
                  borderLeft: `2px solid ${cornerColor}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: cornerSize,
                  height: cornerSize,
                  borderBottom: `2px solid ${cornerColor}`,
                  borderRight: `2px solid ${cornerColor}`,
                }}
              />
            </>
          )}

          {/* Left Rail */}
          {showRails && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: cornerSize + 20,
                bottom: cornerSize + 20,
                width: 1,
                background: `linear-gradient(to bottom, transparent 0%, ${cornerColor}80 10%, ${cornerColor}80 90%, transparent 100%)`,
              }}
            />
          )}

          {/* Right Rail */}
          {showRails && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: cornerSize + 20,
                bottom: cornerSize + 20,
                width: 1,
                background: `linear-gradient(to bottom, transparent 0%, ${cornerColor}80 10%, ${cornerColor}80 90%, transparent 100%)`,
              }}
            />
          )}

          {/* Left Ticks */}
          {showTicks && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: cornerSize + 20,
                bottom: cornerSize + 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {Array.from({ length: tickCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 5 === 0 ? 16 : 8,
                    height: 1,
                    background: i % 5 === 0 ? cornerColor : `${cornerColor}80`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Right Ticks */}
          {showTicks && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: cornerSize + 20,
                bottom: cornerSize + 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              {Array.from({ length: tickCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 5 === 0 ? 16 : 8,
                    height: 1,
                    background: i % 5 === 0 ? cornerColor : `${cornerColor}80`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    case "slider":
      return (
        <div style={{ width: "100%" }}>
          <div className="preview-slider__header">
            <span>{(props.label as string) || "Value"}</span>
            <span className="preview-slider__value">{(props.value as number) || 50}</span>
          </div>
          <input
            type="range"
            min={(props.min as number) || 0}
            max={(props.max as number) || 100}
            value={(props.value as number) || 50}
            readOnly
            className="preview-slider__input"
          />
        </div>
      );

    case "toggle":
      return (
        <label className="preview-toggle">
          <input type="checkbox" checked={(props.checked as boolean) || false} readOnly />
          <span>{(props.label as string) || "Option"}</span>
        </label>
      );

    case "select":
      return (
        <div style={{ width: "100%" }}>
          <div className="preview-select__label">{(props.label as string) || "Select"}</div>
          <select className="preview-select__input">
            <option>{(props.placeholder as string) || "Choose option..."}</option>
          </select>
        </div>
      );

    case "glitch-text":
      return <div className="preview-glitch-text">{(props.text as string) || "THOUGHTFORM"}</div>;

    case "hud-frame":
      // Legacy - use hud-frame-complete instead
      return renderComponent(
        "hud-frame-complete",
        { ...props, showRails: false, showTicks: false },
        def,
        fullSize
      );

    case "navigation-bar": {
      const showBorder = props.showBorder !== false;
      const borderColor = (props.borderColor as string) || "rgba(235, 227, 214, 0.08)";
      const backgroundColor = (props.backgroundColor as string) || "#0a0908";
      const cornerToken = (props.cornerToken as CornerToken) || "four";
      const borderThickness = (props.borderThickness as number) ?? 1;
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;

      return (
        <HUDWrapper
          cornerToken={cornerToken}
          borderThickness={showBorder ? borderThickness : 0}
          cornerThickness={showBorder ? cornerThickness : 0}
          borderColor={borderColor}
          cornerColor={borderColor}
          cornerLength={fullSize ? 20 : 10}
          style={{ width: "100%" }}
        >
          <div
            className="preview-navbar"
            style={{
              background: backgroundColor,
              borderBottom: "none", // HUDWrapper handles it
            }}
          >
            {Boolean(props.showLogo) && <span className="preview-navbar__logo">THOUGHTFORM</span>}
          </div>
        </HUDWrapper>
      );
    }

    default:
      return <div className="preview-default">{def.name}</div>;
  }
}

// ═══════════════════════════════════════════════════════════════
// JSX CODE GENERATOR
// ═══════════════════════════════════════════════════════════════

function generateJSXCode(componentId: string, props: Record<string, unknown>): string {
  const def = getComponentById(componentId);
  if (!def) return "// Unknown component";

  const componentNames: Record<string, string> = {
    "brand-mark": "ThoughtformLogo",
    "brand-mark-outline": "ThoughtformLogoOutline",
    "word-mark": "WordMark",
    button: "Button",
    "card-frame-content": "CardFrame",
    "card-frame-terminal": "CardFrame",
    "card-frame-data": "CardFrame",
    "hud-frame": "HUDFrame",
    "hud-frame-complete": "HUDFrame",
    "hud-corner": "HUDCorner",
    "hud-rail": "HUDRail",
    "navigation-bar": "NavigationBar",
    slider: "Slider",
    toggle: "Toggle",
    select: "Select",
    "glitch-text": "GlitchText",
  };

  const componentName = componentNames[componentId] || def.name.replace(/\s+/g, "");

  const propsEntries = Object.entries(props).filter(([key, value]) => {
    const propDef = def.props.find((p) => p.name === key);
    return propDef && value !== propDef.default;
  });

  if (componentId === "card-frame-terminal") {
    propsEntries.push(["tier", "terminal"]);
  } else if (componentId === "card-frame-data") {
    propsEntries.push(["tier", "data"]);
  }

  const propsString = propsEntries
    .map(([key, value]) => {
      if (typeof value === "string") return `${key}="${value}"`;
      if (typeof value === "boolean") return value ? key : `${key}={false}`;
      return `${key}={${JSON.stringify(value)}}`;
    })
    .join(" ");

  if (componentId === "button" && props.label) {
    const filteredProps = propsEntries.filter(([k]) => k !== "label");
    const filteredPropsString = filteredProps
      .map(([key, value]) => {
        if (typeof value === "string") return `${key}="${value}"`;
        if (typeof value === "boolean") return value ? key : `${key}={false}`;
        return `${key}={${JSON.stringify(value)}}`;
      })
      .join(" ");
    return `<${componentName}${filteredPropsString ? " " + filteredPropsString : ""}>${props.label}</${componentName}>`;
  }

  return `<${componentName}${propsString ? " " + propsString : ""} />`;
}

// ─── HELPERS & SUBCOMPONENTS ───

type CornerToken = "four" | "tr-bl" | "tl-br";

function CornerSelector({
  value,
  onChange,
}: {
  value: CornerToken;
  onChange: (value: CornerToken) => void;
}) {
  const options: { id: CornerToken; label: string; activeCorners: string[] }[] = [
    { id: "four", label: "Four Corners", activeCorners: ["tl", "tr", "bl", "br"] },
    { id: "tr-bl", label: "Top Right & Bottom Left", activeCorners: ["tr", "bl"] },
    { id: "tl-br", label: "Top Left & Bottom Right", activeCorners: ["tl", "br"] },
  ];

  return (
    <div className="corner-selector">
      <div className="corner-selector__grid">
        {options.map((opt) => (
          <button
            key={opt.id}
            className={`corner-option ${value === opt.id ? "active" : ""}`}
            onClick={() => onChange(opt.id)}
            title={opt.label}
          >
            <div className="corner-mockup">
              {opt.activeCorners.includes("tl") && <div className="mock-corner tl" />}
              {opt.activeCorners.includes("tr") && <div className="mock-corner tr" />}
              {opt.activeCorners.includes("bl") && <div className="mock-corner bl" />}
              {opt.activeCorners.includes("br") && <div className="mock-corner br" />}
            </div>
            <span className="corner-option__label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HUDWrapper({
  children,
  cornerToken = "four",
  borderThickness = 1,
  cornerThickness = 1.5,
  borderColor = "rgba(202, 165, 84, 0.15)",
  cornerColor = "#caa554",
  cornerLength = 24,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  cornerToken?: CornerToken;
  borderThickness?: number;
  cornerThickness?: number;
  borderColor?: string;
  cornerColor?: string;
  cornerLength?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const s = cornerLength;

  const getClipPath = (token: CornerToken, t: number) => {
    // We use a polygon that "diips in" to only show the relevant corner parts of the border
    const tl = `0 0, ${s}px 0, ${s}px ${t}px, ${t}px ${t}px, ${t}px ${s}px, 0 ${s}px`;
    const tr = `calc(100% - ${s}px) 0, 100% 0, 100% ${s}px, calc(100% - ${t}px) ${s}px, calc(100% - ${t}px) ${t}px, calc(100% - ${s}px) ${t}px`;
    const br = `100% calc(100% - ${s}px), 100% 100%, calc(100% - ${s}px) 100%, calc(100% - ${s}px) calc(100% - ${t}px), calc(100% - ${t}px) calc(100% - ${t}px), calc(100% - ${t}px) calc(100% - ${s}px)`;
    const bl = `0 calc(100% - ${s}px), ${t}px calc(100% - ${s}px), ${t}px calc(100% - ${t}px), ${s}px calc(100% - ${t}px), ${s}px 100%, 0 100%`;

    if (token === "four") return `polygon(${tl}, ${tr}, ${br}, ${bl})`;
    if (token === "tr-bl") return `polygon(${tr}, ${bl})`;
    if (token === "tl-br") return `polygon(${tl}, ${br})`;
    return "none";
  };

  return (
    <div className={`hud-wrapper ${className}`} style={{ ...style, position: "relative" }}>
      {/* Main thin border */}
      <div
        className="hud-wrapper__border"
        style={{
          position: "absolute",
          inset: 0,
          border: `${borderThickness}px solid ${borderColor}`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Thick corners */}
      <div
        className="hud-wrapper__corners"
        style={{
          position: "absolute",
          inset: 0,
          border: `${cornerThickness}px solid ${cornerColor}`,
          clipPath: getClipPath(cornerToken, cornerThickness),
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEFT PANEL - CATALOG
// ═══════════════════════════════════════════════════════════════

function CatalogPanel({
  selectedCategory,
  onSelectCategory,
  selectedComponentId,
  onSelectComponent,
  presets,
  onLoadPreset,
  onDeletePreset,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
}: {
  selectedCategory: string | null;
  onSelectCategory: (id: string) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["brand"]));
  const filteredComponents = searchQuery ? searchComponents(searchQuery) : null;

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onSelectCategory(id);
  };

  return (
    <aside className="astrogation-panel astrogation-panel--left">
      {/* Panel Header */}
      <div className="panel-header">COMPONENTS</div>

      {/* Scrollable content area */}
      <div className="panel-content">
        {/* Save Preset */}
        <div className="astrogation-section astrogation-section--save">
          <div className="save-preset-form">
            <input
              type="text"
              placeholder="Save preset..."
              value={presetName}
              onChange={(e) => onPresetNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSave && onSavePreset()}
            />
            <button onClick={onSavePreset} disabled={!canSave} className="save-btn">
              Save
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="astrogation-section">
          <input
            type="text"
            className="astrogation-search"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {filteredComponents && (
          <div className="astrogation-section">
            <div className="astrogation-section__label">Results ({filteredComponents.length})</div>
            {filteredComponents.map((comp) => (
              <button
                key={comp.id}
                className={`catalog-item ${selectedComponentId === comp.id ? "selected" : ""}`}
                onClick={() => onSelectComponent(comp.id)}
              >
                {comp.name}
              </button>
            ))}
          </div>
        )}

        {/* Categories with expandable component lists */}
        {!filteredComponents && (
          <div className="astrogation-section astrogation-section--categories">
            {CATEGORIES.map((cat) => {
              const isExpanded = expandedCategories.has(cat.id);
              const components = getComponentsByCategory(cat.id);
              const subcategoryComponents =
                cat.subcategories?.flatMap((sub) => getComponentsByCategory(cat.id, sub.id)) || [];
              const allComponents = [...components, ...subcategoryComponents];

              return (
                <div key={cat.id} className={`catalog-category ${isExpanded ? "expanded" : ""}`}>
                  {/* Category header with corner bracket */}
                  <button
                    className={`catalog-category-btn ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className="catalog-corner" />
                    <span className="catalog-category-btn__name">{cat.name.toUpperCase()}</span>
                    <span className="catalog-category-btn__count">{allComponents.length}</span>
                  </button>

                  {isExpanded && (
                    <div className="catalog-category__items">
                      {/* Direct components under category */}
                      {components.map((comp) => (
                        <button
                          key={comp.id}
                          className={`catalog-item ${selectedComponentId === comp.id ? "selected" : ""}`}
                          onClick={() => onSelectComponent(comp.id)}
                        >
                          <span className="catalog-item__corner" />
                          {comp.name}
                        </button>
                      ))}

                      {/* Subcategories with nested corner brackets */}
                      {cat.subcategories?.map((sub) => {
                        const subComps = getComponentsByCategory(cat.id, sub.id);
                        if (subComps.length === 0) return null;
                        return (
                          <div key={sub.id} className="catalog-subcategory">
                            <div className="catalog-subcategory__label">
                              <span className="catalog-corner catalog-corner--small" />
                              {sub.name.toUpperCase()}
                            </div>
                            {subComps.map((comp) => (
                              <button
                                key={comp.id}
                                className={`catalog-item catalog-item--nested ${selectedComponentId === comp.id ? "selected" : ""}`}
                                onClick={() => onSelectComponent(comp.id)}
                              >
                                <span className="catalog-item__corner" />
                                {comp.name}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Saved Presets */}
        {presets.length > 0 && (
          <div className="astrogation-section">
            <div className="astrogation-section__label">Saved Presets</div>
            <div className="preset-list">
              {presets.map((preset) => (
                <div key={preset.id} className="preset-item">
                  <button className="preset-item__load" onClick={() => onLoadPreset(preset)}>
                    {preset.name}
                  </button>
                  <button className="preset-item__delete" onClick={() => onDeletePreset(preset.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// CENTER PANEL - COMPONENT CANVAS (Full-size preview)
// ═══════════════════════════════════════════════════════════════

function ComponentCanvas({
  selectedComponentId,
  componentProps,
  style,
}: {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
}) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  if (!selectedComponentId || !def) {
    return (
      <div className="canvas canvas--empty">
        <div className="canvas__empty-state">
          <span className="canvas__icon">⬡</span>
          <p>Select a component from the left panel</p>
          <span className="canvas__hint">
            Click any component in the catalog to preview it here
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas">
      {/* Component Label */}
      <div className="canvas__label">
        <span className="canvas__label-name">{def.name}</span>
        <span className="canvas__label-category">{def.category}</span>
      </div>

      {/* Full-size Preview Area */}
      <div className="canvas__preview">
        <ComponentPreview
          componentId={selectedComponentId}
          props={componentProps}
          style={style}
          fullSize
        />
      </div>

      {/* Bottom info */}
      <div className="canvas__info">
        <span>Click to interact • Edit properties in the right panel</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RIGHT PANEL - DIALS / EDITOR
// ═══════════════════════════════════════════════════════════════

function DialsPanel({
  selectedComponentId,
  componentProps,
  onPropsChange,
  onCopyCode,
}: {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
  onCopyCode: () => void;
}) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  const renderPropControl = (propDef: PropDef, value: unknown) => {
    const currentValue = value ?? propDef.default;

    switch (propDef.type) {
      case "string":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <input
              type="text"
              className="dial-input"
              value={currentValue as string}
              onChange={(e) => onPropsChange({ ...componentProps, [propDef.name]: e.target.value })}
            />
          </div>
        );

      case "number":
        return (
          <div className="dial-group">
            <div className="dial-group__header">
              <span className="dial-group__label">{propDef.name}</span>
              <span className="dial-group__value">{currentValue as number}</span>
            </div>
            <input
              type="range"
              className="dial-slider"
              min={propDef.min ?? 0}
              max={propDef.max ?? 100}
              step={propDef.step ?? 1}
              value={currentValue as number}
              onChange={(e) =>
                onPropsChange({ ...componentProps, [propDef.name]: parseFloat(e.target.value) })
              }
            />
          </div>
        );

      case "boolean":
        return (
          <label className="dial-toggle">
            <input
              type="checkbox"
              checked={currentValue as boolean}
              onChange={(e) =>
                onPropsChange({ ...componentProps, [propDef.name]: e.target.checked })
              }
            />
            <span>{propDef.name}</span>
          </label>
        );

      case "select":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <select
              className="dial-select"
              value={currentValue as string}
              onChange={(e) => onPropsChange({ ...componentProps, [propDef.name]: e.target.value })}
            >
              {propDef.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      case "color":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <div className="color-picker">
              <input
                type="color"
                value={currentValue as string}
                onChange={(e) =>
                  onPropsChange({ ...componentProps, [propDef.name]: e.target.value })
                }
              />
              <div className="color-swatches">
                {BRAND_COLORS.slice(0, 5).map((c) => (
                  <button
                    key={c.name}
                    className="color-swatch"
                    style={{ background: c.value }}
                    title={c.name}
                    onClick={() => onPropsChange({ ...componentProps, [propDef.name]: c.value })}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case "corners":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <CornerSelector
              value={currentValue as CornerToken}
              onChange={(val) => onPropsChange({ ...componentProps, [propDef.name]: val })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!selectedComponentId || !def) {
    return (
      <aside className="astrogation-panel astrogation-panel--right">
        <div className="panel-header">DIALS</div>
        <div className="panel-content">
          <div className="panel-empty-state">
            <span className="panel-empty-state__icon">◇</span>
            <p>Select a component to edit</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="astrogation-panel astrogation-panel--right">
      <div className="panel-header">{def.name.toUpperCase()}</div>

      <div className="panel-content">
        {/* Component Props (includes borders for components that have them) */}
        {def.props.length > 0 && (
          <div className="astrogation-section">
            <div className="astrogation-section__label">Properties</div>
            {def.props.map((propDef) => (
              <div key={propDef.name} style={{ marginBottom: "8px" }}>
                {renderPropControl(propDef, componentProps[propDef.name])}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="astrogation-section">
          <button className="action-btn action-btn--full" onClick={onCopyCode}>
            Copy JSX Code
          </button>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN ASTROGATION CONTENT
// ═══════════════════════════════════════════════════════════════

function AstrogationContent() {
  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<string | null>("brand");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Style state (for selected component)
  const [style, setStyle] = useState<StyleConfig>({
    borderStyle: "none",
    borderWidth: 1,
    borderColor: "#caa554",
    fillType: "none",
    fillColor: "#0a0908",
    gradientFrom: "#caa554",
    gradientTo: "#0a0908",
    gradientAngle: 135,
    props: {},
  });

  // Component props state
  const [componentProps, setComponentProps] = useState<Record<string, unknown>>({});

  // Presets state
  const [presets, setPresets] = useState<UIComponentPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Reset props when component changes
  useEffect(() => {
    if (selectedComponentId) {
      const def = getComponentById(selectedComponentId);
      if (def) {
        const defaultProps: Record<string, unknown> = {};
        def.props.forEach((p) => {
          defaultProps[p.name] = p.default;
        });
        setComponentProps(defaultProps);
      }
    }
  }, [selectedComponentId]);

  // Show toast
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Copy code
  const handleCopyCode = useCallback(() => {
    if (!selectedComponentId) return;
    const code = generateJSXCode(selectedComponentId, componentProps);
    navigator.clipboard.writeText(code);
    showToast("Code copied to clipboard");
  }, [selectedComponentId, componentProps, showToast]);

  // Load presets from API
  useEffect(() => {
    fetch("/api/ui-component-presets")
      .then((r) => r.json())
      .then((data) => setPresets(data.presets || []))
      .catch(console.error);
  }, []);

  // Save preset
  const handleSavePreset = useCallback(async () => {
    if (!selectedComponentId || !presetName.trim()) return;

    try {
      const res = await fetch("/api/ui-component-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          component_key: selectedComponentId,
          config: { ...componentProps, __style: style },
        }),
      });
      const data = await res.json();
      if (data.preset) {
        setPresets((prev) => [...prev, data.preset]);
        setPresetName("");
        showToast("Preset saved");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to save preset");
    }
  }, [selectedComponentId, componentProps, style, presetName, showToast]);

  // Load preset
  const handleLoadPreset = useCallback(
    (preset: UIComponentPreset) => {
      setSelectedComponentId(preset.component_key);
      const { __style, ...props } = preset.config as Record<string, unknown>;
      setComponentProps(props);
      if (__style) {
        setStyle(__style as StyleConfig);
      }
      showToast(`Loaded: ${preset.name}`);
    },
    [showToast]
  );

  // Delete preset
  const handleDeletePreset = useCallback(
    async (id: string) => {
      if (!confirm("Delete this preset?")) return;
      try {
        await fetch(`/api/ui-component-presets?id=${id}`, { method: "DELETE" });
        setPresets((prev) => prev.filter((p) => p.id !== id));
        showToast("Preset deleted");
      } catch (e) {
        console.error(e);
        showToast("Failed to delete preset");
      }
    },
    [showToast]
  );

  return (
    <div className="astrogation">
      {/* HUD Frame Elements */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Left Rail */}
      <aside className="hud-rail hud-rail-left">
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
            ))}
          </div>
        </div>
      </aside>

      {/* Right Rail */}
      <aside className="hud-rail hud-rail-right">
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
            ))}
          </div>
        </div>
      </aside>

      {/* Navigation Bar */}
      <nav className="astrogation-nav">
        <Link href="/" className="astrogation-nav__logo">
          <ThoughtformLogo size={22} color="#caa554" />
        </Link>
        <div className="astrogation-nav__title">
          <span className="title-icon">⬡</span>
          <span>Astrogation</span>
        </div>
      </nav>

      {/* Content Area */}
      <div className="astrogation-content">
        <CatalogPanel
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedComponentId={selectedComponentId}
          onSelectComponent={setSelectedComponentId}
          presets={presets}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          onSavePreset={handleSavePreset}
          presetName={presetName}
          onPresetNameChange={setPresetName}
          canSave={!!selectedComponentId && !!presetName.trim()}
        />

        <ComponentCanvas
          selectedComponentId={selectedComponentId}
          componentProps={componentProps}
          style={style}
        />

        <DialsPanel
          selectedComponentId={selectedComponentId}
          componentProps={componentProps}
          onPropsChange={setComponentProps}
          onCopyCode={handleCopyCode}
        />
      </div>

      {/* Footer */}
      <footer className="astrogation-footer">
        <div className="astrogation-footer__left">
          <span>Select category → View components → Edit properties</span>
        </div>
        <div className="astrogation-footer__right">Astrogation v1.0</div>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORT WITH AUTH
// ═══════════════════════════════════════════════════════════════

export default function Astrogation() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="astrogation astrogation--loading">
        <span className="astrogation__loading">Loading...</span>
      </div>
    );
  }

  if (!user?.email || !isAllowedUserEmail(user.email)) {
    return (
      <div className="astrogation astrogation--unauthorized">
        <h1>Astrogation</h1>
        <p>This tool requires authentication.</p>
        <Link href="/" className="astrogation__btn">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <AdminGate>
      <AstrogationContent />
    </AdminGate>
  );
}
