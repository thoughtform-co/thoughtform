"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore, useIsEditMode } from "@/store/editor-store";
import type { Section, AnimationPreset } from "@/lib/types";

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
import { DraggableElement } from "@/components/editor/DraggableElement";

import dynamic from "next/dynamic";

// 2D Canvas background components
import { HeroCanvas } from "@/components/canvas/HeroCanvas";
import { AttractorCanvas } from "@/components/canvas/AttractorCanvas";
import { WaveCanvas } from "@/components/canvas/WaveCanvas";
import { GatewayCanvas } from "@/components/canvas/GatewayCanvas";
import { GatewayCardinalCanvas } from "@/components/canvas/GatewayCardinalCanvas";

// Dynamic import for Three.js to avoid SSR issues
const ThreeBackground = dynamic(
  () => import("@/components/canvas/ThreeBackground").then((mod) => mod.ThreeBackground),
  { ssr: false }
);

interface SectionWrapperProps {
  section: Section;
}

// Map 2D canvas presets to components
const CANVAS_COMPONENTS: Record<string, React.ComponentType> = {
  "gateway-cardinal": GatewayCardinalCanvas,
  gateway: GatewayCanvas,
  torus: HeroCanvas,
  attractor: AttractorCanvas,
  wave: WaveCanvas,
};

// Three.js presets (handled by ThreeBackground component)
const THREEJS_PRESETS = new Set([
  "starfield",
  "particles",
  "geometric",
  "nebula",
  "grid",
  "spiral",
  "vortex",
  "custom",
]);

export function SectionWrapper({ section }: SectionWrapperProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isEditMode = useIsEditMode();
  const { selectedSectionId, setSelectedSection, removeSection } = useEditorStore();

  const isSelected = selectedSectionId === section.id;

  // Check if section has a custom background
  const hasCustomBackground = !!(section.background && section.background.type !== "none");

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
      imageUrl,
      imageOpacity = 0.5,
      videoUrl,
      videoOpacity = 1,
      videoMuted = true,
      videoLoop = true,
      animationPreset,
      animationOpacity = 0.5,
    } = section.background;

    // Image background
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

    // Video background
    if (type === "video" && videoUrl) {
      return (
        <div className="absolute inset-0 z-0 overflow-hidden" style={{ opacity: videoOpacity }}>
          <video
            src={videoUrl}
            autoPlay
            muted={videoMuted}
            loop={videoLoop}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      );
    }

    // Animation background (unified 2D canvas + 3D Three.js)
    if (type === "animation" && animationPreset) {
      // Check if it's a 2D canvas preset
      if (CANVAS_COMPONENTS[animationPreset]) {
        const CanvasComponent = CANVAS_COMPONENTS[animationPreset];
        return (
          <div className="absolute inset-0 z-0" style={{ opacity: animationOpacity }}>
            <CanvasComponent />
          </div>
        );
      }

      // Check if it's a Three.js preset
      if (THREEJS_PRESETS.has(animationPreset)) {
        return (
          <ThreeBackground
            preset={animationPreset as any}
            opacity={animationOpacity}
            customCode={section.background?.customCode}
          />
        );
      }
    }

    return null;
  };

  // Render the appropriate section component
  // ALL sections receive the section prop for consistent editability
  const renderSection = () => {
    switch (section.type) {
      case "hero":
        return <HeroSection section={section} hideDefaultBackground={hasCustomBackground} />;
      case "problem":
        return <ProblemSection section={section} />;
      case "quote":
        return <QuoteSection section={section} hideDefaultBackground={hasCustomBackground} />;
      case "shift":
        return <ShiftSection section={section} />;
      case "proof":
        return <ProofSection section={section} />;
      case "tagline":
        return <TaglineSection section={section} hideDefaultBackground={hasCustomBackground} />;
      case "services":
        return <ServicesSection section={section} />;
      case "about":
        return <AboutSection section={section} />;
      case "musings":
        return <MusingsSection section={section} />;
      case "cta":
        return <CTASection section={section} />;
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

  // Check if this section has custom elements (for non-freeform sections)
  const hasElements =
    section.elements && section.elements.length > 0 && section.type !== "freeform";

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
      <div className="relative z-10">{renderSection()}</div>

      {/* Edit mode hover overlay (lowest z-index, just for visual feedback) */}
      {isEditMode && !isSelected && (
        <div className="absolute inset-0 z-15 pointer-events-none transition-colors hover:bg-dawn-04" />
      )}

      {/* Custom elements layer - render in edit mode when selected OR if has elements */}
      {section.type !== "freeform" &&
        (isSelected || (section.elements && section.elements.length > 0)) && (
          <div
            className={cn(
              "absolute inset-0 z-25",
              isEditMode && isSelected && "pointer-events-auto"
            )}
            onClick={(e) => {
              // Only stop propagation if clicking on the elements layer background
              if (e.target === e.currentTarget && isEditMode) {
                e.stopPropagation();
              }
            }}
          >
            {section.elements?.map((element) => (
              <DraggableElement key={element.id} element={element} />
            ))}
          </div>
        )}

      {/* Edit mode controls */}
      {isEditMode && isSelected && (
        <div className="absolute top-4 left-4 z-40 flex gap-2">
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
