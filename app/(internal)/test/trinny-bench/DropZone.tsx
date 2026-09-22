"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

/**
 * Drop, paste or pick an image. The handlers are the astrogation upload
 * modal's, lifted (`SurveyUploadModal.tsx`): preventDefault + stopPropagation
 * on every drag event, an `active` flag for the outline, and a
 * document-level paste that rebuilds a FileList through DataTransfer.
 *
 * ⚠ SPLIT IN THREE (ADR-120 Update 1). Two targets take a drop — the input
 * cell's drop area and the empty candidate slot — so the drag rules are a
 * hook both share, and the paste listener is owned ONCE by the module: a
 * listener per target would stage one paste twice.
 */

function firstImage(files: FileList | null | undefined): File | null {
  if (!files || files.length === 0) return null;
  const f = files[0];
  return ACCEPT.includes(f.type) ? f : null;
}

export function useDropTarget(onFile: (file: File) => void, disabled: boolean) {
  const [active, setActive] = useState(false);
  const over = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setActive(true);
  };
  const leave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    if (disabled) return;
    const f = firstImage(e.dataTransfer.files);
    if (f) onFile(f);
  };
  return {
    active: active && !disabled,
    bind: { onDragOver: over, onDragEnter: over, onDragLeave: leave, onDrop: drop },
  };
}

export function usePasteImage(onFile: (file: File) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.kind === "file" && ACCEPT.includes(it.type)) {
          const f = it.getAsFile();
          if (f) {
            const dt = new DataTransfer();
            dt.items.add(f);
            const g = firstImage(dt.files);
            if (g) onFile(g);
          }
          break;
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [onFile, enabled]);
}

export function DropZone({
  onFile,
  disabled,
  staged,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  staged?: { name: string } | null;
}) {
  const { active, bind } = useDropTarget(onFile, !!disabled);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className="tb-drop"
      data-active={active ? "1" : undefined}
      data-disabled={disabled ? "1" : undefined}
      data-staged={staged ? "1" : undefined}
      {...bind}
      onClick={() => !disabled && input.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          input.current?.click();
        }
      }}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        hidden
        onChange={(e) => {
          const f = firstImage(e.target.files);
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
      <span className="tb-drop__lead">
        {staged ? staged.name : "Drop an image, paste it, or choose a file"}
      </span>
      <span className="tb-drop__hint">
        {staged ? "Drop or choose another to replace it" : "PNG, JPEG or WebP"}
      </span>
    </div>
  );
}
