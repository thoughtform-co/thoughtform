"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { SECTION_TEMPLATES, type SectionType } from "@/lib/types";

interface SectionToolbarProps {
  insertIndex?: number;
  onClose?: () => void;
}

export function SectionToolbar({ insertIndex, onClose }: SectionToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addSection, sections } = useEditorStore();

  const handleAddSection = (type: SectionType) => {
    addSection(type, insertIndex);
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="relative">
      {/* Add Section Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2",
          "bg-void border border-dawn-15",
          "font-mono text-2xs uppercase tracking-wider",
          "text-dawn-50 hover:text-dawn hover:border-dawn-30",
          "transition-colors"
        )}
      >
        <span className="text-gold">+</span>
        Add Section
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "absolute top-full left-0 mt-2 z-50",
                "w-72 max-h-[70vh] overflow-y-auto",
                "bg-surface-1 border border-dawn-08",
                "shadow-2xl"
              )}
            >
              <div className="p-2">
                <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 px-3 py-2">
                  Templates
                </div>
                {SECTION_TEMPLATES.filter((t) => t.isTemplate).map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleAddSection(template.type)}
                    className={cn(
                      "w-full text-left px-3 py-3",
                      "hover:bg-surface-2 transition-colors",
                      "border-b border-dawn-04 last:border-b-0"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gold font-mono">{template.icon}</span>
                      <div>
                        <div className="font-mono text-sm text-dawn">{template.label}</div>
                        <div className="text-xs text-dawn-50">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))}

                <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 px-3 py-2 mt-2 border-t border-dawn-08">
                  Custom
                </div>
                {SECTION_TEMPLATES.filter((t) => !t.isTemplate).map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleAddSection(template.type)}
                    className={cn(
                      "w-full text-left px-3 py-3",
                      "hover:bg-surface-2 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-teal font-mono">{template.icon}</span>
                      <div>
                        <div className="font-mono text-sm text-dawn">{template.label}</div>
                        <div className="text-xs text-dawn-50">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
