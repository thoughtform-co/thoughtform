"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import type { Element, VideoContent } from "@/lib/types";

interface VideoElementProps {
  element: Element;
  isEditing: boolean;
}

// Extract video ID from YouTube/Vimeo URLs
function getEmbedUrl(src: string, type: VideoContent["type"]): string | null {
  if (!src) return null;

  if (type === "youtube") {
    // Handle various YouTube URL formats
    const match = src.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  if (type === "vimeo") {
    // Handle Vimeo URLs
    const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }

  // For direct URLs, return as-is
  return src;
}

export function VideoElement({ element, isEditing }: VideoElementProps) {
  const { updateElement } = useEditorStore();
  const content = element.content as VideoContent;
  const [inputValue, setInputValue] = useState(content.src);

  const embedUrl = useMemo(
    () => getEmbedUrl(content.src, content.type),
    [content.src, content.type]
  );

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleUrlSubmit = () => {
    // Auto-detect video type
    let type: VideoContent["type"] = "url";
    if (inputValue.includes("youtube.com") || inputValue.includes("youtu.be")) {
      type = "youtube";
    } else if (inputValue.includes("vimeo.com")) {
      type = "vimeo";
    }

    const newContent: VideoContent = {
      ...content,
      src: inputValue,
      type,
    };
    updateElement(element.id, { content: newContent });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUrlSubmit();
    }
  };

  // Show placeholder if no video
  if (!content.src || !embedUrl) {
    return (
      <div
        className={cn(
          "w-full h-full min-h-[200px] bg-surface-1 border border-dawn-08",
          "flex flex-col items-center justify-center gap-3"
        )}
      >
        <div className="font-mono text-2xs uppercase tracking-wider text-dawn-30">
          Video
        </div>
        {isEditing && (
          <div className="flex flex-col gap-2 w-full max-w-[280px] px-4">
            <input
              type="text"
              value={inputValue}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              onBlur={handleUrlSubmit}
              placeholder="YouTube, Vimeo, or direct URL..."
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
              Embed Video
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render embedded video
  const isEmbed = content.type === "youtube" || content.type === "vimeo";

  return (
    <div className="relative w-full h-full">
      {isEmbed ? (
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          src={embedUrl}
          className="w-full h-full object-cover"
          autoPlay={content.autoplay}
          loop={content.loop}
          muted={content.muted}
          controls
        />
      )}

      {/* Edit overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-void/80 flex flex-col items-center justify-center gap-3 p-4">
          <input
            type="text"
            value={inputValue}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            onBlur={handleUrlSubmit}
            placeholder="YouTube, Vimeo, or direct URL..."
            className={cn(
              "w-full max-w-[280px] px-3 py-2 bg-void border border-dawn-15",
              "font-mono text-xs text-dawn",
              "placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
          
          {/* Video options */}
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 font-mono text-2xs text-dawn-50">
              <input
                type="checkbox"
                checked={content.autoplay}
                onChange={(e) => {
                  updateElement(element.id, {
                    content: { ...content, autoplay: e.target.checked },
                  });
                }}
                className="accent-gold"
              />
              Autoplay
            </label>
            <label className="flex items-center gap-2 font-mono text-2xs text-dawn-50">
              <input
                type="checkbox"
                checked={content.loop}
                onChange={(e) => {
                  updateElement(element.id, {
                    content: { ...content, loop: e.target.checked },
                  });
                }}
                className="accent-gold"
              />
              Loop
            </label>
            <label className="flex items-center gap-2 font-mono text-2xs text-dawn-50">
              <input
                type="checkbox"
                checked={content.muted}
                onChange={(e) => {
                  updateElement(element.id, {
                    content: { ...content, muted: e.target.checked },
                  });
                }}
                className="accent-gold"
              />
              Muted
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

