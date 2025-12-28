"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  onDelete?: () => void; // Optional delete handler for removable text
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  canDelete?: boolean; // Whether this text can be deleted
}

export function EditableText({
  value,
  onChange,
  onDelete,
  className,
  placeholder = "Click to edit...",
  multiline = false,
  as: Component = "div",
  canDelete = false,
}: EditableTextProps) {
  const { isEditMode } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [showControls, setShowControls] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleFinishEdit();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  // View mode (or not in edit mode)
  if (!isEditing || !isEditMode) {
    return (
      <div
        ref={containerRef}
        className="relative inline-block"
        onMouseEnter={() => isEditMode && setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <Component
          className={cn(
            className,
            isEditMode &&
              "cursor-text hover:outline hover:outline-2 hover:outline-gold/30 hover:outline-offset-2 rounded transition-all"
          )}
          onClick={handleStartEdit}
        >
          {value || (isEditMode ? placeholder : "")}
        </Component>

        {/* Edit controls - show on hover in edit mode */}
        {isEditMode && showControls && (
          <div className="absolute -top-6 right-0 flex gap-1 z-50">
            {value && (
              <button
                onClick={handleClear}
                className="px-1.5 py-0.5 bg-void/90 border border-dawn-15 text-dawn-30 hover:text-dawn text-xs font-mono rounded transition-colors"
                title="Clear text"
              >
                ✕
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={handleDelete}
                className="px-1.5 py-0.5 bg-void/90 border border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400 text-xs font-mono rounded transition-colors"
                title="Delete"
              >
                🗑
              </button>
            )}
            <span className="px-1.5 py-0.5 bg-gold/20 border border-gold/30 text-gold text-xs font-mono rounded">
              ✎
            </span>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  const inputClassName = cn(
    "bg-transparent border-none outline-none w-full resize-none",
    "ring-2 ring-gold/50 rounded px-1 -mx-1",
    className
  );

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleFinishEdit}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        rows={Math.max(2, localValue.split("\n").length)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleFinishEdit}
      onKeyDown={handleKeyDown}
      className={inputClassName}
      placeholder={placeholder}
    />
  );
}
