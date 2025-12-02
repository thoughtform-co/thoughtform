"use client";

import { HeroCanvas } from "@/components/canvas/HeroCanvas";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { EditableButton } from "@/components/editor/EditableButton";
import { DEFAULT_SECTION_CONTENT, type HeroContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";

interface HeroSectionProps {
  section?: Section;
  hideDefaultBackground?: boolean;
}

const defaultContent = DEFAULT_SECTION_CONTENT.hero as HeroContent;

export function HeroSection({ section, hideDefaultBackground }: HeroSectionProps) {
  const { updateSection, isEditMode } = useEditorStore();
  
  // Merge section config with defaults
  const content: HeroContent = {
    ...defaultContent,
    ...(section?.config as Partial<HeroContent>),
  };

  const updateContent = (updates: Partial<HeroContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  // Visibility flags (default to true if undefined)
  const showLogo = content.showLogo !== false;
  const showHeadline = content.showHeadline !== false;
  const showSubheadline = content.showSubheadline !== false;
  const showButtons = content.showButtons !== false;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {!hideDefaultBackground && <HeroCanvas />}

      {/* HUD Elements */}
      <div className="absolute top-[20%] right-[10%] z-10 font-mono text-2xs uppercase tracking-wide text-dawn-30 pointer-events-none">
        <div className="text-gold-40 mb-1">// Vector Space</div>
        <div>Semantic Manifold</div>
      </div>
      <div className="absolute bottom-[25%] right-[15%] z-10 font-mono text-2xs uppercase tracking-wide text-dawn-30 pointer-events-none">
        <div className="text-gold-40 mb-1">// Status</div>
        <div>Navigating...</div>
      </div>

      <div className="container-base relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Logo: SVG Word Mark (default) or custom image */}
            {showLogo && (
              content.logoType === "image" && content.logoImageUrl ? (
                <div className="mb-8">
                  <EditableImage
                    src={content.logoImageUrl}
                    alt={content.logoImageAlt || "Thoughtform Logo"}
                    onChange={(src) => updateContent({ logoImageUrl: src })}
                    width={400}
                    height={120}
                    fallbackText="LOGO"
                  />
                </div>
              ) : (
                <div className="mb-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/logos/Thoughtform_Word Mark.svg" 
                    alt="Thoughtform" 
                    className="h-auto w-full max-w-[500px]"
                  />
                </div>
              )
            )}

            {/* Headline */}
            {showHeadline && (
              <EditableText
                value={content.headline}
                onChange={(headline) => updateContent({ headline })}
                className="text-lg text-dawn-70 leading-relaxed mb-2 max-w-[420px]"
                as="p"
                multiline
              />
            )}

            {/* Subheadline */}
            {showSubheadline && (
              <EditableText
                value={content.subheadline}
                onChange={(subheadline) => updateContent({ subheadline })}
                className="text-base text-dawn-50 leading-relaxed mb-10 max-w-[420px]"
                as="p"
                multiline
              />
            )}

            {/* Buttons */}
            {showButtons && (
              <div className="flex gap-3 flex-wrap">
                <EditableButton
                  config={content.secondaryButton}
                  onChange={(secondaryButton) => updateContent({ secondaryButton })}
                />
                <EditableButton
                  config={content.primaryButton}
                  onChange={(primaryButton) => updateContent({ primaryButton })}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-dawn-30 font-mono text-2xs uppercase tracking-widest animate-float z-10">
        <span>Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-dawn-30 to-transparent" />
      </div>
    </section>
  );
}
