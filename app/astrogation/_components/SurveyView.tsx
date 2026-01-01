"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { SurveyItem, SurveyAnnotation } from "./types";

// ═══════════════════════════════════════════════════════════════
// SURVEY VIEW - Upload, Browse & Preview Design References
// Redesigned: Large preview canvas + thumbnail strip
// ═══════════════════════════════════════════════════════════════

export interface SurveyViewProps {
  items: SurveyItem[];
  selectedItemId: string | null;
  loading: boolean;
  searchQuery?: string;
  isSearching?: boolean;
  onSelectItem?: (id: string | null) => void;
  onUpload?: (file: File) => Promise<void>;
  onSearchQueryChange?: (query: string) => void;
  onSearch?: (query: string) => Promise<void>;
  onAnnotationsChange?: (annotations: SurveyAnnotation[]) => void;
  onResizingChange?: (isResizing: boolean) => void;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// ═══════════════════════════════════════════════════════════════
// ANNOTATION BOX - Resizable annotation with close button
// ═══════════════════════════════════════════════════════════════

interface AnnotationBoxProps {
  annotation: SurveyAnnotation;
  onDelete: () => void;
  onResize: (x: number, y: number, width: number, height: number) => void;
}

interface AnnotationBoxProps {
  annotation: SurveyAnnotation;
  onDelete: () => void;
  onResize: (x: number, y: number, width: number, height: number) => void;
  onResizingChange?: (isResizing: boolean) => void;
}

function AnnotationBox({ annotation, onDelete, onResize, onResizingChange }: AnnotationBoxProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startBounds, setStartBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  // Notify parent of resizing state changes
  useEffect(() => {
    onResizingChange?.(isResizing);
  }, [isResizing, onResizingChange]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string) => {
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

      // Ensure bounds
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
      title={annotation.note || "Click to add note"}
    >
      {/* Close button */}
      <button
        className="survey-canvas__annotation-close"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete annotation"
      >
        ×
      </button>

      {/* Resize handles */}
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

      {annotation.note && <div className="survey-canvas__annotation-note">{annotation.note}</div>}
    </div>
  );
}

export function SurveyView({
  items,
  selectedItemId,
  loading,
  onSelectItem,
  onAnnotationsChange,
  onResizingChange,
}: SurveyViewProps) {
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  // Local annotations state for instant updates during resize
  const [localAnnotations, setLocalAnnotations] = useState<SurveyAnnotation[] | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAnyAnnotationResizing, setIsAnyAnnotationResizing] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedItemId);

  // Sync local annotations when selected item changes
  useEffect(() => {
    if (selectedItem?.annotations) {
      setLocalAnnotations(selectedItem.annotations);
    } else {
      setLocalAnnotations([]);
    }
  }, [selectedItem?.id, selectedItem?.annotations]);

  // Get effective annotations (local if available, otherwise from item)
  const effectiveAnnotations = useMemo(
    () => (localAnnotations !== null ? localAnnotations : selectedItem?.annotations || []),
    [localAnnotations, selectedItem?.annotations]
  );

  // Track canvas size for annotation calculations
  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // File selection removed - handled by upload modal

  // Remove drag/drop and paste handlers - upload is now via modal

  // Annotation drawing handlers
  const pixelToPercent = useCallback((pixelX: number, pixelY: number) => {
    const img = imageRef.current;
    if (!img) return { x: 0, y: 0 };
    return {
      x: (pixelX / img.clientWidth) * 100,
      y: (pixelY / img.clientHeight) * 100,
    };
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedItem || !canvasRef.current || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();

      // Check if click is within the image bounds
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDrawing({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
    },
    [selectedItem]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing?.isDrawing || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      setDrawing((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    },
    [drawing?.isDrawing]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (!drawing?.isDrawing || !selectedItem || !onAnnotationsChange) {
      setDrawing(null);
      return;
    }

    const { startX, startY, currentX, currentY } = drawing;
    const minX = Math.min(startX, currentX);
    const minY = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Only create annotation if it's large enough
    if (width > 20 && height > 20) {
      const startPercent = pixelToPercent(minX, minY);
      const endPercent = pixelToPercent(minX + width, minY + height);

      const newAnnotation: SurveyAnnotation = {
        id: crypto.randomUUID(),
        x: startPercent.x,
        y: startPercent.y,
        width: endPercent.x - startPercent.x,
        height: endPercent.y - startPercent.y,
        note: "",
        created_at: new Date().toISOString(),
      };

      const updatedAnnotations = [...effectiveAnnotations, newAnnotation];
      setLocalAnnotations(updatedAnnotations);
      // Save immediately for new annotations
      onAnnotationsChange(updatedAnnotations);
    }

    setDrawing(null);
  }, [drawing, selectedItem, onAnnotationsChange, pixelToPercent, effectiveAnnotations]);

  // Debounced save function
  const debouncedSave = useCallback(
    (annotations: SurveyAnnotation[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onAnnotationsChange?.(annotations);
      }, 300); // 300ms debounce
    },
    [onAnnotationsChange]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Notify parent of resizing state
  useEffect(() => {
    onResizingChange?.(isAnyAnnotationResizing);
  }, [isAnyAnnotationResizing, onResizingChange]);

  // Get drawing rectangle for preview
  const getDrawingRect = () => {
    if (!drawing || !imageRef.current) return null;
    const { startX, startY, currentX, currentY } = drawing;
    return {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
    };
  };

  const drawingRect = getDrawingRect();

  return (
    <div className="survey-view">
      {/* Large Preview Canvas */}
      <div
        ref={canvasRef}
        className="survey-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {selectedItem?.image_url ? (
          <div className="survey-canvas__image-container">
            <img
              ref={imageRef}
              src={selectedItem.image_url}
              alt={selectedItem.title || "Reference"}
              className="survey-canvas__image"
              draggable={false}
            />

            {/* Existing annotations */}
            {effectiveAnnotations.map((annotation) => (
              <AnnotationBox
                key={annotation.id}
                annotation={annotation}
                onDelete={() => {
                  const updatedAnnotations = effectiveAnnotations.filter(
                    (a) => a.id !== annotation.id
                  );
                  setLocalAnnotations(updatedAnnotations);
                  // Save immediately for delete
                  onAnnotationsChange?.(updatedAnnotations);
                }}
                onResize={(x, y, width, height) => {
                  // Update local state instantly for fluid resizing
                  const updatedAnnotations = effectiveAnnotations.map((a) =>
                    a.id === annotation.id ? { ...a, x, y, width, height } : a
                  );
                  setLocalAnnotations(updatedAnnotations);
                  // Debounce the save to database
                  debouncedSave(updatedAnnotations);
                }}
                onResizingChange={setIsAnyAnnotationResizing}
              />
            ))}

            {/* Drawing preview */}
            {drawingRect && (
              <div
                className="survey-canvas__drawing"
                style={{
                  left: `${drawingRect.left}px`,
                  top: `${drawingRect.top}px`,
                  width: `${drawingRect.width}px`,
                  height: `${drawingRect.height}px`,
                }}
              />
            )}
          </div>
        ) : (
          <div className="survey-canvas__empty">
            {items.length === 0 ? (
              <>
                <span className="survey-canvas__empty-icon">◇</span>
                <span className="survey-canvas__empty-text">No references yet</span>
                <span className="survey-canvas__empty-hint">
                  Click &ldquo;Upload&rdquo; in the Inspector panel to add your first reference
                </span>
              </>
            ) : (
              <>
                <span className="survey-canvas__empty-icon">◇</span>
                <span className="survey-canvas__empty-text">Select a reference</span>
              </>
            )}
          </div>
        )}

        {/* Annotation hint */}
        {selectedItem && <div className="survey-canvas__hint">Drag to annotate</div>}
      </div>

      {/* Thumbnail Strip - Recent Uploads */}
      <div className="survey-thumbnails">
        <div className="survey-thumbnails__list">
          {loading ? (
            <div className="survey-thumbnails__loading">
              <span>◇</span> Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="survey-thumbnails__empty">
              <span>No references yet</span>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                className={`survey-thumbnail ${selectedItemId === item.id ? "survey-thumbnail--selected" : ""}`}
                onClick={() => onSelectItem?.(item.id)}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title || "Reference"} loading="lazy" />
                ) : (
                  <span className="survey-thumbnail__placeholder">◇</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
