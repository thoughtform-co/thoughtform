"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SurveyAnnotation } from "./types";

// ═══════════════════════════════════════════════════════════════
// ANNOTATION BOX - Resizable annotation with close button
// Extracted from SurveyView for maintainability
// ═══════════════════════════════════════════════════════════════

export interface AnnotationBoxProps {
  annotation: SurveyAnnotation;
  onDelete: () => void;
  onResize: (x: number, y: number, width: number, height: number) => void;
  onResizingChange?: (isResizing: boolean) => void;
}

type ResizeHandle = "n" | "s" | "w" | "e" | "nw" | "ne" | "sw" | "se";

interface StartBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AnnotationBox({
  annotation,
  onDelete,
  onResize,
  onResizingChange,
}: AnnotationBoxProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startBounds, setStartBounds] = useState<StartBounds>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Notify parent of resizing state changes
  useEffect(() => {
    onResizingChange?.(isResizing);
  }, [isResizing, onResizingChange]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartBounds({
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
      });
    },
    [annotation]
  );

  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const parent = boxRef.current?.parentElement;
      if (!parent) return;

      const deltaX = ((e.clientX - startPos.x) / parent.clientWidth) * 100;
      const deltaY = ((e.clientY - startPos.y) / parent.clientHeight) * 100;

      let newX = startBounds.x;
      let newY = startBounds.y;
      let newWidth = startBounds.width;
      let newHeight = startBounds.height;

      // Handle different resize handles
      if (resizeHandle.includes("n")) {
        newY = Math.max(
          0,
          Math.min(startBounds.y + startBounds.height - 5, startBounds.y + deltaY)
        );
        newHeight = startBounds.height - deltaY;
      }
      if (resizeHandle.includes("s")) {
        newHeight = Math.max(5, startBounds.height + deltaY);
      }
      if (resizeHandle.includes("w")) {
        newX = Math.max(0, Math.min(startBounds.x + startBounds.width - 5, startBounds.x + deltaX));
        newWidth = startBounds.width - deltaX;
      }
      if (resizeHandle.includes("e")) {
        newWidth = Math.max(5, startBounds.width + deltaX);
      }

      // Ensure bounds stay within container
      if (newX + newWidth > 100) {
        newWidth = 100 - newX;
      }
      if (newY + newHeight > 100) {
        newHeight = 100 - newY;
      }

      onResize(newX, newY, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeHandle, startPos, startBounds, onResize]);

  return (
    <div
      ref={boxRef}
      className="survey-canvas__annotation"
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        width: `${annotation.width}%`,
        height: `${annotation.height}%`,
      }}
      title={annotation.note || "Double-click to view note"}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (annotation.note) {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {/* Resize handles - subtle via CSS */}
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--n"
        onMouseDown={(e) => handleResizeStart(e, "n")}
      />
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--s"
        onMouseDown={(e) => handleResizeStart(e, "s")}
      />
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--w"
        onMouseDown={(e) => handleResizeStart(e, "w")}
      />
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--e"
        onMouseDown={(e) => handleResizeStart(e, "e")}
      />
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--nw"
        onMouseDown={(e) => handleResizeStart(e, "nw")}
      />
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--ne"
        onMouseDown={(e) => handleResizeStart(e, "ne")}
      />
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--sw"
        onMouseDown={(e) => handleResizeStart(e, "sw")}
      />
      <div
        className="survey-canvas__annotation-resize-handle survey-canvas__annotation-resize-handle--se"
        onMouseDown={(e) => handleResizeStart(e, "se")}
      />

      {/* Expanded note display */}
      {annotation.note && isExpanded && (
        <div
          className="survey-canvas__annotation-note survey-canvas__annotation-note--expanded"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}
        >
          <span className="survey-canvas__annotation-note-text">{annotation.note}</span>
        </div>
      )}
    </div>
  );
}
