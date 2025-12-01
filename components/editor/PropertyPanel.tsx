"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useEditorStore,
  useSelectedSection,
  useSelectedElement,
  useIsEditMode,
} from "@/store/editor-store";
import { BackgroundPicker } from "./BackgroundPicker";
import { GRID_SIZES, type ElementType, type TextContent, type HeroContent, DEFAULT_SECTION_CONTENT } from "@/lib/types";

type PanelTab = "section" | "elements";

export function PropertyPanel() {
  const isEditMode = useIsEditMode();
  const selectedSection = useSelectedSection();
  const selectedElement = useSelectedElement();
  const [activeTab, setActiveTab] = useState<PanelTab>("section");
  const {
    updateSection,
    updateElement,
    addElement,
    selectedSectionId,
    gridSize,
    setGridSize,
    showGrid,
    toggleGrid,
  } = useEditorStore();

  if (!isEditMode) return null;

  const handleAddElement = (type: ElementType) => {
    if (!selectedSectionId) {
      alert("Please select a section first");
      return;
    }
    addElement(selectedSectionId, type);
  };

  return (
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: 0 }}
      className={cn(
        "fixed right-4 top-14 z-[60]",
        "w-60 max-h-[calc(100vh-70px)]",
        "bg-void/95 backdrop-blur-xl border border-dawn-08",
        "flex flex-col"
      )}
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-dawn-08">
        <button
          onClick={() => setActiveTab("section")}
          className={cn(
            "flex-1 px-3 py-2 font-mono text-2xs uppercase tracking-widest transition-colors",
            activeTab === "section"
              ? "text-gold border-b-2 border-gold bg-gold/5"
              : "text-dawn-50 hover:text-dawn"
          )}
        >
          ◇ Section
        </button>
        <button
          onClick={() => setActiveTab("elements")}
          className={cn(
            "flex-1 px-3 py-2 font-mono text-2xs uppercase tracking-widest transition-colors",
            activeTab === "elements"
              ? "text-gold border-b-2 border-gold bg-gold/5"
              : "text-dawn-50 hover:text-dawn"
          )}
        >
          ◆ Elements
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SECTION TAB - Background, dimensions, section-level settings    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "section" && (
          <div className="p-3">
            {selectedSection ? (
              <>
                <div className="font-mono text-2xs uppercase tracking-widest text-gold mb-3">
                  {selectedSection.type} Section
                </div>

                {/* Section dimensions */}
                <div className="mb-4">
                  <div className="font-mono text-2xs text-dawn-30 mb-1">
                    Min Height
                  </div>
                  <select
                    value={selectedSection.minHeight}
                    onChange={(e) =>
                      updateSection(selectedSection.id, { minHeight: e.target.value })
                    }
                    className={cn(
                      "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
                      "font-mono text-2xs text-dawn",
                      "focus:outline-none focus:border-gold"
                    )}
                  >
                    <option value="auto">Auto</option>
                    <option value="50vh">50vh</option>
                    <option value="75vh">75vh</option>
                    <option value="100vh">100vh</option>
                  </select>
                </div>

                {/* Background - the "stage" */}
                <div className="mb-4">
                  <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2">
                    Background
                  </div>
                  <p className="font-mono text-2xs text-dawn-30 mb-2 leading-relaxed">
                    The visual layer behind your content
                  </p>
                  <BackgroundPicker
                    background={selectedSection.background}
                    onChange={(background) =>
                      updateSection(selectedSection.id, { background })
                    }
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="font-mono text-2xs text-dawn-30 mb-2">
                  No section selected
                </div>
                <p className="font-mono text-2xs text-dawn-30/60">
                  Click a section to edit its background and settings
                </p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ELEMENTS TAB - Things placed ON the section                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "elements" && (
          <div className="p-3">
            {/* Add Elements */}
            <div className="mb-4">
              <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2">
                Add to Section
              </div>
              <p className="font-mono text-2xs text-dawn-30 mb-2 leading-relaxed">
                Content placed on top of the background
              </p>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => handleAddElement("text")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2",
                    "bg-surface-1 border border-dawn-08",
                    "font-mono text-2xs text-dawn-70",
                    "hover:border-gold hover:text-gold transition-colors",
                    !selectedSectionId && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!selectedSectionId}
                >
                  <span className="text-base">T</span>
                  <span>Text</span>
                </button>
                <button
                  onClick={() => handleAddElement("image")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2",
                    "bg-surface-1 border border-dawn-08",
                    "font-mono text-2xs text-dawn-70",
                    "hover:border-gold hover:text-gold transition-colors",
                    !selectedSectionId && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!selectedSectionId}
                >
                  <span className="text-base">▣</span>
                  <span>Image</span>
                </button>
                <button
                  onClick={() => handleAddElement("video")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2",
                    "bg-surface-1 border border-dawn-08",
                    "font-mono text-2xs text-dawn-70",
                    "hover:border-gold hover:text-gold transition-colors",
                    !selectedSectionId && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!selectedSectionId}
                >
                  <span className="text-base">▶</span>
                  <span>Video</span>
                </button>
              </div>
            </div>

            {/* Grid Settings */}
            <div className="mb-4 pt-3 border-t border-dawn-08">
              <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2">
                Grid Snap
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleGrid}
                  className={cn(
                    "px-2 py-1 border font-mono text-2xs transition-colors",
                    showGrid
                      ? "bg-gold text-void border-gold"
                      : "bg-surface-1 text-dawn-50 border-dawn-08"
                  )}
                >
                  {showGrid ? "ON" : "OFF"}
                </button>
                <div className="flex gap-0.5 flex-1">
                  {GRID_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={cn(
                        "flex-1 px-1 py-1",
                        "font-mono text-2xs",
                        "border transition-colors",
                        gridSize === size
                          ? "bg-gold/20 text-gold border-gold/30"
                          : "bg-surface-1 text-dawn-30 border-dawn-08"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Template Content (special case for template sections) */}
            {selectedSection?.type === "hero" && (
              <div className="mb-4 pt-3 border-t border-dawn-08">
                <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2">
                  Template Content
                </div>
                <p className="font-mono text-2xs text-dawn-30 mb-2 leading-relaxed">
                  Edit built-in Hero elements
                </p>
                <HeroContentControls
                  section={selectedSection}
                  onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                />
              </div>
            )}

            {/* Selected Element Properties */}
            {selectedElement && (
              <div className="pt-3 border-t border-dawn-08">
                <div className="font-mono text-2xs uppercase tracking-widest text-gold mb-3">
                  Selected: {selectedElement.type}
                </div>

                {/* Position */}
                <div className="mb-3">
                  <div className="font-mono text-2xs text-dawn-30 mb-1">Position</div>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          x: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="X"
                      className={cn(
                        "w-full px-2 py-1 bg-surface-1 border border-dawn-08",
                        "font-mono text-2xs text-dawn",
                        "focus:outline-none focus:border-gold"
                      )}
                    />
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          y: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Y"
                      className={cn(
                        "w-full px-2 py-1 bg-surface-1 border border-dawn-08",
                        "font-mono text-2xs text-dawn",
                        "focus:outline-none focus:border-gold"
                      )}
                    />
                  </div>
                </div>

                {/* Size */}
                <div className="mb-3">
                  <div className="font-mono text-2xs text-dawn-30 mb-1">Size</div>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="number"
                      value={selectedElement.width ?? ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          width: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder="W"
                      className={cn(
                        "w-full px-2 py-1 bg-surface-1 border border-dawn-08",
                        "font-mono text-2xs text-dawn placeholder:text-dawn-30",
                        "focus:outline-none focus:border-gold"
                      )}
                    />
                    <input
                      type="number"
                      value={selectedElement.height ?? ""}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          height: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder="H"
                      className={cn(
                        "w-full px-2 py-1 bg-surface-1 border border-dawn-08",
                        "font-mono text-2xs text-dawn placeholder:text-dawn-30",
                        "focus:outline-none focus:border-gold"
                      )}
                    />
                  </div>
                </div>

                {/* Text-specific */}
                {selectedElement.type === "text" && (
                  <TextElementControls
                    element={{ content: selectedElement.content as TextContent }}
                    onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Text element specific controls
function TextElementControls({
  element,
  onUpdate,
}: {
  element: { content: TextContent };
  onUpdate: (updates: { content: TextContent }) => void;
}) {
  const content = element.content;

  return (
    <>
      <div className="mb-2">
        <div className="font-mono text-2xs text-dawn-30 mb-1">Font</div>
        <div className="flex gap-1">
          <button
            onClick={() =>
              onUpdate({ content: { ...content, fontFamily: "sans" } })
            }
            className={cn(
              "flex-1 px-2 py-1 border font-sans text-2xs transition-colors",
              content.fontFamily === "sans"
                ? "bg-gold text-void border-gold"
                : "bg-surface-1 text-dawn-50 border-dawn-08"
            )}
          >
            Sans
          </button>
          <button
            onClick={() =>
              onUpdate({ content: { ...content, fontFamily: "mono" } })
            }
            className={cn(
              "flex-1 px-2 py-1 border font-mono text-2xs transition-colors",
              content.fontFamily === "mono"
                ? "bg-gold text-void border-gold"
                : "bg-surface-1 text-dawn-50 border-dawn-08"
            )}
          >
            Mono
          </button>
        </div>
      </div>
      <div>
        <div className="font-mono text-2xs text-dawn-30 mb-1">Align</div>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() =>
                onUpdate({ content: { ...content, textAlign: align } })
              }
              className={cn(
                "flex-1 px-2 py-1 border font-mono text-2xs transition-colors",
                content.textAlign === align
                  ? "bg-gold text-void border-gold"
                  : "bg-surface-1 text-dawn-50 border-dawn-08"
              )}
            >
              {align === "left" ? "←" : align === "center" ? "↔" : "→"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Hero section content controls
function HeroContentControls({
  section,
  onUpdate,
}: {
  section: { id: string; config: Record<string, unknown> };
  onUpdate: (updates: { config: Record<string, unknown> }) => void;
}) {
  const defaultContent = DEFAULT_SECTION_CONTENT.hero as HeroContent;
  const content: HeroContent = {
    ...defaultContent,
    ...(section.config as Partial<HeroContent>),
  };

  const updateContent = (updates: Partial<HeroContent>) => {
    onUpdate({ config: { ...content, ...updates } });
  };

  return (
    <div className="space-y-3">
      {/* Logo Type */}
      <div>
        <div className="font-mono text-2xs text-dawn-30 mb-1">Logo Type</div>
        <div className="flex gap-1">
          <button
            onClick={() => updateContent({ logoType: "text" })}
            className={cn(
              "flex-1 px-2 py-1.5 border font-mono text-2xs transition-colors",
              content.logoType === "text"
                ? "bg-gold text-void border-gold"
                : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
            )}
          >
            Text
          </button>
          <button
            onClick={() => updateContent({ logoType: "image" })}
            className={cn(
              "flex-1 px-2 py-1.5 border font-mono text-2xs transition-colors",
              content.logoType === "image"
                ? "bg-gold text-void border-gold"
                : "bg-surface-1 text-dawn-50 border-dawn-08 hover:border-dawn-15"
            )}
          >
            Image
          </button>
        </div>
      </div>

      {content.logoType === "image" && (
        <div className="space-y-1">
          <div className="font-mono text-2xs text-dawn-30">Image URL</div>
          <input
            type="text"
            value={content.logoImageUrl || ""}
            onChange={(e) => updateContent({ logoImageUrl: e.target.value })}
            placeholder="https://..."
            className={cn(
              "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
              "font-mono text-2xs text-dawn placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
        </div>
      )}

      {content.logoType === "text" && (
        <div className="space-y-1">
          <div className="font-mono text-2xs text-dawn-30">Logo Text</div>
          <input
            type="text"
            value={content.logoText || ""}
            onChange={(e) => updateContent({ logoText: e.target.value })}
            placeholder="THOUGHT + FORM"
            className={cn(
              "w-full px-2 py-1.5 bg-surface-1 border border-dawn-08",
              "font-mono text-2xs text-dawn placeholder:text-dawn-30",
              "focus:outline-none focus:border-gold"
            )}
          />
        </div>
      )}

      {/* Content alignment */}
      <div>
        <div className="font-mono text-2xs text-dawn-30 mb-1">Content Align</div>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => updateContent({ contentAlign: align })}
              className={cn(
                "flex-1 px-2 py-1 border font-mono text-2xs transition-colors",
                content.contentAlign === align
                  ? "bg-gold text-void border-gold"
                  : "bg-surface-1 text-dawn-50 border-dawn-08"
              )}
            >
              {align === "left" ? "←" : align === "center" ? "↔" : "→"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
