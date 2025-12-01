"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { snapToGrid } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import { TextElement } from "./elements/TextElement";
import { ImageElement } from "./elements/ImageElement";
import { VideoElement } from "./elements/VideoElement";
import type { Element } from "@/lib/types";

interface DraggableElementProps {
  element: Element;
}

const ELEMENT_COMPONENTS: Record<string, React.ComponentType<{ element: Element; isEditing: boolean }>> = {
  text: TextElement,
  image: ImageElement,
  video: VideoElement,
};

export function DraggableElement({ element }: DraggableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const isEditMode = useIsEditMode();
  const {
    selectedElementId,
    setSelectedElement,
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

  const isSelected = selectedElementId === element.id;
  const ElementComponent = ELEMENT_COMPONENTS[element.type];

  // Handle click to select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode) return;
      e.stopPropagation();
      setSelectedElement(element.id);
    },
    [isEditMode, element.id, setSelectedElement]
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
      const newX = snapToGrid(dragStart.elementX + deltaX, gridSize);
      const newY = snapToGrid(dragStart.elementY + deltaY, gridSize);
      moveElement(element.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, element.id, gridSize, moveElement]);

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
      const newWidth = Math.max(50, snapToGrid(resizeStart.width + deltaX, gridSize));
      const newHeight = Math.max(50, snapToGrid(resizeStart.height + deltaY, gridSize));
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
  }, [isResizing, resizeStart, element.id, gridSize, resizeElement]);

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
        isDragging && "opacity-80"
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.width ?? "auto",
        height: element.height ?? "auto",
        zIndex: element.zIndex + (isSelected ? 100 : 0),
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleDragStart}
      initial={false}
      animate={{ scale: isDragging ? 1.02 : 1 }}
    >
      {/* Element content */}
      <ElementComponent element={element} isEditing={isEditing} />

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
        </>
      )}
    </motion.div>
  );
}

