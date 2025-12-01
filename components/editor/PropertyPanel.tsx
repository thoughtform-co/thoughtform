"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore, useSelectedSection, useSelectedElement, useIsEditMode } from "@/store/editor-store";
import { BackgroundPicker } from "./BackgroundPicker";
import type { TextContent, BackgroundConfig } from "@/lib/types";

export function PropertyPanel() {
  const isEditMode = useIsEditMode();
  const selectedSection = useSelectedSection();
  const selectedElement = useSelectedElement();
  const { updateSection, updateElement } = useEditorStore();

  if (!isEditMode) return null;

  // Show element properties if an element is selected
  if (selectedElement) {
    const content = selectedElement.content as TextContent;

    return (
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed right-4 top-[180px] z-[60]",
          "w-64 max-h-[calc(100vh-200px)]",
          "bg-void/95 backdrop-blur-xl border border-dawn-08",
          "overflow-y-auto"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-dawn-08">
          <div className="font-mono text-2xs uppercase tracking-widest text-gold">
            Element: {selectedElement.type}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Position */}
          <div>
            <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
              Position
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-2xs text-dawn-50 mb-1 block">X</label>
                <input
                  type="number"
                  value={selectedElement.x}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })
                  }
                  className={cn(
                    "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn",
                    "focus:outline-none focus:border-gold"
                  )}
                />
              </div>
              <div>
                <label className="font-mono text-2xs text-dawn-50 mb-1 block">Y</label>
                <input
                  type="number"
                  value={selectedElement.y}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })
                  }
                  className={cn(
                    "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn",
                    "focus:outline-none focus:border-gold"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
              Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-2xs text-dawn-50 mb-1 block">Width</label>
                <input
                  type="number"
                  value={selectedElement.width ?? ""}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { width: parseInt(e.target.value) || null })
                  }
                  placeholder="auto"
                  className={cn(
                    "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn",
                    "placeholder:text-dawn-30",
                    "focus:outline-none focus:border-gold"
                  )}
                />
              </div>
              <div>
                <label className="font-mono text-2xs text-dawn-50 mb-1 block">Height</label>
                <input
                  type="number"
                  value={selectedElement.height ?? ""}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { height: parseInt(e.target.value) || null })
                  }
                  placeholder="auto"
                  className={cn(
                    "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn",
                    "placeholder:text-dawn-30",
                    "focus:outline-none focus:border-gold"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Text-specific properties */}
          {selectedElement.type === "text" && (
            <>
              <div>
                <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
                  Font Size
                </label>
                <input
                  type="number"
                  value={content.fontSize || 16}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      content: { ...content, fontSize: parseInt(e.target.value) || 16 },
                    })
                  }
                  className={cn(
                    "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                    "font-mono text-xs text-dawn",
                    "focus:outline-none focus:border-gold"
                  )}
                />
              </div>

              <div>
                <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
                  Font Family
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        content: { ...content, fontFamily: "sans" },
                      })
                    }
                    className={cn(
                      "flex-1 px-3 py-1.5 border font-sans text-xs transition-colors",
                      content.fontFamily === "sans"
                        ? "bg-gold text-void border-gold"
                        : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
                    )}
                  >
                    Sans
                  </button>
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        content: { ...content, fontFamily: "mono" },
                      })
                    }
                    className={cn(
                      "flex-1 px-3 py-1.5 border font-mono text-xs transition-colors",
                      content.fontFamily === "mono"
                        ? "bg-gold text-void border-gold"
                        : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
                    )}
                  >
                    Mono
                  </button>
                </div>
              </div>

              <div>
                <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
                  Text Align
                </label>
                <div className="flex gap-2">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          content: { ...content, textAlign: align },
                        })
                      }
                      className={cn(
                        "flex-1 px-3 py-1.5 border font-mono text-xs transition-colors capitalize",
                        content.textAlign === align
                          ? "bg-gold text-void border-gold"
                          : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
                      )}
                    >
                      {align[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Z-Index */}
          <div>
            <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
              Layer (Z-Index)
            </label>
            <input
              type="number"
              value={selectedElement.zIndex}
              onChange={(e) =>
                updateElement(selectedElement.id, { zIndex: parseInt(e.target.value) || 0 })
              }
              className={cn(
                "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                "font-mono text-xs text-dawn",
                "focus:outline-none focus:border-gold"
              )}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Show section properties if a section is selected
  if (selectedSection) {
    return (
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed right-4 top-[180px] z-[60]",
          "w-64 max-h-[calc(100vh-200px)]",
          "bg-void/95 backdrop-blur-xl border border-dawn-08",
          "overflow-y-auto"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-dawn-08">
          <div className="font-mono text-2xs uppercase tracking-widest text-gold">
            Section: {selectedSection.type}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Min Height */}
          <div>
            <label className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2 block">
              Min Height
            </label>
            <select
              value={selectedSection.minHeight}
              onChange={(e) =>
                updateSection(selectedSection.id, { minHeight: e.target.value })
              }
              className={cn(
                "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                "font-mono text-xs text-dawn",
                "focus:outline-none focus:border-gold"
              )}
            >
              <option value="auto">Auto</option>
              <option value="50vh">50vh</option>
              <option value="75vh">75vh</option>
              <option value="100vh">100vh</option>
            </select>
          </div>

          {/* Background */}
          <BackgroundPicker
            background={selectedSection.background}
            onChange={(background) =>
              updateSection(selectedSection.id, { background })
            }
          />
        </div>
      </motion.div>
    );
  }

  return null;
}

