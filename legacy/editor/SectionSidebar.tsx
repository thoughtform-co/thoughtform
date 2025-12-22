"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore, useSections, useIsEditMode } from "@/store/editor-store";
import { SectionToolbar } from "./SectionToolbar";
import { SECTION_TEMPLATES } from "@/lib/types";

export function SectionSidebar() {
  const isEditMode = useIsEditMode();
  const sections = useSections();
  const { selectedSectionId, setSelectedSection, reorderSections } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isEditMode) return null;

  const handleReorder = (newOrder: typeof sections) => {
    // Find the moved item and update order
    const fromIndex = sections.findIndex((s, i) => s.id !== newOrder[i]?.id);
    const toIndex = newOrder.findIndex((s) => s.id === sections[fromIndex]?.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSections(fromIndex, toIndex);
    }
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={cn(
        "fixed left-4 top-20 z-[60]",
        "w-64 max-h-[calc(100vh-120px)]",
        "bg-void/95 backdrop-blur-xl border border-dawn-08",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dawn-08">
        <div className="font-mono text-2xs uppercase tracking-widest text-gold">Sections</div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="font-mono text-xs text-dawn-30 hover:text-dawn transition-colors"
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      {/* Section List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="p-2">
              {sections.map((section, index) => {
                const template = SECTION_TEMPLATES.find((t) => t.type === section.type);
                const isSelected = selectedSectionId === section.id;

                return (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 mb-1",
                      "cursor-grab active:cursor-grabbing",
                      "border transition-colors",
                      isSelected
                        ? "bg-gold/10 border-gold/30"
                        : "bg-transparent border-transparent hover:bg-surface-1 hover:border-dawn-08"
                    )}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    {/* Drag handle */}
                    <div className="flex flex-col gap-0.5 opacity-30">
                      <div className="w-2 h-0.5 bg-dawn" />
                      <div className="w-2 h-0.5 bg-dawn" />
                      <div className="w-2 h-0.5 bg-dawn" />
                    </div>

                    {/* Section info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-mono text-xs">{template?.icon || "?"}</span>
                        <span className="font-mono text-xs text-dawn truncate">
                          {template?.label || section.type}
                        </span>
                      </div>
                    </div>

                    {/* Order index */}
                    <span className="font-mono text-2xs text-dawn-30">{index + 1}</span>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {/* Add Section Button */}
            <div className="p-2 border-t border-dawn-08">
              <SectionToolbar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
