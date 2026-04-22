"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CATEGORIES, getComponentsByCategory } from "../catalog";

// ═══════════════════════════════════════════════════════════════
// SURVEY UPLOAD MODAL - Styled like vault zoom-in
// ═══════════════════════════════════════════════════════════════

export interface SurveyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, categoryId: string | null, componentKey: string | null) => Promise<void>;
  selectedCategoryId: string | null;
  selectedComponentKey: string | null;
  isUploading?: boolean;
}

export function SurveyUploadModal({
  isOpen,
  onClose,
  onUpload,
  selectedCategoryId,
  selectedComponentKey,
  isUploading = false,
}: SurveyUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a PNG, JPEG, WebP, or GIF image.");
        return;
      }

      await onUpload(file, selectedCategoryId, selectedComponentKey);
      onClose();
    },
    [onUpload, selectedCategoryId, selectedComponentKey, onClose]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  // Handle Escape key and paste
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith("image/")) {
          const file = clipboardItems[i].getAsFile();
          if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            handleFileSelect(dt.files);
          }
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isOpen, onClose, handleFileSelect]);

  if (!isOpen) return null;

  return (
    <div
      className="survey-upload-modal"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="survey-upload-modal__backdrop" onClick={onClose} />
      <div className="survey-upload-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="survey-upload-modal__header">
          <h2 className="survey-upload-modal__title">Upload Reference</h2>
          <button className="survey-upload-modal__close" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        <div
          className={`survey-upload-modal__dropzone ${dragActive ? "survey-upload-modal__dropzone--active" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: "none" }}
          />

          {isUploading ? (
            <>
              <span className="survey-upload-modal__icon">◈</span>
              <span className="survey-upload-modal__text">Uploading...</span>
            </>
          ) : (
            <>
              <span className="survey-upload-modal__icon">⊕</span>
              <span className="survey-upload-modal__text">
                Drop image, paste, or click to upload
              </span>
              <span className="survey-upload-modal__hint">PNG, JPEG, WebP, GIF</span>
              <button
                className="survey-upload-modal__browse-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>
            </>
          )}
        </div>

        {(selectedCategoryId || selectedComponentKey) &&
          (() => {
            const category = selectedCategoryId
              ? CATEGORIES.find((c) => c.id === selectedCategoryId)
              : null;
            const component =
              selectedComponentKey && selectedCategoryId
                ? getComponentsByCategory(selectedCategoryId).find(
                    (c) => c.id === selectedComponentKey
                  )
                : null;

            return (
              <div className="survey-upload-modal__info">
                <span className="survey-upload-modal__info-label">Will be assigned to:</span>
                <span className="survey-upload-modal__info-value">
                  {component
                    ? `${category?.name || ""} → ${component.name}`
                    : category
                      ? category.name
                      : "All References"}
                </span>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
