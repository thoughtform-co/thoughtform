"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SurveyAnnotation } from "./types";

// ═══════════════════════════════════════════════════════════════
// ANNOTATION BOX - Resizable annotation with popover editing
// Styled to match ConfirmDialog aesthetic
// ═══════════════════════════════════════════════════════════════

export interface AnnotationBoxProps {
  annotation: SurveyAnnotation;
  index: number; // 1-based index for display
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete: () => void;
  onResize: (x: number, y: number, width: number, height: number) => void;
  onResizingChange?: (isResizing: boolean) => void;
  onNoteChange?: (note: string) => void;
  containerScale?: number; // For zoom support
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
  index,
  isSelected = false,
  onSelect,
  onDelete,
  onResize,
  onResizingChange,
  onNoteChange,
  containerScale = 1,
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
  const [isHovered, setIsHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(annotation.note || "");
  const boxRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit note when annotation changes
  useEffect(() => {
    if (!isEditing) {
      setEditNote(annotation.note || "");
    }
  }, [annotation.note, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close popover on escape, save on enter
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false);
          setEditNote(annotation.note || "");
        } else {
          setIsPopoverOpen(false);
        }
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPopoverOpen, isEditing, annotation.note]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        boxRef.current &&
        !boxRef.current.contains(e.target as Node)
      ) {
        if (isEditing) {
          handleSave();
        }
        setIsPopoverOpen(false);
      }
    };

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen, isEditing]);

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

      // Use getBoundingClientRect for accurate dimensions under transforms
      const parentRect = parent.getBoundingClientRect();
      const effectiveWidth = parentRect.width / containerScale;
      const effectiveHeight = parentRect.height / containerScale;

      const deltaX = ((e.clientX - startPos.x) / effectiveWidth) * 100;
      const deltaY = ((e.clientY - startPos.y) / effectiveHeight) * 100;

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
  }, [isResizing, resizeHandle, startPos, startBounds, onResize, containerScale]);

  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPopoverOpen((prev) => !prev);
      if (!isPopoverOpen) {
        onSelect?.();
      }
    },
    [isPopoverOpen, onSelect]
  );

  const handleSave = useCallback(() => {
    onNoteChange?.(editNote);
    setIsEditing(false);
  }, [editNote, onNoteChange]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPopoverOpen(false);
      onDelete();
    },
    [onDelete]
  );

  const handleTextClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  return (
    <>
      <div
        ref={boxRef}
        className={`survey-canvas__annotation ${isSelected ? "survey-canvas__annotation--selected" : ""}`}
        style={{
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          width: `${annotation.width}%`,
          height: `${annotation.height}%`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
      </div>

      {/* Number badge - outside the annotation box, top-right */}
      <button
        className={`survey-canvas__annotation-number ${isPopoverOpen || isSelected ? "survey-canvas__annotation-number--active" : ""} ${isHovered ? "survey-canvas__annotation-number--visible" : ""}`}
        style={{
          left: `calc(${annotation.x + annotation.width}% + 4px)`,
          top: `calc(${annotation.y}% - 12px)`,
        }}
        onClick={handleBadgeClick}
        title={`Annotation #${index}`}
      >
        {index}
      </button>

      {/* Popover - styled like ConfirmDialog */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="annotation-popover"
          style={{
            left: `calc(${annotation.x + annotation.width}% + 8px)`,
            top: `${annotation.y}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="annotation-popover__header">
            <span className="annotation-popover__title">Annotation #{index}</span>
            {isEditing ? (
              <button
                className="annotation-popover__action-btn annotation-popover__action-btn--save"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                title="Save"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M11.5 3.5L5.5 9.5L2.5 6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Save
              </button>
            ) : (
              <button
                className="annotation-popover__action-btn annotation-popover__action-btn--delete"
                onClick={handleDelete}
                title="Delete annotation"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 3.5H11.5M5 3.5V2.5C5 2 5.5 1.5 6 1.5H8C8.5 1.5 9 2 9 2.5V3.5M5.5 6V10M8.5 6V10M3.5 3.5L4 11.5C4 12 4.5 12.5 5 12.5H9C9.5 12.5 10 12 10 11.5L10.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Delete
              </button>
            )}
          </div>
          <div className="annotation-popover__content">
            {isEditing ? (
              <textarea
                ref={inputRef}
                className="annotation-popover__input"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                placeholder="Add a note about this area..."
                rows={3}
              />
            ) : (
              <div className="annotation-popover__text" onClick={handleTextClick}>
                {annotation.note || (
                  <span className="annotation-popover__placeholder">Click to add note...</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
