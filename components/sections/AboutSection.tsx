"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { DEFAULT_SECTION_CONTENT, type AboutContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";

interface AboutSectionProps {
  section?: Section;
}

const defaultContent = DEFAULT_SECTION_CONTENT.about as AboutContent;

export function AboutSection({ section }: AboutSectionProps) {
  const { updateSection } = useEditorStore();

  const content: AboutContent = {
    ...defaultContent,
    ...(section?.config as Partial<AboutContent>),
  };

  const updateContent = (updates: Partial<AboutContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  return (
    <section id="about" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="About" />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16 items-start">
          {/* Portrait */}
          <div className="aspect-[4/5] bg-surface-1 border border-dawn-08 overflow-hidden">
            {content.imageUrl ? (
              <EditableImage
                src={content.imageUrl}
                alt="Portrait"
                onChange={(imageUrl) => updateContent({ imageUrl })}
                width={400}
                height={500}
                className="w-full h-full object-cover"
              />
            ) : (
              <EditableImage
                src={null}
                alt="Portrait"
                onChange={(imageUrl) => updateContent({ imageUrl })}
                width={400}
                height={500}
                fallbackText="Add portrait"
                className="w-full h-full flex items-center justify-center"
              />
            )}
          </div>

          <div>
            <h2 className="font-mono text-[clamp(1.25rem,2.5vw,1.75rem)] tracking-wide uppercase text-dawn mb-2">
              <EditableText
                value={content.title}
                onChange={(title) => updateContent({ title })}
                className="font-mono text-[clamp(1.25rem,2.5vw,1.75rem)] tracking-wide uppercase text-dawn"
              />
            </h2>
            <div className="font-mono text-xs uppercase tracking-wide text-gold mb-8">
              // Voidwalker
            </div>
            <div className="text-base leading-[1.8] text-dawn-70">
              <EditableText
                value={content.bio}
                onChange={(bio) => updateContent({ bio })}
                className="text-base leading-[1.8] text-dawn-70"
                multiline
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
