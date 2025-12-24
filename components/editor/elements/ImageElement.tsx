"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import type { Element, ImageContent } from "@/lib/types";

interface ImageElementProps {
  element: Element;
  isEditing: boolean;
}

export function ImageElement({ element, isEditing }: ImageElementProps) {
  const isEditMode = useIsEditMode();
  const { updateElement } = useEditorStore();
  const content = element.content as ImageContent;
  const [inputValue, setInputValue] = useState(content.src);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleUrlSubmit = () => {
    const newContent: ImageContent = {
      ...content,
      src: inputValue,
    };
    updateElement(element.id, { content: newContent });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUrlSubmit();
    }
  };

  // Show placeholder if no image
  if (!content.src) {
    return (
      <div
        className={cn(
          "w-full h-full min-h-[100px] bg-surface-1 border border-dawn-08",
          "flex flex-col items-center justify-center gap-3"
        )}
      >
        <div className="font-mono text-2xs uppercase tracking-wider text-dawn-30">Image</div>
        {isEditing && (
          <div className="flex flex-col gap-2 w-full max-w-[240px] px-4">
            <input
              type="text"
              value={inputValue}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              onBlur={handleUrlSubmit}
              placeholder="Enter image URL..."
              className={cn(
                "w-full px-3 py-2 bg-void border border-dawn-15",
                "font-mono text-xs text-dawn",
                "placeholder:text-dawn-30",
                "focus:outline-none focus:border-gold"
              )}
            />
            <button
              onClick={handleUrlSubmit}
              className={cn(
                "px-3 py-1.5 bg-gold text-void",
                "font-mono text-2xs uppercase tracking-wider",
                "hover:bg-gold-70 transition-colors"
              )}
            >
              Set Image
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic user-provided URLs, can't pre-configure domains */}
      <img
        src={content.src}
        alt={content.alt || ""}
        className="w-full h-full"
        style={{
          objectFit: content.objectFit || "cover",
        }}
      />

      {/* Edit overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-void/80 flex flex-col items-center justify-center gap-3 p-4">
          <input
            type="text"
            value={inputValue}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            onBlur={handleUrlSubmit}
            placeholder="Enter image URL..."
            className={cn(
              "w-full max-w-[240px] px-3 py-2 bg-void border border-dawn-15",
              "font-mono text-xs text-dawn",
              "placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
          <input
            type="text"
            value={content.alt}
            onChange={(e) => {
              const newContent: ImageContent = {
                ...content,
                alt: e.target.value,
              };
              updateElement(element.id, { content: newContent });
            }}
            placeholder="Alt text..."
            className={cn(
              "w-full max-w-[240px] px-3 py-2 bg-void border border-dawn-15",
              "font-mono text-xs text-dawn",
              "placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
        </div>
      )}
    </div>
  );
}
