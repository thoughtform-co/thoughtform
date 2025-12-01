"use client";

import { WaveCanvas } from "@/components/canvas/WaveCanvas";
import { EditableText } from "@/components/editor/EditableText";
import { DEFAULT_SECTION_CONTENT, type TaglineContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";

interface TaglineSectionProps {
  section?: Section;
  hideDefaultBackground?: boolean;
}

const defaultContent = DEFAULT_SECTION_CONTENT.tagline as TaglineContent;

export function TaglineSection({ section, hideDefaultBackground }: TaglineSectionProps) {
  const { updateSection } = useEditorStore();

  // Merge section config with defaults
  const content: TaglineContent = {
    ...defaultContent,
    ...(section?.config as Partial<TaglineContent>),
  };

  const updateContent = (updates: Partial<TaglineContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  return (
    <section className="section-spacing-compact relative overflow-hidden">
      {!hideDefaultBackground && <WaveCanvas />}

      <div className="container-narrow relative z-10 text-center">
        <div className="font-mono text-[clamp(1rem,2vw,1.25rem)] tracking-[0.15em] uppercase text-gold">
          <EditableText
            value={content.tagline}
            onChange={(tagline) => updateContent({ tagline })}
            className="font-mono text-[clamp(1rem,2vw,1.25rem)] tracking-[0.15em] uppercase text-gold"
            as="span"
          />
        </div>
        {content.subtext && (
          <div className="mt-4 text-dawn-50 text-sm">
            <EditableText
              value={content.subtext}
              onChange={(subtext) => updateContent({ subtext })}
              className="text-dawn-50 text-sm"
              as="span"
            />
          </div>
        )}
      </div>
    </section>
  );
}
