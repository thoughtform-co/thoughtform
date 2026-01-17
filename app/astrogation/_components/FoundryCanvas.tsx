"use client";

import React, { useCallback, useRef, useState, useEffect, memo } from "react";
import type { FoundryCanvasDocument, FoundryCanvasItem, FoundryViewport } from "./types";
import { ComponentPreview } from "./previews/ComponentPreview";

// ═══════════════════════════════════════════════════════════════
// FOUNDRY CANVAS - Multi-mockup Figma-like canvas
// Phase 1: Drag, resize, pan/zoom, keyboard shortcuts
// ═══════════════════════════════════════════════════════════════

export interface FoundryCanvasProps {
  document: FoundryCanvasDocument;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onResizeItem: (id: string, w: number, h: number) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onSetViewport: (viewport: Partial<FoundryViewport>) => void;
  /**
   * Optional: update an item's args as the user interacts with the real component
   * (e.g. slider/toggle/select changes).
   */
  onUpdateItemArgs?: (id: string, nextArgs: Record<string, unknown>) => void;
}

// Constants
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;
const GRID_SIZE = 20; // For optional snap-to-grid

// ───────────────────────────────────────────────────────────────
// CANVAS ITEM COMPONENT (memoized for performance)
// ───────────────────────────────────────────────────────────────

interface CanvasItemProps {
  item: FoundryCanvasItem;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onUpdateItemArgs?: (id: string, nextArgs: Record<string, unknown>) => void;
}

const CanvasItem = memo(function CanvasItem({
  item,
  isSelected,
  zoom,
  onSelect,
  onDragStart,
  onUpdateItemArgs,
}: CanvasItemProps) {
  // Build runtime args for interactive components (do NOT persist handlers).
  const baseArgs = (item.args || item.props || {}) as Record<string, unknown>;
  let runtimeArgs = baseArgs;

  if (onUpdateItemArgs && item.source === "registry" && item.registryKey) {
    const update = (patch: Record<string, unknown>) => {
      onUpdateItemArgs(item.id, { ...baseArgs, ...patch });
    };

    // Common interactive registry components
    if (item.registryKey === "slider") {
      runtimeArgs = { ...baseArgs, onChange: (value: number) => update({ value }) };
    } else if (item.registryKey === "toggle") {
      runtimeArgs = { ...baseArgs, onChange: (checked: boolean) => update({ checked }) };
    } else if (item.registryKey === "select") {
      runtimeArgs = { ...baseArgs, onChange: (value: string) => update({ value }) };
    }
  }

  return (
    <div
      className={`foundry-canvas__item ${isSelected ? "foundry-canvas__item--selected" : ""} ${item.locked ? "foundry-canvas__item--locked" : ""}`}
      style={{
        position: "absolute",
        left: item.frame.x,
        top: item.frame.y,
        width: item.frame.w,
        height: item.frame.h,
        zIndex: item.frame.z,
        cursor: item.locked ? "not-allowed" : "default",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerDown={(e) => {
        if (item.locked) return;
        // Only initiate drag/resize when explicitly requested:
        // - resize handles
        // - the item label (acts as a grab handle)
        // - Alt-drag anywhere (escape hatch)
        //
        // Otherwise, allow interacting with the underlying component (buttons, inputs, etc).
        const target = e.target as HTMLElement;
        const isResizeHandle = !!target.closest(".foundry-canvas__resize-handle");
        const isLabelHandle = !!target.closest(".foundry-canvas__item-label");

        if (isResizeHandle || isLabelHandle || e.altKey) {
          e.stopPropagation();
          onSelect();
          onDragStart(e);
        }
      }}
    >
      {/* Component Preview */}
      <div className="foundry-canvas__item-preview">
        <ComponentPreview
          source={item.source}
          registryKey={item.registryKey}
          componentId={item.componentId}
          args={runtimeArgs}
          props={item.props}
          style={
            item.styleVars
              ? {
                  borderStyle: "none",
                  borderWidth: 1,
                  borderColor: "#caa554",
                  fillType: "none",
                  fillColor: "#0a0908",
                  gradientFrom: "#caa554",
                  gradientTo: "#0a0908",
                  gradientAngle: 135,
                  props: {},
                  styleVars: item.styleVars,
                }
              : undefined
          }
        />
      </div>

      {/* Selection frame & resize handles (hidden by default, shown on hover) */}
      {!item.locked && (
        <div
          className={`foundry-canvas__handles ${isSelected ? "foundry-canvas__handles--visible" : ""}`}
        >
          <div
            className="foundry-canvas__resize-handle foundry-canvas__resize-handle--se"
            data-handle="se"
          />
          <div
            className="foundry-canvas__resize-handle foundry-canvas__resize-handle--sw"
            data-handle="sw"
          />
          <div
            className="foundry-canvas__resize-handle foundry-canvas__resize-handle--ne"
            data-handle="ne"
          />
          <div
            className="foundry-canvas__resize-handle foundry-canvas__resize-handle--nw"
            data-handle="nw"
          />
        </div>
      )}

      {/* Item label (hidden by default, shown on hover) */}
      <div
        className={`foundry-canvas__item-label ${isSelected ? "foundry-canvas__item-label--visible" : ""}`}
      >
        {item.locked && <span className="foundry-canvas__item-lock-icon">🔒</span>}
        {item.name}
      </div>
    </div>
  );
});

// ───────────────────────────────────────────────────────────────
// MAIN CANVAS COMPONENT
// ───────────────────────────────────────────────────────────────

export function FoundryCanvas({
  document,
  selectedItemId,
  onSelectItem,
  onMoveItem,
  onResizeItem,
  onDeleteItem,
  onDuplicateItem,
  onSetViewport,
  onUpdateItemArgs,
}: FoundryCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Local state for smooth dragging (commit to reducer on end)
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Local position/size while dragging (for immediate visual feedback)
  const [localItemPos, setLocalItemPos] = useState<{ x: number; y: number } | null>(null);
  const [localItemSize, setLocalItemSize] = useState<{ w: number; h: number } | null>(null);

  const { viewport, items } = document;

  // Get the currently selected item
  const selectedItem = selectedItemId
    ? items.find((item) => item.id === selectedItemId) || null
    : null;

  // ─────────────────────────────────────────────────────────────
  // KEYBOARD SHORTCUTS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas is focused and item is selected
      if (!selectedItemId) return;

      // Don't intercept if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          e.preventDefault();
          onDeleteItem(selectedItemId);
          break;
        case "d":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onDuplicateItem(selectedItemId);
          }
          break;
        case "Escape":
          e.preventDefault();
          onSelectItem(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, onDeleteItem, onDuplicateItem, onSelectItem]);

  // ─────────────────────────────────────────────────────────────
  // ZOOM (mouse wheel)
  // ─────────────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Ctrl+wheel = zoom, plain wheel = pan
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.zoom + delta));
        onSetViewport({ zoom: newZoom });
      } else {
        // Pan
        onSetViewport({
          panX: viewport.panX - e.deltaX,
          panY: viewport.panY - e.deltaY,
        });
      }
    },
    [viewport, onSetViewport]
  );

  // ─────────────────────────────────────────────────────────────
  // CANVAS CLICK (deselect)
  // ─────────────────────────────────────────────────────────────

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only deselect if clicking directly on canvas (not items)
      if (e.target === canvasRef.current || e.target === contentRef.current) {
        onSelectItem(null);
      }
    },
    [onSelectItem]
  );

  // ─────────────────────────────────────────────────────────────
  // ITEM DRAG
  // ─────────────────────────────────────────────────────────────

  const handleItemDragStart = useCallback(
    (itemId: string) => (e: React.PointerEvent) => {
      const item = items.find((i) => i.id === itemId);
      if (!item || item.locked) return;

      // Check if clicking on a resize handle
      const target = e.target as HTMLElement;
      const handle = target.dataset.handle;
      if (handle) {
        // Start resizing
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          w: item.frame.w,
          h: item.frame.h,
        });
        setLocalItemSize({ w: item.frame.w, h: item.frame.h });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      // Start dragging
      setIsDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setLocalItemPos({ x: item.frame.x, y: item.frame.y });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [items]
  );

  // ─────────────────────────────────────────────────────────────
  // POINTER MOVE/UP (global handlers for drag/resize)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isDragging && !isResizing && !isPanning) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging && selectedItemId && localItemPos) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - viewport.panX) / viewport.zoom - dragOffset.x;
        const y = (e.clientY - rect.top - viewport.panY) / viewport.zoom - dragOffset.y;

        setLocalItemPos({ x, y });
      }

      if (isResizing && selectedItemId && localItemSize && resizeHandle) {
        const deltaX = (e.clientX - resizeStart.x) / viewport.zoom;
        const deltaY = (e.clientY - resizeStart.y) / viewport.zoom;

        let newW = resizeStart.w;
        let newH = resizeStart.h;

        if (resizeHandle.includes("e")) newW = Math.max(50, resizeStart.w + deltaX);
        if (resizeHandle.includes("w")) newW = Math.max(50, resizeStart.w - deltaX);
        if (resizeHandle.includes("s")) newH = Math.max(50, resizeStart.h + deltaY);
        if (resizeHandle.includes("n")) newH = Math.max(50, resizeStart.h - deltaY);

        setLocalItemSize({ w: newW, h: newH });
      }

      if (isPanning) {
        onSetViewport({
          panX: viewport.panX + e.movementX,
          panY: viewport.panY + e.movementY,
        });
      }
    };

    const handlePointerUp = () => {
      if (isDragging && selectedItemId && localItemPos) {
        onMoveItem(selectedItemId, localItemPos.x, localItemPos.y);
        setLocalItemPos(null);
      }

      if (isResizing && selectedItemId && localItemSize) {
        onResizeItem(selectedItemId, localItemSize.w, localItemSize.h);
        setLocalItemSize(null);
      }

      setIsDragging(false);
      setIsResizing(false);
      setIsPanning(false);
      setResizeHandle(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    isDragging,
    isResizing,
    isPanning,
    selectedItemId,
    localItemPos,
    localItemSize,
    dragOffset,
    resizeHandle,
    resizeStart,
    viewport,
    onMoveItem,
    onResizeItem,
    onSetViewport,
  ]);

  // ─────────────────────────────────────────────────────────────
  // MIDDLE-CLICK PAN
  // ─────────────────────────────────────────────────────────────

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    // Middle mouse button or space+click for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  // Sort items by z-index for rendering order
  const sortedItems = [...items].sort((a, b) => a.frame.z - b.frame.z);

  return (
    <div
      ref={canvasRef}
      className="foundry-canvas"
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      onPointerDown={handleCanvasPointerDown}
    >
      {/* Transform layer for pan/zoom */}
      <div
        ref={contentRef}
        className="foundry-canvas__content"
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Grid background (optional) */}
        <div
          className="foundry-canvas__grid"
          style={{
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        />

        {/* Canvas items */}
        {sortedItems.map((item) => {
          const isSelected = item.id === selectedItemId;
          // Use local position/size during drag/resize for smooth feedback
          const displayItem =
            isSelected && localItemPos
              ? { ...item, frame: { ...item.frame, ...localItemPos } }
              : isSelected && localItemSize
                ? { ...item, frame: { ...item.frame, ...localItemSize } }
                : item;

          return (
            <CanvasItem
              key={item.id}
              item={displayItem}
              isSelected={isSelected}
              zoom={viewport.zoom}
              onSelect={() => onSelectItem(item.id)}
              onDragStart={handleItemDragStart(item.id)}
              onUpdateItemArgs={onUpdateItemArgs}
            />
          );
        })}
      </div>

      {/* Zoom indicator */}
      <div className="foundry-canvas__zoom-indicator">{Math.round(viewport.zoom * 100)}%</div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="foundry-canvas__empty">
          <span className="foundry-canvas__empty-icon">⬡</span>
          <p>Canvas is empty</p>
          <span className="foundry-canvas__empty-hint">
            Add components from the left panel to start designing
          </span>
        </div>
      )}
    </div>
  );
}
