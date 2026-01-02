"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Network } from "lucide-react";
import type { SurveyItem, SurveyAnnotation } from "./types";
import { AnnotationBox } from "./AnnotationBox";

// ═══════════════════════════════════════════════════════════════
// SURVEY VIEW - Pinterest-style grid with detail overlay
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
// MASONRY GRID ITEM
// ═══════════════════════════════════════════════════════════════

interface GridItemProps {
  item: SurveyItem;
  onClick: () => void;
}

function GridItem({ item, onClick }: GridItemProps) {
  return (
    <button className="survey-grid__item" onClick={onClick}>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title || "Reference"}
          className="survey-grid__item-image"
          loading="lazy"
        />
      ) : (
        <div className="survey-grid__item-placeholder">
          <span>◇</span>
        </div>
      )}
      {/* Hover overlay with title */}
      <div className="survey-grid__item-overlay">
        <span className="survey-grid__item-title">{item.title || "Untitled"}</span>
        {item.tags && item.tags.length > 0 && (
          <div className="survey-grid__item-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="survey-grid__item-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Embedded indicator */}
      {item.briefing_embedding_text && (
        <div className="survey-grid__item-embedded" title="Embedded in vector space">
          <Network size={12} strokeWidth={1.5} />
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW (Canvas + Annotations)
// ═══════════════════════════════════════════════════════════════

interface DetailViewProps {
  item: SurveyItem;
  annotations: SurveyAnnotation[];
  onAnnotationsChange?: (annotations: SurveyAnnotation[]) => void;
  onResizingChange?: (isResizing: boolean) => void;
  onClose: () => void;
}

function DetailView({
  item,
  annotations,
  onAnnotationsChange,
  onResizingChange,
  onClose,
}: DetailViewProps) {
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [localAnnotations, setLocalAnnotations] = useState<SurveyAnnotation[]>(annotations);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAnyAnnotationResizing, setIsAnyAnnotationResizing] = useState(false);

  // Sync local annotations when prop changes
  useEffect(() => {
    setLocalAnnotations(annotations);
  }, [annotations]);

  // Notify parent of resizing state
  useEffect(() => {
    onResizingChange?.(isAnyAnnotationResizing);
  }, [isAnyAnnotationResizing, onResizingChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const pixelToPercent = useCallback((pixelX: number, pixelY: number) => {
    const img = imageRef.current;
    if (!img) return { x: 0, y: 0 };
    return {
      x: (pixelX / img.clientWidth) * 100,
      y: (pixelY / img.clientHeight) * 100,
    };
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();

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
  }, []);

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
    if (!drawing?.isDrawing || !onAnnotationsChange) {
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

      const updatedAnnotations = [...localAnnotations, newAnnotation];
      setLocalAnnotations(updatedAnnotations);
      onAnnotationsChange(updatedAnnotations);
    }

    setDrawing(null);
  }, [drawing, onAnnotationsChange, pixelToPercent, localAnnotations]);

  const debouncedSave = useCallback(
    (updatedAnnotations: SurveyAnnotation[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onAnnotationsChange?.(updatedAnnotations);
      }, 300);
    },
    [onAnnotationsChange]
  );

  const getDrawingRect = () => {
    if (!drawing) return null;
    const { startX, startY, currentX, currentY } = drawing;
    return {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
    };
  };

  const drawingRect = getDrawingRect();

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Calculate aspect ratio for responsive sizing
  const aspectRatio = useMemo(() => {
    if (item.image_width && item.image_height) {
      return item.image_width / item.image_height;
    }
    return 16 / 9; // Default aspect ratio
  }, [item.image_width, item.image_height]);

  return (
    <div className="survey-detail-focused">
      {/* Label on top */}
      <span className="survey-detail-focused__label">
        {(item.title || "Untitled").toUpperCase()}
      </span>

      {/* Content frame */}
      <div className="survey-detail-focused__content">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="survey-detail-focused__canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <div
            className="survey-detail-focused__image-container"
            style={{
              aspectRatio: aspectRatio.toString(),
            }}
          >
            <img
              ref={imageRef}
              src={item.image_url}
              alt={item.title || "Reference"}
              className="survey-detail-focused__image"
              draggable={false}
            />

            {/* Annotations */}
            {localAnnotations.map((annotation) => (
              <AnnotationBox
                key={annotation.id}
                annotation={annotation}
                onDelete={() => {
                  const updatedAnnotations = localAnnotations.filter((a) => a.id !== annotation.id);
                  setLocalAnnotations(updatedAnnotations);
                  onAnnotationsChange?.(updatedAnnotations);
                }}
                onResize={(x, y, width, height) => {
                  const updatedAnnotations = localAnnotations.map((a) =>
                    a.id === annotation.id ? { ...a, x, y, width, height } : a
                  );
                  setLocalAnnotations(updatedAnnotations);
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

          {/* Annotation hint */}
          <div className="survey-detail-focused__hint">Drag to annotate · Esc to close</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SURVEY VIEW
// ═══════════════════════════════════════════════════════════════

export function SurveyView({
  items,
  selectedItemId,
  loading,
  onSelectItem,
  onUpload,
  onAnnotationsChange,
  onResizingChange,
}: SurveyViewProps) {
  const selectedItem = items.find((item) => item.id === selectedItemId);

  // Show all items (not just annotated ones)
  const inspectedItems = useMemo(() => items, [items]);

  // Handle item click in grid
  const handleItemClick = useCallback(
    (itemId: string) => {
      onSelectItem?.(itemId);
    },
    [onSelectItem]
  );

  // Handle closing detail view
  const handleCloseDetail = useCallback(() => {
    onSelectItem?.(null);
  }, [onSelectItem]);

  // Handle paste to upload images
  useEffect(() => {
    if (!onUpload) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith("image/")) {
          const file = clipboardItems[i].getAsFile();
          if (file) {
            // Validate file type
            const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
            if (!validTypes.includes(file.type)) {
              console.warn("Invalid image type:", file.type);
              return;
            }
            // Upload the file
            await onUpload(file);
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onUpload]);

  // Handle Escape key to close overlay
  useEffect(() => {
    if (!selectedItemId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseDetail();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, handleCloseDetail]);

  // Get effective annotations
  const effectiveAnnotations = useMemo(
    () => selectedItem?.annotations || [],
    [selectedItem?.annotations]
  );

  return (
    <div className="survey-view">
      {/* ─── GRID VIEW (Always visible) ─── */}
      <div className="survey-grid">
        {loading ? (
          <div className="survey-grid__loading">
            <span className="survey-grid__loading-icon">◇</span>
            <span>Loading references...</span>
          </div>
        ) : inspectedItems.length === 0 ? (
          <div className="survey-grid__empty">
            <span className="survey-grid__empty-icon">◇</span>
            <span className="survey-grid__empty-text">No items yet</span>
            <span className="survey-grid__empty-hint">Upload images to get started</span>
          </div>
        ) : (
          <>
            <div className="survey-grid__header">
              <span className="survey-grid__header-title">All Items</span>
              <span className="survey-grid__header-count">
                {inspectedItems.length} item{inspectedItems.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="survey-grid__masonry">
              {inspectedItems.map((item) => (
                <GridItem key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── DETAIL VIEW OVERLAY (Pop-up) ─── */}
      {selectedItem && (
        <div className="survey-detail-overlay">
          <div className="survey-detail-overlay__backdrop" onClick={handleCloseDetail} />
          <div
            className="survey-detail-overlay__focused-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="survey-detail-overlay__focused-content">
              <DetailView
                item={selectedItem}
                annotations={effectiveAnnotations}
                onAnnotationsChange={onAnnotationsChange}
                onResizingChange={onResizingChange}
                onClose={handleCloseDetail}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
