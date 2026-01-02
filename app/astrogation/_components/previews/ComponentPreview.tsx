"use client";

import { getComponentById, type ComponentDef } from "../../catalog";
import type { StyleConfig } from "../types";
import { DynamicSVG } from "../DynamicSVG";
import { ThoughtformLogo } from "../ThoughtformLogo";
import { HUDWrapper } from "../helpers";
import {
  CornerBracket,
  CornerBrackets,
  ChamferedFrame,
  type CornerToken,
  type CornerPosition,
  type ShapePreset,
} from "@thoughtform/ui";

// ═══════════════════════════════════════════════════════════════
// STATIC DATA (moved outside component to prevent recreation)
// ═══════════════════════════════════════════════════════════════

const WORDMARKS = [
  { id: "wordmark-standard", name: "Standard", src: "/logos/Thoughtform_Wordmark.svg" },
  { id: "wordmark-sans", name: "Sans", src: "/logos/Thoughtform_Wordmark-sans.svg" },
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
] as const;

const VECTORS = [
  { id: "vector-1", name: "Slash", src: "/logos/Thoughtform_Vector-1.svg" },
  { id: "vector-2", name: "Cross", src: "/logos/Thoughtform_Vector-2.svg" },
  { id: "vector-3", name: "Arrows", src: "/logos/Thoughtform_Vector-3.svg" },
  { id: "vector-4", name: "Plus", src: "/logos/Thoughtform_Vector-4.svg" },
  { id: "vector-5", name: "Star", src: "/logos/Thoughtform_Vector-5.svg" },
  { id: "vector-6", name: "Compass", src: "/logos/Thoughtform_Vector-6.svg" },
] as const;

const PRIMARY_COLORS = [
  { name: "Gold", value: "#caa554", variable: "--gold" },
  { name: "Dawn", value: "#ebe3d6", variable: "--dawn" },
  { name: "Void", value: "#0a0908", variable: "--void" },
] as const;

const SECONDARY_COLORS = [
  { name: "Surface-0", value: "#0D0B07", variable: "--surface-0" },
  { name: "Surface-1", value: "#141210", variable: "--surface-1" },
  { name: "Surface-2", value: "#1A1814", variable: "--surface-2" },
] as const;

const TYPE_SCALE_SIZES = [
  { name: "4xl", size: "48px", sample: "Display" },
  { name: "3xl", size: "36px", sample: "Heading 1" },
  { name: "2xl", size: "28px", sample: "Heading 2" },
  { name: "xl", size: "22px", sample: "Heading 3" },
  { name: "lg", size: "18px", sample: "Large Text" },
  { name: "base", size: "16px", sample: "Body Text" },
  { name: "sm", size: "14px", sample: "Small Text" },
  { name: "xs", size: "12px", sample: "Caption" },
] as const;

const NAV_LINKS = [
  { id: "interface", label: "Interface" },
  { id: "manifesto", label: "Manifesto" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

// ═══════════════════════════════════════════════════════════════
// COMPONENT PREVIEW
// ═══════════════════════════════════════════════════════════════

export interface ComponentPreviewProps {
  componentId: string;
  props: Record<string, unknown>;
  style?: StyleConfig;
  fullSize?: boolean;
}

export function ComponentPreview({ componentId, props, fullSize = false }: ComponentPreviewProps) {
  const def = getComponentById(componentId);
  if (!def) return <div className="preview-error">Unknown component</div>;

  const content = renderComponent(componentId, props, def, fullSize);

  return (
    <div
      className={`component-preview-wrapper ${fullSize ? "component-preview-wrapper--full" : ""}`}
    >
      {content}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RENDER COMPONENT
// ═══════════════════════════════════════════════════════════════

function renderComponent(
  componentId: string,
  props: Record<string, unknown>,
  def: ComponentDef,
  fullSize = false
): React.ReactNode {
  const scale = fullSize ? 2 : 1;

  switch (componentId) {
    // ═══════════════════════════════════════════════════════════════
    // FOUNDATIONS - Colors
    // ═══════════════════════════════════════════════════════════════
    case "color-palette": {
      return (
        <div className="preview-palette">
          <div className="preview-palette__section">
            <div className="preview-palette__section-label">Primary</div>
            <div className="preview-palette__row">
              {PRIMARY_COLORS.map((c) => (
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
          <div className="preview-palette__section">
            <div className="preview-palette__section-label">Secondary</div>
            <div className="preview-palette__row">
              {SECONDARY_COLORS.map((c) => (
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
      return (
        <div className="preview-type-scale">
          {TYPE_SCALE_SIZES.map((s) => (
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
      const color = (props.color as string) || "#caa554";
      const focusedElementId = (props._focusedElementId as string) || null;
      const onElementFocus = props._onElementFocus as ((id: string | null) => void) | undefined;

      const hasFocusedElement = focusedElementId !== null;
      const focusedWordmark = hasFocusedElement
        ? WORDMARKS.find((w) => w.id === focusedElementId)
        : null;

      return (
        <div
          className={`preview-wordmarks ${hasFocusedElement ? "preview-wordmarks--has-focus" : ""}`}
        >
          <div className="preview-wordmarks__grid">
            {WORDMARKS.map((wordmark) => {
              const isBlurred = hasFocusedElement;
              return (
                <div
                  key={wordmark.id}
                  className={`preview-wordmarks__item ${isBlurred ? "preview-wordmarks__item--blurred" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onElementFocus) onElementFocus(wordmark.id);
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

          {hasFocusedElement && (
            <div
              className="preview-wordmarks__backdrop"
              onClick={(e) => {
                e.stopPropagation();
                if (onElementFocus) onElementFocus(null);
              }}
            />
          )}

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
                  <DynamicSVG src={focusedWordmark.src} color={color} width="100%" height="100%" />
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

      const hasFocusedElement = focusedElementId !== null;
      const focusedVector = hasFocusedElement
        ? VECTORS.find((v) => v.id === focusedElementId)
        : null;

      return (
        <div className={`preview-vectors ${hasFocusedElement ? "preview-vectors--has-focus" : ""}`}>
          <div className="preview-vectors__grid">
            {VECTORS.map((vector) => {
              const isBlurred = hasFocusedElement;
              return (
                <div
                  key={vector.id}
                  className={`preview-vectors__item ${isBlurred ? "preview-vectors__item--blurred" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onElementFocus) onElementFocus(vector.id);
                  }}
                >
                  <div className="preview-vectors__item-content">
                    <DynamicSVG src={vector.src} color={color} width={iconSize} height={iconSize} />
                  </div>
                </div>
              );
            })}
          </div>

          {hasFocusedElement && (
            <div
              className="preview-vectors__backdrop"
              onClick={(e) => {
                e.stopPropagation();
                if (onElementFocus) onElementFocus(null);
              }}
            />
          )}

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
                  <DynamicSVG src={focusedVector.src} color={color} width="100%" height="100%" />
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
      const cornerThicknessVal = (props.cornerThickness as number) ?? 1.5;
      const hasBorder = borderStyle !== "none";

      return (
        <HUDWrapper
          cornerToken={corners}
          borderThickness={hasBorder ? borderThickness : 0}
          cornerThickness={cornerThicknessVal}
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
      const cornerThicknessVal = (props.cornerThickness as number) ?? 1.5;

      return (
        <HUDWrapper
          cornerToken={corners}
          borderThickness={borderThickness}
          cornerThickness={cornerThicknessVal}
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

      return (
        <div className="preview-navbar-real">
          {showLogo && (
            <div className="preview-navbar-real__logo">
              <ThoughtformLogo size={fullSize ? 22 : 18} color={logoColor} />
            </div>
          )}
          <div className="preview-navbar-real__links">
            {NAV_LINKS.map((link) => (
              <span
                key={link.id}
                className={`preview-navbar-real__link ${activeLink === link.id ? "preview-navbar-real__link--active" : ""}`}
                style={{ color: activeLink === link.id ? activeLinkColor : linkColor }}
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
      const hudScale = fullSize ? 1.3 : 1;
      const cornerColor = (props.cornerColor as string) || "#caa554";
      const frameWidth = 550 * hudScale;
      const frameHeight = 420 * hudScale;
      const tickCount = 21; // Match actual HUDFrame implementation

      // Production ratios (based on 1080px viewport with 40px corners, 20px rail gap):
      // Corner: 40/1080 = 0.037, Rail gap: 20/1080 = 0.0185
      // Apply these ratios to preview frame height for proportional scaling
      const cornerRatio = 0.037;
      const railGapRatio = 0.0185;
      const cornerSize = (props.cornerSize as number) ?? Math.round(frameHeight * cornerRatio);
      const railGap = Math.round(frameHeight * railGapRatio);

      // Proportional tick widths (production: 20px major, 8px minor at 1080px)
      const tickMajorWidth = Math.round(frameHeight * 0.0185);
      const tickMinorWidth = Math.round(frameHeight * 0.0074);

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
                  top: cornerSize + railGap,
                  bottom: cornerSize + railGap,
                  width: 1,
                  background: `linear-gradient(to bottom, transparent 0%, ${cornerColor}80 10%, ${cornerColor}80 90%, transparent 100%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: cornerSize + railGap,
                  bottom: cornerSize + railGap,
                  width: 1,
                  background: `linear-gradient(to bottom, transparent 0%, ${cornerColor}80 10%, ${cornerColor}80 90%, transparent 100%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: cornerSize + railGap,
                  bottom: cornerSize + railGap,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {Array.from({ length: tickCount }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i % 5 === 0 ? tickMajorWidth : tickMinorWidth,
                      height: 1,
                      background: i % 5 === 0 ? cornerColor : `${cornerColor}80`,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: cornerSize + railGap,
                  bottom: cornerSize + railGap,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {Array.from({ length: tickCount }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i % 5 === 0 ? tickMajorWidth : tickMinorWidth,
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

    case "panel": {
      const shape = (props.shape as ShapePreset) || "inspectorTicket";
      const title = (props.title as string) || "PANEL TITLE";
      const strokeColor = (props.strokeColor as string) || "rgba(202, 165, 84, 0.3)";
      const fillColor = (props.fillColor as string) || "rgba(10, 9, 8, 0.4)";
      const strokeWidth = (props.strokeWidth as number) ?? 1;
      const panelScale = fullSize ? 1.5 : 1;

      return (
        <ChamferedFrame
          shape={shape}
          strokeColor={strokeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          titleSlot={
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: fullSize ? "11px" : "9px",
                letterSpacing: "0.1em",
                color: "var(--gold)",
                textTransform: "uppercase",
              }}
            >
              {title}
            </span>
          }
          style={{
            width: 280 * panelScale,
            height: 200 * panelScale,
          }}
          contentPadding="md"
        >
          <div
            style={{
              color: "var(--dawn-50)",
              fontSize: fullSize ? "13px" : "11px",
              lineHeight: 1.6,
            }}
          >
            Panel content area. This component uses SVG-driven geometry with ResizeObserver for
            responsive chamfered corners and ticket notch shapes.
          </div>
        </ChamferedFrame>
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
      const cornerThicknessVal = (props.cornerThickness as number) ?? 1.5;
      const hasCorners = corners !== "none" && cornerThicknessVal > 0;

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
          cornerThickness={hasCorners ? cornerThicknessVal : 0}
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
