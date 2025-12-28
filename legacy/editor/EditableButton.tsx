"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useEditorStore } from "@/store/editor-store";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ButtonConfig } from "@/lib/types";

interface EditableButtonProps {
  config: ButtonConfig;
  onChange: (config: ButtonConfig) => void;
  className?: string;
}

export function EditableButton({ config, onChange, className }: EditableButtonProps) {
  const { isEditMode } = useEditorStore();
  const [showModal, setShowModal] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  // Sync with external config
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };

  const handleSave = () => {
    onChange(localConfig);
    setShowModal(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setLocalConfig(config);
      setShowModal(false);
    }
  };

  return (
    <>
      <div
        className={cn("inline-block", isEditMode && "cursor-pointer relative")}
        onClick={handleClick}
      >
        <Button
          variant={config.variant}
          className={cn(
            className,
            isEditMode &&
              "hover:ring-2 hover:ring-gold/30 hover:ring-offset-2 hover:ring-offset-void"
          )}
        >
          {config.text}
        </Button>
        {isEditMode && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full flex items-center justify-center">
            <span className="text-[8px] text-void">✎</span>
          </div>
        )}
      </div>

      {/* Button Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-surface-900 border border-surface-700 rounded-lg p-6 w-[350px] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-dawn font-mono text-sm uppercase tracking-widest">Edit Button</h3>

            {/* Button Text */}
            <div className="space-y-2">
              <label className="text-dawn/60 text-xs font-mono">Button Text</label>
              <input
                type="text"
                value={localConfig.text}
                onChange={(e) => setLocalConfig({ ...localConfig, text: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full bg-void border border-surface-600 rounded px-3 py-2 text-dawn text-sm focus:border-gold outline-none"
                autoFocus
              />
            </div>

            {/* Link URL */}
            <div className="space-y-2">
              <label className="text-dawn/60 text-xs font-mono">Link URL</label>
              <input
                type="text"
                value={localConfig.href}
                onChange={(e) => setLocalConfig({ ...localConfig, href: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="#section or https://..."
                className="w-full bg-void border border-surface-600 rounded px-3 py-2 text-dawn text-sm focus:border-gold outline-none"
              />
            </div>

            {/* Variant */}
            <div className="space-y-2">
              <label className="text-dawn/60 text-xs font-mono">Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalConfig({ ...localConfig, variant: "ghost" })}
                  className={cn(
                    "flex-1 py-2 rounded font-mono text-xs border transition-all",
                    localConfig.variant === "ghost"
                      ? "border-gold text-gold bg-gold/10"
                      : "border-surface-600 text-dawn/60 hover:border-surface-500"
                  )}
                >
                  Ghost
                </button>
                <button
                  onClick={() => setLocalConfig({ ...localConfig, variant: "solid" })}
                  className={cn(
                    "flex-1 py-2 rounded font-mono text-xs border transition-all",
                    localConfig.variant === "solid"
                      ? "border-gold text-gold bg-gold/10"
                      : "border-surface-600 text-dawn/60 hover:border-surface-500"
                  )}
                >
                  Solid
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-surface-700">
              <label className="text-dawn/60 text-xs font-mono mb-2 block">Preview</label>
              <div className="bg-void p-4 rounded flex items-center justify-center">
                <Button variant={localConfig.variant}>{localConfig.text || "BUTTON"}</Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 text-dawn/60 py-2 font-mono text-xs border border-surface-600 rounded hover:border-surface-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-gold text-void py-2 rounded font-mono text-xs hover:bg-gold/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
