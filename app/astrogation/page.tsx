"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import {
  CATEGORIES,
  COMPONENTS,
  getComponentsByCategory,
  getComponentById,
  searchComponents,
  type ComponentDef,
  type PropDef,
} from "./catalog";
import {
  createHistory,
  pushState,
  undo as historyUndo,
  redo as historyRedo,
  canUndo,
  canRedo,
  type HistoryState,
} from "./history";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import "./astrogation.css";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ComponentInstance {
  id: string;
  componentId: string;
  x: number;
  y: number;
  props: Record<string, unknown>;
}

interface CanvasState {
  instances: ComponentInstance[];
  selectedId: string | null;
}

interface UIComponentPreset {
  id: string;
  name: string;
  component_key: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
}: {
  componentId: string;
  props: Record<string, unknown>;
}) {
  const def = getComponentById(componentId);
  if (!def) return <div className="preview-error">Unknown component</div>;

  switch (componentId) {
    case "brand-mark":
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ThoughtformLogo
            size={(props.size as number) || 48}
            color={(props.color as string) || "#caa554"}
          />
        </div>
      );

    case "brand-mark-outline":
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <svg
            viewBox="0 0 430.99 436"
            width={(props.size as number) || 48}
            height={(props.size as number) || 48}
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
            fontSize: (props.size as number) || 24,
            color: (props.color as string) || "#caa554",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          Thoughtform
        </div>
      );

    case "button":
      const variant = (props.variant as string) || "ghost";
      const size = (props.size as string) || "md";
      const sizeStyles = { sm: "6px 12px", md: "10px 20px", lg: "14px 28px" };
      const variantStyles = {
        ghost: {
          background: "transparent",
          border: "1px solid var(--dawn-15)",
          color: "var(--dawn-70)",
        },
        solid: { background: "var(--gold)", border: "1px solid var(--gold)", color: "var(--void)" },
        outline: {
          background: "transparent",
          border: "1px solid var(--gold)",
          color: "var(--gold)",
        },
      };
      return (
        <button
          style={{
            padding: sizeStyles[size as keyof typeof sizeStyles],
            ...variantStyles[variant as keyof typeof variantStyles],
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          {(props.label as string) || "Button"}
        </button>
      );

    case "card-frame-content":
      return (
        <div
          style={{
            background: "var(--surface-1, rgba(10,9,8,0.6))",
            border: "1px solid var(--dawn-08)",
            padding: "16px",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {props.accent !== "none" && (
            <div
              style={{
                position: "absolute",
                ...(props.accent === "top"
                  ? { top: 0, left: 0, right: 0, height: "3px" }
                  : { top: 0, left: 0, bottom: 0, width: "3px" }),
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
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--gold)",
              marginBottom: "8px",
            }}
          >
            {String(props.index || "01")} ·{" "}
            <span style={{ color: "var(--dawn-30)" }}>{String(props.label || "Label")}</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--dawn)" }}>
            {(props.title as string) || "Card Title"}
          </div>
        </div>
      );

    case "card-frame-terminal":
      return (
        <div
          style={{
            background: "var(--void)",
            border: "1px solid var(--dawn-15)",
            padding: "24px",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Corner brackets */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "16px",
              height: "16px",
              borderTop: "2px solid var(--gold)",
              borderLeft: "2px solid var(--gold)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "16px",
              height: "16px",
              borderTop: "2px solid var(--gold)",
              borderRight: "2px solid var(--gold)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "16px",
              height: "16px",
              borderBottom: "2px solid var(--gold)",
              borderLeft: "2px solid var(--gold)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "16px",
              height: "16px",
              borderBottom: "2px solid var(--gold)",
              borderRight: "2px solid var(--gold)",
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--dawn-50)",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                background: "var(--gold)",
                marginRight: "8px",
              }}
            />
            {(props.label as string) || "Terminal"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              color: "var(--dawn)",
              textAlign: "center",
            }}
          >
            {(props.title as string) || "Terminal Title"}
          </div>
        </div>
      );

    case "card-frame-data":
      return (
        <div
          style={{
            background: "var(--surface-1, rgba(10,9,8,0.6))",
            border: "1px solid var(--dawn-08)",
            padding: "12px",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--dawn-30)",
              marginBottom: "4px",
            }}
          >
            {(props.label as string) || "Metric"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", color: "var(--gold)" }}>
            {(props.title as string) || "42"}
          </div>
        </div>
      );

    case "hud-corner":
      const position = (props.position as string) || "top-left";
      const cornerSize = (props.size as number) || 24;
      const cornerColor = (props.color as string) || "#caa554";
      const cornerStyle = {
        "top-left": {
          borderTop: `2px solid ${cornerColor}`,
          borderLeft: `2px solid ${cornerColor}`,
        },
        "top-right": {
          borderTop: `2px solid ${cornerColor}`,
          borderRight: `2px solid ${cornerColor}`,
        },
        "bottom-left": {
          borderBottom: `2px solid ${cornerColor}`,
          borderLeft: `2px solid ${cornerColor}`,
        },
        "bottom-right": {
          borderBottom: `2px solid ${cornerColor}`,
          borderRight: `2px solid ${cornerColor}`,
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

    case "slider":
      return (
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--dawn-50)" }}
            >
              {(props.label as string) || "Value"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--gold)" }}>
              {(props.value as number) || 50}
            </span>
          </div>
          <input
            type="range"
            min={(props.min as number) || 0}
            max={(props.max as number) || 100}
            value={(props.value as number) || 50}
            readOnly
            style={{ width: "100%", accentColor: "var(--gold)" }}
          />
        </div>
      );

    case "toggle":
      return (
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={(props.checked as boolean) || false}
            readOnly
            style={{ accentColor: "var(--gold)" }}
          />
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--dawn-50)" }}
          >
            {(props.label as string) || "Option"}
          </span>
        </label>
      );

    case "select":
      return (
        <div style={{ width: "100%" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--dawn-50)",
              marginBottom: "4px",
            }}
          >
            {(props.label as string) || "Select"}
          </div>
          <select
            style={{
              width: "100%",
              padding: "6px 8px",
              background: "var(--void)",
              border: "1px solid var(--dawn-15)",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--dawn)",
            }}
          >
            <option>{(props.placeholder as string) || "Choose option..."}</option>
          </select>
        </div>
      );

    case "glitch-text":
      return (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            color: "var(--gold)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          {(props.text as string) || "THOUGHTFORM"}
        </div>
      );

    case "hud-frame":
      return (
        <div
          style={{
            width: (props.width as number) || 300,
            height: (props.height as number) || 200,
            position: "relative",
            background: "var(--void)",
            border: props.showBorder ? "1px solid var(--dawn-08)" : "none",
          }}
        >
          {Boolean(props.showCorners) && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "16px",
                  height: "16px",
                  borderTop: "2px solid var(--gold)",
                  borderLeft: "2px solid var(--gold)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "16px",
                  height: "16px",
                  borderTop: "2px solid var(--gold)",
                  borderRight: "2px solid var(--gold)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "16px",
                  height: "16px",
                  borderBottom: "2px solid var(--gold)",
                  borderLeft: "2px solid var(--gold)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "16px",
                  height: "16px",
                  borderBottom: "2px solid var(--gold)",
                  borderRight: "2px solid var(--gold)",
                }}
              />
            </>
          )}
        </div>
      );

    case "navigation-bar":
      return (
        <div
          style={{
            width: "100%",
            height: "48px",
            background: "var(--void)",
            borderBottom: "1px solid var(--dawn-08)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          {Boolean(props.showLogo) && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--dawn)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Thoughtform
            </span>
          )}
        </div>
      );

    default:
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--dawn-30)",
          }}
        >
          {def.name}
        </div>
      );
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
    "hud-corner": "HUDCorner",
    "navigation-bar": "NavigationBar",
    slider: "Slider",
    toggle: "Toggle",
    select: "Select",
    "glitch-text": "GlitchText",
  };

  const componentName = componentNames[componentId] || def.name.replace(/\s+/g, "");

  // Build props string
  const propsEntries = Object.entries(props).filter(([key, value]) => {
    const propDef = def.props.find((p) => p.name === key);
    return propDef && value !== propDef.default;
  });

  // Add tier prop for CardFrame variants
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

  // Handle children for button
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

// ═══════════════════════════════════════════════════════════════
// CATALOG PANEL
// ═══════════════════════════════════════════════════════════════

function CatalogPanel({
  onAddComponent,
  presets,
  onLoadPreset,
  onDeletePreset,
}: {
  onAddComponent: (componentId: string) => void;
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["buttons", "frames"])
  );
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubcategory = (id: string) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredComponents = searchQuery ? searchComponents(searchQuery) : null;

  return (
    <aside className="astrogation-panel astrogation-panel--left">
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
            <button key={comp.id} className="catalog-item" onClick={() => onAddComponent(comp.id)}>
              <span className="catalog-item__icon">+</span>
              {comp.name}
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      {!filteredComponents &&
        CATEGORIES.map((cat) => {
          const isExpanded = expandedCategories.has(cat.id);
          const components = getComponentsByCategory(cat.id);

          return (
            <div key={cat.id} className="catalog-category">
              <button
                className={`catalog-category__header ${isExpanded ? "expanded" : ""}`}
                onClick={() => toggleCategory(cat.id)}
              >
                <span className="catalog-category__icon">▸</span>
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>

              {isExpanded && (
                <div className="catalog-category__items">
                  {/* Direct components */}
                  {components.map((comp) => (
                    <button
                      key={comp.id}
                      className="catalog-item"
                      onClick={() => onAddComponent(comp.id)}
                    >
                      <span className="catalog-item__icon">+</span>
                      {comp.name}
                    </button>
                  ))}

                  {/* Subcategories */}
                  {cat.subcategories?.map((sub) => {
                    const subKey = `${cat.id}-${sub.id}`;
                    const subExpanded = expandedSubcategories.has(subKey);
                    const subComponents = getComponentsByCategory(cat.id, sub.id);

                    return (
                      <div key={sub.id} className="catalog-category">
                        <button
                          className={`catalog-category__header ${subExpanded ? "expanded" : ""}`}
                          onClick={() => toggleSubcategory(subKey)}
                        >
                          <span className="catalog-category__icon">▸</span>
                          <span>{sub.name}</span>
                        </button>

                        {subExpanded && (
                          <div className="catalog-category__items">
                            {subComponents.map((comp) => (
                              <button
                                key={comp.id}
                                className="catalog-item"
                                onClick={() => onAddComponent(comp.id)}
                              >
                                <span className="catalog-item__icon">+</span>
                                {comp.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

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
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// INFINITE CANVAS
// ═══════════════════════════════════════════════════════════════

function InfiniteCanvas({
  instances,
  selectedId,
  onSelect,
  onMove,
  onDelete,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
}: {
  instances: ComponentInstance[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const draggedIdRef = useRef<string | null>(null);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(4, zoom * delta));
      onZoomChange(newZoom);
    },
    [zoom, onZoomChange]
  );

  // Handle mouse down for panning or instance dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const instanceEl = target.closest("[data-instance-id]") as HTMLElement;

      if (instanceEl) {
        // Start dragging an instance
        const instanceId = instanceEl.dataset.instanceId!;
        const instance = instances.find((i) => i.id === instanceId);
        if (instance) {
          isDraggingRef.current = true;
          draggedIdRef.current = instanceId;
          const rect = instanceEl.getBoundingClientRect();
          dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
          onSelect(instanceId);
        }
      } else {
        // Start panning
        isPanningRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        onSelect(null);
      }
    },
    [instances, onSelect]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        onPanChange({ x: pan.x + dx, y: pan.y + dy });
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      } else if (isDraggingRef.current && draggedIdRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x - dragOffsetRef.current.x) / zoom;
        const y = (e.clientY - rect.top - pan.y - dragOffsetRef.current.y) / zoom;
        onMove(draggedIdRef.current, x, y);
      }
    },
    [pan, zoom, onPanChange, onMove]
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    isDraggingRef.current = false;
    draggedIdRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className="infinite-canvas"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="infinite-canvas__transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {instances.map((instance) => {
          const def = getComponentById(instance.componentId);
          return (
            <div
              key={instance.id}
              data-instance-id={instance.id}
              className={`canvas-instance ${selectedId === instance.id ? "selected" : ""}`}
              style={{
                left: instance.x,
                top: instance.y,
                width: def?.defaultWidth || 100,
                minHeight: def?.defaultHeight || 50,
              }}
            >
              <ComponentPreview componentId={instance.componentId} props={instance.props} />
              {selectedId === instance.id && (
                <button
                  className="canvas-instance__delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(instance.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Canvas Controls */}
      <div className="canvas-controls">
        <button onClick={() => onZoomChange(Math.min(4, zoom * 1.2))}>+</button>
        <span className="canvas-controls__zoom">{Math.round(zoom * 100)}%</span>
        <button onClick={() => onZoomChange(Math.max(0.25, zoom / 1.2))}>-</button>
        <button
          onClick={() => {
            onZoomChange(1);
            onPanChange({ x: 0, y: 0 });
          }}
        >
          Reset
        </button>
      </div>

      {instances.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon">⬡</span>
          <p className="empty-state__text">
            Click a component in the catalog to add it to the canvas
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DIALS PANEL
// ═══════════════════════════════════════════════════════════════

function DialsPanel({
  selectedInstance,
  onUpdateProps,
  onCopyCode,
  onSave,
  presetName,
  onPresetNameChange,
  canSave,
}: {
  selectedInstance: ComponentInstance | null;
  onUpdateProps: (props: Record<string, unknown>) => void;
  onCopyCode: () => void;
  onSave: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
}) {
  const def = selectedInstance ? getComponentById(selectedInstance.componentId) : null;

  const renderPropControl = (propDef: PropDef, value: unknown) => {
    const currentValue = value ?? propDef.default;

    switch (propDef.type) {
      case "string":
        return (
          <input
            type="text"
            className="astrogation-search"
            value={currentValue as string}
            onChange={(e) =>
              onUpdateProps({ ...selectedInstance!.props, [propDef.name]: e.target.value })
            }
          />
        );

      case "number":
        return (
          <div className="dial-slider">
            <div className="dial-slider__header">
              <label>{propDef.name}</label>
              <span className="dial-slider__value">{currentValue as number}</span>
            </div>
            <input
              type="range"
              min={propDef.min ?? 0}
              max={propDef.max ?? 100}
              step={propDef.step ?? 1}
              value={currentValue as number}
              onChange={(e) =>
                onUpdateProps({
                  ...selectedInstance!.props,
                  [propDef.name]: parseFloat(e.target.value),
                })
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
                onUpdateProps({ ...selectedInstance!.props, [propDef.name]: e.target.checked })
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
              onChange={(e) =>
                onUpdateProps({ ...selectedInstance!.props, [propDef.name]: e.target.value })
              }
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
            <input
              type="color"
              value={currentValue as string}
              onChange={(e) =>
                onUpdateProps({ ...selectedInstance!.props, [propDef.name]: e.target.value })
              }
              style={{
                width: "100%",
                height: "32px",
                border: "1px solid var(--dawn-15)",
                background: "transparent",
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="astrogation-panel astrogation-panel--right">
      {selectedInstance && def ? (
        <>
          {/* Component Info */}
          <div className="astrogation-section">
            <div className="astrogation-section__label">{def.name}</div>
          </div>

          {/* Props */}
          <div className="astrogation-section">
            <div className="astrogation-section__label">Properties</div>
            {def.props.map((propDef) => (
              <div key={propDef.name} style={{ marginBottom: "8px" }}>
                {renderPropControl(propDef, selectedInstance.props[propDef.name])}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="astrogation-section">
            <div className="astrogation-section__label">Actions</div>
            <button className="action-btn" onClick={onCopyCode}>
              Copy Code
            </button>
          </div>

          {/* Save Preset */}
          <div className="astrogation-section">
            <div className="astrogation-section__label">Save Preset</div>
            <div className="save-preset-form">
              <input
                type="text"
                placeholder="Preset name..."
                value={presetName}
                onChange={(e) => onPresetNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSave && onSave()}
              />
              <button onClick={onSave} disabled={!canSave}>
                +
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-state__icon">◇</span>
          <p className="empty-state__text">
            Select a component on the canvas to edit its properties
          </p>
        </div>
      )}
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN BUILDER TAB
// ═══════════════════════════════════════════════════════════════

function BuilderTab() {
  // Canvas state with history
  const [history, setHistory] = useState<HistoryState<CanvasState>>(() =>
    createHistory({ instances: [], selectedId: null })
  );
  const state = history.present;

  // UI state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<UIComponentPreset[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Derived state
  const selectedInstance = state.instances.find((i) => i.id === state.selectedId) || null;

  // Show toast
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // State update helpers
  const updateState = useCallback((newState: CanvasState) => {
    setHistory((prev) => pushState(prev, newState));
  }, []);

  const setSelectedId = useCallback(
    (id: string | null) => {
      updateState({ ...state, selectedId: id });
    },
    [state, updateState]
  );

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (canUndo(history)) {
      setHistory(historyUndo(history));
      showToast("Undo");
    }
  }, [history, showToast]);

  const handleRedo = useCallback(() => {
    if (canRedo(history)) {
      setHistory(historyRedo(history));
      showToast("Redo");
    }
  }, [history, showToast]);

  // Add component
  const handleAddComponent = useCallback(
    (componentId: string) => {
      const def = getComponentById(componentId);
      if (!def) return;

      const defaultProps: Record<string, unknown> = {};
      def.props.forEach((p) => {
        defaultProps[p.name] = p.default;
      });

      const newInstance: ComponentInstance = {
        id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentId,
        x: (-pan.x + 200) / zoom,
        y: (-pan.y + 150) / zoom,
        props: defaultProps,
      };

      updateState({
        instances: [...state.instances, newInstance],
        selectedId: newInstance.id,
      });
    },
    [state, pan, zoom, updateState]
  );

  // Move instance
  const handleMoveInstance = useCallback(
    (id: string, x: number, y: number) => {
      updateState({
        ...state,
        instances: state.instances.map((inst) => (inst.id === id ? { ...inst, x, y } : inst)),
      });
    },
    [state, updateState]
  );

  // Delete instance
  const handleDeleteInstance = useCallback(
    (id: string) => {
      updateState({
        instances: state.instances.filter((inst) => inst.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      });
    },
    [state, updateState]
  );

  // Delete selected
  const handleDeleteSelected = useCallback(() => {
    if (state.selectedId) {
      handleDeleteInstance(state.selectedId);
    }
  }, [state.selectedId, handleDeleteInstance]);

  // Update props
  const handleUpdateProps = useCallback(
    (props: Record<string, unknown>) => {
      if (!state.selectedId) return;
      updateState({
        ...state,
        instances: state.instances.map((inst) =>
          inst.id === state.selectedId ? { ...inst, props } : inst
        ),
      });
    },
    [state, updateState]
  );

  // Copy code
  const handleCopyCode = useCallback(() => {
    if (!selectedInstance) return;
    const code = generateJSXCode(selectedInstance.componentId, selectedInstance.props);
    navigator.clipboard.writeText(code);
    showToast("Code copied to clipboard");
  }, [selectedInstance, showToast]);

  // Escape to deselect
  const handleEscape = useCallback(() => {
    setSelectedId(null);
  }, [setSelectedId]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: handleDeleteSelected,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onEscape: handleEscape,
    onCopy: handleCopyCode,
  });

  // Load presets from API
  useEffect(() => {
    fetch("/api/ui-component-presets")
      .then((r) => r.json())
      .then((data) => setPresets(data.presets || []))
      .catch(console.error);
  }, []);

  // Save preset
  const handleSavePreset = useCallback(async () => {
    if (!selectedInstance || !presetName.trim()) return;

    try {
      const res = await fetch("/api/ui-component-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          component_key: selectedInstance.componentId,
          config: selectedInstance.props,
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
  }, [selectedInstance, presetName, showToast]);

  // Load preset
  const handleLoadPreset = useCallback(
    (preset: UIComponentPreset) => {
      const newInstance: ComponentInstance = {
        id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentId: preset.component_key,
        x: (-pan.x + 200) / zoom,
        y: (-pan.y + 150) / zoom,
        props: preset.config,
      };

      updateState({
        instances: [...state.instances, newInstance],
        selectedId: newInstance.id,
      });
      showToast(`Loaded: ${preset.name}`);
    },
    [state, pan, zoom, updateState, showToast]
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
    <div className="builder-tab">
      <CatalogPanel
        onAddComponent={handleAddComponent}
        presets={presets}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
      />

      <InfiniteCanvas
        instances={state.instances}
        selectedId={state.selectedId}
        onSelect={setSelectedId}
        onMove={handleMoveInstance}
        onDelete={handleDeleteInstance}
        zoom={zoom}
        pan={pan}
        onZoomChange={setZoom}
        onPanChange={setPan}
      />

      <DialsPanel
        selectedInstance={selectedInstance}
        onUpdateProps={handleUpdateProps}
        onCopyCode={handleCopyCode}
        onSave={handleSavePreset}
        presetName={presetName}
        onPresetNameChange={setPresetName}
        canSave={!!selectedInstance && !!presetName.trim()}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN ASTROGATION CONTENT
// ═══════════════════════════════════════════════════════════════

function AstrogationContent() {
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
        <BuilderTab />
      </div>

      {/* Footer */}
      <footer className="astrogation-footer">
        <div className="astrogation-footer__left">
          <span>⌘Z Undo</span>
          <span>⌘⇧Z Redo</span>
          <span>⌫ Delete</span>
        </div>
        <div className="astrogation-footer__right">Drag to pan • Scroll to zoom</div>
      </footer>
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
