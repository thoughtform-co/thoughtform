"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import {
  CATEGORIES,
  HIERARCHY_BREAKS,
  getComponentsByCategory,
  getComponentById,
  searchComponents,
  type ComponentDef,
  type PropDef,
} from "./catalog";
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNodeContent,
} from "@/components/ui/Tree";

// Import from @thoughtform/ui atomic design system
import {
  // Tokens
  gold,
  dawn,
  void_,
  cornerArm,
  cornerThickness,
  tokenToPositions,
  type CornerToken,
  type CornerPosition,
  // Atoms
  CornerBracket,
  CornerBrackets,
  Rail,
  TargetReticle,
  // Molecules
  Frame,
  // Organisms
  Card,
  Button as UIButton,
} from "@thoughtform/ui";

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

// Primary brand colors for dials - only core colors, no secondary
const BRAND_COLORS = [
  { name: "Gold", value: "#caa554", variable: "--gold" },
  { name: "Dawn", value: "#ebe3d6", variable: "--dawn" },
  { name: "Void", value: "#0a0908", variable: "--void" },
  { name: "Dawn 50%", value: "rgba(235, 227, 214, 0.5)", variable: "--dawn-50" },
  { name: "Gold 50%", value: "rgba(202, 165, 84, 0.5)", variable: "--gold-50" },
];

// Subtle border colors (low opacity for frames)
const BORDER_COLORS = [
  { name: "Dawn 8%", value: "rgba(235, 227, 214, 0.08)", variable: "--dawn-08" },
  { name: "Dawn 15%", value: "rgba(235, 227, 214, 0.15)", variable: "--dawn-15" },
  { name: "Dawn 30%", value: "rgba(235, 227, 214, 0.30)", variable: "--dawn-30" },
  { name: "Gold 15%", value: "rgba(202, 165, 84, 0.15)", variable: "--gold-15" },
  { name: "Gold 30%", value: "rgba(202, 165, 84, 0.30)", variable: "--gold-30" },
  { name: "Dawn", value: "#ebe3d6", variable: "--dawn" },
  { name: "Gold", value: "#caa554", variable: "--gold" },
];

// ═══════════════════════════════════════════════════════════════
// SVG LOADER COMPONENT
// ═══════════════════════════════════════════════════════════════

// Component to load SVG files and apply dynamic colors
function DynamicSVG({
  src,
  color = "#caa554",
  width,
  height,
  className,
  preserveAspectRatio = "xMidYMid meet",
}: {
  src: string;
  color?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  preserveAspectRatio?: string;
}) {
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
        let processed = text
          .replace(/fill="#?[Cc][Aa][Aa]554"/g, `fill="${color}"`)
          .replace(/fill="#?[Cc][Aa][Aa]554"/g, `fill="${color}"`)
          .replace(/fill="currentColor"/g, `fill="${color}"`)
          .replace(/fill="none"/g, `fill="none"`); // Keep none as none

        // Also handle fill attributes without quotes
        processed = processed.replace(/fill=([Cc][Aa][Aa]554)/g, `fill="${color}"`);

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
    // ═══════════════════════════════════════════════════════════════
    // FOUNDATIONS - Colors
    // ═══════════════════════════════════════════════════════════════
    case "color-palette": {
      const primaryColors = [
        { name: "Gold", value: "#caa554", variable: "--gold" },
        { name: "Dawn", value: "#ebe3d6", variable: "--dawn" },
        { name: "Void", value: "#0a0908", variable: "--void" },
      ];
      const secondaryColors = [
        { name: "Surface-0", value: "#0D0B07", variable: "--surface-0" },
        { name: "Surface-1", value: "#141210", variable: "--surface-1" },
        { name: "Surface-2", value: "#1A1814", variable: "--surface-2" },
      ];
      return (
        <div className="preview-palette">
          {/* Primary Colors */}
          <div className="preview-palette__section">
            <div className="preview-palette__section-label">Primary</div>
            <div className="preview-palette__row">
              {primaryColors.map((c) => (
                <div key={c.name} className="preview-palette__swatch">
                  <div
                    className="preview-palette__color"
                    style={{
                      background: c.value,
                      border: c.name === "Void" ? "1px solid rgba(235,227,214,0.15)" : undefined,
                    }}
                  />
                  <div className="preview-palette__name">{c.name}</div>
                  <div className="preview-palette__value">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Secondary Colors */}
          <div className="preview-palette__section">
            <div className="preview-palette__section-label">Secondary</div>
            <div className="preview-palette__row">
              {secondaryColors.map((c) => (
                <div key={c.name} className="preview-palette__swatch">
                  <div
                    className="preview-palette__color"
                    style={{ background: c.value, border: "1px solid rgba(235,227,214,0.15)" }}
                  />
                  <div className="preview-palette__name">{c.name}</div>
                  <div className="preview-palette__value">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "color-palette-opacity": {
      const opacities = [4, 8, 15, 30, 50, 70];
      return (
        <div className="preview-palette preview-palette--opacity">
          <div className="preview-palette__section">
            <div className="preview-palette__section-label">Dawn</div>
            <div className="preview-palette__row">
              {opacities.map((o) => (
                <div
                  key={`dawn-${o}`}
                  className="preview-palette__swatch preview-palette__swatch--small"
                >
                  <div
                    className="preview-palette__color"
                    style={{ background: `rgba(235, 227, 214, ${o / 100})` }}
                  />
                  <div className="preview-palette__value">{o}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="preview-palette__section">
            <div className="preview-palette__section-label">Gold</div>
            <div className="preview-palette__row">
              {opacities.map((o) => (
                <div
                  key={`gold-${o}`}
                  className="preview-palette__swatch preview-palette__swatch--small"
                >
                  <div
                    className="preview-palette__color"
                    style={{ background: `rgba(202, 165, 84, ${o / 100})` }}
                  />
                  <div className="preview-palette__value">{o}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // FOUNDATIONS - Typography
    // ═══════════════════════════════════════════════════════════════
    case "type-display": {
      const text = (props.text as string) || "THOUGHTFORM";
      return (
        <div className="preview-type preview-type--display">
          <div
            className="preview-type__sample"
            style={{ fontFamily: "var(--font-display)", fontSize: fullSize ? "48px" : "32px" }}
          >
            {text}
          </div>
          <div className="preview-type__meta">PP Mondwest · Display Font</div>
        </div>
      );
    }

    case "type-body": {
      const text = (props.text as string) || "The quick brown fox jumps over the lazy dog.";
      return (
        <div className="preview-type preview-type--body">
          <div
            className="preview-type__sample"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: fullSize ? "18px" : "14px",
              lineHeight: 1.6,
            }}
          >
            {text}
          </div>
          <div className="preview-type__meta">IBM Plex Sans · Body Font</div>
        </div>
      );
    }

    case "type-data": {
      const text = (props.text as string) || "01 · METRIC · 42.5%";
      return (
        <div className="preview-type preview-type--data">
          <div
            className="preview-type__sample"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: fullSize ? "14px" : "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {text}
          </div>
          <div className="preview-type__meta">IBM Plex Mono · Data Font</div>
        </div>
      );
    }

    case "type-scale": {
      const sizes = [
        { name: "4xl", size: "48px", sample: "Display" },
        { name: "3xl", size: "36px", sample: "Heading 1" },
        { name: "2xl", size: "28px", sample: "Heading 2" },
        { name: "xl", size: "22px", sample: "Heading 3" },
        { name: "lg", size: "18px", sample: "Large Text" },
        { name: "base", size: "16px", sample: "Body Text" },
        { name: "sm", size: "14px", sample: "Small Text" },
        { name: "xs", size: "12px", sample: "Caption" },
      ];
      return (
        <div className="preview-type-scale">
          {sizes.map((s) => (
            <div key={s.name} className="preview-type-scale__row">
              <div className="preview-type-scale__label">{s.name}</div>
              <div className="preview-type-scale__sample" style={{ fontSize: s.size }}>
                {s.sample}
              </div>
              <div className="preview-type-scale__size">{s.size}</div>
            </div>
          ))}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // BRAND ELEMENTS
    // ═══════════════════════════════════════════════════════════════
    case "brand-mark": {
      const size = ((props.size as number) || 64) * scale;
      const color = (props.color as string) || "#caa554";
      return (
        <div className="preview-center">
          <DynamicSVG
            src="/logos/Thoughtform_Brandmark.svg"
            color={color}
            width={size}
            height={size}
          />
        </div>
      );
    }

    case "word-mark": {
      const height = ((props.height as number) || 32) * scale;
      const color = (props.color as string) || "#caa554";
      const focusedElementId = (props._focusedElementId as string) || null;
      const onElementFocus = props._onElementFocus as ((id: string | null) => void) | undefined;

      const wordmarks = [
        {
          id: "wordmark-standard",
          name: "Standard",
          src: "/logos/Thoughtform_Wordmark.svg",
        },
        {
          id: "wordmark-sans",
          name: "Sans",
          src: "/logos/Thoughtform_Wordmark-sans.svg",
        },
        {
          id: "wordmark-lockup-horizontal",
          name: "Horizontal Lockup",
          src: "/logos/Thoughtform_Wordmark_Lockup-Horizontal.svg",
        },
        {
          id: "wordmark-lockup-vertical",
          name: "Vertical Lockup",
          src: "/logos/Thoughtform_Wordmark_Lockup-Vertical.svg",
        },
      ];

      const hasFocusedElement = focusedElementId !== null;
      const focusedWordmark = hasFocusedElement
        ? wordmarks.find((w) => w.id === focusedElementId)
        : null;

      return (
        <div
          className={`preview-wordmarks ${hasFocusedElement ? "preview-wordmarks--has-focus" : ""}`}
        >
          {/* Grid of all wordmarks */}
          <div className="preview-wordmarks__grid">
            {wordmarks.map((wordmark) => {
              const isBlurred = hasFocusedElement;
              return (
                <div
                  key={wordmark.id}
                  className={`preview-wordmarks__item ${isBlurred ? "preview-wordmarks__item--blurred" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onElementFocus) {
                      onElementFocus(wordmark.id);
                    }
                  }}
                >
                  <div className="preview-wordmarks__label">{wordmark.name}</div>
                  <div className="preview-wordmarks__content">
                    <DynamicSVG src={wordmark.src} color={color} width="100%" height="100%" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Backdrop when element is focused */}
          {hasFocusedElement && (
            <div
              className="preview-wordmarks__backdrop"
              onClick={(e) => {
                e.stopPropagation();
                if (onElementFocus) onElementFocus(null);
              }}
            />
          )}

          {/* Centered focused element overlay */}
          {focusedWordmark && (
            <div className="preview-wordmarks__focused-overlay">
              <div
                className="preview-wordmarks__focused-content"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onElementFocus) onElementFocus(null);
                }}
              >
                <span className="preview-wordmarks__focused-label">
                  {focusedWordmark.name.toUpperCase()}
                </span>
                <div className="asset-focus-frame__content">
                  <DynamicSVG src={focusedWordmark.src} color={color} />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    case "vectors": {
      const color = "#caa554";
      const iconSize = fullSize ? 64 : 40;
      const focusedElementId = (props._focusedElementId as string) || null;
      const onElementFocus = props._onElementFocus as ((id: string | null) => void) | undefined;

      const vectors = [
        {
          id: "vector-1",
          name: "Slash",
          src: "/logos/Thoughtform_Vector-1.svg",
        },
        {
          id: "vector-2",
          name: "Cross",
          src: "/logos/Thoughtform_Vector-2.svg",
        },
        {
          id: "vector-3",
          name: "Arrows",
          src: "/logos/Thoughtform_Vector-3.svg",
        },
        {
          id: "vector-4",
          name: "Plus",
          src: "/logos/Thoughtform_Vector-4.svg",
        },
        {
          id: "vector-5",
          name: "Star",
          src: "/logos/Thoughtform_Vector-5.svg",
        },
        {
          id: "vector-6",
          name: "Compass",
          src: "/logos/Thoughtform_Vector-6.svg",
        },
      ];

      const hasFocusedElement = focusedElementId !== null;
      const focusedVector = hasFocusedElement
        ? vectors.find((v) => v.id === focusedElementId)
        : null;

      return (
        <div className={`preview-vectors ${hasFocusedElement ? "preview-vectors--has-focus" : ""}`}>
          {/* Grid of all vectors */}
          <div className="preview-vectors__grid">
            {vectors.map((vector) => {
              const isBlurred = hasFocusedElement;

              return (
                <div
                  key={vector.id}
                  className={`preview-vectors__item ${isBlurred ? "preview-vectors__item--blurred" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onElementFocus) {
                      onElementFocus(vector.id);
                    }
                  }}
                >
                  <div className="preview-vectors__item-content">
                    <DynamicSVG src={vector.src} color={color} width={iconSize} height={iconSize} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Backdrop when element is focused */}
          {hasFocusedElement && (
            <div
              className="preview-vectors__backdrop"
              onClick={(e) => {
                e.stopPropagation();
                if (onElementFocus) onElementFocus(null);
              }}
            />
          )}

          {/* Centered focused element overlay */}
          {focusedVector && (
            <div className="preview-vectors__focused-overlay">
              <div
                className="preview-vectors__focused-content"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onElementFocus) onElementFocus(null);
                }}
              >
                <span className="preview-vectors__focused-label">
                  {focusedVector.name.toUpperCase()}
                </span>
                <div className="asset-focus-frame__content">
                  <DynamicSVG src={focusedVector.src} color={color} />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ATOMS - Corner Brackets
    // ═══════════════════════════════════════════════════════════════
    case "corner-bracket": {
      const position = (props.position as CornerPosition) || "tl";
      const arm = ((props.arm as number) || 16) * scale;
      const thickness = (props.thickness as number) || 1.5;
      const color = (props.color as string) || "#caa554";
      return (
        <div className="preview-center" style={{ padding: 20 }}>
          <div style={{ position: "relative", width: arm * 2, height: arm * 2 }}>
            <CornerBracket position={position} arm={arm} thickness={thickness} color={color} />
          </div>
        </div>
      );
    }

    case "corner-brackets-group": {
      const corners = (props.corners as CornerToken) || "four";
      const arm = ((props.arm as number) || 16) * scale;
      const thickness = (props.thickness as number) || 1.5;
      const color = (props.color as string) || "#caa554";
      return (
        <div className="preview-center">
          <div style={{ position: "relative", width: 160 * scale, height: 100 * scale }}>
            <CornerBrackets corners={corners} arm={arm} thickness={thickness} color={color} />
          </div>
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ATOMS - Rails
    // ═══════════════════════════════════════════════════════════════
    case "rail": {
      const orientation = (props.orientation as string) || "vertical";
      const showTicks = props.showTicks !== false;
      const tickCount = (props.tickCount as number) || 11;
      const length = ((props.length as number) || 200) * scale;
      const railColor = (props.color as string) || "rgba(202, 165, 84, 0.3)";
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
          <div
            style={{
              position: "absolute",
              [isVertical ? "left" : "top"]: 0,
              [isVertical ? "top" : "left"]: 0,
              [isVertical ? "bottom" : "right"]: 0,
              [isVertical ? "width" : "height"]: "1px",
              background: `linear-gradient(${isVertical ? "to bottom" : "to right"}, transparent 0%, ${railColor} 10%, ${railColor} 90%, transparent 100%)`,
            }}
          />
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
                      background: isMajor ? railColor : `${railColor}`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // MOLECULES - Frames
    // ═══════════════════════════════════════════════════════════════
    case "frame-basic": {
      const corners = (props.corners as CornerToken) || "four";
      const borderStyle = (props.borderStyle as string) || "solid";
      const borderColor = (props.borderColor as string) || "rgba(235, 227, 214, 0.08)";
      const borderThickness = (props.borderThickness as number) ?? 1.5;
      const cornerColor = (props.cornerColor as string) || "#caa554";
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;
      const hasBorder = borderStyle !== "none";

      return (
        <HUDWrapper
          cornerToken={corners}
          borderThickness={hasBorder ? borderThickness : 0}
          cornerThickness={cornerThickness}
          borderColor={borderColor}
          cornerColor={cornerColor}
          cornerLength={fullSize ? 24 : 16}
        >
          <div style={{ width: 260 * scale, height: 140 * scale, padding: 16 }}>
            <div
              style={{
                color: "var(--dawn-50)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Frame Content
            </div>
          </div>
        </HUDWrapper>
      );
    }

    case "frame-terminal": {
      const title = (props.title as string) || "TERMINAL";
      const corners = (props.corners as CornerToken) || "four";
      const borderColor = (props.borderColor as string) || "rgba(235, 227, 214, 0.15)";
      const borderThickness = (props.borderThickness as number) ?? 1.5;
      const cornerColor = (props.cornerColor as string) || "#caa554";
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;

      return (
        <HUDWrapper
          cornerToken={corners}
          borderThickness={borderThickness}
          cornerThickness={cornerThickness}
          borderColor={borderColor}
          cornerColor={cornerColor}
          cornerLength={fullSize ? 24 : 16}
        >
          <div
            className={`preview-card preview-card--terminal ${fullSize ? "preview-card--full" : ""}`}
          >
            <div className="preview-card__header">
              <span className="preview-card__dot" />
              {title}
            </div>
            <div
              className="preview-card__body"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            >
              &gt; _
            </div>
          </div>
        </HUDWrapper>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ORGANISMS - Cards
    // ═══════════════════════════════════════════════════════════════
    case "card-content": {
      const corners = (props.corners as CornerToken) || "four";
      const borderThickness = (props.borderThickness as number) ?? 1.5;
      const cornerColor = (props.cornerColor as string) || "#caa554";

      return (
        <HUDWrapper
          cornerToken={corners}
          borderThickness={borderThickness}
          cornerThickness={borderThickness}
          borderColor="rgba(235, 227, 214, 0.08)"
          cornerColor={cornerColor}
          cornerLength={fullSize ? 24 : 12}
        >
          <div
            className={`preview-card preview-card--content ${fullSize ? "preview-card--full" : ""}`}
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

    case "card-data": {
      const corners = (props.corners as CornerToken) || "four";
      const borderThickness = (props.borderThickness as number) ?? 1.5;
      const cornerColor = (props.cornerColor as string) || "#caa554";

      return (
        <HUDWrapper
          cornerToken={corners}
          borderThickness={borderThickness}
          cornerThickness={borderThickness}
          borderColor="rgba(235, 227, 214, 0.08)"
          cornerColor={cornerColor}
          cornerLength={fullSize ? 20 : 10}
        >
          <div
            className={`preview-card preview-card--data ${fullSize ? "preview-card--full" : ""}`}
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
              {(props.value as string) || "42"}
            </div>
          </div>
        </HUDWrapper>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ORGANISMS - Navigation
    // ═══════════════════════════════════════════════════════════════
    case "navbar": {
      const showLogo = props.showLogo !== false;
      const activeLink = (props.activeLink as string) || "interface";
      const logoColor = (props.logoColor as string) || "#ebe3d6";
      const linkColor = (props.linkColor as string) || "rgba(235, 227, 214, 0.5)";
      const activeLinkColor = (props.activeLinkColor as string) || "#ebe3d6";

      const navLinks = [
        { id: "interface", label: "Interface" },
        { id: "manifesto", label: "Manifesto" },
        { id: "services", label: "Services" },
        { id: "about", label: "About" },
        { id: "contact", label: "Contact" },
      ];

      return (
        <div className="preview-navbar-real">
          {/* Logo */}
          {showLogo && (
            <div className="preview-navbar-real__logo">
              <ThoughtformLogo size={fullSize ? 22 : 18} color={logoColor} />
            </div>
          )}

          {/* Navigation Links */}
          <div className="preview-navbar-real__links">
            {navLinks.map((link) => (
              <span
                key={link.id}
                className={`preview-navbar-real__link ${activeLink === link.id ? "preview-navbar-real__link--active" : ""}`}
                style={{
                  color: activeLink === link.id ? activeLinkColor : linkColor,
                }}
              >
                {link.label}
              </span>
            ))}
          </div>
        </div>
      );
    }

    case "hud-frame": {
      const showCorners = props.showCorners !== false;
      const showRails = props.showRails !== false;
      // Use smaller scale for HUD frame to prevent overflow
      const hudScale = fullSize ? 1.2 : 1;
      const cornerSize = ((props.cornerSize as number) || 40) * hudScale;
      const cornerColor = (props.cornerColor as string) || "#caa554";
      const frameWidth = 400 * hudScale;
      const frameHeight = 300 * hudScale;
      const tickCount = 11;

      return (
        <div style={{ position: "relative", width: frameWidth, height: frameHeight }}>
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
          {showRails && (
            <>
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
            </>
          )}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // ORGANISMS - Buttons
    // ═══════════════════════════════════════════════════════════════
    case "button": {
      const variant = (props.variant as string) || "ghost";
      const btnSize = (props.size as string) || "md";
      const corners = (props.corners as CornerToken) || "four";
      const cornerColor = (props.cornerColor as string) || "#caa554";
      const cornerThickness = (props.cornerThickness as number) ?? 1.5;
      const hasCorners = corners !== "none" && cornerThickness > 0;

      const sizeStyles = {
        sm: fullSize ? "12px 24px" : "6px 12px",
        md: fullSize ? "16px 32px" : "10px 20px",
        lg: fullSize ? "20px 40px" : "14px 28px",
      };
      const variantStyles = {
        ghost: { background: "transparent", color: "var(--dawn-70)" },
        solid: { background: "var(--gold)", color: "var(--void)" },
        outline: { background: "transparent", color: "var(--gold)" },
      };

      return (
        <HUDWrapper
          cornerToken={corners}
          borderThickness={0}
          cornerThickness={hasCorners ? cornerThickness : 0}
          borderColor="transparent"
          cornerColor={cornerColor}
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

    // ═══════════════════════════════════════════════════════════════
    // ORGANISMS - Inputs
    // ═══════════════════════════════════════════════════════════════
    case "slider":
      return (
        <div style={{ width: "100%" }}>
          <div className="preview-slider__header">
            <span>{(props.label as string) || "Value"}</span>
            <span className="preview-slider__value">{(props.value as number) || 50}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
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

    // ═══════════════════════════════════════════════════════════════
    // LEGACY ALIASES (backward compatibility)
    // ═══════════════════════════════════════════════════════════════
    case "card-frame-content":
      return renderComponent("card-content", props, def, fullSize);
    case "card-frame-terminal":
      return renderComponent("frame-terminal", props, def, fullSize);
    case "card-frame-data":
      return renderComponent("card-data", { ...props, value: props.title }, def, fullSize);
    case "navigation-bar":
      return renderComponent("navbar", props, def, fullSize);
    case "hud-frame-complete":
      return renderComponent("hud-frame", props, def, fullSize);
    case "hud-corner":
      return renderComponent(
        "corner-bracket",
        {
          ...props,
          position: (props.position as string)?.replace("-", "").slice(0, 2) || "tl",
          arm: props.size,
          thickness: props.thickness,
        },
        def,
        fullSize
      );
    case "hud-rail":
      return renderComponent("rail", props, def, fullSize);

    // ═══════════════════════════════════════════════════════════════
    // REMOVED/DEPRECATED
    // ═══════════════════════════════════════════════════════════════
    case "select":
    case "glitch-text":
      return <div className="preview-default">{def.name}</div>;

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
    // Foundations
    "color-palette-primary": "ColorPalette",
    "color-palette-semantic": "ColorPalette",
    "color-palette-opacity": "ColorPalette",
    "type-display": "Typography",
    "type-body": "Typography",
    "type-data": "Typography",
    "type-scale": "TypeScale",
    // Atoms
    "brand-mark": "BrandMark",
    "word-mark": "WordMark",
    "word-mark-sans": "WordMarkSans",
    "word-mark-lockup-horizontal": "WordMarkLockupHorizontal",
    "word-mark-lockup-vertical": "WordMarkLockupVertical",
    "corner-bracket": "CornerBracket",
    "corner-brackets-group": "CornerBrackets",
    rail: "Rail",
    // Molecules
    "frame-basic": "Frame",
    "frame-terminal": "Frame",
    // Organisms
    "card-content": "Card",
    "card-data": "Card",
    navbar: "NavigationBar",
    "hud-frame": "HUDFrame",
    button: "Button",
    slider: "Slider",
    toggle: "Toggle",
  };

  const componentName = componentNames[componentId] || def.name.replace(/\s+/g, "");

  const propsEntries = Object.entries(props).filter(([key, value]) => {
    const propDef = def.props.find((p) => p.name === key);
    return propDef && value !== propDef.default;
  });

  // Add variant prop for certain components
  if (componentId === "card-data") {
    propsEntries.push(["variant", "data"]);
  } else if (componentId === "frame-terminal") {
    propsEntries.push(["variant", "terminal"]);
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

// Helper to convert active corners set to token
function cornersToToken(corners: Set<string>): CornerToken {
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
function tokenToCorners(token: CornerToken): Set<string> {
  return new Set(tokenToPositions(token));
}

function CornerSelector({
  value,
  onChange,
}: {
  value: CornerToken;
  onChange: (value: CornerToken) => void;
}) {
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

/**
 * HUDWrapper - Now using Frame from @thoughtform/ui
 * This is a thin wrapper that maps the legacy props to the new Frame component
 */
function HUDWrapper({
  children,
  cornerToken = "four",
  borderThickness = 0,
  cornerThickness: cornerThicknessValue = 1.5,
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

// ═══════════════════════════════════════════════════════════════
// LEFT PANEL - CATALOG
// ═══════════════════════════════════════════════════════════════

function CatalogPanel({
  selectedCategory,
  onSelectCategory,
  selectedComponentId,
  onSelectComponent,
}: {
  selectedCategory: string | null;
  onSelectCategory: (id: string) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredComponents = searchQuery ? searchComponents(searchQuery) : null;

  // Build initial expanded IDs
  const defaultExpandedIds = ["brand"];

  return (
    <aside className="astrogation-panel astrogation-panel--left">
      {/* Panel Header */}
      <div className="panel-header">{"// BRAND SYSTEM"}</div>

      {/* Scrollable content area */}
      <div className="panel-content">
        {/* Search */}
        <div className="astrogation-section">
          <div className="input-group">
            <div className="input-group__addon input-group__addon--start">
              <span className="input-group__icon">○</span>
            </div>
            <input
              type="text"
              className="input-group__input"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

        {/* Component Tree */}
        {!filteredComponents && (
          <div className="astrogation-section astrogation-section--categories">
            <TreeProvider
              defaultExpandedIds={defaultExpandedIds}
              selectedId={selectedComponentId}
              onSelectionChange={onSelectComponent}
            >
              <TreeView>
                {CATEGORIES.map((cat, catIndex) => {
                  const components = getComponentsByCategory(cat.id);
                  const hasChildren = components.length > 0;
                  const isLastCategory = catIndex === CATEGORIES.length - 1;
                  const showSeparator = HIERARCHY_BREAKS.includes(cat.id);

                  return (
                    <div key={cat.id}>
                      <TreeNode nodeId={cat.id} isLast={isLastCategory}>
                        <TreeNodeTrigger nodeId={cat.id} hasChildren={hasChildren}>
                          <TreeExpander nodeId={cat.id} hasChildren={hasChildren} />
                          <TreeIcon hasChildren nodeId={cat.id} />
                          <TreeLabel>{cat.name}</TreeLabel>
                        </TreeNodeTrigger>

                        <TreeNodeContent nodeId={cat.id} hasChildren={hasChildren}>
                          {components.map((comp, compIndex) => {
                            const isLast = compIndex === components.length - 1;
                            return (
                              <TreeNode key={comp.id} nodeId={comp.id} level={1} isLast={isLast}>
                                <TreeNodeTrigger
                                  nodeId={comp.id}
                                  onClick={() => onSelectComponent(comp.id)}
                                >
                                  <TreeExpander nodeId={comp.id} />
                                  <TreeIcon />
                                  <TreeLabel>{comp.name}</TreeLabel>
                                </TreeNodeTrigger>
                              </TreeNode>
                            );
                          })}
                        </TreeNodeContent>
                      </TreeNode>
                      {/* Hierarchy separator */}
                      {showSeparator && <div className="hierarchy-separator" />}
                    </div>
                  );
                })}
              </TreeView>
            </TreeProvider>
          </div>
        )}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// CENTER PANEL - VAULT / FOUNDRY TABS
// ═══════════════════════════════════════════════════════════════

type WorkspaceTab = "vault" | "foundry";

function CenterPanel({
  activeTab,
  onTabChange,
  selectedComponentId,
  componentProps,
  style,
  presets,
  onLoadPreset,
  onDeletePreset,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
  isFocused,
  onFocusChange,
}: {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
}) {
  const def = selectedComponentId ? (getComponentById(selectedComponentId) ?? null) : null;

  return (
    <div className="center-panel">
      {/* Tab Header */}
      <div className="workspace-tabs">
        <button
          className={`workspace-tab ${activeTab === "vault" ? "workspace-tab--active" : ""}`}
          onClick={() => onTabChange("vault")}
        >
          <span className="workspace-tab__icon">◇</span>
          <span>VAULT</span>
        </button>
        <button
          className={`workspace-tab ${activeTab === "foundry" ? "workspace-tab--active" : ""}`}
          onClick={() => onTabChange("foundry")}
        >
          <span className="workspace-tab__icon">⬡</span>
          <span>FOUNDRY</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="workspace-content">
        {activeTab === "vault" ? (
          <VaultView
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            style={style}
            presets={presets}
            onLoadPreset={onLoadPreset}
            onDeletePreset={onDeletePreset}
          />
        ) : (
          <FoundryView
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            style={style}
            def={def}
            onSavePreset={onSavePreset}
            presetName={presetName}
            onPresetNameChange={onPresetNameChange}
            canSave={canSave}
            isFocused={isFocused}
            onFocusChange={onFocusChange}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VAULT VIEW - Saved Elements & Preview
// ═══════════════════════════════════════════════════════════════

function VaultView({
  selectedComponentId,
  componentProps,
  style,
  presets,
  onLoadPreset,
  onDeletePreset,
}: {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
}) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  // Focus state for multi-element components
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  // Check if this is a multi-element component
  const isMultiElement = selectedComponentId === "vectors" || selectedComponentId === "word-mark";

  // Handle element focus for multi-element components
  const handleElementFocus = useCallback((id: string | null) => {
    setFocusedElementId(id);
  }, []);

  // Filter presets if a component is selected, otherwise show all
  const filteredPresets = selectedComponentId
    ? presets.filter((p) => p.component_key === selectedComponentId)
    : presets;

  // Group presets by component type for the "All Presets" view
  const groupedPresets = filteredPresets.reduce(
    (acc, preset) => {
      const key = preset.component_key;
      if (!acc[key]) acc[key] = [];
      acc[key].push(preset);
      return acc;
    },
    {} as Record<string, UIComponentPreset[]>
  );

  return (
    <div className="vault">
      {/* Component Preview Area */}
      <div className="vault__preview">
        {def ? (
          isMultiElement ? (
            // For multi-element components, don't wrap in TargetReticle
            <ComponentPreview
              componentId={selectedComponentId!}
              props={{
                ...componentProps,
                _focusedElementId: focusedElementId,
                _onElementFocus: handleElementFocus,
              }}
              style={style}
              fullSize
            />
          ) : (
            // For single-element components, wrap in TargetReticle
            <TargetReticle label={def.name.toUpperCase()}>
              <ComponentPreview
                componentId={selectedComponentId!}
                props={componentProps}
                style={style}
                fullSize
              />
            </TargetReticle>
          )
        ) : (
          <div className="vault__empty-preview">
            <span className="vault__icon">◇</span>
            <p>Select a component to preview its specifications</p>
          </div>
        )}
      </div>

      {/* Saved Elements Section - Only show if there are variants or no component selected */}
      {(filteredPresets.length > 0 || !def) && (
        <>
          <div className="vault__header">
            <span className="vault__count">
              {def
                ? `Saved Variants for ${def.name}`
                : `${presets.length} saved element${presets.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {filteredPresets.length === 0 ? (
            <div className="vault__empty-state vault__empty-state--inline">
              <p>No saved variants found</p>
            </div>
          ) : (
            <div className="vault__grid">
              {Object.entries(groupedPresets).map(([componentKey, componentPresets]) => {
                const compDef = getComponentById(componentKey);
                return (
                  <div key={componentKey} className="vault__group">
                    {!def && (
                      <div className="vault__group-header">{compDef?.name || componentKey}</div>
                    )}
                    <div className="vault__items">
                      {componentPresets.map((preset) => (
                        <div key={preset.id} className="vault__item">
                          <button
                            className="vault__item-load"
                            onClick={() => onLoadPreset(preset)}
                            title={`Load ${preset.name}`}
                          >
                            <span className="vault__item-name">{preset.name}</span>
                          </button>
                          <button
                            className="vault__item-delete"
                            onClick={() => onDeletePreset(preset.id)}
                            title="Delete preset"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPEC PANEL - Static Data / Documentation
// ═══════════════════════════════════════════════════════════════

function SpecPanel({ selectedComponentId }: { selectedComponentId: string | null }) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  if (!def) {
    return (
      <aside className="astrogation-panel astrogation-panel--right">
        <div className="panel-header">SPECIFICATIONS</div>
        <div className="panel-content panel-content--empty">
          <div className="empty-state">
            <span className="empty-state__icon">◇</span>
            <p>Select a component to edit</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="astrogation-panel astrogation-panel--right">
      <div className="panel-header">SPECIFICATIONS</div>
      <div className="panel-content">
        <div className="spec-panel">
          <div className="spec-panel__header">
            <h2 className="spec-panel__title">{def.name}</h2>
            <p className="spec-panel__desc">{def.description}</p>
          </div>

          <div className="spec-panel__section">
            <div className="spec-panel__label">Component ID</div>
            <div className="spec-panel__value spec-panel__value--mono">{def.id}</div>
          </div>

          <div className="spec-panel__section">
            <div className="spec-panel__label">Properties & Schema</div>
            <div className="spec-panel__props">
              {def.props.map((prop) => (
                <div key={prop.name} className="spec-prop">
                  <div className="spec-prop__header">
                    <span className="spec-prop__name">{prop.name}</span>
                    <span className="spec-prop__type">{prop.type}</span>
                  </div>
                  <div className="spec-prop__details">
                    <div className="spec-prop__row">
                      <span className="spec-prop__detail-label">Default:</span>
                      <span className="spec-prop__detail-value">{String(prop.default ?? "—")}</span>
                    </div>
                    {prop.type === "number" && (
                      <div className="spec-prop__row">
                        <span className="spec-prop__detail-label">Range:</span>
                        <span className="spec-prop__detail-value">
                          {prop.min ?? 0}–{prop.max ?? 100}
                          {prop.step ? ` (Step: ${prop.step})` : ""}
                        </span>
                      </div>
                    )}
                    {prop.type === "select" && (
                      <div className="spec-prop__row">
                        <span className="spec-prop__detail-label">Options:</span>
                        <span className="spec-prop__detail-value">{prop.options?.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// FOUNDRY VIEW - Component Editor & Preview
// ═══════════════════════════════════════════════════════════════

function FoundryView({
  selectedComponentId,
  componentProps,
  style,
  def,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
  isFocused,
  onFocusChange,
}: {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  def: ComponentDef | null;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
}) {
  // Zoom state for the preview
  const [zoom, setZoom] = useState(1);
  // Track which element within a multi-element component is focused
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  // Handle wheel zoom on preview area
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;
    const ZOOM_STEP = 0.1;

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);

  // Handle element focus for multi-element components (like vectors)
  // Note: For multi-element components, we DON'T set the parent focus state
  // because we don't want to blur the side panels - focus is contained within the preview
  const handleElementFocus = useCallback((elementId: string | null) => {
    setFocusedElementId(elementId);
    // Don't call onFocusChange - keep panel blur separate from element focus
  }, []);

  // Check if this is a multi-element component
  const isMultiElement = selectedComponentId === "vectors" || selectedComponentId === "word-mark";

  // Handle click to focus/unfocus (for single-element components)
  const handlePreviewClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't toggle if clicking on a specific element within vectors
      const target = e.target as HTMLElement;
      if (target.closest(".preview-vectors__item")) {
        return; // Let the item's own handler manage focus
      }

      e.stopPropagation();
      if (focusedElementId) {
        // If an element is focused (multi-element), clicking outside unfocuses it
        setFocusedElementId(null);
      } else if (!isMultiElement) {
        // Only toggle parent focus for single-element components
        onFocusChange(!isFocused);
      }
    },
    [isFocused, focusedElementId, isMultiElement, onFocusChange]
  );

  // Handle click outside to unfocus
  useEffect(() => {
    if (!isFocused && !focusedElementId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".foundry__preview")) {
        // Clear element focus (for multi-element components)
        setFocusedElementId(null);
        // Clear parent focus (for single-element components)
        if (isFocused) {
          onFocusChange(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isFocused, focusedElementId, onFocusChange]);

  // Reset zoom and element focus when component changes
  useEffect(() => {
    setZoom(1);
    setFocusedElementId(null);
    onFocusChange(false);
  }, [selectedComponentId, onFocusChange]);

  if (!selectedComponentId || !def) {
    return (
      <div className="foundry foundry--empty">
        <div className="foundry__empty-state">
          <span className="foundry__icon">⬡</span>
          <p>Select a component to begin</p>
          <span className="foundry__hint">
            Choose from the Brand System panel to start crafting
          </span>
        </div>
      </div>
    );
  }

  // Calculate zoom - only apply focus zoom for single-element components
  const hasFocus = isFocused || focusedElementId !== null;
  // For multi-element components, individual elements handle their own zoom
  const focusZoom = hasFocus && !isMultiElement ? 1.5 : 1;
  const totalZoom = zoom * focusZoom;

  return (
    <div className={`foundry ${hasFocus && !isMultiElement ? "foundry--focused" : ""}`}>
      {/* Preview Area */}
      <div
        className={`foundry__preview ${hasFocus && !isMultiElement ? "foundry__preview--focused" : ""}`}
        onWheel={handleWheel}
        onClick={handlePreviewClick}
      >
        <div
          className="foundry__preview-content"
          style={{
            transform: `scale(${isMultiElement ? zoom : totalZoom})`,
            transformOrigin: "center center",
            transition: hasFocus ? "transform 0.3s ease-out" : "transform 0.2s ease-out",
          }}
        >
          {isMultiElement ? (
            // For multi-element components, don't wrap in TargetReticle
            <ComponentPreview
              componentId={selectedComponentId}
              props={{
                ...componentProps,
                _focusedElementId: focusedElementId,
                _onElementFocus: handleElementFocus,
              }}
              style={style}
              fullSize
            />
          ) : (
            // For single-element components, wrap in TargetReticle
            <TargetReticle label={def.name.toUpperCase()}>
              <ComponentPreview
                componentId={selectedComponentId}
                props={componentProps}
                style={style}
                fullSize
              />
            </TargetReticle>
          )}
        </div>
        {/* Zoom indicator */}
        {zoom !== 1 && <div className="foundry__zoom-indicator">{Math.round(zoom * 100)}%</div>}
      </div>

      {/* Info */}
      <div className="foundry__info">
        <span>Click to interact • Edit properties in the right panel</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RIGHT PANEL - DIALS / EDITOR
// ═══════════════════════════════════════════════════════════════

// Group props by category for organized display
function categorizeProp(propName: string): string {
  const name = propName.toLowerCase();
  // Content props
  if (["label", "title", "text", "index", "placeholder", "name"].includes(name)) return "content";
  // Style props
  if (["variant", "size", "accent", "accentcolor", "position", "orientation"].includes(name))
    return "style";
  // General color props (background, text, fill)
  if (
    ["backgroundcolor", "textcolor", "fillcolor"].includes(name) ||
    (name.includes("fill") && !name.includes("border") && !name.includes("corner"))
  )
    return "colors";
  // Border props (including borderColor)
  if (["borderthickness", "borderstyle", "bordercolor"].includes(name)) return "borders";
  // Corner props (including cornerColor)
  if (["cornertoken", "cornerthickness", "cornercolor", "cornersize"].includes(name))
    return "corners";
  // Toggle/boolean props
  if (name.startsWith("show") || ["checked", "disabled"].includes(name)) return "toggles";
  // Dimension props
  if (
    ["width", "height", "length", "tickcount", "min", "max", "step", "value", "intensity"].includes(
      name
    )
  )
    return "dimensions";
  return "other";
}

const PROP_CATEGORY_ORDER = [
  "content",
  "style",
  "colors",
  "borders",
  "corners",
  "toggles",
  "dimensions",
  "other",
];
const PROP_CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  style: "Style",
  colors: "Colors",
  borders: "Borders",
  corners: "Corners",
  toggles: "Options",
  dimensions: "Dimensions",
  other: "Other",
};

function DialsPanel({
  selectedComponentId,
  componentProps,
  onPropsChange,
  onCopyCode,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
}: {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
  onCopyCode: () => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
}) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  const renderPropControl = (propDef: PropDef, value: unknown, compact = false) => {
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

      case "color": {
        const currentColor = currentValue as string;
        const supportsTransparent =
          propDef.name.toLowerCase().includes("background") ||
          propDef.name.toLowerCase().includes("fill");
        // Use subtle border colors for border properties
        const isBorderColor = propDef.name.toLowerCase().includes("bordercolor");
        const colorOptions = isBorderColor ? BORDER_COLORS : BRAND_COLORS;

        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <div className="color-picker">
              <div className="color-swatches">
                {supportsTransparent && (
                  <button
                    className={`color-swatch color-swatch--none ${currentColor === "transparent" ? "active" : ""}`}
                    title="None / Transparent"
                    onClick={() =>
                      onPropsChange({ ...componentProps, [propDef.name]: "transparent" })
                    }
                  >
                    <span className="swatch-x">✕</span>
                  </button>
                )}
                {colorOptions.map((c) => (
                  <button
                    key={c.name}
                    className={`color-swatch ${currentColor === c.value ? "active" : ""}`}
                    style={{ background: c.value }}
                    title={c.name}
                    onClick={() => {
                      if (currentColor === c.value) {
                        const fallback = supportsTransparent
                          ? "transparent"
                          : (propDef.default as string);
                        onPropsChange({ ...componentProps, [propDef.name]: fallback });
                      } else {
                        onPropsChange({ ...componentProps, [propDef.name]: c.value });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "corners":
        // Corner selector is self-explanatory, no label needed
        return (
          <div className="dial-group dial-group--corners">
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
        <div className="panel-header">{"// DIALS"}</div>
        <div className="panel-content">
          <div className="panel-empty-state">
            <span className="panel-empty-state__icon">◇</span>
            <p>Select a component to edit</p>
          </div>
        </div>
      </aside>
    );
  }

  // Prop ordering within categories (consistent across all components)
  const propOrder: Record<string, string[]> = {
    colors: ["backgroundColor", "textColor", "fillColor"],
    borders: ["borderStyle", "borderColor", "borderThickness"],
    corners: ["cornerToken", "cornerColor", "cornerSize", "cornerThickness"],
  };

  // Group props by category
  const groupedProps: Record<string, PropDef[]> = {};
  def.props.forEach((propDef) => {
    const category = categorizeProp(propDef.name);
    if (!groupedProps[category]) groupedProps[category] = [];
    groupedProps[category].push(propDef);
  });

  // Sort props within categories that have a defined order
  Object.keys(propOrder).forEach((category) => {
    if (groupedProps[category]) {
      const order = propOrder[category];
      groupedProps[category].sort((a, b) => {
        const aIndex = order.indexOf(a.name);
        const bIndex = order.indexOf(b.name);
        // Props not in order list go to the end
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
    }
  });

  return (
    <aside className="astrogation-panel astrogation-panel--right">
      <div className="panel-header">{"// DIALS"}</div>

      <div className="panel-content">
        <div className="panel-content__scrollable">
          {/* Render props grouped by category */}
          {PROP_CATEGORY_ORDER.map((category) => {
            const props = groupedProps[category];
            if (!props || props.length === 0) return null;

            return (
              <div key={category} className="dials-category">
                <div className="dials-category__header">
                  <span className="dials-category__label">{PROP_CATEGORY_LABELS[category]}</span>
                </div>
                <div className="dials-category__content">
                  {props.map((propDef) => (
                    <div key={propDef.name}>
                      {renderPropControl(propDef, componentProps[propDef.name])}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="dials-actions">
            <button className="action-btn action-btn--full" onClick={onCopyCode}>
              Copy JSX Code
            </button>
          </div>
        </div>

        {/* Save Section - Fixed at bottom */}
        <div className="dials-save">
          <div className="dials-save__group">
            <input
              type="text"
              className="dials-save__input"
              placeholder="Name your creation..."
              value={presetName}
              onChange={(e) => onPresetNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSave && onSavePreset()}
            />
            <button className="dials-save__btn" onClick={onSavePreset} disabled={!canSave}>
              Save to Vault
            </button>
          </div>
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

  // Workspace tab state
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("foundry");

  // Focus state for Foundry mode
  const [isFocused, setIsFocused] = useState(false);

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
        // Removed auto-switch to Foundry to make it optional as per user request
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
      // Switch to Foundry to show the loaded preset
      setActiveTab("foundry");
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
        />

        <CenterPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedComponentId={selectedComponentId}
          componentProps={componentProps}
          style={style}
          presets={presets}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          onSavePreset={handleSavePreset}
          presetName={presetName}
          onPresetNameChange={setPresetName}
          canSave={!!selectedComponentId && !!presetName.trim()}
          isFocused={isFocused}
          onFocusChange={setIsFocused}
        />

        {activeTab === "foundry" ? (
          <DialsPanel
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            onPropsChange={setComponentProps}
            onCopyCode={handleCopyCode}
            onSavePreset={handleSavePreset}
            presetName={presetName}
            onPresetNameChange={setPresetName}
            canSave={!!selectedComponentId && !!presetName.trim()}
          />
        ) : (
          <SpecPanel selectedComponentId={selectedComponentId} />
        )}
      </div>

      {/* Footer */}
      <footer className="astrogation-footer">
        <div className="astrogation-footer__left"></div>
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
  // TODO: Re-enable authentication after testing
  const BYPASS_AUTH = true; // TEMPORARY - remove after testing

  const { user, isLoading } = useAuth();

  if (isLoading && !BYPASS_AUTH) {
    return (
      <div className="astrogation astrogation--loading">
        <span className="astrogation__loading">Loading...</span>
      </div>
    );
  }

  if (!BYPASS_AUTH && (!user?.email || !isAllowedUserEmail(user.email))) {
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

  // In dev mode or with bypass, AdminGate will automatically allow access
  return (
    <AdminGate>
      <AstrogationContent />
    </AdminGate>
  );
}
