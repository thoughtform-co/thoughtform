"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Network, Eye, EyeOff } from "lucide-react";
import type { SurveyItem, SurveyAnnotation } from "./types";
import { AnnotationBox } from "./AnnotationBox";

// ═══════════════════════════════════════════════════════════════
// SURVEY VIEW - Pinterest-style grid with detail overlay
// ═══════════════════════════════════════════════════════════════

export interface SurveyViewProps {
  items: SurveyItem[];
  selectedItemId: string | null;
  selectedAnnotationId?: string | null;
  loading: boolean;
  searchQuery?: string;
  isSearching?: boolean;
  onSelectItem?: (id: string | null) => void;
  onUpload?: (file: File) => Promise<void>;
  onSearchQueryChange?: (query: string) => void;
  onSearch?: (query: string) => Promise<void>;
  onAnnotationsChange?: (annotations: SurveyAnnotation[]) => void;
  onAnnotationSelect?: (annotationId: string | null) => void;
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
  selectedAnnotationId?: string | null;
  onAnnotationsChange?: (annotations: SurveyAnnotation[]) => void;
  onAnnotationSelect?: (annotationId: string | null) => void;
  onResizingChange?: (isResizing: boolean) => void;
  onClose: () => void;
}

function DetailView({
  item,
  annotations,
  selectedAnnotationId,
  onAnnotationsChange,
  onAnnotationSelect,
  onResizingChange,
  onClose,
}: DetailViewProps) {
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [localAnnotations, setLocalAnnotations] = useState<SurveyAnnotation[]>(annotations);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAnyAnnotationResizing, setIsAnyAnnotationResizing] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [zoom, setZoom] = useState(1);

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
    // Use getBoundingClientRect for accurate dimensions under zoom
    const rect = img.getBoundingClientRect();
    return {
      x: (pixelX / rect.width) * 100,
      y: (pixelY / rect.height) * 100,
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

    const img = imageRef.current;
    if (!img) {
      setDrawing(null);
      return;
    }

    const rect = img.getBoundingClientRect();
    const { startX, startY, currentX, currentY } = drawing;
    const minX = Math.min(startX, currentX);
    const minY = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Minimum size threshold (in rendered pixels)
    const minSize = 20;
    if (width > minSize && height > minSize) {
      // Convert to percentages using actual rendered size
      const percentX = (minX / rect.width) * 100;
      const percentY = (minY / rect.height) * 100;
      const percentWidth = (width / rect.width) * 100;
      const percentHeight = (height / rect.height) * 100;

      const newAnnotation: SurveyAnnotation = {
        id: crypto.randomUUID(),
        x: percentX,
        y: percentY,
        width: percentWidth,
        height: percentHeight,
        note: "",
        created_at: new Date().toISOString(),
      };

      const updatedAnnotations = [...localAnnotations, newAnnotation];
      setLocalAnnotations(updatedAnnotations);
      onAnnotationsChange(updatedAnnotations);
    }

    setDrawing(null);
  }, [drawing, onAnnotationsChange, localAnnotations]);

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
    // Convert drawing coordinates to percentages for display
    const img = imageRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return {
      left: (Math.min(startX, currentX) / rect.width) * 100,
      top: (Math.min(startY, currentY) / rect.height) * 100,
      width: (Math.abs(currentX - startX) / rect.width) * 100,
      height: (Math.abs(currentY - startY) / rect.height) * 100,
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

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  }, []);

  // Calculate aspect ratio for responsive sizing
  const aspectRatio = useMemo(() => {
    if (item.image_width && item.image_height) {
      return item.image_width / item.image_height;
    }
    return 16 / 9; // Default aspect ratio
  }, [item.image_width, item.image_height]);

  // Handle annotation note change
  const handleAnnotationNoteChange = useCallback(
    (annotationId: string, note: string) => {
      const updatedAnnotations = localAnnotations.map((a) =>
        a.id === annotationId ? { ...a, note } : a
      );
      setLocalAnnotations(updatedAnnotations);
      onAnnotationsChange?.(updatedAnnotations);
    },
    [localAnnotations, onAnnotationsChange]
  );

  return (
    <div className="survey-detail-focused">
      {/* Label on top */}
      <span className="survey-detail-focused__label">
        {(item.title || "Untitled").toUpperCase()}
      </span>

      {/* Top toolbar */}
      <div className="survey-detail-focused__toolbar">
        <button
          className={`survey-detail-focused__toolbar-btn ${showAnnotations ? "survey-detail-focused__toolbar-btn--active" : ""}`}
          onClick={() => setShowAnnotations((prev) => !prev)}
          title={showAnnotations ? "Hide annotations" : "Show annotations"}
        >
          {showAnnotations ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        {zoom !== 1 && (
          <span className="survey-detail-focused__zoom-indicator">{Math.round(zoom * 100)}%</span>
        )}
      </div>

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
          onWheel={handleWheel}
        >
          <div
            ref={imageContainerRef}
            className="survey-detail-focused__image-container"
            style={{
              aspectRatio: aspectRatio.toString(),
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
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
            {showAnnotations &&
              localAnnotations.map((annotation, idx) => (
                <AnnotationBox
                  key={annotation.id}
                  annotation={annotation}
                  index={idx + 1}
                  isSelected={selectedAnnotationId === annotation.id}
                  onSelect={() => onAnnotationSelect?.(annotation.id)}
                  onDelete={() => {
                    const updatedAnnotations = localAnnotations.filter(
                      (a) => a.id !== annotation.id
                    );
                    setLocalAnnotations(updatedAnnotations);
                    onAnnotationsChange?.(updatedAnnotations);
                    // Clear selection if deleted annotation was selected
                    if (selectedAnnotationId === annotation.id) {
                      onAnnotationSelect?.(null);
                    }
                  }}
                  onResize={(x, y, width, height) => {
                    const updatedAnnotations = localAnnotations.map((a) =>
                      a.id === annotation.id ? { ...a, x, y, width, height } : a
                    );
                    setLocalAnnotations(updatedAnnotations);
                    debouncedSave(updatedAnnotations);
                  }}
                  onResizingChange={setIsAnyAnnotationResizing}
                  onNoteChange={(note) => handleAnnotationNoteChange(annotation.id, note)}
                  containerScale={zoom}
                />
              ))}

            {/* Drawing preview */}
            {drawingRect && showAnnotations && (
              <div
                className="survey-canvas__drawing"
                style={{
                  left: `${drawingRect.left}%`,
                  top: `${drawingRect.top}%`,
                  width: `${drawingRect.width}%`,
                  height: `${drawingRect.height}%`,
                }}
              />
            )}
          </div>

          {/* Annotation hint */}
          <div className="survey-detail-focused__hint">
            Drag to annotate · Scroll to zoom · Esc to close
          </div>
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
  selectedAnnotationId,
  loading,
  onSelectItem,
  onUpload,
  onAnnotationsChange,
  onAnnotationSelect,
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
                selectedAnnotationId={selectedAnnotationId}
                onAnnotationsChange={onAnnotationsChange}
                onAnnotationSelect={onAnnotationSelect}
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
