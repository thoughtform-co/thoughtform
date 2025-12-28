"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import { DraggableElement } from "@/components/editor/DraggableElement";
import type { Section, ElementType } from "@/lib/types";

interface FreeformSectionProps {
  section: Section;
}

export function FreeformSection({ section }: FreeformSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isEditMode = useIsEditMode();
  const { showGrid, addElement } = useEditorStore();

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Add a text element at the click position
      addElement(section.id, "text", { x, y });
    },
    [isEditMode, section.id, addElement]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isEditMode) return;

      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const elementType = e.dataTransfer.getData("elementType") as ElementType;
      if (elementType) {
        addElement(section.id, elementType, { x, y });
      }
    },
    [isEditMode, section.id, addElement]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const minHeight = section.minHeight || "50vh";

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", isEditMode && showGrid && "editor-grid")}
      style={{ minHeight }}
      onDoubleClick={handleDoubleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Empty state */}
      {(!section.elements || section.elements.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2">
              Freeform Section
            </div>
            {isEditMode && (
              <div className="font-mono text-xs text-dawn-50">
                Double-click to add text or drag elements here
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render elements */}
      {section.elements?.map((element) => (
        <DraggableElement key={element.id} element={element} containerRef={containerRef} />
      ))}
    </div>
  );
}
