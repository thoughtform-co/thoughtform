"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

/**
 * Drop, paste or pick an image. The handlers are the astrogation upload
 * modal's, lifted (`SurveyUploadModal.tsx`): preventDefault + stopPropagation
 * on every drag event, a `dragActive` state for the outline, and a
 * document-level paste that rebuilds a FileList through DataTransfer.
 */
export function DropZone({
  onFile,
  disabled,
  hint,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [active, setActive] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const take = useCallback(
    (files: FileList | null) => {
      if (disabled || !files || files.length === 0) return;
      const f = files[0];
      if (!ACCEPT.includes(f.type)) return;
      onFile(f);
    },
    [disabled, onFile]
  );

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
    take(e.dataTransfer.files);
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.kind === "file" && ACCEPT.includes(it.type)) {
          const f = it.getAsFile();
          if (f) {
            const dt = new DataTransfer();
            dt.items.add(f);
            take(dt.files);
          }
          break;
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [take]);

  return (
    <div
      className="tb-drop"
      data-active={active ? "1" : undefined}
      data-disabled={disabled ? "1" : undefined}
      onDragOver={over}
      onDragEnter={over}
      onDragLeave={leave}
      onDrop={drop}
      onClick={() => !disabled && input.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) input.current?.click();
      }}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        onChange={(e) => take(e.target.files)}
        style={{ display: "none" }}
      />
      <span className="tb-drop__lead">Or drop an image here to check it</span>
      <span className="tb-drop__hint">{hint ?? "PNG, JPEG or WebP · paste works too"}</span>
    </div>
  );
}
