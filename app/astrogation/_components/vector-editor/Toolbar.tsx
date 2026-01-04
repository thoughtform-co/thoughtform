"use client";

import { memo } from "react";
import type { EditorTool, GridSettings } from "./types";

// ═══════════════════════════════════════════════════════════════
// VECTOR EDITOR TOOLBAR - Refined floating toolbar with premium aesthetics
// ═══════════════════════════════════════════════════════════════

interface ToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  grid: GridSettings;
  onGridChange: (grid: GridSettings) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopySVG: () => void;
}

// Tool definitions with refined icons and shortcuts
const TOOLS: { id: EditorTool; label: string; icon: string; shortcut: string }[] = [
  { id: "select", label: "Select", icon: "⬦", shortcut: "V" },
  { id: "rect", label: "Rectangle", icon: "▢", shortcut: "R" },
  { id: "ellipse", label: "Ellipse", icon: "○", shortcut: "O" },
  { id: "line", label: "Line", icon: "╱", shortcut: "L" },
  { id: "pen", label: "Pen", icon: "✎", shortcut: "P" },
  { id: "text", label: "Text", icon: "T", shortcut: "T" },
];

function ToolbarInner({
  activeTool,
  onToolChange,
  grid,
  onGridChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDelete,
  onDuplicate,
  onCopySVG,
}: ToolbarProps) {
  return (
    <div className="forge-toolbar">
      {/* Drawing Tools */}
      <div className="forge-toolbar__group forge-toolbar__group--tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`forge-toolbar__btn ${activeTool === tool.id ? "forge-toolbar__btn--active" : ""}`}
            onClick={() => onToolChange(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            aria-label={tool.label}
            aria-pressed={activeTool === tool.id}
          >
            <span className="forge-toolbar__btn-icon">{tool.icon}</span>
            <span className="forge-toolbar__btn-shortcut">{tool.shortcut}</span>
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="forge-toolbar__separator" />

      {/* Grid Controls */}
      <div className="forge-toolbar__group forge-toolbar__group--grid">
        <button
          className={`forge-toolbar__btn ${grid.enabled ? "forge-toolbar__btn--active" : ""}`}
          onClick={() => onGridChange({ ...grid, enabled: !grid.enabled })}
          title="Toggle Grid"
          aria-label="Toggle Grid"
          aria-pressed={grid.enabled}
        >
          <span className="forge-toolbar__btn-icon">⊞</span>
        </button>

        <button
          className={`forge-toolbar__btn ${grid.snap ? "forge-toolbar__btn--active" : ""}`}
          onClick={() => onGridChange({ ...grid, snap: !grid.snap })}
          title="Snap to Grid"
          aria-label="Snap to Grid"
          aria-pressed={grid.snap}
          disabled={!grid.enabled}
        >
          <span className="forge-toolbar__btn-icon">⊡</span>
        </button>

        <select
          className="forge-toolbar__select"
          value={grid.size}
          onChange={(e) => onGridChange({ ...grid, size: parseInt(e.target.value) })}
          title="Grid Size"
          aria-label="Grid Size"
        >
          <option value="10">10px</option>
          <option value="20">20px</option>
          <option value="40">40px</option>
          <option value="50">50px</option>
        </select>
      </div>

      {/* Separator */}
      <div className="forge-toolbar__separator" />

      {/* History */}
      <div className="forge-toolbar__group forge-toolbar__group--history">
        <button
          className="forge-toolbar__btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <span className="forge-toolbar__btn-icon">↶</span>
        </button>

        <button
          className="forge-toolbar__btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <span className="forge-toolbar__btn-icon">↷</span>
        </button>
      </div>

      {/* Separator */}
      <div className="forge-toolbar__separator" />

      {/* Object Actions */}
      <div className="forge-toolbar__group forge-toolbar__group--actions">
        <button
          className="forge-toolbar__btn"
          onClick={onDuplicate}
          title="Duplicate (Ctrl+D)"
          aria-label="Duplicate"
        >
          <span className="forge-toolbar__btn-icon">⧉</span>
        </button>

        <button
          className="forge-toolbar__btn forge-toolbar__btn--danger"
          onClick={onDelete}
          title="Delete (Del)"
          aria-label="Delete"
        >
          <span className="forge-toolbar__btn-icon">✕</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="forge-toolbar__spacer" />

      {/* Export */}
      <div className="forge-toolbar__group forge-toolbar__group--export">
        <button
          className="forge-toolbar__btn forge-toolbar__btn--primary"
          onClick={onCopySVG}
          title="Copy SVG to clipboard"
          aria-label="Copy SVG"
        >
          <span className="forge-toolbar__btn-icon">↓</span>
          <span className="forge-toolbar__btn-text">Copy SVG</span>
        </button>
      </div>
    </div>
  );
}

export const Toolbar = memo(ToolbarInner);
