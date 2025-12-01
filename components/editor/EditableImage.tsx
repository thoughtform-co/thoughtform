"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface EditableImageProps {
  src: string | null;
  alt: string;
  onChange: (src: string) => void;
  className?: string;
  width?: number;
  height?: number;
  fallbackText?: string;
}

export function EditableImage({
  src,
  alt,
  onChange,
  className,
  width = 200,
  height = 60,
  fallbackText = "LOGO",
}: EditableImageProps) {
  const { isEditMode } = useEditorStore();
  const [showModal, setShowModal] = useState(false);
  const [urlInput, setUrlInput] = useState(src || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (isEditMode) {
      setShowModal(true);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
    setShowModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, create a local object URL
      // In production, this would upload to Supabase Storage
      const url = URL.createObjectURL(file);
      onChange(url);
      setShowModal(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative inline-flex items-center justify-center",
          isEditMode && "cursor-pointer hover:outline hover:outline-2 hover:outline-gold/30 hover:outline-offset-2 rounded transition-all",
          className
        )}
        onClick={handleClick}
        style={{ minWidth: width, minHeight: height }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="object-contain"
            unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
          />
        ) : (
          <span className="text-dawn/50 text-sm font-mono">
            {isEditMode ? "Click to add image" : fallbackText}
          </span>
        )}
        
        {isEditMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-void/50 opacity-0 hover:opacity-100 transition-opacity rounded">
            <span className="text-gold text-xs font-mono">Click to edit</span>
          </div>
        )}
      </div>

      {/* Image Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-surface-900 border border-surface-700 rounded-lg p-6 w-[400px] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-dawn font-mono text-sm uppercase tracking-widest">
              Edit Image
            </h3>

            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-dawn/60 text-xs font-mono">Image URL</label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/logo.svg"
                className="w-full bg-void border border-surface-600 rounded px-3 py-2 text-dawn text-sm focus:border-gold outline-none"
              />
              <button
                onClick={handleUrlSubmit}
                className="w-full bg-gold text-void py-2 rounded font-mono text-sm hover:bg-gold/90 transition-colors"
              >
                Apply URL
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-600" />
              <span className="text-dawn/40 text-xs">or</span>
              <div className="flex-1 h-px bg-surface-600" />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.svg"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-surface-600 text-dawn py-2 rounded font-mono text-sm hover:border-gold hover:text-gold transition-colors"
              >
                Upload File
              </button>
            </div>

            {/* Preview & Remove */}
            {src && (
              <div className="pt-4 border-t border-surface-700">
                <label className="text-dawn/60 text-xs font-mono mb-2 block">Current Image</label>
                <div className="bg-void p-4 rounded flex items-center justify-center mb-3">
                  <Image
                    src={src}
                    alt={alt}
                    width={150}
                    height={45}
                    className="object-contain"
                    unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
                  />
                </div>
                <button
                  onClick={() => {
                    onChange("");
                    setUrlInput("");
                    setShowModal(false);
                  }}
                  className="w-full border border-red-500/50 text-red-400 py-2 rounded font-mono text-sm hover:border-red-400 hover:text-red-300 transition-colors"
                >
                  Remove Image
                </button>
              </div>
            )}

            {/* Cancel */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full text-dawn/60 py-2 font-mono text-xs hover:text-dawn transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

