"use client";

import { useState } from "react";
import { useBridgeState, exportNodeSvg } from "./useBridgeState";
import type { FigmaNode, FigmaPaint } from "@/lib/figma/types";

// ═══════════════════════════════════════════════════════════════
// BRIDGE INSPECTOR PANEL - Right panel for Bridge tab
// Shows node properties, export controls, and Code Connect info
// ═══════════════════════════════════════════════════════════════

/** Format a Figma paint for display */
function formatPaint(paint: FigmaPaint): string {
  if (!paint.visible && paint.visible !== undefined) return "(hidden)";
  if (paint.type === "SOLID" && paint.color) {
    const r = Math.round(paint.color.r * 255);
    const g = Math.round(paint.color.g * 255);
    const b = Math.round(paint.color.b * 255);
    const a = paint.color.a ?? 1;
    if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  return paint.type;
}

function paintColor(paint: FigmaPaint): string | undefined {
  if (paint.type === "SOLID" && paint.color) {
    const r = Math.round(paint.color.r * 255);
    const g = Math.round(paint.color.g * 255);
    const b = Math.round(paint.color.b * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return undefined;
}

/** Property row */
function PropRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="bridge-prop-row">
      <span className="bridge-prop-label">{label}</span>
      <span className="bridge-prop-value">{value}</span>
    </div>
  );
}

/** Node properties section */
function NodeProperties({ node }: { node: FigmaNode }) {
  const bounds = node.absoluteBoundingBox;

  return (
    <div className="bridge-properties">
      <div className="bridge-section-title">PROPERTIES</div>

      <PropRow label="Type" value={node.type} />
      <PropRow label="Name" value={node.name} />
      <PropRow label="ID" value={node.id} />
      {bounds && (
        <>
          <PropRow label="X" value={`${Math.round(bounds.x)}px`} />
          <PropRow label="Y" value={`${Math.round(bounds.y)}px`} />
          <PropRow label="Width" value={`${Math.round(bounds.width)}px`} />
          <PropRow label="Height" value={`${Math.round(bounds.height)}px`} />
        </>
      )}
      {node.opacity !== undefined && node.opacity !== 1 && (
        <PropRow label="Opacity" value={`${Math.round(node.opacity * 100)}%`} />
      )}
      {node.characters && <PropRow label="Text" value={node.characters.slice(0, 100)} />}

      {/* Fills */}
      {node.fills && node.fills.length > 0 && (
        <div className="bridge-fills-section">
          <div className="bridge-subsection-title">Fills</div>
          {node.fills.map((fill, i) => (
            <div key={i} className="bridge-fill-row">
              {paintColor(fill) && (
                <span
                  className="bridge-token-swatch"
                  style={{ backgroundColor: paintColor(fill) }}
                />
              )}
              <span className="bridge-fill-value">{formatPaint(fill)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Strokes */}
      {node.strokes && node.strokes.length > 0 && (
        <div className="bridge-strokes-section">
          <div className="bridge-subsection-title">Strokes</div>
          {node.strokes.map((stroke, i) => (
            <div key={i} className="bridge-fill-row">
              {paintColor(stroke) && (
                <span
                  className="bridge-token-swatch"
                  style={{ backgroundColor: paintColor(stroke) }}
                />
              )}
              <span className="bridge-fill-value">{formatPaint(stroke)}</span>
            </div>
          ))}
          {node.strokeWeight && <PropRow label="Weight" value={`${node.strokeWeight}px`} />}
        </div>
      )}

      {/* Effects */}
      {node.effects && node.effects.length > 0 && (
        <div className="bridge-effects-section">
          <div className="bridge-subsection-title">Effects</div>
          {node.effects.map((effect, i) => (
            <div key={i} className="bridge-fill-row">
              <span className="bridge-fill-value">
                {effect.type} ({effect.radius}px)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BridgeInspectorPanel() {
  const state = useBridgeState();
  const [exportFormat, setExportFormat] = useState<"svg" | "png">("svg");
  const [exportScale, setExportScale] = useState(2);
  const [copied, setCopied] = useState(false);

  const handleCopySvg = async () => {
    if (!state.selectedNodeId) return;
    const svg = await exportNodeSvg(state.selectedNodeId);
    if (svg) {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyNodeId = () => {
    if (state.selectedNodeId) {
      navigator.clipboard.writeText(state.selectedNodeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInFigma = () => {
    if (state.selectedNodeId) {
      const fileKey = process.env.NEXT_PUBLIC_FIGMA_FILE_KEY || "XO8yGN90SfxiG1hmYPGYXn";
      const nodeParam = state.selectedNodeId.replace(":", "-");
      window.open(`https://www.figma.com/design/${fileKey}?node-id=${nodeParam}`, "_blank");
    }
  };

  return (
    <aside className="astrogation-panel astrogation-panel--right">
      <div className="panel-header panel-header--filled">INSPECTOR</div>

      <div className="panel-scroll-area">
        {!state.selectedNodeId && (
          <div className="bridge-inspector-empty">
            <span className="bridge-inspector-empty-text">
              Select a layer from the file tree to inspect its properties.
            </span>
          </div>
        )}

        {state.selectedNodeLoading && (
          <div className="bridge-loading">
            <span className="bridge-loading-dot" />
            Loading node...
          </div>
        )}

        {state.selectedNode && !state.selectedNodeLoading && (
          <>
            {/* Node header */}
            <div className="bridge-inspector-header">
              <span className="bridge-inspector-name">{state.selectedNode.name}</span>
              <span className="bridge-inspector-type">{state.selectedNode.type}</span>
            </div>

            {/* Quick actions */}
            <div className="bridge-inspector-actions">
              <button type="button" className="bridge-action-btn" onClick={handleCopySvg}>
                {state.exportLoading ? "..." : copied ? "COPIED" : "COPY SVG"}
              </button>
              <button type="button" className="bridge-action-btn" onClick={handleCopyNodeId}>
                COPY ID
              </button>
              <button type="button" className="bridge-action-btn" onClick={handleOpenInFigma}>
                OPEN IN FIGMA
              </button>
            </div>

            {/* Export controls */}
            <div className="bridge-export-section">
              <div className="bridge-section-title">EXPORT</div>
              <div className="bridge-export-controls">
                <div className="bridge-export-row">
                  <span className="bridge-export-label">Format</span>
                  <select
                    className="bridge-export-select"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "svg" | "png")}
                  >
                    <option value="svg">SVG</option>
                    <option value="png">PNG</option>
                  </select>
                </div>
                {exportFormat === "png" && (
                  <div className="bridge-export-row">
                    <span className="bridge-export-label">Scale</span>
                    <select
                      className="bridge-export-select"
                      value={exportScale}
                      onChange={(e) => setExportScale(Number(e.target.value))}
                    >
                      <option value="1">1x</option>
                      <option value="2">2x</option>
                      <option value="3">3x</option>
                      <option value="4">4x</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Node properties */}
            <NodeProperties node={state.selectedNode} />
          </>
        )}
      </div>
    </aside>
  );
}
