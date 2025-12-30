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
          <svg viewBox="0 0 430.99 436" width={size} height={size} fill={color}>
            <path d="M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z" />
            <path d="M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z" />
            <path d="M29.12,218.81l132.09-.05v.05H29.12h0Z" />
            <path d="M163.32,250.35l12.58.05h-12.58v-.05Z" />
            <path d="M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z" />
            <path d="M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z" />
            <path d="M254.35,0l-33.01,182.26h-.6L254.35,0h0Z" />
          </svg>
        </div>
      );
    }

    case "word-mark": {
      const height = ((props.height as number) || 32) * scale;
      const color = (props.color as string) || "#caa554";
      // Aspect ratio from viewBox: 2612.01 / 371.76 ≈ 7.03
      const width = height * 7.03;
      return (
        <div className="preview-center">
          <svg viewBox="0 0 2612.01 371.76" width={width} height={height} fill={color}>
            <path d="M1857.1,46.62v13.77h-148.1v290.77h-35.97V46.62h184.07,0Z" />
            <path d="M1219.19,50.18v6.88c10.66-.22,21.76-.89,23.1,12.21l-.45,262.7c-2.44,11.55-13.54,9.1-22.65,9.1v6.88h83.27v-6.88c-19.54,1.33-23.09-1.11-24.43-20.21v-121.91h96.14v133.46c0,9.1-16.87,9.55-23.09,8.66v6.88h83.49v-6.88c-10.22,0-21.54,2.44-23.09-10.88l.88-265.81c2.89-8.66,14.88-7.11,22.21-7.33v-6.88h-83.27v6.88c5.56,0,13.1-.67,18.21,2,1.56.89,4.89,5.55,4.89,6.66v119.47h-94.37l-1.77-1.78v-108.59c0-.44,1.11-7.99,1.33-8.88,2.44-10.44,14.43-8.88,22.87-8.88v-6.88h-83.49.22Z" />
            <path d="M202.06,50.18l-1.78,6.88c13.32,0,22.65-1.11,24.42,14.43v252.93c-1.33,17.54-8.22,17.32-24.42,16.65v6.88h83.48v-6.88c-6.44-.44-16.65,2-20.43-4.44-.67-.89-2.66-6-2.66-6.66v-129.91h96.14v128.8c0,.44-2,6-2.44,6.88-4.22,7.11-13.77,5.11-20.65,5.33v6.88h82.15v-6.88c-11.1,0-20.2,1.78-22.65-11.55-3.55-19.98,1.78-45.97-.44-66.4-1.11-10.66-8.21-25.09-10.21-37.31-3.55-23.54-2.22-50.19,3.55-73.28,1.55-6,5.77-14.88,6.44-19.99,2.89-19.1-2.89-44.64.67-64.18,2.22-12.66,11.99-11.55,22.65-11.55v-6.88h-82.15v6.88c5.99,0,17.32-.44,20.65,5.33.44.67,2.44,6.44,2.44,6.88v116.14h-96.14v-117.25c0-.44,2.44-5.77,2.89-6.44,4.22-5.55,13.99-4.66,20.2-4.66v-6.88h-81.71v.25Z" />
            <path d="M1034.02,197.18l2.66,1.78,111.46.89c6.22,2.44,6.89,13.32,7.33,19.32,2.22,31.76-1.77,66.17,0,98.37l-.66,2.89c-45.08,36.2-112.8,29.76-150.54-13.77-62.84-72.84-43.08-245.16,71.71-251.82,19.76-1.11,67.95,7.55,73.94,30.2,5.77,22.21-12.43,32.2-25.31,45.97v2.22l3.55,3.33,53.73-53.74c-59.95-52.63-166.52-45.97-216.48,17.32-47.74,60.62-44.41,172.1,19.76,220.51,53.96,40.64,156.09,41.75,205.38-7.55l.89-105.26c2-11.32,14.21-8.66,22.87-8.88v-13.77h-180.74v11.99h.45Z" />
            <path d="M1638.7,86.88h-6.21s-7.84-16.26-14.39-20.67c-9.68-6.6-23.02-9.5-34.88-9.19-1.07.02-2.11.09-3.13.15-3.13.27-5.6.76-7.48,1.49-.34.11-.67.24-.96.38-.22.11-.44.22-.67.36-2.82,1.46-4.17,3.69-4.95,6.68,0,.04-.04.11-.04.15-.13.31-.25.62-.33.93v260.7c-.23,5.55,4.21,13.32,9.99,13.32h17.76v6.88h-92.37v-6.88h17.77c5.77,0,10.21-7.77,9.99-13.32V67.16c-.09-.31-.2-.62-.33-.93,0-.07-.03-.11-.05-.15-.78-3-2.13-5.22-4.95-6.68-.22-.13-.44-.24-.67-.36-.29-.13-.62-.27-.95-.38-1.89-.73-4.35-1.22-7.48-1.49-1.03-.07-2.07-.13-3.13-.15-11.86-.31-25.21,2.6-34.89,9.19-6.55,4.42-14.38,20.67-14.38,20.67h-6.22l6.33-28.94,1.66-7.66h166.97l1.67,7.66,6.32,28.94h0Z" />
            <path d="M182.96,86.88h-6.22s-7.84-16.26-14.39-20.67c-9.68-6.6-23.03-9.5-34.88-9.19-1.07.02-2.11.09-3.13.15-3.13.27-5.6.76-7.48,1.49-.33.11-.67.24-.95.38-.22.11-.44.22-.67.36-2.82,1.46-4.17,3.69-4.95,6.68,0,.04-.04.11-.04.15-.13.31-.24.62-.33.93v260.7c-.22,5.55,4.22,13.32,9.99,13.32h17.76v6.88H45.3v-6.88h17.76c5.77,0,10.21-7.77,9.99-13.32V67.16c-.09-.31-.2-.62-.33-.93,0-.07-.02-.11-.04-.15-.78-3-2.13-5.22-4.95-6.68-.22-.13-.44-.24-.67-.36-.29-.13-.62-.27-.96-.38-1.89-.73-4.35-1.22-7.48-1.49-1.02-.07-2.07-.13-3.13-.15-11.86-.31-25.2,2.6-34.88,9.19-6.55,4.42-14.39,20.67-14.39,20.67H0l6.33-28.94,1.66-7.66h166.97l1.67,7.66,6.33,28.94h0Z" />
            <path d="M1800.08,185.19h-97.34v13.77h97.34v-13.77Z" />
            <path d="M876.38,50.18v6.88c11.76,0,21.53-.89,23.09,13.32-3.33,68.84,4.44,141.68,0,210.29-2.67,40.64-25.54,65.95-67.95,62.84-33.52-2.44-46.84-27.98-50.17-58.4v-75.64h-28.86v-.09h-1.11c.89,11.1-4.66,22.65-5.77,33.09-5.55,56.63,9.99,103.26,73.49,107.92,49.96,3.78,83.71-14.88,87.48-67.51,4.66-68.4-3.55-142.12,0-211.18,1.78-15.32,9.55-14.66,23.09-14.66v-6.88h-53.28v.02Z" />
            <path d="M745.6,138.56c1.11,11.33,6.66,24.43,6.88,36.42h28.86v-105.7c.44-13.1,12.88-12.44,23.09-12.21v-6.88h-83.26v6.88c19.98-1.11,23.09,2.22,24.42,21.32,1.11,19.1-2,41.08,0,60.18h.01Z" />
            <path d="M618.6,47.31c21.38,9.15,40.54,22.12,56.95,38.53,15.74,15.74,28.13,34.51,36.84,55.74,4.17,10.17,7.39,20.74,9.61,31.44l.38,1.78h21.01l-.24-2.44c-1.64-16.14-5.64-32.2-11.9-47.68-8.66-21.21-21.36-40.28-37.81-56.67-16.5-16.5-35.66-29.2-56.93-37.77-6.66-2.71-13.63-5.06-20.67-6.95l-2.33-.62-3.91,21.03,1.73.67c2.18.84,4.73,1.84,7.3,2.98h-.02v-.04Z" />
            <path d="M725.35,213.31c-.6,18.14-4.22,35.82-10.79,52.54-7.15,18.34-18.12,35.02-32.59,49.54-14.16,13.81-29.69,24.32-46.18,31.2-16.5,6.88-33.79,10.39-51.4,10.39-9.86,0-19.72-1.04-29.38-3.09-2.02-.38-4.09-.84-6.17-1.38-2.49-.62-4.35-1.13-6.13-1.69-5.97-1.75-12.08-3.98-18.65-6.77-1-.42-2.07-.89-3.11-1.35-.96-.42-1.91-.87-2.86-1.35-2-.93-3.97-1.91-5.93-2.91-17.43-9.04-33.57-20.9-47.98-35.26-16.76-16.43-30.04-36.02-39.5-58.25-4.48-10.42-7.95-21.19-10.35-32.04-.44-1.89-.89-3.95-1.31-6.31-.38-2.11-.71-4.24-1.02-6.35-.71-5.2-1.2-10.19-1.44-14.83-.09-2.11-.18-4.24-.18-6.46-.04-.78-.04-1.55-.04-2.33,0-1.29,0-2.55.09-3.93.38-17.43,3.75-34.4,10.06-50.45,6.79-17.23,17.36-33.07,31.42-47.08,14.08-14.12,29.84-24.69,46.87-31.42,17.07-6.75,35.12-10.19,53.66-10.19,5.22,0,10.12.22,15.03.67l2.02.18,3.17-17.05h-2.66c-23.07,0-46.03,4.6-68.19,13.68-22.36,9.13-42.52,22.58-59.88,39.99-17.79,17.74-31.42,37.8-40.5,59.62-5.66,13.52-9.61,27.56-11.72,41.7-.31,2.18-.6,4.35-.82,6.48-.27,2.18-.44,4.35-.62,6.55-.31,4.53-.47,8.77-.47,12.9,0,.82,0,1.62.04,2.31,0,1.98.07,4.06.22,6.53.09,2.44.24,4.6.44,6.55,1.51,16.99,5.62,33.73,12.21,49.76,8.57,20.79,21.29,39.68,37.81,56.16,17.07,16.81,36.79,29.87,58.64,38.79,3.82,1.56,6.9,2.71,9.7,3.64,2.4.84,4.4,1.51,6.26,2.04,2.09.64,4.22,1.27,6.31,1.82,6.44,1.73,13.05,3.09,19.8,4.06,2.13.29,4.24.6,6.33.8,1.98.24,4.11.42,6.53.55,3.93.33,8.06.49,12.66.49,23.05,0,45.72-4.42,67.32-13.17,21.58-8.73,41.25-21.85,58.46-39.08,17.43-17.74,30.89-37.95,39.99-60.09,6.08-14.81,10.17-30.2,12.17-45.74l.33-2.51h-17.54l-.07,2.15h-.07v-.02h0Z" />
            <path d="M2045.83,337.97h-124.12v13.55h124.12v-13.55Z" />
            <path d="M1885.27,106.8h-35.97v184.76h35.97V106.8h0Z" />
            <path d="M2117.76,106.8h-35.97v184.76h35.97V106.8h0Z" />
            <path d="M2045.83,60.39v-13.21h-124.54v13.21h-35.97v46.41h35.97v-46.08h124.54v46.08h35.96v-46.41h-35.96Z" />
            <path d="M1921.71,291.56h-35.97v46.41h35.97v-46.41Z" />
            <path d="M2081.79,291.56h-35.96v46.41h35.96v-46.41Z" />
            <path d="M2292.28,60.39v138.79h-117.81V60.39h117.81v-14.43h-153.87v305.56h36.06v-137.32h56.58v46.28h35.03v61.07h35.88v-61.07h-35.88v-46.28h26.2v-15.01h30.2V60.4h-30.2Z" />
            <path d="M2317.82,321.54h-15.77v29.98h15.77v-29.98Z" />
            <path d="M2576.35,45.96v61.96h-35.52v59.96h-14.39v61.96h14.43v-61.89h35.48v183.58h35.66V45.96h-35.66Z" />
            <path d="M2425.95,167.87v-59.96h-35.53v-61.96h-35.66v305.56h35.66v-183.58h35.53v61.89h14.43v-61.96h-14.43Z" />
            <path d="M2462.18,229.83h-21.8v61.29h21.8v-61.29Z" />
            <path d="M2526.66,229.83h-21.8v61.29h21.8v-61.29Z" />
            <path d="M2504.86,291.12h-42.68v60.4h42.68v-60.4Z" />
            <path d="M814.69,185.15l-4.46,15.03h-213.89v.04h-8.77l-2.11,11.61h-15.77l-24.87,128.17c-6.13-1.89-12.3-4.2-18.36-6.86l19.52-106.55h-7.53l2.66-14.74-10.7-.05h-6.93l2.18-11.66h-100.89c-.73-4.97-1.24-9.97-1.51-15.03h105.33v-.04h8.77l2.11-11.61h15.77l25.13-133.55,1.16-6.33,1.2-6.31.18-1.02,1.2-6.33,1.15-6.31,2.53-13.61h20.09l-3,16.19-1.15,6.31-1.2,6.33-.55,2.91-1.15,6.33-1.2,6.37-20.34,109.74h.51l11.48.09-4.06,18.21h14.48l-.18.98-2.18,11.66h215.39l-.05.02h.01Z" />
          </svg>
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
          svg: (
            <svg viewBox="0 0 1348.57 720" width={iconSize * 1.5} height={iconSize} fill={color}>
              <path d="M1348.15,334.39l-8.04,27.09h-300.11l-3.81,21.16h-28.36l-65.19,337.35h-36.4l58.41-310.69h-13.55l4.66-26.67h-31.75l3.81-21.16H0l8.04-27.09h941.38l3.81-21.16h28.36L1040.42,0h36.4l-52.06,286.56h13.55l-4.66,26.67h31.75l-3.81,21.16h286.98-.42Z" />
            </svg>
          ),
        },
        {
          id: "vector-2",
          name: "Cross",
          svg: (
            <svg viewBox="0 0 857.08 872.8" width={iconSize} height={iconSize} fill={color}>
              <polygon points="857.08 405.29 847.33 438.2 502.71 438.2 502.71 438.3 483.49 438.3 478.9 463.71 444.39 463.71 365.59 872.8 321.61 872.8 392.44 496.06 375.93 496.06 381.75 463.8 343.11 463.71 347.9 438.2 0 438.2 9.75 405.29 354.37 405.29 354.37 405.19 373.59 405.19 378.18 379.78 412.69 379.78 483.96 0 527.94 0 464.64 347.43 481.15 347.43 475.33 379.69 513.97 379.78 509.18 405.29 857.08 405.29" />
            </svg>
          ),
        },
        {
          id: "vector-3",
          name: "Arrows",
          svg: (
            <svg viewBox="0 0 702.44 699.76" width={iconSize} height={iconSize} fill={color}>
              <path d="M257.44,222.89c4.6,4.6,9.71,8.29,14.78,12.07l-35.14,35.14c-3.11-4.17-5.95-8.5-9.62-12.35L7.2,37.49,39.63,5.06l217.83,217.83h-.02Z" />
              <path d="M438.98,468.32l231.44,231.44,32.02-32.02-231.44-231.44c-2.26-2.26-3.89-4.89-5.95-7.28l-33.34,33.34c2.38,2.06,5.01,3.7,7.27,5.96Z" />
              <g>
                <path d="M438.98,217.83c-4.6,4.6-9.71,8.29-14.78,12.07l35.14,35.14c3.11-4.17,5.95-8.5,9.62-12.35l79.48-79.48-32.43-32.43-77.05,77.05h.02Z" />
                <rect
                  x="546.1"
                  y="45.86"
                  width="148.7"
                  height="45.86"
                  transform="translate(133.08 458.87) rotate(-45)"
                />
                <rect
                  x="556.7"
                  y="148.92"
                  width="50.39"
                  height="44.19"
                  transform="translate(49.51 461.55) rotate(-45)"
                />
              </g>
              <path d="M250.24,471.38c4.6-4.6,9.71-8.29,14.78-12.07l-35.14-35.14c-3.11,4.17-5.95,8.5-9.62,12.35L0,656.78l32.43,32.43,217.83-217.83h-.02Z" />
            </svg>
          ),
        },
        {
          id: "vector-4",
          name: "Plus",
          svg: (
            <svg viewBox="0 0 928.84 948.1" width={iconSize} height={iconSize} fill={color}>
              <path d="M443.67,312.4c0,8.3-.96,16.37-2.44,24.26h50.73c-1.48-7.88-2.44-15.96-2.44-24.26v-132.5h-45.85v132.5Z" />
              <rect x="443.67" width="45.85" height="63.99" />
              <path d="M443.67,620.79v327.31h45.28v-327.31c0-3.2.71-6.21.94-9.35h-47.15c.23,3.14.93,6.15.93,9.35h0Z" />
              <rect x="397.29" y="63.99" width="46.38" height="115.91" />
              <path d="M308.05,489.49c6.51,0,12.73,1,18.98,1.92v-49.7c-5.15.75-10.21,1.8-15.54,1.93H0v45.86h308.05Z" />
              <path d="M620.79,489.49c-6.51,0-12.73,1-18.98,1.92v-49.7c5.15.75,10.21,1.8,15.54,1.93h311.49v45.86h-308.05Z" />
            </svg>
          ),
        },
        {
          id: "vector-5",
          name: "Star",
          svg: (
            <svg viewBox="0 0 690.68 690.68" width={iconSize} height={iconSize} fill={color}>
              <polygon points="690.68 655.83 445.72 410.87 472.51 384.09 450.03 361.61 467.29 344.36 451.48 328.55 476.91 303.11 449.66 275.86 690.68 34.84 655.83 0 414.81 241.02 387.52 213.72 362.08 239.15 346.22 223.29 328.97 240.55 306.54 218.12 279.76 244.91 34.85 0 0 34.84 244.91 279.75 218.13 306.54 240.55 328.96 225.16 344.36 241.02 360.22 213.72 387.51 241.02 414.81 0 655.83 34.85 690.68 275.87 449.66 303.12 476.91 330.41 449.61 346.22 465.42 361.62 450.03 384.09 472.5 410.88 445.72 655.83 690.68 690.68 655.83" />
            </svg>
          ),
        },
        {
          id: "vector-6",
          name: "Compass",
          svg: (
            <svg viewBox="0 0 927.48 927.48" width={iconSize} height={iconSize} fill={color}>
              <path d="M576.48,490.64c7.2-1.48,14.65-2.25,22.28-2.25h328.72v-49.28h-328.72c-7.63,0-15.08-.78-22.28-2.25v-33.17h-14.42c4.14-6.37,8.99-12.41,14.57-17.99l232.44-232.44-34.85-34.85-232.44,232.44c-5.39,5.39-11.2,10.11-17.33,14.15v-19.31h-34.78c-.85-5.53-1.31-11.19-1.31-16.96V0h-49.28v328.72c0,5.77-.45,11.43-1.31,16.96h-34.78v19.31c-6.12-4.04-11.93-8.76-17.33-14.15L153.22,118.4l-34.85,34.85,232.44,232.44c5.59,5.58,10.44,11.62,14.57,17.99h-14.42v33.17c-7.2,1.48-14.65,2.25-22.28,2.25H0v49.28h328.72c7.63,0,15.08.78,22.28,2.25v33.17h14.42c-4.14,6.37-8.99,12.41-14.57,17.99l-232.44,232.44,34.85,34.85,232.44-232.44c5.39-5.39,11.2-10.11,17.33-14.15v19.31h34.78c.85,5.53,1.31,11.19,1.31,16.96v328.72h49.28v-328.72c0-5.77.45-11.43,1.31-16.96h34.78v-19.31c6.12,4.04,11.93,8.76,17.33,14.15l232.44,232.44,34.85-34.85-232.44-232.44c-5.59-5.59-10.44-11.62-14.57-17.99h14.42v-33.17h-.04Z" />
            </svg>
          ),
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
                  <div className="preview-vectors__item-content">{vector.svg}</div>
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
                {focusedVector.svg}
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
      <div className="panel-header">BRAND SYSTEM</div>

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
      {/* Component Preview Area (Static like before) */}
      <div className="vault__preview">
        {def ? (
          <TargetReticle label={def.name.toUpperCase()}>
            <ComponentPreview
              componentId={selectedComponentId!}
              props={componentProps}
              style={style}
              fullSize
            />
          </TargetReticle>
        ) : (
          <div className="vault__empty-preview">
            <span className="vault__icon">◇</span>
            <p>Select a component to preview its specifications</p>
          </div>
        )}
      </div>

      {/* Saved Elements Section */}
      <div className="vault__header">
        <span className="vault__count">
          {def
            ? `Saved Variants for ${def.name}`
            : `${presets.length} saved element${presets.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {filteredPresets.length === 0 ? (
        <div className="vault__empty-state vault__empty-state--inline">
          <p>No saved variants found{def ? ` for ${def.name}` : ""}</p>
        </div>
      ) : (
        <div className="vault__grid">
          {Object.entries(groupedPresets).map(([componentKey, componentPresets]) => {
            const compDef = getComponentById(componentKey);
            return (
              <div key={componentKey} className="vault__group">
                {!def && <div className="vault__group-header">{compDef?.name || componentKey}</div>}
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
  const isMultiElement = selectedComponentId === "vectors";

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
      <div className="panel-header">DIALS</div>

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
