"use client";

import { AttractorCanvas } from "@/components/canvas/AttractorCanvas";
import { EditableText } from "@/components/editor/EditableText";
import { DEFAULT_SECTION_CONTENT, type QuoteContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";

interface QuoteSectionProps {
  section?: Section;
  hideDefaultBackground?: boolean;
}

const defaultContent = DEFAULT_SECTION_CONTENT.quote as QuoteContent;

export function QuoteSection({ section, hideDefaultBackground }: QuoteSectionProps) {
  const { updateSection, isEditMode } = useEditorStore();

  // Merge section config with defaults
  const content: QuoteContent = {
    ...defaultContent,
    ...(section?.config as Partial<QuoteContent>),
  };

  const updateContent = (updates: Partial<QuoteContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  return (
    <section className="section-spacing-compact relative overflow-hidden">
      {!hideDefaultBackground && <AttractorCanvas />}

      <div className="container-narrow relative z-10 text-center">
        <blockquote className="text-[clamp(1.125rem,2.5vw,1.5rem)] leading-relaxed text-dawn max-w-[700px] mx-auto mb-6 italic">
          <EditableText
            value={content.quote}
            onChange={(quote) => updateContent({ quote })}
            className="text-[clamp(1.125rem,2.5vw,1.5rem)] leading-relaxed text-dawn italic"
            multiline
            as="span"
          />
        </blockquote>
        <cite className="font-mono text-2xs uppercase tracking-widest text-gold not-italic block">
          <EditableText
            value={content.attribution || ""}
            onChange={(attribution) => updateContent({ attribution })}
            className="font-mono text-2xs uppercase tracking-widest text-gold"
            placeholder="— Attribution"
            as="span"
          />
        </cite>
      </div>
    </section>
  );
}
