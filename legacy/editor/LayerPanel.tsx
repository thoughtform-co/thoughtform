"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useEditorStore,
  useSelectedSection,
  useSelectedElementIds,
  useIsEditMode,
} from "@/store/editor-store";
import type { Element, ElementType } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════
// LAYER PANEL
// Shows all elements in the selected section as a tree view
// ═══════════════════════════════════════════════════════════════════

// Element type icons
const ELEMENT_ICONS: Record<ElementType, string> = {
  text: "T",
  image: "▣",
  video: "▶",
  button: "◉",
  container: "⬜",
  divider: "—",
};

// Element type colors
const ELEMENT_COLORS: Record<ElementType, string> = {
  text: "text-blue-400",
  image: "text-green-400",
  video: "text-purple-400",
  button: "text-gold",
  container: "text-cyan-400",
  divider: "text-dawn-50",
};

interface LayerItemProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onToggleLock: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function LayerItem({
  element,
  isSelected,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onRename,
}: LayerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(element.name || element.type);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.locked) return;
    onSelect(element.id, e.shiftKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!element.locked) {
      setIsEditing(true);
    }
  };

  const handleNameSubmit = () => {
    setIsEditing(false);
    if (editName.trim()) {
      onRename(element.id, editName.trim());
    } else {
      setEditName(element.name || element.type);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(element.name || element.type);
    }
  };

  const displayName = element.name || `${element.type} ${element.zIndex}`;

  return (
    <Reorder.Item
      value={element}
      id={element.id}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 cursor-pointer",
        "border-b border-dawn-08 last:border-b-0",
        "transition-colors duration-100",
        isSelected && "bg-gold/10",
        !isSelected && "hover:bg-dawn-04",
        element.locked && "opacity-60",
        element.hidden && "opacity-40"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Element Icon */}
      <span className={cn("font-mono text-xs w-4", ELEMENT_COLORS[element.type])}>
        {ELEMENT_ICONS[element.type]}
      </span>

      {/* Name */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={handleKeyDown}
          autoFocus
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "font-mono text-2xs text-dawn",
            "ring-1 ring-gold px-1"
          )}
        />
      ) : (
        <span
          className={cn(
            "flex-1 font-mono text-2xs truncate",
            isSelected ? "text-gold" : "text-dawn-70"
          )}
        >
          {displayName}
        </span>
      )}

      {/* Status icons */}
      <div className="flex items-center gap-1">
        {/* Lock button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(element.id);
          }}
          className={cn(
            "p-0.5 rounded transition-colors",
            element.locked ? "text-gold hover:text-gold/80" : "text-dawn-30 hover:text-dawn-50"
          )}
          title={element.locked ? "Unlock" : "Lock"}
        >
          <span className="text-2xs">{element.locked ? "🔒" : "🔓"}</span>
        </button>

        {/* Visibility button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(element.id);
          }}
          className={cn(
            "p-0.5 rounded transition-colors",
            element.hidden ? "text-dawn-30 hover:text-dawn-50" : "text-dawn-50 hover:text-dawn-70"
          )}
          title={element.hidden ? "Show" : "Hide"}
        >
          <span className="text-2xs">{element.hidden ? "👁️‍🗨️" : "👁️"}</span>
        </button>
      </div>
    </Reorder.Item>
  );
}

export function LayerPanel() {
  const isEditMode = useIsEditMode();
  const selectedSection = useSelectedSection();
  const selectedElementIds = useSelectedElementIds();
  const [isExpanded, setIsExpanded] = useState(true);

  const { selectElement, addToSelection, toggleLock, toggleVisibility, updateElement } =
    useEditorStore();

  const handleSelect = useCallback(
    (id: string, addToSelectionFlag: boolean) => {
      if (addToSelectionFlag) {
        addToSelection(id);
      } else {
        selectElement(id);
      }
    },
    [selectElement, addToSelection]
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      updateElement(id, { name });
    },
    [updateElement]
  );

  const handleReorder = useCallback(
    (newOrder: Element[]) => {
      // Update z-index based on new order (reversed because higher z = front)
      const maxZ = newOrder.length;
      newOrder.forEach((element, index) => {
        const newZIndex = maxZ - index;
        if (element.zIndex !== newZIndex) {
          updateElement(element.id, { zIndex: newZIndex });
        }
      });
    },
    [updateElement]
  );

  if (!isEditMode) return null;

  // Get elements sorted by z-index (highest first = front)
  const elements = [...(selectedSection?.elements ?? [])].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={cn(
        "fixed left-4 top-14 z-[60]",
        "w-52 max-h-[calc(100vh-70px)]",
        "bg-void/95 backdrop-blur-xl border border-dawn-08",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between px-3 py-2",
          "border-b border-dawn-08",
          "hover:bg-dawn-04 transition-colors"
        )}
      >
        <span className="font-mono text-2xs uppercase tracking-widest text-gold">◇ Layers</span>
        <span className="text-dawn-50 text-xs">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            {selectedSection ? (
              elements.length > 0 ? (
                <div className="overflow-y-auto max-h-[400px]">
                  <Reorder.Group
                    axis="y"
                    values={elements}
                    onReorder={handleReorder}
                    className="divide-y divide-dawn-08"
                  >
                    {elements.map((element) => (
                      <LayerItem
                        key={element.id}
                        element={element}
                        isSelected={selectedElementIds.includes(element.id)}
                        onSelect={handleSelect}
                        onToggleLock={toggleLock}
                        onToggleVisibility={toggleVisibility}
                        onRename={handleRename}
                      />
                    ))}
                  </Reorder.Group>
                </div>
              ) : (
                <div className="p-3 text-center">
                  <p className="font-mono text-2xs text-dawn-30">No elements in section</p>
                  <p className="font-mono text-2xs text-dawn-30/60 mt-1">
                    Add elements from the panel
                  </p>
                </div>
              )
            ) : (
              <div className="p-3 text-center">
                <p className="font-mono text-2xs text-dawn-30">No section selected</p>
                <p className="font-mono text-2xs text-dawn-30/60 mt-1">
                  Click a section to view layers
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer with shortcuts hint */}
      {isExpanded && selectedSection && elements.length > 0 && (
        <div className="px-3 py-2 border-t border-dawn-08">
          <p className="font-mono text-2xs text-dawn-30/60">
            Drag to reorder • Double-click to rename
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default LayerPanel;
