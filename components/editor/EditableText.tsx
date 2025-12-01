"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export function EditableText({
  value,
  onChange,
  className,
  placeholder = "Click to edit...",
  multiline = false,
  as: Component = "div",
}: EditableTextProps) {
  const { isEditMode } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

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

  const handleStartEdit = () => {
    if (isEditMode) {
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

  // View mode (or not in edit mode)
  if (!isEditing || !isEditMode) {
    return (
      <Component
        className={cn(
          className,
          isEditMode && "cursor-text hover:outline hover:outline-2 hover:outline-gold/30 hover:outline-offset-2 rounded transition-all"
        )}
        onClick={handleStartEdit}
      >
        {value || (isEditMode ? placeholder : "")}
      </Component>
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

