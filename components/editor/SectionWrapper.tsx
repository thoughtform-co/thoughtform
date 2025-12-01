"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import type { Section } from "@/lib/types";

// Template Section Components
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { ShiftSection } from "@/components/sections/ShiftSection";
import { ProofSection } from "@/components/sections/ProofSection";
import { TaglineSection } from "@/components/sections/TaglineSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { MusingsSection } from "@/components/sections/MusingsSection";
import { CTASection } from "@/components/sections/CTASection";
import { FreeformSection } from "@/components/sections/FreeformSection";

import dynamic from "next/dynamic";

// Background components
import { HeroCanvas } from "@/components/canvas/HeroCanvas";
import { AttractorCanvas } from "@/components/canvas/AttractorCanvas";
import { WaveCanvas } from "@/components/canvas/WaveCanvas";

// Dynamic import for Three.js to avoid SSR issues
const ThreeBackground = dynamic(
  () => import("@/components/canvas/ThreeBackground").then((mod) => mod.ThreeBackground),
  { ssr: false }
);

interface SectionWrapperProps {
  section: Section;
}

// Map section types to their components (freeform is handled separately)
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  hero: HeroSection,
  problem: ProblemSection,
  quote: QuoteSection,
  shift: ShiftSection,
  proof: ProofSection,
  tagline: TaglineSection,
  services: ServicesSection,
  about: AboutSection,
  musings: MusingsSection,
  cta: CTASection,
};

// Map canvas presets to components
const CANVAS_COMPONENTS: Record<string, React.ComponentType> = {
  torus: HeroCanvas,
  attractor: AttractorCanvas,
  wave: WaveCanvas,
};

export function SectionWrapper({ section }: SectionWrapperProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isEditMode = useIsEditMode();
  const { selectedSectionId, setSelectedSection, removeSection, reorderSections } = useEditorStore();
  
  const isSelected = selectedSectionId === section.id;
  const SectionComponent = SECTION_COMPONENTS[section.type];

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedSection(section.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this section?")) {
      removeSection(section.id);
    }
  };

  // Render custom background if configured
  const renderBackground = () => {
    if (!section.background) return null;

    const { 
      type, 
      canvasPreset, 
      threejsPreset,
      imageUrl, 
      imageOpacity = 0.5, 
      canvasOpacity = 0.5,
      threejsOpacity = 0.5,
    } = section.background;

    if (type === "canvas" && canvasPreset) {
      const CanvasComponent = CANVAS_COMPONENTS[canvasPreset];
      if (CanvasComponent) {
        return (
          <div className="absolute inset-0 z-0" style={{ opacity: canvasOpacity }}>
            <CanvasComponent />
          </div>
        );
      }
    }

    if (type === "threejs" && threejsPreset) {
      return (
        <ThreeBackground preset={threejsPreset} opacity={threejsOpacity} />
      );
    }

    if (type === "image" && imageUrl) {
      return (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
            opacity: imageOpacity,
          }}
        />
      );
    }

    return null;
  };

  if (!SectionComponent) {
    return (
      <div className="section-spacing bg-surface-1 text-center">
        <p className="text-dawn-50">Unknown section type: {section.type}</p>
      </div>
    );
  }

  return (
    <motion.div
      ref={sectionRef}
      className={cn(
        "relative",
        isEditMode && "cursor-pointer",
        isEditMode && isSelected && "ring-2 ring-gold ring-offset-2 ring-offset-void"
      )}
      onClick={handleClick}
      layout
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Custom background layer */}
      {renderBackground()}

      {/* Section content */}
      <div className="relative z-10">
        {section.type === "freeform" ? (
          <FreeformSection section={section} />
        ) : (
          <SectionComponent />
        )}
      </div>

      {/* Edit mode overlay */}
      {isEditMode && (
        <div
          className={cn(
            "absolute inset-0 z-20 pointer-events-none transition-colors",
            isSelected ? "bg-gold/5" : "hover:bg-dawn-04"
          )}
        />
      )}

      {/* Edit mode controls */}
      {isEditMode && isSelected && (
        <div className="absolute top-4 right-4 z-30 flex gap-2">
          {/* Section type badge */}
          <div className="px-3 py-1.5 bg-void/90 border border-dawn-15 font-mono text-2xs uppercase tracking-wider text-gold">
            {section.type}
          </div>
          
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-void/90 border border-dawn-15 font-mono text-2xs uppercase tracking-wider text-dawn-50 hover:text-dawn hover:border-dawn-30 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {/* Drag handle (shown on hover in edit mode) */}
      {isEditMode && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-12 flex flex-col justify-center items-center gap-1 bg-void/90 border border-dawn-15 cursor-grab">
            <div className="w-3 h-0.5 bg-dawn-30" />
            <div className="w-3 h-0.5 bg-dawn-30" />
            <div className="w-3 h-0.5 bg-dawn-30" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

