"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { snapToGrid } from "@/lib/utils";
import { useEditorStore, useIsEditMode, useSelectedElementIds } from "@/store/editor-store";
import { TextElement } from "./elements/TextElement";
import { ImageElement } from "./elements/ImageElement";
import { VideoElement } from "./elements/VideoElement";
import { ButtonElement } from "./elements/ButtonElement";
import { ContainerElement } from "./elements/ContainerElement";
import { DividerElement } from "./elements/DividerElement";
import type { Element } from "@/lib/types";

interface DraggableElementProps {
  element: Element;
  containerRef?: React.RefObject<HTMLElement>;
}

const ELEMENT_COMPONENTS: Record<string, React.ComponentType<{ element: Element; isEditing: boolean }>> = {
  text: TextElement,
  image: ImageElement,
  video: VideoElement,
  button: ButtonElement,
  container: ContainerElement,
  divider: DividerElement,
};

// Minimum padding from container edges
const EDGE_PADDING = 16;

// Constrain position to viewport/container bounds
function constrainToBounds(
  x: number,
  y: number,
  elementWidth: number,
  elementHeight: number,
  containerWidth: number,
  containerHeight: number
) {
  const maxX = containerWidth - elementWidth - EDGE_PADDING;
  const maxY = containerHeight - elementHeight - EDGE_PADDING;

  return {
    x: Math.max(EDGE_PADDING, Math.min(x, maxX)),
    y: Math.max(EDGE_PADDING, Math.min(y, maxY)),
  };
}

export function DraggableElement({ element, containerRef }: DraggableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const isEditMode = useIsEditMode();
  const selectedElementIds = useSelectedElementIds();
  const {
    selectElement,
    addToSelection,
    moveElement,
    resizeElement,
    removeElement,
    gridSize,
  } = useEditorStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [nearEdge, setNearEdge] = useState<{ top: boolean; right: boolean; bottom: boolean; left: boolean }>({
    top: false,
    right: false,
    bottom: false,
    left: false,
  });

  const isSelected = selectedElementIds.includes(element.id);
  const ElementComponent = ELEMENT_COMPONENTS[element.type];

  // Handle click to select (with shift for multi-select)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode) return;
      e.stopPropagation();
      
      if (e.shiftKey) {
        // Multi-select with shift
        addToSelection(element.id);
      } else {
        // Single select
        selectElement(element.id);
      }
    },
    [isEditMode, element.id, selectElement, addToSelection]
  );

  // Handle double click to edit
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode) return;
      e.stopPropagation();
      setIsEditing(true);
    },
    [isEditMode]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode || isEditing) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        elementX: element.x,
        elementY: element.y,
      });
    },
    [isEditMode, isEditing, element.x, element.y]
  );

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      let newX = snapToGrid(dragStart.elementX + deltaX, gridSize);
      let newY = snapToGrid(dragStart.elementY + deltaY, gridSize);

      // Get container or viewport bounds
      const container = containerRef?.current || elementRef.current?.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = container.scrollWidth;
        const containerHeight = container.scrollHeight;
        const elementWidth = element.width ?? 200;
        const elementHeight = element.height ?? 100;

        // Apply constraints
        const constrained = constrainToBounds(
          newX,
          newY,
          elementWidth,
          elementHeight,
          containerWidth,
          containerHeight
        );
        newX = constrained.x;
        newY = constrained.y;

        // Check if near edges (for visual feedback)
        const edgeThreshold = 32;
        setNearEdge({
          top: newY <= EDGE_PADDING + edgeThreshold,
          left: newX <= EDGE_PADDING + edgeThreshold,
          right: newX >= containerWidth - elementWidth - EDGE_PADDING - edgeThreshold,
          bottom: newY >= containerHeight - elementHeight - EDGE_PADDING - edgeThreshold,
        });
      }

      moveElement(element.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setNearEdge({ top: false, right: false, bottom: false, left: false });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, element.id, gridSize, moveElement, element.width, element.height, containerRef]);

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode) return;
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width ?? 200,
        height: element.height ?? 100,
      });
    },
    [isEditMode, element.width, element.height]
  );

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      let newWidth = Math.max(50, snapToGrid(resizeStart.width + deltaX, gridSize));
      let newHeight = Math.max(50, snapToGrid(resizeStart.height + deltaY, gridSize));

      // Constrain resize to container bounds
      const container = containerRef?.current || elementRef.current?.parentElement;
      if (container) {
        const containerWidth = container.scrollWidth;
        const containerHeight = container.scrollHeight;

        // Don't let resize push element past boundaries
        const maxWidth = containerWidth - element.x - EDGE_PADDING;
        const maxHeight = containerHeight - element.y - EDGE_PADDING;

        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);
      }

      resizeElement(element.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeStart, element.id, element.x, element.y, gridSize, resizeElement, containerRef]);

  // Handle delete
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeElement(element.id);
    },
    [element.id, removeElement]
  );

  // Handle click outside to stop editing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (elementRef.current && !elementRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  if (!ElementComponent) {
    return null;
  }

  return (
    <motion.div
      ref={elementRef}
      className={cn(
        "absolute",
        isEditMode && "cursor-move",
        isEditMode && isSelected && "ring-2 ring-gold ring-offset-1 ring-offset-void",
        isDragging && "opacity-90 shadow-lg shadow-gold/20"
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.width ?? "auto",
        height: element.height ?? "auto",
        zIndex: element.zIndex + (isSelected ? 100 : 0) + (isDragging ? 200 : 0),
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleDragStart}
      initial={false}
      animate={{ scale: isDragging ? 1.02 : 1 }}
    >
      {/* Element content */}
      <ElementComponent element={element} isEditing={isEditing} />

      {/* Edge proximity indicators */}
      {isDragging && (
        <>
          {nearEdge.top && (
            <div className="absolute -top-1 left-0 right-0 h-0.5 bg-gold animate-pulse" />
          )}
          {nearEdge.left && (
            <div className="absolute top-0 bottom-0 -left-1 w-0.5 bg-gold animate-pulse" />
          )}
          {nearEdge.right && (
            <div className="absolute top-0 bottom-0 -right-1 w-0.5 bg-gold animate-pulse" />
          )}
          {nearEdge.bottom && (
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold animate-pulse" />
          )}
        </>
      )}

      {/* Selection controls */}
      {isEditMode && isSelected && !isEditing && (
        <>
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="absolute -top-3 -right-3 w-6 h-6 bg-void border border-dawn-15 text-dawn-50 hover:text-dawn hover:border-dawn-30 transition-colors flex items-center justify-center"
          >
            <span className="text-xs">×</span>
          </button>

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-gold cursor-se-resize"
          />

          {/* Position indicator */}
          <div className="absolute -bottom-6 left-0 font-mono text-2xs text-dawn-30">
            {element.x}, {element.y}
          </div>
        </>
      )}
    </motion.div>
  );
}

