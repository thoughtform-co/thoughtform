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

// Map canvas presets to components
const CANVAS_COMPONENTS: Record<string, React.ComponentType> = {
  torus: HeroCanvas,
  attractor: AttractorCanvas,
  wave: WaveCanvas,
};

export function SectionWrapper({ section }: SectionWrapperProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isEditMode = useIsEditMode();
  const { selectedSectionId, setSelectedSection, removeSection } = useEditorStore();
  
  const isSelected = selectedSectionId === section.id;
  
  // Check if section has a custom background
  const hasCustomBackground = section.background && section.background.type !== "none";

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
        <ThreeBackground 
          preset={threejsPreset} 
          opacity={threejsOpacity} 
          customCode={section.background?.customCode}
        />
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

  // Render the appropriate section component
  const renderSection = () => {
    switch (section.type) {
      case "hero":
        return <HeroSection hideDefaultBackground={hasCustomBackground} />;
      case "problem":
        return <ProblemSection />;
      case "quote":
        return <QuoteSection hideDefaultBackground={hasCustomBackground} />;
      case "shift":
        return <ShiftSection />;
      case "proof":
        return <ProofSection />;
      case "tagline":
        return <TaglineSection hideDefaultBackground={hasCustomBackground} />;
      case "services":
        return <ServicesSection />;
      case "about":
        return <AboutSection />;
      case "musings":
        return <MusingsSection />;
      case "cta":
        return <CTASection />;
      case "freeform":
        return <FreeformSection section={section} />;
      default:
        return (
          <div className="section-spacing bg-surface-1 text-center">
            <p className="text-dawn-50">Unknown section type: {section.type}</p>
          </div>
        );
    }
  };

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
        {renderSection()}
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
        <div className="absolute top-4 left-4 z-30 flex gap-2">
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
    </motion.div>
  );
}
